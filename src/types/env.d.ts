/// <reference types="vite/client" />

interface ImportMetaEnv extends Partial<Record<string, string>> {
  readonly VITE_AWS_REGION: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
}

// This declaration tells TypeScript that there will be an `env` property on import.meta
// It requires client.d.ts which provides the base types for import.meta.env
// This is what enables TS to correctly type-check env access throughout the app.
interface ImportMeta {
  readonly env: ImportMetaEnv;
}