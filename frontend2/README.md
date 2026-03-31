# frontend2 — S3 Media Player (minimal rewrite)

Vanilla TypeScript SPA built with [Vite](https://vitejs.dev/). No UI framework. Replaces the Create-React-App / Amplify / Material-UI v1 frontend.

## Dependencies

| Package | Purpose |
|---------|---------|
| `amazon-cognito-identity-js` | Cognito User Pool authentication (login, session refresh) |
| `@aws-sdk/credential-provider-cognito-identity` | Exchanges Cognito ID tokens for temporary AWS credentials via the Identity Pool |
| `@aws-sdk/client-s3` | Lists objects in the S3 bucket |
| `@aws-sdk/s3-request-presigner` | Generates presigned GET URLs for audio tracks |

Dev: `vite`, `typescript` only.

## Setup

**1. Deploy the CDK infrastructure** (if you haven't already):

```bash
cd ../infrastructure
npm run cdk -- deploy
```

**2. Create `frontend-config.ts`** from the CDK outputs:

```bash
cp frontend-config.example.ts src/frontend-config.ts
# edit frontend-config.ts and fill in the values
```

**3. Install and run:**

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # production build → build/
npm run preview  # preview the production build locally
```

## Architecture

```
src/
  config.ts   — reads frontend-config.ts, exports typed AppConfig
  auth.ts     — CognitoAuth: login, logout, session restore, credential provider
  s3.ts       — S3Browser: list(), presignUrl()
  player.ts   — AudioPlayer: play-by-key, pause, resume, stop, URL refresh
  app.ts      — App: full DOM-based UI (login view, browser view, player bar)
  main.ts     — entry point; wires services together and mounts App
  style.css   — dark-theme CSS with custom properties
```

### Presigned URL refresh

`AudioPlayer` tracks the expiry of the current presigned URL and schedules a background refresh 5 minutes before it expires. On refresh:

1. A new presigned URL is fetched from S3.
2. The `<audio>` element's `src` is swapped.
3. Playback position is restored and play resumes if it was playing.
4. The refresh timer re-arms itself, so arbitrarily long sessions are supported.

URL validity is set to **1 hour** (`URL_EXPIRES_SECONDS` in `player.ts`). Adjust together with `REFRESH_BEFORE_EXPIRY_MS` if needed.

### Credential refresh

`AuthService.getCredentials()` is passed as a **dynamic credential provider** to the `S3Client`. The SDK calls it before each request. It:

1. Calls `getValidSession()` which transparently refreshes the Cognito session via the stored refresh token when the ID/access tokens expire.
2. Caches the Identity Pool credential provider keyed by the current ID token. A new provider is created only when the Cognito token rotates, ensuring Identity Pool credentials are kept in sync.
