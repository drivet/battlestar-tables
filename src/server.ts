import 'reflect-metadata';

import { app } from './app';
import { getPort } from './config';
import { getLogger } from './system/logging';

const logger = getLogger();

const port = getPort();
app.listen(port, () => logger.info(`Battlestar-tables listening at http://localhost:${port}`));
