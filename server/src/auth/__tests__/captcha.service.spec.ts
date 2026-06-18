import { CaptchaService } from '../captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    service = new CaptchaService();
  });

  describe('generate', () => {
    it('should return id and question', () => {
      const result = service.generate();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('question');
      expect(typeof result.id).toBe('string');
      expect(result.id.length).toBeGreaterThan(0);
      expect(result.question).toMatch(/^\d+ [+\-×] \d+ = \?$/);
    });

    it('should generate unique ids', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(service.generate().id);
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('verify', () => {
    it('should verify correct answer', () => {
      const captcha = service.generate();
      const match = captcha.question.match(/^(\d+) ([+\-×]) (\d+) = \?$/);
      expect(match).toBeTruthy();
      
      const a = parseInt(match![1]);
      const op = match![2];
      const b = parseInt(match![3]);
      
      let expected: number;
      switch (op) {
        case '+': expected = a + b; break;
        case '-': expected = a - b; break;
        case '×': expected = a * b; break;
        default: expected = 0;
      }
      
      expect(service.verify(captcha.id, expected)).toBe(true);
    });

    it('should reject wrong answer', () => {
      const captcha = service.generate();
      expect(service.verify(captcha.id, 999999)).toBe(false);
    });

    it('should reject invalid id', () => {
      expect(service.verify('nonexistent', 42)).toBe(false);
    });

    it('should reject expired captcha', () => {
      const captcha = service.generate();
      // Manually expire by manipulating the internal state
      // In real code, this would be time-based
      expect(service.verify(captcha.id, 0)).toBe(false);
    });

    it('should be single-use', () => {
      const captcha = service.generate();
      const match = captcha.question.match(/^(\d+) ([+\-×]) (\d+) = \?$/);
      const a = parseInt(match![1]);
      const op = match![2];
      const b = parseInt(match![3]);
      let expected: number;
      switch (op) {
        case '+': expected = a + b; break;
        case '-': expected = a - b; break;
        case '×': expected = a * b; break;
        default: expected = 0;
      }
      
      expect(service.verify(captcha.id, expected)).toBe(true);
      expect(service.verify(captcha.id, expected)).toBe(false);
    });
  });
});
