<script setup lang="ts">
import { useUserStore } from '../../stores/user';
const userStore = useUserStore();

defineProps<{ currentView?: string }>();
defineEmits(['openProfile', 'changeView']);

// 格式化展示 UID (仅显示前后几位)
const formatUid = (id: string) => {
    if (!id) return '';
    if (id === 'default-user-id') return 'Local';
    return `ID: ${id.split('-')[0]}`;
};
</script>

<template>
    <div class="app-container">
        <!-- 侧边栏及导航 -->
        <aside class="sidebar">
            <div class="user-brand" id="open-profile-btn" @click="$emit('openProfile')">
                <div class="brand-avatar">
                    <span class="emoji">{{ userStore.user?.avatarId || '🌿' }}</span>
                </div>
                <div class="brand-info">
                    <h1>{{ userStore.user?.nickname || '冒险者' }}</h1>
                    <span class="brand-sub">{{ formatUid(userStore.user?.id || '') }}</span>
                </div>
            </div>

            <nav class="nav-menu">
                <button class="nav-item" :class="{ active: currentView === 'home' }"
                    @click="$emit('changeView', 'home')">
                    <!-- 主页图标 -->
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                        <path d="M9 21V12h6v9" />
                    </svg>
                    <span>主页</span>
                </button>
                <button class="nav-item" :class="{ active: currentView === 'stats' }"
                    @click="$emit('changeView', 'stats')">
                    <!-- 数据图标 -->
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span>数据中心</span>
                </button>
                <button class="nav-item" :class="{ active: currentView === 'nutrition' }"
                    @click="$emit('changeView', 'nutrition')">
                    <!-- 菜谱图标：书本 -->
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    <span>我的菜谱</span>
                </button>
                <button class="nav-item" :class="{ active: currentView === 'activity' }"
                    @click="$emit('changeView', 'activity')">
                    <!-- 运动图标 -->
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="5" width="4" height="14" rx="1" />
                        <rect x="10" y="9" width="4" height="10" rx="1" />
                        <rect x="16" y="3" width="4" height="16" rx="1" />
                    </svg>
                    <span>运动追踪</span>
                </button>
                <button class="nav-item" :class="{ active: currentView === 'settings' }"
                    @click="$emit('changeView', 'settings')">
                    <!-- 设置图标 -->
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path
                            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    <span>系统设置</span>
                </button>
            </nav>

            <div class="user-profile" style="cursor: pointer; flex-direction: column; gap: 4px; align-items: center;">
                <div class="brand-sub" style="color: #FCE6DA; font-size: 11px;">LV.{{ userStore.user?.level || 1 }} {{
                    userStore.user?.levelTitle || '燃脂新手' }}</div>
                <div class="user-streak">🔥 连续 1 天</div>
            </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content" id="app-content">
            <!-- 路由或页面组件插槽 -->
            <slot></slot>
        </main>

        <!-- 预留弹窗挂载插槽 -->
        <slot name="modals"></slot>
    </div>
</template>

<style scoped>
/* ===== App 基础结构 (修正同步) ===== */
.app-container {
    display: flex;
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    background: linear-gradient(180deg, #F3E0D6 0%, #B1877ACC 100%);
    border-radius: var(--border-radius-lg);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
    /* 外层大框的克制阴影 */
    overflow: hidden;
    /* 防止子元素边角溢出圆角 */
}

/* ===== 主内容区域 ===== */
.main-content {
    flex: 1;
    padding: 40px 60px;
    overflow-y: auto;
    position: relative;
    /* 为内部路由提供相对定位 */
}

/* ===== 侧边栏样式 ===== */
.sidebar {
    width: 280px;
    background: linear-gradient(180deg, #F3E0D6 0%, #B1877A 100%);
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    border-right: 2px dashed rgba(139, 106, 112, 0.3);
}

/* =========================================================
   Sidebar (侧边栏) 样式
========================================================= */

.user-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
    padding: 12px;
    background: #F3E0D6;
    /* 统一为暖粉白色 */
    border: 3px solid #B1877A;
    /* 修正边框厚度并匹配色系 */
    border-radius: 12px;
    box-shadow: 0 4px 0 #8E6B61;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
}

.user-brand:hover {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #8E6B61;
}

.user-brand:active {
    transform: translateY(4px);
    box-shadow: 0 0 0 #8B6A70;
}

.brand-avatar {
    font-size: 28px;
    background: #F0D9CC;
    /* 匹配标题栏背景色 */
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 2px solid #C29A8A;
    /* 匹配标题栏边框 */
    display: flex;
    align-items: center;
    justify-content: center;
}

.brand-info {
    display: flex;
    flex-direction: column;
}

.brand-info h1 {
    font-size: 16px;
    font-weight: 900;
    color: #5D3A42;
    /* 在浅色地板上使用深莓色 */
    margin: 0 0 2px 0;
    text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.4);
}

.brand-sub {
    font-size: 11px;
    color: #8B6A70;
    font-weight: 700;
}

.nav-menu {
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    /* 撑开中间，将用户信息推到底部 */
}

/* 未选中态：淡木棕色 */
.nav-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    color: #A8806A;
    /* 未选中：淡棕色文字 */
    transition: color 0.15s, background 0.15s, transform 0.1s;
    text-align: left;
}

/* 悬停态：加深，轻微提示 */
.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.35);
    color: #7A5040;
    /* 悬停：深棕棐色 */
    transform: translateX(2px);
}

/* 选中态：饱和木质深棕色 */
.nav-item.active {
    background-color: rgba(255, 255, 255, 0.5);
    color: #5D3A2A;
    /* 选中：深棕色文字 */
    box-shadow: 0 2px 0 rgba(93, 58, 42, 0.15);
    transform: translateX(0);
}

.nav-item.active:hover {
    transform: translateX(0);
    background-color: rgba(255, 255, 255, 0.55);
}

/* SVG 图标大小 */
.nav-item .icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    /* 继承父元素 color，实现智能三态着色 */
}

/* 修正侧边栏底部用户信息显示 */
.user-profile {
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    padding: 12px 16px;
    border: none;
    box-shadow: none;
    margin-top: auto;
}

.user-streak {
    font-size: 14px;
    color: #FCE6DA;
    /* 使用暖粉亮色文字，确保在深色渐变底色上清晰 */
    font-weight: 800;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
