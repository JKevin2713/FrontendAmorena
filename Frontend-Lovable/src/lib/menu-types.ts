export type MenuItem = {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  desc: string;
  descEn?: string;
  img: string;
  cat: string;
  filterIds: string[];
  tags?: Array<{ name: string; nameEn?: string }>;
  stock?: number;
};
