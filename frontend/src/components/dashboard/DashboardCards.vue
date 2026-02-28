<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  targetCalories: number;
  totalIntake: number;
  totalBurn: number;
}>();

const remainingCalories = computed(() => {
  return props.targetCalories - props.totalIntake + props.totalBurn;
});

const isOverLimit = computed(() => {
  return remainingCalories.value < 0;
});

// 计算环形进度条的冲刺比例
const progressOffset = computed(() => {
  const circumference = 283; // 2 * pi * 45
  let consumedNet = props.totalIntake - props.totalBurn;
  if (consumedNet < 0) consumedNet = 0;
  
  let ratio = consumedNet / props.targetCalories;
  if (ratio > 1) ratio = 1;

  return circumference - (ratio * circumference);
});

const todayDateString = computed(() => {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
});
</script>

<template>
  <section class="overview-section">
    <div class="date-display">
      <h2>今天</h2>
      <span class="date-text">{{ todayDateString }}</span>
    </div>
    
    <div class="calorie-summary">
      <div class="circle-progress" :class="{ 'over-limit': isOverLimit }">
        <svg viewBox="0 0 100 100">
          <circle class="circle-bg" cx="50" cy="50" r="45"></circle>
          <circle 
            class="circle-bar" 
            cx="50" 
            cy="50" 
            r="45" 
            stroke-dasharray="283" 
            :stroke-dashoffset="progressOffset"
          ></circle>
        </svg>
        <div class="circle-text">
          <span class="remaining-value">{{ Math.abs(remainingCalories) }}</span>
          <span class="remaining-label">{{ isOverLimit ? '超标千卡' : '剩余千卡' }}</span>
        </div>
      </div>
      
      <div class="calorie-stats">
        <div class="stat-item">
          <div class="stat-icon intake"><i class="fas fa-utensils"></i></div>
          <div class="stat-info">
            <span class="stat-label">摄入</span>
            <span class="stat-value">{{ totalIntake }}</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon burn"><i class="fas fa-fire"></i></div>
          <div class="stat-info">
            <span class="stat-label">消耗</span>
            <span class="stat-value">{{ totalBurn }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 
Vue 的 Computed 接管了 SVG 位移计算，
CSS 只负责原本在全局 style.css 中的过渡动画：
.circle-bar { transition: stroke-dashoffset 1s ease-out; } 
*/
</style>
