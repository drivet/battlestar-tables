import { EventEmitter } from 'events';
import { decorate, injectable } from 'inversify';
import { ChangeEvent, ChangeStream, ChangeStreamOptions, ObjectId } from 'mongodb';

import { getLogger } from './logging';
import { MongoCollectionClient } from './mongo';
import { FullChangeEvent } from './mongo-emitter-models';

decorate(injectable(), EventEmitter);

const logger = getLogger('Emitter');

@injectable()
// eslint-disable-next-line @typescript-eslint/ban-types
export class MongoChangeEmitter<T extends object = { _id: ObjectId }> extends EventEmitter {
  constructor(private readonly client: MongoCollectionClient) {
    super();
  }

  start(pipeline?: Record<string, unknown>[]): void {
    logger.debug(`Starting stream...`);
    this.stream(pipeline);
  }

  private stream(pipeline?: Record<string, unknown>[]) {
    const options = {
      fullDocument: 'updateLookup',
    } as ChangeStreamOptions;

    this.emitLoop(options, pipeline);
  }

  private async emitLoop(options: ChangeStreamOptions, pipeline?: Record<string, unknown>[]) {
    const watchCursor = await this.getCursor(options, pipeline);
    watchCursor.on('change', (next: ChangeEvent<T>) => {
      const event = this.changeEvent(next);
      if (event) {
        this.emit('data', event);
      }
    });
  }

  private changeEvent(changeEvent: ChangeEvent<T>): FullChangeEvent<T> | undefined {
    logger.debug(`got change event ${JSON.stringify(changeEvent)}`);
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

  private async getCursor(
    options: ChangeStreamOptions,
    pipeline?: Record<string, unknown>[]
  ): Promise<ChangeStream<T>> {
    return pipeline
      ? (await this.getCollection()).watch(pipeline, options)
      : (await this.getCollection()).watch(options);
  }

  private async getCollection() {
    return await this.client.getCollection('battlestardb', 'tables');
  }
}
