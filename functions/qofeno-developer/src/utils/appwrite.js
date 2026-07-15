import { Client, Storage, Databases, ID, Permission, Role } from "node-appwrite"

export function createClient() {
  return new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
}

export function getStorage(client) { return new Storage(client) }
export function getDatabases(client) { return new Databases(client) }
export { ID, Permission, Role }
