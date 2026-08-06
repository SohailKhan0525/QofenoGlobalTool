import { Client, Account } from "appwrite";

const rawJwt = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZWNyZXQiOiI1ZmUwNzcxYzFmZTYwZTg4YTA0NzA4NjEwMmVkYjQxYjcxNTZiNjIyZWZmYjZhMjgyOTQ4MjUwYmU0MGZiYjA5IiwicHJvdmlkZXIiOiJnb29nbGUiLCJleHAiOjE3ODU5OTUwNzl9.mz6Y3yLe-lIhC2XB19J9RBO8BnaLzeI-Ac0XqVzkOJA";

function extractSecret(raw) {
  if (raw.includes('.')) {
    try {
      const parts = raw.split('.');
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const payloadStr = Buffer.from(base64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadStr);
        if (payload && payload.secret) {
          return payload.secret;
        }
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  }
  return raw;
}

const extracted = extractSecret(rawJwt);
console.log("Raw JWT:", rawJwt.substring(0, 30) + "...");
console.log("Extracted raw token secret:", extracted);
