// Runtime environment configuration
// This allows environment variables to be injected at runtime (in Docker/K8s)
// rather than at build time

interface EnvConfig {
  VITE_API_URL: string;
  VITE_JUDGE_API_URL: string;
  VITE_GOOGLE_CLIENT_ID: string;
  VITE_WS_URL: string;
}

// Extend window to include ENV
declare global {
  interface Window {
    ENV?: EnvConfig;
  }
}

// Get config from window.ENV (injected by env-config.js) or fall back to import.meta.env
const getEnvVar = (key: keyof EnvConfig, fallback: string = ''): string => {
  // First try window.ENV (runtime injection)
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  
  // Fall back to build-time env vars
  return import.meta.env[key] || fallback;
};

export const config = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000'),
  judgeApiUrl: getEnvVar('VITE_JUDGE_API_URL', 'http://localhost:7071'),
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID', ''),
  wsUrl: getEnvVar('VITE_WS_URL', 'ws://localhost:3000'),
};

export default config;


