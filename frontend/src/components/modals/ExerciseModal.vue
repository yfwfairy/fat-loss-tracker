<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomSelect from '../ui/CustomSelect.vue';
import type { ExerciseUnit } from '@fat-loss-tracker/shared-types';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'submit']);

const exerciseName = ref('');
const inputAmount = ref<number | null>(null);
const unit = ref<ExerciseUnit>('分钟');
const category = ref('有氧');

const categoryOptions = ['有氧', '无氧', '拉伸', '日常'];
const burnRate = 8; // mock DB burn factor

const calculatedCalories = computed(() => {
  if (!inputAmount.value) return 0;
  if (unit.value === '分钟') {
    return Math.round(inputAmount.value * burnRate);
  } else {
    return Math.round(inputAmount.value * (burnRate * 5));
  }
});

const submit = () => {
  if (!exerciseName.value || !inputAmount.value) return;
  emit('submit', {
    type: 'exercise',
    exerciseName: exerciseName.value,
    amount: inputAmount.value,
    unit: unit.value,
    category: category.value,
    calories: calculatedCalories.value
  });
  
  exerciseName.value = '';
  inputAmount.value = null;
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" :class="{ active: isOpen }" @click.self="emit('close')">
    <div class="modal-content exercise">
      <div class="modal-header">
        <h3>记录消耗</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        
        <div class="exercise-categories">
          <button 
            v-for="cat in categoryOptions" :key="cat"
            class="category-btn" :class="{ active: category === cat }"
            @click="category = cat"
          >
            <i class="fas" :class="{
              'fa-running': cat === '有氧',
              'fa-dumbbell': cat === '无氧',
              'fa-child': cat === '拉伸',
              'fa-walking': cat === '日常'
            }"></i>
            <span>{{ cat }}</span>
          </button>
        </div>

        <div class="input-group">
          <label>做了什么运动？</label>
          <input type="text" v-model="exerciseName" class="styled-input" placeholder="例如：跑步、大重量深蹲..." />
        </div>

        <div class="input-group">
          <label>多久 / 多少次？</label>
          <div class="weight-input-container">
            <input type="number" v-model="inputAmount" class="styled-input" placeholder="0" />
            <CustomSelect 
              :options="[{value: '分钟', label: '分钟'}, {value: '次', label: '次'}, {value: '组', label: '组'}]" 
              v-model="unit" 
            />
          </div>
        </div>

        <div class="calc-preview">
          约消耗 <span class="highlight">{{ calculatedCalories }}</span> 千卡
        </div>

        <button class="primary-btn exercise" @click="submit" :disabled="!exerciseName || !inputAmount">确认记录</button>
      </div>
    </div>
  </div>
</template>
