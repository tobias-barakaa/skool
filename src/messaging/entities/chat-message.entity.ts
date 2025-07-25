import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatRoom } from './chat-room.entity';

@ObjectType()
@Entity('chat_messages')
export class ChatMessage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column('uuid')
  senderId: string;

  @Field()
  @Column()
  senderType: string; // 'TEACHER', 'STUDENT', 'PARENT'

  @Field({ nullable: true })
  @Column({ nullable: true })
  subject?: string;

  @Field()
  @Column('text')
  message: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  imageUrl?: string;

  @Field()
  @Column('uuid')
  chatRoomId: string;

  @Field()
  @Column({ default: false })
  isRead: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => ChatRoom)
  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages)
  @JoinColumn({ name: 'chatRoomId' })
  chatRoom: ChatRoom;
}
