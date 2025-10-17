import { Resolver, Query, Mutation, Args, Subscription, ID } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import {  StudentChatService } from './chat.service';
import { ChatMessageInput, ChatRoomsResponse, MessagesResponse } from './dtos/chat-response.dto';
import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { GetMessagesArgs } from './dtos/get-messages.args';
import { SendMessageToTeacherInput } from './dtos/send-message.input';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';


const pubSub = new PubSub();

@Resolver(() => ChatMessageInput)
export class StudentChatResolver {
  constructor(private readonly chatService: StudentChatService) {}

  @Query(() => ChatRoomsResponse)
  async getMyChatRooms(
    @Args() args: GetChatRoomsArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatRoomsResponse> {
    try {
      // currentUser.sub is the user_id
      return await this.chatService.getStudentChatRooms(
        currentUser.sub,
        currentUser.tenantId,
        args,
      );
    } catch (error) {
      console.error('Error in getMyChatRooms resolver:', error);
      throw error;
    }
  }

  @Query(() => MessagesResponse)
  async getMyMessages(
    @Args() args: GetMessagesArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<MessagesResponse> {
    return await this.chatService.getMessages(
      currentUser.sub,
      currentUser.tenantId,
      args,
    );
  }

  @Mutation(() => ChatMessage)
  async sendMessageToTeacher(
    @Args('input') input: SendMessageToTeacherInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    // input.recipientId is TEACHER_ID (from teachers table)
    // We need to convert it to user_id before creating the chat
    const message = await this.chatService.sendMessageToTeacher(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  @Query(() => MessagesResponse)
  async getChatMessages(
    @Args() args: GetMessagesArgs,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<MessagesResponse> {
    try {
      console.log('Getting messages for student:', {
        studentId: currentUser.sub,
        tenantId: currentUser.tenantId,
        args,
      });

      return await this.chatService.getMessages(
        currentUser.sub,
        currentUser.tenantId,
        args,
      );
    } catch (error) {
      console.error('Error in getChatMessages resolver:', error);
      throw error;
    }
  }

  @Query(() => MessagesResponse)
  async getChatWithTeacher(
    @Args('teacherId', { type: () => ID }) teacherId: string,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Number, nullable: true, defaultValue: 0 })
    offset: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<MessagesResponse> {
    try {
      console.log('Getting chat with teacher:', {
        teacherId,
        studentId: currentUser.sub,
        tenantId: currentUser.tenantId,
      });

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
    } catch (error) {
      console.error('Error in getChatWithTeacher resolver:', error);
      throw error;
    }
  }

  // @Mutation(() => ChatMessageInput)
  // async sendMessageToTeacher(
  //   @Args('input') input: SendMessageToTeacherInput,
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<ChatMessageInput> {
  //   try {
  //     console.log('Sending message to teacher:', {
  //       input,
  //       studentId: currentUser.sub,
  //       tenantId: currentUser.tenantId,
  //     });

  //     const message = await this.chatService.sendMessageToTeacher(
  //       currentUser,
  //       input,
  //     );

  //     // Publish message for real-time updates
  //     pubSub.publish('messageAdded', {
  //       messageAdded: message,
  //       chatRoomId: message.chatRoom.id,
  //     });

  //     return message;
  //   } catch (error) {
  //     console.error('Error in sendMessageToTeacher resolver:', error);
  //     throw error;
  //   }
  // }

  //   @Subscription(() => ChatMessage, {
  //     filter: (payload, variables) => {
  //       // Only send to users who are participants in the chat room
  //       return payload.chatRoomId === variables.chatRoomId;
  //     },
  //   })
  //   messageAdded(
  //     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
  //   ) {
  //     return pubSub.asyncIterator('messageAdded');
  //   }

  //   @Subscription(() => ChatMessage, {
  //     filter: (payload, variables, context) => {
  //       // Send to all chat rooms where the current user is a participant
  //       const currentUserId = context.req?.user?.sub;
  //       if (!currentUserId) return false;

  //       // This would need additional logic to check if user is participant
  //       return true;
  //     },
  //   })
  //   newMessage() {
  //     return pubSub.asyncIterator('messageAdded');
  //   }
}
