import { Database } from "bun:sqlite";
import { join } from 'path';

// 数据库文件路径
const DB_PATH = join(process.cwd(), 'fatloss.db');
const db = new Database(DB_PATH, { create: true });

/**
 * 版本化迁移列表 — 只在末尾追加，不修改已有项
 * 数组索引 + 1 = Schema 版本号
 */
const MIGRATIONS: string[] = [
  // ── v1：初始表结构 ──────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        avatar_id TEXT DEFAULT '🌿',
        height REAL DEFAULT 175.0,
        weight REAL DEFAULT 70.0,
        target_calories INTEGER DEFAULT 1810,
        bmi REAL DEFAULT 22.8
    )`,

  `CREATE TABLE IF NOT EXISTS daily_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        total_intake INTEGER DEFAULT 0,
        total_burn INTEGER DEFAULT 0,
        weight_snapshot REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`,

  `CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date)`,

  `CREATE TABLE IF NOT EXISTS journal_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        calories INTEGER NOT NULL,
        emoji TEXT,
        title TEXT NOT NULL,
        meta_data TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`,

  `CREATE INDEX IF NOT EXISTS idx_journal_items_date ON journal_items(date)`,

  // ── v2：用户扩展字段 ────────────────────────────────
  `ALTER TABLE users ADD COLUMN gender TEXT DEFAULT '女'`,
  `ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 25`,
  `ALTER TABLE users ADD COLUMN activity_level REAL DEFAULT 1.2`,
  `ALTER TABLE users ADD COLUMN body_fat REAL`,
  `ALTER TABLE users ADD COLUMN bmr REAL`,
  `ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1`,
  `ALTER TABLE users ADD COLUMN level_title TEXT DEFAULT '燃脂新手'`,
  `ALTER TABLE users ADD COLUMN measurements TEXT DEFAULT '{}'`,
  `ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,

  // ── 未来新增字段请在此处追加 ↓ ─────────────────────
];

/**
 * 初始化数据库：执行所有尚未运行的迁移
 */
export function initDB() {
  // 读取当前 Schema 版本（0 = 全新数据库）
  const { user_version: currentVersion } = db.query('PRAGMA user_version').get() as { user_version: number };
  const targetVersion = MIGRATIONS.length;

  if (currentVersion === targetVersion) {
    console.log(`[DB] Schema 已是最新版本 v${targetVersion}，无需迁移。`);
  } else {
    console.log(`[DB] 当前 Schema v${currentVersion}，目标 v${targetVersion}，开始迁移...`);
    for (let i = currentVersion; i < targetVersion; i++) {
      try {
        db.run(MIGRATIONS[i]!);
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column name')) {
          console.log(`[DB] ⚠️ 列已存在跳过迁移 v${i + 1}`);
        } else {
          throw error;
        }
      }
      db.run(`PRAGMA user_version = ${i + 1}`);
      console.log(`[DB] 迁移 v${i + 1} 完成`);
    }
    console.log(`[DB] 迁移完成，Schema 现为 v${targetVersion}`);
  }

  // 插入默认用户（首次启动）
  db.query(`
        INSERT OR IGNORE INTO users
            (id, nickname, avatar_id, gender, age, height, weight, target_calories, bmi, activity_level, body_fat, bmr, level, level_title, measurements)
        VALUES
            ($id, $nickname, $avatar_id, $gender, $age, $height, $weight, $target_calories, $bmi, $activity_level, $body_fat, $bmr, $level, $level_title, $measurements)
    `).run({
    $id: 'default-user-id',
    $nickname: '减肥大王',
    $avatar_id: '🌿',
    $gender: '女',
    $age: 25,
    $height: 175,
    $weight: 75,
    $target_calories: 1810,
    $bmi: 24.5,
    $activity_level: 1.2,
    $body_fat: null,
    $bmr: 1500,
    $level: 1,
    $level_title: '燃脂新手',
    $measurements: JSON.stringify({})
  });
}

export default db;
