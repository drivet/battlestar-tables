export type InviteStatus = 'created' | 'accepted' | 'rejected';

export interface InviteUpdatePayload {
  status: InviteStatus;
}

export interface Invite {
  invitee: string;
  createdAt: Date;
  status: InviteStatus;
}

export interface TableCreatePayload {
  inviter: string;

  // 3-6
  seats: number;

  // 0 - (size -1)
  bots: number;
}

export interface Table {
  _id: string;
  createdAt: Date;

  inviter: string;

  // 3-6
  seats: number;

  // 0 - (size -1)
  bots: number;

  invitations?: Invite[];
}
