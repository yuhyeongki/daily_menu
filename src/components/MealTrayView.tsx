import React from 'react';
import { MealItem, ALLERGEN_DICT } from '../types/neis';
import { Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MealTrayViewProps {
  meal: MealItem;
  selectedAllergens: number[];
}

export const MealTrayView: React.FC<MealTrayViewProps> = ({
  meal,
  selectedAllergens,
}) => {
  const dishes = meal.dishes;

  // Classify dishes into tray positions heuristically
  // 1. Rice: name contains 밥, 죽, 덮밥, 볶음밥
  // 2. Soup: name contains 국, 탕, 찌개, 수프, 스프, 누룽지
  // 3. Kimchi: name contains 김치, 깍두기, 겉절이, 깍뚜기, 피클, 단무지
  // 4. Dessert/Drink: name contains 우유, 주스, 쥬스, 요거트, 과일, 사과, 바나나, 젤리, 빵, 도넛, 케이크, 푸딩, 음료
  // Remaining items go to Main Dish and Side Dishes

  const riceDish = dishes.find(d => /밥|죽|덮밥|볶음밥|리조또|필라프/i.test(d.name)) || dishes[0];
  const soupDish = dishes.find(d => d !== riceDish && /국|탕|찌개|스프|수프|찌게|누룽지|장국/i.test(d.name)) || (dishes.length > 1 ? dishes[1] : null);
  const kimchiDish = dishes.find(d => d !== riceDish && d !== soupDish && /김치|깍두기|겉절이|깍뚜기|피클|단무지|석박지/i.test(d.name));
  const dessertDish = dishes.find(d => d !== riceDish && d !== soupDish && d !== kimchiDish && /우유|주스|쥬스|요거트|과일|사과|바나나|젤리|빵|도넛|케이크|푸딩|음료|와플|쿠키/i.test(d.name));

  const used = [riceDish, soupDish, kimchiDish, dessertDish].filter(Boolean);
  const remainingDishes = dishes.filter(d => !used.includes(d));

  const mainDish = remainingDishes[0] || (dishes.length > 2 ? dishes[2] : null);
  const sideDish1 = remainingDishes[1] || (dishes.length > 3 ? dishes[3] : null);
  const sideDish2 = remainingDishes[2] || (dishes.length > 4 ? dishes[4] : null);

  const renderCompartment = (
    title: string,
    dish: typeof dishes[0] | null | undefined,
    fallbackEmoji: string,
    colorStyle: string
  ) => {
    if (!dish) {
      return (
        <div className={`p-4 rounded-2xl border border-dashed border-amber-200/80 bg-white/50 flex flex-col items-center justify-center min-h-[110px] text-slate-300 text-xs`}>
          <span className="text-2xl mb-1 opacity-40">{fallbackEmoji}</span>
          <span className="font-cute text-sm">{title}</span>
        </div>
      );
    }

    const hasAllergenWarning = dish.allergens.some(id => selectedAllergens.includes(id));
    const matchedAllergens = dish.allergens.filter(id => selectedAllergens.includes(id));

    return (
      <div
        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative group ${
          hasAllergenWarning
            ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-200 shadow-xs'
            : `${colorStyle} shadow-xs hover:shadow-sm`
        }`}
      >
        {/* Compartment Label */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-500 font-cute text-sm flex items-center gap-1">
            <span>{fallbackEmoji}</span> {title}
          </span>
          {hasAllergenWarning && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" /> 주의
            </span>
          )}
        </div>

        {/* Dish Name */}
        <div className="my-1">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
            {dish.name}
          </h4>
        </div>

        {/* Allergen Info */}
        <div className="pt-2 border-t border-black/5 mt-1">
          {dish.allergens.length > 0 ? (
            <div className="flex items-center gap-1 flex-wrap">
              {dish.allergens.map(aId => {
                const info = ALLERGEN_DICT[aId];
                const isSelected = selectedAllergens.includes(aId);
                return (
                  <span
                    key={aId}
                    title={`${info?.name || '알레르기'} (${aId}번)`}
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium inline-flex items-center gap-0.5 ${
                      isSelected
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-white/90 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span>{info?.emoji}</span>
                    <span>{info?.name.split('(')[0] || aId}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> 알레르기 유발물질 없음
            </span>
          )}

          {matchedAllergens.length > 0 && (
            <p className="text-[11px] font-bold text-rose-700 mt-1.5">
              ⚠️ 주의 식품: {matchedAllergens.map(id => ALLERGEN_DICT[id]?.name).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-b from-amber-50/70 via-rose-50/40 to-amber-50/70 rounded-3xl border-2 border-amber-200/80 shadow-md">
      {/* Tray Title Bar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍱</span>
          <h3 className="font-cute text-2xl font-bold text-amber-950">
            {meal.mealName} 급식 식판
          </h3>
          <span className="text-xs text-amber-800/80 font-medium bg-amber-100/70 px-2 py-0.5 rounded-full">
            총 {dishes.length}가지 메뉴
          </span>
        </div>

        {meal.calories && (
          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-white/90 px-3 py-1.5 rounded-xl border border-rose-200 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-mono tabular-nums text-sm">{meal.calories}</span> Kcal
          </div>
        )}
      </div>

      {/* Tray Grid (Real Korean School Tray Layout) */}
      <div className="space-y-3">
        {/* Top 3 Side Dish Compartments */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {renderCompartment('주찬 (메인 요리)', mainDish, '🍖', 'bg-white border-amber-200/80')}
          {renderCompartment('부찬 1 (반찬)', sideDish1, '🥗', 'bg-white border-emerald-200/80')}
          {renderCompartment('부찬 2 (샐러드/나물)', sideDish2, '🥕', 'bg-white border-sky-200/80')}
        </div>

        {/* Bottom 3 Compartments: Rice, Soup, Kimchi / Dessert */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {renderCompartment('밥 (주식)', riceDish, '🍚', 'bg-white border-amber-300 ring-1 ring-amber-100')}
          {renderCompartment('국 / 찌개', soupDish, '🍲', 'bg-white border-orange-200/80')}
          <div className="grid grid-cols-2 gap-2">
            {renderCompartment('김치 / 절임', kimchiDish, '🥬', 'bg-white border-rose-200/80')}
            {renderCompartment('후식 / 음료', dessertDish, '🥛', 'bg-white border-purple-200/80')}
          </div>
        </div>
      </div>

      {/* Extra dishes that didn't fit into standard 6 compartments */}
      {dishes.length > 6 && (
        <div className="mt-4 pt-3 border-t border-amber-200/60">
          <h5 className="text-xs font-bold text-slate-600 mb-2 font-cute text-sm">
            추가 메뉴 및 후식
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dishes.slice(6).map((dish, idx) => (
              <div key={idx}>
                {renderCompartment(`추가 메뉴 ${idx + 1}`, dish, '✨', 'bg-white border-slate-200')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
