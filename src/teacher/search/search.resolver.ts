import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { SearchService } from './search.service';
import {
  SearchStudentInput,
  FilterInput,
  SearchStudentResult,
  SearchTeacherResult,
  CombinedSearchResult,
  FilteredResult,
} from './dto/search.dto';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Stream } from 'src/admin/streams/entities/streams.entity';


@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}


  @Query(() => SearchStudentResult, {
    name: 'searchStudentsByName',
    description: 'Search for students by name within current user tenant',
  })
  async searchStudentsByName(
    @Args('input') input: SearchStudentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchStudentResult> {
    return this.searchService.searchStudentByName(input, user);
  }

  @Query(() => SearchTeacherResult, {
    name: 'searchTeachersByName',
    description: 'Search for teachers by name within current user tenant',
  })
  async searchTeachersByName(
    @Args('input') input: SearchStudentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchTeacherResult> {
    return this.searchService.searchTeacherByName(input, user);
  }

  @Query(() => SearchStudentResult, {
    name: 'getStudentsByTenant',
    description: 'Get all students for current user tenant',
  })
  async getStudentsByTenant(
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchStudentResult> {
    return this.searchService.getStudentsByTenant(user);
  }

  @Query(() => SearchTeacherResult, {
    name: 'getTeachersByTenant',
    description: 'Get all teachers for current user tenant',
  })
  async getTeachersByTenant(
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchTeacherResult> {
    return this.searchService.getTeachersByTenant(user);
  }

  @Query(() => CombinedSearchResult, {
    name: 'getBothStudentsAndTeachersByTenant',
    description: 'Get all students and teachers for current user tenant',
  })
  async getBothStudentsAndTeachersByTenant(
    @ActiveUser() user: ActiveUserData,
  ): Promise<CombinedSearchResult> {
    return this.searchService.getBothStudentsAndTeachersByTenant(user);
  }

  @Query(() => FilteredResult, {
    name: 'filterByGradeLevelAndSubjects',
    description: 'Filter students and teachers by grade levels, subjects, and streams',
  })
  async filterByGradeLevelAndSubjects(
    @Args('input') input: FilterInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FilteredResult> {
    return this.searchService.filterByGradeLevelAndSubjects(input, user);
  }

  @Query(() => [Stream], {
    name: 'getStreamsByTenant',
    description: 'Get all streams for current user tenant',
  })
  async getStreamsByTenant(
    @ActiveUser() user: ActiveUserData,
  ): Promise<Stream[]> {
    return this.searchService.getStreamsByTenant(user);
  }

  @Query(() => String, {
    name: 'getTenantStatistics',
    description: 'Get statistics for current user tenant (student count, teacher count, etc.)',
  })
  async getTenantStatistics(
    @ActiveUser() user: ActiveUserData,
  ): Promise<string> {
    const stats = await this.searchService.getTenantStatistics(user);
    return JSON.stringify(stats);
  }


  @Mutation(() => Boolean, {
    name: 'refreshSearchCache',
    description: 'Refresh search cache for current user tenant (placeholder for future caching)',
  })
  async refreshSearchCache(
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {

    console.log(`Refreshing cache for tenant: ${user}`);
    return true;
  }

  @Mutation(() => SearchStudentResult, {
    name: 'searchAndCacheStudents',
    description: 'Search students and cache results for performance',
  })
  async searchAndCacheStudents(
    @Args('input') input: SearchStudentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchStudentResult> {
    return this.searchService.searchStudentByName(input, user);
  }
  @Mutation(() => SearchTeacherResult, {
    name: 'searchAndCacheTeachers',
    description: 'Search teachers and cache results for performance',
  })
  async searchAndCacheTeachers(
    @Args('input') input: SearchStudentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<SearchTeacherResult> {

    return this.searchService.searchTeacherByName(input, user);
  }
}
