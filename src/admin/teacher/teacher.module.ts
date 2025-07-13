import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/admin/auth/auth.module';
import { EmailModule } from 'src/admin/email/email.module';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import { Teacher } from './entities/teacher.entity';
import { TeacherService } from './providers/teacher.service';
import { TeacherResolver } from './teacher.resolver';
import { UserModule } from '../users/users.module';
import { InvitationModule } from '../invitation/invitation.module';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';
import { SubjectModule } from '../subject/subject.module';
import { LevelModule } from '../level/level.module';
import { StreamsModule } from '../streams/streams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher]),
    EmailModule,
    UserModule,
    InvitationModule,
    AuthModule,
    TenantsModule,
    UserTenantMembershipModule,
    InvitationModule,
    SubjectModule,
    LevelModule,
    StreamsModule

  ],
  providers: [TeacherService, TeacherResolver],
  exports: [TypeOrmModule],
})
export class TeacherModule {}
