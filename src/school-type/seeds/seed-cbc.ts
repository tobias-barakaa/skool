import { DataSource } from 'typeorm';
import { SchoolType } from '../entities/school-type';
import { Level } from '../../level/entities/level.entities';
import { Grade } from '../../grade/entities/grade.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { SubjectCategory } from '../../subject/enums/subject.categories.enum';
import { SubjectType } from '../../subject/enums/subject.type.enum';
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
        Parent
        
        
        
      ],
    synchronize: true, // only for development
    ssl: {
      rejectUnauthorized: false, // for self-signed certs (Neon uses this setup)
    },
  });
  


const cbcLevels = {
  "pre-primary": {
    name: "Pre-primary",
    description: "Early childhood education for ages 4-5",
    grades: [
      { name: "Early Childhood", age: 3 },
      { name: "PP1", age: 4 },
      { name: "PP2", age: 5 }
    ],
    subjects: [
      "Language Activities",
      "Mathematical Activities",
      "Environmental Activities",
      "Psychomotor and Creative Activities",
      "Religious Education Activities"
    ]
  },
  "lower-primary": {
    name: "Lower Primary",
    description: "Foundation stage for ages 6-8",
    grades: [
      { name: "Grade 1", age: 6 },
      { name: "Grade 2", age: 7 },
      { name: "Grade 3", age: 8 }
    ],
    subjects: [
      "Literacy",
      "Kiswahili Language Activities",
      "English Language Activities",
      "Indigenous Language Activities",
      "Mathematical Activities",
      "Environmental Activities",
      "Hygiene and Nutrition Activities",
      "Religious Education Activities",
      "Movement and Creative Activities"
    ]
  },
  "upper-primary": {
    name: "Upper Primary",
    description: "Intermediate stage for ages 9-11",
    grades: [
      { name: "Grade 4", age: 9 },
      { name: "Grade 5", age: 10 },
      { name: "Grade 6", age: 11 }
    ],
    subjects: [
      "English",
      "Kiswahili",
      "Mathematics",
      "Science and Technology",
      "Agriculture and Nutrition",
      "Social Studies",
      "Religious Education (CRE, IRE, HRE)",
      "Creative Arts",
      "Physical and Health Education",
      "Optional Foreign Languages (e.g. French, Arabic, Mandarin)"
    ]
  },
  "junior-secondary": {
        name: "Junior Secondary",
        description: "Middle school stage for ages 12-14",
        grades: [
          { name: "Grade 7", age: 12 },
          { name: "Grade 8", age: 13 },
          { name: "Grade 9", age: 14 }
        ],
        subjects: {
          core: [
            "English",
            "Kiswahili or Kenya Sign Language",
            "Mathematics",
            "Integrated Science",
            "Social Studies",
            "Agriculture",
            "Religious Education (CRE, IRE, HRE)",
            "Health Education",
            "Life Skills Education",
            "Pre-Technical and Pre-Career Education",
            "Sports and Physical Education"
          ],
          optional: [
            "Visual Arts",
            "Performing Arts",
            "Home Science",
            "Computer Science",
            "Foreign Languages (German, French, Mandarin, Arabic)",
            "Indigenous Languages",
            "Kenyan Sign Language"
          ]
        }
      },
      "senior-secondary": {
        name: "Senior Secondary",
        description: "Advanced stage for ages 15-17",
        grades: [
          { name: "Grade 10", age: 15 },
          { name: "Grade 11", age: 16 },
          { name: "Grade 12", age: 17 }
        ],
        subjects: {
          core: [
            "English",
            "Kiswahili or Kenya Sign Language",
            "Community Service Learning",
            "Physical Education"
          ],
          pathways: {
            STEM: [
              "Mathematics / Advanced Math",
              "Biology",
              "Chemistry",
              "Physics",
              "General Science",
              "Agriculture",
              "Computer Studies",
              "Home Science",
              "Drawing and Design",
              "Aviation Technology",
              "Building and Construction",
              "Electrical Technology",
              "Metal Technology",
              "Power Mechanics",
              "Wood Technology",
              "Media Technology",
              "Marine and Fisheries Technology"
            ],
            SocialSciences: [
              "Literature in English",
              "Advanced English",
              "Indigenous Languages",
              "Kiswahili Kipevu",
              "History and Citizenship",
              "Geography",
              "Business Studies",
              "Religious Studies (CRE, IRE, HRE)",
              "Foreign Languages (French, German, Arabic, Mandarin)",
              "Kenyan Sign Language"
            ],
            ArtsAndSports: [
              "Music and Dance",
              "Fine Art",
              "Theatre and Film",
              "Sports and Recreation",
              "Creative Writing"
            ]
          }
        }
      },


};

async function seedCBC() {
  await AppDataSource.initialize();

  const schoolTypeRepo = AppDataSource.getRepository(SchoolType);
  const levelRepo = AppDataSource.getRepository(Level);
  const gradeRepo = AppDataSource.getRepository(Grade);
  const subjectRepo = AppDataSource.getRepository(Subject);
  const gradeLevelRepo = AppDataSource.getRepository(GradeLevel);


  const cbc = schoolTypeRepo.create({
    name: 'CBC School',
    description: 'A complete school offering education from pre-primary through senior secondary under the CBC',
    icon: '🏫',
    priority: 4
  });
  await schoolTypeRepo.save(cbc);

  for (const key of Object.keys(cbcLevels)) {
    const levelData = cbcLevels[key];
  
    const level = levelRepo.create({
      name: levelData.name,
      description: levelData.description,
      schoolType: cbc
    });
    await levelRepo.save(level);
  
    for (const gradeData of levelData.grades) {
      const gradeLevel = gradeLevelRepo.create({
        name: gradeData.name,
        age: gradeData.age,
        level: level,
      });
      await gradeLevelRepo.save(gradeLevel);
    }
  
    // ✅ Normalize subject names to flat array
    let subjectNames: string[] = [];
  
    if (Array.isArray(levelData.subjects)) {
      subjectNames = levelData.subjects;
    } else if (typeof levelData.subjects === 'object') {
      if (levelData.subjects.core) {
        subjectNames.push(...levelData.subjects.core);
      }
  
      if (Array.isArray(levelData.subjects.optional)) {
        subjectNames.push(...levelData.subjects.optional);
      }
  
      if (levelData.subjects.pathways) {
        for (const path of Object.values(levelData.subjects.pathways)) {
          if (Array.isArray(path)) {
            subjectNames.push(...path);
          }
        }
      }
    }
  
    for (const subjectName of subjectNames) {
      const subject = subjectRepo.create({
        subjectName,
        shortName: subjectName.split(' ')[0],
        category: SubjectCategory.CORE,
        department: 'General Studies',
        subjectType: SubjectType.THEORY,
        gradeLevel: [],
        isCompulsory: true,
        totalMarks: 100,
        passingMarks: 40,
        creditHours: 3,
        curriculum: ['CBC'],
        syllabus: '',
        learningOutcomes: [],
        textbooks: [],
        materials: [],
        prerequisiteSubjects: [],
        schoolId: 'default-school-id-here',
        level,
        isActive: true,
        isOffered: true,
        createdBy: 'system',
        classes: [],
        teachers: [],
        students: [],
        timetableSlots: [],
        name: subjectName,
        examSchedules: [],
      });
  
      await subjectRepo.save(subject);
    }
  }
  

  console.log('✅ CBC School type and levels seeded!');
  process.exit();
}

seedCBC().catch(err => {
  console.error('❌ Error during CBC seed:', err);
  process.exit(1);
});
