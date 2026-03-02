import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';
import type { JournalEntry } from '@fat-loss-tracker/shared-types';

export const useJournalStore = defineStore('journal', () => {
    const entries = ref<JournalEntry[]>([]);
    const totals = ref({
        total_intake: 0,
        total_burn: 0
    });
    const loading = ref(false);

    async function fetchTodayData() {
        loading.value = true;
        try {
            const [journalData, dashboardData] = await Promise.all([
                api.getTodayJournal(),
                api.getTodayDashboard()
            ]);
            entries.value = journalData;
            totals.value = {
                total_intake: dashboardData.total_intake,
                total_burn: dashboardData.total_burn
            };
        } finally {
            loading.value = false;
        }
    }

    async function addEntry(entry: Partial<JournalEntry>) {
        const res = await api.addJournalEntry(entry);
        if (res.status === 'success') {
            await fetchTodayData(); // 重新拉取以确保汇总同步
        }
        return res;
    }

    return {
        entries,
        totals,
        loading,
        fetchTodayData,
        addEntry
    };
});
