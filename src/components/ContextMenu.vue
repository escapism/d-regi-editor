<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click.stop
    >
      <button
        type="button"
        class="context-menu-item"
        @click="emit('add-above', index)"
      >
        行を上に追加
      </button>
      <button
        type="button"
        class="context-menu-item"
        @click="emit('add-below', index)"
      >
        行を下に追加
      </button>
      <button
        type="button"
        class="context-menu-item context-menu-item-danger"
        @click="emit('remove', index)"
      >
        行の削除
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

defineProps<{
  visible: boolean;
  x: number;
  y: number;
  index: number;
}>();

const emit = defineEmits<{
  (e: "add-above", index: number): void;
  (e: "add-below", index: number): void;
  (e: "remove", index: number): void;
  (e: "close"): void;
}>();

const menuRef = ref<HTMLDivElement | null>(null);

onMounted(() => {
  const onDocClick = (e: MouseEvent) => {
    if (!menuRef.value) return;
    if (menuRef.value.contains(e.target as Node)) return;
    emit("close");
  };
  document.addEventListener("click", onDocClick);
});
</script>
