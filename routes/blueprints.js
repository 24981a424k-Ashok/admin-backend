const express = require('express');
const router = express.Router();
const Blueprint = require('../models/Blueprint');
const History = require('../models/History');

// Get all blueprints
router.get('/', async (req, res) => {
    try {
        const blueprints = await Blueprint.find().sort({ updated_at: -1 });
        res.json(blueprints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get active blueprint (For Website Sync)
router.get('/active', async (req, res) => {
    try {
        const blueprint = await Blueprint.findOne({ is_published: true }).sort({ updated_at: -1 });
        if (!blueprint) return res.status(404).json({ error: 'No published blueprint found' });
        res.json(blueprint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create/Update blueprint
router.post('/', async (req, res) => {
    const { name, structure } = req.body;
    try {
        let blueprint = await Blueprint.findOne({ name });
        if (blueprint) {
            blueprint.structure = structure;
            await blueprint.save();
        } else {
            blueprint = new Blueprint({ name, structure });
            await blueprint.save();
        }

        // Save to history
        const history = new History({
            blueprint_id: blueprint._id,
            structure: structure,
            action: 'save'
        });
        await history.save();

        res.json(blueprint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Publish blueprint
router.post('/publish/:id', async (req, res) => {
    try {
        // Unpublish others
        await Blueprint.updateMany({}, { is_published: false });

        const blueprint = await Blueprint.findById(req.params.id);
        blueprint.is_published = true;
        await blueprint.save();

        // History log
        const history = new History({
            blueprint_id: blueprint._id,
            structure: blueprint.structure,
            action: 'publish'
        });
        await history.save();

        res.json(blueprint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get history for a blueprint
router.get('/history/:id', async (req, res) => {
    try {
        const history = await History.find({ blueprint_id: req.params.id }).sort({ timestamp: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
