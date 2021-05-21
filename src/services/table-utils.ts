// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function userTableFilter(user: string) {
  return {
    $or: [{ owner: user }, { 'invitations.recipient': user }],
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getOwnerFilter(id: string, user?: string) {
  return user ? { _id: id, owner: user } : { _id: id };
}
