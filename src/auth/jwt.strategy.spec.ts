import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('maps JWT payload to request user object', () => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    const strategy = new JwtStrategy(configService);

    const result = strategy.validate({
      sub: 'user-1',
      email: 'member@example.com',
      name: 'Member User',
      role: UserRole.MEMBER,
    });

    expect(result).toEqual({
      id: 'user-1',
      email: 'member@example.com',
      name: 'Member User',
      role: UserRole.MEMBER,
    });
  });

  it('throws when JWT_SECRET is missing', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => new JwtStrategy(configService)).toThrow(
      'JWT_SECRET is required',
    );
  });
});
