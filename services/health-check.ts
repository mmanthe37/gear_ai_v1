/**
 * Health Check Utility
 * Provides system status and health information
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceStatus;
    auth: ServiceStatus;
    storage: ServiceStatus;
    api: ServiceStatus;
  };
  uptime: number;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
  message?: string;
}

/**
 * Check if Supabase database is accessible
 */
async function checkDatabase(): Promise<ServiceStatus> {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
      return { status: 'unknown', message: 'SUPABASE_URL not configured' };
    }

    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
    });
    const responseTime = Date.now() - start;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
      message: response.ok ? 'Connected' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check if Firebase Auth is accessible
 */
async function checkAuth(): Promise<ServiceStatus> {
  try {
    const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN;
    if (!FIREBASE_AUTH_DOMAIN) {
      return { status: 'unknown', message: 'FIREBASE_AUTH_DOMAIN not configured' };
    }

    const start = Date.now();
    const response = await fetch(`https://${FIREBASE_AUTH_DOMAIN}`, {
      method: 'HEAD',
    });
    const responseTime = Date.now() - start;

    return {
      status: response.ok || response.status === 404 ? 'up' : 'down',
      responseTime,
      message: 'Firebase Auth reachable',
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check if Supabase Storage is accessible
 */
async function checkStorage(): Promise<ServiceStatus> {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    if (!SUPABASE_URL) {
      return { status: 'unknown', message: 'SUPABASE_URL not configured' };
    }

    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || '',
      },
    });
    const responseTime = Date.now() - start;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
      message: response.ok ? 'Storage accessible' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check external API connectivity
 */
async function checkAPI(): Promise<ServiceStatus> {
  try {
    // Check NHTSA API (free, no auth required)
    const start = Date.now();
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/');
    const responseTime = Date.now() - start;

    return {
      status: response.ok ? 'up' : 'down',
      responseTime,
      message: response.ok ? 'External APIs reachable' : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Get overall health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const startTime = performance.now();

  const [database, auth, storage, api] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    checkStorage(),
    checkAPI(),
  ]);

  const services = { database, auth, storage, api };

  // Determine overall status
  const allUp = Object.values(services).every(s => s.status === 'up');
  const anyDown = Object.values(services).some(s => s.status === 'down');

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (allUp) {
    status = 'healthy';
  } else if (anyDown) {
    status = 'unhealthy';
  } else {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services,
    uptime: performance.now() - startTime,
  };
}

/**
 * Validate environment variables
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
