export type InviteStatus = 'created' | 'accepted' | 'rejected';

export interface TableCreatePayload {
  owner: string;
  ownerUsername: string;
  seats: number;
  bots: number;
}

export interface InviteUpdatePayload {
  status: InviteStatus;
}

export interface InviteCreatePayload {
  recipientUsername: string;
}

export interface Invite {
  recipient: string;
  recipientUsername: string;
  createdAt: Date;
  status: InviteStatus;
}

export interface Table {
  _id: string;
  createdAt: Date;
  owner: string;
  ownerUsername: string;
  seats: number;
  bots: number;
  invitations?: Invite[];
}

export interface StampedTables {
  date: number;
  tables: Table[];
}
