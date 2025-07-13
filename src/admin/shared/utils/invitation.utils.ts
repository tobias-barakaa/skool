// shared/utils/invitation.utils.ts

import { ConflictException } from '@nestjs/common';
import { InvitationStatus, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { Repository, MoreThan } from 'typeorm';

export async function handleInvitationThrottleAndExpiry(
  email: string,
  tenantId: string,
  invitationRepository: Repository<UserInvitation>,
  throttleMinutes: number = 10,
) {
  const now = new Date();
  const throttleTime = new Date(now.getTime() - throttleMinutes * 60 * 1000);

  // Check for recent invitations within throttle window
  const recentInvitation = await invitationRepository.findOne({
    where: {
      email,
      tenant: { id: tenantId },
      status: InvitationStatus.PENDING,
      createdAt: MoreThan(throttleTime), // Created within last 10 minutes
    },
    order: { createdAt: 'DESC' },
  });

  if (recentInvitation) {
    const timeLeft = Math.ceil((recentInvitation.createdAt.getTime() + throttleMinutes * 60 * 1000 - now.getTime()) / 60000);
    throw new ConflictException(
      `An invitation was already sent to ${email}. Please wait ${timeLeft} minutes before sending another.`
    );
  }

  // Clean up expired invitations for this email/tenant combo
  await invitationRepository.delete({
    email,
    tenant: { id: tenantId },
    status: InvitationStatus.PENDING,
    expiresAt: MoreThan(now), // Remove expired ones
  });

  // Update existing pending invitations to expired if past expiry
  await invitationRepository.update(
    {
      email,
      tenant: { id: tenantId },
      status: InvitationStatus.PENDING,
      expiresAt: MoreThan(now),
    },
    { status: InvitationStatus.EXPIRED }
  );
}




















// import { Repository, MoreThan, LessThan } from 'typeorm';
// import { BadRequestException } from '@nestjs/common';
// import { InvitationStatus, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';

// export async function handleInvitationThrottleAndExpiry(
//   email: string,
//   tenantId: string,
//   invitationRepo: Repository<UserInvitation>,
//   throttleMinutes = 10,
// ) {
//   const throttleTime = new Date();
//   throttleTime.setMinutes(throttleTime.getMinutes() - throttleMinutes);

//   const recent = await invitationRepo.findOne({
//     where: {
//       email,
//       tenant: { id: tenantId },
//       status: InvitationStatus.PENDING,
//       createdAt: MoreThan(throttleTime),
//     },
//   });

//   if (recent) {
//     throw new BadRequestException(
//       `An invitation was already sent recently. Please wait ${throttleMinutes} minutes.`,
//     );
//   }

//   await invitationRepo.update(
//     {
//       email,
//       tenant: { id: tenantId },
//       status: InvitationStatus.PENDING,
//       expiresAt: LessThan(new Date()),
//     },
//     { status: InvitationStatus.EXPIRED },
//   );
// }
