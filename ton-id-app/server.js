import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/verify-proof', (req, res) => {
    console.log('Received proof data:', req.body);

    if (req.body.address && req.body.proof) {
        res.json({ success: true, message: 'Proof received, verification pending.' });
    } else {
        res.status(400).json({ success: false, message: 'Invalid data.' });
    }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
