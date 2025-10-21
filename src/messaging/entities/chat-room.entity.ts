import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatMessage } from './chat-message.entity';

@ObjectType()
@Entity('chat_rooms')
export class ChatRoom {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  type: string; 

  @Field(() => [String])
  @Column('simple-array', { nullable: true })
  participantIds: string[]; 

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @Field(() => [ChatMessage], { nullable: true })
  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];
}
