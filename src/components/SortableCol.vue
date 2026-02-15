<template>
  <th
    class="sortable-col"
    tabindex="0"
    ref="colRef"
    role="button"
    aria-haspopup="true"
    :aria-expanded="menuVisible"
    @click="toggleMenu"
  >
    <span><slot /></span>
    <i-octicon-chevron-down-16 />
    <div
      v-show="menuVisible"
      ref="menuRef"
      class="context-menu sortable-col-menu"
      @click.stop
    >
      <button type="button" class="context-menu-item" @click="sort('desc')">
        降順に並び替え
      </button>
      <button type="button" class="context-menu-item" @click="sort('asc')">
        昇順に並び替え
      </button>
    </div>
  </th>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  inject,
  type Ref,
} from "vue";

const props = defineProps<{
  property: string;
  type?: "string" | "number" | "boolean";
}>();

const emit = defineEmits<{
  (
    e: "sort",
    payload: {
      property: string;
      type: "string" | "number" | "boolean";
      direction: "asc" | "desc";
    },
  ): void;
}>();

const activeSortableMenuKey = inject<Ref<string | null>>("activeSortableMenuKey");
const closeContextMenu = inject<() => void>("closeContextMenu");

const type = computed(() => props.type ?? "string");

const colRef = ref<HTMLTableCellElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);

const menuVisible = computed(
  () => activeSortableMenuKey?.value === props.property,
);

const toggleMenu = (e: MouseEvent) => {
  e.stopPropagation();
  if (!activeSortableMenuKey) return;
  if (activeSortableMenuKey.value === props.property) {
    activeSortableMenuKey.value = null;
  } else {
    closeContextMenu?.();
    activeSortableMenuKey.value = props.property;
  }
};

const sort = (direction: "asc" | "desc") => {
  emit("sort", {
    property: props.property,
    type: type.value,
    direction,
  });
  if (activeSortableMenuKey) activeSortableMenuKey.value = null;
};

const closeMenu = (e: MouseEvent) => {
  if (
    !menuRef.value?.contains(e.target as Node) &&
    !colRef.value?.contains(e.target as Node)
  ) {
    if (activeSortableMenuKey?.value === props.property) {
      activeSortableMenuKey.value = null;
    }
  }
};

onMounted(() => {
  document.addEventListener("click", closeMenu);
});

onUnmounted(() => {
  document.removeEventListener("click", closeMenu);
});
</script>
