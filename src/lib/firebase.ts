/**
 * Firebase Host-only stub
 *
 * NOTE: Runtime services have been migrated to AWS (Cognito, DynamoDB, S3).
 * Firebase is kept only for hosting. This module intentionally avoids
 * importing the Firebase SDK so the project can be built without the
 * Firebase runtime packages. Callers that previously used `db`, `storage`,
 * or `auth` should be migrated to the AWS adapter modules under `src/lib`.
 */

export const hostingOnly = true;

export default {
  hostingOnly: true,
};

// Backwards-compatible stubs for legacy imports. Prefer AWS adapters.
export const db = {} as any;
export const storage = {} as any;
export const auth = {} as any;
export const functions = {} as any;
