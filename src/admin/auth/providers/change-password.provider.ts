import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { Repository } from 'typeorm';
import { ChangePasswordInput } from '../dtos/change-password.dto';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class ChangePasswordProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly hashingProvider: HashingProvider,
  ) {}

  async changePassword(
    userId: string,
    changePasswordInput: ChangePasswordInput,
  ): Promise<{ message: string }> {
    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.hashingProvider.comparePassword(
      changePasswordInput.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashingProvider.hashPassword(
      changePasswordInput.newPassword,
    );

    // Update password
    await this.userRepository.update(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }
}
