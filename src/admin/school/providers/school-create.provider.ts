import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { School } from '../entities/school.entity';
import { Organization } from 'src/admin/organizations/entities/organizations-entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { SCHOOL_TYPES_CONFIG } from '../config/school-type.config';

@Injectable()
export class SchoolCreateProvider {


}
