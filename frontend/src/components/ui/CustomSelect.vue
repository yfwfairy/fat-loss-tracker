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
      <div class="custom-select-arrow">▼</div>
    </div>
    <div class="custom-select-options" :class="{ hidden: !isOpen }">
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

/* 自定义下拉菜单组件 */
.custom-select-wrapper {
    position: relative;
    user-select: none;
    width: 100%;
}

.custom-select-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    background: #F8F9FA;
    padding: 12px 14px;
    border-radius: 12px;
    box-sizing: border-box;
}

.custom-select-value {
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
}

.custom-select-trigger.disabled {
    background-color: #E2E8F0;
    color: #94A3B8;
    cursor: not-allowed;
}

.custom-select-arrow {
    font-size: 10px;
    color: var(--text-secondary);
    transition: transform 0.2s;
    margin-left: 8px;
}

.custom-select-wrapper.open .custom-select-arrow {
    transform: rotate(180deg);
}

.custom-select-options {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 100%;
    background: #ffffff;
    /* 淡浆果色 */
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(200, 163, 201, 0.2);
    z-index: 100;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transform-origin: top center;
    transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
}

.custom-select-options.hidden {
    opacity: 0;
    visibility: hidden;
    transform: scaleY(0.95);
    pointer-events: none;
}

.custom-option {
    padding: 10px 12px;
    font-size: 14px;
    color: var(--text-primary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    text-align: center;
}

.custom-option:hover {
    background: var(--color-primary);
    color: white;
}

</style>
