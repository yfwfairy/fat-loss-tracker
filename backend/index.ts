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

// 请求日志
app.use((req, res, next) => {
    console.log(`[Backend] ${req.method} ${req.url}`);
    next();
});

// --- API Routes ---

// 1. Backend Health Check
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Fat Loss Tracker API is running' });
});

// 2. Get User Profile (默认)
app.get('/api/user', (req: any, res) => {
    const userId = 'default-user-id';
    const user: any = db.query('SELECT * FROM users WHERE id = ?').get(userId);
    if (user) {
        res.json({
            ...user,
            avatarId: user.avatar_id,
            targetCalories: user.target_calories,
            levelTitle: user.level_title,
            activityLevel: user.activity_level,
            bodyFat: user.body_fat,
            bmr: user.bmr,
            measurements: user.measurements ? JSON.parse(user.measurements) : {}
        });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// 2.0 Get User Profile By ID
app.get('/api/user/:id', (req: any, res) => {
    try {
        const userId = req.params.id;
        console.log('[Backend] Fetching user by ID:', userId);
        const user: any = db.query('SELECT * FROM users WHERE id = ?').get(userId);
        if (user) {
            res.json({
                ...user,
                avatarId: user.avatar_id,
                targetCalories: user.target_calories,
                levelTitle: user.level_title,
                bodyFat: user.body_fat,
                bmr: user.bmr,
                measurements: user.measurements ? JSON.parse(user.measurements) : {}
            });
        } else {
            console.warn('[Backend] User not found:', userId);
            res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        console.error('[Backend] Error in GET /api/user/:id:', e);
        res.status(500).json({ error: (e as Error).message });
    }
});

// 2.1 Initialize Anonymous User [NEW]
app.post('/api/user/init', (req, res) => {
    const id = uuidv4();
    const newUser = {
        $id: id,
        $nickname: '减肥大王',
        $avatar_id: '🌿',
        $gender: '女',
        $age: 25,
        $height: 175,
        $weight: 70,
        $target_calories: 2000,
        $bmi: 22.8,
        $activity_level: 1.2,
        $body_fat: null,
        $bmr: 1500,
        $level: 1,
        $level_title: '燃脂新手',
        $measurements: JSON.stringify({})
    };

    db.query(`
    INSERT INTO users (id, nickname, avatar_id, gender, age, height, weight, target_calories, bmi, activity_level, body_fat, bmr, level, level_title, measurements)
    VALUES ($id, $nickname, $avatar_id, $gender, $age, $height, $weight, $target_calories, $bmi, $activity_level, $body_fat, $bmr, $level, $level_title, $measurements)
  `).run(newUser);

    res.json({
        id,
        nickname: '减肥大王',
        avatarId: '🌿',
        gender: '女',
        age: 25,
        height: 175,
        weight: 70,
        targetCalories: 2000,
        bmi: 22.8,
        activityLevel: 1.2,
        bodyFat: null,
        bmr: 1500,
        level: 1,
        levelTitle: '燃脂新手',
        measurements: {}
    });
});

// 2.2 Get Avatars [NEW]
app.get('/api/avatars', (req, res) => {
    const avatars = ['🍄', '🐢', '🌟', '👑', '👻', '🦖', '🌰', '🌸', '☁️', '🔥', '🦊', '🧚', '🌞', '🌙', '⭐', '🍎', '🍉', '🍇', '🐶', '🐱', '🐭', '🦄', '🐧', '🐸'];
    res.json(avatars);
});

// 3. Update User Profile
app.post('/api/user', (req, res) => {
    const { id, nickname, avatarId, gender, age, height, weight, targetCalories, bmi, activityLevel, bodyFat, bmr, level, levelTitle, measurements } = req.body;
    const userId = id || 'default-user-id';

    const query = db.query(`
    UPDATE users SET 
      nickname = $nickname, 
      avatar_id = $avatar_id, 
      gender = $gender,
      age = $age,
      height = $height, 
      weight = $weight, 
      target_calories = $target_calories, 
      bmi = $bmi,
      activity_level = $activity_level,
      body_fat = $body_fat,
      bmr = $bmr,
      level = $level,
      level_title = $level_title,
      measurements = $measurements
    WHERE id = $id
  `);

    query.run({
        $nickname: nickname,
        $avatar_id: avatarId,
        $gender: gender,
        $age: age,
        $height: height,
        $weight: weight,
        $target_calories: targetCalories,
        $bmi: bmi,
        $activity_level: activityLevel,
        $body_fat: bodyFat,
        $bmr: bmr,
        $level: level,
        $level_title: levelTitle,
        $measurements: JSON.stringify(measurements || {}),
        $id: userId
    });
    res.json({ status: 'success' });
});

// 4. Get Dashboard Stats for Today
app.get('/api/dashboard/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0] || '';
    const userId = 'default-user-id';

    let record: any = db.query('SELECT * FROM daily_records WHERE date = ? AND user_id = ?').get(today, userId);

    if (!record) {
        record = { total_intake: 0, total_burn: 0, date: today };
    }

    res.json(record);
});

// 5. Get Journal Entries for Today
app.get('/api/journal/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0] || '';
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
    const date = new Date().toISOString().split('T')[0] || '';
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