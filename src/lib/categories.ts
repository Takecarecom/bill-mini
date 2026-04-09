export type CategoryType = 'income' | 'expense';

export interface Category {
  key: string;
  label: string;
  type: CategoryType;
  icon: string; // lucide icon name
  color: string; // tailwind color
}

export const expenseCategories: Category[] = [
  { key: 'food', label: 'อาหารและเครื่องดื่ม', type: 'expense', icon: 'UtensilsCrossed', color: 'orange' },
  { key: 'transport', label: 'เดินทาง', type: 'expense', icon: 'Car', color: 'blue' },
  { key: 'utilities', label: 'ค่าน้ำ/ค่าไฟ/เน็ต', type: 'expense', icon: 'Zap', color: 'yellow' },
  { key: 'shopping', label: 'ช้อปปิ้ง', type: 'expense', icon: 'ShoppingBag', color: 'pink' },
  { key: 'health', label: 'สุขภาพ/ยา', type: 'expense', icon: 'Heart', color: 'red' },
  { key: 'entertainment', label: 'บันเทิง', type: 'expense', icon: 'Gamepad2', color: 'purple' },
  { key: 'education', label: 'การศึกษา', type: 'expense', icon: 'GraduationCap', color: 'indigo' },
  { key: 'housing', label: 'ที่อยู่อาศัย/ค่าเช่า', type: 'expense', icon: 'Home', color: 'teal' },
  { key: 'other_expense', label: 'อื่นๆ', type: 'expense', icon: 'MoreHorizontal', color: 'gray' },
];

export const incomeCategories: Category[] = [
  { key: 'salary', label: 'เงินเดือน', type: 'income', icon: 'Banknote', color: 'green' },
  { key: 'freelance', label: 'ฟรีแลนซ์', type: 'income', icon: 'Laptop', color: 'cyan' },
  { key: 'business', label: 'ธุรกิจ', type: 'income', icon: 'Briefcase', color: 'blue' },
  { key: 'investment', label: 'การลงทุน', type: 'income', icon: 'TrendingUp', color: 'emerald' },
  { key: 'gift', label: 'ของขวัญ/เงินให้', type: 'income', icon: 'Gift', color: 'pink' },
  { key: 'other_income', label: 'อื่นๆ', type: 'income', icon: 'MoreHorizontal', color: 'gray' },
];

export const allCategories = [...expenseCategories, ...incomeCategories];

export function getCategoryByKey(key: string): Category | undefined {
  return allCategories.find(c => c.key === key);
}

export function getCategoriesByType(type: CategoryType): Category[] {
  return type === 'income' ? incomeCategories : expenseCategories;
}
