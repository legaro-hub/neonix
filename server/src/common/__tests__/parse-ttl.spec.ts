import { parseTtlSeconds } from '../parse-ttl';

describe('parseTtlSeconds', () => {
  it('should parse seconds', () => {
    expect(parseTtlSeconds('30s')).toBe(30);
  });

  it('should parse minutes', () => {
    expect(parseTtlSeconds('15m')).toBe(900);
  });

  it('should parse hours', () => {
    expect(parseTtlSeconds('2h')).toBe(7200);
  });

  it('should parse days', () => {
    expect(parseTtlSeconds('7d')).toBe(604800);
  });

  it('should return default for invalid input', () => {
    expect(parseTtlSeconds('invalid')).toBe(900);
    expect(parseTtlSeconds('')).toBe(900);
    expect(parseTtlSeconds('abc')).toBe(900);
  });

  it('should use custom default', () => {
    expect(parseTtlSeconds('invalid', 3600)).toBe(3600);
  });

  it('should handle whitespace', () => {
    expect(parseTtlSeconds(' 15m ')).toBe(900);
  });
});
