const { getPesees, savePesees } = require('../pesees-store');

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            return res.status(200).json(await getPesees());
        } catch (error) {
            console.error('Error in GET /api/pesees:', error);
            return res.status(500).json({ error: 'Failed to read data' });
        }
    }

    if (req.method === 'POST') {
        const data = req.body;
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return res.status(400).json({ error: 'Expected a pesée data object' });
        }

        try {
            await savePesees(data);
            return res.status(200).json({ status: 'saved', timestamp: new Date().toISOString() });
        } catch (error) {
            console.error('Error in POST /api/pesees:', error);
            return res.status(500).json({ error: 'Failed to save data' });
        }
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
};
