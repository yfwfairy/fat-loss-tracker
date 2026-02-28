<script setup lang="ts">
import { ref, computed } from 'vue';
import CustomSelect from '../ui/CustomSelect.vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(['close', 'save']);

// 1. 基础信息配置
const avatar = ref('🌿');
const nickname = ref('Berry');

// 2. 身体数据配置 (身高, 体重, 年龄, 性别)
const height = ref<number | null>(160);
const weight = ref<number | null>(60);
const age = ref<number | null>(25);
const gender = ref('保密');

// 预设化身列表
const presetAvatars = ['🍄','🐢','🌟','👑','👻','🦖','🌰','🌸','☁️','🔥','🦊','🧚','🌞','🌙','⭐','🍎','🍉','🍇','🐶','🐱','🐭','🦄','🐧','🐸'];

// 右侧面板控制
const rightPanelState = ref<'hidden' | 'avatar' | 'measurements'>('hidden');

// === BMI 动态计算 ===

const getBMICategory = (bmiValue: number) => {
  if (bmiValue < 18.5) return { label: '偏瘦', color: '#ffb347' }; 
  if (bmiValue <= 23.9) return { label: '正常', color: '#90dc90ff' }; 
  if (bmiValue <= 27.9) return { label: '超重', color: '#f37645ff' }; 
  return { label: '肥胖', color: '#fa5050ff' }; 
};

const bmiData = computed(() => {
  if (!height.value || !weight.value) return null;
  const hMeters = height.value / 100;
  const val = Number((weight.value / (hMeters * hMeters)).toFixed(1));
  return {
    value: val,
    ...getBMICategory(val)
  };
});

const saveProfile = () => {
  emit('save', {
    avatar: avatar.value,
    nickname: nickname.value,
    height: height.value,
    weight: weight.value,
    age: age.value,
    gender: gender.value
  });
  emit('close');
};

const selectAvatar = (emoji: string) => {
    avatar.value = emoji;
    rightPanelState.value = 'hidden';
};

// === 身体围度互动 ===
interface Callout {
    id: string;
    name: string;
    value: number;
    direction: string;
}
const callouts = ref<Callout[]>([]);
const activeMeasure = ref<{ id: string, name: string } | null>(null);
const measurePopoverStyle = ref({ top: '0px', left: '0px' });
const measureInputValue = ref<number | null>(null);
const isMeasurePopoverOpen = ref(false);

const openMeasurePopover = (id: string, name: string, event: MouseEvent) => {
  activeMeasure.value = { id, name };
  measureInputValue.value = null;
  
  const btn = event.currentTarget as HTMLElement;
  const container = btn.closest('.human-figure-container') as HTMLElement;
  if (btn && container) {
      const btnRect = btn.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = btnRect.top - containerRect.top;
      const left = btnRect.left - containerRect.left;
      measurePopoverStyle.value = {
          top: `${Math.max(0, top - 30)}px`,
          left: `${left + 30}px`
      };
  }
  isMeasurePopoverOpen.value = true;
};

const confirmMeasure = () => {
    if (activeMeasure.value && measureInputValue.value) {
        const { id, name } = activeMeasure.value;
        const leftSides = ['arm_left', 'thigh_left', 'calf_left'];
        const direction = leftSides.includes(id) ? 'direction-left' : 'direction-right';
        
        const existing = callouts.value.find(c => c.id === id);
        if (existing) {
            existing.value = measureInputValue.value;
        } else {
            callouts.value.push({ id, name, value: measureInputValue.value, direction });
        }
    }
    isMeasurePopoverOpen.value = false;
    activeMeasure.value = null;
};

const removeCallout = (id: string) => {
    callouts.value = callouts.value.filter(c => c.id !== id);
};
</script>

<template>
  <div class="modal-overlay" :class="{ hidden: !isOpen }" @click.self="emit('close')">
        <div class="profile-settings-modal" :class="{ wide: rightPanelState !== 'hidden' }">
            <header class="modal-header">
                <h3>个人资料卡</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="modal-body" id="profile-modal-body">
                <!-- 左列：基础资料与设置 -->
                <div class="modal-left-panel">
                    <!-- 顶部：头像与昵称 -->
                    <div class="settings-top-section">
                        <div class="settings-avatar-edit">
                            <div class="settings-avatar" id="current-avatar">{{ avatar }}</div>
                            <button class="edit-avatar-btn" @click="rightPanelState = 'avatar'">更换头像</button>
                        </div>
                        <div class="settings-name-edit">
                            <label>居民昵称</label>
                            <input type="text" class="styled-input" id="input-nickname" v-model="nickname">
                        </div>
                    </div>

                    <!-- 底部：身体数据 -->
                    <div class="settings-data-section">
                        <h4>基础档案</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>身高</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-height" v-model="height" step="0.1" min="120" max="250">
                                    <span class="unit">cm</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>体重</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-weight" v-model="weight" step="0.1" min="30" max="300">
                                    <span class="unit">kg</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>年龄</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" id="input-age" v-model="age" step="1" min="1" max="120">
                                    <span class="unit">岁</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>性别</label>
                                <div class="input-with-unit">
                                    <div style="width: 100%;">
                                        <CustomSelect 
                                            :options="[{value: '男', label: '男'}, {value: '女', label: '女'}]" 
                                            v-model="gender" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 动态 BMI 指示器 -->
                        <div class="bmi-indicator-wrapper" v-if="bmiData">
                            <div class="bmi-header">
                                <span class="bmi-title">体质指数 (BMI)</span>
                                <span class="bmi-value" :style="{ color: bmiData.color }">{{ bmiData.value }}</span>
                            </div>
                            <div class="bmi-bar">
                                <div class="bmi-segment underweight" title="过轻 (<18.5)"></div>
                                <div class="bmi-segment normal" title="正常 (18.5 ~ 23.9)"></div>
                                <div class="bmi-segment overweight" title="超重 (24.0 ~ 27.9)"></div>
                                <div class="bmi-segment obese" title="肥胖 (≥28)"></div>
                                <div class="bmi-thumb" :style="{ left: Math.min(Math.max((bmiData.value - 15) / 20 * 100, 0), 100) + '%' }">
                                    <div class="bmi-thumb-label" :style="{ color: bmiData.color }">{{ bmiData.label }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 触发展开身材维度的按钮 (点击切换展开/折叠) -->
                    <button class="btn-expand-measurements" @click="rightPanelState = rightPanelState === 'measurements' ? 'hidden' : 'measurements'">
                        <span>🌱 手工录入身体各围度参数</span>
                        <span class="expand-icon" :style="{ transform: rightPanelState === 'measurements' ? 'rotate(180deg)' : 'none' }">▶</span>
                    </button>
                </div><!-- 左列结束 -->

                <!-- 右列：动态内容区域 (头像/身材) -->
                <div class="modal-right-panel" :class="{ 'expanded': rightPanelState !== 'hidden' }">

                    <!-- 头像选择库 -->
                    <div class="right-panel-content" v-show="rightPanelState === 'avatar'">
                        <div class="panel-header-flex">
                            <h4>选择化身 🍄</h4>
                            <button class="close-right-panel-btn" @click="rightPanelState = 'hidden'">×</button>
                        </div>
                        <div class="avatar-picker-grid">
                            <div class="preset-avatar" 
                                 v-for="a in presetAvatars" :key="a"
                                 :class="{ selected: avatar === a }"
                                 @click="selectAvatar(a)">
                                 {{ a }}
                            </div>
                        </div>
                    </div>

                    <!-- 身材维度记录 -->
                    <div class="right-panel-content no-vertical-scroll" v-show="rightPanelState === 'measurements'">
                        <div class="panel-header-flex">
                            <h4>身材围度记录 🌱</h4>
                            <button class="close-right-panel-btn" @click="rightPanelState = 'hidden'">×</button>
                        </div>
                        <div class="human-figure-container">
                            <div class="humanoid-wrapper" @click.self="isMeasurePopoverOpen = false; activeMeasure = null">
                                <div class="css-humanoid">
                                    <div class="human-head"></div>
                                    <div class="human-torso"></div>
                                    <div class="human-arm left"></div>
                                    <div class="human-arm right"></div>
                                    <div class="human-leg left"></div>
                                    <div class="human-leg right"></div>

                                    <!-- 动态回显 Callout 连线标注 -->
                                    <div v-for="co in callouts" :key="co.id" :class="['data-callout', co.direction, `for-${co.id}`]">
                                        <div class="callout-line"></div>
                                        <div class="callout-text">
                                            {{ co.name }}: {{ co.value }}cm
                                            <span class="callout-delete" @click="removeCallout(co.id)">×</span>
                                        </div>
                                    </div>

                                    <!-- 交互打标点 -->
                                    <button class="measure-point point-chest" :class="{ active: activeMeasure?.id === 'chest' }" data-part="chest" data-name="胸围" @click="openMeasurePopover('chest', '胸围', $event)"></button>
                                    <button class="measure-point point-waist" :class="{ active: activeMeasure?.id === 'waist' }" data-part="waist" data-name="腰围" @click="openMeasurePopover('waist', '腰围', $event)"></button>
                                    <button class="measure-point point-hip" :class="{ active: activeMeasure?.id === 'hip' }" data-part="hip" data-name="臀围" @click="openMeasurePopover('hip', '臀围', $event)"></button>
                                    <button class="measure-point point-arm left-arm" :class="{ active: activeMeasure?.id === 'arm_left' }" data-part="arm_left" data-name="左大臂" @click="openMeasurePopover('arm_left', '左大臂', $event)"></button>
                                    <button class="measure-point point-arm right-arm" :class="{ active: activeMeasure?.id === 'arm_right' }" data-part="arm_right" data-name="右大臂" @click="openMeasurePopover('arm_right', '右大臂', $event)"></button>
                                    <button class="measure-point point-thigh left-thigh" :class="{ active: activeMeasure?.id === 'thigh_left' }" data-part="thigh_left" data-name="左大腿" @click="openMeasurePopover('thigh_left', '左大腿', $event)"></button>
                                    <button class="measure-point point-thigh right-thigh" :class="{ active: activeMeasure?.id === 'thigh_right' }" data-part="thigh_right" data-name="右大腿" @click="openMeasurePopover('thigh_right', '右大腿', $event)"></button>
                                    <button class="measure-point point-calf left-calf" :class="{ active: activeMeasure?.id === 'calf_left' }" data-part="calf_left" data-name="左小腿" @click="openMeasurePopover('calf_left', '左小腿', $event)"></button>
                                    <button class="measure-point point-calf right-calf" :class="{ active: activeMeasure?.id === 'calf_right' }" data-part="calf_right" data-name="右小腿" @click="openMeasurePopover('calf_right', '右小腿', $event)"></button>
                                </div>
                            </div>
                            
                            <!-- 悬浮弹窗 -->
                            <div class="measure-input-popover" v-show="isMeasurePopoverOpen" :style="measurePopoverStyle">
                                <label id="measure-popover-title">{{ activeMeasure?.name || '围度' }}</label>
                                <div class="input-with-unit small">
                                    <input type="number" class="styled-input" v-model="measureInputValue" step="0.1" @keyup.enter="confirmMeasure">
                                    <span class="unit">cm</span>
                                </div>
                                <button class="popover-confirm-btn" @click="confirmMeasure">✔</button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <footer class="modal-footer">
                <button class="btn-primary" id="save-profile-btn" @click="saveProfile" :disabled="!nickname || !height || !weight">保存设置</button>
            </footer>
        </div>
  </div>
</template>

<style scoped>
/* 
  Vue CSS 最佳实践：
  这里的样式将绝对私有，并带有 hash 尾缀（例如 data-v-xxxx）。
*/

/* ===== 核心弹窗与头部骨架 ===== */
.profile-settings-modal {
    background: #ffffff;
    width: 440px;
    border-radius: var(--border-radius-lg);
    box-shadow: 0 24px 48px rgba(74, 78, 105, 0.15);
    padding: 32px;
    transform: scale(1);
    transition: width 0.3s ease-out, transform 0.3s ease-out;
    overflow: hidden;
    /* 防止内容在变宽前溢出 */
}

.profile-settings-modal.wide {
    width: 784px;
    /* 32padding*2 + 376left + 24gap + 320right = 784 */
}

.modal-overlay.hidden .profile-settings-modal {
    transform: scale(0.9);
}

/* ===== 设置面内部顶部 (头像与昵称) ===== */
.settings-top-section {
    display: flex;
    gap: 24px;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px dashed rgba(212, 163, 115, 0.3);
}

.settings-avatar-edit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.settings-avatar {
    width: 80px;
    height: 80px;
    background: #E8F5E9;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
}

.edit-avatar-btn {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
}

.edit-avatar-btn:hover {
    color: #b493b5;
}

.settings-name-edit {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.settings-name-edit label {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary);
}

/* ===== 基础档案 (身体数据区块) ===== */
.settings-data-section h4 {
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 16px;
}

.data-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.input-with-unit {
    position: relative;
    display: flex;
    align-items: center;
}

/* 1. 强制让基础资料卡四格同行，缩减字号 */
.data-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.data-item label {
    font-size: 13px;
    margin-bottom: 4px;
}

.input-with-unit .styled-input {
    font-size: 12px;
    padding: 6px;
    padding-right: 12px; /* 留足总共的右侧空间 */
}

/* 统一性别选择框与左边输入框高度 */
:deep(.custom-select-trigger) {
    padding: 6px 12px;
    min-height: 30px;
    display: flex;
    align-items: center;
}

:deep(.custom-select-value) {
    font-size: 12px;
}

.input-with-unit .unit {
    font-size: 11px;
    pointer-events: none; /* 防止点击单位文字干扰输入框 */
}

/* 2. 让身材面板具备左右滑动能力并默认居中 */
.human-figure-container {
    width: 100%;
    overflow-x: auto;       /* 允许内容过长时横向滚动 */
    display: flex;
    padding-bottom: 20px;
    box-sizing: border-box;
    /* 隐藏原生粗陋的滚动条 */
    scrollbar-width: thin;
    scrollbar-color: rgba(0,0,0,0.1) transparent;
}

.human-figure-container::-webkit-scrollbar {
    height: 6px;
}
.human-figure-container::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
}

.humanoid-wrapper {
    margin: 0 auto;         /* 在 Flex 容器内如果子级不溢出则居中 */
    flex-shrink: 0;         /* 强制不被压缩，从而触发外层的滚动 */
    position: relative;
    padding: 0 40px;        /* 左右给予一定的安全距离供 Callout 连线外扩展开 */
}

/* 3. 剥离不需要的垂直滚动条 */
.no-vertical-scroll {
    overflow-y: hidden !important;
}
/* ===== 预设头像选择库 ===== */

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.avatar-picker-panel.hidden {
    display: none;
}

.avatar-picker-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 12px;
}

.close-picker-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--text-secondary);
}

.close-picker-btn:hover {
    color: var(--color-accent);
}

.avatar-picker-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    row-gap: 16px;
}

.preset-avatar {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: #F8F9FA;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.preset-avatar:hover {
    background: #E8F5E9;
    transform: scale(1.1);
}

.preset-avatar.selected {
    border-color: var(--color-primary);
    background: #E8F5E9;
    box-shadow: 0 4px 8px rgba(163, 201, 168, 0.3);
}


/* ===== 身体围度展开面板 ===== */

/* 简易 CSS 小人模型容器 */
.human-figure-container {
    position: relative;
    width: 100%;
    height: 340px;
    background: #F8F9FA;
    border-radius: 16px;
    margin-bottom: 16px;
    overflow-x: auto;
    overflow-y: hidden;
}

.humanoid-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 380px;
    height: 100%;
}

.css-humanoid {
    position: relative;
    width: 120px;
    height: 240px;
    transform-origin: top center;
    margin: 0 auto;
    flex-shrink: 0;
}

/* 身体部位基础样式 */
.css-humanoid>div[class^="human-"] {
    position: absolute;
    background: #E2E8F0;
    /* 灰白粘土质感 */
    border-radius: 40px;
    border: 2px solid #CBD5E1;
}

.human-head {
    width: 30px;
    height: 30px;
    top: 16px;
    left: 43px;
    border-radius: 50% !important;
}

.human-torso {
    width: 46px;
    height: 100px;
    top: 50px;
    left: 35px;
    border-radius: 20px !important;
}

.human-arm {
    width: 22px;
    height: 75px;
    top: 56px;
}

.human-arm.left {
    left: 4px;
    transform: rotate(15deg);
}

.human-arm.right {
    right: 2px;
    transform: rotate(-15deg);
}

.human-leg {
    width: 24px;
    height: 120px;
    top: 135px;
}

.human-leg.left {
    left: 30px;
}

.human-leg.right {
    right: 32px;
}

/* 数据可交互热点 */
.measure-point {
    position: absolute;
    width: 20px;
    height: 20px;
    background: var(--color-accent);
    border: 3px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(212, 163, 115, 0.5);
    transition: transform 0.2s, background 0.2s;
    z-index: 10;
}

.measure-point:hover {
    transform: scale(1.3);
    background: var(--color-primary);
}

.measure-point.active {
    transform: scale(1.3);
    background: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(163, 201, 168, 0.4);
}

.point-chest {
    top: 60px;
    left: 50px;
}

.point-waist {
    top: 100px;
    left: 50px;
}

.point-hip {
    top: 130px;
    left: 50px;
}

.point-arm.left-arm {
    top: 80px;
    left: 2px;
}

.point-arm.right-arm {
    top: 80px;
    right: 2px;
}

.point-thigh.left-thigh {
    top: 170px;
    left: 34px;
}

.point-thigh.right-thigh {
    top: 170px;
    right: 34px;
}

.point-calf.left-calf {
    top: 210px;
    left: 34px;
}

.point-calf.right-calf {
    top: 210px;
    right: 34px;
}

/* 悬浮输入气泡 */
.measure-input-popover {
    position: absolute;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: var(--shadow-soft);
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 20;
    width: 140px;
    transition: opacity 0.2s, transform 0.2s;
    border: 1px solid #E2E8F0;
}

.measure-input-popover.hidden {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.9);
}

.measure-input-popover label {
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    text-align: center;
}

.input-with-unit.small .styled-input {
    padding: 6px 12px;
    font-size: 14px;
    padding-right: 28px;
}

.input-with-unit.small .unit {
    font-size: 12px;
    right: 8px;
}

.popover-confirm-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 4px;
    font-weight: 800;
    cursor: pointer;
}

/* === 身体数据悬浮引线标签 === */
.data-callout {
    position: absolute;
    pointer-events: none;
    display: flex;
    align-items: center;
    z-index: 5;
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.callout-line {
    background: #CBD5E1;
    height: 2px;
    flex-shrink: 0;
    position: relative;
    border-radius: 2px;
    z-index: 10;
}

.callout-line::before {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: #CBD5E1;
    border-radius: 50%;
    top: -2px;
}

.data-callout.direction-right .callout-line::before {
    left: -2px;
}

.data-callout.direction-left .callout-line::before {
    right: -2px;
}

.callout-text {
    color: #333333;
    font-weight: 700;
    font-size: 12px;
    background: transparent;
    padding: 0 4px;
    white-space: nowrap;
    display: flex;
    align-items: center;
    pointer-events: auto;
}

.callout-delete {
    color: #999999;
    font-size: 14px;
    margin-left: 2px;
    cursor: pointer;
    line-height: 1;
    padding: 2px;
    opacity: 0;
    transition: opacity 0.2s;
}

.callout-text:hover .callout-delete {
    opacity: 1;
}

.callout-delete:hover {
    color: var(--color-primary);
}

.data-callout.direction-right {
    flex-direction: row;
}

.data-callout.direction-left {
    flex-direction: row-reverse;
}

/* Chest (Center -> Right Up) */
.for-chest {
    top: 60px;
    left: 68px;
}

.for-chest .callout-line {
    width: 50px;
}

/* Waist (Center -> Right) */
.for-waist {
    top: 100px;
    left: 68px;
}

.for-waist .callout-line {
    width: 65px;
}

/* Hip (Center -> Right Down) */
.for-hip {
    top: 134px;
    left: 68px;
}

.for-hip .callout-line {
    width: 60px;
}

/* Arm Right (Right -> Right Up) */
.for-arm_right {
    top: 80px;
    left: 116px;
}

.for-arm_right .callout-line {
    width: 35px;
}

/* Arm Left (Left -> Left Up) */
.for-arm_left {
    top: 80px;
    right: 116px;
}

.for-arm_left .callout-line {
    width: 35px;
}

/* Thigh Right (Right -> Right) */
.for-thigh_right {
    top: 170px;
    left: 84px;
}

.for-thigh_right .callout-line {
    width: 40px;
}

/* Thigh Left (Left -> Left) */
.for-thigh_left {
    top: 170px;
    right: 84px;
}

.for-thigh_left .callout-line {
    width: 40px;
}

/* Calf Right (Right -> Right Down) */
.for-calf_right {
    top: 210px;
    left: 84px;
}

.for-calf_right .callout-line {
    width: 35px;
}

/* Calf Left (Left -> Left Down) */
.for-calf_left {
    top: 210px;
    right: 84px;
}

.for-calf_left .callout-line {
    width: 35px;
}

/* ===== BMI 指示器 ===== */
.bmi-indicator-wrapper {
    margin-top: 24px;
    padding: 16px;
    background: #F8F9FA;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
}

.bmi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.bmi-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary);
}

.bmi-value {
    font-size: 20px;
    font-weight: 800;
    color: var(--text-primary);
}

/* 轨道 */
.bmi-bar {
    position: relative;
    height: 12px;
    border-radius: 100px;
    display: flex;
    overflow: visible;
}

.bmi-segment {
    height: 100%;
}

.bmi-segment.underweight {
    width: 17.5%;
    background: #AED9E0;
    border-radius: 100px 0 0 100px;
}

.bmi-segment.normal {
    width: 27.5%;
    background: #A8E6CF;
}

.bmi-segment.overweight {
    width: 20%;
    background: #FFD3B6;
}

.bmi-segment.obese {
    width: 35%;
    background: #FFAAA5;
    border-radius: 0 100px 100px 0;
}

/* 滑块/指针 */
.bmi-thumb {
    position: absolute;
    top: -2px;
    left: 0;
    /* JS 控制 */
    width: 15px;
    height: 15px;
    background: white;
    border: 3px solid var(--bg-main);
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 1px 6px rgba(251, 191, 191, 0.15);
    transition: left 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 2;
}

.bmi-thumb-label {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
}

.bmi-thumb-label::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px 4px 0;
    border-style: solid;
    border-color: var(--text-primary) transparent transparent transparent;
}

/* === 个人资料水平双列更新 === */
#profile-modal-body {
    position: relative;
    transition: all 0.3s ease-out;
}

.modal-left-panel {
    width: 376px;
    flex-shrink: 0;
    transition: all 0.3s;
}

.modal-right-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 400px;
    width: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s ease-out;
    background: #FAFAFA;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    display: flex;
    flex-direction: column;
}

.modal-right-panel.expanded {
    width: 320px;
    opacity: 1;
    padding: 24px;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
    overflow-y: auto;
}

.right-panel-content.hidden {
    display: none;
}

.panel-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px dashed rgba(212, 163, 115, 0.3);
    padding-bottom: 12px;
}

.panel-header-flex h4 {
    margin: 0;
    font-size: 16px;
    color: var(--text-primary);
}

.close-right-panel-btn {
    display: none;
}

/* 原本的按钮改为横条 */
.btn-expand-measurements {
    width: 100%;
    margin-top: 24px;
    padding: 16px;
    background: #ffffff;
    border: 1px dashed var(--color-primary);
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-primary);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-expand-measurements:hover {
    border-style: solid;
    transform: translateY(-1px);
}

</style>
