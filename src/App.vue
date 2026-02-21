<script setup lang="ts">
import {
  ref,
  useTemplateRef,
  onMounted,
  onUnmounted,
  provide,
  nextTick,
} from "vue";
import Header from "@/components/Header.vue";
import Row from "@/components/Row.vue";
import ContextMenu from "@/components/ContextMenu.vue";
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
const sentinel = useTemplateRef<HTMLDivElement>("sentinel");
const removeMode = ref(false);
const focusedRowIndex = ref(-1);

const visited = localStorage.getItem("visited") ?? "";

document.documentElement.setAttribute("data-theme", theme.value);

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme.value);
  localStorage.setItem("theme", theme.value);
  gtmTrackEvent("change_theme");
};

const dataRows = ref<(typeof DEFAULT_ROW)[]>([]);
let keyCount = 0;

const addRow = (track: boolean | Event) => {
  const length: number = dataRows.value.push({
    ...DEFAULT_ROW,
    terms: { ...DEFAULT_ROW.terms },
    sortOrder: dataRows.value.length,
    key: keyCount++,
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
  dataRows.value.splice(index, 0, {
    ...DEFAULT_ROW,
    terms: { ...DEFAULT_ROW.terms },
    sortOrder: index,
    key: keyCount++,
  });
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
  dataRows.value.splice(index + 1, 0, {
    ...DEFAULT_ROW,
    terms: { ...DEFAULT_ROW.terms },
    sortOrder: index + 1,
    key: keyCount++,
  });
  nextTick(() => {
    (
      document.querySelectorAll(".input-title")?.[index + 1] as
        | HTMLElement
        | undefined
    )?.focus();
  });
  gtmTrackEvent("add_row_below");
};

const copyRow = (index: number) => {
  const copy = {
    ...dataRows.value[index],
    terms: { ...dataRows.value[index]?.terms },
    id: null,
    key: keyCount++,
  };
  dataRows.value.splice(index + 1, 0, copy);
  nextTick(() => {
    (
      document.querySelectorAll(".input-title")?.[index + 1] as
        | HTMLElement
        | undefined
    )?.focus();
  });
  gtmTrackEvent("copy_row");
};

const clearRows = async () => {
  if (await openDialog({
    message: "すべてのアイテムを削除します。よろしいですか？",
    type: "confirm",
  })) {
    dataRows.value = [];
    keyCount = 0;
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

onMounted(() => {
  addRow(false);
  cleanupShortcuts = registerShortcuts();

  if (!visited) {
    openManual();
    localStorage.setItem("visited", "1");
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tableContainer.value?.classList.remove("title-stuck");
        } else {
          tableContainer.value?.classList.add("title-stuck");
        }
      });
    },
    {
      threshold: 0.5,
    },
  );
  observer.observe(table.value?.querySelector(".col-title") as HTMLElement);

  const observer2 = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tableContainer.value?.classList.remove("stuck");
        } else {
          tableContainer.value?.classList.add("stuck");
        }
      });
    }, {
      root: tableContainer.value,
    }
  )
  observer2.observe(sentinel.value as HTMLElement);
});

onUnmounted(() => {
  cleanupShortcuts?.();
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
  keyCount = data.length;
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
    <Header
      v-model:remove-mode="removeMode"
      :data-rows="dataRows"
      :theme="theme"
      :toggle-theme="toggleTheme"
      @import="handleImport"
    />
    <div class="table-container" ref="tableContainer">
      <div class="table-wrap">
        <div class="sentinel" ref="sentinel" aria-hidden="true"></div>
        <table ref="table">
          <thead>
            <tr>
              <th class="col-index"></th>
              <SortableCol
                property="title"
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
  </div>
  <Manual ref="manual" />
  <ContextMenu
    :visible="contextMenu.show"
    :x="contextMenu.x"
    :y="contextMenu.y"
    :index="contextMenu.index"
    @add-above="(index) => onContextMenuAction(() => addRowAbove(index))"
    @add-below="(index) => onContextMenuAction(() => addRowBelow(index))"
    @copy="(index) => onContextMenuAction(() => copyRow(index))"
    @remove="(index) => onContextMenuAction(() => handleRemove(index))"
    @close="closeContextMenu"
  />
  <LightBox ref="lightBox" />
  <CustomDialog ref="dialog" />
</template>
