import { PostsService } from '../posts.service';

const mockPrisma = {
  post: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  socialAccount: {
    findMany: jest.fn(),
  },
  postPublication: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PostsService(mockPrisma as any);
  });

  const userId = 'user-1';
  const postId = 'post-1';

  describe('list', () => {
    it('should return posts for user', async () => {
      const posts = [{ id: postId, body: 'Hello' }];
      mockPrisma.post.findMany.mockResolvedValue(posts);

      const result = await service.list(userId);

      expect(result).toEqual(posts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.list(userId, '2026-06-01', '2026-06-30');

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: {
              gte: new Date('2026-06-01'),
              lte: new Date('2026-06-30'),
            },
          }),
        }),
      );
    });

    it('should filter by socialAccountId', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.list(userId, undefined, undefined, 'sa-1');

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            publications: { some: { socialAccountId: 'sa-1' } },
          }),
        }),
      );
    });
  });

  describe('getOne', () => {
    it('should return a post by id and userId', async () => {
      const post = { id: postId, userId, body: 'Hello' };
      mockPrisma.post.findFirst.mockResolvedValue(post);

      const result = await service.getOne(userId, postId);

      expect(result).toEqual(post);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(service.getOne(userId, postId)).rejects.toThrow('Пост не найден');
    });

    it('should not return posts belonging to other users', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(service.getOne('other-user', postId)).rejects.toThrow('Пост не найден');
    });
  });

  describe('create', () => {
    it('should create a post with body only', async () => {
      const created = { id: postId, body: 'New post', publications: [] };
      mockPrisma.post.create.mockResolvedValue(created);

      const result = await service.create(userId, {
        body: 'New post',
        socialAccountIds: [],
      });

      expect(result).toEqual(created);
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            body: 'New post',
            status: 'draft',
          }),
        }),
      );
    });

    it('should create a scheduled post with publications', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([
        { id: 'sa-1' },
        { id: 'sa-2' },
      ]);
      const created = { id: postId, body: 'Scheduled', publications: [] };
      mockPrisma.post.create.mockResolvedValue(created);

      const result = await service.create(userId, {
        body: 'Scheduled',
        scheduledAt: '2026-06-20T10:00:00Z',
        socialAccountIds: ['sa-1', 'sa-2'],
      });

      expect(result).toEqual(created);
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'scheduled',
            scheduledAt: new Date('2026-06-20T10:00:00Z'),
          }),
        }),
      );
    });

    it('should throw BadRequestException if scheduled post has empty body and no channels', async () => {
      await expect(
        service.create(userId, { body: '  ', socialAccountIds: [], scheduledAt: '2026-06-20T10:00:00Z' }),
      ).rejects.toThrow('Текст или хотя бы один канал обязательны');
    });

    it('should allow draft with empty body for media upload', async () => {
      mockPrisma.post.create.mockResolvedValue({ id: postId, body: ' ', publications: [] });

      const result = await service.create(userId, { body: ' ', socialAccountIds: [] });

      expect(result).toHaveProperty('id', postId);
    });

    it('should throw BadRequestException if channels not owned by user', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([{ id: 'sa-1' }]);

      await expect(
        service.create(userId, {
          body: 'Test',
          socialAccountIds: ['sa-1', 'sa-2'],
        }),
      ).rejects.toThrow('Один или несколько каналов не принадлежат вам');
    });
  });

  describe('update', () => {
    it('should update post fields', async () => {
      mockPrisma.post.findFirst.mockResolvedValue({ id: postId, userId });
      const updated = { id: postId, body: 'Updated' };
      mockPrisma.post.update.mockResolvedValue(updated);

      const result = await service.update(userId, postId, { body: 'Updated' });

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, postId, { body: 'Updated' }),
      ).rejects.toThrow('Пост не найден');
    });

    it('should update socialAccountIds with transaction', async () => {
      mockPrisma.post.findFirst.mockResolvedValue({ id: postId, userId });
      mockPrisma.socialAccount.findMany.mockResolvedValue([{ id: 'sa-1' }]);
      mockPrisma.postPublication.findMany.mockResolvedValue([]);
      mockPrisma.postPublication.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.postPublication.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.post.update.mockResolvedValue({ id: postId });

      await service.update(userId, postId, {
        socialAccountIds: ['sa-1'],
        scheduledAt: '2026-06-20T10:00:00Z',
      });

      expect(mockPrisma.postPublication.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.postPublication.createMany).toHaveBeenCalled();
      expect(mockPrisma.post.update).toHaveBeenCalled();
    });

    it('should throw if updated channels not owned', async () => {
      mockPrisma.post.findFirst.mockResolvedValue({ id: postId, userId });
      mockPrisma.socialAccount.findMany.mockResolvedValue([]);

      await expect(
        service.update(userId, postId, { socialAccountIds: ['sa-99'] }),
      ).rejects.toThrow('Один или несколько каналов не принадлежат вам');
    });
  });

  describe('delete', () => {
    it('should delete a post', async () => {
      mockPrisma.post.findFirst.mockResolvedValue({ id: postId, userId });
      mockPrisma.post.delete.mockResolvedValue({});

      const result = await service.delete(userId, postId);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.post.delete).toHaveBeenCalledWith({ where: { id: postId } });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(service.delete(userId, postId)).rejects.toThrow('Пост не найден');
    });

    it('should not allow deleting other users posts', async () => {
      mockPrisma.post.findFirst.mockResolvedValue(null);

      await expect(service.delete('other-user', postId)).rejects.toThrow('Пост не найден');
    });
  });

  describe('getCalendar', () => {
    it('should return posts for a given month', async () => {
      const posts = [{ id: postId, scheduledAt: new Date('2026-06-15') }];
      mockPrisma.post.findMany.mockResolvedValue(posts);

      const result = await service.getCalendar(userId, '2026-06');

      expect(result).toEqual(posts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            scheduledAt: {
              gte: new Date('2026-06-01'),
              lt: new Date('2026-07-01'),
            },
          }),
        }),
      );
    });
  });

  describe('createBulk', () => {
    it('should create multiple posts and map channel titles', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([
        { id: 'sa-1', title: 'My Channel' },
      ]);
      mockPrisma.socialAccount.findMany
        .mockResolvedValueOnce([{ id: 'sa-1', title: 'My Channel' }])
        .mockResolvedValueOnce([{ id: 'sa-1' }]);
      mockPrisma.post.create.mockResolvedValue({ id: 'post-1' });

      const result = await service.createBulk(userId, [
        {
          title: 'Test',
          body: 'Body',
          scheduledAt: '2026-06-20T10:00:00Z',
          channelTitles: ['My Channel'],
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('success', true);
    });

    it('should return error for unmatched channel titles', async () => {
      mockPrisma.socialAccount.findMany.mockResolvedValue([]);

      const result = await service.createBulk(userId, [
        {
          body: 'Body',
          scheduledAt: '2026-06-20T10:00:00Z',
          channelTitles: ['Nonexistent Channel'],
        },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('error');
    });
  });
});
