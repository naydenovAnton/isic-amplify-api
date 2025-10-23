<!-- App.vue -->
<script setup lang="ts">

import {Authenticator, useAuthenticator} from '@aws-amplify/ui-vue';
import {toRefs} from 'vue';

import "@aws-amplify/ui-vue/styles.css";

const {authStatus} = toRefs(useAuthenticator());
</script>

<template>
  <!-- Show authenticator on top of everything if not logged in -->

  <div v-if="authStatus === 'unauthenticated'" class="auth-wrap">
    <authenticator></authenticator>
  </div>

  <!-- Once authenticated, show the normal app with navigation and routes -->
  <div v-else-if="authStatus === 'authenticated'">
    <nav>
      <!-- Your navigation links here -->
    </nav>
    <router-view/>
  </div>
</template>