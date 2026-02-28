import express from 'express';
import cors from 'cors';
import { Database } from 'bun:sqlite';
import type { IUser } from '@fat-loss-tracker/shared-types';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite DB seamlessly using Bun's ultra-fast native sqlite implementation
const db = new Database('fatloss.db', { create: true });

// Healthcheck Route
app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', status: 'ok', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Backend listening on http://localhost:${port}`);
});