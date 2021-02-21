import * as express from 'express';

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scopes?: string[]
): Promise<boolean> {
  if (securityName !== 'ApiKeyAuth') {
    throw new Error(`Unknown security name: ${securityName}`);
  }

  const token = request.get('x-api-key');
  if (token === 'abc123456') {
    return true;
  } else {
    throw new Error('authentication error');
  }
}
