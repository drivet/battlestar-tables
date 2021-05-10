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

type NullableString = string | undefined;

function getTableOwnerFilter(id: string, user: NullableString) {
  return user ? { _id: id, owner: user } : { _id: id };
}

@injectable()
export class TableService {
  private client: MongoClient;

  constructor() {
    this.client = new MongoClient(uri);
  }

  async createTable(payload: TableCreatePayload): Promise<Table> {
    try {
      await this.client.connect();
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
    } finally {
      //await this.client.close();
    }
  }

  async getTable(id: string, user?: string): Promise<Table> {
    try {
      await this.client.connect();
      return await this.getCollection().findOne(getTableOwnerFilter(id, user));
    } finally {
      //await this.client.close();
    }
  }

  async getTables(user?: string): Promise<Table[]> {
    try {
      await this.client.connect();
      if (!user) {
        return await this.getCollection().find().toArray();
      } else {
        const owned = await this.getCollection().find({ inviter: user }).toArray();
        const invited = await this.getCollection()
          .find({ 'invitations.recipient': user })
          .toArray();
        return [...owned, ...invited];
      }
    } finally {
      //await this.client.close();
    }
  }

  async deleteTable(id: string, user?: string): Promise<void> {
    try {
      await this.client.connect();
      await this.getCollection().deleteOne(getTableOwnerFilter(id, user));
    } finally {
      //await this.client.close();
    }
  }

  async createInvite(
    id: string,
    recipient: string,
    payload: InviteCreatePayload,
    user?: string
  ): Promise<void> {
    try {
      await this.client.connect();

      const newInvite: Invite = {
        recipient: recipient,
        recipientUsername: payload.recipientUsername,
        createdAt: new Date(),
        status: 'created',
      };

      // remove any existing invitation to that recipient
      await this.getCollection().updateOne(getTableOwnerFilter(id, user), {
        $pull: { invitations: { recipient } },
      });

      // add the new inviation
      await this.getCollection().updateOne(getTableOwnerFilter(id, user), {
        $addToSet: {
          invitations: newInvite,
        },
      });
    } finally {
      //await this.client.close();
    }
  }

  async deleteInvite(id: string, recipient: string, user?: string): Promise<void> {
    try {
      await this.client.connect();
      await this.getCollection().updateOne(getTableOwnerFilter(id, user), {
        $pull: {
          invitations: { recipient },
        },
      });
    } finally {
      //await this.client.close();
    }
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
    try {
      await this.client.connect();
      await this.getCollection().updateOne(
        { _id: id, 'invitations.recipient': recipient },
        {
          $set: {
            'invitations.$.status': payload.status,
          },
        }
      );
    } finally {
      //await this.client.close();
    }
  }

  private getCollection() {
    return this.client.db('battlestardb').collection('tables');
  }
}
