import { EmailService } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    const mockConfig = {
      get: (key: string) => {
        const config: Record<string, string> = {
          SMTP_HOST: '',
          EMAIL_FROM: 'Neonix <test@neonix.online>',
          APP_URL: 'https://neonix.online',
        };
        return config[key];
      },
    } as any;
    service = new EmailService(mockConfig);
  });

  describe('sendWelcome', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(service.sendWelcome('test@example.com', 'Test')).resolves.toBeUndefined();
    });
  });

  describe('sendPasswordReset', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(
        service.sendPasswordReset('test@example.com', 'Test', 'http://reset.com')
      ).resolves.toBeUndefined();
    });
  });

  describe('sendPublicationSuccess', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(
        service.sendPublicationSuccess('test@example.com', 'Test', 'My Post', 'My Channel', 'http://post.com')
      ).resolves.toBeUndefined();
    });
  });

  describe('sendPublicationFailed', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(
        service.sendPublicationFailed('test@example.com', 'Test', 'My Post', 'My Channel', 'Error')
      ).resolves.toBeUndefined();
    });
  });

  describe('sendDigest', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(
        service.sendDigest('test@example.com', 'Test', { published: 5, failed: 1, scheduled: 3, channels: 2 })
      ).resolves.toBeUndefined();
    });
  });

  describe('sendInvoice', () => {
    it('should not throw when SMTP not configured', async () => {
      await expect(
        service.sendInvoice('test@example.com', 'Test', '990 ₽', 'Июнь 2026', 'Pro')
      ).resolves.toBeUndefined();
    });
  });
});
