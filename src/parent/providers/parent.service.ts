// import {
//   Injectable,
//   BadRequestException,
//   ConflictException,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Like, ILike } from 'typeorm';
// import { Parent } from '../entities/parent.entity';
// import { ParentStudent } from '../entities/parent-student.entity';
// import { Student } from 'src/student/entities/student.entity';
// import { User } from 'src/users/entities/user.entity';
// import { CreateParentInput } from '../dtos/create-parent.dto';
// import { StudentLinkInput } from '../dtos/student-link.dto';
// import { StudentSearchInput } from '../dtos/search-student.dto';

// @Injectable()
// export class ParentService {
//   constructor(
//     @InjectRepository(Parent)
//     private parentRepository: Repository<Parent>,
//     @InjectRepository(ParentStudent)
//     private parentStudentRepository: Repository<ParentStudent>,
//     @InjectRepository(Student)
//     private studentRepository: Repository<Student>,
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//   ) {}

//   async createParent(
//     createParentInput: CreateParentInput,
//     tenantId: string,
//   ): Promise<Parent> {
//     // STEP 1: Validate that all students exist BEFORE creating parent
//     const validatedStudents = await this.validateAndFindStudents(
//       createParentInput.students,
//       tenantId,
//     );

//     if (validatedStudents.length === 0) {
//       throw new BadRequestException(
//         'No valid students found. Cannot create parent without linking to at least one student.',
//       );
//     }

//     // STEP 2: Check if parent with email already exists for this tenant
//     const existingParent = await this.parentRepository.findOne({
//       where: { email: createParentInput.email, tenantId },
//     });

//     if (existingParent) {
//       // If parent exists, link to new students instead
//       await this.linkValidatedStudentsToParent(
//         existingParent.id,
//         validatedStudents,
//         createParentInput.students,
//         tenantId,
//       );
//       return this.findParentById(existingParent.id, tenantId);
//     }

//     // STEP 3: Create or find user
//     let user = await this.userRepository.findOne({
//       where: { email: createParentInput.email },
//     });

//     if (!user) {
//       user = this.userRepository.create({
//         email: createParentInput.email,
//         firstName: createParentInput.firstName,
//         lastName: createParentInput.lastName,
//         phone: createParentInput.phone,
//       });
//       user = await this.userRepository.save(user);
//     }

//     // STEP 4: Create parent (only after students are validated)
//     const parent = this.parentRepository.create({
//       ...createParentInput,
//       userId: user.id,
//       tenantId,
//     });

//     const savedParent = await this.parentRepository.save(parent);

//     // STEP 5: Link validated students to parent
//     await this.linkValidatedStudentsToParent(
//       savedParent.id,
//       validatedStudents,
//       createParentInput.students,
//       tenantId,
//     );

//     return this.findParentById(savedParent.id, tenantId);
//   }

//   async validateAndFindStudents(
//     studentLinks: StudentLinkInput[],
//     tenantId: string,
//   ): Promise<Student[]> {
//     const validatedStudents: Student[] = [];
//     const notFoundStudents: string[] = [];

//     for (const link of studentLinks) {
//       const student = await this.findStudentByMultipleCriteria(link, tenantId);

//       if (student) {
//         validatedStudents.push(student);
//       } else {
//         // Create descriptive error message based on search criteria
//         let searchCriteria = '';
//         if (link.studentId) searchCriteria = `ID: ${link.studentId}`;
//         else if (link.admissionNumber)
//           searchCriteria = `Admission Number: ${link.admissionNumber}`;
//         else if (link.studentName) searchCriteria = `Name: ${link.studentName}`;
//         else if (link.studentPhone)
//           searchCriteria = `Phone: ${link.studentPhone}`;
//         else searchCriteria = 'Unknown criteria';

//         notFoundStudents.push(searchCriteria);
//       }
//     }

//     if (notFoundStudents.length > 0) {
//       throw new BadRequestException(
//         `Cannot create parent. The following students were not found: ${notFoundStudents.join(', ')}. Please verify the student information and try again.`,
//       );
//     }

//     return validatedStudents;
//   }

//   async linkValidatedStudentsToParent(
//     parentId: string,
//     validatedStudents: Student[],
//     studentLinks: StudentLinkInput[],
//     tenantId: string,
//   ): Promise<void> {
//     for (let i = 0; i < validatedStudents.length; i++) {
//       const student = validatedStudents[i];
//       const link = studentLinks[i];

//       // Check if relationship already exists
//       const existingLink = await this.parentStudentRepository.findOne({
//         where: { parentId, studentId: student.id, tenantId },
//       });

//       if (existingLink) {
//         // Update existing relationship if needed
//         existingLink.relationship = link.relationship;
//         existingLink.isPrimary = link.isPrimary || false;
//         await this.parentStudentRepository.save(existingLink);
//       } else {
//         // Create new relationship
//         const parentStudent = this.parentStudentRepository.create({
//           parentId,
//           studentId: student.id,
//           relationship: link.relationship,
//           isPrimary: link.isPrimary || false,
//           tenantId,
//         });

//         await this.parentStudentRepository.save(parentStudent);
//       }
//     }
//   }

//   async findStudentByMultipleCriteria(
//     criteria: StudentLinkInput,
//     tenantId: string,
//   ): Promise<Student | null> {
//     const queryBuilder = this.studentRepository
//       .createQueryBuilder('student')
//       .leftJoinAndSelect('student.user', 'user')
//       .where('student.tenantId = :tenantId', { tenantId });

//     // If studentId is provided, prioritize it
//     if (criteria.studentId) {
//       queryBuilder.andWhere('student.id = :studentId', {
//         studentId: criteria.studentId,
//       });
//     }
//     // If admission number is provided
//     else if (criteria.admissionNumber) {
//       queryBuilder.andWhere('student.admission_number = :admissionNumber', {
//         admissionNumber: criteria.admissionNumber,
//       });
//     }
//     // If student name is provided
//     else if (criteria.studentName) {
//       queryBuilder.andWhere(
//         "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
//         { name: `%${criteria.studentName}%` },
//       );
//     }
//     // If phone is provided
//     else if (criteria.studentPhone) {
//       queryBuilder.andWhere('student.phone = :phone', {
//         phone: criteria.studentPhone,
//       });
//     }

//     // Add grade filter if provided
//     if (criteria.studentGrade) {
//       queryBuilder.andWhere('student.grade = :grade', {
//         grade: criteria.studentGrade,
//       });
//     }

//     return await queryBuilder.getOne();
//   }

//   async searchStudents(
//     searchInput: StudentSearchInput,
//     tenantId: string,
//   ): Promise<Student[]> {
//     const queryBuilder = this.studentRepository
//       .createQueryBuilder('student')
//       .leftJoinAndSelect('student.user', 'user')
//       .where('student.tenantId = :tenantId', { tenantId })
//       .andWhere('student.isActive = :isActive', { isActive: true });

//     if (searchInput.name) {
//       queryBuilder.andWhere(
//         "(LOWER(user.firstName) LIKE LOWER(:name) OR LOWER(user.lastName) LIKE LOWER(:name) OR LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name))",
//         { name: `%${searchInput.name}%` },
//       );
//     }

//     if (searchInput.admissionNumber) {
//       queryBuilder.andWhere('student.admission_number LIKE :admissionNumber', {
//         admissionNumber: `%${searchInput.admissionNumber}%`,
//       });
//     }

//     if (searchInput.phone) {
//       queryBuilder.andWhere('student.phone LIKE :phone', {
//         phone: `%${searchInput.phone}%`,
//       });
//     }

//     if (searchInput.grade) {
//       queryBuilder.andWhere('student.grade = :grade', {
//         grade: searchInput.grade,
//       });
//     }

//     return await queryBuilder.limit(20).getMany();
//   }

//   async findParentById(id: string, tenantId: string): Promise<Parent> {
//     const parent = await this.parentRepository.findOne({
//       where: { id, tenantId },
//       relations: [
//         'user',
//         'parentStudents',
//         'parentStudents.student',
//         'parentStudents.student.user',
//       ],
//     });

//     if (!parent) {
//       throw new NotFoundException('Parent not found');
//     }

//     return parent;
//   }

//   async findAllParents(tenantId: string): Promise<Parent[]> {
//     return await this.parentRepository.find({
//       where: { tenantId, isActive: true },
//       relations: [
//         'user',
//         'parentStudents',
//         'parentStudents.student',
//         'parentStudents.student.user',
//       ],
//       order: { createdAt: 'DESC' },
//     });
//   }

//   async updateParent(
//     id: string,
//     updateData: Partial<CreateParentInput>,
//     tenantId: string,
//   ): Promise<Parent> {
//     const parent = await this.findParentById(id, tenantId);

//     // Update basic parent info
//     Object.assign(parent, updateData);
//     await this.parentRepository.save(parent);

//     // Update user info if needed
//     if (
//       updateData.firstName ||
//       updateData.lastName ||
//       updateData.email ||
//       updateData.phone
//     ) {
//       const user = await this.userRepository.findOne({
//         where: { id: parent.userId },
//       });
//       if (user) {
//         if (updateData.firstName) user.firstName = updateData.firstName;
//         if (updateData.lastName) user.lastName = updateData.lastName;
//         if (updateData.email) user.email = updateData.email;
//         if (updateData.phone) user.phone = updateData.phone;
//         await this.userRepository.save(user);
//       }
//     }

//     return this.findParentById(id, tenantId);
//   }

//   async deleteParent(id: string, tenantId: string): Promise<boolean> {
//     const parent = await this.findParentById(id, tenantId);

//     // Soft delete by setting isActive to false
//     parent.isActive = false;
//     await this.parentRepository.save(parent);

//     // Also deactivate parent-student relationships
//     await this.parentStudentRepository.update(
//       { parentId: id, tenantId },
//       { isActive: false },
//     );

//     return true;
//   }
// }
