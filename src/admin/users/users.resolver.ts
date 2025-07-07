// src/users/users.resolver.ts
import { Logger, UseFilters } from '@nestjs/common';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { SkipTenantValidation } from 'src/admin/auth/decorator/skip-tenant-validation.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { CreateUserResponse } from './dtos/create-user-response';
import { AuthResponse, SignupInput } from './dtos/signUp-input';
import { User } from './entities/user.entity';
import { UsersService } from './providers/users.service';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => CreateUserResponse, { name: 'createUser' })
  @Auth(AuthType.None)
  @SkipTenantValidation()
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

    // return await this.usersService.createUser(signupInput);
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
      membership, // ✅ include this
      tokens,
      subdomainUrl,
      tenant,
    };
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    // this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }

  @Query(() => [User], { name: 'usersByTenant' })
  @Auth(AuthType.Bearer) // or any role that should access this
  async usersByTenant(
    @Args('tenantId') tenantId: string,
    @Args('role', { nullable: true }) role?: MembershipRole,
  ): Promise<User[]> {
    return await this.usersService.findUsersByTenant(tenantId, role);
  }
}
