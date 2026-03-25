import { Request, Response } from 'express';
import { RoleType } from '../../src/modules/auth/enum/auth.enum';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: RoleType;
  };
}

export function createMockRequest(overrides?: Partial<AuthenticatedRequest>): AuthenticatedRequest {
  const request = {
    method: 'GET',
    url: '/',
    path: '/',
    headers: {},
    query: {},
    params: {},
    body: {},
    cookies: {},
    user: undefined,
    get: (header: string) => undefined,
    ...overrides,
  } as any;

  return request as AuthenticatedRequest;
}

export function createMockResponse(): Response {
  const response = {
    statusCode: 200,
    locals: {},
    jsonData: undefined,
    sentData: undefined,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as any;

  response.status.mockImplementation(function(this: any, code: number) {
    this.statusCode = code;
    return this;
  });

  response.json.mockImplementation(function(this: any, data: any) {
    this.jsonData = data;
    return this;
  });

  response.send.mockImplementation(function(this: any, data: any) {
    this.sentData = data;
    return this;
  });

  return response as Response;
}

export function createMockAuthenticatedRequest(
  overrides?: Partial<AuthenticatedRequest>,
): AuthenticatedRequest {
  const baseRequest = createMockRequest(overrides) as any;
  const authRequest: AuthenticatedRequest = {
    ...baseRequest,
    user: {
      id: 1,
      email: 'test@example.com',
      role: RoleType.USER,
      ...overrides?.user,
    },
  };

  return authRequest;
}
