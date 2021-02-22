import * as express from 'express';

import { getApiKey } from '../config';

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scopes?: string[]
): Promise<boolean> {
  if (securityName !== 'ApiKeyAuth') {
    throw new Error(`Unknown security name: ${securityName}`);
  }

  const token = request.get('x-api-key');
  if (token === getApiKey()) {
    return true;
  } else {
    throw new Error('authentication error');
  }
}
