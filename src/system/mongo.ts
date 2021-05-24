import { injectable } from 'inversify';
import { Collection, MongoClient } from 'mongodb';

const uri =
  'mongodb+srv://dbaccess:wsabtelbatchea@cluster0.7mduw.mongodb.net/battlestardb?retryWrites=true&w=majority';

@injectable()
export class MongoCollectionClient {
  private client: MongoClient | null = null;

  async getCollection(db: string, collection: string): Promise<Collection> {
    if (!this.client) {
      this.client = await MongoClient.connect(uri);
    }
    return this.client.db(db).collection(collection);
  }
}
