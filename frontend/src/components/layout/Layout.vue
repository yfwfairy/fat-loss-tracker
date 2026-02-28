<script setup lang="ts">
// 全局导航栏交互逻辑预留位
</script>

<template>
  <div class="app-layout">
    <!-- 全局页头 / 导航栏 -->
    <header class="app-header">
      <div class="logo">
        <i class="fas fa-leaf"></i>
        <h1>Fat Loss Tracker</h1>
      </div>
      
      <!-- 用户资料唤起按钮 -->
      <div class="user-profile-trigger">
        <img src="/assets/avatars/avatar3.png" alt="User" class="avatar-small">
        <span class="user-greeting">Hi, <span class="nickname">Berry</span></span>
      </div>
    </header>

    <!-- 主展示区大屏插槽 -->
    <main class="dashboard-main">
      <slot></slot>
    </main>

    <!-- 预留弹窗挂载插槽 -->
    <slot name="modals"></slot>

    <!-- 底部全局导航 (Bottom Navigation) -->
    <nav class="bottom-nav">
      <button class="nav-item active">
        <i class="fas fa-home"></i>
        <span>今日</span>
      </button>
      <button class="nav-item">
        <i class="fas fa-chart-bar"></i>
        <span>统计</span>
      </button>
      <button class="nav-item">
        <i class="fas fa-user"></i>
        <span>我的</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
/*
  由于我们目前直接继承了 public/css/style.css，
  这里暂时保持干净。以后若有专属 Layout 的调整可写于此。
*/
</style>
