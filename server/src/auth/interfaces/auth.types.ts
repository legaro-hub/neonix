export interface JwtPayload {
  sub: string;   // user id
  email: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    timezone: string;
  };
  accessToken: string;
  /** refresh токен: НЕ отдаётся клиенту в теле, ставится только в httpOnly cookie */
  refreshToken: string;
  expiresIn: number; // секунды до истечения access
}
