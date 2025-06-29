// resend.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('resend', () => ({
  apiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
}));
