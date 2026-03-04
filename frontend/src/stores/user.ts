import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api';
import type { IUser } from '@fat-loss-tracker/shared-types';

export const useUserStore = defineStore('user', () => {
    const user = ref<IUser | null>(null);
    const loading = ref(false);

    // 动态计算该用户的 BMR 以免依赖由于历史数据导致的 user.bmr 缺失或 0
    const bmr = computed(() => {
        const u = user.value;
        if (!u) return 0;

        // 我们应该加上和 ProfileModal 一致的默认填充值以防 0
        const weight = u.weight || 70;
        const height = u.height || 175;
        const age = u.age || 25;
        const gender = u.gender || '女';
        const bodyFat = u.bodyFat || 0;

        if (bodyFat && bodyFat > 0) {
            const leanBodyMass = weight * (1 - bodyFat / 100);
            return Math.round(370 + (21.6 * leanBodyMass));
        }

        if (gender === '男') {
            return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
        } else {
            return Math.round(10 * weight + 6.25 * height - 5 * age - 161);
        }
    });

    // 基于上述实算 BMR 返回该用户的日常活动消耗 TDEE
    const tdee = computed(() => {
        const u = user.value;
        if (!u) return 0;
        if (bmr.value > 0) {
            return Math.round(bmr.value * (u.activityLevel || 1.2));
        }
        return u.targetCalories || 0; // 托底
    });

    async function fetchUser() {
        loading.value = true;
        try {
            let uid = localStorage.getItem('fatloss_user_id');
            if (!uid) {
                console.log('[Store] No UID found, initializing new user...');
                const newUser = await api.initUser();
                uid = newUser.id;
                localStorage.setItem('fatloss_user_id', uid);
                user.value = newUser;
            } else {
                console.log('[Store] Fetching existing user:', uid);
                try {
                    const data = await api.getUser(uid);
                    user.value = data;
                    console.log('[Store] User fetched successfully:', data);
                } catch (err) {
                    console.error('[Store] Failed to fetch existing user, reset needed:', err);
                    // 如果获取失败（404等），视为无效账号，重新初始化
                    localStorage.removeItem('fatloss_user_id');
                    const newUser = await api.initUser();
                    localStorage.setItem('fatloss_user_id', newUser.id);
                    user.value = newUser;
                    console.log('[Store] New user re-initialized after failure:', newUser.id);
                }
            }
        } catch (error) {
            console.error('[Store] Fatal error in fetchUser:', error);
        } finally {
            loading.value = false;
        }
    }

    async function updateProfile(updatedUser: IUser) {
        await api.updateUser(updatedUser);
        // 直接更新 local state 实现同步
        user.value = { ...updatedUser };
    }

    return {
        user,
        bmr,
        tdee,
        loading,
        fetchUser,
        updateProfile
    };
});
