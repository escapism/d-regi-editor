import type { Ref } from "vue";
import { isMac } from "@/utils/ChekingHelper";

export type DefaultRow = {
  key: number | null;
  id: number | null;
  title: string;
  price: number;
  stock: number;
  infiniteStock: boolean;
  pubdate: string;
  cost: number | null;
  totalSalesAmount: number;
  image: string;
  sortOrder: number | null;
  hidden: boolean;
  r18: boolean;
  terms: { category?: string[]; genre?: string[] };
};

const INPUT_SELECTOR =
  "input:not([disabled],[readonly],[type=file]),button:not([disabled])";

/** Mac では Meta（Command）、Windows では Ctrl を修飾キーとして使用 */
function isShortcutModifier(event: KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

export function useShortcuts(
  table: Ref<HTMLTableElement | null>,
  focusedRowIndex: Ref<number>,
  dataRows: Ref<DefaultRow[]>,
  handlers: {
    addRow: () => void;
    addRowAbove: (index: number) => void;
    handleRemove: (index: number) => void;
  },
) {
  const setupTableEnterKey = () => {
    const el = table.value;
    if (!el) return () => {};

    const onKeydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.key !== "Enter") return;

      const inputs = Array.from(
        el.querySelectorAll("input:not([disabled],[readonly],[type=file])") ?? [],
      );
      const index = inputs.indexOf(document.activeElement as HTMLInputElement);
      if (index === -1) return;

      const target = inputs[(index + 1) % inputs.length] as HTMLInputElement;
      if (target) target.focus();
    };

    el.addEventListener("keydown", onKeydown);
    return () => el.removeEventListener("keydown", onKeydown);
  };

  const setupDocumentShortcuts = () => {
    const onKeydown = (event: KeyboardEvent) => {
      // 新規追加 (Mac: Cmd+;/+ / Windows: Ctrl+;/+)
      if (isShortcutModifier(event) && (event.key === ";" || event.key === "+")) {
        event.preventDefault();
        event.stopPropagation();
        if (focusedRowIndex.value !== -1) {
          handlers.addRowAbove(focusedRowIndex.value + 1);
        } else {
          handlers.addRow();
        }
        return;
      }

      // 削除 (Mac: Cmd+- / Windows: Ctrl+-)
      if (isShortcutModifier(event) && event.key === "-") {
        event.preventDefault();
        event.stopPropagation();
        if (focusedRowIndex.value !== -1) {
          handlers.handleRemove(focusedRowIndex.value);
        }
        return;
      }

      // 修飾キー+カーソルキーでセルフォーカス移動（Mac: Cmd / Windows: Ctrl）
      if (
        isShortcutModifier(event) &&
        (event.key === "ArrowUp" ||
          event.key === "ArrowDown" ||
          event.key === "ArrowLeft" ||
          event.key === "ArrowRight")
      ) {
        event.preventDefault();

        if (focusedRowIndex.value === -1) return;

        const rows = document.querySelectorAll("tbody > tr");
        const focusedRow = rows[focusedRowIndex.value];
        const inputs = Array.from(
          focusedRow?.querySelectorAll(INPUT_SELECTOR) ?? [],
        );
        const index = inputs.indexOf(
          document.activeElement as HTMLInputElement,
        );
        if (index === -1) return;

        const rowCount = dataRows.value.length;

        if (event.key === "ArrowDown") {
          const nextRowIndex = (focusedRowIndex.value + 1) % rowCount;
          const nextRow = rows[nextRowIndex];
          if (nextRow) {
            const nextInputs = Array.from(
              nextRow.querySelectorAll(INPUT_SELECTOR),
            );
            if (nextInputs.length > 0) {
              (nextInputs[index] as HTMLElement).focus();
            }
          }
        } else if (event.key === "ArrowUp") {
          const prevRowIndex =
            (focusedRowIndex.value - 1 + rowCount) % rowCount;
          const prevRow = rows[prevRowIndex];
          if (prevRow) {
            const prevInputs = Array.from(
              prevRow.querySelectorAll(INPUT_SELECTOR),
            );
            if (prevInputs.length > 0) {
              (prevInputs[index] as HTMLElement).focus();
            }
          }
        } else if (event.key === "ArrowLeft") {
          const prevIndex = index - 1;
          if (prevIndex >= 0) {
            (inputs[prevIndex] as HTMLElement).focus();
          } else {
            const prevRowIndex =
              (focusedRowIndex.value - 1 + rowCount) % rowCount;
            const prevRow = rows[prevRowIndex];
            if (prevRow) {
              const prevInputs = Array.from(
                prevRow.querySelectorAll(INPUT_SELECTOR),
              );
              if (prevInputs.length > 0) {
                (prevInputs[prevInputs.length - 1] as HTMLElement).focus();
              }
            }
          }
        } else if (event.key === "ArrowRight") {
          const nextIndex = index + 1;
          if (nextIndex < inputs.length) {
            (inputs[nextIndex] as HTMLElement).focus();
          } else {
            const nextRowIndex = (focusedRowIndex.value + 1) % rowCount;
            const nextRow = rows[nextRowIndex];
            if (nextRow) {
              const nextInputs = Array.from(
                nextRow.querySelectorAll(INPUT_SELECTOR),
              );
              if (nextInputs.length > 0) {
                (nextInputs[0] as HTMLElement).focus();
              }
            }
          }
        }
      }
    };

    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  };

  const register = () => {
    const cleanupTable = setupTableEnterKey();
    const cleanupDoc = setupDocumentShortcuts();
    return () => {
      cleanupTable();
      cleanupDoc();
    };
  };

  return { register };
}
