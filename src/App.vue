<template>
  <v-app>
    <v-main>
      <TFModels/>
    </v-main>
  </v-app>
</template>

<script>
import TFModels from './components/TFModels.vue';

export default {
  name: 'App',

  components: {
    TFModels,
  },

  data: () => ({
    //
  }),
};
</script>

<style>
.v-btn--disabled {
  pointer-events: unset !important;
  cursor: default;
}
.container {
  max-width: 1400px;
}
</style>