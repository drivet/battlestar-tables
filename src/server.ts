import 'reflect-metadata';

import { app } from './app';
import { getPort } from './config';

const port = getPort();
app.listen(port, () =>
  console.log(`Battlestar-tables listening at http://localhost:${port}`)
);
