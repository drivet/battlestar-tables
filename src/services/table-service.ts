import { injectable } from 'inversify';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import {
  Invite,
  InviteCreatePayload,
  InviteUpdatePayload,
  Table,
  TableCreatePayload,
} from './table-models';

const uri =
  'mongodb+srv://dbaccess:wsabtelbatchea@cluster0.7mduw.mongodb.net/battlestardb?retryWrites=true&w=majority';

function getOwnerFilter(id: string, user?: string) {
  return user ? { _id: id, owner: user } : { _id: id };
}

@injectable()
export class TableService {
  private connected = false;
  private readonly client: MongoClient;

  constructor() {
    this.client = new MongoClient(uri);
  }

  async createTable(payload: TableCreatePayload, user?: string): Promise<Table> {
    if (payload.owner !== user) {
      throw new Error(
        `Tables can only be created for oneself, requested owner: ${payload.owner}, header: ${user}`
      );
    }
    await this.connect();
    const newTable: Table = {
      _id: uuidv4(),
      owner: payload.owner,
      ownerUsername: payload.ownerUsername,
      bots: payload.bots,
      seats: payload.seats,
      createdAt: new Date(),
    };
    await this.getCollection().insertOne(newTable);
    return newTable;
  }

  async getTable(id: string, user?: string): Promise<Table> {
    await this.connect();
    return await this.getCollection().findOne(getOwnerFilter(id, user));
  }

  async getTables(user?: string): Promise<Table[]> {
    await this.connect();
    if (!user) {
      return await this.getCollection().find().toArray();
    } else {
      const owned = await this.getCollection().find({ owner: user }).toArray();
      const invited = await this.getCollection().find({ 'invitations.recipient': user }).toArray();
      return [...owned, ...invited];
    }
  }

  async deleteTable(id: string, user?: string): Promise<void> {
    await this.connect();
    await this.getCollection().deleteOne(getOwnerFilter(id, user));
  }

  async createInvite(
    id: string,
    recipient: string,
    payload: InviteCreatePayload,
    user?: string
  ): Promise<void> {
    await this.connect();

    const newInvite: Invite = {
      recipient: recipient,
      recipientUsername: payload.recipientUsername,
      createdAt: new Date(),
      status: 'created',
    };

    // remove any existing invitation to that recipient
    await this.getCollection().updateOne(getOwnerFilter(id, user), {
      $pull: { invitations: { recipient } },
    });

    // add the new inviation
    await this.getCollection().updateOne(getOwnerFilter(id, user), {
      $addToSet: {
        invitations: newInvite,
      },
    });
  }

  async deleteInvite(id: string, recipient: string, user?: string): Promise<void> {
    await this.connect();
    await this.getCollection().updateOne(getOwnerFilter(id, user), {
      $pull: {
        invitations: { recipient },
      },
    });
  }

  async updateInvite(
    id: string,
    recipient: string,
    payload: InviteUpdatePayload,
    user?: string
  ): Promise<void> {
    if (user && user !== recipient) {
      throw new Error('Cannot update invite for which you are not the recipient');
    }

    await this.connect();
    await this.getCollection().updateOne(
      { _id: id, 'invitations.recipient': recipient },
      {
        $set: {
          'invitations.$.status': payload.status,
        },
      }
    );
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
