// lib/db/index.ts
import { neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema/index';

dotenv.config({ path: '.env.local' });

neonConfig.fetchConnectionCache = true;

export const db = drizzle({
    connection: process.env.DATABASE_URL!,
    schema
});
