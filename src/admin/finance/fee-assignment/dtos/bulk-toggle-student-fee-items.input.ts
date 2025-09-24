import { InputType, Field, ID } from '@nestjs/graphql';
import { IsArray, IsBoolean, IsUUID, ArrayNotEmpty } from 'class-validator';

@InputType({
  description: 'Input for bulk toggling student fee items'
})
export class BulkToggleStudentFeeItemsInput {
  @Field(() => [ID], {
    description: 'Array of student fee item IDs to toggle'
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  studentFeeItemIds: string[];

  @Field(() => Boolean, {
    description: 'Whether to activate or deactivate the fee items'
  })
  @IsBoolean()
  isActive: boolean;
}
