# Backend Status

## Done
- Appwrite function environment variables are set in the dashboard for all deployed functions.
- Bundled `config.json` secret fallbacks were removed from function source.
- `track-event` was redeployed with `type: "module"` and now passes smoke testing.
- Text function smoke tests pass: `json-formatter`, `base64-encoder`, `text-case-converter`, `word-counter`.
- A real local `.env` now exists for frontend Vite variables.
- Platform functions are now deployed and smoke-tested: `auth-webhook`, `payment-webhook`, `create-download-link`.
- `auth-webhook` is configured with the `users.*.create` event trigger.

## Remaining manual work
- Add the remaining PDF/image/video tool functions if you want full one-function-per-tool coverage.
- Set Cloudflare Pages secrets and confirm the GitHub Actions deployment in your repo.
- If the spec requires webhook signatures or provider-specific payment verification, wire those secrets into `payment-webhook`.

## Notes
- Function env vars are now stored in Appwrite, not in function source files.
- The Appwrite API key is still only read from `.env.server` for provisioning scripts.
