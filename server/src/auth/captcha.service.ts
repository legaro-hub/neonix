import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

interface CaptchaEntry {
  answer: number;
  createdAt: number;
}

const CAPTCHAS = new Map<string, CaptchaEntry>();
const CAPTCHA_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  generate(): { id: string; question: string } {
    this.cleanup();

    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 20;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        answer = a * b;
        break;
      default:
        a = 1; b = 1; answer = 2;
    }

    const id = randomBytes(16).toString('hex');
    CAPTCHAS.set(id, { answer, createdAt: Date.now() });

    return { id, question: `${a} ${op} ${b} = ?` };
  }

  verify(id: string, answer: number): boolean {
    const entry = CAPTCHAS.get(id);
    if (!entry) return false;
    if (Date.now() - entry.createdAt > CAPTCHA_TTL_MS) {
      CAPTCHAS.delete(id);
      return false;
    }
    CAPTCHAS.delete(id);
    return entry.answer === answer;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, val] of CAPTCHAS) {
      if (now - val.createdAt > CAPTCHA_TTL_MS) CAPTCHAS.delete(key);
    }
  }
}
