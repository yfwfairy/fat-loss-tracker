<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { IUser } from '@fat-loss-tracker/shared-types'

const pingResult = ref<string>('Pinging backend...')
const userMock = ref<IUser | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/ping')
    const data = await res.json()
    pingResult.value = `Backend says: ${data.message} at ${data.timestamp}`
    
    // Test shared types
    userMock.value = {
      id: "test-id",
      nickname: "Tester",
      avatarId: 1,
      height: 175,
      weight: 70,
      targetCalories: 2000,
      bmi: 22.8
    }
  } catch (e: any) {
    pingResult.value = `Error connecting to backend: ${e.message}`
  }
})
</script>

<template>
  <div style="font-family: sans-serif; padding: 2rem;">
    <h1>Fat Loss Tracker - Fullstack MVP</h1>
    <div style="padding: 1rem; background: #f0f0f0; border-radius: 8px;">
      <h3>Backend Connection Status:</h3>
      <p style="color: green; font-weight: bold;">{{ pingResult }}</p>
    </div>
    
    <div v-if="userMock" style="margin-top: 1rem; padding: 1rem; background: #e0f0ff; border-radius: 8px;">
      <h3>Shared Types Validation:</h3>
      <p>Loaded mock user with type `IUser`: {{ userMock.nickname }} (BMI: {{ userMock.bmi }})</p>
    </div>
  </div>
</template>
