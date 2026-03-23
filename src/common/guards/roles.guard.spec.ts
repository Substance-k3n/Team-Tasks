import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'get'>>;
  let guard: RolesGuard;

  const createContext = (user?: { role?: UserRole }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    };

    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('returns true when route has no role metadata', () => {
    reflector.get.mockReturnValue(undefined);

    const canActivate = guard.canActivate(createContext());

    expect(canActivate).toBe(true);
  });

  it('throws when user is missing and role is required', () => {
    reflector.get.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext())).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext())).toThrow('User not authenticated');
  });

  it('throws when user does not have required role', () => {
    reflector.get.mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.MEMBER })),
    ).toThrow(ForbiddenException);
  });

  it('returns true when user has required role', () => {
    reflector.get.mockReturnValue([UserRole.ADMIN]);

    const canActivate = guard.canActivate(
      createContext({ role: UserRole.ADMIN }),
    );

    expect(canActivate).toBe(true);
  });
});
