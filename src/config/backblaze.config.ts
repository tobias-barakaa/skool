// src/config/backblaze.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('backblaze', () => ({
  keyId: process.env.BACKBLAZE_KEY_ID,
  applicationKey: process.env.BACKBLAZE_APPLICATION_KEY,
  bucketName: process.env.BACKBLAZE_BUCKET_NAME,
  region: process.env.BACKBLAZE_REGION || 'us-east-005',
  endpoint:
    process.env.BACKBLAZE_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com',

  // Fallback endpoints for better reliability
  fallbackEndpoints: [
    'https://s3.us-west-002.backblazeb2.com',
    'https://s3.eu-west-002.backblazeb2.com',
    'https://s3.us-east-005.backblazeb2.com',
  ],

  // Connection settings
  timeout: parseInt(process.env.BACKBLAZE_TIMEOUT || '30000', 10),
  connectTimeout: parseInt(
    process.env.BACKBLAZE_CONNECT_TIMEOUT || '10000',
    10,
  ),
  maxRetries: parseInt(process.env.BACKBLAZE_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.BACKBLAZE_RETRY_DELAY || '1000', 10),
}));
