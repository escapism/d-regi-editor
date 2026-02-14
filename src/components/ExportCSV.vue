<template>
  <button class="button-export" @click="exportCSV" :disabled="data.length === 0">
    <i-octicon-download-16 /> CSVエクスポート
  </button>
</template>

<script setup lang="ts">
import { DEFAULT_ROW } from "@/const/default";
import { CSV_HEADER } from "@/const/csv";
import { escapeCSV } from "@/utils/csvHelper";
import { getDateString } from "@/utils/dateHelper";
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";

const props = defineProps<{
  data: (typeof DEFAULT_ROW)[];
}>();

const exportCSV = () => {
  if (props.data.length === 0) {
    alert("データがありません。");
    return;
  }
  try {
    let csv = Object.keys(CSV_HEADER).join(",") + "\n";

    const rows = props.data.map((item, index) => {
      item.sortOrder = index

      return Object.values(CSV_HEADER)
        .map((value) => {
          if (value === "category") {
            return escapeCSV(
              (item.terms as { category?: string[] })?.category?.join(",") ??
                "",
            );
          }
          if (value === "genre") {
            return escapeCSV(
              (item.terms as { genre?: string[] })?.genre?.join(",") ?? "",
            );
          }
          const itemValue = item[value as keyof typeof item];
          if (typeof itemValue === "boolean") {
            return itemValue ? 1 : 0;
          }
          if (typeof itemValue === "string") {
            return escapeCSV(itemValue);
          }
          return itemValue;
        })
        .join(",");
    });

    csv += rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product_list_${getDateString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    gtmTrackEvent("export_csv");
  } catch (error) {
    console.error(error);
    gtmTrackError("export_csv");
    alert("エクスポートに失敗しました。");
  }
};
</script>
