import { registerEnumType } from "@nestjs/graphql";

export enum AssesStatus {
  UPCOMING = 'UPCOMING',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}


registerEnumType(AssesStatus, {
  name: 'AssesStatus',
  description: 'The status of assessment',
});
