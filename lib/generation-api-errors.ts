export const GENERATION_AUTH_MESSAGE = "Sign in to generate content.";

export function isUnauthorizedStatus(status: number): boolean {
  return status === 401;
}
