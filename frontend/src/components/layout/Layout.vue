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
            <button class="nav-item" :class="{ active: currentView === 'dashboard' }" @click="$emit('changeView', 'dashboard')">
                <span class="icon">🍄</span>
                <span>我的旅程</span>
            </button>
            <button class="nav-item" :class="{ active: currentView === 'journal' }" @click="$emit('changeView', 'journal')">
                <span class="icon">📔</span>
                <span>饮食手账</span>
            </button>
        </nav>

        <div class="user-profile" style="cursor: pointer; flex-direction: column; gap: 4px; align-items: center;">
            <div class="brand-sub" style="color: #FCE6DA; font-size: 11px;">LV.{{ userStore.user?.level || 1 }} {{ userStore.user?.levelTitle || '燃脂新手' }}</div>
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
    max-width: 1200px;
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

.nav-item {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px 20px;
    border: none;
    background: transparent;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-family: inherit;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-secondary);
    transition: var(--transition-bouncy);
    text-align: left;
}

/* 导航项悬停时的下压反馈 */
.nav-item:hover {
    background-color: rgba(255, 255, 255, 0.5);
    transform: translateY(2px);
    /* 改为下压 */
}

/* 激活状态的导航项 */
.nav-item.active {
    background-color: #F3E0D6;
    /* 暖粉白激活背景 */
    color: #D44F6A;
    /* 莓红色激活文字 */
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.05);
}

.nav-item .icon {
    font-size: 20px;
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
