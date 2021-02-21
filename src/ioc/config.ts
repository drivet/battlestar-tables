import { Container, decorate, injectable } from 'inversify';
import { Controller } from 'tsoa';

import { TableController } from './../controllers/table-controller';
import { TableService } from './../services/table-service';

export const iocContainer = new Container();

// Makes tsoa's Controller injectable
decorate(injectable(), Controller);

export function setupIocContainer(): void {
  iocContainer.bind(TableController).toSelf().inSingletonScope();
  iocContainer.bind(TableService).toSelf().inSingletonScope();
}
