<script setup lang="ts">
import {
  ref,
  useTemplateRef,
  onMounted,
  onUnmounted,
  provide,
  nextTick,
} from "vue";
import Row from "@/components/Row.vue";
import ContextMenu from "@/components/ContextMenu.vue";
import ExportCSV from "@/components/ExportCSV.vue";
import ImportCSV from "@/components/ImportCSV.vue";
import ExportJSON from "@/components/ExportJSON.vue";
import ImportJSON from "@/components/ImportJSON.vue";
import LightBox from "@/components/LightBox.vue";
import SortableCol from "@/components/SortableCol.vue";
import CustomDialog from "@/components/CustomDialog.vue";
import Manual from "@/components/Manual.vue";
import draggable from "vuedraggable";
import { DEFAULT_ROW } from "@/const/default";
import { useShortcuts } from "@/composables/useShortcuts";
import { gtmTrackEvent } from "@/utils/gtm.ts";

const getTheme = (): "light" | "dark" => {
  if (localStorage.getItem("theme")) {
    return localStorage.getItem("theme") as "light" | "dark";
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

const theme = ref<"light" | "dark">(getTheme()); // default to dark
const table = useTemplateRef<HTMLTableElement>("table");
const tableContainer = useTemplateRef<HTMLDivElement>("tableContainer");
const removeMode = ref(false);
const focusedRowIndex = ref(-1);

document.documentElement.setAttribute("data-theme", theme.value);

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme.value);
  localStorage.setItem("theme", theme.value);
  gtmTrackEvent("change_theme");
};

const dataRows = ref<(typeof DEFAULT_ROW)[]>([]);

const addRow = (track: boolean | Event) => {
  const length: number = dataRows.value.push({
    ...DEFAULT_ROW,
    sortOrder: dataRows.value.length,
  });
  nextTick(() => {
    (
      document.querySelectorAll(".input-title")?.[length - 1] as
        | HTMLElement
        | undefined
    )?.focus();
  });
  if (track) {
    gtmTrackEvent("add_row");
  }
};

const addRowAbove = (index: number) => {
  dataRows.value.splice(index, 0, { ...DEFAULT_ROW, sortOrder: index });
  nextTick(() => {
    (
      document.querySelectorAll(".input-title")?.[index] as
        | HTMLElement
        | undefined
    )?.focus();
  });
  gtmTrackEvent("add_row_above");
};

const addRowBelow = (index: number) => {
  dataRows.value.splice(index + 1, 0, { ...DEFAULT_ROW, sortOrder: index + 1 });
  nextTick(() => {
    (
      document.querySelectorAll(".input-title")?.[index + 1] as
        | HTMLElement
        | undefined
    )?.focus();
  });
  gtmTrackEvent("add_row_below");
};

const clearRows = async () => {
  if (await openDialog({
    message: "すべてのアイテムを削除します。よろしいですか？",
    type: "confirm",
  })) {
    dataRows.value = [];
    addRow(false);
    removeMode.value = false;
    gtmTrackEvent("clear_rows");
  }
};

const handleRemove = (index: number) => {
  dataRows.value.splice(index, 1);
  nextTick(() => {
    const inputs = document.querySelectorAll(".input-title");
    if (inputs[index]) {
      (inputs[index] as HTMLElement).focus();
    } else {
      const previousRowIndex = index - 1;
      if (inputs[previousRowIndex]) {
        (inputs[previousRowIndex] as HTMLElement).focus();
      }
    }
  });
  gtmTrackEvent("remove_row");
};

const { register: registerShortcuts } = useShortcuts(
  table,
  focusedRowIndex,
  dataRows,
  { addRow: () => addRow(true), addRowAbove, handleRemove },
);

let cleanupShortcuts: (() => void) | null = null;
let scrollRafId = 0;

onMounted(() => {
  addRow(false);
  cleanupShortcuts = registerShortcuts();

  const updateScrollX = () => {
    if (tableContainer.value && table.value) {
      table.value.style.setProperty(
        "--scroll-x",
        `${tableContainer.value.scrollLeft}px`,
      );
    }
    scrollRafId = requestAnimationFrame(updateScrollX);
  };

  const remSize = parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          table.value?.classList.remove("title-stuck");
          cancelAnimationFrame(scrollRafId);
        } else {
          table.value?.classList.add("title-stuck");
          scrollRafId = requestAnimationFrame(updateScrollX);
        }
      });
    },
    {
      rootMargin: `0px 0px 0px ${remSize * -2}px`,
    },
  );
  observer.observe(table.value?.querySelector(".col-title") as HTMLElement);
});

onUnmounted(() => {
  cleanupShortcuts?.();
  cancelAnimationFrame(scrollRafId);
});

const previewImage = ref<string>("");
const lightBox = useTemplateRef<HTMLDivElement>("lightBox");
const dialog = useTemplateRef<typeof CustomDialog>("dialog");
const manual = useTemplateRef<typeof Manual>("manual");

  const openDialog = async (opts : object | string) => {
  if (!dialog.value) return false;
  return await dialog.value.show(opts);
}

const openManual = () => {
  (manual.value as any)?.open();
};

provide("openDialog", openDialog);
provide("openManual", openManual);
provide("openLightBox", (image: string) => {
  (lightBox.value as any)?.open(image);
});

const handlePreview = (image: string) => {
  previewImage.value = image;
};

const contextMenu = ref<{ show: boolean; x: number; y: number; index: number }>(
  {
    show: false,
    x: 0,
    y: 0,
    index: 0,
  },
);

/** 開いている SortableCol メニューを1つに制限（property をキーに保持） */
const activeSortableMenuKey = ref<string | null>(null);

const showContextMenu = (event: MouseEvent, index: number) => {
  event.preventDefault();
  activeSortableMenuKey.value = null;
  contextMenu.value = { show: true, x: event.clientX, y: event.clientY, index };
  gtmTrackEvent("context_menu_shown");
};

function closeContextMenu() {
  contextMenu.value.show = false;
}

provide("activeSortableMenuKey", activeSortableMenuKey);
provide("closeContextMenu", closeContextMenu);

const handleImport = (data: (typeof DEFAULT_ROW)[]) => {
  dataRows.value = data;
  removeMode.value = false;
};

const onContextMenuAction = (fn: () => void) => {
  fn();
  closeContextMenu();
  gtmTrackEvent("context_menu_action");
};

const onFocusIn = (index: number) => {
  focusedRowIndex.value = index;
};

const onFocusOut = () => {
  focusedRowIndex.value = -1;
};

type SortPayload = {
  property: string;
  type: "string" | "number" | "boolean";
  direction: "asc" | "desc";
};

const collator = new Intl.Collator("ja", { numeric: true });

const handleSort = (payload: SortPayload) => {
  const { property, type, direction } = payload;
  const sorted = [...dataRows.value].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[property];
    const bVal = (b as Record<string, unknown>)[property];
    if (type === "number") {
      const an = Number(aVal) ?? 0;
      const bn = Number(bVal) ?? 0;
      return direction === "asc" ? an - bn : bn - an;
    } else if (type === "boolean") {
      const an = Boolean(aVal) ?? false;
      const bn = Boolean(bVal) ?? false;
      return direction === "asc" ? (an ? 1 : -1) : (bn ? 1 : -1);
    }
    const as = String(aVal ?? "");
    const bs = String(bVal ?? "");
    return direction === "asc"
      ? collator.compare(as, bs)
      : collator.compare(bs, as);
  });
  dataRows.value = sorted;
  gtmTrackEvent(`sort_${property}_${direction}`);
};
</script>

<template>
  <div class="site">
    <header class="site-header">
      <h1 class="site-title">Dレジエディター</h1>
      <div class="header-controls">
        <label class="switch-remove-mode checkbox-label"
          ><span><i-octicon-trash-24 aria-label="削除モード" /></span>
          <input
            type="checkbox"
            v-model="removeMode"
            @change="gtmTrackEvent('toggle_remove_mode')"
        /></label>
        <ExportCSV :data="dataRows" />
        <ImportCSV @import="handleImport" />
        <button
          class="button-theme"
          @click="toggleTheme"
          aria-label="テーマを切り替え"
        >
          <i-octicon-sun-24 v-if="theme === 'light'" />
          <i-octicon-moon-24 v-else />
        </button>
        <button
          class="button-manual"
          @click="openManual"
          aria-label="操作方法"
        >
          <i-octicon-question-24 />
        </button>
      </div>
    </header>
    <div class="table-container" ref="tableContainer">
      <div class="table-wrap">
        <table ref="table">
          <thead>
            <tr>
              <th class="col-index"></th>
              <SortableCol
                property="title"
                class="col-title"
                @sort="handleSort"
              >
                タイトル
              </SortableCol>
              <SortableCol property="price" type="number" @sort="handleSort">価格</SortableCol>
              <SortableCol property="stock" type="number" @sort="handleSort">在庫</SortableCol>
              <th>在庫無制限</th>
              <th>表示状態</th>
              <SortableCol
                property="pubdate"
                type="string"
                @sort="handleSort"
              >
                発行日
              </SortableCol>
              <SortableCol property="cost" type="number" @sort="handleSort">印刷費</SortableCol>
              <SortableCol property="r18" type="boolean" @sort="handleSort">R18</SortableCol>
              <th>カテゴリー</th>
              <th>ジャンル</th>
              <th>画像</th>
            </tr>
          </thead>
          <draggable
            v-model="dataRows"
            item-key="key"
            handle=".drag-handle"
            tag="tbody"
            :supportPointer="true"
            @update="gtmTrackEvent('rows_sorted')"
          >
            <template #item="{ element, index }">
              <Row
                :index="index"
                :row="element"
                :remove-mode="removeMode"
                @preview="handlePreview"
                @remove="handleRemove"
                @contextmenu="(e) => showContextMenu(e, index)"
                @focusin="onFocusIn"
                @focusout="onFocusOut"
              />
            </template>
          </draggable>
        </table>
      </div>
      <button
        :disabled="removeMode"
        class="add-row"
        @click="addRow"
        aria-label="新規追加"
      >
        <i-octicon-plus-24 />
      </button>
      <button
        :disabled="!removeMode"
        class="clear-rows"
        @click="clearRows"
        aria-label="全削除"
      >
        <i-octicon-trash-24 />
      </button>
    </div>
    <div class="controls">
      <ExportJSON :data="dataRows" />
      <ImportJSON @import="handleImport" />
    </div>
  </div>
  <Manual ref="manual" />
  <ContextMenu
    :visible="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :index="contextMenu.index"
    @add-above="(index) => onContextMenuAction(() => addRowAbove(index))"
    @add-below="(index) => onContextMenuAction(() => addRowBelow(index))"
    @remove="(index) => onContextMenuAction(() => handleRemove(index))"
    @close="closeContextMenu"
  />
  <LightBox ref="lightBox" />
  <CustomDialog ref="dialog" />
</template>
