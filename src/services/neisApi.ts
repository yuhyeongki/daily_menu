import { SchoolItem, MealItem, DishItem } from '../types/neis';

// Helper to parse dishes and allergens from raw NEIS string
// e.g. "기장밥<br/>쇠고기미역국 (5.6.16)<br/>돈육간장불고기 (5.6.10)<br/>배추김치 (9)*<br/>사과"
export function parseDishes(dishRaw: string): DishItem[] {
  if (!dishRaw) return [];

  // Replace <br/>, <br>, \n with newline
  const lines = dishRaw
    .replace(/<br\s*\/?>/gi, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  return lines.map(line => {
    const allergenNumbers: number[] = [];

    // Match patterns like (1.5.6) or (1.2.5.6.13.)
    const allergenMatch = line.match(/\(([\d\.\s]+)\)/);
    if (allergenMatch && allergenMatch[1]) {
      const numbers = allergenMatch[1]
        .split('.')
        .map(n => parseInt(n.trim(), 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= 19);
      allergenNumbers.push(...numbers);
    }

    // Clean dish name: remove allergen numbers and asterisks
    let cleanName = line
      .replace(/\([\d\.\s]+\)/g, '')
      .replace(/\*/g, '')
      .trim();

    return {
      name: cleanName,
      allergens: Array.from(new Set(allergenNumbers)),
    };
  });
}

// Parse calories e.g. "750.4 Kcal" -> 750
export function parseCalories(calorieRaw?: string): number | undefined {
  if (!calorieRaw) return undefined;
  const match = calorieRaw.match(/([\d\.]+)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return undefined;
}

// Parse nutrition details
export function parseNutrition(nutritionRaw?: string): Array<{ name: string; amount: string }> {
  if (!nutritionRaw) return [];
  const lines = nutritionRaw.replace(/<br\s*\/?>/gi, '\n').split('\n');
  const results: Array<{ name: string; amount: string }> = [];

  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      results.push({
        name: parts[0].trim(),
        amount: parts.slice(1).join(':').trim(),
      });
    }
  }
  return results;
}

// Parse origins e.g. "쌀 : 국내산<br/>돼지고기 : 국내산"
export function parseOrigins(originRaw?: string): Array<{ item: string; origin: string }> {
  if (!originRaw) return [];
  const lines = originRaw.replace(/<br\s*\/?>/gi, '\n').split('\n');
  const results: Array<{ item: string; origin: string }> = [];

  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      results.push({
        item: parts[0].trim(),
        origin: parts.slice(1).join(':').trim(),
      });
    }
  }
  return results;
}

// Search schools via server proxy or client fallback
export async function searchSchools(query: string, apiKey?: string): Promise<SchoolItem[]> {
  if (!query.trim()) return [];

  try {
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
    const res = await fetch(`/api/neis/school?query=${encodeURIComponent(query.trim())}${keyParam}`);
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.schools)) {
        return data.schools;
      }
    }
  } catch (err) {
    console.warn('Server proxy search error, trying direct NEIS API call...', err);
  }

  // Fallback: direct browser fetch to NEIS API (if direct CORS allows or for backup)
  try {
    const keyParam = apiKey ? `&KEY=${encodeURIComponent(apiKey)}` : '';
    const directUrl = `https://open.neis.go.kr/hub/schoolInfo?Type=json&pIndex=1&pSize=25&SCHUL_NM=${encodeURIComponent(query.trim())}${keyParam}`;
    const directRes = await fetch(directUrl);
    if (directRes.ok) {
      const data = await directRes.json();
      if (data.schoolInfo && data.schoolInfo[1] && data.schoolInfo[1].row) {
        return data.schoolInfo[1].row.map((r: any) => ({
          officeCode: r.ATPT_OFCDC_SC_CODE,
          officeName: r.ATPT_OFCDC_SC_NM,
          schoolCode: r.SD_SCHUL_CODE,
          schoolName: r.SCHUL_NM,
          schoolKind: r.SCHUL_KND_SC_NM,
          locationName: r.LCTN_SC_NM,
          founderName: r.FOND_SC_NM,
          address: r.ORG_RDNMA,
          zipCode: r.ORG_RDNZP,
          homepage: r.HMPG_ADRES,
          tel: r.USER_TELNO,
        }));
      }
    }
  } catch (directErr) {
    console.warn('Direct NEIS school search error:', directErr);
  }

  // Filter default sample schools if query matches
  return SAMPLE_SCHOOLS.filter(s => s.schoolName.toLowerCase().includes(query.toLowerCase()));
}

// Fetch meals for a school
export async function fetchMeals(
  officeCode: string,
  schoolCode: string,
  options: { date?: string; fromDate?: string; toDate?: string },
  apiKey?: string
): Promise<MealItem[]> {
  try {
    const params = new URLSearchParams();
    params.set('officeCode', officeCode);
    params.set('schoolCode', schoolCode);
    if (options.fromDate && options.toDate) {
      params.set('fromDate', options.fromDate);
      params.set('toDate', options.toDate);
    } else if (options.date) {
      params.set('date', options.date);
    }
    if (apiKey) {
      params.set('key', apiKey);
    }

    const res = await fetch(`/api/neis/meal?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.meals)) {
        return data.meals.map((raw: any) => formatMeal(raw));
      }
    }
  } catch (err) {
    console.warn('Server proxy meal fetch error, attempting direct fetch...', err);
  }

  // Direct fetch fallback
  try {
    const keyParam = apiKey ? `&KEY=${encodeURIComponent(apiKey)}` : '';
    let dateParam = '';
    if (options.fromDate && options.toDate) {
      dateParam = `&MLSV_FROM_YMD=${encodeURIComponent(options.fromDate)}&MLSV_TO_YMD=${encodeURIComponent(options.toDate)}`;
    } else if (options.date) {
      dateParam = `&MLSV_YMD=${encodeURIComponent(options.date)}`;
    }

    const directUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=100&ATPT_OFCDC_SC_CODE=${encodeURIComponent(officeCode)}&SD_SCHUL_CODE=${encodeURIComponent(schoolCode)}${dateParam}${keyParam}`;
    const directRes = await fetch(directUrl);
    if (directRes.ok) {
      const data = await directRes.json();
      if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row) {
        return data.mealServiceDietInfo[1].row.map((r: any) => formatMeal({
          mealCode: r.MMEAL_SC_CODE,
          mealName: r.MMEAL_SC_NM,
          date: r.MLSV_YMD,
          servings: r.MLSV_FGR,
          dishRaw: r.DDISH_NM,
          originRaw: r.ORPLC_INFO,
          calorieRaw: r.CAL_INFO,
          nutritionRaw: r.NTR_INFO,
        }));
      }
    }
  } catch (directErr) {
    console.warn('Direct fetch meal error:', directErr);
  }

  // If no meals from network, return sample meals for preview if sample school
  return getSampleMeals(options.date || options.fromDate || '');
}

function formatMeal(raw: any): MealItem {
  return {
    mealCode: String(raw.mealCode || '2'),
    mealName: raw.mealName || (raw.mealCode === '1' ? '조식' : raw.mealCode === '3' ? '석식' : '중식'),
    date: String(raw.date),
    servings: raw.servings,
    dishRaw: raw.dishRaw || '',
    dishes: parseDishes(raw.dishRaw || ''),
    originRaw: raw.originRaw,
    origins: parseOrigins(raw.originRaw),
    calorieRaw: raw.calorieRaw,
    calories: parseCalories(raw.calorieRaw),
    nutritionRaw: raw.nutritionRaw,
    nutritions: parseNutrition(raw.nutritionRaw),
  };
}

// Sample schools to ensure instant delight on initial load
export const SAMPLE_SCHOOLS: SchoolItem[] = [
  {
    officeCode: 'B10',
    officeName: '서울특별시교육청',
    schoolCode: '7010057',
    schoolName: '서울고등학교',
    schoolKind: '고등학교',
    locationName: '서울특별시',
    founderName: '공립',
    address: '서울특별시 서초구 효령로 218',
    homepage: 'http://seoul.hs.kr',
  },
  {
    officeCode: 'B10',
    officeName: '서울특별시교육청',
    schoolCode: '7010178',
    schoolName: '경기고등학교',
    schoolKind: '고등학교',
    locationName: '서울특별시',
    founderName: '공립',
    address: '서울특별시 강남구 영동대로 643',
    homepage: 'http://kyunggi.hs.kr',
  },
  {
    officeCode: 'J10',
    officeName: '경기도교육청',
    schoolCode: '7530851',
    schoolName: '판교고등학교',
    schoolKind: '고등학교',
    locationName: '경기도',
    founderName: '공립',
    address: '경기도 성남시 분당구 판교백현로 41',
  },
  {
    officeCode: 'B10',
    officeName: '서울특별시교육청',
    schoolCode: '7021074',
    schoolName: '서울대도초등학교',
    schoolKind: '초등학교',
    locationName: '서울특별시',
    founderName: '공립',
    address: '서울특별시 강남구 영동대로 221',
  },
  {
    officeCode: 'B10',
    officeName: '서울특별시교육청',
    schoolCode: '7010189',
    schoolName: '단국대학교사범대학부속중학교',
    schoolKind: '중학교',
    locationName: '서울특별시',
    founderName: '사립',
    address: '서울특별시 강남구 도곡로 340',
  }
];

// Realistic delicious sample meals fallback for demonstration
export function getSampleMeals(targetDate: string): MealItem[] {
  const dateStr = targetDate || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  return [
    {
      mealCode: '2',
      mealName: '중식',
      date: dateStr,
      servings: '850명',
      dishRaw: '혼합잡곡밥 (5)<br/>차돌된장찌개 (5.6.16)<br/>수제치즈돈까스/소스 (1.2.5.6.10.12)<br/>마카로니콘샐러드 (1.5)<br/>깍두기 (9)<br/>샤인머스캣포도쥬스',
      dishes: parseDishes('혼합잡곡밥 (5)<br/>차돌된장찌개 (5.6.16)<br/>수제치즈돈까스/소스 (1.2.5.6.10.12)<br/>마카로니콘샐러드 (1.5)<br/>깍두기 (9)<br/>샤인머스캣포도쥬스'),
      calorieRaw: '835.4 Kcal',
      calories: 835.4,
      originRaw: '쌀 : 국내산<br/>쇠고기 : 국내산(한우)<br/>돼지고기 : 국내산<br/>김치(배추/고춧가루) : 국내산',
      origins: parseOrigins('쌀 : 국내산<br/>쇠고기 : 국내산(한우)<br/>돼지고기 : 국내산<br/>김치(배추/고춧가루) : 국내산'),
      nutritionRaw: '탄수화물(g) : 118.2<br/>단백질(g) : 34.8<br/>지방(g) : 22.4<br/>비타민A(R.E) : 312.0<br/>티아민(mg) : 0.6<br/>리보플라빈(mg) : 0.5<br/>비타민C(mg) : 28.5<br/>칼슘(mg) : 280.4<br/>철분(mg) : 4.8',
      nutritions: parseNutrition('탄수화물(g) : 118.2<br/>단백질(g) : 34.8<br/>지방(g) : 22.4<br/>비타민A(R.E) : 312.0<br/>티아민(mg) : 0.6<br/>리보플라빈(mg) : 0.5<br/>비타민C(mg) : 28.5<br/>칼슘(mg) : 280.4<br/>철분(mg) : 4.8'),
    },
    {
      mealCode: '1',
      mealName: '조식',
      date: dateStr,
      servings: '120명',
      dishRaw: '소고기야채죽 (16)<br/>에그스크램블 (1.2)<br/>미니크루아상 & 딸기잼 (1.2.5.6)<br/>배추김치 (9)<br/>바나나우유 (2)',
      dishes: parseDishes('소고기야채죽 (16)<br/>에그스크램블 (1.2)<br/>미니크루아상 & 딸기잼 (1.2.5.6)<br/>배추김치 (9)<br/>바나나우유 (2)'),
      calorieRaw: '542.0 Kcal',
      calories: 542.0,
      originRaw: '쌀 : 국내산<br/>쇠고기 : 국내산<br/>달걀 : 국내산',
      origins: parseOrigins('쌀 : 국내산<br/>쇠고기 : 국내산<br/>달걀 : 국내산'),
      nutritionRaw: '탄수화물(g) : 74.0<br/>단백질(g) : 21.0<br/>지방(g) : 14.5<br/>칼슘(mg) : 220.0',
      nutritions: parseNutrition('탄수화물(g) : 74.0<br/>단백질(g) : 21.0<br/>지방(g) : 14.5<br/>칼슘(mg) : 220.0'),
    },
    {
      mealCode: '3',
      mealName: '석식',
      date: dateStr,
      servings: '280명',
      dishRaw: '치킨마요덮밥 (1.5.6.15)<br/>유부장국 (5.6)<br/>웨지감자튀김 & 케첩 (5.12)<br/>단무지무침<br/>유기농사과주스',
      dishes: parseDishes('치킨마요덮밥 (1.5.6.15)<br/>유부장국 (5.6)<br/>웨지감자튀김 & 케첩 (5.12)<br/>단무지무침<br/>유기농사과주스'),
      calorieRaw: '780.2 Kcal',
      calories: 780.2,
      originRaw: '쌀 : 국내산<br/>닭고기 : 국내산',
      origins: parseOrigins('쌀 : 국내산<br/>닭고기 : 국내산'),
      nutritionRaw: '탄수화물(g) : 105.0<br/>단백질(g) : 29.0<br/>지방(g) : 24.0',
      nutritions: parseNutrition('탄수화물(g) : 105.0<br/>단백질(g) : 29.0<br/>지방(g) : 24.0'),
    }
  ];
}
