<template>
  <button class="button-export" @click="exportJSON" :disabled="data.length === 0">
    <i-octicon-download-16 /> JSONエクスポート
  </button>
</template>

<script setup lang="ts">
import { DEFAULT_ROW } from "@/const/default";
import { getDateString } from "@/utils/dateHelper";
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";

const props = defineProps<{
  data: (typeof DEFAULT_ROW)[];
}>();

const exportJSON = () => {
  if (props.data.length === 0) {
    alert("データがありません。");
    return;
  }
  try {
    const data = props.data.map((item, index) => {
      const convertedItem: any = { ...item, sortOrder: index };

      // Boolean型を1か0に変換する処理
      for (const key in convertedItem) {
        if (typeof convertedItem[key] === "boolean") {
          convertedItem[key] = convertedItem[key] ? 1 : 0;
        }
      }
      // idが空ならプロパティごと削除
      const { key, id, ...rest } = convertedItem;
      if (!id) {
        return rest;
      } else {
        return { id, ...rest };
      }
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_backup_${getDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    gtmTrackEvent("export_json");
  } catch (error) {
    console.error(error)
    gtmTrackError("export_json");
    alert("エクスポートに失敗しました。")
  }
};
</script>
