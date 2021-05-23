import { EventEmitter } from 'events';
import { decorate, inject, injectable } from 'inversify';
import { ChangeEvent, ChangeStream, ChangeStreamOptions, MongoClient, ObjectId } from 'mongodb';

import * as Symbols from '../ioc/symbols';
import { getLogger } from './logging';
import { FullChangeEvent } from './mongo-emitter-models';

decorate(injectable(), EventEmitter);

const logger = getLogger('Emitter');

@injectable()
// eslint-disable-next-line @typescript-eslint/ban-types
export class MongoChangeEmitter<T extends object = { _id: ObjectId }> extends EventEmitter {
  private connected = false;

  constructor(@inject(Symbols.MongoClient) private readonly client: MongoClient) {
    super();
  }

  async start(pipeline?: Record<string, unknown>[]): Promise<void> {
    logger.debug(`Starting stream...`);
    this.connect();
    this.stream(pipeline);
  }

  private stream(pipeline?: Record<string, unknown>[]) {
    const options = {
      fullDocument: 'updateLookup',
    } as ChangeStreamOptions;

    this.emitLoop(options, pipeline);
  }

  private emitLoop(options: ChangeStreamOptions, pipeline?: Record<string, unknown>[]) {
    const watchCursor = this.getCursor(options, pipeline);
    watchCursor.on('change', async (next: ChangeEvent<T>) => {
      const event = this.changeEvent(next);
      if (event) {
        this.emit('data', event);
      }
    });
  }

  private changeEvent(changeEvent: ChangeEvent<T>): FullChangeEvent<T> | undefined {
    if (
      changeEvent.operationType === 'insert' ||
      changeEvent.operationType === 'replace' ||
      changeEvent.operationType === 'update'
    ) {
      if (!changeEvent.fullDocument) {
        throw new Error('expecting a fullDocument in the ChangeEvent');
      }
      return {
        fullDocument: changeEvent.fullDocument,
        documentKey: changeEvent.documentKey._id as string,
        operationType: changeEvent.operationType,
      };
    } else if (changeEvent.operationType === 'delete') {
      return {
        documentKey: changeEvent.documentKey._id as string,
        operationType: changeEvent.operationType,
      };
    } else {
      logger.warn(`Unknown event type ${changeEvent.operationType}`);
    }
  }

  private getCursor(
    options: ChangeStreamOptions,
    pipeline?: Record<string, unknown>[]
  ): ChangeStream<T> {
    return pipeline
      ? this.getCollection().watch(pipeline, options)
      : this.getCollection().watch(options);
  }

  private getCollection() {
    return this.client.db('battlestardb').collection('tables');
  }

  private async connect(): Promise<void> {
    if (!this.connected) {
      logger.debug(`Connecting...`);
      try {
        await this.client.connect();
      } catch (err) {
        logger.error(`got error connecting to mongo: ${err}`);
      }
      logger.debug(`Connected...`);
      this.connected = true;
    }
  }
}
