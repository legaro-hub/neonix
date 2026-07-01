import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PlanLimits {
  maxAccountsPerPlatform: number;
  maxPostsPerMonth: number;
  maxBulkPosts: number;
  analytics: boolean;
  priority: boolean;
}

const PLANS: Record<string, PlanLimits> = {
  free: {
    maxAccountsPerPlatform: 3,
    maxPostsPerMonth: 30,
    maxBulkPosts: 5,
    analytics: false,
    priority: false,
  },
  pro: {
    maxAccountsPerPlatform: 15,
    maxPostsPerMonth: 500,
    maxBulkPosts: 50,
    analytics: true,
    priority: true,
  },
};

@Injectable()
export class PromoService {
  private readonly logger = new Logger(PromoService.name);

  constructor(private readonly prisma: PrismaService) {}

  getPlanLimits(plan: string): PlanLimits {
    return PLANS[plan] ?? PLANS.free;
  }

  async applyPromoCode(userId: string, code: string) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      throw new BadRequestException('Промокод не найден');
    }

    if (!promo.isActive) {
      throw new BadRequestException('Промокод деактивирован');
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Промокод истёк');
    }

    if (promo.maxUses && promo.currentUses >= promo.maxUses) {
      throw new BadRequestException('Промокод исчерпан');
    }

    const existingUsage = await this.prisma.promoCodeUsage.findUnique({
      where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
    });

    if (existingUsage) {
      throw new BadRequestException('Вы уже использовали этот промокод');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const now = new Date();
    const currentExpiry = user.planExpiresAt && user.planExpiresAt > now
      ? user.planExpiresAt
      : now;
    const newExpiry = new Date(currentExpiry.getTime() + promo.daysCount * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { plan: promo.plan, planExpiresAt: newExpiry },
      }),
      this.prisma.promoCode.update({
        where: { id: promo.id },
        data: { currentUses: { increment: 1 } },
      }),
      this.prisma.promoCodeUsage.create({
        data: { promoCodeId: promo.id, userId },
      }),
    ]);

    this.logger.log(`Promo code "${code}" applied for user ${userId}: +${promo.daysCount} days ${promo.plan}`);

    return {
      success: true,
      plan: promo.plan,
      expiresAt: newExpiry.toISOString(),
      daysAdded: promo.daysCount,
      description: promo.description,
    };
  }

  async getUserPlan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, planExpiresAt: true },
    });
    if (!user) return { plan: 'free', limits: PLANS.free, expiresAt: null };

    const now = new Date();
    const isExpired = user.planExpiresAt && user.planExpiresAt < now;
    const activePlan = isExpired ? 'free' : user.plan;

    return {
      plan: activePlan,
      limits: this.getPlanLimits(activePlan),
      expiresAt: user.planExpiresAt?.toISOString() ?? null,
      isTrial: user.plan === 'pro' && !!user.planExpiresAt,
    };
  }

  async checkAccountLimit(userId: string, platform: string): Promise<{ allowed: boolean; current: number; max: number }> {
    const planInfo = await this.getUserPlan(userId);
    const current = await this.prisma.socialAccount.count({
      where: { userId, platform, status: 'active' },
    });
    const max = planInfo.limits.maxAccountsPerPlatform;

    return { allowed: current < max, current, max };
  }

  async listActivePromos() {
    return this.prisma.promoCode.findMany({
      where: { isActive: true },
      select: {
        code: true,
        description: true,
        plan: true,
        daysCount: true,
        expiresAt: true,
      },
      orderBy: { daysCount: 'desc' },
    });
  }
}
