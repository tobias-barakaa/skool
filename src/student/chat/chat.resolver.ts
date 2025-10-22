import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { ChatRoomsResponse } from './dtos/chat-rooms-response.dto';
import { MessagesResponse } from './dtos/messages-response.dto';
import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
import { GetMessagesArgs } from './dtos/get-messages.args';
import { SendMessageToTeacherInput } from './dtos/send-message.input';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { StudentChatService } from './chat.service';

const pubSub = new PubSub();

@Resolver(() => ChatMessageDto)
export class StudentChatResolver {
  constructor(private readonly chatService: StudentChatService) {}

  /**
   * Get all chat rooms for the current student
   * Query: getMyChatRooms(limit: 10, offset: 0)
   */
  @Query(() => ChatRoomsResponse, {
    description: 'Get all chat rooms for the authenticated student',
  })
  async getMyChatRooms(
    @Args() args: GetChatRoomsArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatRoomsResponse> {
    return await this.chatService.getStudentChatRooms(
      currentUser.sub,
      currentUser.tenantId,
      args,
    );
  }

  /**
   * Get messages from a specific chat room or with a specific teacher
   * Query: getChatMessages(chatRoomId: "uuid", limit: 20, offset: 0)
   * OR: getChatMessages(teacherId: "uuid", limit: 20, offset: 0)
   */
  @Query(() => MessagesResponse, {
    description: 'Get messages from a chat room or with a specific teacher',
  })
  async getChatMessages(
    @Args() args: GetMessagesArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<MessagesResponse> {
    return await this.chatService.getMessages(
      currentUser.sub,
      currentUser.tenantId,
      args,
    );
  }

  /**
   * Get messages with a specific teacher (convenience query)
   * Query: getChatWithTeacher(teacherId: "uuid", limit: 20, offset: 0)
   */
  @Query(() => MessagesResponse, {
    description: 'Get chat messages with a specific teacher',
  })
  async getChatWithTeacher(
    @Args('teacherId', { type: () => ID }) teacherId: string,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Number, nullable: true, defaultValue: 0 })
    offset: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<MessagesResponse> {
    const args: GetMessagesArgs = {
      teacherId,
      limit,
      offset,
    };

    return await this.chatService.getMessages(
      currentUser.sub,
      currentUser.tenantId,
      args,
    );
  }

  /**
   * Send a message to a teacher
   * Mutation: sendMessageToTeacher(input: { recipientId: "teacher-uuid", subject: "Hello", message: "Message text" })
   */
  @Mutation(() => ChatMessage, {
    description: 'Send a message to a teacher',
  })
  async sendMessageToTeacher(
    @Args('input') input: SendMessageToTeacherInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    const message = await this.chatService.sendMessageToTeacher(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  /**
   * Mark all messages in a chat room as read
   * Mutation: markChatAsRead(chatRoomId: "uuid")
   */
  @Mutation(() => Boolean, {
    description: 'Mark all messages in a chat room as read',
  })
  async markChatAsRead(
    @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.chatService.markChatAsRead(
      chatRoomId,
      currentUser.sub,
    );
  }
}
