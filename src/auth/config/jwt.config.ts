import { registerAs } from "@nestjs/config";

export default registerAs('jwt', () => {
    return {
        secret: process.env.JWT_SECRET,
        audience: process.env.JWT_TOKEN_AUDIENCE,
        issuer: process.env.JWT_TOKEN_ISSUER,
        accessTOKENTtl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL ?? '3600', 10),
        expiresIn: process.env.JWT_EXPIRES_IN,
        refreshTokenTtl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL ?? '86400', 10),
       
    }
})

