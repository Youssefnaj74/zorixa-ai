/** Current studio URL for post-login return (path + query). */
export function studioReturnPath(): string {
  if (typeof window === "undefined") return "/dashboard";
  return `${window.location.pathname}${window.location.search}`;
}

export function loginRedirectUrl(returnPath?: string): string {
  const path = returnPath ?? studioReturnPath();
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export function signupRedirectUrl(returnPath?: string): string {
  const path = returnPath ?? studioReturnPath();
  return `/login?mode=signup&redirect=${encodeURIComponent(path)}`;
}
