<script setup lang="ts">

import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

</script>

<template>
  <main>

    <authenticator>
      <template v-slot="{ signOut }">

        Е за съжаление тука още нищо няма!!<br /><br /><br />
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
  </main>
</template>

