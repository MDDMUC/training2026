// /login uses its own minimal layout (no nav, no auth-bound chrome).
// This empty load function prevents the root +layout.server.ts from running.
export const ssr = true;
