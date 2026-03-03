<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import CustomSelect from '../ui/CustomSelect.vue';
import type { ExerciseUnit, IExerciseCategory, IExerciseOption } from '@fat-loss-tracker/shared-types';
import { api } from '../../api';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits(['close', 'submit']);

const exerciseName = ref('跑步');
const inputAmount = ref<number | null>(null);
const unit = ref<ExerciseUnit>('分钟');
const category = ref('有氧');
const mood = ref('😄');

// 从后端拉取的运动列表
const exerciseOptions = ref<IExerciseCategory>({});
const isLoadingExercises = ref(false);

onMounted(async () => {
    isLoadingExercises.value = true;
    try {
        exerciseOptions.value = await api.getExercises();
    } catch (e) {
        console.error('[ExerciseModal] Failed to fetch exercises:', e);
        // fallback 本地数据，避免白屏
        exerciseOptions.value = {
            '有氧': [{ name: '跑步', icon: '🏃', burnRatePerMin: 9, burnRatePerSet: 0 }, { name: '自定义', icon: '✏️', burnRatePerMin: 0, burnRatePerSet: 0 }],
        };
    } finally {
        isLoadingExercises.value = false;
    }
});

const currentGrid = computed<IExerciseOption[]>(() =>
    exerciseOptions.value[category.value] || []
);

// 当前选中运动的燃烧率
const currentBurnRate = computed(() => {
    const found = currentGrid.value.find(ex => ex.name === exerciseName.value);
    return found ? found.burnRatePerMin : 8;
});

const errors = ref<string[]>([]);
const customExName = ref('');
const customExCal = ref<number | null>(null);

// 切换大类时重置选中运动为该类第一项
watch(category, () => {
    exerciseName.value = currentGrid.value[0]?.name || '';
    errors.value = [];
});

watch(exerciseName, () => {
    errors.value = [];
});

const calculatedCalories = computed(() => {
    if (exerciseName.value === '自定义') {
        return customExCal.value || 0;
    }
    if (!inputAmount.value) return 0;
    if (unit.value === '分钟') {
        // 按分钟：运动量 × burnRatePerMin
        return Math.round(inputAmount.value * currentBurnRate.value);
    } else {
        // 按组：运动量 × burnRatePerSet（有氧类运动 burnRatePerSet=0，结果为 0）
        const found = currentGrid.value.find(ex => ex.name === exerciseName.value);
        return Math.round(inputAmount.value * (found?.burnRatePerSet ?? 0));
    }
});

const submit = () => {
    errors.value = [];

    if (exerciseName.value === '自定义') {
        if (!customExName.value) errors.value.push('customName');
        if (!customExCal.value || customExCal.value <= 0) errors.value.push('customCal');
    } else {
        if (!exerciseName.value) errors.value.push('exerciseName');
        if (!inputAmount.value || inputAmount.value <= 0) errors.value.push('amount');
    }

    if (errors.value.length > 0) return;

    const finalName = exerciseName.value === '自定义' ? customExName.value : exerciseName.value;
    const selectedEx = currentGrid.value.find(ex => ex.name === exerciseName.value);
    const finalIcon = exerciseName.value === '自定义' ? '✏️' : (selectedEx?.icon || '🏃');

    emit('submit', {
        type: 'exercise',
        exerciseName: finalName,
        amount: exerciseName.value === '自定义' ? 0 : inputAmount.value,
        unit: exerciseName.value === '自定义' ? '分钟' : unit.value,
        category: category.value,
        calories: calculatedCalories.value,
        mood: mood.value,
        emoji: finalIcon
    });

    // Reset
    customExName.value = '';
    customExCal.value = null;
    inputAmount.value = null;
    emit('close');
};

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        errors.value = [];
        customExName.value = '';
        customExCal.value = null;
        inputAmount.value = null;
        exerciseName.value = currentGrid.value[0]?.name || '跑步';
    }
});
</script>

<template>
    <div class="modal-overlay" :class="{ hidden: !isOpen }" @click.self="emit('close')">
        <div class="profile-settings-modal log-modal">
            <header class="modal-header">
                <h3>🏃 记消耗</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="modal-body log-modal-body-exercise">
                <!-- 上方结构：左右分栏 -->
                <div class="exercise-top-section">
                    <!-- 左侧：大类选择与数值录入 -->
                    <div class="exercise-left-col">
                        <div class="input-group">
                            <label class="input-label">🎯 运动大类</label>
                            <div class="exercise-category-selector">
                                <button class="category-btn" :class="{ active: category === '有氧' }"
                                    @click="category = '有氧'">有氧</button>
                                <button class="category-btn" :class="{ active: category === '无氧' }"
                                    @click="category = '无氧'">无氧</button>
                                <button class="category-btn" :class="{ active: category === '拉伸' }"
                                    @click="category = '拉伸'">拉伸</button>
                                <button class="category-btn" :class="{ active: category === '日常' }"
                                    @click="category = '日常'">日常</button>
                            </div>
                        </div>

                        <div class="input-group" id="regular-exercise-amount">
                            <label class="input-label" :style="{ opacity: exerciseName === '自定义' ? 0.5 : 1 }">⏱️
                                运动量</label>
                            <div class="input-with-unit-group" style="display: flex; gap: 8px;">
                                <input type="number" v-model="inputAmount" :disabled="exerciseName === '自定义'"
                                    :class="{ 'input-error': errors.includes('amount') }" class="styled-input"
                                    placeholder="输入数值" min="1" step="1" style="flex: 1;"
                                    @input="errors = errors.filter(e => e !== 'amount')">
                                <div class="custom-select-wrapper"
                                    :style="{ width: '80px', opacity: exerciseName === '自定义' ? 0.5 : 1, pointerEvents: exerciseName === '自定义' ? 'none' : 'auto' }">
                                    <CustomSelect :options="[{ value: '分钟', label: '分钟' }, { value: '组', label: '组' }]"
                                        v-model="unit" />
                                </div>
                            </div>
                        </div>

                        <!-- 运动感受 -->
                        <div class="input-group" style="margin-bottom: 0; flex: 1;">
                            <label class="input-label">😊 运动感受</label>
                            <div class="mood-rating">
                                <span class="mood-emoji" :class="{ selected: mood === '😰' }"
                                    @click="mood = '😰'">😰</span>
                                <span class="mood-emoji" :class="{ selected: mood === '😅' }"
                                    @click="mood = '😅'">😅</span>
                                <span class="mood-emoji" :class="{ selected: mood === '😄' }"
                                    @click="mood = '😄'">😄</span>
                                <span class="mood-emoji" :class="{ selected: mood === '💪' }"
                                    @click="mood = '💪'">💪</span>
                                <span class="mood-emoji" :class="{ selected: mood === '🔥' }"
                                    @click="mood = '🔥'">🔥</span>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧：运动项目网格 -->
                    <div class="exercise-right-panel">

                        <div class="exercise-grid" id="exercise-icons-grid">
                            <div class="exercise-card" v-for="ex in currentGrid" :key="ex.name"
                                :class="{ selected: exerciseName === ex.name }" @click="exerciseName = ex.name">
                                <span class="exercise-icon">{{ ex.icon }}</span>
                                <span class="exercise-name">{{ ex.name }}</span>
                            </div>
                        </div>

                        <!-- 自定义运动专用输入框 -->
                        <div class="input-group" :class="{ hidden: exerciseName !== '自定义' }" id="custom-exercise-panel">
                            <label class="input-label" style="padding-top: 20px;">✏️ 自定义运动详情</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" v-model="customExName" class="styled-input"
                                    :class="{ 'input-error': errors.includes('customName') }" placeholder="名称(如拳击)"
                                    style="flex: 1;" @input="errors = errors.filter(e => e !== 'customName')">
                                <div class="input-with-unit-group" style="width: 110px;">
                                    <input type="number" v-model="customExCal" class="styled-input"
                                        :class="{ 'input-error': errors.includes('customCal') }" placeholder="总热量"
                                        min="1" step="5" style="width: 100%; padding-right: 12px;"
                                        @input="errors = errors.filter(e => e !== 'customCal')">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 华丽的分隔线 -->
                <div class="exercise-divider"></div>

                <!-- 下方结构：感受与总结 -->
                <div class="exercise-bottom-section">

                    <!-- 消耗显示 -->
                    <div class="calorie-burn" style="flex: 1; margin: 0;">
                        <div class="burn-label">🔥 预计消耗热量</div>
                        <div class="burn-number">
                            <span>{{ calculatedCalories }}</span><span class="burn-unit">kcal</span>
                        </div>
                        <div class="food-equivalent" style="justify-content: center; font-size: 13px;">
                            <span>相当于</span>
                            <span class="equivalent-item">🍚 1.5碗米饭</span>
                        </div>
                    </div>
                </div>

            </div>

            <footer class="modal-footer">
                <button class="btn-cancel" @click="emit('close')">取消</button>
                <button class="btn-primary" @click="submit">确认记录</button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
/* 消耗弹窗专有布局 */
.log-modal-body-exercise {
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.exercise-top-section {
    display: flex;
    gap: 24px;
    align-items: stretch;
}

.exercise-left-col {
    flex: 1;
    padding-right: 24px;
    border-right: 2px dashed rgba(139, 106, 112, 0.1);
    display: flex;
    flex-direction: column;
}

.exercise-right-panel {
    width: 360px;
    /* Fixed width prevents jitter */
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
}

.exercise-category-selector {
    display: flex;
    gap: 10px;
    background: #F8F9FA;
    padding: 6px;
    border-radius: 100px;
}

.category-btn {
    flex: 1;
    padding: 8px;
    border: none;
    background: transparent;
    border-radius: 100px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    transition: all 0.2s;
}

.category-btn:hover {
    color: var(--color-accent);
}

.category-btn.active {
    background: white;
    color: var(--color-accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.exercise-divider {
    height: 0;
    margin: 24px 0;
    border-top: 2px dashed rgba(139, 106, 112, 0.1);
}

.exercise-bottom-section {
    display: flex;
    gap: 24px;
    align-items: center;
}

.calorie-burn {
    background: var(--color-light-green);
    color: white;
    padding: 16px;
    border-radius: var(--border-radius-md);
    text-align: center;
    margin: 20px 0;
    box-shadow: 0 8px 20px rgba(200, 163, 201, 0.2);
    /* 偏向抹茶绿的主题投影 */
}

.intensity-btn.active.low {
    background: white;
    color: #8FBB95;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.intensity-btn.active.mid {
    background: white;
    color: #E9C46A;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.intensity-btn.active.high {
    background: white;
    color: #e96a6a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 运动网格 */
.exercise-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.exercise-card {
    aspect-ratio: 1;
    background: #F8F9FA;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-bouncy);
    border: 2px solid transparent;
}

.exercise-card:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: var(--shadow-soft);
}

.exercise-card.selected {
    background: white;
    border-color: var(--color-primary);
    box-shadow: 0 4px 15px rgba(200, 163, 201, 0.2);
}

.exercise-icon {
    font-size: 24px;
    margin-bottom: 4px;
}

.exercise-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-primary);
}

/* 布局对齐辅助 */
.input-with-unit-group {
    display: flex;
    align-items: center;
}


/* 心情评分 */
.mood-rating {
    display: flex;
    justify-content: space-between;
    padding: 16px 20px;
    background: #F8F9FA;
    border-radius: 100px;
}

.mood-emoji {
    font-size: 28px;
    cursor: pointer;
    opacity: 0.4;
    filter: grayscale(100%);
    transition: var(--transition-bouncy);
}

.mood-emoji:hover {
    opacity: 0.8;
    transform: scale(1.1);
}

.mood-emoji.selected {
    opacity: 1;
    filter: grayscale(0%);
    transform: scale(1.2);
}
</style>
