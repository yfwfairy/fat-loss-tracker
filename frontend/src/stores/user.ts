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
            const data = await api.getUser();
            user.value = data;
        } finally {
            loading.value = false;
        }
    }

    async function updateProfile(updatedUser: IUser) {
        await api.updateUser(updatedUser);
        user.value = updatedUser;
    }

    return {
        user,
        loading,
        fetchUser,
        updateProfile
    };
});
