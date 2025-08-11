import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { GraphQLResolveInfo } from 'graphql';
import { UseGuards, Logger, UseInterceptors } from '@nestjs/common';
import { SchoolConfigService } from '../services/school-config.service';
import { SchoolConfigurationResponse } from '../dtos/config/school-configuration.response';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

@Resolver()
export class SchoolConfigResolver {
  private readonly logger = new Logger(SchoolConfigResolver.name);

  constructor(private readonly schoolConfigService: SchoolConfigService) {}

  @Mutation(() => SchoolConfigurationResponse)
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @ActiveUser() user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    this.logger.log(
      `GraphQL mutation configureSchoolLevelsByNames called by user ${user.sub}`,
    );
    return await this.schoolConfigService.configureSchoolLevelsByNames(
      levelNames,
      user,
    );
  }

  @Query(() => SchoolConfigurationResponse)
  async getSchoolConfiguration(
    @ActiveUser() user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    this.logger.log(
      `GraphQL query getSchoolConfiguration called by user ${user.sub}`,
    );
    return await this.schoolConfigService.getSchoolConfiguration(user);
  }

  // @Query(() => SchoolConfigurationReadResponse, {
  //   nullable: true,
  //   description: 'Get basic school configuration without subjects and streams',
  // })
  // @UseInterceptors(CacheInterceptor)
  // // 1 hour cache for basic config
  // async getBasicSchoolConfiguration(
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<SchoolConfigurationReadResponse | null> {
  //   this.logger.log(
  //     `GraphQL query getBasicSchoolConfiguration called by user ${user.sub}`,
  //   );
  //   return await this.schoolConfigService.getBasicSchoolConfiguration(
  //     user.tenantId,
  //   );
  // }

  private getFieldNames(info: GraphQLResolveInfo): string[] {
    // Simple field name extraction - you might want to use a more sophisticated approach
    const fields: string[] = [];

    const extractFields = (selections: any[], prefix = '') => {
      selections?.forEach((selection) => {
        if (selection.selectionSet) {
          extractFields(
            selection.selectionSet.selections,
            `${prefix}${selection.name.value}.`,
          );
        } else {
          fields.push(`${prefix}${selection.name.value}`);
        }
      });
    };

    return fields;
  }
  // @Query(() => SchoolConfigurationResponse, { nullable: true })
  // async schoolConfiguration(
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<SchoolConfigurationResponse | null> {
  //   return await this.schoolConfigService.getSchoolConfiguration(user.tenantId);
  // }
}
function Info(): ParameterDecorator {
  return createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const gqlContext = ctx.getArgByIndex(2); // GraphQL context is usually the third argument
    return gqlContext.info as GraphQLResolveInfo;
  })();
}
