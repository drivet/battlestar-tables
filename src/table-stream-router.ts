import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { iocContainer } from './ioc/config';
import { TablesEmitter } from './services/tables-emitter';
import { expressAuthentication } from './system/authentication';

export const router = express.Router();

function handleStream<T>(req: Request, res: Response, emitter: TablesEmitter) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    // eslint-disable-next-line prettier/prettier
    'Connection': 'keep-alive'
  });

  const listener = (data: T) => {
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
  emitter.start(req.header('x-user'));
}

router.get('/tables/stream', (req: Request, res: Response) => {
  expressAuthentication(req, 'ApiKeyAuth');
  const emitter = iocContainer.get<TablesEmitter>(TablesEmitter);
  handleStream(req, res, emitter);
});
