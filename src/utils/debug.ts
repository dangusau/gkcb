export const debug = {
  log: (component: string, message: string, data?: any) => {
    console.log(`[${component}] ${message}`, data || '');
  },
  error: (component: string, message: string, error?: any) => {
    console.error(`[${component}] ERROR: ${message}`, error || '');
  },
  warn: (component: string, message: string, data?: any) => {
    console.warn(`[${component}] WARN: ${message}`, data || '');
  }
};