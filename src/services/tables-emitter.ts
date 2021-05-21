import { EventEmitter } from 'events';
import { decorate, inject, injectable } from 'inversify';
import {
  ChangeEvent,
  ChangeStream,
  ChangeStreamOptions,
  MongoClient,
  ResumeToken,
  Timestamp,
} from 'mongodb';

import * as Symbols from '../ioc/symbols';
import { getLogger } from '../system/logging';
import { Table } from './table-models';
import { TableService } from './table-service';
import { userTableFilter } from './table-utils';

decorate(injectable(), EventEmitter);

const logger = getLogger('TableEmitter');

@injectable()
export class TablesEmitter extends EventEmitter {
  private connected = false;

  constructor(
    @inject(Symbols.MongoClient) private readonly client: MongoClient,
    private readonly tableService: TableService
  ) {
    super();
  }

  async start(user?: string): Promise<void> {
    logger.debug('Starting table stream...');
    this.connect();
    const stampedTables = await this.tableService.getStampedTables(user);
    logger.debug(`Got stamped tables ${JSON.stringify(stampedTables)}`);
    this.emit('data', stampedTables.tables);
    this.streamFromTimestamp(Math.floor(stampedTables.date / 1000), user);
  }

  private streamFromTimestamp(from: number, user?: string) {
    logger.debug(`Streaming from timestamp: from: ${from}, user: ${user}`);
    const options = {
      fullDocument: 'updateLookup',
      // startAtOperationTime: Timestamp.fromNumber(from),
    } as ChangeStreamOptions;

    this.emitLoop(options, user);
  }

  private resumeStream(resumeToken: ResumeToken, user?: string) {
    logger.debug(`Resuming stream: from: user: ${user}`);
    const options = {
      fullDocument: 'updateLookup',
      resumeAfter: resumeToken,
    } as ChangeStreamOptions;

    this.emitLoop(options, user);
  }

  private emitLoop(options: ChangeStreamOptions, user?: string) {
    const watchCursor = this.getCursor(options);
    watchCursor.on('change', async (next: ChangeEvent<Table[]>) => {
      if (
        next.operationType === 'insert' ||
        next.operationType === 'replace' ||
        next.operationType === 'update'
      ) {
        this.emit('data', next.fullDocument);
      } else if (next.operationType === 'delete') {
        const resumeAfter = watchCursor.resumeToken;
        watchCursor.close();
        this.emit('data', await this.tableService.getTables(user));
        this.resumeStream(resumeAfter, user);
      }
    });
  }

  private getCursor(options: ChangeStreamOptions, user?: string): ChangeStream<Table[]> {
    return user
      ? this.getCollection().watch([{ $match: userTableFilter(user) }], options)
      : this.getCollection().watch(options);
  }

  private getCollection() {
    return this.client.db('battlestardb').collection('tables');
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }
}
