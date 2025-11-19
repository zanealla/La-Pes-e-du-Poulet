
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 7000;

const dataFile = path.join(__dirname, 'data', 'pesees.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "{}");
    return JSON.parse(fs.readFileSync(dataFile, "utf8") || "{}");
}

function writeData(obj) {
    fs.writeFileSync(dataFile, JSON.stringify(obj, null, 2));
}

app.get('/api/pesees', (req, res) => res.json(readData()));
app.post('/api/pesees', (req, res) => { writeData(req.body); res.json({status:'saved'}); });

app.listen(port, ()=>console.log('Running on http://localhost:' + port));
