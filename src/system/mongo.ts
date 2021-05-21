import { MongoClient } from 'mongodb';

const uri =
  'mongodb+srv://dbaccess:wsabtelbatchea@cluster0.7mduw.mongodb.net/battlestardb?retryWrites=true&w=majority';

export function getMongoClient(): MongoClient {
  return new MongoClient(uri);
}
