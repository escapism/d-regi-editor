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
import { sanitizeDate } from "@/utils/dateHelper";

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

        if (products.length && json.terms?.length) {
          // terms = [{id: number, name: string, taxonomy: string}]
          // product.terms = {category: number[], genre: number[]}
          const termsArray: Array<{ id: number; name: string; taxonomy: string }> = json.terms;

          // ターム情報を taxonomy => (id => name) の形でマッピング
          const termIdNameMap: Record<string, Record<number, string>> = {};
          for (const term of termsArray) {
            if (!termIdNameMap[term.taxonomy]) {
              termIdNameMap[term.taxonomy] = {};
            }
            termIdNameMap[term.taxonomy]![term.id] = term.name;
          }

          products.forEach((product: any) => {
            // category
            if (product.terms && product.terms.category) {
              product.terms.category = (product.terms.category as number[]).map(
                (id: number) =>
                  termIdNameMap["category"] && termIdNameMap["category"][id]
                    ? termIdNameMap["category"][id]
                    : ""
              );
            }
            // genre
            if (product.terms && product.terms.genre) {
              product.terms.genre = (product.terms.genre as number[]).map(
                (id: number) =>
                  termIdNameMap["genre"] && termIdNameMap["genre"][id]
                    ? termIdNameMap["genre"][id]
                    : ""
              );
            }
          });
        }

        const sanitizedData = []

        for (const [index, product] of products.entries()) {
          const sanitizedRow: typeof DEFAULT_ROW = { ...DEFAULT_ROW, key: index };
          for (const key of DEFAULT_ROW_KEYS) {
            if (key === "infiniteStock" || key === "hidden" || key === "r18") {
              (sanitizedRow as any)[key] = product[key] == 1 ? true : false;
            } else if (key === "pubdate") {
              (sanitizedRow as any)[key] = sanitizeDate(product[key] as string);
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
