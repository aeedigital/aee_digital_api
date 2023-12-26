import { Validate } from 'class-validator';

// Custom validator
export function IsStringOrBoolean() {
  return function (object: any, propertyName: string) {
    Validate(
      (value: any) => {
        if (typeof value === 'string') {
          return ['true', 'false'].includes(value.toLowerCase());
        } else if (typeof value === 'boolean') {
          return true;
        }
        return false;
      },
      {
        message:
          'IS_REQUIRED must be a boolean or a string containing a boolean value',
      },
    )(object, propertyName);
  };
}
