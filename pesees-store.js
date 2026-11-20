const { eq } = require('drizzle-orm');
const { drizzle } = require('drizzle-orm/node-postgres');
const { jsonb, pgTable, text, timestamp } = require('drizzle-orm/pg-core');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to persist pesée data');
}

const pool = globalThis.__peseesPool || new Pool({ connectionString: process.env.DATABASE_URL });
globalThis.__peseesPool = pool;

const db = drizzle(pool);
const peseesStore = pgTable('pesees_store', {
    id: text('id').primaryKey(),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

async function getPesees(legacyData = {}) {
    let [saved] = await db
        .select({ data: peseesStore.data })
        .from(peseesStore)
        .where(eq(peseesStore.id, 'global'))
        .limit(1);

    if (!saved && Object.keys(legacyData).length > 0) {
        await db
            .insert(peseesStore)
            .values({ id: 'global', data: legacyData, updatedAt: new Date() })
            .onConflictDoNothing();
        [saved] = await db
            .select({ data: peseesStore.data })
            .from(peseesStore)
            .where(eq(peseesStore.id, 'global'))
            .limit(1);
    }

    return saved?.data || {};
}

async function savePesees(data) {
    const updatedAt = new Date();
    await db
        .insert(peseesStore)
        .values({ id: 'global', data, updatedAt })
        .onConflictDoUpdate({
            target: peseesStore.id,
            set: { data, updatedAt },
        });
}

module.exports = { getPesees, savePesees };
