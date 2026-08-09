import { Client, Functions, Storage, ID, Permission, Role } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const endpoint = "https://cloud.appwrite.io/v1";
const projectId = "69c58725000ef2b43f18";
const apiKey = process.env.APPWRITE_API_KEY;

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const funcs   = new Functions(client);
const storage = new Storage(client);

console.log("Uploading test audio file...");
const file = InputFile.fromPath("test-data/audio/viper_mp3.mp3", "test_viper.mp3");
const uploaded = await storage.createFile("tool_inputs", ID.unique(), file, [Permission.read(Role.any())]);

console.log("File uploaded ID:", uploaded.$id);

const body = JSON.stringify({
  tool: "aac-converter",
  user_id: "admin_test",
  bucket_id: "tool_inputs",
  file_id: uploaded.$id,
  input_filename: "test_viper.mp3"
});

console.log("Executing qofeno-audio for aac-converter...");
const exec = await funcs.createExecution("qofeno-audio", body, false);
console.log("Execution Status:", exec.status);
console.log("Response Body:", exec.responseBody);
console.log("Errors:", exec.errors);

await storage.deleteFile("tool_inputs", uploaded.$id);
