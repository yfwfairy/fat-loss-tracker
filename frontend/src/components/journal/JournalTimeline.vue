<script setup lang="ts">
import type { JournalEntry } from '@fat-loss-tracker/shared-types';

const props = defineProps<{
  entries: JournalEntry[];
}>();

const formatTime = (ts: string) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <section class="journal-section">
    <div class="journal-header">
      <h3>今日手帐</h3>
    </div>
    
    <div class="timeline">
      <div v-if="entries.length === 0" class="empty-journal" style="text-align: center; color: #999; padding: 2rem;">
        还没有记录任何饮食和运动，快去添加第一笔吧！
      </div>

      <div 
        v-for="entry in entries" 
        :key="entry.id" 
        class="timeline-item"
        :class="entry.type"
      >
        <div class="time">{{ formatTime(entry.timestamp) }}</div>
        
        <div class="icon-bubble" :class="entry.type">
          <span class="emoji">{{ entry.emoji }}</span>
        </div>
        
        <div class="content-card">
          <div class="card-header">
            <h4>{{ entry.title }}</h4>
            <span class="calories" :class="entry.type">
              {{ entry.type === 'intake' ? '+' : '-' }}{{ entry.calories }} 千卡
            </span>
          </div>
          
          <div class="card-details">
            <span>{{ 'amount' in entry ? entry.amount : 0 }} {{ 'unit' in entry ? entry.unit : '' }}</span>
            <span class="dot-separator">•</span>
            <span class="evaluation" :class="{
              good: entry.type === 'exercise', 
              warning: entry.type === 'intake' && entry.calories > 300
            }">
              {{ entry.type === 'exercise' ? '🏃 脂肪在燃烧' : '🥗 健康一餐' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Scoped overrides if necessary, relying heavily on global style.css */
</style>
