import { Account, Client } from "appwrite";

const client = new Client().setEndpoint("https://cloud.appwrite.io/v1").setProject("69c58725000ef2b43f18");
const account = new Account(client);

console.log("createOAuth2Session signature:\n", account.createOAuth2Session.toString());
console.log("\ncreateOAuth2Token signature:\n", account.createOAuth2Token.toString());
