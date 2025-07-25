import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class SocketTestService implements OnModuleInit {
  private readonly logger = new Logger(SocketTestService.name);
  private clients: Map<string, Socket> = new Map();

  onModuleInit() {
    // Auto-start test when module initializes
    setTimeout(() => {
      this.runTest();
    }, 2000); 
  }

  async runTest() {
    this.logger.log('🚀 Starting Socket.IO test...');

    // Create multiple test clients
    await this.createTestClients();

    // Run test scenarios
    setTimeout(() => this.testJoinRoom(), 1000);
    setTimeout(() => this.testSendMessage(), 2000);
    setTimeout(() => this.testTyping(), 3000);
  }

  private async createTestClients() {
    const users = [
      { id: 'teacher-123', name: 'Teacher John' },
      { id: 'student-456', name: 'Student Alice' },
      { id: 'parent-789', name: 'Parent Bob' },
    ];

    for (const user of users) {
      const client = io('http://localhost:3000', {
        query: { userId: user.id },
        transports: ['websocket'],
      });

      client.on('connect', () => {
        this.logger.log(`✅ ${user.name} connected (${user.id})`);
      });

      client.on('disconnect', () => {
        this.logger.log(`❌ ${user.name} disconnected`);
      });

      client.on('joinedRoom', (data) => {
        this.logger.log(`🏠 ${user.name} joined room: ${data.roomId}`);
      });

      client.on('messageAdded', (message) => {
        this.logger.log(
          `📨 ${user.name} received message: "${message.message}" from ${message.senderId}`,
        );
      });

      client.on('userTyping', (data) => {
        this.logger.log(
          `⌨️  ${user.name} sees ${data.userId} typing: ${data.isTyping}`,
        );
      });

      this.clients.set(user.id, client);
    }
  }

  private testJoinRoom() {
    this.logger.log('🏠 Testing room joining...');
    const roomId = 'test-room-123';

    this.clients.forEach((client, userId) => {
      client.emit('joinRoom', { roomId });
    });
  }

  private testSendMessage() {
    this.logger.log('📤 Testing message sending...');
    const teacherClient = this.clients.get('teacher-123');

    if (teacherClient) {
      teacherClient.emit('testMessage', {
        roomId: 'test-room-123',
        message: 'Hello students! This is a test message.',
        senderId: 'teacher-123',
      });
    }
  }

  private testTyping() {
    this.logger.log('⌨️  Testing typing indicators...');
    const studentClient = this.clients.get('student-456');

    if (studentClient) {
      // Start typing
      studentClient.emit('typing', { roomId: 'test-room-123', isTyping: true });

      // Stop typing after 2 seconds
      setTimeout(() => {
        studentClient.emit('typing', {
          roomId: 'test-room-123',
          isTyping: false,
        });
      }, 2000);
    }
  }

  // Manual test methods you can call via GraphQL or REST
  async testSpecificScenario(scenario: string) {
    switch (scenario) {
      case 'message':
        return this.testSendMessage();
      case 'typing':
        return this.testTyping();
      case 'join':
        return this.testJoinRoom();
      default:
        return 'Unknown scenario';
    }
  }

  getConnectedClients() {
    const clientStatus: { userId: string; connected: boolean; id: string | undefined }[] = [];
    this.clients.forEach((client, userId) => {
      clientStatus.push({
        userId,
        connected: client.connected,
        id: client.id,
      });
    });
    return clientStatus;
  }
}
