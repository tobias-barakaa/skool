import { Logger } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateStreamInput } from './dtos/create-stream.input';
import { StreamType } from './dtos/stream.object-type';
import { UpdateStreamInput } from './dtos/update-stream.input';
import { StreamsService } from './providers/services/stream.service';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';

@Resolver(() => StreamType)
@Roles(MembershipRole.SUPER_ADMIN, MembershipRole.SCHOOL_ADMIN)
export class StreamsResolver {
  private readonly logger = new Logger(StreamsResolver.name);

  constructor(private readonly streamsService: StreamsService) {}

  @Mutation(() => StreamType)
  async createStream(
    @Args('input') input: CreateStreamInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StreamType> {
    this.logger.log('Creating stream with input:', input);

    return this.streamsService.createStream(input, user);
  }

  @Mutation(() => StreamType)
  async updateStream(
    @Args('input') input: UpdateStreamInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StreamType> {
    return this.streamsService.updateStream(input, user);
  }

  @Mutation(() => Boolean)
  async deleteStream(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.streamsService.deleteStream(id, user);
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
