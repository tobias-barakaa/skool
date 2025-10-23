import { PubSub } from 'graphql-subscriptions';
import { Global, Module } from '@nestjs/common';

export const pubSub = new PubSub();

@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: pubSub,
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}
