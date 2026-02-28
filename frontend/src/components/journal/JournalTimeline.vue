<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { JournalEntry } from '@fat-loss-tracker/shared-types';

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

const totalCapacity = computed(() => props.targetCalories + Math.max(0, props.totalBurn - 1800)); // derived from dashboard logic

const ringStyle = computed(() => {
    const intakeRatio = Math.min(1, props.totalIntake / totalCapacity.value);
    const intakePct = (intakeRatio * 100).toFixed(1);
    return {
        background: `conic-gradient(var(--color-accent) ${intakePct}%, #FFEDEA 0)`
    };
});

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

const tabDayLabel = computed(() => {
  const d = selectedDate.value;
  const today = new Date();
  const isToday = d.getDate() === today.getDate() &&
                  d.getMonth() === today.getMonth() &&
                  d.getFullYear() === today.getFullYear();
  return isToday ? "今天" : `${d.getMonth() + 1}月${d.getDate()}日`;
});

const tabMonthLabel = computed(() => {
  return `${selectedDate.value.getMonth() + 1}月`;
});

// 日历网格计算
const dateGrid = computed(() => {
  const grid = [];
  const firstDay = new Date(displayYear.value, displayMonth.value, 1).getDay();
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  const daysInMonth = new Date(displayYear.value, displayMonth.value + 1, 0).getDate();
  const daysInPrevMonth = new Date(displayYear.value, displayMonth.value, 0).getDate();

  // 上月余数
  for (let i = adjustedFirstDay - 1; i >= 0; i--) {
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

const toggleMonthPicker = (e?: Event) => {
    if (e) e.stopPropagation();
    isMonthPickerOpen.value = !isMonthPickerOpen.value;
    isDatePickerOpen.value = false;
};

const selectDate = (cell: any) => {
    let targetMonth = displayMonth.value + cell.monthOffset;
    let targetYear = displayYear.value;
    if (targetMonth < 0) { targetMonth = 11; targetYear--; }
    if (targetMonth > 11) { targetMonth = 0; targetYear++; }
    
    selectedDate.value = new Date(targetYear, targetMonth, cell.day);
    isDatePickerOpen.value = false;
    isMonthView.value = false;
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

onMounted(() => {
    window.addEventListener('click', closeAllPickers);
});
onUnmounted(() => {
    window.removeEventListener('click', closeAllPickers);
});

</script>

<template>
  <div class="view-container" id="view-journal">
      <!-- 顶部日期与热量环 -->
      <header class="journal-header">
          <div class="journal-date-info">
              <h2 class="huge-date" @click.stop="toggleDatePicker">
                  <span id="journal-date-text">{{ todayDateString }}</span>
                  <div class="date-icon-wrapper">
                      <span class="calendar-icon">📅</span>
                  </div>
              </h2>
              <div class="date-subtitle">生活饮食记录</div>

              <!-- 视图切换控件 Tabs -->
              <div class="view-tabs-group" style="position: relative;">
                  <button class="view-tab" :class="{ active: !isMonthView }" id="tab-day-view" @click.stop="toggleDatePicker">
                      <span class="nav-arrow" id="nav-prev-day" @click.stop="goPrevDay">‹</span>
                      <span class="tab-label">{{ tabDayLabel }}</span>
                      <span class="nav-arrow" id="nav-next-day" @click.stop="goNextDay">›</span>
                  </button>
                  <button class="view-tab" :class="{ active: isMonthView }" id="tab-month-view" @click.stop="toggleMonthPicker">
                      <span class="tab-icon">📅</span>
                      <span class="tab-label">{{ isMonthView ? tabMonthLabel : '月历' }}</span>
                  </button>

                  <!-- Date Picker Popover -->
                  <div v-if="isDatePickerOpen" class="custom-picker-popover" style="top: 50px; left: 0;" @click.stop>
                      <div class="picker-header">
                          <button class="picker-nav-btn" @click="changeYear(-1)">«</button>
                          <button class="picker-nav-btn" @click="changeMonth(-1)">‹</button>
                          <div class="picker-current-view" @click="setToday">{{ displayYear }} 年 {{ displayMonth + 1 }} 月</div>
                          <button class="picker-nav-btn" @click="changeMonth(1)">›</button>
                          <button class="picker-nav-btn" @click="changeYear(1)">»</button>
                      </div>
                      <div class="picker-weekdays">
                          <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
                      </div>
                      <div class="picker-days-grid">
                          <div v-for="(cell, idx) in dateGrid" :key="idx" 
                               class="picker-cell" 
                               :class="{ 'not-current-month': !cell.isCurrentMonth, 'is-today': cell.isToday, 'selected': cell.isSelected }"
                               @click="selectDate(cell)">
                              {{ cell.day }}
                          </div>
                      </div>
                  </div>

                  <!-- Month Picker Popover -->
                  <div v-if="isMonthPickerOpen" class="custom-picker-popover" style="top: 50px; left: 100px;" @click.stop>
                      <div class="picker-header">
                          <button class="picker-nav-btn" @click="changeYear(-1)">«</button>
                          <div class="picker-current-view" @click="setToday">{{ displayYear }} 年</div>
                          <button class="picker-nav-btn" @click="changeYear(1)">»</button>
                      </div>
                      <div class="picker-months-grid">
                          <div v-for="(m, idx) in monthGrid" :key="idx"
                               class="picker-month-cell"
                               :class="{ 'is-today': m.isCurrentMonth, 'selected': m.isSelected }"
                               @click="selectMonth(m.index)">
                              {{ m.name }}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="daily-calorie-ring" :style="ringStyle">
              <div class="ring-circle">
                  <div class="ring-text">
                      <span class="ring-num" id="journalRingNum">{{ Math.round(totalCapacity) }}</span>
                      <span class="ring-label">kcal</span>
                  </div>
              </div>
          </div>
      </header>

      <div class="journal-content-wrapper">
          <!-- 日视图：时间轴 -->
          <div class="journal-timeline active-view" id="journalTimeline" :class="{ 'has-entries': entries.length > 0 }">
              <!-- 动态内容由此渲染 -->
              <div class="journal-placeholder" id="journalPlaceholder" :style="{ display: entries.length === 0 ? 'flex' : 'none' }">
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
                              <span class="timeline-cal">{{ entry.type === 'intake' ? '+' : '-' }}{{ entry.calories }} kcal</span>
                          </div>
                          <p class="timeline-desc">{{ getDesc(entry) }}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>

<style scoped>
/* ===== 手账视图 (Journal) ===== */
.journal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.huge-date {
    font-size: 40px;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: serif;
    /* 优雅的衬线字体感 */
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



/* 右侧热量环 */
.daily-calorie-ring {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    /* 这个决定了环的粗细 */
    box-shadow: var(--shadow-soft);
}

.ring-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.ring-text {
    text-align: center;
    display: flex;
    flex-direction: column;
}

.ring-num {
    font-size: 24px;
    font-weight: 800;
    color: var(--text-primary);
}

.ring-label {
    font-size: 12px;
    color: var(--text-primary);
}

/* --- 切换容器 --- */
.journal-content-wrapper {
    position: relative;
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
    background-color: #ffffff33;
    /* 原木色虚线感 */
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
    color: var(--text-third);
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
    background: var(--bg-surface);
    padding: 16px;
    border-radius: var(--border-radius-md);
    box-shadow: var(--shadow-soft);
    transition: var(--transition-bouncy);
    align-items: center;
}

.timeline-content:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-solid);
}



.timeline-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    flex-shrink: 0;
    background: #F8F9FA;
}

.entry-intake .timeline-icon-box {
    background: #FFEDEA;
}

.entry-exercise .timeline-icon-box {
    background: #E8F3EE;
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
    font-weight: 700;
}

.entry-intake .timeline-cal {
    color: var(--color-light-red);
}

.entry-exercise .timeline-cal {
    color: var(--color-light-green);
}

.timeline-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
}

.meal-info p {
    font-size: 14px;
    color: var(--text-primary);
    line-height: 1.5;
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
    color: var(--text-secondary);
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
    background: #FFEDEA;
    color: var(--color-accent);
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
    color: #D1D5DB;
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


</style>
