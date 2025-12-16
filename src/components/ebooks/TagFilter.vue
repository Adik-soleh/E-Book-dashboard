<template>
  <div class="tag-filter">
    <button :class="{ active: !modelValue }" @click="$emit('update:modelValue', null)">All</button>
    <button v-for="tag in tags" :key="tag.id" :class="{ active: tag.name === modelValue }" @click="$emit('update:modelValue', tag.name)">
      {{ tag.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Tag } from '../../types';

defineProps<{ tags: Tag[]; modelValue: string | null }>();
</script>

<style scoped>
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

button {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 0.3rem 0.9rem;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

button.active {
  background: linear-gradient(120deg, var(--primary), var(--accent));
  border-color: transparent;
  color: white;
}
</style>
