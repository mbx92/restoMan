<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <PinLock />
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: { 'data-theme': 'restoman' },
})
</script>
