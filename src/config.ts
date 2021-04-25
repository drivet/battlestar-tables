function getEnv(key: string) {
  return process.env[key];
}

export function getApiKey(): string {
  return getEnv('API_KEY') || 'password';
}

export function getPort(): number {
  return Number(getEnv('PORT')) || 3002;
}
