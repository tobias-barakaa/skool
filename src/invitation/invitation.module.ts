import { Module } from '@nestjs/common';
import { InvitationService } from './providers/invitation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInvitation } from './entities/user-iInvitation.entity';

@Module({
  providers: [InvitationService],
  imports: [TypeOrmModule.forFeature([UserInvitation])], 
  exports: [InvitationService,TypeOrmModule]
})
export class InvitationModule {}
