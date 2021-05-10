import { ErrorRequestHandler, Handler } from 'express';
import expressWinston from 'express-winston';
import winston from 'winston';

const { combine, timestamp, label, printf } = winston.format;

const level = process.env.NODE_ENV !== 'production' ? 'debug' : 'info';

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export function getLogger(labelStr?: string): winston.Logger {
  const config = {
    format: combine(label({ label: labelStr ? labelStr : 'default' }), timestamp(), myFormat),
    level,
    transports: [new winston.transports.Console()],
  };
  return winston.createLogger(config);
}

export function getHttpLogger(): Handler {
  return expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: combine(label({ label: 'HTTP' }), timestamp(), myFormat),
    msg: '{{res.statusCode}} {{req.method}} {{req.url}}',
  });
}

export function getHttpErrorLogger(): ErrorRequestHandler {
  return expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: combine(label({ label: 'HTTP' }), timestamp(), myFormat),
  });
}
