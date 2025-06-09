import { registerAs } from "@nestjs/config"

export default registerAs('appConfig', ()  => ({
    environment: process.env.NODE_ENV || 'production',
    apiVersion: process.env.API_VERSION || 'v1',
    
    
    // mailHost: process.env.MAIL_HOST,
    // smtpUsername: process.env.SMTP_USERNAME,
    // smtpPassword: process.env.SMTP_PASSWORD,
    

    
    
}))
