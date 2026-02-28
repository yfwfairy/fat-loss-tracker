<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  options: { value: string, label: string }[];
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const selectOption = (val: string) => {
  emit('update:modelValue', val);
  emit('change', val);
  isOpen.value = false;
};

// 点击外围自动收起下拉框
const clickOutside = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.custom-select-wrapper')) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', clickOutside));
onUnmounted(() => document.removeEventListener('click', clickOutside));

const getLabel = (val: string) => {
  return props.options.find(o => o.value === val)?.label || val;
};
</script>

<template>
  <div class="custom-select-wrapper" :class="{ open: isOpen }">
    <div class="custom-select-trigger" @click.stop="toggleMenu">
      <span class="custom-select-value">{{ getLabel(modelValue) }}</span>
      <div class="custom-select-arrow"></div>
    </div>
    <div class="custom-options">
      <div 
        v-for="opt in options" 
        :key="opt.value"
        class="custom-option"
        :class="{ selected: modelValue === opt.value }"
        @click.stop="selectOption(opt.value)"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  所有的下拉框样式依然依赖您手写的原生 CSS (.custom-select-wrapper 等)
  我们仅在此处用 Vue 的 ref 控制 open class。
*/
</style>
