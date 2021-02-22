import bodyParser from 'body-parser';
import express, { NextFunction, Request as ExRequest, Response as ExResponse } from 'express';
import swaggerUi from 'swagger-ui-express';
import { ValidateError } from 'tsoa';

import { RegisterRoutes } from './generated/routes';
import { setupIocContainer } from './ioc/config';

setupIocContainer();

export const app = express();

// Use body parser to read sent json payloads
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

app.use('/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
  return res.send(swaggerUi.generateHTML(await import('./generated/swagger.json')));
});

RegisterRoutes(app);

app.use((_req, res: ExResponse) => {
  res.status(404).send({
    message: 'Not Found',
  });
});

app.use((err: unknown, req: ExRequest, res: ExResponse, next: NextFunction): ExResponse | void => {
  if (err instanceof ValidateError) {
    return res.status(422).json({
      message: 'Validation Failed',
      details: err?.fields,
    });
  } else {
    next(err);
  }
});
