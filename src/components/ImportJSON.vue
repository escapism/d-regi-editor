<template>
  <label class="button-import"
    ><i-octicon-upload-16 /> JSONインポート
    <input type="file" accept=".json,application/json" ref="fileInput" @change="importJSON" />
  </label>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { DEFAULT_ROW, DEFAULT_ROW_KEYS } from "@/const/default";
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";

const fileInput = useTemplateRef("fileInput")

const emit = defineEmits<{
  (e: "import", data: (typeof DEFAULT_ROW)[]): void;
}>();

const importJSON = (event: Event) => {
  try {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (event) => {
        const json = JSON.parse(event.target?.result as string);

        if (!Array.isArray(json)) {
          alert("JSONの形式が不正です。");
          return;
        }

        const sanitizedData = []

        for (const [index, product] of json.entries()) {
          const sanitizedRow: typeof DEFAULT_ROW = { ...DEFAULT_ROW, key: index };
          for (const key of DEFAULT_ROW_KEYS) {
            if (key === "infiniteStock" || key === "hidden" || key === "r18") {
              (sanitizedRow as any)[key] = product[key] == 1 ? true : false;
            } else {
              (sanitizedRow as any)[key] = product[key];
            }
          }
          sanitizedData.push(sanitizedRow);
        }

        sanitizedData.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        emit("import", sanitizedData);
        gtmTrackEvent("import_json");
      };
    }
  } catch (error) {
    console.error(error);
    gtmTrackError("import_json");
    alert("JSONのインポートに失敗しました。");
  } finally {
    (fileInput.value as HTMLInputElement).value = "";
  }
};
</script>
