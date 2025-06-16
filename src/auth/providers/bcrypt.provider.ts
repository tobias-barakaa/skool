import { Injectable } from '@nestjs/common';
import { HashingProvider } from './hashing.provider';
import * as bcrypt from 'bcrypt'


@Injectable()
export class BcryptProvider implements HashingProvider {
    async hashPassword(data: string | Buffer): Promise<string> {
        // Generate salt
        const salt = await bcrypt.genSalt(10);
       return bcrypt.hash(data, salt)
    }
    
    async comparePassword(data: string | Buffer, encrypted: string): Promise<boolean> {
        return bcrypt.compare(data, encrypted)
    }

}
