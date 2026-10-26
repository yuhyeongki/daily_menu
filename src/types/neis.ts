export interface SchoolItem {
  officeCode: string; // ATPT_OFCDC_SC_CODE (e.g., B10)
  officeName: string; // ATPT_OFCDC_SC_NM (e.g., 서울특별시교육청)
  schoolCode: string; // SD_SCHUL_CODE (e.g., 7010057)
  schoolName: string; // SCHUL_NM (e.g., 서울고등학교)
  schoolKind: string; // SCHUL_KND_SC_NM (고등학교, 중학교, 초등학교)
  locationName: string; // LCTN_SC_NM (서울특별시)
  founderName: string; // FOND_SC_NM (공립, 사립)
  address: string; // ORG_RDNMA
  zipCode?: string;
  homepage?: string;
  tel?: string;
}

export interface DishItem {
  name: string;
  allergens: number[];
  isHighlighted?: boolean;
}

export interface MealItem {
  mealCode: string; // 1: 조식, 2: 중식, 3: 석식
  mealName: string;
  date: string; // YYYYMMDD
  servings?: string;
  dishRaw: string;
  dishes: DishItem[];
  originRaw?: string;
  origins?: Array<{ item: string; origin: string }>;
  calorieRaw?: string;
  calories?: number;
  nutritionRaw?: string;
  nutritions?: Array<{ name: string; amount: string }>;
}

export const ALLERGEN_DICT: Record<number, { name: string; emoji: string }> = {
  1: { name: '난류(달걀)', emoji: '🥚' },
  2: { name: '우유', emoji: '🥛' },
  3: { name: '메밀', emoji: '🌾' },
  4: { name: '땅콩', emoji: '🥜' },
  5: { name: '대두(콩)', emoji: '🌱' },
  6: { name: '밀', emoji: '🍞' },
  7: { name: '고등어', emoji: '🐟' },
  8: { name: '게', emoji: '🦀' },
  9: { name: '새우', emoji: '🦐' },
  10: { name: '돼지고기', emoji: '🥓' },
  11: { name: '복숭아', emoji: '🍑' },
  12: { name: '토마토', emoji: '🍅' },
  13: { name: '아황산염', emoji: '🧪' },
  14: { name: '호두', emoji: '🌰' },
  15: { name: '닭고기', emoji: '🍗' },
  16: { name: '쇠고기', emoji: '🥩' },
  17: { name: '오징어', emoji: '🦑' },
  18: { name: '조개류(굴/전복/홍합)', emoji: '🦪' },
  19: { name: '잣', emoji: '🌲' },
};
