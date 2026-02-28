<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Layout from './components/layout/Layout.vue'
import DashboardCards from './components/dashboard/DashboardCards.vue'
import IntakeModal from './components/modals/IntakeModal.vue'
import ExerciseModal from './components/modals/ExerciseModal.vue'
import ProfileModal from './components/modals/ProfileModal.vue'
import JournalTimeline from './components/journal/JournalTimeline.vue'
import type { JournalEntry } from '@fat-loss-tracker/shared-types'

const pingResult = ref<string>('Pinging backend...')
const currentView = ref('dashboard');

onMounted(async () => {
  try {
    const res = await fetch('/api/ping')
    const data = await res.json()
    pingResult.value = `Backend Connection: ${data.status.toUpperCase()} (${data.message})`
  } catch (e: any) {
    pingResult.value = `Backend Connection Failed: ${e.message}`
  }
})

// Mocks for Phase 3 visual testing
const mockTarget = ref(1800);
const mockIntake = ref(1200);
const mockBurn = ref(300);

// Modal visibility state
const isIntakeOpen = ref(false);
const isExerciseOpen = ref(false);
const isProfileOpen = ref(false);

const journalEntries = ref<JournalEntry[]>([]);
const viewDate = ref(new Date());

const handleDateChange = (date: Date) => {
  viewDate.value = date;
  // TODO: 后续可根据 viewDate 从后端拉取该日期的记录
  console.log('Selected date changed to:', date);
};

const handleIntakeSubmit = (data: any) => {
  mockIntake.value += data.calories;
  journalEntries.value.unshift({
    id: Date.now().toString(),
    userId: 'mock-id',
    date: new Date().toISOString().split('T')[0] as string,
    timestamp: new Date().toISOString(),
    type: 'intake',
    calories: data.calories,
    emoji: data.emoji,
    title: data.foodName,
    weight: data.amount,
    unit: data.unit,
    mealType: data.mealType
  });
};

const handleExerciseSubmit = (data: any) => {
  mockBurn.value += data.calories;
  journalEntries.value.unshift({
    id: Date.now().toString(),
    userId: 'mock-id',
    date: new Date().toISOString().split('T')[0] as string,
    timestamp: new Date().toISOString(),
    type: 'exercise',
    calories: data.calories,
    emoji: data.emoji,
    title: data.title || data.exerciseName,
    amount: data.amount,
    unit: data.unit,
    category: data.category,
    mood: data.mood
  });
};


const handleProfileSave = (data: any) => {
  mockTarget.value = data.targetCalories;
  // TODO: update global nickname
};

const handleResetDay = () => {
  mockIntake.value = 0;
  mockBurn.value = 0;
  journalEntries.value = [];
};
</script>

<template>
  <Layout :currentView="currentView" @changeView="v => currentView = v" @openProfile="isProfileOpen = true">
    <!-- 这里放置刚刚移植成功的卡路里水车大屏 -->
    <DashboardCards 
      v-show="currentView === 'dashboard'"
      :targetCalories="mockTarget"
      :totalIntake="mockIntake"
      :totalBurn="mockBurn"
      @openIntake="isIntakeOpen = true"
      @openExercise="isExerciseOpen = true"
      @resetDay="handleResetDay"
    />

    <!-- 为了调试，我们保留 Backend Ping Banner 放置在大屏下方 -->
    <div v-show="currentView === 'dashboard'" style="margin-top: 20px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-weight: bold; color: var(--primary-color); text-align: center;">
      {{ pingResult }}
    </div>

    <!-- 挂载手帐流 -->
    <JournalTimeline 
        v-show="currentView === 'journal'" 
        :entries="journalEntries" 
        :totalIntake="mockIntake"
        :totalBurn="mockBurn"
        :targetCalories="mockTarget"
        @date-change="handleDateChange"
    />

    <template #modals>
      <IntakeModal :isOpen="isIntakeOpen" @close="isIntakeOpen = false" @submit="handleIntakeSubmit" />
      <ExerciseModal :isOpen="isExerciseOpen" @close="isExerciseOpen = false" @submit="handleExerciseSubmit" />
      <ProfileModal :isOpen="isProfileOpen" @close="isProfileOpen = false" @save="handleProfileSave" />
    </template>
  </Layout>
</template>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
</style>
