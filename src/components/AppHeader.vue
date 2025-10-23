<!-- components/AppHeader.vue -->
<template>
  <header class="app-header">
    <div class="header-content">
      <h1>{{ title }}</h1>
      <nav class="navigation">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/cards" class="nav-link">Cards</router-link>
        <router-link to="/partners" class="nav-link">Partners</router-link>
      </nav>
      <button @click="$emit('sign-out')" class="sign-out-btn">Sign Out</button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

defineEmits<{
  'sign-out': []
}>()
</script>

<style scoped>
.app-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.header-content h1 {
  margin: 0;
  color: #333;
}

.navigation {
  display: flex;
  gap: 2rem;
  margin: 0 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
}

.nav-link.router-link-active {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.sign-out-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s ease;
}

.sign-out-btn:hover {
  background: #ff5252;
}
</style>