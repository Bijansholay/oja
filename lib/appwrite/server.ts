import { Client, Databases, Storage, Users, ID, Query } from "node-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  DATABASE_ID,
  BUCKET_ID,
  COLLECTIONS,
} from "./constants";

const apiKey = process.env.APPWRITE_API_KEY;

export function createAdminClient() {
  if (!apiKey || !APPWRITE_PROJECT_ID) {
    return null;
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(apiKey);

  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

export function createSessionClient(sessionSecret?: string) {
  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  if (sessionSecret) {
    client.setSession(sessionSecret);
  }

  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
  };
}

export { ID, Query, DATABASE_ID, BUCKET_ID, COLLECTIONS };
