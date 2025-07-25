import {
  Resolver,
  Mutation,
  Query,
  Args,
  Context,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './providers/chat.service';
import { SendMessageInput } from './dtos/send-message.input';
import { ChatRoom } from './entities/chat-room.entity';


const pubSub = new PubSub();

@Resolver(() => ChatMessage)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Mutation(() => ChatMessage)
  async sendMessageToStudent(
    @Args('input') input: SendMessageInput,
    @Context() context: any,
  ): Promise<ChatMessage> {
    const teacherId = context.req.user.id; // Assuming you have authentication

    const message = await this.chatService.sendMessageToStudent(
      teacherId,
      input.recipientId,
      input,
    );

    // Publish for real-time subscription
    pubSub.publish('messageAdded', { messageAdded: message });

    return message;
  }

  @Mutation(() => ChatMessage)
  async sendMessageToParent(
    @Args('input') input: SendMessageInput,
    @Context() context: any,
  ): Promise<ChatMessage> {
    const teacherId = context.req.user.id;

    const message = await this.chatService.sendMessageToParent(
      teacherId,
      input.recipientId,
      input,
    );

    pubSub.publish('messageAdded', { messageAdded: message });

    return message;
  }

  @Query(() => [ChatRoom])
  async getMyChats(@Context() context: any): Promise<ChatRoom[]> {
    const userId = context.req.user.id;
    return await this.chatService.getUserChats(userId);
  }

  @Query(() => [ChatMessage])
  async getChatMessages(
    @Args('chatRoomId') chatRoomId: string,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset: number,
    @Context() context: any,
  ): Promise<ChatMessage[]> {
    const userId = context.req.user.id;
    return await this.chatService.getChatHistory(
      userId,
      chatRoomId,
      limit,
      offset,
    );
  }

  @Query(() => Number)
  async getUnreadMessageCount(@Context() context: any): Promise<number> {
    const userId = context.req.user.id;
    return await this.chatService.getUnreadCount(userId);
  }

  @Mutation(() => Boolean)
  async markChatAsRead(
    @Args('chatRoomId') chatRoomId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user.id;
    await this.chatService.markAsRead(chatRoomId, userId);
    return true;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload, variables, context) => {
      // Only send messages to users who are participants in the chat room
      const userId = context.connection.context.user.id;
      return payload.messageAdded.chatRoom.participantIds.includes(userId);
    },
  })
  messageAdded() {
    return (pubSub as any).asyncIterator('messageAdded');
  }
}
