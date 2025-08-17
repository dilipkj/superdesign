import path from 'path';
import express from 'express';
import { WebAgentService } from '../src/services/webAgentService';

const app = express();
const port = process.env.PORT || 3000;
const agent = new WebAgentService();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

app.post('/api/design', async (req, res) => {
    const { prompt } = req.body || {};
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
        const html = await agent.query(prompt);
        res.json({ html });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

app.listen(port, () => {
    console.log(`SuperDesign web app listening on http://localhost:${port}`);
});
