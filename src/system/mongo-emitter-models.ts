export interface InsertOrUpdateChangeEvent<T> {
  operationType: 'insert' | 'replace' | 'update';
  documentKey: string;
  fullDocument: T;
}

export interface DeleteChangeEvent {
  operationType: 'delete';
  documentKey: string;
}

export type FullChangeEvent<T> = InsertOrUpdateChangeEvent<T> | DeleteChangeEvent;
