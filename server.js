const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 7000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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

function readData() {
    try {
        if (!fs.existsSync(dataFile)) {
            fs.writeFileSync(dataFile, "{}");
            return {};
        }
        const data = fs.readFileSync(dataFile, "utf8");
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Error reading data file:', error);
        return {};
    }
}

function writeData(obj) {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(obj, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

app.get('/api/pesees', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        console.error('Error in GET /api/pesees:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/pesees', (req, res) => {
    try {
        const success = writeData(req.body);
        if (success) {
            res.json({ status: 'saved', timestamp: new Date().toISOString() });
        } else {
            res.status(500).json({ error: 'Failed to save data' });
        }
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
});