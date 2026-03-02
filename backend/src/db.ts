import { Database } from "bun:sqlite";
import { join } from 'path';

// 数据库文件路径
const DB_PATH = join(process.cwd(), 'fatloss.db');
const db = new Database(DB_PATH, { create: true });

/**
 * 初始化数据库表结构
 */
export function initDB() {
    console.log('Initializing SQLite database with bun:sqlite...');

    // 1. 用户表
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      avatar_id INTEGER DEFAULT 0,
      height REAL DEFAULT 175.0,
      weight REAL DEFAULT 70.0,
      target_calories INTEGER DEFAULT 2000,
      bmi REAL DEFAULT 22.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // 2. 每日记录汇总表
    db.run(`
    CREATE TABLE IF NOT EXISTS daily_records (
      id TEXT PRIMARY KEY, -- 格式: YYYY-MM-DD_userId
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_intake INTEGER DEFAULT 0,
      total_burn INTEGER DEFAULT 0,
      weight_snapshot REAL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date)`);

    // 3. 手账明细表
    db.run(`
    CREATE TABLE IF NOT EXISTS journal_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'intake' | 'exercise'
      date TEXT NOT NULL, -- YYYY-MM-DD
      timestamp TEXT NOT NULL, -- ISO 8601
      calories INTEGER NOT NULL,
      emoji TEXT,
      title TEXT NOT NULL,
      meta_data TEXT, -- 存储 JSON 字符串
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
    db.run(`CREATE INDEX IF NOT EXISTS idx_journal_items_date ON journal_items(date)`);

    // 初始化一个默认用户
    const defaultUser = {
        $id: 'default-user-id',
        $nickname: '旅人',
        $avatar_id: 1,
        $height: 175,
        $weight: 75,
        $target_calories: 1800,
        $bmi: 24.5
    };

    const stm = db.prepare(`
    INSERT OR IGNORE INTO users (id, nickname, avatar_id, height, weight, target_calories, bmi)
    VALUES ($id, $nickname, $avatar_id, $height, $weight, $target_calories, $bmi)
  `);
    stm.run(defaultUser);

    console.log('Database initialized successfully.');
}

export default db;
