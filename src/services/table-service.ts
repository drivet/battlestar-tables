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

function getTableOwnerFilter(id: string, uid: NullableString) {
  return uid ? { _id: id, ownerUid: uid } : { _id: id };
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
        ownerUid: payload.ownerUid,
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

  async getTable(id: string, ownerUid: NullableString): Promise<Table> {
    try {
      await this.client.connect();
      return await this.getCollection().findOne(getTableOwnerFilter(id, ownerUid));
    } finally {
      //await this.client.close();
    }
  }

  async getTables(ownerUid: NullableString = undefined): Promise<Table[]> {
    try {
      await this.client.connect();
      if (!ownerUid) {
        return await this.getCollection().find().toArray();
      } else {
        const owned = await this.getCollection().find({ inviter: ownerUid }).toArray();
        const invited = await this.getCollection()
          .find({ 'invitations.invitee': ownerUid })
          .toArray();
        return [...owned, ...invited];
      }
    } finally {
      //await this.client.close();
    }
  }

  async deleteTable(id: string, ownerUid: NullableString): Promise<void> {
    try {
      await this.client.connect();
      await this.getCollection().deleteOne(getTableOwnerFilter(id, ownerUid));
    } finally {
      //await this.client.close();
    }
  }

  async createInvite(
    id: string,
    invitee: string,
    ownerUid: NullableString,
    payload: InviteCreatePayload
  ): Promise<void> {
    try {
      await this.client.connect();

      const newInvite: Invite = {
        invitee: invitee,
        inviteeUid: payload.inviteeUid,
        createdAt: new Date(),
        status: 'created',
      };

      // remove any existing invitation to that recipient
      await this.getCollection().updateOne(getTableOwnerFilter(id, ownerUid), {
        $pull: { invitations: { invitee } },
      });

      // add the new inviation
      await this.getCollection().updateOne(getTableOwnerFilter(id, ownerUid), {
        $addToSet: {
          invitations: newInvite,
        },
      });
    } finally {
      //await this.client.close();
    }
  }

  async deleteInvite(id: string, invitee: string, uid: NullableString): Promise<void> {
    try {
      await this.client.connect();
      await this.getCollection().updateOne(getTableOwnerFilter(id, uid), {
        $pull: {
          invitations: { invitee },
        },
      });
    } finally {
      //await this.client.close();
    }
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
    try {
      await this.client.connect();
      await this.getCollection().updateOne(
        { _id: id, 'invitations.invitee': invitee },
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
