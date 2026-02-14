<template>
  <Transition name="lightbox">
  <div v-show="active" class="overlay" @click="close">
    <div class="image-preview">
      <img :src="image" alt="image" />
    </div>
  </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { gtmTrackEvent } from "@/utils/gtm.ts";

const active = ref<boolean>(false);
const image = ref<string>("");

const open = (previewImage: string) => {
  active.value = true;
  image.value = previewImage;
  gtmTrackEvent("lightbox_opened");
}

const close = () => {
  active.value = false;
  gtmTrackEvent("lightbox_closed");
}

defineExpose({
  open
});
</script>