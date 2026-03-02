import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../api';
import type { IUser } from '@fat-loss-tracker/shared-types';

export const useUserStore = defineStore('user', () => {
    const user = ref<IUser | null>(null);
    const loading = ref(false);

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
        loading,
        fetchUser,
        updateProfile
    };
});
