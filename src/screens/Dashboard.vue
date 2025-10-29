<!-- views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <AppHeader title="Dashboard" @sign-out="handleSignOut" />

    <main class="dashboard-content">
      <p>Е за съжаление тука още нищо няма!!</p>
      <!-- Your dashboard content here -->
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from "@/components/AppHeader.vue";
import { handleSignOut } from '../utils/auth'
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
}

.dashboard-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style>