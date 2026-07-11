const { Client, Functions, Query } = require('node-appwrite');
require('dotenv').config();
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const func = new Functions(client);
func.listExecutions('aac-converter', [Query.orderDesc('$createdAt'), Query.limit(1)]).then(r => console.log(r.executions[0])).catch(console.error);
