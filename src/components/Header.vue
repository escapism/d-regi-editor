<template>
  <header class="site-header">
    <h1 class="site-title">Dレジエディター</h1>
    <div class="header-controls">
      <ExportJSON :data="dataRows" />
      <ImportJSON @import="onImport" />
    </div>
    <label class="switch-remove-mode checkbox-label">
      <i-octicon-trash-24 aria-label="削除モード" />
      <input
        type="checkbox"
        :checked="removeMode"
        @change="onRemoveModeChange"
      />
    </label>
    <button
      ref="menuBtn"
      class="button-menu"
      aria-label="メニューを開く"
      @click="activeMenu = !activeMenu"
      aria-controls="globalNav"
      :aria-expanded="activeMenu ? 'true' : 'false'"
    >
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path
          d="M1,2.75c0-.41.34-.75.75-.75h12.5c.41,0,.75.34.75.75s-.34.75-.75.75H1.75c-.41,0-.75-.34-.75-.75"
        />
        <path
          d="M1,7.75c0-.41.34-.75.75-.75h12.5c.41,0,.75.34.75.75s-.34.75-.75.75H1.75c-.41,0-.75-.34-.75-.75"
        />
        <path
          d="M1.75,12h12.5c.41,0,.75.34.75.75s-.34.75-.75.75H1.75c-.41,0-.75-.34-.75-.75s.34-.75.75-.75"
        />
      </svg>
    </button>
    <Transition name="fade">
      <nav v-show="activeMenu" class="menu" :inert="!activeMenu">
        <ul class="menu-list">
          <li v-if="existsDRegi">
            <button @click="importFromDRegi">
              <i-octicon-link-24 />
              <span>Dレジからインポート</span>
            </button>
          </li>
          <li><ExportCSV :data="dataRows" /></li>
          <li><ImportCSV @import="onImport" /></li>
          <li>
            <button @click="toggleTheme">
              <i-octicon-sun-24 v-if="theme === 'light'" />
              <i-octicon-moon-24 v-else />
              <span> カラーモード切り替え</span>
            </button>
          </li>
          <li>
            <button @click="openManual">
              <i-octicon-question-24 />
              <span>マニュアル</span>
            </button>
          </li>
        </ul>
        <a href="https://x.com/escapist_uco" class="x-link" target="_blank">
      <svg viewBox="0 0 1200 1227">
        <path
          d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
          fill="currentColor"
        />
      </svg>
      <span>@escapist_uco</span>
    </a>
      </nav>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { onMounted, watch, inject, useTemplateRef, ref } from "vue";
import ExportJSON from "@/components/ExportJSON.vue";
import ImportJSON from "@/components/ImportJSON.vue";
import ExportCSV from "@/components/ExportCSV.vue";
import ImportCSV from "@/components/ImportCSV.vue";
import Dexie from 'dexie';
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";
import { DEFAULT_ROW } from "@/const/default";
import { sanitizeImportedProducts } from "@/utils/productHelper";

type DefaultRow = typeof DEFAULT_ROW;

const activeMenu = ref(false);
const menuBtn = useTemplateRef<HTMLButtonElement>("menuBtn");
const props = defineProps<{
  removeMode: boolean;
  dataRows: DefaultRow[];
  theme: "light" | "dark";
  toggleTheme: () => void;
}>();

const openDialog = inject<(opts?: { message?: string; type?: string } | string) => Promise<boolean>>("openDialog");

const existsDRegi = ref(false);

let db: Dexie | null = null;

watch(activeMenu, async (newVal) => {
  if (newVal) {
    existsDRegi.value = await Dexie.exists('DRegi');
  }
});

watch(existsDRegi, async (newVal) => {
  if (newVal && !db) {
    db = new Dexie('DRegi');
    await db.open();
  }
});

const emit = defineEmits<{
  "update:removeMode": [value: boolean];
  import: [data: DefaultRow[]];
}>();

onMounted(() => {
  const onDocClick = (e: MouseEvent) => {
    if (
      activeMenu.value &&
      !menuBtn.value?.contains(e.target as Node)
    ) 
      closeMenu();
  };
  document.addEventListener("click", onDocClick);
});

const closeMenu = () => {
  activeMenu.value = false;
};

const openManual = inject<() => void>("openManual", () => {});

const onRemoveModeChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  emit("update:removeMode", checked);
  gtmTrackEvent("toggle_remove_mode");
};

const onImport = (data: DefaultRow[]) => {
  emit("import", data);
};

const importFromDRegi = async () => {
  if (!db) return;

  if (await openDialog?.({
    message: "Dレジから頒布物情報をインポートします。よろしいですか？",
    type: "confirm",
  })) {
    try {
      const data = await db?.table('products').orderBy('sortOrder').toArray() ?? [];
      const terms = await db?.table('terms').toArray() ?? [];
      if (data.length > 0) {
        emit("import", sanitizeImportedProducts(data, terms));
      } else {
        await openDialog?.("頒布物情報がありません。");
      }
      gtmTrackEvent("import_dregi");
    } catch (error) {
      console.error(error);
      gtmTrackError("import_dregi");
      alert("Dレジからのインポートに失敗しました。");
    }
  }
};
</script>
