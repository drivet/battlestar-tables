import express, { NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';

import { RegisterRoutes } from './generated/routes';
import { setupIocContainer } from './ioc/config';
import { getHttpErrorLogger, getHttpLogger, getLogger } from './system/logging';

const logger = getLogger();

setupIocContainer();

export const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(getHttpLogger());

app.use('/docs', swaggerUi.serve, async (_req: Request, res: Response) => {
  return res.send(swaggerUi.generateHTML(await import('./generated/swagger.json')));
});

RegisterRoutes(app);

app.use((_req, res: Response) => {
  res.status(404).send({
    message: 'Not Found',
  });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction): Response | void => {
  if (err instanceof ValidateError) {
    logger.error(`${JSON.stringify(err)}`);
    return res.status(422).json({
      message: 'Validation Failed',
      details: err?.fields,
    });
  } else {
    next(err);
  }
});

app.use(getHttpErrorLogger());
