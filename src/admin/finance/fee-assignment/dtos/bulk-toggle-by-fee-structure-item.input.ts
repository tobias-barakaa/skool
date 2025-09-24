import { InputType, Field, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsUUID, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

@InputType({
  description: 'Input for bulk toggling fee items by fee structure item and grade levels'
})
export class BulkToggleByFeeStructureItemInput {
  @Field(() => ID, {
    description: 'The fee structure item ID to toggle for students'
  })
  @IsNotEmpty()
  @IsUUID()
  feeStructureItemId: string;

  @Field(() => [ID], {
    description: 'Array of grade level IDs to apply the toggle to'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  gradeLevelIds: string[];

  @Field(() => Boolean, {
    description: 'Whether to activate or deactivate the fee items'
  })
  @IsBoolean()
  isActive: boolean;
}