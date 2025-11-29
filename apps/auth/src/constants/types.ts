import { Role } from '@app/common';

export type JwtPayload = {
  sub: number;
  globalId: string;
  socialSecurityNumber: string;
  role: Role;
};
