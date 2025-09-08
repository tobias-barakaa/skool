import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isAfter', async: false })
export class IsAfter implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const startDate = (args.object as any)[relatedPropertyName];
    
    if (!startDate || !endDate) return false;
    
    return new Date(endDate) > new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}