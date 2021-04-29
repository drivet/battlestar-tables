import express, { NextFunction, Request, Response } from 'express';
import expressWinston from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';
import winston from 'winston';

import { RegisterRoutes } from './generated/routes';
import { setupIocContainer } from './ioc/config';

setupIocContainer();

export const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.colorize(), winston.format.prettyPrint()),
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: true,
  })
);

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
    console.log(`ddddd ${JSON.stringify(err)}`);
    return res.status(422).json({
      message: 'Validation Failed',
      details: err?.fields,
    });
  } else {
    next(err);
  }
});

app.use(
  expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.colorize(), winston.format.json()),
  })
);
