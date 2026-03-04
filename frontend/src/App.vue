<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from './components/layout/Layout.vue'
import HomeView from './views/HomeView.vue'
import IntakeModal from './components/modals/IntakeModal.vue'
import ExerciseModal from './components/modals/ExerciseModal.vue'
import ProfileModal from './components/modals/ProfileModal.vue'
import { useUserStore } from './stores/user'
import { useJournalStore } from './stores/journal'

const userStore = useUserStore()
const journalStore = useJournalStore()

const currentView = ref('home');

const isIntakeOpen = ref(false);
const isExerciseOpen = ref(false);
const isProfileOpen = ref(false);

onMounted(async () => {
  // 初始化加载所有核心数据
  await Promise.all([
    userStore.fetchUser(),
    journalStore.fetchTodayData()
  ]);
});

const handleIntakeSubmit = async (data: any) => {
  await journalStore.addEntry({
    type: 'intake',
    calories: data.calories,
    emoji: data.emoji,
    title: data.foodName,
    meta: {
      amount: data.amount,
      unit: data.unit,
      mealType: data.mealType
    }
  });
  isIntakeOpen.value = false;
};

const handleExerciseSubmit = async (data: any) => {
  await journalStore.addEntry({
    type: 'exercise',
    calories: data.calories,
    emoji: data.emoji,
    title: data.title || data.exerciseName,
    meta: {
      amount: data.amount,
      unit: data.unit,
      category: data.category,
      mood: data.mood
    }
  });
  isExerciseOpen.value = false;
};

const handleProfileSave = async (data: any) => {
  await userStore.updateProfile(data);
  isProfileOpen.value = false;
};
</script>

<template>
  <Layout :currentView="currentView" @changeView="v => currentView = v" @openProfile="isProfileOpen = true">

    <!-- Home 视图：抽取为了单独的组件 -->
    <HomeView v-show="currentView === 'home'" @openIntake="isIntakeOpen = true" @openExercise="isExerciseOpen = true" />

    <!-- 其他功能模块待开发占位符 -->
    <div v-show="currentView !== 'home'" class="placeholder-view">
      <div class="placeholder-content">
        <span style="font-size: 64px; margin-bottom: 24px; display: block;">🚧</span>
        <h2 style="color: #8B6A70; font-size: 24px; margin-bottom: 8px;">模块建设中</h2>
        <p style="color: #A38489;">该功能尚未开放，敬请期待！</p>
      </div>
    </div>

    <template #modals>
      <IntakeModal :isOpen="isIntakeOpen" @close="isIntakeOpen = false" @submit="handleIntakeSubmit" />
      <ExerciseModal :isOpen="isExerciseOpen" @close="isExerciseOpen = false" @submit="handleExerciseSubmit" />
      <ProfileModal v-if="userStore.user" :isOpen="isProfileOpen" :initialData="userStore.user"
        @close="isProfileOpen = false" @save="handleProfileSave" />
    </template>
  </Layout>
</template>

<style scoped>
/* 占位提示样式 */
.placeholder-view {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
  background: #F8F3ED;
  padding: 48px 64px;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
}
</style>