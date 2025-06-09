import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { CreateUserInput } from '../dtos/create-user.input';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { UserFiltersInput } from '../dtos/user-filters.input';
import { UpdateUserInput } from '../dtos/update-user.input';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput, currentUser: User): Promise<User> {
    if (currentUser.role !== UserRole.SCHOOL_ADMIN) {
      throw new ForbiddenException('Only school administrators can create users');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = this.usersRepository.create({
      ...createUserInput,
      password: hashedPassword,
      status: UserStatus.PENDING,
      schoolId: currentUser.schoolId,
    });

    const savedUser = await this.usersRepository.save(user);
    
    // TODO: Send email with temporary password
    console.log(`User created with temp password: ${tempPassword}`);
    
    return savedUser;
  }

  async findAll(filters: UserFiltersInput, currentUser: User): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.school', 'school')
      .where('user.schoolId = :schoolId', { schoolId: currentUser.schoolId });

    if (filters.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    return query.getMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['school'],
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async update(id: string, updateUserInput: UpdateUserInput, currentUser: User): Promise<User> {
    const user = await this.findById(id);
    
    // Users can update their own profile, or school admin can update any user in their school
    if (user.id !== currentUser.id && 
        (currentUser.role !== UserRole.SCHOOL_ADMIN || user.schoolId !== currentUser.schoolId)) {
      throw new ForbiddenException('Unauthorized to update this user');
    }

    Object.assign(user, updateUserInput);
    return this.usersRepository.save(user);
  }

  async delete(id: string, currentUser: User): Promise<boolean> {
    if (currentUser.role !== UserRole.SCHOOL_ADMIN) {
      throw new ForbiddenException('Only school administrators can delete users');
    }

    const user = await this.findById(id);
    
    if (user.schoolId !== currentUser.schoolId) {
      throw new ForbiddenException('Cannot delete user from different school');
    }

    if (user.role === UserRole.SCHOOL_ADMIN) {
      throw new ForbiddenException('Cannot delete school administrator');
    }

    await this.usersRepository.remove(user);
    return true;
  }
}