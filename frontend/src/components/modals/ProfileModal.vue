<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'save']);

const nickname = ref('Berry');
const height = ref<number | null>(165);
const weight = ref<number | null>(55);
const targetCalories = ref<number | null>(1400);

const calculateBMI = (h: number, w: number) => {
  const heightM = h / 100;
  return (w / (heightM * heightM)).toFixed(1);
};

const getBMICategory = (bmiValue: number) => {
  if (bmiValue < 18.5) return { label: '偏瘦', color: '#ffb347' }; 
  if (bmiValue <= 23.9) return { label: '正常', color: '#77dd77' }; 
  if (bmiValue <= 27.9) return { label: '超重', color: '#ff6961' }; 
  return { label: '肥胖', color: '#ff3030' }; 
};

const bmiData = computed(() => {
  if (!height.value || !weight.value) return null;
  const val = parseFloat(calculateBMI(height.value, weight.value));
  return {
    value: val,
    ...getBMICategory(val)
  };
});

const saveProfile = () => {
  emit('save', {
    nickname: nickname.value,
    height: height.value,
    weight: weight.value,
    targetCalories: targetCalories.value,
    bmi: bmiData.value?.value || 0
  });
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" :class="{ active: isOpen }" @click.self="emit('close')">
    <div class="modal-content side-panel">
      <div class="modal-header">
        <h3>设置与档案</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body profile-body">
        
        <div class="profile-header">
          <img src="/assets/avatars/avatar3.png" alt="Avatar" class="avatar-large" />
          <button class="text-btn">更换头像</button>
        </div>

        <div class="input-group">
          <label>昵称</label>
          <input type="text" v-model="nickname" class="styled-input" />
        </div>

        <h4 class="section-title">身体指标</h4>
        <div class="body-metrics-grid">
          <div class="metric-input">
            <label>身高 (cm)</label>
            <input type="number" v-model="height" class="styled-input" />
          </div>
          <div class="metric-input">
            <label>体重 (kg)</label>
            <input type="number" v-model="weight" class="styled-input" />
          </div>
        </div>

        <div class="bmi-display" v-if="bmiData">
          <div class="bmi-value-circle">
            <span class="bmi-num" :style="{ color: bmiData.color }">{{ bmiData.value }}</span>
            <span class="bmi-label">BMI</span>
          </div>
          <div class="bmi-status" :style="{ color: bmiData.color }">
            {{ bmiData.label }}
          </div>
        </div>

        <h4 class="section-title">卡路里目标</h4>
        <div class="input-group">
          <label>每日建议摄入 (千卡)</label>
          <input type="number" v-model="targetCalories" class="styled-input" />
          <p class="helper-text">系统建议：约 1500 千卡/天</p>
        </div>

        <button class="primary-btn save-profile-btn" @click="saveProfile">保存更新</button>
      </div>
    </div>
  </div>
</template>
