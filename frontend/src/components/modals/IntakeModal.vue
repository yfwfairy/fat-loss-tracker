<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import CustomSelect from '../ui/CustomSelect.vue';
import type { IntakeUnit, IFoodItem } from '@fat-loss-tracker/shared-types';
import { api } from '../../api';

const props = defineProps<{
    isOpen: boolean;
}>();

const emit = defineEmits(['close', 'submit']);

const foodName = ref('');
const inputAmount = ref<number | null>(null);
const unit = ref<IntakeUnit>('g');
const mealType = ref('午餐'); // default mock

const isEmojiPopoverOpen = ref(false);
const selectedEmoji = ref('❓');

// 从后端拉取的食物列表
const foodList = ref<IFoodItem[]>([]);
const isLoadingFoods = ref(false);

onMounted(async () => {
    isLoadingFoods.value = true;
    try {
        foodList.value = await api.getFoods();
    } catch (e) {
        console.error('[IntakeModal] Failed to fetch foods:', e);
    } finally {
        isLoadingFoods.value = false;
    }
});

// 当前选中的食物（完整对象，含两种卡路里字段）
const selectedFood = ref<IFoodItem | null>(null);

const selectFood = (food: IFoodItem) => {
    foodName.value = food.name;
    selectedEmoji.value = food.icon;
    selectedFood.value = food;
    isEmojiPopoverOpen.value = false;
    errors.value = errors.value.filter(e => e !== 'foodName');
};

const resetToCustom = () => {
    selectedEmoji.value = '🍽️';
    selectedFood.value = null;
    isEmojiPopoverOpen.value = false;
};

// 未对应列表食物时为自定义模式
const isCustomMode = computed(() => selectedFood.value === null);

const calculatedCalories = computed(() => {
    if (!inputAmount.value) return 0;
    // 自定义模式：直接输入 kcal
    if (isCustomMode.value) return inputAmount.value;
    if (unit.value === 'g') {
        // 按克重：摄入量 / 100 × caloriesPer100g
        const rate = selectedFood.value?.caloriesPer100g ?? 150;
        return Math.round((inputAmount.value / 100) * rate);
    } else {
        // 按份：份数 × caloriesPerServing
        const rate = selectedFood.value?.caloriesPerServing ?? 200;
        return Math.round(inputAmount.value * rate);
    }
});

const errors = ref<string[]>([]);

const submit = () => {
    errors.value = [];
    if (!foodName.value) errors.value.push('foodName');
    if (!inputAmount.value || inputAmount.value <= 0) errors.value.push('amount');

    if (errors.value.length > 0) return;

    emit('submit', {
        type: 'intake',
        foodName: foodName.value,
        amount: inputAmount.value,
        unit: unit.value,
        mealType: mealType.value,
        calories: calculatedCalories.value,
        emoji: selectedEmoji.value === '❓' ? '🍽️' : selectedEmoji.value
    });
    foodName.value = '';
    inputAmount.value = null;
    selectedEmoji.value = '❓';
    emit('close');
};

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        errors.value = [];
        foodName.value = '';
        inputAmount.value = null;
        selectedEmoji.value = '❓';
        selectedFood.value = null;
    }
});
</script>

<template>
    <div class="modal-overlay" :class="{ hidden: !isOpen }" @click.self="emit('close')">
        <div class="profile-settings-modal log-modal">
            <header class="modal-header">
                <h3>🍞 记摄入</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="modal-body log-modal-body-split">
                <!-- 左列：输入与选项 -->
                <div class="intake-left-col">
                    <!-- 食物名称 -->
                    <div class="input-group">
                        <label class="input-label">🍳 食物名称</label>
                        <div class="food-input-wrapper">
                            <div class="emoji-picker-container" style="position: relative;">
                                <button class="food-emoji-btn" title="选择分类图标"
                                    @click="isEmojiPopoverOpen = !isEmojiPopoverOpen">{{ selectedEmoji }}</button>

                                <!-- Emoji 选择浮窗 -->
                                <div class="emoji-popover" :class="{ hidden: !isEmojiPopoverOpen }">
                                    <div class="emoji-grid">
                                        <span class="custom-emoji-btn" title="自定义" @click="resetToCustom">➕</span>
                                        <span v-if="isLoadingFoods"
                                            style="grid-column: span 4; text-align:center; font-size:13px; color: #aaa;">加载中...</span>
                                        <span v-for="food in foodList" :key="food.name" @click="selectFood(food)">
                                            {{ food.icon }}
                                        </span>
                                    </div>
                                    <div class="popover-arrow"></div>
                                </div>
                            </div>
                            <input type="text" v-model="foodName" class="styled-input"
                                :class="{ 'input-error': errors.includes('foodName') }" placeholder="例如：燕麦片、鸡胸肉..."
                                @input="errors = errors.filter(e => e !== 'foodName')">
                        </div>
                    </div>

                    <!-- 份量输入 (带单位切换) -->
                    <div class="input-group">
                        <label class="input-label">⚖️ 摄入量</label>
                        <div class="input-with-unit-group" style="display: flex; gap: 8px;">
                            <input type="number" v-model="inputAmount" class="styled-input"
                                :class="{ 'input-error': errors.includes('amount') }"
                                :placeholder="isCustomMode ? '请直接输入 kcal' : '输入数值'" min="1" step="1" style="flex: 1;"
                                @input="errors = errors.filter(e => e !== 'amount')">
                            <!-- 自定义模式：显示静态 kcal 标签 -->
                            <div v-if="isCustomMode" class="unit-kcal-badge">kcal</div>
                            <!-- 已选食物：显示单位切换 -->
                            <div v-else class="custom-select-wrapper" style="width: 80px;">
                                <CustomSelect :options="[{ value: 'g', label: '克' }, { value: '份', label: '份' }]"
                                    v-model="unit" />
                            </div>
                        </div>
                    </div>
                    <!-- 餐别选择 -->
                    <div class="input-group">
                        <label class="input-label">🍽️ 用餐时间</label>
                        <div class="meal-selector">
                            <button class="meal-btn" :class="{ active: mealType === '早餐' }"
                                @click="mealType = '早餐'">早餐</button>
                            <button class="meal-btn" :class="{ active: mealType === '午餐' }"
                                @click="mealType = '午餐'">午餐</button>
                            <button class="meal-btn" :class="{ active: mealType === '晚餐' }"
                                @click="mealType = '晚餐'">晚餐</button>
                            <button class="meal-btn" :class="{ active: mealType === '加餐' }"
                                @click="mealType = '加餐'">加餐</button>
                        </div>
                    </div>

                    <!-- 备注 -->
                    <div class="input-group">
                        <label class="input-label">📝 备注 (可选)</label>
                        <input type="text" class="styled-input" placeholder="记录这顿饭的感受...">
                    </div>
                </div>

                <!-- 右列：营养评估 -->
                <div class="intake-right-panel">
                    <!-- 营养成分卡片 -->
                    <div class="nutrition-card">
                        <div>
                            <div class="nutrition-title">营养评估</div>
                            <p class="nutrition-subtitle">基于当前摄入量动态测算</p>

                            <div class="nutrient-row">
                                <span class="nutrient-icon">🌾</span>
                                <span class="nutrient-name">碳水</span>
                                <div class="nutrient-bar-bg">
                                    <div class="nutrient-bar-fill bar-carbs" style="width: 45%;"></div>
                                </div>
                                <span class="nutrient-value">45g</span>
                            </div>

                            <div class="nutrient-row">
                                <span class="nutrient-icon">🥑</span>
                                <span class="nutrient-name">脂肪</span>
                                <div class="nutrient-bar-bg">
                                    <div class="nutrient-bar-fill bar-fat" style="width: 20%;"></div>
                                </div>
                                <span class="nutrient-value">8g</span>
                            </div>

                            <div class="nutrient-row">
                                <span class="nutrient-icon">🥚</span>
                                <span class="nutrient-name">蛋白</span>
                                <div class="nutrient-bar-bg">
                                    <div class="nutrient-bar-fill bar-protein" style="width: 35%;"></div>
                                </div>
                                <span class="nutrient-value">12g</span>
                            </div>
                        </div>

                        <!-- 热量总计 -->
                        <div class="calorie-total intake-total">
                            <div class="calorie-label">🔥 预计转化热量</div>
                            <div class="calorie-number">
                                <span>{{ calculatedCalories }}</span><span class="calorie-unit">kcal</span>
                            </div>
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
/* 分栏布局 */
.log-modal-body-split {
    display: flex;
    gap: 24px;
    padding: 24px;
    align-items: stretch;
    overflow-y: auto;
}

.intake-left-col {
    flex: 1.3;
    padding-right: 24px;
    border-right: 2px dashed rgba(139, 106, 112, 0.1);
}

.intake-right-panel {
    flex: 1;
    min-width: 260px;
    display: flex;
    flex-direction: column;
}

/* 食物名称输入行 */
.food-input-wrapper {
    display: flex;
    gap: 12px;
    align-items: center;
}

.food-emoji-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #F8F9FA;
    border: 2px solid transparent;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.food-emoji-btn:hover {
    background: #FFEDEA;
    border-color: var(--color-accent);
}

/* Emoji Picker 容器 */
.emoji-picker-container {
    position: relative;
}

/* Emoji 浮窗 */
.emoji-popover {
    position: absolute;
    top: 56px;
    left: 0;
    width: 220px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding: 12px;
    z-index: 100;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transform-origin: top left;
}

.emoji-popover.hidden {
    opacity: 0;
    visibility: hidden;
    transform: scale(0.95) translateY(-5px);
    pointer-events: none;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.emoji-grid span {
    font-size: 24px;
    text-align: center;
    padding: 6px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.15s;
    user-select: none;
}

.emoji-grid span:hover {
    background: #F8F9FA;
    transform: scale(1.1);
}

.custom-emoji-btn {
    border: 2px dashed rgba(139, 106, 112, 0.3);
    color: var(--text-secondary);
    font-size: 20px !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 浮窗小箭头 */
.popover-arrow {
    position: absolute;
    top: -6px;
    left: 18px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

/* 摄入量与单位水平排列 */
.input-with-unit-group {
    display: flex;
    gap: 12px;
    align-items: center;
}

.input-with-unit-group .styled-input {
    flex: 1;
}

/* 自定义模式下的 kcal 静态标签 */
.unit-kcal-badge {
    width: 80px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F8F9FA;
    border: 1px solid rgba(241, 225, 250, 0.75);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: 0.5px;
    flex-shrink: 0;
}

/* 单位切换 Toggle */
.unit-toggle {
    display: flex;
    gap: 4px;
    background: #F8F9FA;
    padding: 4px;
    border-radius: 100px;
}

.unit-option {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    padding: 4px 12px;
    border-radius: 100px;
    cursor: pointer;
    transition: all 0.2s;
}

.unit-option:hover {
    color: var(--color-accent);
}

.unit-option.active {
    background: white;
    color: var(--color-accent);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nutrition-card {
    background: #FFF6F5;
    border-radius: var(--border-radius-md);
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: inset 0 2px 5px rgba(242, 132, 130, 0.05);
}

.nutrition-title {
    text-align: left;
    color: var(--color-accent);
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 4px;
}

.nutrition-subtitle {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 16px;
}

.nutrient-row {
    display: flex;
    align-items: center;
    margin: 12px 0;
    gap: 12px;
}

.nutrient-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
}

.nutrient-name {
    width: 40px;
    color: var(--text-primary);
    font-weight: 700;
    font-size: 13px;
}

.nutrient-bar-bg {
    flex: 1;
    height: 8px;
    background: white;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nutrient-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
}

.bar-carbs {
    background: #D4A373;
}

/* 原木/麦色 */
.bar-fat {
    background: #E9C46A;
}

/* 柔黄 */
.bar-protein {
    background: #F28482;
}

/* 珊瑚粉 */

.nutrient-value {
    width: 40px;
    text-align: right;
    font-family: 'Nunito', monospace;
    font-weight: 700;
    color: var(--text-secondary);
    font-size: 13px;
}

/* 总结高亮区块 */
.calorie-total {
    border-radius: var(--border-radius-md);
    padding: 16px;
    text-align: center;
    margin-top: 20px;
    color: white;
}

.intake-total {
    background: var(--color-light-red);
    box-shadow: 0 8px 20px rgba(158, 132, 144, 0.2);
}

.food-equivalent {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(255, 255, 255, 0.4);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.equivalent-item {
    background: rgba(255, 255, 255, 0.2);
    padding: 3px 8px;
    border-radius: 8px;
}
</style>
