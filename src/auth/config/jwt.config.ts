import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  return {
    secret: process.env.JWT_SECRET,
    audience: process.env.JWT_TOKEN_AUDIENCE,
    issuer: process.env.JWT_TOKEN_ISSUER,

    // ✅ Use consistent naming for TTLs
    accessTokenTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10), // seconds or ms depending on how you use it
    refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),

    // ✅ expiresIn is usually used for `sign()` options — keep as string if using with JWTService directly
    expiresIn: process.env.JWT_EXPIRES_IN ?? '3600s',
  };
});
