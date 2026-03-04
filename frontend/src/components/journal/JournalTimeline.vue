<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { JournalEntry } from '@fat-loss-tracker/shared-types';
import { api } from '../../api';

const props = defineProps<{
    entries: JournalEntry[];
    totalIntake: number;
    totalBurn: number;
    targetCalories: number;
}>();

const emit = defineEmits(['date-change']);

const formatTime = (ts: string) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getDesc = (entry: any) => {
    if (entry.type === 'intake') {
        const amount = entry.amount || 0;
        if (amount > 500) return "🔥 丰盛的一餐，热量偏高记得适量加练哦~";
        else if (amount < 150) return "🍃 算是比较轻薄的健康加餐~";
        return "✅ 回复状态，健康生活每一天！";
    } else {
        const amount = entry.amount || 0;
        const unit = entry.unit || '分钟';
        const sport = entry.title || '运动';
        const mood = entry.mood || '😄';
        const bowls = (entry.calories / 200).toFixed(1);

        // 如果是自定义运动 (amount 为 0 或 负数)，不显示时长
        const durationText = (amount > 0) ? `${amount}${unit}` : '';
        return `${mood} 今日${sport}${durationText} 相当于消耗了 🍚 ${bowls} 碗米`;
    }
};


// === 日历逻辑相关状态 ===
const selectedDate = ref(new Date());
const displayMonth = ref(selectedDate.value.getMonth());
const displayYear = ref(selectedDate.value.getFullYear());
const isDatePickerOpen = ref(false);
const isMonthPickerOpen = ref(false);
const isMonthView = ref(false);

const todayDateString = computed(() => {
    const d = selectedDate.value;
    return `${d.getMonth() + 1}月${d.getDate()}日`;
});

// 日历网格计算
const dateGrid = computed(() => {
    const grid = [];
    const firstDay = new Date(displayYear.value, displayMonth.value, 1).getDay(); // 0 is Sunday

    const daysInMonth = new Date(displayYear.value, displayMonth.value + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayYear.value, displayMonth.value, 0).getDate();

    // 上月余数
    for (let i = firstDay - 1; i >= 0; i--) {
        grid.push({
            day: daysInPrevMonth - i,
            monthOffset: -1,
            isCurrentMonth: false
        });
    }

    // 本月主日期
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push({
            day: i,
            monthOffset: 0,
            isCurrentMonth: true,
            isToday: i === today.getDate() && displayMonth.value === today.getMonth() && displayYear.value === today.getFullYear(),
            isSelected: i === selectedDate.value.getDate() && displayMonth.value === selectedDate.value.getMonth() && displayYear.value === selectedDate.value.getFullYear()
        });
    }

    // 下月填充
    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
        grid.push({
            day: i,
            monthOffset: 1,
            isCurrentMonth: false
        });
    }
    return grid;
});

const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const monthGrid = computed(() => {
    const today = new Date();
    return monthNames.map((name, i) => ({
        name,
        index: i,
        isCurrentMonth: i === today.getMonth() && displayYear.value === today.getFullYear(),
        isSelected: i === selectedDate.value.getMonth() && displayYear.value === selectedDate.value.getFullYear()
    }));
});

// 方法集
const toggleDatePicker = (e?: Event) => {
    if (e) e.stopPropagation();
    isDatePickerOpen.value = !isDatePickerOpen.value;
    isMonthPickerOpen.value = false;
    if (isDatePickerOpen.value) {
        displayMonth.value = selectedDate.value.getMonth();
        displayYear.value = selectedDate.value.getFullYear();
    }
};

const selectDate = (cell: any) => {
    let targetMonth = displayMonth.value + cell.monthOffset;
    let targetYear = displayYear.value;
    if (targetMonth < 0) { targetMonth = 11; targetYear--; }
    if (targetMonth > 11) { targetMonth = 0; targetYear++; }

    selectedDate.value = new Date(targetYear, targetMonth, cell.day);
    isDatePickerOpen.value = false;
    isMonthView.value = false;
    // 不关闭本月汇总面板，让用户可以在面板中继续切换日期
    emit('date-change', selectedDate.value);
};

const selectMonth = (monthIndex: number) => {
    selectedDate.value = new Date(displayYear.value, monthIndex, 1);
    displayMonth.value = monthIndex;
    isMonthPickerOpen.value = false;
    isMonthView.value = true;
    emit('date-change', selectedDate.value);
};

const changeMonth = (offset: number) => {
    displayMonth.value += offset;
    if (displayMonth.value < 0) { displayMonth.value = 11; displayYear.value--; }
    if (displayMonth.value > 11) { displayMonth.value = 0; displayYear.value++; }
};

const changeYear = (offset: number) => {
    displayYear.value += offset;
};

const goPrevDay = () => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() - 1);
    selectedDate.value = d;
    isMonthView.value = false;
    emit('date-change', selectedDate.value);
};

const goNextDay = () => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + 1);
    selectedDate.value = d;
    isMonthView.value = false;
    emit('date-change', selectedDate.value);
};

const setToday = () => {
    selectedDate.value = new Date();
    displayMonth.value = selectedDate.value.getMonth();
    displayYear.value = selectedDate.value.getFullYear();
    emit('date-change', selectedDate.value);
};

const closeAllPickers = () => {
    isDatePickerOpen.value = false;
    isMonthPickerOpen.value = false;
};

// --- 本月汇总功能 ---
const isMonthSummaryOpen = ref(false);
const monthlyRecords = ref<any[]>([]);

const fetchMonthlyRecords = async () => {
    const m = displayMonth.value + 1;
    const monthStr = `${displayYear.value}-${m.toString().padStart(2, '0')}`;
    try {
        const records = await api.getMonthDashboard(monthStr);
        monthlyRecords.value = records;
    } catch (e) {
        console.error("Failed to fetch monthly records:", e);
        monthlyRecords.value = [];
    }
};

const getDailyDeficit = (day: number) => {
    const m = displayMonth.value + 1;
    const dateStr = `${displayYear.value}-${m.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const record = monthlyRecords.value.find(r => r.date === dateStr);

    if (record) {
        // 缺口 = 目标热量 + 消耗 - 摄入
        return Math.round(props.targetCalories + record.total_burn - record.total_intake);
    }
    return null;
};

watch([displayYear, displayMonth], () => {
    fetchMonthlyRecords();
});

// 切换本月汇总面板，每次展开时重置回当月
const toggleSummaryPanel = () => {
    if (!isMonthSummaryOpen.value) {
        const today = new Date();
        displayMonth.value = today.getMonth();
        displayYear.value = today.getFullYear();
        fetchMonthlyRecords();
    }
    isMonthSummaryOpen.value = !isMonthSummaryOpen.value;
};

onMounted(() => {
    fetchMonthlyRecords();
    window.addEventListener('click', closeAllPickers);
});
onUnmounted(() => {
    window.removeEventListener('click', closeAllPickers);
});

</script>

<template>
    <div class="view-container" id="view-journal">
        <header class="journal-header">
            <div class="journal-date-info">
                <div class="date-navigator" style="position: relative;">
                    <button class="nav-btn month-btn" @click.stop="changeMonth(-1)">«</button>
                    <button class="nav-btn day-btn" @click.stop="goPrevDay">‹</button>

                    <h2 class="huge-date" @click.stop="toggleDatePicker">
                        <span id="journal-date-text">{{ todayDateString }}</span>
                    </h2>

                    <button class="nav-btn day-btn" @click.stop="goNextDay">›</button>
                    <button class="nav-btn month-btn" @click.stop="changeMonth(1)">»</button>

                    <!-- Date Picker Popover -->
                    <div v-if="isDatePickerOpen" class="custom-picker-popover"
                        style="top: 10px; left: calc(100% + 15px);" @click.stop>
                        <div class="picker-header">
                            <button class="picker-nav-btn" @click="changeYear(-1)">«</button>
                            <button class="picker-nav-btn" @click="changeMonth(-1)">‹</button>
                            <div class="picker-current-view" @click="setToday">{{ displayYear }} 年 {{ displayMonth + 1
                            }} 月</div>
                            <button class="picker-nav-btn" @click="changeMonth(1)">›</button>
                            <button class="picker-nav-btn" @click="changeYear(1)">»</button>
                        </div>
                        <div class="picker-weekdays">
                            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                        </div>
                        <div class="picker-days-grid">
                            <div v-for="(cell, idx) in dateGrid" :key="idx" class="picker-cell"
                                :class="{ 'not-current-month': !cell.isCurrentMonth, 'is-today': cell.isToday, 'selected': cell.isSelected }"
                                @click="selectDate(cell)">
                                {{ cell.isCurrentMonth ? cell.day : '' }}
                            </div>
                        </div>
                    </div>

                    <!-- Month Picker Popover -->
                    <div v-if="isMonthPickerOpen" class="custom-picker-popover"
                        style="top: 10px; left: calc(100% + 15px);" @click.stop>
                        <div class="picker-header">
                            <button class="picker-nav-btn" @click="changeYear(-1)">«</button>
                            <div class="picker-current-view" @click="setToday">{{ displayYear }} 年</div>
                            <button class="picker-nav-btn" @click="changeYear(1)">»</button>
                        </div>
                        <div class="picker-months-grid">
                            <div v-for="(m, idx) in monthGrid" :key="idx" class="picker-month-cell"
                                :class="{ 'is-today': m.isCurrentMonth, 'selected': m.isSelected }"
                                @click="selectMonth(m.index)">
                                {{ m.name }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="date-subtitle">生活饮食记录</div>
            </div>

            <!-- 本月汇总 移到右侧，木牌按钮样式 -->
            <button class="wooden-summary-btn" :class="{ active: isMonthSummaryOpen }"
                @click.stop="toggleSummaryPanel()">
                本月汇总
            </button>
        </header>

        <div class="journal-content-wrapper" :class="{ 'with-sidebar': isMonthSummaryOpen }">
            <!-- 日视图：时间轴 -->
            <div class="journal-timeline active-view" id="journalTimeline"
                :class="{ 'has-entries': entries.length > 0 }">
                <!-- 动态内容由此渲染 -->
                <div class="journal-placeholder" id="journalPlaceholder"
                    :style="{ display: entries.length === 0 ? 'flex' : 'none' }">
                    <span style="font-size: 64px; margin-bottom: 16px;">📭</span>
                    <p>开始今天的记录吧～</p>
                </div>

                <div v-for="entry in entries" :key="entry.id" class="timeline-item" :class="'entry-' + entry.type">
                    <div class="time-marker">
                        <span class="time">{{ formatTime(entry.timestamp) }}</span>
                        <span class="dot"></span>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-icon-box">
                            {{ entry.emoji }}
                        </div>
                        <div class="meal-info">
                            <div class="timeline-title-row">
                                <span class="timeline-title">{{ entry.title }}</span>
                                <span class="timeline-cal">{{ entry.type === 'intake' ? '+' : '-' }}{{ entry.calories }}
                                    kcal</span>
                            </div>
                            <p class="timeline-desc">{{ getDesc(entry) }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 月度汇总侧边面板 -->
            <transition name="slide-right">
                <div class="month-summary-panel" v-show="isMonthSummaryOpen">

                    <div class="panel-content">
                        <!-- 月份切换 -->
                        <div class="summary-month-control">
                            <button class="picker-nav-btn" @click="changeMonth(-1)" style="font-size: 24px;">‹</button>
                            <span class="summary-month-title" @click="setToday">{{ displayYear }} 年 {{ displayMonth + 1
                            }} 月</span>
                            <button class="picker-nav-btn" @click="changeMonth(1)" style="font-size: 24px;">›</button>
                        </div>

                        <div class="picker-weekdays summary-weekdays">
                            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                        </div>
                        <div class="picker-days-grid summary-grid">
                            <div v-for="(cell, idx) in dateGrid" :key="idx" class="summary-cell"
                                :class="{ 'not-current-month': !cell.isCurrentMonth, 'is-today': cell.isToday, 'selected': cell.isSelected }"
                                @click="cell.isCurrentMonth ? selectDate(cell) : null">
                                <div class="summary-day">{{ cell.isCurrentMonth ? cell.day : '' }}</div>
                                <div class="summary-deficit" v-if="cell.isCurrentMonth">
                                    <template v-if="getDailyDeficit(cell.day) !== null">
                                        <span
                                            :class="getDailyDeficit(cell.day)! >= 0 ? 'deficit-positive' : 'deficit-negative'">
                                            {{ getDailyDeficit(cell.day)! > 0 ? '+' : '' }}{{ getDailyDeficit(cell.day)
                                            }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        <span class="deficit-empty">-</span>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>
</template>

<style scoped>
/* ===== 手账视图 (Journal) ===== */

/* 格子纸背景 */
#view-journal {
    background-image:
        linear-gradient(to right, #E3B8A5 1px, transparent 1px),
        linear-gradient(to bottom, #E3B8A5 1px, transparent 1px);
    background-size: 30px 30px;
    background-color: #F5D5C4;
    padding: 24px;
    border-radius: 14px;
    /* 高度固定，内部内容滚动 */
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* 覆盖全局 .view-container gap:32px，缩小 header 与内容区间距 */
    flex: 1;
    /* 继承父容器 .home-content 的剩余高度 */
    min-height: 0;
    /* flex 子项必须有此属性才能被压缩 */
    box-sizing: border-box;
}

.journal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

/* --- 顶部日期导航栏 --- */
.date-navigator {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.nav-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-bouncy);
    opacity: 0.6;
    padding: 8px;
    /* 增加整体可触控面积 */
    margin: -4px;
    /* 负外边距抵消 padding ，保持排版不偏移 */
}

.nav-btn.day-btn {
    font-size: 32px;
}

.nav-btn.month-btn {
    font-size: 24px;
}

.nav-btn:hover {
    opacity: 1;
    color: var(--color-accent);
    background: #FFEDEA;
    transform: scale(1.1);
}

.huge-date {
    font-size: 40px;
    font-weight: 800;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    cursor: pointer;
    font-family: serif;
    transition: var(--transition-bouncy);
}

.huge-date:hover {
    color: var(--color-accent);
}

.date-icon-wrapper {
    position: relative;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: var(--transition-bouncy);
}

.date-icon-wrapper:hover {
    transform: translateY(-3px) scale(1.05);
}

.hidden-picker {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    left: 0;
    top: 0;
    /* 防止原生的日历小图标阻挡点击区域 */
    inset: 0;
}

.hidden-picker::-webkit-calendar-picker-indicator {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.date-icon {
    font-size: 28px;
}

.date-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 20px;
}

/* 顶部开关控件组 */
.view-toggle-group {
    display: flex;
    gap: 12px;
}

.toggle-control {
    background: var(--bg-surface);
    border-radius: 100px;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: var(--shadow-soft);
    font-weight: 700;
    color: var(--text-secondary);
    font-size: 14px;
}

.toggle-control.mode-switch {
    cursor: pointer;
    border: none;
    transition: var(--transition-bouncy);
}

.toggle-control.mode-switch:hover {
    transform: translateY(-2px);
    color: var(--color-primary);
}


/* --- 切换容器布局调整 --- */
.journal-content-wrapper {
    position: relative;
    display: flex;
    gap: 24px;
    align-items: flex-start;
    width: 100%;
    flex: 1;
    /* 充满剩余高度 */
    min-height: 0;
    /* flex 子项必备，防止溢出 */
    overflow: hidden;
}

.journal-timeline {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    /* 内部滚动条 */
    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE/Edge */
    transition: all 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895);
}

.journal-timeline::-webkit-scrollbar {
    display: none;
    /* Chrome/Safari 隐藏滚动条，保留滚动能力 */
}

.active-view {
    display: block;
    animation: fadeIn 0.4s ease-out;
}

.hidden-view {
    display: none;
}

/* --- 日视图：垂直时间轴 --- */
.journal-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: #A58E8E;
    opacity: 0.8;
    cursor: pointer;
    transition: var(--transition-bouncy);
}

.journal-placeholder:hover {
    transform: scale(1.02);
    opacity: 1;
}

.placeholder-img {
    width: 120px;
    margin-bottom: 20px;
    /* 通过滤镜组合模拟 --bg-main (#8B6A70) 的浆果冷色调 */
    filter: sepia(1) hue-rotate(280deg) saturate(0.6) brightness(0.7) contrast(1.1);
    opacity: 0.8;
}

.journal-placeholder p {
    font-size: 16px;
    font-weight: 500;
}

/* 动态条目样式扩展 */
.timeline-item.entry-intake .dot {
    background-color: #F28482;
    /* 摄入点：粉红色 */
    box-shadow: 0 0 0 4px rgba(242, 132, 130, 0.2);
}

.timeline-item.entry-exercise .dot {
    background-color: #8FBB95;
    /* 消耗点：绿色 */
    box-shadow: 0 0 0 4px rgba(143, 187, 149, 0.2);
}

.timeline-item.entry-exercise .timeline-content {
    background: #e5f7e8d6;
    border-left: 4px solid #8FBB95;
    border-radius: 4px 12px 12px 4px;
}

.journal-timeline.has-entries::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 0;
    left: 80px;
    /* 控制线的位置 */
    width: 2px;
    background-color: rgba(139, 90, 80, 0.35);
    /* 木色线，比之前超亮的白色更清晰 */
}

.timeline-item {
    display: flex;
    gap: 40px;
    margin-bottom: 40px;
    position: relative;
}

.time-marker {
    width: 60px;
    text-align: right;
    font-weight: 700;
    color: #8b5b5baf;
    font-size: 14px;
    position: relative;
    padding-top: 16px;
}

.dot {
    position: absolute;
    right: -25px;
    /* 对齐那条中间线 */
    top: 22px;
    width: 12px;
    height: 12px;
    background-color: var(--color-wood);
    border: 3px solid var(--bg-main);
    border-radius: 50%;
    z-index: 2;
}



.timeline-content {
    flex: 1;
    display: flex;
    gap: 16px;
    /* 木质卡片风格：暗棕色底色、印花背景、可谁粗边框 */
    background-color: #F3E0D6;
    background-image: linear-gradient(45deg, #F5D5C4 20%, #FCE6DA 80%);
    padding: 14px 16px;
    border-radius: 12px;
    border: 3px solid #B1877A;
    box-shadow: 0 4px 0 #8E6B61, 0 8px 12px rgba(0, 0, 0, 0.08);
    transition: transform 0.15s, box-shadow 0.15s;
    align-items: center;
}

.timeline-content:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #8E6B61, 0 12px 16px rgba(0, 0, 0, 0.1);
}

.timeline-content:active {

    box-shadow: 0 6px 0 #8E6B61;
}

/* 运动记录用稍深的绿色木质 */
.entry-exercise .timeline-content {
    background-color: #D4E8D8;
    background-image: linear-gradient(45deg, #C8E4CC 20%, #DCF0DF 80%);
    border-color: #7BA87F;
    box-shadow: 0 4px 0 #5E8861, 0 8px 12px rgba(0, 0, 0, 0.08);
}

.entry-exercise .timeline-content:hover {
    box-shadow: 0 2px 0 #5E8861, 0 12px 16px rgba(0, 0, 0, 0.1);
}

.entry-exercise .timeline-content:active {
    box-shadow: 0 6px 0 #5E8861;
}



.timeline-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
    /* 摔入的木质小款前景卡片 */
    background: rgba(255, 255, 255, 0.5);
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.1);
}

.entry-intake .timeline-icon-box {
    background: rgb(238, 194, 189);
}

.entry-exercise .timeline-icon-box {
    background: rgba(180, 230, 185, 0.5);
}

.meal-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.timeline-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.timeline-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.timeline-cal {
    font-size: 15px;
    font-weight: 800;
    font-family: monospace;
}

.entry-intake .timeline-cal {
    color: #C0524D;
}

.entry-exercise .timeline-cal {
    color: #4A8750;
}

.timeline-desc {
    font-size: 13px;
    color: #8B6A70;
    margin: 0;
    line-height: 1.4;
}

.meal-info p {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.5;
}

/* 本月汇总木牌按钮 - 浆果黄昏主题适配 */
.wooden-summary-btn {
    background: #B98B99;
    /* 豆沙粉，与填充条正常色一致 */
    color: #FCE6DA;
    /* 暖粉白，与面板背景呼应 */
    border-right: 3px solid #b17a95;
    border-left: 3px solid #b17a95;
    border-top: 2px solid transparent;
    border-bottom: 2px solid #62425d;
    /* 红棕边框，同容器边框 */
    box-shadow: inset 0 -5px 0 #80587a, 0 4px 6px rgba(0, 0, 0, 0.1);
    /* 内阴影用灰紫 */
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 800;
    font-family: monospace;
    cursor: pointer;
    white-space: nowrap;
    align-self: center;
    transition: transform 0.1s, box-shadow 0.1s, background 0.1s;
}

.wooden-summary-btn:hover {
    /* 浅红棕，取自标题栏边框 */
    transform: translateY(2px);
    box-shadow: inset 0 -3px 0 #80587a, 0 4px 6px rgba(0, 0, 0, 0.1);
}

.wooden-summary-btn:active {
    transform: translateY(4px);
    box-shadow: inset 0 -1px 0 #80587a, 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* 面板展开时保持按下样式 */
.wooden-summary-btn.active {
    transform: translateY(4px);
    box-shadow: inset 0 -1px 0 #80587a, inset 0 2px 4px rgba(0, 0, 0, 0.2);
    background: #9A7285;
}

.wooden-summary-btn.active:hover {
    transform: translateY(2px);
    box-shadow: inset 0 -2px 0 #80587a, inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* 运动卡片有点不同 */


/* --- 月视图：日历 --- */
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12px;
    background: var(--bg-surface);
    padding: 24px;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-soft);
    margin-bottom: 24px;
}

.calendar-weekday {
    text-align: center;
    font-weight: 800;
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 12px;
}

.calendar-day {
    aspect-ratio: 1;
    background: #F8F9FA;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--text-primary);
    cursor: pointer;
    position: relative;
    transition: var(--transition-bouncy);
}

.calendar-day:hover {
    background: #E2E8F0;
    transform: scale(1.05);
}

.calendar-day.empty {
    background: transparent;
    cursor: default;
}

.calendar-day.empty:hover {
    transform: none;
}

.day-dot {
    position: absolute;
    bottom: 8px;
    width: 6px;
    height: 6px;
    background-color: #D1D5DB;
    /* 默认点改为中性色 */
    border-radius: 50%;
}

.day-dot.active {
    background-color: var(--color-accent);
}

/* ===== 新版标签页 Tabs (仿设计图) ===== */
.view-tabs-group {
    display: flex;
    gap: 12px;
}

.view-tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    border-radius: 100px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: var(--transition-bouncy);
    border: 0px;
    background: #FFFFFF;
    color: var(--text-secondary);
}

.view-tab:hover {
    background: #FFEDEA;
    color: var(--color-accent);
}

.view-tab.active {
    background: var(--color-accent);
    color: white;
    box-shadow: 0 4px 15px rgba(242, 132, 130, 0.3);
}

.nav-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: inherit;
    opacity: 0.6;
    transition: opacity 0.2s;
    padding: 0 4px;
    /* 增加一点热区 */
}

.nav-arrow:hover {
    opacity: 1;
    color: var(--color-accent);
}

/* 选中状态下，箭头 hover 保持白色 */
.view-tab.active .nav-arrow:hover {
    color: white;
}

.tab-icon {
    font-size: 16px;
    color: inherit;
}

/* ===== 恢复的 Date Picker Popover ===== */
.custom-picker-popover {
    position: absolute;
    background: var(--bg-surface);
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-soft), 0 0 1px rgba(0, 0, 0, 0.1);
    padding: 16px;
    z-index: 1000;
    width: 280px;
    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid #F0F0F0;
}

@keyframes popIn {
    from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed rgba(212, 163, 115, 0.2);
}

.picker-current-view {
    font-weight: 800;
    font-size: 15px;
    color: var(--text-primary);
    cursor: pointer;
}

.picker-current-view:hover {
    color: var(--color-accent);
}

.picker-nav-btn {
    background: transparent;
    border: none;
    color: #ffffffcc;
    font-size: 16px;
    cursor: pointer;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
}

.picker-nav-btn:hover {
    background: #FFEDEA1a;

}

.picker-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 8px;
}

.picker-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
}

.picker-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border-radius: 8px;
    color: var(--text-primary);
    transition: all 0.2s;
}

.picker-cell:hover {
    background: #FFEDEA;
    color: var(--color-accent);
}

.picker-cell.selected {
    background: var(--color-accent);
    color: white;
    box-shadow: 0 2px 8px rgba(242, 132, 130, 0.4);
}

.picker-cell.not-current-month {
    pointer-events: none;
    /* 防止点击非当月空白格子 */
}

/* 当日/当月 标识圆点 */
.picker-cell.is-today,
.picker-month-cell.is-today {
    position: relative;
    font-weight: 800;
}

.picker-cell.is-today::after,
.picker-month-cell.is-today::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background-color: var(--color-accent);
    border-radius: 50%;
}

.picker-cell.selected::after,
.picker-month-cell.selected::after {
    background-color: white;
    /* 选中时圆点变白 */
}

.picker-months-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}

.picker-month-cell {
    padding: 12px 0;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border-radius: 8px;
    color: var(--text-primary);
    transition: all 0.2s;
    background: #F8F9FA;
}

.picker-month-cell:hover {
    background: #FFEDEA;
    color: var(--color-accent);
}

.picker-month-cell.selected {
    background: var(--color-accent);
    color: white;
}

/* ===== 本月汇总面板 (Drawer Layout) ===== */
.month-summary-panel {
    flex-shrink: 0;
    width: 360px;
    height: 420px;
    /* 柨木聞：暗棕色底色 + 木纹背景 */
    background-color: #F3E0D6;
    background-image: linear-gradient(135deg, #F5D5C4 0%, #FCE6DA 50%, #F0CDBC 100%);
    border-radius: 16px;
    /* 木质帧与阴影 */
    border: 3px solid #B1877A;
    box-shadow: 0 6px 0 #8E6B61, 0 12px 16px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: 20px;
    overflow-y: hidden;
    scrollbar-width: none;
}


.summary-month-control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    /* 木牌标题栏 */
    background: #B6867A;
    border: 2px solid #8B6A70;
    border-radius: 10px;
    padding: 8px 12px;
    box-shadow: inset 0 -3px 0 #8B6A70;
}

.summary-month-title {
    font-weight: 800;
    font-size: 15px;
    font-family: monospace;
    color: #FAD6C0;
}

.summary-month-title:hover {
    /* 文字加阴影 */
    cursor: pointer;
    color: #59493b;
    text-shadow: 0 0 1px #FAD6C0;
}

/* 与日期格共用相同的 grid-template-columns 和 gap，确保对齐 */
.summary-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    color: #8B6A70;
    margin-bottom: 6px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.summary-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    padding: 6px 2px;
    min-height: 48px;
}

.summary-cell.not-current-month {
    background: transparent;
    pointer-events: none;
    box-shadow: none;
    opacity: 0;
}

.summary-cell:hover {
    background: rgba(177, 135, 122, 0.2);
    transform: scale(1.05);
}

.summary-cell.selected {
    background: #B6867A;
    color: #FAD6C0;
    box-shadow: inset 0 -2px 0 #8B6A70;
}

.summary-day {
    font-size: 14px;
    font-weight: 700;
    color: #5A3D44;
    margin-bottom: 2px;
}

.summary-deficit {
    font-size: 10px;
    font-weight: 800;
    font-family: monospace;
}

.deficit-positive {
    color: #4A8750;
}

.deficit-negative {
    color: #C0524D;
}

.summary-cell.selected .deficit-positive,
.summary-cell.selected .deficit-negative,
.summary-cell.selected .deficit-empty {
    color: rgba(252, 230, 218, 0.9);
}

.deficit-empty {
    color: #A8836E;
}

/* 未选中的今日：背景浅底色 + 文字加下划线 */
.summary-cell.is-today:not(.selected) {
    background: rgba(177, 135, 122, 0.2);
}

.summary-cell.is-today:not(.selected) .summary-day {
    color: #B1877A;
    text-decoration: underline;
    text-underline-offset: 2px;
}

/* 选中的今日：深木色背景 + 白字 + 额外的高亮圆点 */
.summary-cell.is-today.selected .summary-day {
    color: #FAD6C0;
    text-decoration: underline;
    text-underline-offset: 2px;
}


/* 动画 */
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895);
    overflow: hidden;
}

.slide-right-enter-from,
.slide-right-leave-to {
    opacity: 0;
    width: 0;
    margin-left: -24px;
    /* 抵消 gap */
    padding-left: 0;
    padding-right: 0;
    transform: translateX(10px);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
