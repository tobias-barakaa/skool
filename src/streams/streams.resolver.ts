// streams.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { StreamType } from './dtos/stream.object-type';
import { StreamsService } from './providers/stream.service';
import { CreateStreamInput } from './dtos/create-stream.input';

@Resolver(() => StreamType)
export class StreamsResolver {
  constructor(private readonly streamsService: StreamsService) {}

  @Mutation(() => StreamType)
  async createStream(
    @Args('input') input: CreateStreamInput,
  ): Promise<StreamType> {
    return this.streamsService.createStream(input);
  }

  @Query(() => [StreamType])
  async streams(): Promise<StreamType[]> {
    return this.streamsService.findAll();
  }

  @Query(() => StreamType)
  async stream(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<StreamType> {
    return this.streamsService.findOne(id);
  }

  @Query(() => [StreamType])
  async streamsByGradeLevel(
    @Args('gradeLevelId', { type: () => ID }) gradeLevelId: string,
  ): Promise<StreamType[]> {
    return this.streamsService.findByGradeLevel(gradeLevelId);
  }

  @Query(() => [StreamType])
  async activeStreams(): Promise<StreamType[]> {
    return this.streamsService.findActiveStreams();
  }
}