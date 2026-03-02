import express from 'express';
import cors from 'cors';
import { initDB } from './src/db.js';
import db from './src/db.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3001;

// Initialize Database
initDB();

app.use(cors());
app.use(express.json());

// --- API Routes ---

// 1. Backend Health Check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Fat Loss Tracker API is running' });
});

// 2. Get User Profile
app.get('/api/user', (req, res) => {
    const user = db.query('SELECT * FROM users WHERE id = ?').get('default-user-id');
    res.json(user);
});

// 3. Update User Profile
app.post('/api/user', (req, res) => {
    const { nickname, avatar_id, height, weight, target_calories, bmi } = req.body;
    const query = db.query(`
    UPDATE users SET 
      nickname = $nickname, avatar_id = $avatar_id, height = $height, weight = $weight, target_calories = $target_calories, bmi = $bmi
    WHERE id = $id
  `);
    query.run({
        $nickname: nickname,
        $avatar_id: avatar_id,
        $height: height,
        $weight: weight,
        $target_calories: target_calories,
        $bmi: bmi,
        $id: 'default-user-id'
    });
    res.json({ status: 'success' });
});

// 4. Get Dashboard Stats for Today
app.get('/api/dashboard/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const userId = 'default-user-id';

    let record: any = db.query('SELECT * FROM daily_records WHERE date = ? AND user_id = ?').get(today, userId);

    if (!record) {
        record = { total_intake: 0, total_burn: 0, date: today };
    }

    res.json(record);
});

// 5. Get Journal Entries for Today
app.get('/api/journal/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const entries = db.query('SELECT * FROM journal_items WHERE date = ? ORDER BY timestamp DESC').all(today);

    const parsedEntries = entries.map((entry: any) => ({
        ...entry,
        meta: entry.meta_data ? JSON.parse(entry.meta_data) : {}
    }));

    res.json(parsedEntries);
});

// 6. Add Journal Entry
app.post('/api/journal', (req, res) => {
    const { type, calories, emoji, title, meta } = req.body;
    const id = uuidv4();
    const date = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    const userId = 'default-user-id';

    // 1. Insert into journal_items
    const insertJournal = db.query(`
    INSERT INTO journal_items (id, user_id, type, date, timestamp, calories, emoji, title, meta_data)
    VALUES ($id, $userId, $type, $date, $timestamp, $calories, $emoji, $title, $meta_data)
  `);
    insertJournal.run({
        $id: id,
        $userId: userId,
        $type: type,
        $date: date,
        $timestamp: timestamp,
        $calories: calories,
        $emoji: emoji,
        $title: title,
        $meta_data: JSON.stringify(meta)
    });

    // 2. Update daily_records summary (UPSERT)
    const dailyRecordId = `${date}_${userId}`;
    const intakeAdd = type === 'intake' ? calories : 0;
    const burnAdd = type === 'exercise' ? calories : 0;

    // bun:sqlite doesn't support named parameters in EXCLUDED, so we use a more standard conditional approach or simple check
    const existing = db.query('SELECT id FROM daily_records WHERE id = ?').get(dailyRecordId);

    if (existing) {
        db.query(`
      UPDATE daily_records 
      SET total_intake = total_intake + $intake, total_burn = total_burn + $burn
      WHERE id = $id
    `).run({
            $intake: intakeAdd,
            $burn: burnAdd,
            $id: dailyRecordId
        });
    } else {
        db.query(`
      INSERT INTO daily_records (id, user_id, date, total_intake, total_burn)
      VALUES ($id, $userId, $date, $intake, $burn)
    `).run({
            $id: dailyRecordId,
            $userId: userId,
            $date: date,
            $intake: intakeAdd,
            $burn: burnAdd
        });
    }

    res.json({ status: 'success', id });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});