// Service
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from 'src/school/entities/school.entity';
import { Subject } from 'src/subject/entities/subject.entity';
import { SubjectCategory } from 'src/subject/enums/subject.categories.enum';
import { SubjectType } from 'src/subject/enums/subject.type.enum';
import { AddCBCConfigInput } from '../dtos/add-config.input';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  private readonly cbcConfig = {
    name: "CBC School",
    description: "A complete school offering education from pre-primary through senior secondary under the CBC",
    icon: "🏫",
    priority: 4,
    menuItems: ["Home", "School", "Teachers", "Students", "Attendance", "Grading", "Library", "Finance"],
    levels: {
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
      }
    }
  };

  async addCBCConfiguration(input: AddCBCConfigInput, host: string, userId: string): Promise<Subject[]> {
    try {
      // Extract school name from host/domain
      const domain = host;
      if (!domain) {
        throw new BadRequestException('Unable to determine school domain');
      }

      console.log(domain, 'this is the host domain.........................')

      // Extract school name from domain (e.g., 'whats' from 'whats.squl.co.ke')
    //  let schoolName = 'tessdst-66.squl.co.ke'; // For testing purposes, hardcoded to 'whats.squl.co.ke'
     let schoolName = domain.split('.')[0];

      
      // Find school in database
      const school = await this.schoolRepository.findOne({
        where: { subdomain: schoolName }
      });

      console.log(school)
      if (!school) {
        throw new NotFoundException(`School with name '${schoolName}' not found`);
      }

      const createdSubjects: Subject[] = [];

      // Process each selected level
      for (const levelKey of input.levels) {
        const levelConfig = this.cbcConfig.levels[levelKey];
        
        if (!levelConfig) {
          throw new BadRequestException(`Invalid level: ${levelKey}`);
        }

        // Get subjects for this level
        const subjects = this.getSubjectsForLevel(levelKey, levelConfig);
        
        // Create subjects for this level
        for (const subjectData of subjects) {
          const existingSubject = await this.subjectRepository.findOne({
            where: { 
              subjectName: subjectData.name,
              schoolId: school.schoolId 
            }
          });

          if (!existingSubject) {
            const subject = this.subjectRepository.create({
              subjectCode: this.generateSubjectCode(subjectData.name, levelKey),
              subjectName: subjectData.name,
              shortName: this.generateShortName(subjectData.name),
              category: this.determineCategory(subjectData.name, subjectData.type),
              department: levelConfig.name,
              subjectType: this.determineSubjectType(subjectData.name, subjectData.type),
              gradeLevel: levelConfig.grades.map(grade => grade.name),
              isCompulsory: subjectData.isCompulsory || false,
              totalMarks: 100,
              passingMarks: 50,
              creditHours: 4,
              practicalHours: subjectData.practicalHours || null,
              curriculum: [`CBC ${levelConfig.name}`],
              syllabus: `CBC ${levelConfig.name} Syllabus`,
              learningOutcomes: [],
              textbooks: [],
              materials: [],
              prerequisiteSubjects: [],
              schoolId: school.schoolId,
              isActive: true,
              isOffered: true,
              createdBy: userId,
              classes: [],
              teachers: [],
              students: [],
              timetableSlots: [],
              examSchedules: []
            });

            const savedSubject = await this.subjectRepository.save(subject);
            createdSubjects.push(savedSubject);
          }
        }
      }

      return createdSubjects;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add CBC configuration: ${error.message}`);
    }
  }

  private getSubjectsForLevel(levelKey: string, levelConfig: any): any[] {
    const subjects: { name: string; type: string; isCompulsory: boolean }[] = [];

    if (levelKey === 'junior-secondary' || levelKey === 'senior-secondary') {
      // Handle levels with core and optional/pathway subjects
      if (levelConfig.subjects.core) {
        subjects.push(...levelConfig.subjects.core.map(subject => ({
          name: subject,
          type: 'core',
          isCompulsory: true
        })));
      }

      if (levelConfig.subjects.optional) {
        subjects.push(...levelConfig.subjects.optional.map(subject => ({
          name: subject,
          type: 'optional',
          isCompulsory: false
        })));
      }

      if (levelConfig.subjects.pathways) {
        Object.keys(levelConfig.subjects.pathways).forEach(pathway => {
          subjects.push(...levelConfig.subjects.pathways[pathway].map(subject => ({
            name: subject,
            type: pathway,
            isCompulsory: false
          })));
        });
      }
    } else {
      // Handle levels with simple subject arrays
      subjects.push(...levelConfig.subjects.map(subject => ({
        name: subject,
        type: 'core',
        isCompulsory: true
      })));
    }

    return subjects;
  }

  private generateSubjectCode(subjectName: string, level: string): string {
    const levelCode = level.toUpperCase().replace('-', '');
    const subjectCode = subjectName.replace(/[^A-Z]/g, '').substring(0, 3);
    return `${levelCode}-${subjectCode}-${Math.floor(Math.random() * 1000)}`;
  }

  private generateShortName(subjectName: string): string {
    return subjectName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 5);
  }

  private determineCategory(subjectName: string, type?: string): SubjectCategory {
    const name = subjectName.toLowerCase();
    
    if (name.includes('math') || name.includes('science') || name.includes('physics') || 
        name.includes('chemistry') || name.includes('biology') || name.includes('technology')) {
      return SubjectCategory.ADVANCED;
    }
    
    if (name.includes('english') || name.includes('literature') || name.includes('language') || 
        name.includes('kiswahili') || name.includes('indigenous')) {
      return SubjectCategory.ADVANCED;
    }
    
    if (name.includes('history') || name.includes('geography') || name.includes('social') || 
        name.includes('citizenship') || name.includes('business')) {
      return SubjectCategory.ADVANCED;
    }
    
    if (name.includes('art') || name.includes('music') || name.includes('creative') || 
        name.includes('theatre') || name.includes('dance') || name.includes('visual')) {
      return SubjectCategory.ADVANCED;
    }
    
    if (name.includes('physical') || name.includes('sports') || name.includes('health') || 
        name.includes('nutrition') || name.includes('hygiene')) {
      return SubjectCategory.ADVANCED;
    }
    
    if (name.includes('religious') || name.includes('cre') || name.includes('ire') || name.includes('hre')) {
      return SubjectCategory.ADVANCED;
    }
    
    return SubjectCategory.ADVANCED;
  }

  private determineSubjectType(subjectName: string, type?: string): SubjectType {
    const name = subjectName.toLowerCase();
    
    if (type === 'core' || name.includes('english') || name.includes('math') || name.includes('kiswahili')) {
      return SubjectType.ACADEMIC;
    }
    
    if (type === 'optional' || name.includes('optional') || name.includes('foreign language')) {
      return SubjectType.VOCATIONAL;
    }
    
    if (name.includes('technical') || name.includes('technology') || name.includes('computer') || 
        name.includes('building') || name.includes('electrical') || name.includes('mechanics')) {
      return SubjectType.VOCATIONAL;
    }
    
    if (name.includes('practical') || name.includes('laboratory') || name.includes('workshop')) {
      return SubjectType.PRACTICAL;
    }
    
    return SubjectType.ACADEMIC;
  }
}
