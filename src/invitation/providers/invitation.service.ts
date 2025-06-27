import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MembershipRole } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserInvitation, InvitationStatus } from '../entities/user-iInvitation.entity';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
  ) {}

  async createInvitation(
    email: string,
    role: MembershipRole,
    tenantId: string,
    invitedById?: string,
  ): Promise<UserInvitation> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    const invitation = this.invitationRepository.create({
      email,
      role,
      token,
      expiresAt,
      tenantId,
      invitedById,
    });

    return await this.invitationRepository.save(invitation);
  }

  async validateInvitation(token: string): Promise<UserInvitation | null> {
    const invitation = await this.invitationRepository.findOne({
      where: { 
        token, 
        status: InvitationStatus.PENDING,
      },
      relations: ['tenant'],
    });

    if (!invitation || invitation.expiresAt < new Date()) {
      return null;
    }

    return invitation;
  }

  async acceptInvitation(token: string): Promise<UserInvitation> {
    const invitation = await this.validateInvitation(token);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    invitation.status = InvitationStatus.ACCEPTED;
    return await this.invitationRepository.save(invitation);
  }
}