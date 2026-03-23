import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const createHost = (url = '/tasks') => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url }),
      }),
    } as unknown as ArgumentsHost;

    return { host, status, json };
  };

  it('formats BadRequestException with array messages', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/auth/register');

    filter.catch(
      new BadRequestException({
        message: ['email must be an email', 'password is too short'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/auth/register',
        error: 'Bad Request',
        message: 'email must be an email, password is too short',
      }),
    );
  });

  it('formats HttpException with string response body', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/tasks/unknown');

    filter.catch(
      new BadRequestException('Invalid task payload'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/tasks/unknown',
        message: 'Invalid task payload',
      }),
    );
  });

  it('formats generic errors as internal server error', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createHost('/gateway/tasks');

    filter.catch(new Error('Unexpected failure'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/gateway/tasks',
        error: 'Error',
        message: 'Unexpected failure',
      }),
    );
  });
});
