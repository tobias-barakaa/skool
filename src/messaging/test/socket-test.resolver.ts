import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SocketTestService } from './socket-test.service';

@Resolver()
export class SocketTestResolver {
  constructor(private readonly socketTestService: SocketTestService) {}

  @Query(() => String)
  async testSocket(@Args('scenario', { nullable: true }) scenario?: string) {
    await this.socketTestService.testSpecificScenario(scenario || 'message');
    return `✅ Socket test "${scenario}" executed`;
  }

  @Query(() => [String])
  getSocketClients() {
    const clients = this.socketTestService.getConnectedClients();
    return clients.map(
      (c) => `${c.userId}: ${c.connected ? 'Connected' : 'Disconnected'}`,
    );
  }

  @Mutation(() => String)
  async runFullSocketTest() {
    await this.socketTestService.runTest();
    return '🚀 Full socket test started - check your logs!';
  }
}
