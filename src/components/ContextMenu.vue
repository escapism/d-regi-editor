<template>
  <Teleport to="body">
    <div
      v-show="visible"
      ref="menuRef"
      class="context-menu"
      :style="style"
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
        class="context-menu-item"
        @click="emit('copy', index)"
      >
        行を複製
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
import { ref, onMounted, watch, onBeforeUnmount, computed } from "vue";

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  index: number;
}>();

const emit = defineEmits<{
  (e: "add-above", index: number): void;
  (e: "add-below", index: number): void;
  (e: "remove", index: number): void;
  (e: "copy", index: number): void;
  (e: "close"): void;
}>();

const menuRef = ref<HTMLDivElement | null>(null);

// 開いた直後の一瞬だけデフォルトの contextmenu を抑止（はみ出し補正時のレイアウト変化で
// ブラウザが2回目を発火することがあるため）。表示中ずっとはブロックしない。
const PREVENT_DEFAULT_MS = 200;
const preventContextMenu = (e: Event) => e.preventDefault();
let preventTimeoutId: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      document.addEventListener("contextmenu", preventContextMenu, true);
      preventTimeoutId = setTimeout(() => {
        document.removeEventListener("contextmenu", preventContextMenu, true);
        preventTimeoutId = null;
      }, PREVENT_DEFAULT_MS);
    } else {
      if (preventTimeoutId !== null) {
        clearTimeout(preventTimeoutId);
        preventTimeoutId = null;
      }
      document.removeEventListener("contextmenu", preventContextMenu, true);
    }
  }
);

onBeforeUnmount(() => {
  if (preventTimeoutId !== null) clearTimeout(preventTimeoutId);
  document.removeEventListener("contextmenu", preventContextMenu, true);
});

onMounted(() => {
  const onDocClick = (e: MouseEvent) => {
    if (!menuRef.value) return;
    if (menuRef.value.contains(e.target as Node)) return;
    emit("close");
  };
  document.addEventListener("click", onDocClick);
});

const style = computed(() => {
  let x = props.x;
  let y = props.y;
  const el = menuRef.value;
  if (el) {
    el.style.setProperty("display", "block");
    if (x + el.offsetWidth > document.body.clientWidth) {
      x = document.body.clientWidth - el.offsetWidth - 8;
    }
    if (y + el.offsetHeight > document.body.clientHeight) {
      y = document.body.clientHeight - el.offsetHeight - 8;
    }
    el.style.removeProperty("display");
  }
  return {
    left: x + "px",
    top: y + "px",
  };
});
</script>
