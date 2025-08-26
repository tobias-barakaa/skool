import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { AssessType } from '../enums/assesment-type.enum';
import { AssesStatus } from '../enums/assesment-status.enum';

@ObjectType()
export class SubjectOutput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  static from(entity: any): SubjectOutput {
    const output = new SubjectOutput();
    output.id = entity.id;
    output.name = entity.name;
    return output;
  }
}

@ObjectType()
export class GradeLevelOutput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  static from(entity: any): GradeLevelOutput {
    const output = new GradeLevelOutput();
    output.id = entity.id;
    output.name = entity.name;
    return output;
  }
}

@ObjectType()
export class TenantGradeLevelOutput {
  @Field(() => ID)
  id: string;

  @Field(() => GradeLevelOutput, { nullable: true })
  gradeLevel?: GradeLevelOutput;

  static from(entity: any): TenantGradeLevelOutput {
    const output = new TenantGradeLevelOutput();
    output.id = entity.id;
    output.gradeLevel = entity.gradeLevel
      ? GradeLevelOutput.from(entity.gradeLevel)
      : undefined;
    return output;
  }
}

@ObjectType()
export class TenantSubjectOutput {
  @Field(() => ID)
  id: string;

  @Field(() => SubjectOutput, { nullable: true })
  subject?: SubjectOutput;

  static from(entity: any): TenantSubjectOutput {
    const output = new TenantSubjectOutput();
    output.id = entity.id;
    output.subject = entity.subject
      ? SubjectOutput.from(entity.subject)
      : undefined;
    return output;
  }
}

@ObjectType()
export class AssessmentOutput {
  @Field(() => ID)
  id: string;

  @Field(() => AssessType)
  type: AssessType;

  @Field()
  title: string;

  @Field(() => Float, { nullable: true })
  cutoff?: number;

  @Field(() => AssesStatus)
  status: AssesStatus;

  @Field()
  term: number;

  @Field()
  academicYear: string;

  @Field(() => Number, { nullable: true })
  maxScore?: number;

  @Field({ nullable: true })
  description?: string;

  @Field()
  tenantId: string;

  @Field(() => TenantGradeLevelOutput, { nullable: true })
  tenantGradeLevel?: TenantGradeLevelOutput;

  @Field(() => TenantSubjectOutput, { nullable: true })
  tenantSubject?: TenantSubjectOutput;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  static from(entity: any): AssessmentOutput {
    const output = new AssessmentOutput();
    output.id = entity.id;
    output.type = entity.type;
    output.title = entity.title;
    output.cutoff = entity.cutoff;
    output.status = entity.status;
    output.academicYear = entity.academicYear;
    output.term = entity.term;
    output.maxScore = entity.maxScore;
    output.description = entity.description;
    output.tenantId = entity.tenantId;
    output.tenantGradeLevel = entity.tenantGradeLevel
      ? TenantGradeLevelOutput.from(entity.tenantGradeLevel)
      : undefined;
    output.tenantSubject = entity.tenantSubject
      ? TenantSubjectOutput.from(entity.tenantSubject)
      : undefined;
    output.createdAt = entity.createdAt;
    output.updatedAt = entity.updatedAt;
    return output;
  }
}
