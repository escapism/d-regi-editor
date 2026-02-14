export const DEFAULT_ROW = {
  key: null as number | null,
  id: null as number | null,
  title: "",
  price: 500,
  stock: 10,
  infiniteStock: false,
  pubdate: "",
  cost: null as number | null,
  totalSalesAmount: 0,
  image: "",
  sortOrder: null as number | null,
  hidden: false,
  r18: false,
  terms: {} as { category?: string[]; genre?: string[] },
};

export const DEFAULT_ROW_KEYS = Object.keys(DEFAULT_ROW)