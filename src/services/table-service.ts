import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';

import { getLogger } from '../system/logging';
import { MongoCollectionClient } from '../system/mongo';
import {
  Invite,
  InviteCreatePayload,
  InviteUpdatePayload,
  Table,
  TableCreatePayload,
} from './table-models';
import { getOwnerFilter, userTableFilter } from './table-utils';

const logger = getLogger('TableService');

@injectable()
export class TableService {
  constructor(private readonly client: MongoCollectionClient) {}

  async createTable(payload: TableCreatePayload, user?: string): Promise<Table> {
    if (payload.owner !== user) {
      throw new Error(
        `Tables can only be created for oneself, requested owner: ${payload.owner}, header: ${user}`
      );
    }
    const newTable: Table = {
      _id: uuidv4(),
      owner: payload.owner,
      ownerUsername: payload.ownerUsername,
      bots: payload.bots,
      seats: payload.seats,
      createdAt: new Date(),
    };
    (await this.getCollection()).insertOne(newTable);
    return newTable;
  }

  async getTable(id: string, user?: string): Promise<Table> {
    return (await this.getCollection()).findOne(getOwnerFilter(id, user));
  }

  async getTables(user?: string): Promise<Table[]> {
    if (!user) {
      return (await this.getCollection()).find().toArray();
    } else {
      logger.debug(`Fetching tables for ${user}`);
      return (await this.getCollection()).find(userTableFilter(user)).toArray();
    }
  }

  async deleteTable(id: string, user?: string): Promise<void> {
    (await this.getCollection()).deleteOne(getOwnerFilter(id, user));
  }

  async createInvite(
    id: string,
    recipient: string,
    payload: InviteCreatePayload,
    user?: string
  ): Promise<void> {
    const newInvite: Invite = {
      recipient: recipient,
      recipientUsername: payload.recipientUsername,
      createdAt: new Date(),
      status: 'created',
    };

    // remove any existing invitation to that recipient
    (await this.getCollection()).updateOne(getOwnerFilter(id, user), {
      $pull: { invitations: { recipient } },
    });

    // add the new inviation
    (await this.getCollection()).updateOne(getOwnerFilter(id, user), {
      $addToSet: {
        invitations: newInvite,
      },
    });
  }

  async deleteInvite(id: string, recipient: string, user?: string): Promise<void> {
    (await this.getCollection()).updateOne(getOwnerFilter(id, user), {
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

    (await this.getCollection()).updateOne(
      { _id: id, 'invitations.recipient': recipient },
      {
        $set: {
          'invitations.$.status': payload.status,
        },
      }
    );
  }

  private async getCollection() {
    return await this.client.getCollection('battlestardb', 'tables');
  }
}
