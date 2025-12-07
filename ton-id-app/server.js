import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Address, Cell, loadStateInit } from '@ton/core';
import { sha256 } from '@ton/crypto';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const APP_DOMAIN = 'tonbot-etpb8pt6i-killar17s-projects.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

const TON_PROOF_PREFIX = 'ton-proof-item-v2/';
const TON_CONNECT_PREFIX = 'ton-connect';

const payloads = new Map();

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

function generatePayload() {
    const payload = crypto.randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + 20 * 60 * 1000;
    payloads.set(payload, { expiresAt });
    return payload;
}

function isValidPayload(payload) {
    const data = payloads.get(payload);
    if (!data) return false;
    if (Date.now() > data.expiresAt) {
        payloads.delete(payload);
        return false;
    }
    return true;
}

function getPublicKeyFromStateInit(stateInit) {
    try {
        const parsed = loadStateInit(Cell.fromBase64(stateInit).beginParse());
        if (parsed.data) {
            const slice = parsed.data.beginParse();
            slice.loadUint(32);
            const publicKey = slice.loadBuffer(32);
            return publicKey;
        }
        return null;
    } catch (e) {
        console.error('Failed to parse stateInit:', e);
        return null;
    }
}

function createMessage(proof, address) {
    const parsedAddress = Address.parse(address);
    
    const wc = Buffer.allocUnsafe(4);
    wc.writeInt32BE(parsedAddress.workChain);
    
    const hash = parsedAddress.hash;
    
    const domainLength = Buffer.allocUnsafe(4);
    domainLength.writeUInt32LE(proof.domain.lengthBytes);
    
    const domain = Buffer.from(proof.domain.value);
    
    const timestamp = Buffer.allocUnsafe(8);
    timestamp.writeBigUInt64LE(BigInt(proof.timestamp));
    
    const payloadBuf = Buffer.from(proof.payload);
    
    return Buffer.concat([
        Buffer.from(TON_PROOF_PREFIX),
        wc,
        hash,
        domainLength,
        domain,
        timestamp,
        payloadBuf
    ]);
}

async function verifySignature(publicKey, signatureBase64, message) {
    const messageHash = await sha256(message);
    
    const fullMessage = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from(TON_CONNECT_PREFIX),
        messageHash
    ]);
    
    const finalHash = await sha256(fullMessage);
    const signature = Buffer.from(signatureBase64, 'base64');
    
    return nacl.sign.detached.verify(finalHash, signature, publicKey);
}

async function verifyTonProof(address, proof, stateInit) {
    try {
        if (proof.domain.value !== APP_DOMAIN) {
            return { valid: false, error: 'Invalid domain' };
        }

        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - proof.timestamp) > 15 * 60) {
            return { valid: false, error: 'Timestamp expired' };
        }

        const publicKey = getPublicKeyFromStateInit(stateInit);
        if (!publicKey) {
            return { valid: false, error: 'Cannot retrieve public key' };
        }

        const message = createMessage(proof, address);
        const isValid = await verifySignature(publicKey, proof.signature, message);
        
        return { valid: isValid };
    } catch (e) {
        console.error('Proof verification error:', e);
        return { valid: false, error: e.message };
    }
}

app.get('/api/generate-payload', (req, res) => {
    const payload = generatePayload();
    res.json({ tonProof: payload });
});

app.post('/api/verify-proof', async (req, res) => {
    const { address, proof, stateInit, telegramId } = req.body;

    if (!address || !proof || !stateInit) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    
    try {
        const result = await verifyTonProof(address, proof, stateInit);

        if (result.valid) {
            const token = jwt.sign(
                { address, telegramId },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            return res.json({ 
                success: true, 
                message: 'Identity verified!',
                token: token,
                tonAddress: address
            });
        } else {
            return res.status(401).json({ success: false, message: 'Proof verification failed.', error: result.error });
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
