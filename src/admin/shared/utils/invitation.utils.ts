import { ConflictException } from '@nestjs/common';
import {
  InvitationStatus,
  UserInvitation,
} from 'src/admin/invitation/entities/user-iInvitation.entity';
import { Repository } from 'typeorm';

export async function handleInvitationResendLogic(
  email: string,
  tenantId: string,
  invitationRepository: Repository<UserInvitation>,
  throttleMinutes: number = 10,
): Promise<UserInvitation | null> {
  const now = new Date();
  const throttleTime = new Date(now.getTime() - throttleMinutes * 60 * 1000);

  const existingInvitation = await invitationRepository.findOne({
    where: {
      email,
      tenant: { id: tenantId },
      status: InvitationStatus.PENDING,
    },
    order: { createdAt: 'DESC' },
  });

  if (!existingInvitation) {
    return null;
  }
  const lastActionTime = existingInvitation.lastSentAt
    ? new Date(existingInvitation.lastSentAt)
    : new Date(existingInvitation.updatedAt);

  const isTooRecent = lastActionTime > throttleTime;

  if (isTooRecent) {
    const timeLeft = Math.ceil(
      (lastActionTime.getTime() + throttleMinutes * 60 * 1000 - now.getTime()) /
        60000,
    );
    throw new ConflictException(
      `An invitation was already sent to ${email}. Please wait ${timeLeft || 1} more minutes before sending another.`,
    );
  }

  return existingInvitation;
}
