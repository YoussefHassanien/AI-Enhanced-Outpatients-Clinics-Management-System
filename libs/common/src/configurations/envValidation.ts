import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

export const validateEnviornmentVariables = <T>(
  environmentVariables: ClassConstructor<T>,
  config: Record<string, unknown>,
): T => {
  const validatedConfig = plainToInstance(environmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig as object, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};
