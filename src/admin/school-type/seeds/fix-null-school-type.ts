// fix-null-school-type.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { SchoolType } from '../entities/school-type';
import { Level } from '../../level/entities/level.entities';
import { Grade } from '../../grade/entities/grade.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { School } from '../../school/entities/school.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Student } from '../../student/entities/student.entity';
// import { Attendance } from '../../attendance/entities/attendance.entity';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organizations-entity';
import { Parent } from '../../parent/entities/parent.entity';
import { SchoolLevelSetting } from '../../school-level-setting/entities/school-level-setting.entity';


const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'host',
  port: 5432,
  username: 'owner',
  password: 'password',
  database: 'database_name',
  entities: [
    SchoolType,
    Level,
    Grade,
    Subject,
    GradeLevel,
    School,
    Student,
    Teacher,
    User,
    Organization,
    Parent,
    SchoolLevelSetting,
  ],
  synchronize: false, // ❗ safer — don't let this auto-sync in prod
  ssl: { rejectUnauthorized: false },
});

async function seedSchoolTypes() {
  const repo = AppDataSource.getRepository(SchoolType);

  const typesToSeed = [
    { code: 'CBC', name: 'CBC' },
    { code: 'INTL', name: 'International' },
    { code: 'MDR', name: 'Madrasa' },
    { code: 'HMS', name: 'Homeschool' },
  ];

  for (const type of typesToSeed) {
    let existing = await repo.findOneBy({ code: type.code });
    if (!existing) {
      await repo.save(type);
      console.log(`✅ Inserted school type: ${type.name}`);
    } else {
      console.log(`ℹ️ School type already exists: ${type.name}`);
    }
  }
}

AppDataSource.initialize()
  .then(async () => {
    console.log('📦 Database connected. Running seeder...');
    await seedSchoolTypes();
    console.log('✅ Seeding complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  });
