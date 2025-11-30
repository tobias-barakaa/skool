import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SchoolType } from "../entities/school-type";
import { Repository } from "typeorm";
import { Subject } from "src/admin/subject/entities/subject.entity";
import { SubjectType } from "src/admin/subject/enums/subject.type.enum";
import { Curriculum } from "src/admin/curriculum/entities/curicula.entity";
import { CurriculumSubject } from "src/admin/curriculum/entities/curriculum_subjects.entity";
import { GradeLevel } from "src/admin/level/entities/grade-level.entity";
import { Level } from "src/admin/level/entities/level.entities";


@Injectable()
export class SeedingService {
  constructor(
    @InjectRepository(SchoolType) private schoolTypeRepo: Repository<SchoolType>,
    @InjectRepository(Curriculum) private curriculumRepo: Repository<Curriculum>,
    @InjectRepository(GradeLevel) private gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(Subject) private subjectRepo: Repository<Subject>,
    @InjectRepository(Level) private levelRepo: Repository<Level>,

    @InjectRepository(CurriculumSubject) private curriculumSubjectRepo: Repository<CurriculumSubject>,
  ) {}

  async seedAllSchoolTypes(): Promise<void> {
    console.log('Starting comprehensive school seeding...');

    const allSubjects = await this.createAllUniqueSubjects();

    // STEP 1: Seed SchoolTypes only (no levels yet)
    
    const cbcSchoolType = await this.schoolTypeRepo.save({ name: 'CBC', code: 'CBC' });
    const internationalSchool = await this.schoolTypeRepo.save({ name: 'International', code: 'INTL' });
    const madrasaSchool = await this.schoolTypeRepo.save({ name: 'Madrasa', code: 'MDR' });
    const homeschoolType = await this.schoolTypeRepo.save({ name: 'Homeschool', code: 'HMS' });

    // STEP 2: Seed Levels (reference schoolType in each)
    await this.levelRepo.save([
      { name: 'Pre-Primary', schoolType: cbcSchoolType },
      { name: 'Lower Primary', schoolType: cbcSchoolType },
      { name: 'Upper Primary', schoolType: cbcSchoolType },
      { name: 'Junior Secondary', schoolType: cbcSchoolType },
      { name: 'Senior Secondary', schoolType: cbcSchoolType },

      { name: 'IGCSE Early Years', schoolType: internationalSchool },
      { name: 'IGCSE Primary', schoolType: internationalSchool },
      { name: 'IGCSE Lower Secondary', schoolType: internationalSchool },
      { name: 'IGCSE Upper Secondary', schoolType: internationalSchool },
      { name: 'A Level', schoolType: internationalSchool },

      { name: 'Madrasa Beginners', schoolType: madrasaSchool },
      { name: 'Madrasa Lower', schoolType: madrasaSchool },
      { name: 'Madrasa Upper', schoolType: madrasaSchool },
      { name: 'Madrasa Secondary', schoolType: madrasaSchool },
      { name: 'Madrasa Advanced Alim', schoolType: madrasaSchool },

      { name: 'Homeschool Early Years', schoolType: homeschoolType },
      { name: 'Homeschool Lower Primary', schoolType: homeschoolType },
      { name: 'Homeschool Upper Primary', schoolType: homeschoolType },
      { name: 'Homeschool Junior Secondary', schoolType: homeschoolType },
      { name: 'Homeschool Senior Secondary', schoolType: homeschoolType }
    ]);

    // STEP 3: Seed each school’s full structure

    await this.seedCBCSchool(cbcSchoolType, allSubjects);
    await this.seedInternationalSchool(internationalSchool, allSubjects);
    await this.seedMadrasaSchool(madrasaSchool,allSubjects);
    await this.seedHomeschoolSystem(homeschoolType, allSubjects);

    console.log('✅ All school types and levels seeded successfully!');
  }


  // Creates all unique subjects across all school systems
  private async createAllUniqueSubjects(): Promise<Subject[]> {
    const uniqueSubjects = new Map<string, { name: string; code: string }>();

    // Helper function to add subject with generated code
    const addSubject = (name: string, customCode?: string) => {
      const code = customCode || this.generateSubjectCode(name);
      if (!uniqueSubjects.has(code)) {
        uniqueSubjects.set(code, { name, code });
      }
    };

    // CBC Subjects
    const cbcSubjects = [
      "Language Activities", "Mathematical Activities", "Environmental Activities",
      "Psychomotor and Creative Activities", "Religious Education Activities",
      "Literacy", "Kiswahili Language Activities", "English Language Activities",
      "Indigenous Language Activities", "Hygiene and Nutrition Activities",
      "Movement and Creative Activities", "English", "Kiswahili", "Mathematics",
      "Science and Technology", "Agriculture and Nutrition", "Social Studies",
      "Religious Education (CRE, IRE, HRE)", "Creative Arts", "Physical and Health Education",
      "Optional Foreign Languages (e.g. French, Arabic, Mandarin)", "Kiswahili or Kenya Sign Language",
      "Integrated Science", "Agriculture", "Religious Education", "Health Education",
      "Life Skills Education", "Pre-Technical and Pre-Career Education", "Sports and Physical Education",
      "Visual Arts", "Performing Arts", "Home Science", "Computer Science",
      "Foreign Languages (German, French, Mandarin, Arabic)", "Indigenous Languages",
      "Kenyan Sign Language", "Community Service Learning", "Physical Education",
      "Mathematics / Advanced Math", "Biology", "Chemistry", "Physics", "General Science",
      "Drawing and Design", "Aviation Technology", "Building and Construction",
      "Electrical Technology", "Metal Technology", "Power Mechanics", "Wood Technology",
      "Media Technology", "Marine and Fisheries Technology", "Literature in English",
      "Advanced English", "Kiswahili Kipevu", "History and Citizenship", "Geography",
      "Business Studies", "Religious Studies (CRE, IRE, HRE)", "Music and Dance",
      "Fine Art", "Theatre and Film", "Sports and Recreation", "Creative Writing"
    ];

    // IGCSE Subjects
    const igcseSubjects = [
      "Personal, Social and Emotional Development", "Communication and Language",
      "Understanding the World", "Expressive Arts and Design", "Physical Development",
      "Global Perspectives", "ICT Starters", "Art and Design", "Music", "Religious Education",
      "History", "Modern Foreign Languages (e.g. French, German, Mandarin)",
      "ICT / Computer Science", "Religious Studies", "English Language", "English Literature",
      "Business Studies", "Economics", "Accounting", "Design and Technology", "Drama",
      "Foreign Languages (French, German, Arabic, Mandarin, etc.)", "Computer Science",
      "Business", "Psychology", "Sociology", "Law", "Media Studies", "Drama and Theatre",
      "French", "German", "Arabic", "Mandarin", "Global Perspectives & Research",
      "Further Math"
    ];

    // Madrasa Subjects
    const madrasaSubjects = [
      "Qur'an Recitation (Juz Amma)", "Qaida (Arabic Alphabet)", "Basic Duas (Supplications)",
      "Short Surahs (Fatiha to Nas)", "Salah Movements (Physical Practice)",
      "Adab (Islamic Manners)", "Simple Arabic Vocabulary", "Qur'an Memorization (Juz 1–5)",
      "Tajweed Basics", "Arabic Reading & Writing", "Seerah (Prophet Muhammad's Life)",
      "Fiqh Basics (Purity, Wudhu, Prayer)", "Aqeedah (Pillars of Faith)", "Daily Duas",
      "Hadith Memorization (40 Nawawi)", "Qur'an Memorization (Juz 6–15)", "Tajweed Advanced",
      "Arabic Grammar (Nahw & Sarf Basics)", "Fiqh (Prayer, Fasting, Zakat, Hajj)",
      "Aqeedah (Names & Attributes of Allah)", "Seerah (Makkan & Madinan Period)",
      "Hadith Interpretation", "Islamic History (Sahaba & Khilafah)", "Islamic Etiquette (Adab)",
      "Qur'an Memorization (Juz 16–30)", "Tafsir (Selected Surahs)",
      "Advanced Arabic Reading & Composition", "Fiqh (Madh-hab Introduction)",
      "Usool al-Fiqh (Jurisprudence Principles)", "Aqeedah (Tawheed vs Shirk)",
      "Hadith Sciences", "Islamic Morals & Ethics", "Public Speaking / Khutbah Practice",
      "Islamic Leadership & Da'wah", "Comparative Religion", "Islamic Banking & Finance",
      "Arabic Calligraphy", "Advanced Tafsir (Ibn Kathir, Jalalayn)",
      "Uloom al-Hadith (Science of Hadith)", "Usool al-Tafsir", "Arabic Rhetoric (Balagha)",
      "Advanced Nahw & Sarf", "Islamic Jurisprudence (Detailed Fiqh)",
      "Comparative Fiqh (Shafi'i, Hanafi, etc.)", "Philosophical Theology (Kalam)",
      "Fatwa Writing & Research", "Khutbah Training & Da'wah Methodology"
    ];

    // Homeschool Subjects
    const homeschoolSubjects = [
      "Literacy (Reading & Phonics)", "Numeracy (Counting & Basic Math)",
      "Creative Arts (Drawing, Coloring, Singing)", "Life Skills (Toileting, Dressing, Manners)",
      "Religious Foundations (Optional)", "Nature & Environment Awareness",
      "Story Time / Read-Alouds", "English Language", "Kiswahili / Indigenous Language",
      "Environmental Studies / Science Basics", "Religious Education (Christian / Islamic / Other)",
      "Life Skills", "Creative Arts & Crafts", "Reading Comprehension",
      "Storytelling & Narration", "Kiswahili / KSL", "Science & Technology",
      "Social Studies (Kenya & the World)", "Creative & Performing Arts",
      "Digital Literacy / ICT", "Home Science / Cooking", "Pre-Tech Studies",
      "Computer Science", "Visual/Performing Arts", "Foreign Language (French, Arabic, etc.)",
      "Coding & Robotics", "Service Learning", "Advanced Math", "Literature",
      "Photography"
    ];

    // Add all subjects
    [...cbcSubjects, ...igcseSubjects, ...madrasaSubjects, ...homeschoolSubjects]
      .forEach(subject => addSubject(subject));

    // Create subjects in database
    const subjectsToCreate = Array.from(uniqueSubjects.values());
    return await this.subjectRepo.save(subjectsToCreate);
  }

  // Generate subject code from name
  // private generateSubjectCode(name: string): string {
  //   return name
  //     .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
  //     .split(' ')
  //     .map(word => word.substring(0, 3).toUpperCase())
  //     .join('_')
  //     .substring(0, 20); // Limit length
  // }
private generateSubjectCode(name: string): string {
  // clean unwanted chars
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();

  const words = clean.split(/\s+/);

  // 1. ONE WORD → first 3 letters
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }

  // 2. TWO WORDS → first letter of each + next meaningful letter(s)
  if (words.length === 2) {
    const [w1, w2] = words;

    const first = w1[0];
    const second = w2[0];

    // find next meaningful letter from first word
    const next = w1.length > 1 ? w1[1] : '';

    return (first + second + next).toUpperCase();
  }

  // 3. MORE THAN TWO WORDS → use first two words only (your examples match this)
  const [w1, w2] = words;

  const first = w1[0];
  const second = w2[0];
  const next = w1.length > 1 ? w1[1] : '';

  return (first + second + next).toUpperCase();
}

  // // Find subject by name
  // private findSubjectByName(subjects: Subject[], name: string): Subject | undefined {
  //   return subjects.find(s => s.name === name);
  // }

  private findSubjectByName(subjects: Subject[], name: string): Subject | undefined {
  const generatedCode = this.generateSubjectCode(name);
  return subjects.find(s => s.code === generatedCode);
}

  // CBC School Seeding

  async seedCBCSchool(
    cbcSchool: SchoolType, // 👈 receives SchoolType from main seeder
    allSubjects: Subject[]
  ): Promise<void> {


    const cbcCurricula = await this.curriculumRepo.save([
      
      { name: 'PrePrimary', code: 'PP', display_name: 'Pre-Primary', schoolType: cbcSchool },
      { name: 'LowerPrimary', code: 'LP', display_name: 'Lower Primary', schoolType: cbcSchool },
      { name: 'UpperPrimary', code: 'UP', display_name: 'Upper Primary', schoolType: cbcSchool },
      { name: 'JuniorSecondary', code: 'JS', display_name: 'Junior Secondary', schoolType: cbcSchool },
      { name: 'SeniorSecondary', code: 'SS', display_name: 'Senior Secondary', schoolType: cbcSchool }
    ]);

    // 1. Fetch SchoolLevels
// 1. Fetch Levels (not SchoolLevels anymore)
const prePrimary = await this.levelRepo.findOneByOrFail({ name: 'Pre-Primary' });
const lowerPrimary = await this.levelRepo.findOneByOrFail({ name: 'Lower Primary' });
const upperPrimary = await this.levelRepo.findOneByOrFail({ name: 'Upper Primary' });
const juniorSecondary = await this.levelRepo.findOneByOrFail({ name: 'Junior Secondary' });
const seniorSecondary = await this.levelRepo.findOneByOrFail({ name: 'Senior Secondary' });


// 2. Save GradeLevels with level field
await this.gradeLevelRepo.save([
  // Pre-Primary
  { name: 'Playgroup', code: 'PG', order: 0, curriculum: cbcCurricula[0], level: prePrimary },

  { name: 'PP1', code: 'PP1', order: 1, curriculum: cbcCurricula[0], level: prePrimary },
  { name: 'PP2', code: 'PP2', order: 2, curriculum: cbcCurricula[0], level: prePrimary },

  // Lower Primary
  { name: 'Grade 1', code: 'G1', order: 3, curriculum: cbcCurricula[1], level: lowerPrimary },
  { name: 'Grade 2', code: 'G2', order: 4, curriculum: cbcCurricula[1], level: lowerPrimary },
  { name: 'Grade 3', code: 'G3', order: 5, curriculum: cbcCurricula[1], level: lowerPrimary },

  // Upper Primary
  { name: 'Grade 4', code: 'G4', order: 6, curriculum: cbcCurricula[2], level: upperPrimary },
  { name: 'Grade 5', code: 'G5', order: 7, curriculum: cbcCurricula[2], level: upperPrimary },
  { name: 'Grade 6', code: 'G6', order: 8, curriculum: cbcCurricula[2], level: upperPrimary },

  // Junior Secondary
  { name: 'Grade 7', code: 'G7', order: 9, curriculum: cbcCurricula[3], level: juniorSecondary },
  { name: 'Grade 8', code: 'G8', order: 10, curriculum: cbcCurricula[3], level: juniorSecondary },
  { name: 'Grade 9', code: 'G9', order: 11, curriculum: cbcCurricula[3], level: juniorSecondary },

  // Senior Secondary
  { name: 'Grade 10', code: 'G10', order: 12, curriculum: cbcCurricula[4], level: seniorSecondary },
  { name: 'Grade 11', code: 'G11', order: 13, curriculum: cbcCurricula[4], level: seniorSecondary },
  { name: 'Grade 12', code: 'G12', order: 14, curriculum: cbcCurricula[4], level: seniorSecondary }
]);


        const allGradeLevels = await this.gradeLevelRepo.find({
  relations: ['curriculum'],
});
        await this.createCBCCurriculumSubjects(cbcCurricula, allSubjects, allGradeLevels);

  }

  async seedInternationalSchool(internationalSchool: SchoolType, allSubjects: Subject[]): Promise<void> {



    const curricula = await this.curriculumRepo.save([
      { name: 'IGCSE_EarlyYears', code: 'IGCSE_EY', display_name: 'IGCSE Early Years', schoolType: internationalSchool },
      { name: 'IGCSE_Primary', code: 'IGCSE_P', display_name: 'IGCSE Primary', schoolType: internationalSchool },
      { name: 'IGCSE_LowerSecondary', code: 'IGCSE_LS', display_name: 'IGCSE Lower Secondary', schoolType: internationalSchool },
      { name: 'IGCSE_UpperSecondary', code: 'IGCSE_US', display_name: 'IGCSE Upper Secondary', schoolType: internationalSchool },
      { name: 'A_Level', code: 'A_LVL', display_name: 'A Level', schoolType: internationalSchool }
    ]);

      // 2. Fetch level entities
  const earlyYears = await this.levelRepo.findOneByOrFail({ name: 'IGCSE Early Years' });
  const primary = await this.levelRepo.findOneByOrFail({ name: 'IGCSE Primary' });
  const lowerSecondary = await this.levelRepo.findOneByOrFail({ name: 'IGCSE Lower Secondary' });
  const upperSecondary = await this.levelRepo.findOneByOrFail({ name: 'IGCSE Upper Secondary' });
  const aLevel = await this.levelRepo.findOneByOrFail({ name: 'A Level' });

    // Create grade levels
    await this.gradeLevelRepo.save([
      // Early Years
      { name: 'Nursery', code: 'NUR', order: 1, curriculum: curricula[0], level: earlyYears },
      { name: 'Reception', code: 'REC', order: 2, curriculum: curricula[0], level: earlyYears },

      // Primary
      { name: 'Year 1', code: 'Y1', order: 3, curriculum: curricula[1], level: primary },
      { name: 'Year 2', code: 'Y2', order: 4, curriculum: curricula[1], level: primary },
      { name: 'Year 3', code: 'Y3', order: 5, curriculum: curricula[1], level: primary },
      { name: 'Year 4', code: 'Y4', order: 6, curriculum: curricula[1], level: primary },
      { name: 'Year 5', code: 'Y5', order: 7, curriculum: curricula[1], level: primary },
      { name: 'Year 6', code: 'Y6', order: 8, curriculum: curricula[1], level: primary },

      // Lower Secondary
      { name: 'Year 7', code: 'Y7', order: 9, curriculum: curricula[2], level: lowerSecondary },
      { name: 'Year 8', code: 'Y8', order: 10, curriculum: curricula[2], level: lowerSecondary },
      { name: 'Year 9', code: 'Y9', order: 11, curriculum: curricula[2], level: lowerSecondary },

      // Upper Secondary
      { name: 'Year 10', code: 'Y10', order: 12, curriculum: curricula[3], level: upperSecondary },
      { name: 'Year 11', code: 'Y11', order: 13, curriculum: curricula[3], level: upperSecondary },

      // A Level
      { name: 'Year 12', code: 'Y12', order: 14, curriculum: curricula[4], level: aLevel },
      { name: 'Year 13', code: 'Y13', order: 15, curriculum: curricula[4], level: aLevel },
    ]);



    const allGradeLevels = await this.gradeLevelRepo.find({
  relations: ['curriculum'],
});
    await this.createIGCSECurriculumSubjects(curricula, allSubjects, allGradeLevels);

  }

  // Madrasa School Seeding
  async seedMadrasaSchool(madrasaSchool:SchoolType, allSubjects:Subject[]): Promise<void> {


    const madrasaCurricula = await this.curriculumRepo.save([
      { name: 'Madrasa_Beginners', code: 'MDR_BEG', display_name: 'Madrasa Beginners', schoolType: madrasaSchool },
      { name: 'Madrasa_Lower', code: 'MDR_LOW', display_name: 'Madrasa Lower', schoolType: madrasaSchool },
      { name: 'Madrasa_Upper', code: 'MDR_UP', display_name: 'Madrasa Upper', schoolType: madrasaSchool },
      { name: 'Madrasa_Secondary', code: 'MDR_SEC', display_name: 'Madrasa Secondary', schoolType: madrasaSchool },
      { name: 'Madrasa_AdvancedAlim', code: 'MDR_ALM', display_name: 'Madrasa Advanced Alim', schoolType: madrasaSchool }
    ]);


    const beginners = await this.levelRepo.findOneByOrFail({ name: 'Madrasa Beginners' });
const lower = await this.levelRepo.findOneByOrFail({ name: 'Madrasa Lower' });
const upper = await this.levelRepo.findOneByOrFail({ name: 'Madrasa Upper' });
const secondary = await this.levelRepo.findOneByOrFail({ name: 'Madrasa Secondary' });
const advancedAlim = await this.levelRepo.findOneByOrFail({ name: 'Madrasa Advanced Alim' });


    // Create grade levels
    await this.gradeLevelRepo.save([
      // Beginners
        // Beginners
        { name: 'Duksi 1', code: 'DUK1', order: 1, curriculum: madrasaCurricula[0], level: beginners },
        { name: 'Duksi 2', code: 'DUK2', order: 2, curriculum: madrasaCurricula[0], level: beginners },
        { name: 'Duksi 3', code: 'DUK3', order: 3, curriculum: madrasaCurricula[0], level: beginners },

        // Lower
        { name: 'Level 1', code: 'L1', order: 4, curriculum: madrasaCurricula[1], level: lower },
        { name: 'Level 2', code: 'L2', order: 5, curriculum: madrasaCurricula[1], level: lower },
        { name: 'Level 3', code: 'L3', order: 6, curriculum: madrasaCurricula[1], level: lower },

        // Upper
        { name: 'Level 4', code: 'L4', order: 7, curriculum: madrasaCurricula[2], level: upper },
        { name: 'Level 5', code: 'L5', order: 8, curriculum: madrasaCurricula[2], level: upper },
        { name: 'Level 6', code: 'L6', order: 9, curriculum: madrasaCurricula[2], level: upper },

        // Secondary
        { name: 'Level 7', code: 'L7', order: 10, curriculum: madrasaCurricula[3], level: secondary },
        { name: 'Level 8', code: 'L8', order: 11, curriculum: madrasaCurricula[3], level: secondary },
        { name: 'Level 9', code: 'L9', order: 12, curriculum: madrasaCurricula[3], level: secondary },

        // Advanced Alim
        { name: 'Alim Year 1', code: 'ALM1', order: 13, curriculum: madrasaCurricula[4], level: advancedAlim },
        { name: 'Alim Year 2', code: 'ALM2', order: 14, curriculum: madrasaCurricula[4], level: advancedAlim },
        { name: 'Alim Year 3', code: 'ALM3', order: 15, curriculum: madrasaCurricula[4], level: advancedAlim },
        { name: 'Final Year', code: 'FIN', order: 16, curriculum: madrasaCurricula[4], level: advancedAlim }
      ]);


    const allGradeLevels = await this.gradeLevelRepo.find({
  relations: ['curriculum'],
});
    await this.createMadrasaCurriculumSubjects(madrasaCurricula, allSubjects, allGradeLevels);

  }

  // Homeschool System Seeding
  async seedHomeschoolSystem(homeschoolType:SchoolType, allSubjects: Subject[]): Promise<void> {


    const homeschoolCurricula = await this.curriculumRepo.save([
      { name: 'Homeschool_EarlyYears', code: 'HMS_EY', display_name: 'Homeschool Early Years', schoolType: homeschoolType },
      { name: 'Homeschool_LowerPrimary', code: 'HMS_LP', display_name: 'Homeschool Lower Primary', schoolType: homeschoolType },
      { name: 'Homeschool_UpperPrimary', code: 'HMS_UP', display_name: 'Homeschool Upper Primary', schoolType: homeschoolType },
      { name: 'Homeschool_JuniorSecondary', code: 'HMS_JS', display_name: 'Homeschool Junior Secondary', schoolType: homeschoolType },
      { name: 'Homeschool_SeniorSecondary', code: 'HMS_SS', display_name: 'Homeschool Senior Secondary', schoolType: homeschoolType }
    ]);

    // 1. Fetch Levels (assumes Level table already seeded)
const earlyYears = await this.levelRepo.findOneByOrFail({ name: 'Homeschool Early Years' });
const lowerPrimary = await this.levelRepo.findOneByOrFail({ name: 'Homeschool Lower Primary' });
const upperPrimary = await this.levelRepo.findOneByOrFail({ name: 'Homeschool Upper Primary' });
const juniorSecondary = await this.levelRepo.findOneByOrFail({ name: 'Homeschool Junior Secondary' });
const seniorSecondary = await this.levelRepo.findOneByOrFail({ name: 'Homeschool Senior Secondary' });



// 2. Save GradeLevels with level field
await this.gradeLevelRepo.save([
  // Early Years
  { name: 'Pre-K', code: 'PRK', order: 1, curriculum: homeschoolCurricula[0], level: earlyYears },
  { name: 'Kindergarten', code: 'KIN', order: 2, curriculum: homeschoolCurricula[0], level: earlyYears },

  // Lower Primary
  { name: 'Grade 1', code: 'HG1', order: 3, curriculum: homeschoolCurricula[1], level: lowerPrimary },
  { name: 'Grade 2', code: 'HG2', order: 4, curriculum: homeschoolCurricula[1], level: lowerPrimary },
  { name: 'Grade 3', code: 'HG3', order: 5, curriculum: homeschoolCurricula[1], level: lowerPrimary },

  // Upper Primary
  { name: 'Grade 4', code: 'HG4', order: 6, curriculum: homeschoolCurricula[2], level: upperPrimary },
  { name: 'Grade 5', code: 'HG5', order: 7, curriculum: homeschoolCurricula[2], level: upperPrimary },
  { name: 'Grade 6', code: 'HG6', order: 8, curriculum: homeschoolCurricula[2], level: upperPrimary },

  // Junior Secondary
  { name: 'Grade 7', code: 'HG7', order: 9, curriculum: homeschoolCurricula[3], level: juniorSecondary },
  { name: 'Grade 8', code: 'HG8', order: 10, curriculum: homeschoolCurricula[3], level: juniorSecondary },
  { name: 'Grade 9', code: 'HG9', order: 11, curriculum: homeschoolCurricula[3], level: juniorSecondary },

  // Senior Secondary
  { name: 'Grade 10', code: 'HG10', order: 12, curriculum: homeschoolCurricula[4], level: seniorSecondary },
  { name: 'Grade 11', code: 'HG11', order: 13, curriculum: homeschoolCurricula[4], level: seniorSecondary },
  { name: 'Grade 12', code: 'HG12', order: 14, curriculum: homeschoolCurricula[4], level: seniorSecondary }
]);

    const allGradeLevels = await this.gradeLevelRepo.find({
  relations: ['curriculum'],
});

    await this.createHomeschoolCurriculumSubjects(homeschoolCurricula, allSubjects, allGradeLevels);
  }

  // CBC Curriculum Subjects Creation
  private async createCBCCurriculumSubjects(curricula: Curriculum[], allSubjects: Subject[], allGradeLevels: GradeLevel[]): Promise<void> {
    const toSave: CurriculumSubject[] = [];

    const mapSubjects = async (
      curriculumIndex: number,
      subjectNames: string[],
      subjectType: SubjectType
    ) => {
      const curriculum = curricula[curriculumIndex];
      // const grades = allGradeLevels.filter(g => g.curriculum.id === curriculum.id);
      const grades = allGradeLevels.filter(g => g.curriculum?.id === curriculum.id);


      for (const name of subjectNames) {
        const subject = this.findSubjectByName(allSubjects, name);
        if (!subject) continue;

        const curriculumSubject = this.curriculumSubjectRepo.create({
          subject,
          curriculum,
          subjectType,
          isCompulsory: true,
          totalMarks: 100,
          passingMarks: 40,
          creditHours: 3,
          availableGrades: grades,
        });

        toSave.push(curriculumSubject);
      }
    };

    // Pre-Primary
    await mapSubjects(0, [
      "Language Activities", "Mathematical Activities", "Environmental Activities",
      "Psychomotor and Creative Activities", "Religious Education Activities"
    ], SubjectType.CORE);

    // Lower Primary
    await mapSubjects(1, [
      "Literacy", "Kiswahili Language Activities", "English Language Activities",
      "Indigenous Language Activities", "Mathematical Activities", "Environmental Activities",
      "Hygiene and Nutrition Activities", "Religious Education Activities", "Movement and Creative Activities"
    ], SubjectType.CORE);

    // Upper Primary
    await mapSubjects(2, [
      "English", "Kiswahili", "Mathematics", "Science and Technology",
      "Agriculture and Nutrition", "Social Studies", "Religious Education (CRE, IRE, HRE)",
      "Creative Arts", "Physical and Health Education"
    ], SubjectType.CORE);

    await mapSubjects(2, [
      "Optional Foreign Languages (e.g. French, Arabic, Mandarin)"
    ], SubjectType.ELECTIVE);

    // Junior Secondary
    await mapSubjects(3, [
      "English", "Kiswahili or Kenya Sign Language", "Mathematics", "Integrated Science",
      "Social Studies", "Agriculture", "Religious Education", "Health Education",
      "Life Skills Education", "Pre-Technical and Pre-Career Education", "Sports and Physical Education"
    ], SubjectType.CORE);

    await mapSubjects(3, [
      "Visual Arts", "Performing Arts", "Home Science", "Computer Science",
      "Foreign Languages (German, French, Mandarin, Arabic)", "Indigenous Languages", "Kenyan Sign Language"
    ], SubjectType.ELECTIVE);

    // Senior Secondary – Core
    await mapSubjects(4, [
      "English", "Kiswahili or Kenya Sign Language", "Community Service Learning", "Physical Education"
    ], SubjectType.CORE);

    // Senior Secondary – STEM
    await mapSubjects(4, [
      "Mathematics / Advanced Math", "Biology", "Chemistry", "Physics", "General Science",
      "Agriculture", "Computer Science", "Home Science", "Drawing and Design", "Aviation Technology",
      "Building and Construction", "Electrical Technology", "Metal Technology", "Power Mechanics",
      "Wood Technology", "Media Technology", "Marine and Fisheries Technology"
    ], SubjectType.ELECTIVE);

    // Senior Secondary – Social Sciences
    await mapSubjects(4, [
      "Literature in English", "Advanced English", "Indigenous Languages", "Kiswahili Kipevu",
      "History and Citizenship", "Geography", "Business Studies", "Religious Studies (CRE, IRE, HRE)",
      "Foreign Languages (German, French, Mandarin, Arabic)", "Kenyan Sign Language"
    ], SubjectType.ELECTIVE);

    // Senior Secondary – Arts & Sports
    await mapSubjects(4, [
      "Music and Dance", "Fine Art", "Theatre and Film", "Sports and Recreation", "Creative Writing"
    ], SubjectType.ELECTIVE);

    await this.curriculumSubjectRepo.save(toSave);
  }

  // IGCSE Curriculum Subjects Creation
  private async createIGCSECurriculumSubjects(
    curricula: Curriculum[],
    allSubjects: Subject[],
    allGradeLevels: GradeLevel[]
  ): Promise<void> {
    const toSave: CurriculumSubject[] = [];

    const mapSubjects = async (
      curriculumIndex: number,
      subjectNames: string[],
      subjectType: SubjectType
    ) => {
      const curriculum = curricula[curriculumIndex];
      const grades = allGradeLevels.filter(g => g.curriculum.id === curriculum.id);

      for (const name of subjectNames) {
        const subject = this.findSubjectByName(allSubjects, name);
        if (!subject) continue;

        const curriculumSubject = this.curriculumSubjectRepo.create({
          subject,
          curriculum,
          subjectType,
          isCompulsory: subjectType === SubjectType.CORE || subjectType === SubjectType.COMPULSORY,
          totalMarks: 100,
          passingMarks: 40,
          creditHours: 3,
          availableGrades: grades,
        });

        toSave.push(curriculumSubject);
      }
    };

    // Early Years
    await mapSubjects(0, [
      "Personal, Social and Emotional Development", "Communication and Language",
      "Literacy", "Mathematics", "Understanding the World",
      "Expressive Arts and Design", "Physical Development"
    ], SubjectType.CORE);

    // Primary
    await mapSubjects(1, [
      "English", "Mathematics", "Science", "Global Perspectives", "ICT Starters",
      "Art and Design", "Music", "Physical Education", "Religious Education", "History", "Geography"
    ], SubjectType.CORE);

    await mapSubjects(1, [
      "Modern Foreign Languages (e.g. French, German, Mandarin)"
    ], SubjectType.ELECTIVE);

    // Lower Secondary
    await mapSubjects(2, [
      "English", "Mathematics", "Science", "ICT / Computer Science", "History",
      "Geography", "Global Perspectives", "Art and Design", "Music", "Physical Education",
      "Religious Studies", "Modern Foreign Languages (e.g. French, German, Mandarin)"
    ], SubjectType.CORE);

    // Upper Secondary
    await mapSubjects(3, [
      "English Language", "English Literature", "Mathematics",
      "Biology", "Chemistry", "Physics", "ICT / Computer Science"
    ], SubjectType.CORE);

    await mapSubjects(3, [
      "Business Studies", "Economics", "Accounting", "History", "Geography",
      "Art and Design", "Design and Technology", "Drama", "Music", "Religious Studies",
      "Global Perspectives", "Physical Education",
      "Foreign Languages (French, German, Arabic, Mandarin, etc.)"
    ], SubjectType.ELECTIVE);

    // A Level
    await mapSubjects(4, [
      "English Language or Literature", "Mathematics or Further Math (for STEM students)"
    ], SubjectType.COMPULSORY);

    await mapSubjects(4, [
      "Biology", "Chemistry", "Physics", "Computer Science", "Economics", "Business",
      "Accounting", "Geography", "History", "Psychology", "Sociology", "Law",
      "Art and Design", "Media Studies", "Drama and Theatre", "Music", "Physical Education",
      "French", "German", "Arabic", "Mandarin", "Global Perspectives & Research"
    ], SubjectType.ELECTIVE);

    await this.curriculumSubjectRepo.save(toSave);
  }

  private async createMadrasaCurriculumSubjects(
    curricula: Curriculum[],
    allSubjects: Subject[],
    allGradeLevels: GradeLevel[]
  ): Promise<void> {
    const toSave: CurriculumSubject[] = [];

    const mapSubjects = async (
      curriculumIndex: number,
      subjectNames: string[],
      subjectType: SubjectType
    ) => {
      const curriculum = curricula[curriculumIndex];
      const grades = allGradeLevels.filter(g => g.curriculum.id === curriculum.id);

      for (const name of subjectNames) {
        const subject = this.findSubjectByName(allSubjects, name);
        if (!subject) continue;

        const curriculumSubject = this.curriculumSubjectRepo.create({
          subject,
          curriculum,
          subjectType,
          isCompulsory: subjectType === SubjectType.CORE || subjectType === SubjectType.COMPULSORY,
          totalMarks: 100,
          passingMarks: 40,
          creditHours: 3,
          availableGrades: grades
        });

        toSave.push(curriculumSubject);
      }
    };

    // Beginners
    await mapSubjects(0, [
      "Qur'an Recitation (Juz Amma)", "Qaida (Arabic Alphabet)", "Basic Duas (Supplications)",
      "Short Surahs (Fatiha to Nas)", "Salah Movements (Physical Practice)",
      "Adab (Islamic Manners)", "Simple Arabic Vocabulary"
    ], SubjectType.CORE);

    // Lower
    await mapSubjects(1, [
      "Qur'an Memorization (Juz 1–5)", "Tajweed Basics", "Arabic Reading & Writing",
      "Seerah (Prophet Muhammad's Life)", "Fiqh Basics (Purity, Wudhu, Prayer)",
      "Aqeedah (Pillars of Faith)", "Daily Duas", "Hadith Memorization (40 Nawawi)"
    ], SubjectType.CORE);

    // Upper
    await mapSubjects(2, [
      "Qur'an Memorization (Juz 6–15)", "Tajweed Advanced", "Arabic Grammar (Nahw & Sarf Basics)",
      "Fiqh (Prayer, Fasting, Zakat, Hajj)", "Aqeedah (Names & Attributes of Allah)",
      "Seerah (Makkan & Madinan Period)", "Hadith Interpretation", "Islamic History (Sahaba & Khilafah)",
      "Islamic Etiquette (Adab)"
    ], SubjectType.CORE);

    // Secondary core
    await mapSubjects(3, [
      "Qur'an Memorization (Juz 16–30)", "Tafsir (Selected Surahs)",
      "Advanced Arabic Reading & Composition", "Fiqh (Madh-hab Introduction)",
      "Usool al-Fiqh (Jurisprudence Principles)", "Aqeedah (Tawheed vs Shirk)",
      "Hadith Sciences", "Islamic Morals & Ethics", "Public Speaking / Khutbah Practice"
    ], SubjectType.CORE);

    // Secondary electives
    await mapSubjects(3, [
      "Islamic Leadership & Da'wah", "Comparative Religion", "Islamic Banking & Finance", "Arabic Calligraphy"
    ], SubjectType.ELECTIVE);

    // Alim
    await mapSubjects(4, [
      "Advanced Tafsir (Ibn Kathir, Jalalayn)", "Uloom al-Hadith (Science of Hadith)",
      "Usool al-Tafsir", "Arabic Rhetoric (Balagha)", "Advanced Nahw & Sarf",
      "Islamic Jurisprudence (Detailed Fiqh)", "Comparative Fiqh (Shafi'i, Hanafi, etc.)",
      "Philosophical Theology (Kalam)", "Fatwa Writing & Research", "Khutbah Training & Da'wah Methodology"
    ], SubjectType.CORE);

    await this.curriculumSubjectRepo.save(toSave);
  }


  private async createHomeschoolCurriculumSubjects(
    curricula: Curriculum[],
    allSubjects: Subject[],
    allGradeLevels: GradeLevel[]
  ): Promise<void> {
    const toSave: CurriculumSubject[] = [];

    const mapSubjects = async (
      curriculumIndex: number,
      subjectNames: string[],
      subjectType: SubjectType
    ) => {
      const curriculum = curricula[curriculumIndex];
      const grades = allGradeLevels.filter(g => g.curriculum.id === curriculum.id);


      for (const name of subjectNames) {
        const subject = this.findSubjectByName(allSubjects, name);
        if (!subject) continue;

        const curriculumSubject = this.curriculumSubjectRepo.create({
          subject,
          curriculum,
          subjectType,
          isCompulsory: subjectType === SubjectType.CORE || subjectType === SubjectType.COMPULSORY,
          totalMarks: 100,
          passingMarks: 40,
          creditHours: 3,
          availableGrades: grades
        });

        toSave.push(curriculumSubject);
      }
    };

    // Early Years
    await mapSubjects(0, [
      "Literacy (Reading & Phonics)", "Numeracy (Counting & Basic Math)",
      "Creative Arts (Drawing, Coloring, Singing)", "Life Skills (Toileting, Dressing, Manners)",
      "Religious Foundations (Optional)", "Nature & Environment Awareness", "Story Time / Read-Alouds"
    ], SubjectType.CORE);

    // Lower Primary
    await mapSubjects(1, [
      "English Language", "Kiswahili / Indigenous Language", "Mathematics",
      "Environmental Studies / Science Basics", "Religious Education (Christian / Islamic / Other)",
      "Life Skills", "Creative Arts & Crafts", "Reading Comprehension", "Storytelling & Narration"
    ], SubjectType.CORE);

    // Upper Primary
    await mapSubjects(2, [
      "English", "Kiswahili / KSL", "Mathematics", "Science & Technology",
      "Social Studies (Kenya & the World)", "Religious Education", "Creative & Performing Arts",
      "Physical Education", "Digital Literacy / ICT", "Home Science / Cooking"
    ], SubjectType.CORE);

    // Junior Secondary core
    await mapSubjects(3, [
      "English", "Kiswahili / KSL", "Mathematics", "Integrated Science",
      "Social Studies", "Agriculture", "Religious Education", "Life Skills",
      "Pre-Tech Studies", "Physical Education"
    ], SubjectType.CORE);

    // Junior Secondary optional
    await mapSubjects(3, [
      "Computer Science", "Visual/Performing Arts", "Home Science",
      "Foreign Language (French, Arabic, etc.)", "Coding & Robotics"
    ], SubjectType.ELECTIVE);

    // Senior Secondary core
    await mapSubjects(4, [
      "English", "Mathematics", "Religious Studies", "Physical Education", "Service Learning"
    ], SubjectType.CORE);

    // Senior Secondary STEM
    await mapSubjects(4, [
      "Biology", "Chemistry", "Physics", "Computer Science", "Advanced Math"
    ], SubjectType.ELECTIVE);

    // Senior Secondary Humanities
    await mapSubjects(4, [
      "Geography", "History", "Business Studies", "Literature", "Sociology", "Economics"
    ], SubjectType.ELECTIVE);

    // Senior Secondary Creative Pathway
    await mapSubjects(4, [
      "Fine Art", "Music", "Film and Theatre", "Creative Writing", "Photography"
    ], SubjectType.ELECTIVE);

    await this.curriculumSubjectRepo.save(toSave);
  }

}