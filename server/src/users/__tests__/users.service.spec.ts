import { UsersService } from '../users.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  notificationSettings: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
  refreshToken: {
    updateMany: jest.fn(),
  },
};

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(mockPrisma as any);
  });

  const userId = 'user-1';

  describe('getMe', () => {
    it('should return user profile with channels count', async () => {
      const user = {
        id: userId,
        email: 'test@test.com',
        name: 'Test',
        timezone: 'Europe/Moscow',
        language: 'ru',
        createdAt: new Date(),
        socialAccounts: [{ id: '1' }, { id: '2' }],
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);

      const result = await service.getMe(userId);

      expect(result).toHaveProperty('channelsCount', 2);
      expect(result).toHaveProperty('id', userId);
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(userId)).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('updateMe', () => {
    it('should update profile fields', async () => {
      const updated = {
        id: userId,
        email: 'new@test.com',
        name: 'Updated',
        timezone: 'UTC',
        language: 'en',
        createdAt: new Date(),
        socialAccounts: [],
      };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(updated);

      const result = await service.updateMe(userId, {
        name: 'Updated',
        email: 'new@test.com',
        timezone: 'UTC',
        language: 'en',
      });

      expect(result).toHaveProperty('name', 'Updated');
      expect(result).toHaveProperty('email', 'new@test.com');
    });

    it('should lowercase email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'test@test.com',
        name: null,
        timezone: 'Europe/Moscow',
        language: 'ru',
        createdAt: new Date(),
        socialAccounts: [],
      });

      await service.updateMe(userId, { email: 'TEST@TEST.COM' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'test@test.com' }),
        }),
      );
    });

    it('should throw if email already taken by another user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'other-user',
        email: 'taken@test.com',
      });

      await expect(
        service.updateMe(userId, { email: 'taken@test.com' }),
      ).rejects.toThrow('Этот email уже занят');
    });

    it('should allow keeping own email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'my@test.com',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: userId,
        email: 'my@test.com',
        name: 'X',
        timezone: 'Europe/Moscow',
        language: 'ru',
        createdAt: new Date(),
        socialAccounts: [],
      });

      const result = await service.updateMe(userId, { email: 'my@test.com' });

      expect(result).toHaveProperty('email', 'my@test.com');
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: 'old-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.changePassword(userId, {
        currentPassword: 'old-pass',
        newPassword: 'new-pass-123',
      });

      expect(result).toEqual({ success: true });
      expect(bcrypt.hash).toHaveBeenCalledWith('new-pass-123', 12);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    });

    it('should throw if current password is wrong', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        passwordHash: 'hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, {
          currentPassword: 'wrong',
          newPassword: 'new-pass',
        }),
      ).rejects.toThrow('Неверный текущий пароль');
    });

    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow('Пользователь не найден');
    });
  });

  describe('deleteMe', () => {
    it('should delete user', async () => {
      mockPrisma.user.delete.mockResolvedValue({});

      const result = await service.deleteMe(userId);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
    });
  });

  describe('getNotifications', () => {
    it('should return existing notification settings', async () => {
      const settings = { userId, emailOnPublish: true, emailOnFailure: false };
      mockPrisma.notificationSettings.findUnique.mockResolvedValue(settings);

      const result = await service.getNotifications(userId);

      expect(result).toEqual(settings);
    });

    it('should create default settings if not exists', async () => {
      mockPrisma.notificationSettings.findUnique.mockResolvedValue(null);
      const created = { userId, emailOnPublish: true, emailOnFailure: true };
      mockPrisma.notificationSettings.create.mockResolvedValue(created);

      const result = await service.getNotifications(userId);

      expect(result).toEqual(created);
      expect(mockPrisma.notificationSettings.create).toHaveBeenCalledWith({
        data: { userId },
      });
    });
  });

  describe('updateNotifications', () => {
    it('should upsert notification settings', async () => {
      const updated = {
        userId,
        emailOnPublish: false,
        emailOnFailure: true,
        emailOnBilling: true,
        inAppOnPublish: true,
        inAppOnFailure: true,
        digestEnabled: false,
        digestDay: 'mon',
        digestHour: 10,
      };
      mockPrisma.notificationSettings.upsert.mockResolvedValue(updated);

      const result = await service.updateNotifications(userId, {
        emailOnPublish: false,
      });

      expect(result).toEqual(updated);
      expect(mockPrisma.notificationSettings.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: expect.objectContaining({ userId, emailOnPublish: false }),
        update: expect.objectContaining({ emailOnPublish: false }),
      });
    });

    it('should skip undefined values', async () => {
      mockPrisma.notificationSettings.upsert.mockResolvedValue({ userId });

      await service.updateNotifications(userId, {});

      expect(mockPrisma.notificationSettings.upsert).toHaveBeenCalledWith({
        where: { userId },
        create: { userId },
        update: {},
      });
    });
  });
});
