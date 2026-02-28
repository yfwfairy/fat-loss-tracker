<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomSelect from '../ui/CustomSelect.vue';
import type { IntakeUnit } from '@fat-loss-tracker/shared-types';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'submit']);

const foodName = ref('');
const inputAmount = ref<number | null>(null);
const unit = ref<IntakeUnit>('g');
const mealType = ref('午餐'); // default mock

const caloriesPer100g = 150; // mock core DB variable

const calculatedCalories = computed(() => {
  if (!inputAmount.value) return 0;
  if (unit.value === 'g') {
    return Math.round((inputAmount.value / 100) * caloriesPer100g);
  } else {
    return Math.round(inputAmount.value * caloriesPer100g);
  }
});

const submit = () => {
  if (!foodName.value || !inputAmount.value) return;
  emit('submit', {
    type: 'intake',
    foodName: foodName.value,
    amount: inputAmount.value,
    unit: unit.value,
    mealType: mealType.value,
    calories: calculatedCalories.value
  });
  foodName.value = '';
  inputAmount.value = null;
  emit('close');
};
</script>

<template>
  <div class="modal-overlay" :class="{ active: isOpen }" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>记录摄入</h3>
        <button class="close-btn" @click="emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        
        <div class="input-group">
          <label>吃/喝了什么？</label>
          <input type="text" v-model="foodName" class="styled-input" placeholder="例如：拿铁、水煮蛋..." />
        </div>

        <div class="input-group">
          <label>吃了多少？</label>
          <div class="weight-input-container">
            <input type="number" v-model="inputAmount" class="styled-input" placeholder="0" />
            <CustomSelect 
              :options="[{value: 'g', label: '克 (g)'}, {value: '份', label: '份 (Serving)'}]" 
              v-model="unit" 
            />
          </div>
        </div>

        <div class="calc-preview">
          约摄入 <span class="highlight">{{ calculatedCalories }}</span> 千卡
        </div>

        <button class="primary-btn" @click="submit" :disabled="!foodName || !inputAmount">确认记录</button>
      </div>
    </div>
  </div>
</template>
