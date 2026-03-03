<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Layout from './components/layout/Layout.vue'
import DashboardCards from './components/dashboard/DashboardCards.vue'
import IntakeModal from './components/modals/IntakeModal.vue'
import ExerciseModal from './components/modals/ExerciseModal.vue'
import ProfileModal from './components/modals/ProfileModal.vue'
import JournalTimeline from './components/journal/JournalTimeline.vue'
import { useUserStore } from './stores/user'
import { useJournalStore } from './stores/journal'

const userStore = useUserStore()
const journalStore = useJournalStore()

const currentView = ref('dashboard');
const isIntakeOpen = ref(false);
const isExerciseOpen = ref(false);
const isProfileOpen = ref(false);

const viewDate = ref(new Date());

onMounted(async () => {
  // 初始化加载所有核心数据
  await Promise.all([
    userStore.fetchUser(),
    journalStore.fetchTodayData()
  ]);
});

// 计算属性：从 Store 中提取数据
// 优先使用 BMR × 运动系数 得出 TDEE（与 ProfileModal 保持一致）
const tdeeValue = computed(() => {
  const user = userStore.user;
  if (!user) return 0;
  if (user.bmr && user.bmr > 0) return Math.round(user.bmr * user.activityLevel);
  // 无 BMR 时退而使用 targetCalories 字段
  return user.targetCalories || 0;
});
const totalIntake = computed(() => journalStore.totals.total_intake);
const totalBurn = computed(() => journalStore.totals.total_burn);
const journalEntries = computed(() => journalStore.entries);

const handleDateChange = (date: Date) => {
  viewDate.value = date;
  // TODO: 后续扩展示时按日期拉取
  console.log('Selected date changed to:', date);
};

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

const handleResetDay = () => {
  // TODO: 后端清空今日逻辑
  console.log('Resetting day is not yet implemented on backend');
};
</script>

<template>
  <Layout :currentView="currentView" @changeView="v => currentView = v" @openProfile="isProfileOpen = true">
    <DashboardCards v-show="currentView === 'dashboard'" :targetCalories="tdeeValue" :totalIntake="totalIntake"
      :totalBurn="totalBurn" @openIntake="isIntakeOpen = true" @openExercise="isExerciseOpen = true"
      @resetDay="handleResetDay" />

    <JournalTimeline v-show="currentView === 'journal'" :entries="journalEntries" :totalIntake="totalIntake"
      :totalBurn="totalBurn" :targetCalories="tdeeValue" @date-change="handleDateChange" />

    <template #modals>
      <IntakeModal :isOpen="isIntakeOpen" @close="isIntakeOpen = false" @submit="handleIntakeSubmit" />
      <ExerciseModal :isOpen="isExerciseOpen" @close="isExerciseOpen = false" @submit="handleExerciseSubmit" />
      <ProfileModal v-if="userStore.user" :isOpen="isProfileOpen" :initialData="userStore.user"
        @close="isProfileOpen = false" @save="handleProfileSave" />
    </template>
  </Layout>
</template>