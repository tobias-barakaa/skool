import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';


// @Resolver()
// @Injectable()
// export class AuthResolver {
//   constructor(
//     private authService: AuthService,
//     private invitationService: InvitationService,
//   ) {}

//   // Regular signup for tenant creation
//   @Mutation(() => AuthResponse)
//   async signup(
//     @Args('input') input: SignupInput,
//   ): Promise<AuthResponse> {
//     return this.authService.signup(input);
//   }

//   // Signup with invitation token
//   @Mutation(() => AuthResponse)
//   async signupWithInvitation(
//     @Args('input') input: InvitationSignupInput,
//   ): Promise<AuthResponse> {
//     return this.authService.signupWithInvitation(input);
//   }

//   // Validate invitation before showing signup form
//   @Query(() => InvitationValidationResponse)
//   async validateInvitation(
//     @Args('token') token: string,
//   ): Promise<InvitationValidationResponse> {
//     const invitation = await this.invitationService.validateInvitation(token);
    
//     if (!invitation) {
//       return {
//         valid: false,
//         error: 'Invalid or expired invitation',
//       };
//     }

//     return {
//       valid: true,
//       invitation: {
//         email: invitation.email,
//         role: invitation.role,
//         tenantName: invitation.tenant.name,
//       },
//     };
//   }

//   // Send invitation (only for SCHOOL_ADMIN/SUPER_ADMIN)
//   @Mutation(() => Boolean)
//   async sendInvitation(
//     @Args('input') input: SendInvitationInput,
//     @Context() context: any,
//   ): Promise<boolean> {
//     // Validate user has permission to send invitations
//     const currentUser = context.user;
//     const membership = await this.authService.getUserTenantMembership(
//       currentUser.id, 
//       input.tenantId
//     );

//     if (!['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(membership?.role)) {
//       throw new Error('Insufficient permissions');
//     }

//     const invitation = await this.invitationService.createInvitation(
//       input.email,
//       input.role,
//       input.tenantId,
//       currentUser.id,
//       input.message,
//     );

//     // Send email with Resend
//     await this.emailService.sendInvitation(invitation);
    
//     return true;
//   }
// }

// 8. Input/Output Types for GraphQL
import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { MembershipRole, UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/users/entities/user.entity';

@InputType()
export class SignupInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;

  @Field()
  schoolName: string;

  @Field()
  subdomain: string;
}

@InputType()
export class InvitationSignupInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;

  @Field()
  invitationToken: string;
}

@InputType()
export class SendInvitationInput {
  @Field()
  email: string;

  @Field(() => MembershipRole)
  role: MembershipRole;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  tokens: { accessToken: string; refreshToken: string; };

  @Field(() => User)
  user: User;

  @Field(() => UserTenantMembership, { nullable: true })
  membership?: UserTenantMembership;
}

@ObjectType()
export class InvitationInfo {
  @Field()
  email: string;

  @Field(() => MembershipRole)
  role: MembershipRole;

  @Field()
  tenantName: string;
}

@ObjectType()
export class InvitationValidationResponse {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => InvitationInfo, { nullable: true })
  invitation?: InvitationInfo;
}



// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { UserInvitation, InvitationStatus } from './entities/user-invitation.entity';
// import { MembershipRole } from './entities/user-tenant-membership.entity';
// import { v4 as uuidv4 } from 'uuid';

// @Injectable()
// export class InvitationService {
//   constructor(
//     @InjectRepository(UserInvitation)
//     private invitationRepository: Repository<UserInvitation>,
//   ) {}

//   async createInvitation(
//     email: string,
//     role: MembershipRole,
//     tenantId: string,
//     invitedById?: string,
//     message?: string,
//   ): Promise<UserInvitation> {
//     const token = uuidv4();
//     const expiresAt = new Date();
//     expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

//     const invitation = this.invitationRepository.create({
//       email,
//       role,
//       token,
//       expiresAt,
//       tenantId,
//       invitedById,
//       message,
//     });

//     return await this.invitationRepository.save(invitation);
//   }

//   async validateInvitation(token: string): Promise<UserInvitation | null> {
//     const invitation = await this.invitationRepository.findOne({
//       where: { 
//         token, 
//         status: InvitationStatus.PENDING,
//       },
//       relations: ['tenant'],
//     });

//     if (!invitation || invitation.expiresAt < new Date()) {
//       return null;
//     }

//     return invitation;
//   }

//   async acceptInvitation(token: string): Promise<UserInvitation> {
//     const invitation = await this.validateInvitation(token);
//     if (!invitation) {
//       throw new Error('Invalid or expired invitation');
//     }

//     invitation.status = InvitationStatus.ACCEPTED;
//     return await this.invitationRepository.save(invitation);
//   }
// }


// // 9. Updated Auth Service
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { User } from './entities/user.entity';
// import { Tenant } from './entities/tenant.entity';
// import { UserTenantMembership, MembershipRole } from './entities/user-tenant-membership.entity';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class AuthService {
//   constructor(
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//     @InjectRepository(Tenant)
//     private tenantRepository: Repository<Tenant>,
//     @InjectRepository(UserTenantMembership)
//     private membershipRepository: Repository<UserTenantMembership>,
//     private invitationService: InvitationService,
//     private dataSource: DataSource,
//   ) {}

//   async signup(input: SignupInput): Promise<AuthResponse> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       // Check if subdomain is available
//       const existingTenant = await queryRunner.manager.findOne(Tenant, {
//         where: { subdomain: input.subdomain }
//       });

//       if (existingTenant) {
//         throw new Error('Subdomain already taken');
//       }

//       // Create user
//       const hashedPassword = await bcrypt.hash(input.password, 10);
//       const user = queryRunner.manager.create(User, {
//         email: input.email,
//         password: hashedPassword,
//         name: input.name,
//       });
//       const savedUser = await queryRunner.manager.save(user);

//       // Create tenant
//       const tenant = queryRunner.manager.create(Tenant, {
//         name: input.schoolName,
//         subdomain: input.subdomain,
//       });
//       const savedTenant = await queryRunner.manager.save(tenant);

//       // Create membership (user becomes SCHOOL_ADMIN of their tenant)
//       const membership = queryRunner.manager.create(UserTenantMembership, {
//         userId: savedUser.id,
//         tenantId: savedTenant.id,
//         role: MembershipRole.SCHOOL_ADMIN,
//         joinedAt: new Date(),
//       });
//       const savedMembership = await queryRunner.manager.save(membership);

//       await queryRunner.commitTransaction();

//       const token = this.generateJWT(savedUser, savedMembership);

//       return {
//         token,
//         user: savedUser,
//         membership: savedMembership,
//       };
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw error;
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   async signupWithInvitation(input: InvitationSignupInput): Promise<AuthResponse> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       // Validate invitation
//       const invitation = await this.invitationService.validateInvitation(input.invitationToken);
//       if (!invitation) {
//         throw new Error('Invalid or expired invitation');
//       }

//       if (invitation.email !== input.email) {
//         throw new Error('Email does not match invitation');
//       }

//       // Check if user already exists
//       let user = await queryRunner.manager.findOne(User, {
//         where: { email: input.email }
//       });

//       if (!user) {
//         // Create new user
//         const hashedPassword = await bcrypt.hash(input.password, 10);
//         user = queryRunner.manager.create(User, {
//           email: input.email,
//           password: hashedPassword,
//           name: input.name,
//         });
//         user = await queryRunner.manager.save(user);
//       }

//       // Create membership
//       const membership = queryRunner.manager.create(UserTenantMembership, {
//         userId: user?.id,
//         tenantId: invitation.tenantId,
//         role: invitation.role,
//         joinedAt: new Date(),
//       });
//       const savedMembership = await queryRunner.manager.save(membership);

//       // Mark invitation as accepted
//       await this.invitationService.acceptInvitation(input.invitationToken);

//       await queryRunner.commitTransaction();

//       const token = this.generateJWT(user, savedMembership);

//       return {
//         token,
//         user,
//         membership: savedMembership,
//       };
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw error;
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   private generateJWT(user: User, membership?: UserTenantMembership): string {
//     const payload = {
//       userId: user.id,
//       email: user.email,
//       tenantId: membership?.tenantId,
//       role: membership?.role,
//     };
//     // Use your JWT service to generate token
//     return 'jwt-token'; // Replace with actual JWT generation
//   }
// }