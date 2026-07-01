import { SocialAccountsService } from '../social-accounts.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  socialAccount: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

let service: SocialAccountsService;
let testCounter = 0;

beforeEach(() => {
  jest.resetModules();
  testCounter++;
  const mod = require('../social-accounts.service');
  const MockPrisma = jest.fn().mockImplementation(() => mockPrisma);
  Object.assign(mockPrisma, {
    user: { findUnique: jest.fn() },
    socialAccount: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  });
  service = new mod.SocialAccountsService(mockPrisma as any, {
    checkAccountLimit: jest.fn().mockResolvedValue({ allowed: true, current: 0, max: 5 }),
  } as any);
  process.env.TG_BOT_NAME = 'test_bot';
});

describe('SocialAccountsService', () => {
  const userId = 'user-1';
  const channelId = 'ch-1';

  describe('generateLinkCode', () => {
    it('should generate a link code with bot name', async () => {
      const result = await service.generateLinkCode(userId);

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('botName', 'test_bot');
      expect(result).toHaveProperty('expiresAt');
      expect(typeof result.code).toBe('string');
      expect(result.code.length).toBeGreaterThan(0);
    });

    it('should generate unique codes', async () => {
      const codes = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const result = await service.generateLinkCode(`unique-user-${i}`);
        codes.add(result.code);
      }
      expect(codes.size).toBe(20);
    });

    it('should throw if too many active codes', async () => {
      for (let i = 0; i < 5; i++) {
        await service.generateLinkCode(userId);
      }

      await expect(service.generateLinkCode(userId)).rejects.toThrow(
        'Слишком много активных кодов',
      );
    });
  });

  describe('validateLinkCode', () => {
    it('should validate a correct code and return userId', async () => {
      const { code } = await service.generateLinkCode(userId);

      const result = await service.validateLinkCode(code);

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(userId);
    });

    it('should return null for invalid code', async () => {
      const result = await service.validateLinkCode('NONEXISTENT');
      expect(result).toBeNull();
    });

    it('should be single-use', async () => {
      const { code } = await service.generateLinkCode(userId);

      await service.validateLinkCode(code);
      const second = await service.validateLinkCode(code);

      expect(second).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const { code } = await service.generateLinkCode(userId);

      const result = await service.validateLinkCode(code.toLowerCase());

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(userId);
    });
  });

  describe('addChannel', () => {
    it('should create a new channel', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'user' });
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.socialAccount.count.mockResolvedValue(0);
      mockPrisma.socialAccount.create.mockResolvedValue({
        id: channelId,
        title: 'Test Channel',
      });

      const result = await service.addChannel(userId, {
        externalId: '123456',
        title: 'Test Channel',
        username: 'test_ch',
      });

      expect(result).toHaveProperty('id', channelId);
      expect(mockPrisma.socialAccount.create).toHaveBeenCalled();
    });

    it('should re-activate existing channel owned by same user', async () => {
      const existing = {
        id: channelId,
        userId,
        externalId: '123456',
        title: 'Old Title',
        status: 'revoked',
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'user' });
      mockPrisma.socialAccount.findFirst.mockResolvedValue(existing);
      mockPrisma.socialAccount.update.mockResolvedValue({ ...existing, title: 'New Title' });

      const result = await service.addChannel(userId, {
        externalId: '123456',
        title: 'New Title',
      });

      expect(mockPrisma.socialAccount.update).toHaveBeenCalled();
    });

    it('should throw if channel belongs to another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'user' });
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: channelId,
        userId: 'other-user',
        externalId: '123456',
      });

      await expect(
        service.addChannel(userId, {
          externalId: '123456',
          title: 'Test',
        }),
      ).rejects.toThrow('Этот канал уже привязан к другому аккаунту');
    });

    it('should enforce channel limit for regular users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'user', email: 'test@test.com' });
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.socialAccount.count.mockResolvedValue(5);
      (service as any).promoService = { checkAccountLimit: jest.fn().mockResolvedValue({ allowed: false, current: 3, max: 3 }) };

      await expect(
        service.addChannel(userId, {
          externalId: '999',
          title: 'Extra Channel',
        }),
      ).rejects.toThrow('Достигнут лимит');
    });

    it('should not enforce limit for admins', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, role: 'admin' });
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);
      mockPrisma.socialAccount.count.mockResolvedValue(5);
      mockPrisma.socialAccount.create.mockResolvedValue({ id: channelId });

      const result = await service.addChannel(userId, {
        externalId: '999',
        title: 'Admin Channel',
      });

      expect(result).toHaveProperty('id', channelId);
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addChannel('nonexistent', {
          externalId: '123',
          title: 'Test',
        }),
      ).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('listChannels', () => {
    it('should return channels for user', async () => {
      const channels = [{ id: channelId, title: 'Channel 1' }];
      mockPrisma.socialAccount.findMany.mockResolvedValue(channels);

      const result = await service.listChannels(userId);

      expect(result).toEqual(channels);
      expect(mockPrisma.socialAccount.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { linkedAt: 'desc' },
      });
    });
  });

  describe('getChannel', () => {
    it('should return a channel by id', async () => {
      const channel = { id: channelId, userId, title: 'My Channel' };
      mockPrisma.socialAccount.findFirst.mockResolvedValue(channel);

      const result = await service.getChannel(userId, channelId);

      expect(result).toEqual(channel);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(service.getChannel(userId, channelId)).rejects.toThrow(
        'Канал не найден',
      );
    });
  });

  describe('updateChannel', () => {
    it('should update channel title and username', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: channelId,
        userId,
      });
      mockPrisma.socialAccount.update.mockResolvedValue({
        id: channelId,
        title: 'Updated',
      });

      const result = await service.updateChannel(userId, channelId, {
        title: 'Updated',
        username: 'updated_ch',
      });

      expect(result).toHaveProperty('title', 'Updated');
    });

    it('should throw if channel not found', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.updateChannel(userId, channelId, { title: 'X' }),
      ).rejects.toThrow('Канал не найден');
    });
  });

  describe('removeChannel', () => {
    it('should revoke a channel', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue({
        id: channelId,
        userId,
      });
      mockPrisma.socialAccount.update.mockResolvedValue({
        id: channelId,
        status: 'revoked',
      });

      await service.removeChannel(userId, channelId);

      expect(mockPrisma.socialAccount.update).toHaveBeenCalledWith({
        where: { id: channelId },
        data: { status: 'revoked' },
      });
    });

    it('should throw if channel not found', async () => {
      mockPrisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(service.removeChannel(userId, channelId)).rejects.toThrow(
        'Канал не найден',
      );
    });
  });

  describe('storePendingLink', () => {
    it('should store pending link by chatId', async () => {
      await service.storePendingLink(userId, 123456);

      const result = await service.findPendingLinkByChatId(123456);
      expect(result).not.toBeNull();
      expect(result!.userId).toBe(userId);
    });

    it('should store pending link by telegramUserId', async () => {
      await service.storePendingLink(userId, 123456, 789);

      const byTg = await service.findPendingLinkByTelegramUserId(789);
      expect(byTg).not.toBeNull();
      expect(byTg!.userId).toBe(userId);

      const byChat = await service.findPendingLinkByChatId(123456);
      expect(byChat).not.toBeNull();
    });
  });

  describe('clearPendingLink', () => {
    it('should remove pending link', async () => {
      await service.storePendingLink(userId, 123456);
      await service.clearPendingLink(123456);

      const result = await service.findPendingLinkByChatId(123456);
      expect(result).toBeNull();
    });
  });

  describe('revokeByExternalId', () => {
    it('should revoke accounts by external id', async () => {
      mockPrisma.socialAccount.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeByExternalId('123456');

      expect(mockPrisma.socialAccount.updateMany).toHaveBeenCalledWith({
        where: { externalId: '123456', platform: 'telegram' },
        data: { status: 'revoked' },
      });
    });
  });
});
