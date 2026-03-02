<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { IUser } from '../../../../packages/shared-types';
import CustomSelect from '../ui/CustomSelect.vue';
import { api } from '../../api';

const props = defineProps<{
    isOpen: boolean;
    initialData: IUser;
}>();

const emit = defineEmits(['close', 'save']);

// 1. 基础信息配置 (基于 initialData)
const avatar = ref(props.initialData.avatarId || '🌿');
const nickname = ref(props.initialData.nickname || '减肥大王');
const gender = ref(props.initialData.gender || '女');
const age = ref<number | null>(props.initialData.age || 25);

// 2. 身体数据与运动系数
const height = ref<number | null>(props.initialData.height || 175);
const weight = ref<number | null>(props.initialData.weight || 70);
const activityLevel = ref(props.initialData.activityLevel || 1.2);
const bodyFat = ref<number | null>(props.initialData.bodyFat || null);
const showAdvancedBmr = ref(false);

// 动态头像列表
const presetAvatars = ref<string[]>([]);

onMounted(async () => {
    const avatars = await api.getAvatars();
    presetAvatars.value = avatars;
});

// 监听 props 变化，确保弹窗打开时同步最新数据
watch(() => props.isOpen, (next) => {
    if (next) {
        avatar.value = props.initialData.avatarId;
        nickname.value = props.initialData.nickname;
        gender.value = props.initialData.gender || '女';
        age.value = props.initialData.age || 25;
        height.value = props.initialData.height;
        weight.value = props.initialData.weight;
        activityLevel.value = props.initialData.activityLevel || 1.2;
        bodyFat.value = props.initialData.bodyFat || null;

        // 同步围度
        if (props.initialData.measurements) {
            callouts.value = Object.entries(props.initialData.measurements).map(([id, val]) => {
                const leftSides = ['arm_left', 'thigh_left', 'calf_left'];
                const direction = leftSides.includes(id) ? 'direction-left' : 'direction-right';
                const names: Record<string, string> = {
                    chest: '胸围', waist: '腰围', hip: '臀围',
                    arm_left: '左大臂', arm_right: '右大臂',
                    thigh_left: '左大腿', thigh_right: '右大腿',
                    calf_left: '左小腿', calf_right: '右小腿'
                };
                return { id, name: names[id] || id, value: val as number, direction };
            });
        }
    }
});

// 右侧面板控制
const rightPanelState = ref<'hidden' | 'avatar' | 'measurements' | 'profile_basic' | 'activity_level'>('hidden');

// 运动系数选项定义
const activityOptions = [
    { value: 1.2, label: '久坐不动', emoji: '🪑', desc: '几乎不运动，长时间坐着工作', scenarios: ['办公室白领，每天坐着超过8小时', '通勤开车/打车，基本不走路', '每周刻意运动0次'] },
    { value: 1.375, label: '轻度活动', emoji: '🚶', desc: '每周轻度运动1-3天，或日常有一定走动', scenarios: ['每天走路30-60分钟（通勤/散步）', '每周1-2次轻松运动', '家务劳动较多'] },
    { value: 1.55, label: '中度活动', emoji: '🏃', desc: '每周中等强度运动3-5天，每次30分钟以上', scenarios: ['每周3-4次跑步、健身', '工作性质较活跃', '每天步数8000-12000步'], recommended: true },
    { value: 1.725, label: '高度活动', emoji: '🏋️', desc: '每周高强度运动6-7天，或体力劳动工作', scenarios: ['几乎每天运动（力量训练/跑步5km+）', '体力劳动者', '每天步数15000步以上'] },
    { value: 1.9, label: '极高活动', emoji: '🚴', desc: '专业运动员级别，每天多次高强度训练', scenarios: ['职业运动员', '每周2次以上高强度训练', '马拉松/铁三备赛期'] }
];

// === BMI 动态计算 ===
const getBMICategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return { label: '偏瘦', color: '#ffb347' };
    if (bmiValue <= 23.9) return { label: '正常', color: '#3cab3c' };
    if (bmiValue <= 27.9) return { label: '超重', color: '#f37645' };
    return { label: '肥胖', color: '#fa5050' };
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

// 计算 BMI 指示器在轨道上的位置 (%)
// 采用线性比例设计：总范围 15 到 35
const bmiPosition = computed(() => {
    if (!bmiData.value) return 0;
    const bmi = bmiData.value.value;
    const min = 15;
    const max = 35;
    const pos = ((bmi - min) / (max - min)) * 100;
    return Math.min(Math.max(pos, 0), 100);
});

// === BMR 动态计算 ===
const bmrValue = computed(() => {
    if (!weight.value || !height.value || !age.value) return null;

    // 1. 如果有体脂率，使用 Katch-McArdle 公式 (进阶)
    if (bodyFat.value && bodyFat.value > 0) {
        const leanBodyMass = weight.value * (1 - bodyFat.value / 100);
        return Math.round(370 + (21.6 * leanBodyMass));
    }

    // 2. 否则使用 Mifflin-St Jeor 公式 (常规)
    if (gender.value === '男') {
        return Math.round(10 * weight.value + 6.25 * height.value - 5 * age.value + 5);
    } else {
        return Math.round(10 * weight.value + 6.25 * height.value - 5 * age.value - 161);
    }
});

const saveProfile = () => {
    const measurements: Record<string, number> = {};
    callouts.value.forEach(c => {
        measurements[c.id] = c.value;
    });

    emit('save', {
        ...props.initialData,
        avatarId: avatar.value,
        nickname: nickname.value,
        gender: gender.value,
        age: age.value,
        height: height.value,
        weight: weight.value,
        activityLevel: activityLevel.value,
        bodyFat: bodyFat.value,
        bmr: bmrValue.value || props.initialData.bmr,
        bmi: bmiData.value?.value || props.initialData.bmi,
        measurements
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
    <div class="modal-overlay" v-show="isOpen" @click.self="emit('close')">
        <div class="profile-settings-modal" :class="{ wide: rightPanelState !== 'hidden' }">
            <header class="modal-header">
                <h3>个人资料卡</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="modal-body">
                <!-- 左列：基础资料 -->
                <div class="modal-left-panel">
                    <!-- 基础信息卡片 -->
                    <div class="settings-card basic-info-card">
                        <div class="card-avatar-section" @click="rightPanelState = 'avatar'">
                            <div class="settings-avatar">
                                <span>{{ avatar }}</span>
                            </div>
                            <span class="edit-hint">点击更换</span>
                        </div>
                        <div class="card-form-section">
                            <div class="form-row">
                                <div class="form-group flex-2">
                                    <label>居民昵称</label>
                                    <input type="text" class="styled-input" v-model="nickname">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>性别</label>
                                    <CustomSelect :options="[{ value: '男', label: '男' }, { value: '女', label: '女' }]"
                                        v-model="gender" />
                                </div>
                                <div class="form-group">
                                    <label>年龄</label>
                                    <div class="input-with-unit">
                                        <input type="number" class="styled-input" v-model="age" min="1" max="120">
                                        <span class="unit">岁</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 功能入口列表 -->
                    <div class="entry-list">
                        <button class="menu-entry-btn" :class="{ active: rightPanelState === 'profile_basic' }"
                            @click="rightPanelState = rightPanelState === 'profile_basic' ? 'hidden' : 'profile_basic'">
                            <span class="entry-label">📏 录入基础档案 (身高/体重)</span>
                            <span class="expand-icon">▶</span>
                        </button>

                        <button class="menu-entry-btn" :class="{ active: rightPanelState === 'activity_level' }"
                            @click="rightPanelState = rightPanelState === 'activity_level' ? 'hidden' : 'activity_level'">
                            <span class="entry-label">⚡ 选择日常运动系数</span>
                            <span class="expand-icon">▶</span>
                        </button>

                        <button class="menu-entry-btn" :class="{ active: rightPanelState === 'measurements' }"
                            @click="rightPanelState = rightPanelState === 'measurements' ? 'hidden' : 'measurements'">
                            <span class="entry-label">🌱 录入身体围度参数</span>
                            <span class="expand-icon">▶</span>
                        </button>
                    </div>
                </div>

                <!-- 右列：动态面板 -->
                <div class="modal-right-panel" :class="{ expanded: rightPanelState !== 'hidden' }">

                    <!-- 头像选择 -->
                    <div class="right-panel-content" v-show="rightPanelState === 'avatar'">
                        <div class="panel-header-flex">
                            <h4>选择化身 🍄</h4>
                        </div>
                        <div class="avatar-picker-grid">
                            <div class="preset-avatar" v-for="a in presetAvatars" :key="a"
                                :class="{ selected: avatar === a }" @click="selectAvatar(a)">
                                {{ a }}
                            </div>
                        </div>
                    </div>

                    <!-- 基础档案 (身高/体重/BMI) -->
                    <div class="right-panel-content" v-show="rightPanelState === 'profile_basic'">
                        <div class="panel-header-flex">
                            <h4>基础档案录入 📏</h4>
                        </div>
                        <div class="basic-entry-grid">
                            <div class="data-item">
                                <label>身高</label>
                                <div class="input-with-unit" style="margin-left: 1px;">
                                    <input type="number" class="styled-input" v-model="height" step="0.1">
                                    <span class="unit">cm</span>
                                </div>
                            </div>
                            <div class="data-item">
                                <label>体重</label>
                                <div class="input-with-unit">
                                    <input type="number" class="styled-input" v-model="weight" step="0.1">
                                    <span class="unit">kg</span>
                                </div>
                            </div>
                        </div>
                        <div class="bmi-indicator-wrapper">
                            <div class="bmi-header">
                                <span class="bmi-title">体质指数 (BMI)</span>
                                <span class="bmi-value" :style="{ color: bmiData?.color || '#ccc' }">{{ bmiData?.value
                                    || '--'
                                }}</span>
                            </div>
                            <div class="bmi-bar">
                                <div class="bmi-segment underweight" style="flex: 3.5"></div>
                                <div class="bmi-segment normal" style="flex: 5.5"></div>
                                <div class="bmi-segment overweight" style="flex: 4.0"></div>
                                <div class="bmi-segment obese" style="flex: 7.0"></div>
                                <div class="bmi-thumb" :style="{ left: bmiPosition + '%' }" v-if="bmiData">
                                    <div class="bmi-thumb-label" :style="{ color: bmiData.color }">{{ bmiData.label }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- BMR 基础代谢率 -->
                        <div class="bmr-indicator-wrapper">
                            <div class="bmr-header-flex">
                                <div class="bmr-value-section">
                                    <span class="bmr-title">基础代谢 (BMR)</span>
                                    <div class="bmr-number-row">
                                        <span class="bmr-value">{{ bmrValue || '--' }}</span>
                                        <span class="bmr-unit">kcal/d</span>
                                    </div>
                                </div>
                                <button class="bmr-setup-link" @click="showAdvancedBmr = !showAdvancedBmr">
                                    {{ showAdvancedBmr ? '收起设置' : '高级设置' }}
                                </button>
                            </div>

                            <transition name="slide-fade">
                                <div class="advanced-bmr-setup" v-if="showAdvancedBmr">
                                    <div class="setup-row">
                                        <div class="setup-label">
                                            <span>体脂率 (可选)</span>
                                            <small>设置后将采用</small>
                                            <small>Katch-McArdle 计算公式</small>
                                        </div>
                                        <div class="input-with-unit small">
                                            <input type="number" class="styled-input" v-model="bodyFat" step="0.1"
                                                placeholder="" style="width: 80px;">
                                            <span class="unit">%</span>
                                        </div>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>

                    <!-- 运动系数选择 -->
                    <div class="right-panel-content" v-show="rightPanelState === 'activity_level'">
                        <div class="panel-header-flex">
                            <h4>日常运动系数 ⚡</h4>
                        </div>
                        <div class="activity-picker-list">
                            <div class="activity-option" v-for="opt in activityOptions" :key="opt.value"
                                :class="{ selected: activityLevel === opt.value }" @click="activityLevel = opt.value">
                                <div class="opt-header">
                                    <span class="opt-emoji">{{ opt.emoji }}</span>
                                    <span class="opt-label">{{ opt.label }} ({{ opt.value }})</span>
                                    <span class="rec-tag" v-if="opt.recommended">最佳✨</span>
                                </div>
                                <p class="opt-desc">{{ opt.desc }}</p>
                                <ul class="opt-scenarios">
                                    <li v-for="s in opt.scenarios" :key="s">{{ s }}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- 围度录入 (原本的小人模型逻辑保持) -->
                    <div class="right-panel-content no-vertical-scroll" v-show="rightPanelState === 'measurements'">
                        <div class="panel-header-flex">
                            <h4>身材围度记录 🌱</h4>
                        </div>
                        <div class="human-figure-container">
                            <div class="humanoid-wrapper"
                                @click.self="isMeasurePopoverOpen = false; activeMeasure = null">
                                <div class="css-humanoid">
                                    <div class="human-head"></div>
                                    <div class="human-torso"></div>
                                    <div class="human-arm left"></div>
                                    <div class="human-arm right"></div>
                                    <div class="human-leg left"></div>
                                    <div class="human-leg right"></div>

                                    <div v-for="co in callouts" :key="co.id"
                                        :class="['data-callout', co.direction, `for-${co.id}`]">
                                        <div class="callout-line"></div>
                                        <div class="callout-text">
                                            {{ co.name }}: {{ co.value }}cm
                                            <span class="callout-delete" @click="removeCallout(co.id)">×</span>
                                        </div>
                                    </div>

                                    <button v-for="p in [
                                        { id: 'chest', name: '胸围' }, { id: 'waist', name: '腰围' }, { id: 'hip', name: '臀围' },
                                        { id: 'arm_left', name: '左大臂' }, { id: 'arm_right', name: '右大臂' },
                                        { id: 'thigh_left', name: '左大腿' }, { id: 'thigh_right', name: '右大腿' },
                                        { id: 'calf_left', name: '左小腿' }, { id: 'calf_right', name: '右小腿' }
                                    ]" :key="p.id"
                                        :class="['measure-point', `point-${p.id}`, { active: activeMeasure?.id === p.id }]"
                                        @click="openMeasurePopover(p.id, p.name, $event)"></button>
                                </div>
                            </div>
                            <div class="measure-input-popover" v-show="isMeasurePopoverOpen"
                                :style="measurePopoverStyle">
                                <label>{{ activeMeasure?.name }}</label>
                                <div class="input-with-unit small">
                                    <input type="number" class="styled-input" v-model="measureInputValue" step="0.1"
                                        @keyup.enter="confirmMeasure">
                                    <span class="unit">cm</span>
                                </div>
                                <button class="popover-confirm-btn" @click="confirmMeasure">✔</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <footer class="modal-footer">
                <button class="btn-primary" @click="saveProfile"
                    :disabled="!nickname || !height || !weight">保存并关闭</button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
.profile-settings-modal {
    /* 提取主题色变量 */
    --modal-bg: #ffffff;
    --modal-primary: #c8a3c9;
    --modal-avatar-hover: #e8f5e9;
    --modal-primary-hover: #c3a7c4;
    --modal-primary-hover-light: #c3a7c4cc;
    --modal-primary-light: #fdfafdf4;
    --modal-secondary: #9f7899;
    --modal-text-main: #4A4E69;
    --modal-input-main: #F8F9FA;
    --modal-border: rgba(241, 225, 250, 0.752);
    --modal-shadow: rgba(74, 78, 105, 0.15);
    --avatar-bg: #E8F5E9;
    --humanoid-skin: #b9b3af;

    background: var(--modal-bg);
    width: 440px;
    height: 680px;
    /* 固定高度，防止跳动 */
    border-radius: 24px;
    box-shadow: 0 24px 48px var(--modal-shadow);
    padding: 32px;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
}

.profile-settings-modal.wide {
    width: 820px;
}

/* 隐藏滚动条 */
.profile-settings-modal *::-webkit-scrollbar {
    display: none;
}

.profile-settings-modal * {
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE and Edge */
}

.modal-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    flex-shrink: 0;
}

.modal-header h3 {
    font-size: 20px;
    color: var(--modal-text-main);
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--modal-secondary);
}

.modal-body {
    display: flex;
    gap: 32px;
    flex: 1;
    overflow: hidden;
    /* 内部滚动控制 */
}

.modal-left-panel {
    width: 376px;
    flex-shrink: 0;
    overflow-y: auto;
    padding-bottom: 20px;
}

.modal-right-panel {
    width: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    border-left: 2px dashed var(--modal-border);
    display: flex;
    flex-direction: column;
    background: #FAFAFA;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    display: flex;
    flex-direction: column;
    padding: 24px;
}

.modal-right-panel.expanded {
    width: 380px;
    opacity: 1;
    padding-left: 32px;
}

/* 基础信息卡片 */
.basic-info-card {
    padding-bottom: 24px;
    display: flex;
    gap: 20px;
    align-items: center;
    margin-bottom: 24px;
    border-bottom: 2px dashed var(--modal-border);
    flex-shrink: 0;

}

.card-avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.settings-avatar {
    width: 72px;
    height: 72px;
    background: var(--avatar-bg);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    /* 移除这里的 transition，背景不需要动 */
}

.settings-avatar span {
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: inline-block;
    will-change: transform;
}

.card-avatar-section:hover .settings-avatar span {
    transform: scale(1.15);
}

.edit-hint {
    font-size: 11px;
    color: var(--modal-secondary);
}

.card-form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-row {
    display: flex;
    gap: 12px;
}

.form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 12px;
    font-weight: 700;
    color: var(--modal-secondary);
}

/* 入口列表 */
.entry-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.menu-entry-btn {
    width: 100%;
    padding: 16px 20px;
    background: var(--modal-bg);
    border: 1px solid #F0F0F0;
    border-radius: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
    color: var(--modal-text-main);
}

.menu-entry-btn:hover {
    background: var(--modal-primary-light);
    border-color: var(--modal-primary);
    border-style: dashed;
}

.menu-entry-btn.active {
    background: var(--modal-primary-light);
    border-color: var(--modal-primary);
    box-shadow: 0 4px 12px rgba(212, 163, 115, 0.1);
}

.expand-icon {
    font-size: 10px;
    color: var(--modal-primary);
    transition: transform 0.3s;
}

.menu-entry-btn.active .expand-icon {
    transform: rotate(180deg);
}

/* 右侧内容样式标题 */
.panel-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-shrink: 0;
    border-bottom: 1px dashed var(--modal-border);
}

.panel-header-flex h4 {
    font-size: 16px;
    color: var(--modal-text-main);
    margin-bottom: 10px;
}

/* 右侧内容容器 */
.right-panel-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.right-panel-content.no-vertical-scroll {
    overflow-y: hidden;
}

.avatar-picker-header {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 12px;
}

/* 头像网格 */
.avatar-picker-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 8px;
    background: var(--modal-primary-light);
    border-radius: 16px;
}

.preset-avatar {
    aspect-ratio: 1;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s;
}

.preset-avatar:hover {
    background: var(--modal-avatar-hover);
    transform: scale(1.1);
}

.basic-entry-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* 分为两列，等宽 */
    gap: 20px;
    /* 设置项目之间的间距 */
}

.data-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.data-item label {
    font-size: 13px;
    font-weight: 700;
    color: var(--modal-secondary);
}

/* 运动系数面板 */
.activity-picker-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 480px;
    overflow-y: auto;
    padding-right: 4px;
}

.activity-option {
    padding: 16px;
    border: 2px solid #F0F0F0;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;
}

.activity-option:hover {
    border-color: var(--avatar-bg);
}

.activity-option.selected {
    border-color: #4CAF50;
    background: #F1F8F1;
}

.opt-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
}

.opt-label {
    font-weight: 700;
    color: #2E7D32;
    font-size: 14px;
}

.rec-tag {
    background: #4CAF50;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: normal;
}

.opt-desc {
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
    line-height: 1.4;
}

.opt-scenarios {
    padding-left: 18px;
    margin: 0;
}

.opt-scenarios li {
    font-size: 11px;
    color: #888;
    margin-bottom: 2px;
    list-style-type: circle;
}

/* BMI 指示器样式已存在，保持但做微调适配 */
/* ===== BMI 指示器 ===== */
.bmi-indicator-wrapper {
    margin-top: 24px;
    padding: 16px;
    border-radius: 16px;
    background: #f7e2eafb;

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

.bmi-bar {
    height: 8px;
    background: #eee;
    border-radius: 4px;
    display: flex;
    position: relative;
    margin: 20px 0;
}

/* ===== BMR 指示器 ===== */
.bmr-indicator-wrapper {
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: #f7e9e2fb;

}

.bmr-header-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.bmr-value-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.bmr-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--modal-secondary);
}

.bmr-number-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.bmr-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--modal-text-main);
}

.bmr-unit {
    font-size: 12px;
    color: var(--modal-secondary);
    font-weight: 600;
}

.bmr-setup-link {
    background: none;
    border: none;
    font-size: 12px;
    color: var(--modal-primary);
    cursor: pointer;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
}

.bmr-setup-link:hover {
    text-decoration: underline;
}

.advanced-bmr-setup {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--modal-border);
}

.setup-row {
    display: flex;
    padding-top: 20px;
    justify-content: space-between;
    align-items: center;
    border-top: 2px dashed var(--modal-primary);
}

.setup-label {
    display: flex;
    flex-direction: column;
}

.setup-label span {
    font-size: 13px;
    font-weight: 700;
    color: var(--modal-text-main);
}

.setup-label small {
    font-size: 11px;
    color: var(--modal-secondary);
}

/* 动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

.bmi-segment {
    height: 100%;
}

.bmi-segment.underweight {
    background: #ffb347;
    border-radius: 4px 0 0 4px;
}

.bmi-segment.normal {
    background: #3cab3c;
}

.bmi-segment.overweight {
    background: #f37645;
}

.bmi-segment.obese {
    background: #fa5050;
    border-radius: 0 4px 4px 0;
}

.bmi-thumb {
    position: absolute;
    top: -6px;
    width: 4px;
    height: 20px;
    background: var(--modal-text-main);
    border-radius: 2px;
    transform: translateX(-50%);
    transition: left 0.3s;
}

.bmi-thumb-label {
    position: absolute;
    top: 22px;
    width: 60px;
    text-align: center;
    left: -30px;
    font-size: 11px;
    font-weight: 700;
}

/* 通用输入框 */
.styled-input {
    width: 100%;
    padding: 10px 14px;
    background: var(--modal-input-main);
    border: 1px solid var(--modal-border);
    border-radius: 12px;
    margin-right: 22px;
    font-size: 14px;
    color: var(--modal-text-main);
    font-weight: 600;
    outline: none;
    transition: all 0.2s ease;
}

.styled-input:hover,
.styled-input:focus {
    border-color: var(--modal-primary);
    box-shadow: 0 0 0 1px var(--modal-primary), 0 4px 12px rgba(184, 150, 179, 0.15);
    /* 使用 1px spread 模拟 2px 边框效果，而不影响布局 */
    background: #fff;
}

.input-with-unit {
    position: relative;
    display: flex;
    align-items: center;
}

.input-with-unit .unit {
    position: absolute;
    right: 2px;
    font-size: 12px;
    color: var(--modal-secondary);
    pointer-events: none;
}

/* 原本的小人模型样式 (恢复旧版视觉) */
.human-figure-container {
    position: relative;
    width: 100%;
    height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.humanoid-wrapper {
    transform: scale(1.1);
}

.css-humanoid {
    width: 60px;
    height: 160px;
    position: relative;
    background: transparent;
    margin: 0 auto;
}

.human-head {
    width: 24px;
    height: 24px;
    background: #FCE6DA;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 18px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.human-torso {
    width: 32px;
    height: 50px;
    background: #FCE6DA;
    border-radius: 8px;
    position: absolute;
    top: 26px;
    left: 14px;
}

.human-arm {
    width: 10px;
    height: 45px;
    background: #FCE6DA;
    border-radius: 5px;
    position: absolute;
    top: 28px;
}

.human-arm.left {
    left: 2px;
}

.human-arm.right {
    right: 2px;
}

.human-leg {
    width: 12px;
    height: 60px;
    background: #FCE6DA;
    border-radius: 6px;
    position: absolute;
    top: 78px;
}

.human-leg.left {
    left: 15px;
}

.human-leg.right {
    left: 33px;
}

.measure-point {
    position: absolute;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 2px solid #D4A373;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    transition: all 0.2s;
}

.measure-point:hover,
.measure-point.active {
    transform: scale(1.5);
    background: #D4A373;
    box-shadow: 0 0 8px rgba(212, 163, 115, 0.5);
}

.point-chest {
    top: 40px;
    left: 24px;
}

.point-waist {
    top: 60px;
    left: 24px;
}

.point-hip {
    top: 80px;
    left: 24px;
}

.point-arm_left {
    top: 45px;
    left: 1px;
}

.point-arm_right {
    top: 45px;
    left: 49px;
}

.point-thigh_left {
    top: 95px;
    left: 16px;
}

.point-thigh_right {
    top: 95px;
    left: 32px;
}

.point-calf_left {
    top: 130px;
    left: 16px;
}

.point-calf_right {
    top: 130px;
    left: 32px;
}

/* Callout 样式 (恢复旧版连线) */
.data-callout {
    position: absolute;
    display: flex;
    align-items: center;
    pointer-events: none;
}

.callout-line {
    height: 1.5px;
    background: #D4A373;
    width: 45px;
    opacity: 0.7;
    transform-origin: left center;
}

.data-callout.direction-left .callout-line {
    transform-origin: right center;
}

.callout-text {
    background: white;
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px solid #D4A373;
    font-size: 11px;
    color: #4A4E69;
    font-weight: 700;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 4px;
    pointer-events: auto;
}

.callout-delete {
    color: #f44336;
    cursor: pointer;
    font-size: 14px;
    margin-left: 2px;
}

.data-callout.direction-left {
    flex-direction: row-reverse;
    right: 50%;
    margin-right: 40px;
}

.data-callout.direction-right {
    left: 50%;
    margin-left: 40px;
}

/* 各部位独立定位与斜线旋转 */
.for-chest {
    top: 40px;
}

.for-chest .callout-line {
    transform: rotate(-25deg);
}

.data-callout.direction-left.for-chest .callout-line {
    transform: rotate(25deg);
}

.for-waist {
    top: 62px;
}

.for-waist .callout-line {
    transform: rotate(0deg);
}

.for-hip {
    top: 85px;
}

.for-hip .callout-line {
    transform: rotate(25deg);
}

.data-callout.direction-left.for-hip .callout-line {
    transform: rotate(-25deg);
}

.for-arm_left,
.for-arm_right {
    top: 30px;
}

.for-arm_left .callout-line {
    transform: rotate(15deg);
    width: 55px;
}

.for-arm_right .callout-line {
    transform: rotate(-15deg);
    width: 55px;
}

.for-thigh_left,
.for-thigh_right {
    top: 105px;
}

.for-thigh_left .callout-line {
    transform: rotate(-15deg);
    width: 50px;
}

.for-thigh_right .callout-line {
    transform: rotate(15deg);
    width: 50px;
}

.for-calf_left,
.for-calf_right {
    top: 140px;
}

.for-calf_left .callout-line {
    transform: rotate(-35deg);
    width: 60px;
}

.for-calf_right .callout-line {
    transform: rotate(35deg);
    width: 60px;
}

.measure-input-popover {
    position: absolute;
    background: var(--modal-bg);
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid #F0F0F0;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 100;
}

.popover-confirm-btn {
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;
}

.modal-footer {
    margin-top: 32px;
    border-top: 1px solid #F0F0F0;
    padding-top: 24px;
    display: flex;
    justify-content: flex-end;
}

.btn-primary {
    background: var(--modal-primary);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover {
    background: var(--modal-primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(212, 163, 115, 0.2);
}

.btn-primary:disabled {
    background: #E0E0E0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(74, 78, 105, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: opacity 0.3s ease;
}

.flex-2 {
    flex: 2;
}
</style>
