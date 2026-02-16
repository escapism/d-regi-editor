import { DEFAULT_ROW, DEFAULT_ROW_KEYS } from "@/const/default";
import { sanitizeDate } from "@/utils/dateHelper";

export function sanitizeImportedProducts(
  products: any[],
  terms: Array<{ id: number; name: string; taxonomy: string }> = [],
) {
  if (products.length && terms?.length) {
    // terms = [{id: number, name: string, taxonomy: string}]
    // product.terms = {category: number[], genre: number[]}

    // ターム情報を taxonomy => (id => name) の形でマッピング
    const termIdNameMap: Record<string, Record<number, string>> = {};
    for (const term of terms) {
      if (!termIdNameMap[term.taxonomy]) {
        termIdNameMap[term.taxonomy] = {};
      }
      termIdNameMap[term.taxonomy]![term.id] = term.name.trim();
    }

    products.forEach((product: any) => {
      // category
      if (product.terms && product.terms.category) {
        product.terms.category = (product.terms.category as number[]).map(
          (id: number) =>
            termIdNameMap["category"] && termIdNameMap["category"][id]
              ? termIdNameMap["category"][id]
              : "",
        ).filter((item: string) => item !== "");
      }
      // genre
      if (product.terms && product.terms.genre) {
        product.terms.genre = (product.terms.genre as number[]).map(
          (id: number) =>
            termIdNameMap["genre"] && termIdNameMap["genre"][id]
              ? termIdNameMap["genre"][id]
              : "",
        ).filter((item: string) => item !== "");
      }
    });
  }

  const sanitizedData = [];

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

  return sanitizedData;
}

// 入力欄の全選択
export function selectAllText(e: FocusEvent) {
  (e.target as HTMLInputElement).select();
}
