import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { iocContainer } from './ioc/config';
import { expressAuthentication } from './system/authentication';
import { getLogger } from './system/logging';
import { MongoChangeEmitter } from './system/mongo-emitter';

export const router = express.Router();

const logger = getLogger('Stream Router');

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function userStreamFilter(user: string) {
  return {
    $or: [
      { 'fullDocument.owner': user },
      { 'fullDocument.invitations.recipient': user },
      { operationType: 'delete' },
    ],
  };
}

function userTableMatchPipeline(user?: string): Record<string, unknown>[] | undefined {
  return user ? [{ $match: userStreamFilter(user) }] : undefined;
}

function handleStream<T>(req: Request, res: Response, emitter: MongoChangeEmitter) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    // eslint-disable-next-line prettier/prettier
    'Connection': 'keep-alive'
  });

  const listener = (data: T) => {
    logger.debug(`Got new data to send`);
    const id = uuidv4();
    const dataStr = `${JSON.stringify(data)}`;
    res.write(`id: ${id}\n`);
    res.write(`data: ${dataStr}\n`);
    res.write('\n\n');
  };

  emitter.on('data', listener);
  req.on('close', () => {
    emitter.off('data', listener);
  });
  emitter.start(userTableMatchPipeline(req.header('x-user')));
}

router.get('/tables/stream', (req: Request, res: Response) => {
  expressAuthentication(req, 'ApiKeyAuth');
  const emitter = iocContainer.get<MongoChangeEmitter>(MongoChangeEmitter);
  handleStream(req, res, emitter);
});
