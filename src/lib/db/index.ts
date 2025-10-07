// lib/db/index.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema/index';

dotenv.config({ path: '.env.local' });

if (typeof window === "undefined") {
    neonConfig.webSocketConstructor = ws;
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 10
});

export const db = drizzle(pool, { schema });