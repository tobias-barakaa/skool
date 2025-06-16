import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingProvider {

    abstract hashPassword(password: string | Buffer): Promise<string> 
    abstract comparePassword(data: string | Buffer, encrypted: string): Promise<boolean>;
}
