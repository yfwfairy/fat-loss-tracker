import type { JournalEntry, IUser } from '@fat-loss-tracker/shared-types';

const API_BASE = '/api'; // Vite proxy should be configured to point to localhost:3000

export const api = {
    // 1. 获取用户档案
    async getUser(): Promise<IUser> {
        const res = await fetch(`${API_BASE}/user`);
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
