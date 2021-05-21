import { Container, decorate, injectable } from 'inversify';
import { Controller } from 'tsoa';

import { TablesEmitter } from '../services/tables-emitter';
import { getMongoClient } from '../system/mongo';
import { TableController } from './../controllers/table-controller';
import { TableService } from './../services/table-service';
import * as Symbols from './symbols';

export const iocContainer = new Container();

// Makes tsoa's Controller injectable
decorate(injectable(), Controller);

export function setupIocContainer(): void {
  iocContainer.bind(TableController).toSelf().inSingletonScope();
  iocContainer.bind(TableService).toSelf().inSingletonScope();
  iocContainer.bind(TablesEmitter).toSelf().inSingletonScope();
  iocContainer.bind(Symbols.MongoClient).toConstantValue(getMongoClient());
}
