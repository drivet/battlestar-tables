import { injectable } from 'inversify';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import { Invite, InviteUpdatePayload, Table, TableCreatePayload } from './table-models';

const uri =
  'mongodb+srv://dbaccess:password@cluster0.7mduw.mongodb.net/battlestardb?retryWrites=true&w=majority';

@injectable()
export class TableService {
  private client: MongoClient;

  constructor() {
    this.client = new MongoClient(uri);
  }

  async createTable(payload: TableCreatePayload): Promise<Table> {
    await this.client.connect();
    const newTable: Table = {
      _id: uuidv4(),
      inviter: payload.inviter,
      bots: payload.bots,
      seats: payload.seats,
      createdAt: new Date(),
    };
    await this.getCollection().insertOne(newTable);
    return newTable;
  }

  async getTable(id: string): Promise<Table> {
    await this.client.connect();
    return await this.getCollection().findOne({ _id: id });
  }

  async getTables(inviter: string | undefined, invitee: string | undefined): Promise<Table[]> {
    await this.client.connect();
    if (inviter && invitee) {
      throw new Error('Cannot define both inviter and invitee');
    }
    if (inviter) {
      return await this.getCollection().find({ inviter }).toArray();
    } else if (invitee) {
      return await this.getCollection().find({ 'invitations.invitee': invitee }).toArray();
    } else {
      return await this.getCollection().find().toArray();
    }
  }

  async deleteTable(id: string): Promise<void> {
    await this.client.connect();
    await this.getCollection().deleteOne({ _id: id });
  }

  async createInvite(id: string, invitee: string): Promise<void> {
    await this.client.connect();
    const newInvite: Invite = {
      invitee: invitee,
      createdAt: new Date(),
      status: 'created',
    };
    await this.getCollection().updateOne(
      { _id: id },
      {
        $pull: { invitations: { invitee } },
      }
    );

    await this.getCollection().updateOne(
      { _id: id },
      {
        $addToSet: {
          invitations: newInvite,
        },
      }
    );
  }

  async deleteInvite(id: string, invitee: string): Promise<void> {
    await this.client.connect();
    await this.getCollection().updateOne(
      { _id: id },
      {
        $pull: {
          invitations: { invitee },
        },
      }
    );
  }

  async updateInvite(id: string, invitee: string, payload: InviteUpdatePayload): Promise<void> {
    await this.client.connect();
    await this.getCollection().updateOne(
      { _id: id, 'invitations.invitee': invitee },
      {
        $set: {
          'invitations.$.status': payload.status,
        },
      }
    );
  }

  private getCollection() {
    return this.client.db('battlestardb').collection('groups');
  }
}
