<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
    targetCalories: number;
    totalIntake: number;
    totalBurn: number;
}>();

const emit = defineEmits(['openIntake', 'openExercise', 'resetDay']);

const baseAllowance = computed(() => props.targetCalories);
const caloriesConsumed = computed(() => props.totalIntake);
const bonusCapacity = computed(() => props.totalBurn); // totalBurn tracks extra burns

const totalCapacity = computed(() => baseAllowance.value + bonusCapacity.value);
const remaining = computed(() => totalCapacity.value - caloriesConsumed.value);
const fillRatio = computed(() => Math.max(0, Math.min(1, remaining.value / totalCapacity.value)));
const fillPct = computed(() => (fillRatio.value * 100).toFixed(1) + '%');

const deficit = computed(() => totalCapacity.value - caloriesConsumed.value);

const QUOTES = [
    { min: 1000, text: "哇哦！这种缺口简直是燃脂大师！" },
    { min: 500, text: "干得漂亮！又打败了一大波脂肪怪！" },
    { min: 200, text: "稳步前进中，身体正在变轻盈哦~" },
    { min: 0, text: "继续保持，离目标又近了一步！" },
    { min: -9999, text: "没关系，明天又是新的一天，加油！" }
];

const deficitQuote = computed(() => {
    const foundQuote = QUOTES.find(q => deficit.value >= q.min);
    return foundQuote ? `"${foundQuote.text}"` : "";
});

const status = computed(() => {
    if (remaining.value <= -500) return 'gameover';
    if (remaining.value <= 0) return 'depleted';
    if (remaining.value <= 300) return 'warning';
    return 'normal';
});

// Calculate marks (every 200 kcal)
const trackMarks = computed(() => {
    const marks = [];
    const markInterval = 200;
    const markCount = Math.floor(totalCapacity.value / markInterval);
    for (let i = 0; i <= markCount; i++) {
        const kcalConsumedAtMark = i * markInterval;
        const positionPct = 100 - (kcalConsumedAtMark / totalCapacity.value * 100);
        marks.push(positionPct);
    }
    return marks;
});

// Float Text Logic
const floatTexts = ref<{ id: number; text: string; isPositive: boolean }[]>([]);
let nextFloatId = 1;

const addFloatText = (text: string, isPositive: boolean) => {
    const id = nextFloatId++;
    floatTexts.value.push({ id, text, isPositive });
    setTimeout(() => {
        floatTexts.value = floatTexts.value.filter(ft => ft.id !== id);
    }, 1200);
};

// 使用一个标记来跳过组件刚挂载时的初次数据同步飘字
let isInitialLoad = true;
setTimeout(() => {
    isInitialLoad = false;
}, 1000); // 1秒后解除锁定，此时基本完成接口请求和数据赋值

watch(() => props.totalIntake, (newVal, oldVal) => {
    if (isInitialLoad) return;
    if (newVal > oldVal) {
        addFloatText(`+${newVal - oldVal} kcal`, false);
    }
});

watch(() => props.totalBurn, (newVal, oldVal) => {
    if (isInitialLoad) return;
    if (newVal > oldVal) {
        addFloatText(`+${newVal - oldVal} 容量`, true);
    }
});
</script>

<template>
    <div class="view-container" id="view-dashboard">
        <!-- 1. 顶部英雄卡片 (游戏化体力条) -->
        <section class="survival-game-card">
            <!-- 标题行 -->
            <div class="game-header-panel">
                <div class="game-title-group">
                    <span class="game-title-icon">🍓</span>
                    <span class="game-title-text">今日体力·卡路里之路</span>
                    <!-- 装饰小草 -->
                    <div class="grass-decorations">
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                        <div class="grass"></div>
                    </div>
                </div>

            </div>
            <!-- 轨道 + 进度条区域 -->
            <div class="track-wrapper" id="trackWrapper">
                <div class="survival-track">
                    <!-- 刻度 -->
                    <div class="track-marks">
                        <div v-for="(pos, idx) in trackMarks" :key="idx" :style="{ right: pos + '%' }"></div>
                    </div>
                    <!-- 动态填充条（宽度由 JS 控制） -->
                    <div class="survival-fill" :class="status" id="survivalFill" :style="{ width: fillPct }"></div>
                    <!-- 体力条上的小人化身（右侧对齐当前宽度） -->
                    <div class="header-kcal-wrapper" style="position: relative;">
                        <div class="float-text-container" id="floatContainer">
                            <div v-for="ft in floatTexts" :key="ft.id" class="float-text"
                                :style="{ color: ft.isPositive ? '#B1A678' : '#D6697A' }">{{ ft.text }}</div>
                        </div>
                    </div>
                    <div class="survival-avatar" :class="status === 'depleted' || status === 'gameover' ? status : ''"
                        id="survivalAvatar" :style="{ right: fillPct }">
                        <!-- 用纯 CSS 拼接的小人，基于原型 -->
                        <div class="sv-avatar-hat">
                            <div class="hat-brim"></div>
                            <div class="hat-top"></div>
                        </div>
                        <div class="sv-avatar-head">
                            <div class="sv-eye left"></div>
                            <div class="sv-eye right"></div>
                            <div class="sv-sweat" id="svSweat"
                                :style="{ display: status === 'warning' ? 'block' : 'none' }"></div>
                        </div>
                        <div class="sv-avatar-body">
                            <div class="sv-pants"></div>
                        </div>
                    </div>
                </div>

                <!-- 4. 快捷动作触发区 (挪入进度条内) -->
                <section class="quick-actions wood-actions">
                    <button class="pixel-btn btn-action-eat" @click="emit('openIntake')">
                        <span class="action-icon">🍎</span>
                        <span class="action-text">记摄入</span>
                    </button>
                    <button class="pixel-btn btn-action-exercise" @click="emit('openExercise')">
                        <span class="action-icon">🏃</span>
                        <span class="action-text">记消耗</span>
                    </button>
                    <button class="pixel-btn btn-action-reset" @click="emit('resetDay')">
                        <span class="action-icon">🔄</span>
                        <span class="action-text">重置</span>
                    </button>
                </section>
            </div>
        </section>

        <!-- 3. 数据仪表盘区 -->
        <section class="stats-dashboard">
            <!-- 卡片 A: 饮食摄入 -->
            <div class="stat-card card-diet">
                <div class="stat-icon">🍽️</div>
                <div class="stat-content">
                    <div class="stat-title">今日摄入</div>
                    <div class="stat-value"><span id="dietValue">{{ Math.round(caloriesConsumed) }}</span> <span
                            class="unit">kcal</span></div>
                    <div class="mini-bar">
                        <div class="mini-fill" id="dietBar"
                            :style="{ width: Math.min(100, (caloriesConsumed / totalCapacity) * 100) + '%' }"></div>
                    </div>
                </div>
            </div>

            <!-- 卡片 B: 运动消耗 (总容量) -->
            <div class="stat-card card-burn">
                <div class="stat-icon">🔥</div>
                <div class="stat-content">
                    <div class="stat-title">总消耗</div>
                    <div class="stat-value"><span id="burnValue">{{ Math.round(totalCapacity) }}</span> <span
                            class="unit">kcal</span></div>
                    <div class="stat-subtext" id="burnSub">基础 {{ baseAllowance }} + 活动 {{ Math.round(bonusCapacity) }}
                    </div>
                </div>
            </div>

            <!-- 卡片 C: 缺口结算 (跨两列) -->
            <div class="stat-card card-deficit full-width">
                <div class="stat-icon">🌟</div>
                <div class="deficit-info">
                    <div class="stat-title">今日缺口结算</div>
                    <div class="stat-value" :class="{ 'highlight-deficit': deficit >= 0 }"><span id="deficitValue">{{
                        Math.round(deficit) }}</span><span class="unit">kcal</span></div>
                    <div class="stat-quote" id="deficitQuote">{{ deficitQuote }}</div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
/* 
Vue 的 Computed 接管了 SVG 位移计算，
CSS 只负责原本在全局 style.css 中的过渡动画：
.circle-bar { transition: stroke-dashoffset 1s ease-out; } 
*/


/* 格子纸背景 */
#view-dashboard {
    padding: 24px;
}

/* --- 每日任务列表 --- */
.quests-section h3 {
    font-size: 20px;
    margin-bottom: 20px;
    color: var(--text-primary);
}

.quest-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 带有实体厚度的游戏卡片 */
.quest-card {
    background-color: #F3E0D6;
    /* 统一卡片背景，与网页背景色 #8B6A70 区分 */
    border-radius: var(--border-radius-md);
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 6px 0 #B1877A, 0 12px 20px rgba(0, 0, 0, 0.1);
    /* 强化投影增加立体感与区分度 */
    /* 实体厚度 */
    border: 3px solid #B1877A;
    /* 强化边框 */
    /* 边框占位 */
    transition: var(--transition-bouncy);
    cursor: pointer;
    position: relative;
    top: 0;
}

.quest-card:hover {
    transform: translateY(2px);
    /* 改为下压反馈 */
    box-shadow: 0 4px 0 #B1877A, 0 8px 12px rgba(0, 0, 0, 0.1);
    /* 阴影变薄 */
}

/* 完成状态被选中压下 */
.quest-card.completed {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(74, 78, 105, 0.1);
    background-color: #F8FDF9;
    border-color: var(--color-primary);
    opacity: 0.8;
}

.quest-icon {
    font-size: 32px;
    background: var(--bg-main);
    width: 60px;
    height: 60px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quest-details {
    flex: 1;
}

.quest-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 4px;
}

.quest-xp {
    font-size: 14px;
    color: var(--color-secondary);
    font-weight: 600;
}

/* 复选框的样式设定 */
.quest-check {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}

.quest-check.circle {
    border: 3px solid #E2E8F0;
}

.quest-card.completed .quest-check {
    background-color: var(--color-primary);
    color: white;
    border: none;
}

/* 2. 核心游戏化路线区 (星露谷生存体力条) */
.game-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.game-title-icon {
    font-size: 20px;
    filter: drop-shadow(2px 2px 0 #A76E5F);
    /* 图标阴影 */
}

.game-title-text {
    font-size: 13px;
    font-weight: 800;
    color: #643A46;
    /* 标题文字：深莓色 */
    text-shadow: 1px 1px 0 #E3B7A5;
    /* 文字阴影：浅粉 */
}

/* 装饰小草 */
.grass-decorations {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    margin-bottom: 8px;
}

.grass {
    width: 12px;
    height: 18px;
    background: repeating-linear-gradient(45deg, #72a474 0px, #65926e 4px, #72a474 4px, #65926e 8px);
    /* 草叶亮部与暗部 */
    border-radius: 30% 30% 0 0;
    box-shadow: 0 4px 0 #4c6e53;
    /* 草叶投影 */
    position: relative;
    top: 8px;
    transition: transform 0.3s ease;
}

/* 通过 nth-child 模拟随机高度和摆动角度 */
.grass:nth-child(1) {
    height: 16px;
    transform: rotate(-5deg);
    margin-top: 4px;
}

.grass:nth-child(2) {
    height: 24px;
    transform: rotate(3deg);
    margin-top: -2px;
}

.grass:nth-child(3) {
    height: 20px;
    transform: rotate(-2deg);
    margin-top: 2px;
}

.grass:nth-child(4) {
    height: 26px;
    transform: rotate(5deg);
    margin-top: -4px;
}

.grass:nth-child(5) {
    height: 14px;
    transform: rotate(-8deg);
    margin-top: 6px;
}

/* 轨道区域 */
.track-wrapper {
    position: relative;
    margin: 16px 0 24px;
    background-color: #F3E0D6;
    /* 暖粉白基底 */
    background-image:
        radial-gradient(circle at 10px 10px, #E3B8A5 1px, transparent 1px),
        /* 面板装饰点 */
        linear-gradient(45deg, #F5D5C4 20%, #FCE6DA 80%);
    /* 面板渐变 */
    background-size: 20px 20px, 100%;
    border: 4px solid #B1877A;
    /* 面板边框 */
    border-radius: 15px;
    box-shadow: 0 4px 0 #8E6B61, 0 16px 16px rgba(0, 0, 0, 0.1);
    /* 面板外阴影 */
    padding: 24px 20px 16px 20px;
    position: relative;
}

.survival-track {
    position: relative;
    height: 20px;
    background: #F3E0D6;
    /* 正常轨道背景 */
    border-radius: 22px;
    box-shadow: inset 0 0 0 2px #FCE6DA, 0 4px 0 #8E6B61;
    border: 3px solid #B1877A;
    /* 正常轨道边带 */
}

/* 轨道刻度 */
.track-marks {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    pointer-events: none;
    z-index: 6;
    /* 必须高于 survival-fill (z-index: 2) */
}

.track-marks div {
    position: absolute;
    width: 2px;
    height: 14px;
    /* 增加高度，使其跨越 10px 的 fill */
    background: #5D3A42;
    /* 使用深色，确保在浅色进度条上清晰 */
    border-radius: 1px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.6;
}

/* 动态填充条 */
.survival-fill {
    position: absolute;
    right: 0;
    top: 2px;
    bottom: 0;
    height: 10px;
    background: #B98B99;
    /* 正常填充：豆沙粉 */
    border-radius: 17px;
    transition: width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s;
    z-index: 2;
}

.survival-fill.warning {
    background: #F3B58C;
    /* 警告：蜜桃色 */
    animation: pulseWarning 0.4s infinite alternate;
}

.survival-fill.depleted {
    background: #8F7A82;
    /* 耗尽：灰紫 */
}

.survival-fill.gameover {
    background: #6D3F54;
    /* 超额：深莓色 */
}

@keyframes pulseWarning {
    from {
        background: #F3B58C;
        /* 蜜桃 ↔ 莓红交替 */
    }

    to {
        background: #D44F6A;
    }
}

/* 小人化身 */
.survival-avatar {
    position: absolute;
    top: -50px;
    width: 40px;
    height: 50px;
    /* 右对齐，由 JS 通过 right 属性来控制距右边距百分比，加上负 margin 使其居中 */
    margin-right: -20px;
    transition: right 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 10;
}

.sv-avatar-hat {
    position: absolute;
    top: 0;
    left: 8px;
    width: 24px;
    height: 14px;
    z-index: 3;
}

.sv-avatar-hat .hat-top {
    position: absolute;
    top: 0;
    left: 4px;
    width: 16px;
    height: 8px;
    background: #C98B6B;
    /* 暖棕色 */
}

.sv-avatar-hat .hat-brim {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 24px;
    height: 6px;
    background: #A55728;
    /* 深棕 */
}

.sv-avatar-head {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 20px;
    height: 20px;
    background: #F8D5B0;
    /* 肤色：暖白 */
    z-index: 2;
}

.survival-avatar.depleted .sv-avatar-head {
    background: #A6939A;
    /* 耗尽时的肤色：灰紫 */
}

.survival-avatar.gameover .sv-avatar-head {
    background: #5A3F49;
    /* GameOver时的肤色：暗紫 */
}

.sv-eye {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #000;
    border-radius: 50%;
}

.sv-eye.left {
    top: 6px;
    left: 4px;
}

.sv-eye.right {
    top: 6px;
    right: 4px;
}

.survival-avatar.depleted .sv-eye,
.survival-avatar.gameover .sv-eye {
    height: 2px;
    border-radius: 0;
}

.sv-avatar-body {
    position: absolute;
    top: 30px;
    left: 8px;
    width: 24px;
    height: 18px;
    background: #9F6D78;
    /* 衣服：豆沙粉 */
    z-index: 1;
    border-radius: 4px 4px 0 0;
    box-shadow: inset 0 6px 0 #B58272;
    /* 背带颜色 */
}

.survival-avatar.depleted .sv-avatar-body {
    background: #A6939A;
    /* 耗尽态衣服色：灰紫 */
}

.survival-avatar.gameover .sv-avatar-body {
    background: #5A3F49;
    /* GameOver衣服色：暗紫 */
}

.sv-pants {
    position: absolute;
    bottom: -6px;
    left: 4px;
    width: 16px;
    height: 6px;
    background: #CD853F;
}

.sv-sweat {
    position: absolute;
    top: 0;
    right: -4px;
    width: 4px;
    height: 8px;
    background: #7fb7df;
    /* 警告汗滴色 */
    border-radius: 2px;
    animation: sweatDrop 0.5s infinite alternate;
}

@keyframes sweatDrop {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(4px);
    }
}

/* 飘字 */
.float-text-container {
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 100;
}

.float-text {
    position: absolute;
    font-family: monospace;
    font-size: 16px;
    font-weight: 900;
    white-space: nowrap;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5), 0 0 2px black;
    color: white;
    /* 默认白 */
    animation: float-up 1s ease-out forwards;
    pointer-events: none;
}


@keyframes float-up {
    0% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }

    70% {
        opacity: 0.8;
        transform: translateY(-25px) scale(1.1);
    }

    100% {
        opacity: 0;
        transform: translateY(-40px) scale(0.9);
    }
}

/* 3. 数据仪表盘区 */
.stats-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    /* 暖粉白基底 */
    background-image: linear-gradient(180deg, #F5D5C4 20%, #FCE6DA 80%);
    /* 卡片背景：暖粉白 */
    border: 3px solid #B1877A;
    /* 边框：红棕 */
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 5px 0 #8E6B61;
    /* 卡片阴影 */
    transition: transform 0.1s, box-shadow 0.1s;
    position: relative;
    top: 0;
}

.stat-card:hover {
    transform: translateY(2px);
    /* 改为下压 */
    box-shadow: 0 3px 0 #8E6B61;
}

.stat-card.full-width {
    grid-column: span 2;
}

.stat-icon {
    font-size: 32px;
    width: 60px;
    height: 60px;
    background: #F0D9CC;
    /* 图标背景 */
    border-radius: 8px;
    border: 2px solid #C29A8A;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-content {
    flex: 1;
}

.stat-title {
    font-size: 13px;
    color: #5c4328;
    font-weight: 800;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 20px;
    font-weight: 900;
    color: #2d3e1f;
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.4);
}

.stat-value small {
    font-size: 14px;
    color: #5c4328;
    font-weight: 700;
}

.highlight-deficit {
    color: #b84343;
    font-size: 28px;
}

.stat-subtext {
    font-size: 12px;
    color: #6b4e2e;
    font-weight: 700;
    margin-top: 4px;
}

.stat-quote {
    font-size: 12px;
    color: #3e721d;
    font-weight: 800;
    margin-top: 4px;
}

.stat-bar {
    height: 8px;
    background: #cfb28c;
    border-radius: 4px;
    margin-top: 8px;
    border: 1px solid #aa8b66;
    overflow: hidden;
}

.stat-fill {
    height: 100%;
    border-radius: 4px;
}

.wood-actions {
    display: flex;
    gap: 50px;
    justify-content: space-between;
    margin-top: 24px;
}

.pixel-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: #F3D5B5;
    /* 按钮背景：浆果黄昏暖木色 */
    border: 2px solid #C29A7A;
    /* 按钮外框边线 */
    border-radius: 15px;
    padding: 10px 8px;
    color: #5D3A42;
    /* 按钮文字：深莓色 */
    font-weight: 800;
    font-size: 12px;
    text-shadow: 1px 1px 0 #FFE2D1;
    /* 文字高光 */
    box-shadow:
        inset 2px 2px 0 rgba(255, 255, 255, 0.4),
        inset -2px -2px 0 rgba(0, 0, 0, 0.2),
        0 4px 0 #9C6F5F;
    /* 按钮外部立体阴影 */
    transition: all 0.1s ease;
    cursor: pointer;
    position: relative;
    top: 0;
}

.pixel-btn:hover {
    top: 2px;
    /* 悬停时轻微下压 */
    box-shadow:
        inset 2px 2px 0 rgba(255, 255, 255, 0.4),
        inset -2px -2px 0 rgba(0, 0, 0, 0.2),
        0 2px 0 #9C6F5F;
    /* 阴影变薄 */
}

.pixel-btn:active {
    top: 4px;
    box-shadow:
        inset 4px 4px 6px rgba(0, 0, 0, 0.4),
        0 0 0 #9C6F5F;
    padding: 12px 6px 8px 10px;
}

/* 按钮专项色值覆盖计划 (基于表格) */
.btn-action-eat {
    background: #F3D5B5;
}

/* 普通饮食按钮 */
.btn-action-exercise {
    background: #E8B4A2;
    border-color: #B0584A;
    color: #4F2E32;
}

/* 运动按钮：带警告意味的红粉 */
.btn-action-reset {
    background: #c8b4d2fb;
    border-color: #7a5d89;
    color: #2F2A1F;
}

/* 重置按钮：深原木色 */

.pixel-btn .action-icon {
    font-size: 14px;
    /* icon也随之改小 */
    filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.2));
}

.pixel-btn .action-text {
    white-space: nowrap;
}
</style>
