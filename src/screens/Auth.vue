
<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
    </header>

    <main class="dashboard-content">
      <p>Е за съжаление тука още нищо няма!!</p>
      <!-- Your dashboard content here -->
    </main>
  </div>
</template>


<script setup lang="ts">
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-vue'
import '@aws-amplify/ui-vue/styles.css'
import { useRouter } from 'vue-router'
import { watch, ref, onMounted } from 'vue'

const router = useRouter()

// Safe way to use useAuthenticator
const authState = useAuthenticator()
const authStatus = ref(authState.authStatus)
const user = ref(authState.user)

// Watch for changes safely
watch(
    () => authState.authStatus,
    (newStatus) => {
      console.log('Auth status changed:', newStatus)
      if (newStatus === 'authenticated' && authState.user) {
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }
    }
)

// Also watch user changes
watch(
    () => authState.user,
    (newUser) => {
      console.log('User changed:', newUser)
      if (authState.authStatus === 'authenticated' && newUser) {
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }
    }
)

// Check on mount
onMounted(() => {
  if (authState.authStatus === 'authenticated' && authState.user) {
    router.push('/dashboard')
  }
})
</script>