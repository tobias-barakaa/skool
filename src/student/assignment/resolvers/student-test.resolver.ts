import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AuthenticationGuard } from 'src/admin/auth/guards/fdfdf/authentication.guard';
import { Test } from 'src/teacher/test/entities/test.entity';
import { StudentTestProvider } from '../providers/student-test.provider';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { TestCountsOutput } from '../dtos/test-counts.output';

@Resolver(() => Test)
export class StudentTestResolver {
  constructor(private readonly studentTestService: StudentTestProvider) {}

  /**
   * Query: Get all tests/assignments for the logged-in student
   * Returns tests that are assigned to the student's grade level
   * 
   * @example
   * query GetMyTests {
   *   getMyTests {
   *     id
   *     title
   *     subject { id name }
   *     gradeLevels { id gradeLevel { name } }
   *     date
   *     startTime
   *     endTime
   *     duration
   *     totalMarks
   *     status
   *     instructions
   *     resourceUrl
   *     teacher { id fullName email }
   *     questions {
   *       id
   *       text
   *       type
   *       marks
   *       order
   *       options {
   *         id
   *         text
   *         order
   *       }
   *     }
   *     referenceMaterials {
   *       id
   *       fileUrl
   *       fileType
   *       fileSize
   *     }
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
  @Query(() => [Test], {
    name: 'getMyTests',
    description: 'Get all tests/assignments for the logged-in student based on their grade level',
  })
  async getMyTests(@ActiveUser() student: ActiveUserData): Promise<Test[]> {
    return this.studentTestService.getStudentTests(student);
  }

  /**
   * Query: Get a single test by ID for the logged-in student
   * Student must be in a grade level that the test is assigned to
   * 
   * @example
   * query GetMyTestById {
   *   getMyTestById(id: "2a778ba8-f64a-4a72-9f39-6c8726d2006e") {
   *     id
   *     title
   *     subject { id name }
   *     gradeLevels { id gradeLevel { name } }
   *     date
   *     startTime
   *     endTime
   *     duration
   *     totalMarks
   *     status
   *     instructions
   *     resourceUrl
   *     teacher { 
   *       id 
   *       fullName 
   *       email 
   *       department 
   *     }
   *     questions {
   *       id
   *       text
   *       imageUrls
   *       type
   *       marks
   *       order
   *       isAIGenerated
   *       options {
   *         id
   *         text
   *         imageUrl
   *         order
   *       }
   *     }
   *     referenceMaterials {
   *       id
   *       fileUrl
   *       fileType
   *       fileSize
   *       createdAt
   *     }
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
  @Query(() => Test, {
    name: 'getMyTestById',
    description: 'Get a single test by ID for the logged-in student',
  })
  async getMyTestById(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() student: ActiveUserData,
  ): Promise<Test> {
    return this.studentTestService.getStudentTestById(id, student);
  }

  /**
   * Query: Get test counts by status for the logged-in student
   * Returns total, pending, active, and completed test counts
   * 
   * @example
   * query GetMyTestCounts {
   *   getMyTestCounts {
   *     total
   *     pending
   *     active
   *     completed
   *   }
   * }
   */
  @Query(() => TestCountsOutput, {
    name: 'getMyTestCounts',
    description: 'Get test counts by status for the logged-in student',
  })
  async getMyTestCounts(
    @ActiveUser() student: ActiveUserData,
  ): Promise<TestCountsOutput> {
    return this.studentTestService.getStudentTestCounts(student);
  }

  /**
   * Query: Get upcoming tests (within next 7 days) for the logged-in student
   * Only returns tests with 'pending' or 'active' status
   * 
   * @example
   * query GetMyUpcomingTests {
   *   getMyUpcomingTests {
   *     id
   *     title
   *     subject { id name }
   *     date
   *     startTime
   *     duration
   *     totalMarks
   *     status
   *     teacher { fullName }
   *   }
   * }
   */
  @Query(() => [Test], {
    name: 'getMyUpcomingTests',
    description: 'Get upcoming tests (within next 7 days) for the logged-in student',
  })
  async getMyUpcomingTests(
    @ActiveUser() student: ActiveUserData,
  ): Promise<Test[]> {
    return this.studentTestService.getUpcomingTests(student);
  }

  /**
   * Query: Get tests filtered by status for the logged-in student
   * Status can be: 'pending', 'active', or 'completed'
   * 
   * @example
   * query GetMyTestsByStatus {
   *   getMyTestsByStatus(status: "active") {
   *     id
   *     title
   *     subject { id name }
   *     date
   *     startTime
   *     duration
   *     totalMarks
   *     status
   *     questions {
   *       id
   *       text
   *       marks
   *     }
   *   }
   * }
   */
  @Query(() => [Test], {
    name: 'getMyTestsByStatus',
    description: 'Get tests filtered by status for the logged-in student',
  })
  async getMyTestsByStatus(
    @Args('status', { type: () => String }) status: 'pending' | 'active' | 'completed',
    @ActiveUser() student: ActiveUserData,
  ): Promise<Test[]> {
    return this.studentTestService.getTestsByStatus(status, student);
  }
}