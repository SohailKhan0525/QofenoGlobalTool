import { Account, Client } from "appwrite";

const client = new Client().setEndpoint("https://fra.cloud.appwrite.io/v1").setProject("69c58725000ef2b43f18");
const account = new Account(client);

const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(account));
console.log("Appwrite Account Client SDK Methods:", proto);
