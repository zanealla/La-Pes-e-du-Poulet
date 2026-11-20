const express = require('express');
const fs = require('fs');
const path = require('path');
const { eq } = require('drizzle-orm');
const { drizzle } = require('drizzle-orm/node-postgres');
const { jsonb, pgTable, text, timestamp } = require('drizzle-orm/pg-core');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 7000;

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to persist pesée data');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
const peseesStore = pgTable('pesees_store', {
    id: text('id').primaryKey(),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

const dataDir = process.env.RAILWAY_VOLUME_PATH || path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'pesees.json');

app.use(express.json({ limit: '10mb' }));
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    next();
});

function readLegacyData() {
    try {
        if (!fs.existsSync(dataFile)) return {};
        const contents = fs.readFileSync(dataFile, 'utf8');
        const data = contents ? JSON.parse(contents) : {};
        return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
    } catch (error) {
        console.error('Error reading legacy pesée data:', error);
        return {};
    }
}

app.get('/api/pesees', async (req, res) => {
    try {
        let [saved] = await db
            .select({ data: peseesStore.data })
            .from(peseesStore)
            .where(eq(peseesStore.id, 'global'))
            .limit(1);

        if (!saved) {
            const legacyData = readLegacyData();
            if (Object.keys(legacyData).length > 0) {
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
        }

        res.json(saved?.data || {});
    } catch (error) {
        console.error('Error in GET /api/pesees:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/pesees', async (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'Expected a pesée data object' });
    }

    try {
        await db
            .insert(peseesStore)
            .values({ id: 'global', data, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: peseesStore.id,
                set: { data, updatedAt: new Date() },
            });
        res.json({ status: 'saved', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Error in POST /api/pesees:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Serve the main page from public directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
    console.log(`Data file: ${dataFile}`);
	console.log('Using data directory:', dataDir);
});
