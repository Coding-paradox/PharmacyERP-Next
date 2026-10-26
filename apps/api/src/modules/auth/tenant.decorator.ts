import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const pharmacyId = request.user?.pharmacyId;
    if (typeof pharmacyId !== 'string' || pharmacyId.trim().length === 0) {
      throw new UnauthorizedException('Aucune pharmacie associée à la session authentifiée.');
    }
    return pharmacyId;
  },
);
