export type InviteStatus = 'created' | 'accepted' | 'rejected';

export interface InviteUpdatePayload {
  status: InviteStatus;
}

export interface InviteCreatePayload {
  inviteeUid: string;
}

export interface Invite {
  invitee: string;
  inviteeUid: string;
  createdAt: Date;
  status: InviteStatus;
}

export interface TableCreatePayload {
  owner: string;
  ownerUid: string;
  seats: number;
  bots: number;
}

export interface Table {
  _id: string;
  createdAt: Date;
  owner: string;
  ownerUid: string;
  seats: number;
  bots: number;
  invitations?: Invite[];
}
