import 'reflect-metadata';

import { app } from './app';

const port = process.env.PORT || 3001;

app.listen(port, () => console.log(`Battlestar-tables listening at http://localhost:${port}`));
