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

const handleIntakeSubmit = (data: any) => {
  mockIntake.value += data.calories;
  journalEntries.value.unshift({
    id: Date.now().toString(),
    userId: 'mock-id',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    type: 'intake',
    calories: data.calories,
    emoji: '☕',
    title: data.foodName,
    amount: data.amount,
    unit: data.unit,
    mealType: data.mealType
  });
};

const handleExerciseSubmit = (data: any) => {
  mockBurn.value += data.calories;
  journalEntries.value.unshift({
    id: Date.now().toString(),
    userId: 'mock-id',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    type: 'exercise',
    calories: data.calories,
    emoji: categoryToEmoji(data.category),
    title: data.exerciseName,
    amount: data.amount,
    unit: data.unit,
    category: data.category
  });
};

const categoryToEmoji = (cat: string) => {
  if (cat === '有氧') return '🏃';
  if (cat === '无氧') return '🏋️';
  if (cat === '拉伸') return '🧘';
  return '🚶';
};

const handleProfileSave = (data: any) => {
  mockTarget.value = data.targetCalories;
  // TODO: update global nickname
};
</script>

<template>
  <Layout>
    <!-- 这里放置刚刚移植成功的卡路里水车大屏 -->
    <DashboardCards 
      :targetCalories="mockTarget"
      :totalIntake="mockIntake"
      :totalBurn="mockBurn"
    />

    <!-- 为了调试，我们保留 Backend Ping Banner 放置在大屏下方 -->
    <div style="margin-top: 20px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 12px; font-weight: bold; color: var(--primary-color); text-align: center;">
      {{ pingResult }}
    </div>

    <!-- 临时加减按钮，替代浮动FAB，测试弹窗 -->
    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 10px; margin-bottom: 20px;">
      <button class="primary-btn" style="width: auto; padding: 0 20px; border-radius: 20px;" @click="isIntakeOpen = true">+ 记录饮食</button>
      <button class="primary-btn exercise" style="width: auto; padding: 0 20px; border-radius: 20px;" @click="isExerciseOpen = true">- 记录运动</button>
      <button class="primary-btn" style="width: auto; padding: 0 20px; background: #666; border-radius: 20px;" @click="isProfileOpen = true">👤 我的档案</button>
    </div>

    <!-- 挂载手帐流 -->
    <JournalTimeline :entries="journalEntries" />

    <template #modals>
      <IntakeModal :isOpen="isIntakeOpen" @close="isIntakeOpen = false" @submit="handleIntakeSubmit" />
      <ExerciseModal :isOpen="isExerciseOpen" @close="isExerciseOpen = false" @submit="handleExerciseSubmit" />
      <ProfileModal :isOpen="isProfileOpen" @close="isProfileOpen = false" @save="handleProfileSave" />
    </template>
  </Layout>
</template>

<style>
/* 强行引入原生工程的全局浆果日落 UI 样式库 */
@import '/css/style.css';
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
</style>
