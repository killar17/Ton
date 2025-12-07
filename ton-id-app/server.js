import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Address, Cell } from '@ton/core';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const APP_DOMAIN = 'https://tonbot-etpb8pt6i-killar17s-projects.vercel.app';

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'dist')));

function verifyTonProof(address, proof, payload) {
    try {
        const parsedAddress = Address.parse(address);
        
        if (proof.payload !== payload) {
            return { isValid: false, error: 'Payload mismatch' };
        }
        
        const timestamp = proof.timestamp;
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 300) {
            return { isValid: false, error: 'Proof expired' };
        }
        
        return { isValid: true };
    } catch (e) {
        console.error('Proof verification error:', e);
        return { isValid: false, error: e.message };
    }
}

app.post('/api/verify-proof', async (req, res) => {
    const { address, proof, telegramId } = req.body;

    if (!address || !proof || !telegramId) {
        return res.status(400).json({ success: false, message: 'Missing proof, address, or Telegram ID.' });
    }
    
    try {
        const result = verifyTonProof(address, proof, proof.payload);

        if (result.isValid) {
            const authToken = crypto.randomBytes(32).toString('hex');
            
            return res.json({ 
                success: true, 
                message: 'Identity verified!',
                token: authToken,
                tonAddress: address
            });
        } else {
            return res.status(401).json({ success: false, message: 'Proof signature failed.', error: result.error });
        }

    } catch (e) {
        console.error('Verification error:', e);
        return res.status(500).json({ success: false, message: 'Server verification error.' });
    }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
