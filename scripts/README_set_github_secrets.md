Set GitHub repository secrets script

This script uploads repository secrets to GitHub using a Personal Access Token (PAT).

Prereqs
- Node.js (v18+)
- Install dependencies in the workspace root or this folder:
  npm install libsodium-wrappers node-fetch@2

Prepare secrets file
Create `scripts/github-secrets.json` with the secrets to add, e.g.:

{
  "VITE_APPWRITE_ENDPOINT": "https://fra.cloud.appwrite.io/v1",
  "VITE_APPWRITE_PROJECT_ID": "69c58725000ef2b43f18",
  "CLOUDFLARE_API_TOKEN": "<token>"
}

Run

```bash
# export PAT in environment
GITHUB_PAT=ghp_... node scripts/set_github_secrets.mjs --repo SohailKhan0525/QofenoGlobalTool scripts/github-secrets.json
```

The script will fetch the repository public key, encrypt each secret, and upload it via the GitHub API.
