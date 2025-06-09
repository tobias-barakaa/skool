import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/entities/user.entity';
import { School } from 'src/school/entities/school.entity';
import { ColorPalette } from 'src/color-palletes/entities/color-palette.entity';
import { SignupInput } from '../dtos/signup.input';
import { AuthResponse } from '../dtos/auth-response.dto';
import { SchoolStatus } from 'src/school/enums/school-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { UserStatus } from 'src/users/enums/user-status.enum';
import { LoginInput } from '../dtos/login.input';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(School)
    private schoolsRepository: Repository<School>,
    @InjectRepository(ColorPalette)
    private colorPalettesRepository: Repository<ColorPalette>,
    // private jwtService: JwtService,
  ) {}

  async signup(signupInput: SignupInput) {
    const { schoolName, adminFirstName, adminLastName, email, password, subdomain } = signupInput;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if subdomain is taken
    if (subdomain) {
      const existingSchool = await this.schoolsRepository.findOne({ where: { subdomain } });
      if (existingSchool) {
        throw new ConflictException('Subdomain is already taken');
      }
    }

    // Create default color palette
    const colorPalette = this.colorPalettesRepository.create({
      name: `${schoolName} Color Palette`,
    });
    const savedColorPalette = await this.colorPalettesRepository.save(colorPalette);

    // Create school
    const school = this.schoolsRepository.create({
      name: schoolName,
      subdomain,
      status: SchoolStatus.TRIAL,
      colorPalette: savedColorPalette,
    });
    const savedSchool = await this.schoolsRepository.save(school);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const adminUser = this.usersRepository.create({
      firstName: adminFirstName,
      lastName: adminLastName,
      email,
      password: hashedPassword,
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      schoolId: savedSchool.id,
    });

    const savedUser = await this.usersRepository.save(adminUser);

    // Generate JWT token
    const payload = { sub: savedUser.id, email: savedUser.email, role: savedUser.role };
    // const accessToken = this.jwtService.sign(payload);

    // TODO: Send welcome email
    await this.sendWelcomeEmail(savedUser, savedSchool);

    // return {
    //   accessToken,
    //   user: savedUser,
    // };
  }

  async login(loginInput: LoginInput) {
    const { email, password } = loginInput;

    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['school'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.usersRepository.update(user.id, { lastLoginAt: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role };
    // const accessToken = this.jwtService.sign(payload);

    // return {
    //   accessToken,
    //   user,
    // };
  }

  private async sendWelcomeEmail(user: User, school: School): Promise<void> {
    // TODO: Implement email service
    console.log(`Welcome email sent to ${user.email} for school ${school.name}`);
  }

//   async validateUser(userId: string): Promise<User> {
//     return this.usersRepository.findOne({
//       where: { id: userId },
//       relations: ['school'],
//     });
//   }
}