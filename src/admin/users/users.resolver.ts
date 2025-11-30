// src/users/users.resolver.ts
import { Logger, UseFilters } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserResponse } from './dtos/create-user-response';
import { AuthResponse, SignupInput } from './dtos/signUp-input';
import { User } from './entities/user.entity';
import { UsersService } from './providers/users.service';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { TenantUserSummary } from './dtos/tenant-user-summary.output';
import { Public } from '../auth/decorator/public.decorator';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { ActiveUser } from '../auth/decorator/active-user.decorator';
import { ActiveUserData } from '../auth/interface/active-user.interface';


@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Mutation(() => CreateUserResponse, { name: 'createUser' })
  async createUser(
    @Args('signupInput') signupInput: SignupInput,
    @Context() context,
  ): Promise<AuthResponse> {
    console.log(
      '📥 Received SignupInput:',
      JSON.stringify(signupInput, null, 2),
    );

    if (!signupInput || !signupInput.password) {
      console.log('❌ signupInput is missing or has no password:', signupInput);
      throw new Error('Invalid input passed to resolver');
    }

    const { user, tokens, subdomainUrl, tenant, membership } =
      await this.usersService.createUser(signupInput);

    context.res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15,
      domain: '.squl.co.ke',
    });

    context.res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: '.squl.co.ke',
    });

    context.res.cookie('tenant_id', tenant.id, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      domain: '.squl.co.ke',
    });

    return {
      user,
      membership,
      tokens,
      subdomainUrl,
      tenant,
    };
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Roles(MembershipRole.SCHOOL_ADMIN)
  @Mutation(() => Boolean)
  async deleteUser(
    @ActiveUser() user: ActiveUserData,
    @Args('userId') userId: string,
  ) {
    
    return this.usersService.deleteUser(userId, user);
  }

  @Query(() => [User], { name: 'usersByTenant' })
  async usersByTenant(
    @Args('tenantId') tenantId: string,
    @Args('role', { nullable: true }) role?: MembershipRole,
  ): Promise<User[]> {
    return await this.usersService.findUsersByTenant(tenantId, role);
  }

  @Query(() => [TenantUserSummary], { name: 'allUsersOfTenant' })
  async allUsersOfTenant(
    @Args('tenantId') tenantId: string,
  ): Promise<TenantUserSummary[]> {
    return await this.usersService.findAllUsersOfTenant(tenantId);
  }
}


