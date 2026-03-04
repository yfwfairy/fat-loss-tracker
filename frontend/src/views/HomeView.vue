<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import DashboardCards from '../components/dashboard/DashboardCards.vue'
import JournalTimeline from '../components/journal/JournalTimeline.vue'
import { useUserStore } from '../stores/user'
import { useJournalStore } from '../stores/journal'

const emit = defineEmits(['openIntake', 'openExercise']);

const userStore = useUserStore()
const journalStore = useJournalStore()

const homeTab = ref('status'); // 'status' or 'timeline'
const viewDate = ref(new Date());

const currentTime = ref(new Date());
let timer: number;

onMounted(() => {
    timer = window.setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

const timeString = computed(() => {
    const d = currentTime.value;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${day} ${hh}:${mm}`;
});

const tdeeValue = computed(() => userStore.tdee);
const totalIntake = computed(() => journalStore.totals.total_intake);
const totalBurn = computed(() => journalStore.totals.total_burn);
const journalEntries = computed(() => journalStore.entries);

const totalCapacity = computed(() => Math.round(tdeeValue.value + (totalBurn.value || 0)) || 0);
const remainingKcal = computed(() => Math.round(totalCapacity.value - (totalIntake.value || 0)) || 0);

const handleDateChange = (date: Date) => {
    viewDate.value = date;
    console.log('Selected date changed to:', date);
};

const handleResetDay = () => {
    // TODO: 后端清空今日逻辑
    console.log('Resetting day is not yet implemented on backend');
};
</script>

<template>
    <div class="home-container">
        <!-- 顶部胶囊切换与全局看板 -->
        <div class="top-bar">
            <!-- 文件夹标签部分 -->
            <div class="folder-tabs">
                <button class="folder-tab" :class="{ active: homeTab === 'status' }"
                    @click="homeTab = 'status'">我的旅程</button>
                <button class="folder-tab" :class="{ active: homeTab === 'timeline' }"
                    @click="homeTab = 'timeline'">饮食手帐</button>
            </div>

            <div class="global-top-info">
                <!-- 木牌时间 -->
                <div class="wooden-sign time-sign">
                    <span>{{ timeString }}</span>
                </div>
                <!-- 卡路里计数器 -->
                <div class="wooden-sign kcal-sign">
                    <span>{{ remainingKcal }} / {{ totalCapacity }}</span>
                </div>
            </div>
        </div>

        <!-- 实体文件夹主体区 -->
        <div class="folder-body">
            <div class="home-content">
                <DashboardCards v-show="homeTab === 'status'" :targetCalories="tdeeValue" :totalIntake="totalIntake"
                    :totalBurn="totalBurn" @openIntake="emit('openIntake')" @openExercise="emit('openExercise')"
                    @resetDay="handleResetDay" />

                <JournalTimeline v-show="homeTab === 'timeline'" :entries="journalEntries" :totalIntake="totalIntake"
                    :totalBurn="totalBurn" :targetCalories="tdeeValue" @date-change="handleDateChange" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.top-bar {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    /* 强迫标签对齐底部 */
    position: relative;
    /* 去除了 z-index，避免在主容器前产生屏障上下文，让子层级可以自由穿插 */
    margin-bottom: -3px;
    /* 向下溢出以覆盖文件夹主框的顶部粗线(3px) */
    padding-left: 40px;
    /* 标签起始位置稍稍缩进 */
}

.folder-tabs {
    display: flex;
    gap: 4px;
}

.folder-tab {
    padding: 16px 32px 18px 32px;
    border-radius: 12px 12px 0 0;
    /* 仅顶部圆角的半闭合文件夹形态 */
    border: 3px solid #8B6A70;
    border-bottom: 0px solid transparent;
    /* 外层粗描边 */
    background: #c1958a;
    /* 未激活时是深一点的退隐木色 */
    color: #F8F3ED;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    position: relative;
    transform: translateY(6px);
    /* 用 translateY 替代 top，不影响布局流 */
    z-index: 1;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
    /* 底部受压阴影增强真实凹下感 */
}

.folder-tab:hover:not(.active) {
    background: #B6867A;
    transform: translateY(3px);
    /* 悬浮时些许上浮 */
}

.folder-tab.active {
    background: linear-gradient(45deg, #F5D5C4 20%, #FCE6DA 80%);
    /* 匹配主文件夹容器颜色 */
    color: #8B6A70;
    transform: translateY(0);
    /* 完全升起贴合主平面 */
    z-index: 3;
    /* 置顶，盖住下方的框线 */
    box-shadow: none;
    /* 卸下内部受压阴影 */
    border-bottom: 0px solid transparent;
    /* 此时直接使用底部边际向下伸出的背景盖住主容器的边框 */
    padding-bottom: 19px;
    /* 延伸底部 Padding，这部分没有边框，纯纯只有背景，完美替代了之前的 ::after */
}

.global-top-info {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    /* 和因 tabs 底部吸附带来的高度错位微调拉平 */
    position: relative;
    z-index: 5;
}

.wooden-sign {
    background: #B6867A;
    padding: 8px 16px;
    margin-bottom: 14px;
    border-radius: 12px;
    color: #FAD6C0;
    font-size: 14px;
    font-weight: 800;
    border: 2px solid #8B6A70;
    box-shadow: inset 0 -3px 0 #8B6A70, 0 4px 6px rgba(0, 0, 0, 0.1);
    font-family: monospace;
    display: flex;
    align-items: center;
    justify-content: center;
}

.kcal-sign {
    background: #644B55;
    border-color: #452F38;
    box-shadow: inset 0 -3px 0 #452F38, 0 4px 6px rgba(0, 0, 0, 0.1);
    color: #FAD6C0;
}

.folder-body {

    background: linear-gradient(45deg, #F5D5C4 20%, #FCE6DA 80%);
    /* 温润的米白文件夹纸底 */
    border: 3px solid #8B6A70;
    /* 外边缘硬线 */
    border-radius: 16px;

    box-shadow: 0 8px 0 #B1877A, 0 16px 20px rgba(139, 106, 112, 0.15);
    /* 超厚实体底座与环境阴影 */
    flex: 1;
    min-height: 0;
    /* 防止 flex 子项溢出 */
    position: relative;
    z-index: 2;
    overflow: hidden;
    /* 不自身滚动，部内部子组件控制 */
    display: flex;
    flex-direction: column;
}

.home-content {
    flex: 1;
    min-height: 0;
    display: flex;
    /* 让内部的 JournalTimeline / DashboardCards 能继承高度 */
    flex-direction: column;
}
</style>
