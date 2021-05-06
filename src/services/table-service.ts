import { injectable } from 'inversify';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

import { Invite, InviteUpdatePayload, Table, TableCreatePayload } from './table-models';

const uri =
  'mongodb+srv://dbaccess:wsabtelbatchea@cluster0.7mduw.mongodb.net/battlestardb?retryWrites=true&w=majority';

type NullableString = string | undefined;

function getTableOwnerFilter(id: string, uid: NullableString) {
  return uid ? { _id: id, inviter: uid } : { _id: id };
}

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

  async getTable(id: string, uid: NullableString): Promise<Table> {
    await this.client.connect();
    return await this.getCollection().findOne(getTableOwnerFilter(id, uid));
  }

  async getTables(uid: NullableString = undefined): Promise<Table[]> {
    await this.client.connect();
    if (!uid) {
      return await this.getCollection().find().toArray();
    } else {
      const owned = await this.getCollection().find({ inviter: uid }).toArray();
      const invited = await this.getCollection().find({ 'invitations.invitee': uid }).toArray();
      return [...owned, ...invited];
    }
  }

  async deleteTable(id: string, uid: NullableString): Promise<void> {
    await this.client.connect();
    await this.getCollection().deleteOne(getTableOwnerFilter(id, uid));
  }

  async createInvite(id: string, invitee: string, uid: NullableString): Promise<void> {
    await this.client.connect();

    const newInvite: Invite = {
      invitee: invitee,
      createdAt: new Date(),
      status: 'created',
    };

    // remove any existing invitation to that recipient
    await this.getCollection().updateOne(getTableOwnerFilter(id, uid), {
      $pull: { invitations: { invitee } },
    });

    // add the new inviation
    await this.getCollection().updateOne(getTableOwnerFilter(id, uid), {
      $addToSet: {
        invitations: newInvite,
      },
    });
  }

  async deleteInvite(id: string, invitee: string, uid: NullableString): Promise<void> {
    await this.client.connect();
    await this.getCollection().updateOne(getTableOwnerFilter(id, uid), {
      $pull: {
        invitations: { invitee },
      },
    });
  }

  async updateInvite(
    id: string,
    invitee: string,
    payload: InviteUpdatePayload,
    uid: NullableString
  ): Promise<void> {
    if (uid && uid !== invitee) {
      throw new Error('Cannot update invite for which you are not the recipient');
    }
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
    return this.client.db('battlestardb').collection('tables');
  }
}
