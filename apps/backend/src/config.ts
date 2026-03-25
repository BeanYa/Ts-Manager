import 'dotenv/config';

export const config = {
  authToken: process.env.AUTH_TOKEN || '',
  dbClient: (process.env.DB_CLIENT || 'better-sqlite3') as 'better-sqlite3' | 'mysql2',
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: parseInt(process.env.DB_PORT || '3306', 10),
  dbUser: process.env.DB_USER || 'tsmanager',
  dbPass: process.env.DB_PASS || '',
  dbName: process.env.DB_NAME || 'tsmanager',
  port: parseInt(process.env.PORT || '3000', 10),
  publicIp: process.env.PUBLIC_IP || '',
  customDomain: process.env.CUSTOM_DOMAIN || '',
  tsImage: process.env.TS_IMAGE || 'teamspeak',
  portRangeStart: parseInt(process.env.PORT_RANGE_START || '20000', 10),
};
