import { Injectable, Logger, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { School } from '../entities/school.entity';
import { BusinessException, SchoolAlreadyExistsException } from 'src/common/exceptions/business.exception';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { Student } from 'src/student/entities/student.entity';
import { SCHOOL_TYPES_CONFIG } from '../config/school-type.config';

@Injectable()
export class SchoolCreateProvider {
  

}