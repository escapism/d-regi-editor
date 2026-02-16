<template>
  <label class="button-import"
    ><i-octicon-upload-16 /> JSONインポート
    <input type="file" accept=".json,application/json" ref="fileInput" @change="importJSON" />
  </label>
</template>

<script setup lang="ts">
import { useTemplateRef } from "vue";
import { DEFAULT_ROW } from "@/const/default";
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";
import { sanitizeImportedProducts } from "@/utils/productHelper";

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

        const products = Array.isArray(json) ? json : (json.products ?? []);
        const sanitizedData = sanitizeImportedProducts(products, json.terms);

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
