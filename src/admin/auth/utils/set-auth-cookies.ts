// src/auth/utils/set-auth-cookies.ts

export const setAuthCookies = (
  context: any,
  tokens: { accessToken: string; refreshToken: string },
  tenantId: string,
) => {
  const isProd = process.env.NODE_ENV === 'production';

  context.res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: isProd,
    maxAge: 1000 * 60 * 15, 
    domain: '.squl.co.ke',
  });

  context.res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    domain: '.squl.co.ke',
  });

  context.res.cookie('tenant_id', tenantId, {
    httpOnly: true,
    sameSite: 'None',
    secure: isProd,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    domain: '.squl.co.ke',
  });
};
