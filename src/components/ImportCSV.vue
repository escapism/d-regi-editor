<template>
  <label class="button-import"
    ><i-octicon-upload-16 /> CSVインポート
    <input type="file" accept="text/csv" @change="importCSV"
  /></label>
</template>

<script setup lang="ts">
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { DEFAULT_ROW } from "@/const/default";
import { CSV_HEADER } from "@/const/csv";
import { gtmTrackEvent, gtmTrackError } from "@/utils/gtm.ts";

const emit = defineEmits<{
  (e: "import", data: (typeof DEFAULT_ROW)[]): void;
}>();

const importCSV = (event: Event) => {
  try {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: ParseResult<any>) => {
          const importData = results.data.map((row: any, index: number) => {
            const convertedRow: any = { terms: {} as { category?: string[]; genre?: string[] } };

            for (const [key, value] of Object.entries(row)) {
              const newKey = CSV_HEADER[key as keyof typeof CSV_HEADER];
              if (newKey === "category" || newKey === "genre") {
                const stringValue = String(value || '');
                convertedRow.terms[newKey] = stringValue
                  .split(",")
                  .map((item: string) => item.trim())
                  .filter((item: string) => item !== "");
              } else if (
                newKey === "infiniteStock" ||
                newKey === "hidden" ||
                newKey === "r18"
              ) {
                convertedRow[newKey] = value == 0 ? false : true;
              } else {
                const stringValue = String(value || '');
                if (isFinite(Number(stringValue)) && stringValue !== '') {
                  convertedRow[newKey] = Number(stringValue);
                } else {
                  convertedRow[newKey] = stringValue.trim();
                }
              }
            }

            return { ...DEFAULT_ROW, ...convertedRow, key: index };
          });
          emit("import", importData);
          gtmTrackEvent("import_csv");
        },
      });
    }
  } catch (error) {
    console.error(error);
    gtmTrackError("import_csv");
    alert("CSVのインポートに失敗しました。");
  }
};
</script>
