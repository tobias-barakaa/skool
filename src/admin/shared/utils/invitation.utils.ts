// shared/utils/invitation.utils.ts

import { ConflictException } from '@nestjs/common';
import { InvitationStatus, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { Repository, MoreThan, LessThan } from 'typeorm';

export async function handleInvitationThrottleAndExpiry(
  email: string,
  tenantId: string,
  invitationRepository: Repository<UserInvitation>,
  throttleMinutes: number = 10,
) {
  const now = new Date();
  const throttleTime = new Date(now.getTime() - throttleMinutes * 60 * 1000);

  // Use a transaction to prevent race conditions
  return await invitationRepository.manager.transaction(async (manager) => {
    const invitationRepo = manager.getRepository(UserInvitation);

    // 1. Find the most recent PENDING invitation for this email and tenant
    const existingInvitation = await invitationRepo.findOne({
      where: {
        email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
      lock: { mode: 'pessimistic_write' }, // Lock the row to prevent concurrent access
    });

    if (existingInvitation) {
      // 2. If within throttle window → block sending
      if (existingInvitation.createdAt > throttleTime) {
        const minutesSinceCreation = Math.floor(
          (now.getTime() - existingInvitation.createdAt.getTime()) / 60000,
        );
        const timeLeft = throttleMinutes - minutesSinceCreation;

        throw new ConflictException(
          `An invitation was recently sent to ${email}. Please wait another ${timeLeft} minute(s) before sending a new one.`,
        );
      } else {
        // 3. If outside throttle window → expire the old one
        existingInvitation.status = InvitationStatus.EXPIRED;
        await invitationRepo.save(existingInvitation);
      }
    }

    // 4. Clean up any other expired invitations
    await invitationRepo
      .createQueryBuilder()
      .update(UserInvitation)
      .set({ status: InvitationStatus.EXPIRED })
      .where(
        'email = :email AND tenantId = :tenantId AND expiresAt < :now AND status = :status',
        {
          email,
          tenantId,
          now,
          status: InvitationStatus.PENDING,
        },
      )
      .execute();
  });
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
