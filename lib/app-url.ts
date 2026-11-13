export function buildAppUrl(path: string, query: Record<string, string>) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  const baseUrl = new URL(configuredBaseUrl);
  const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname);

  if (baseUrl.protocol !== 'http:' && baseUrl.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTP or HTTPS.');
  }
  if (baseUrl.username || baseUrl.password) {
    throw new Error('NEXT_PUBLIC_APP_URL must not include credentials.');
  }
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new Error('Application return paths must be local absolute paths.');
  }

  if (isLocalHost) {
    baseUrl.protocol = 'http:';
  } else if (process.env.NODE_ENV === 'production') {
    baseUrl.protocol = 'https:';
  }

  const url = new URL(path, baseUrl.origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
