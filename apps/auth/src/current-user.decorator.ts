import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from './entities';

interface RequestWithUser {
  user?: User;
}

export const getCurrentUserByContext = (
  context: ExecutionContext,
): User | undefined => {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest<RequestWithUser>().user;
  }
  if (context.getType() === 'rpc') {
    return context.switchToRpc().getData<RequestWithUser>().user;
  }
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
