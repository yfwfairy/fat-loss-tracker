import type { JournalEntry, IUser, IFoodItem, IExerciseCategory } from '@fat-loss-tracker/shared-types';

const API_BASE = '/api'; // Vite proxy should be configured to point to localhost:3000

export const api = {
    // 1. 获取用户档案
    async getUser(id?: string): Promise<IUser> {
        const url = id ? `${API_BASE}/user/${id}` : `${API_BASE}/user`;
        const res = await fetch(url);
        return res.json();
    },

    // 1.1 初始化匿名用户 [NEW]
    async initUser(): Promise<IUser> {
        const res = await fetch(`${API_BASE}/user/init`, { method: 'POST' });
        return res.json();
    },

    // 1.2 获取头像列表
    async getAvatars(): Promise<string[]> {
        const res = await fetch(`${API_BASE}/avatars`);
        return res.json();
    },

    // 1.3 获取食物列表
    async getFoods(): Promise<IFoodItem[]> {
        const res = await fetch(`${API_BASE}/foods`);
        return res.json();
    },

    // 1.4 获取运动列表
    async getExercises(): Promise<IExerciseCategory> {
        const res = await fetch(`${API_BASE}/exercises`);
        return res.json();
    },

    // 2. 更新用户档案
    async updateUser(user: IUser): Promise<{ status: string }> {
        const res = await fetch(`${API_BASE}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return res.json();
    },

    // 3. 获取今日汇总
    async getTodayDashboard(): Promise<{ total_intake: number; total_burn: number }> {
        const res = await fetch(`${API_BASE}/dashboard/today`);
        return res.json();
    },

    // 4. 获取今日手账
    async getTodayJournal(): Promise<JournalEntry[]> {
        const res = await fetch(`${API_BASE}/journal/today`);
        return res.json();
    },

    // 5. 新增手账记录
    async addJournalEntry(entry: Partial<JournalEntry>): Promise<{ status: string; id: string }> {
        const res = await fetch(`${API_BASE}/journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        });
        return res.json();
    }
};
