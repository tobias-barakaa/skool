// shared/utils/invitation.utils.ts

import { ConflictException } from '@nestjs/common';
import { InvitationStatus, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { Repository, MoreThan, LessThan } from 'typeorm';

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
    order: { createdAt: 'DESC' }, // Still find the newest one
  });

  if (!existingInvitation) {
    return null;
  }

  // --- THE CRUCIAL FIX ---
  // The throttle check MUST use the 'updatedAt' timestamp, because that's what changes on a resend.
  const lastActionTime = new Date(existingInvitation.updatedAt);

  // Is the last action (creation or update) more recent than our 10-minute cutoff?
  const isTooRecent = lastActionTime > throttleTime;

  // (Optional) You can add the debug logs back here if you want to verify
  // console.log(`  - Last Action Time (C): ${lastActionTime.toISOString()}`);
  // console.log(`  - RESULT: ${isTooRecent}`);

  if (isTooRecent) {
    const timeLeft = Math.ceil(
      (lastActionTime.getTime() + throttleMinutes * 60 * 1000 - now.getTime()) /
        60000,
    );
    throw new ConflictException(
      `An invitation was already sent to ${email}. Please wait ${timeLeft || 1} more minutes before sending another.`,
    );
  }

  // If we reach here, the last action was more than 10 minutes ago. It's safe to proceed.
  return existingInvitation;
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
