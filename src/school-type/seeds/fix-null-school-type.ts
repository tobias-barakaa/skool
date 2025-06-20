// fix-null-school-type.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SchoolType } from '../entities/school-type';
import { Level } from '../../level/entities/level.entities';
import { Grade } from '../../grade/entities/grade.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { School } from '../../school/entities/school.entity';
import { Class } from '../../class/entities/class.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Student } from '../../student/entities/student.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { UserBranch } from '../../user-branch/entities/user-branch.entity';
import { SchoolManager } from '../../schoolmanager/entities/school-manager.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organizations-entity';
import { Parent } from '../../parent/entities/parent.entity';
import { SchoolLevelSetting } from '../../school-level-setting/entities/school-level-setting.entity';

// Adjust to your actual credentials
const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'ep-noisy-cherry-abc735si-pooler.eu-west-2.aws.neon.tech',
    port: 5432,
    username: 'skool_owner',
    password: 'npg_PSlKBLy5DJN2',
    database: 'skool',
    entities: [
        SchoolType,
        Level,
        Grade,
        Subject,
        GradeLevel,
        School,
        Attendance,
        Student,
        Teacher,
        Class,
        Branch,
        UserBranch,
        SchoolManager,
        User,
        Organization,
        Parent,
        SchoolLevelSetting
        
        
        
      ],
    synchronize: true, // only for development
    ssl: {
      rejectUnauthorized: false, // for self-signed certs (Neon uses this setup)
    },
  });
  


async function fixNullSchoolTypes() {
  await AppDataSource.initialize();
  const schoolRepo = AppDataSource.getRepository(School);
  const schoolTypeRepo = AppDataSource.getRepository(SchoolType);

  const defaultType = await schoolTypeRepo.findOneBy({ name: 'CBC School' });

  if (!defaultType) {
    console.error('❌ Default school type "CBC School" not found.');
    process.exit(1);
  }

  const result = await schoolRepo
    .createQueryBuilder()
    .update()
    .set({ schoolType: defaultType })
    .where('schoolTypeId IS NULL')
    .execute();

  console.log(`✅ Updated ${result.affected} school(s) with default type "CBC School"`);

  await AppDataSource.destroy();
}

fixNullSchoolTypes().catch((err) => {
  console.error('❌ Error updating school types:', err);
  process.exit(1);
});
