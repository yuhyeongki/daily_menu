import React from 'react';
import { MealItem, ALLERGEN_DICT } from '../types/neis';
import { Calendar, ChevronRight, AlertTriangle, Sparkles, Utensils } from 'lucide-react';

interface WeeklyMealViewProps {
  meals: MealItem[];
  selectedDate: string; // YYYYMMDD
  onSelectDate: (date: string) => void;
  selectedAllergens: number[];
  isLoading: boolean;
}

export const WeeklyMealView: React.FC<WeeklyMealViewProps> = ({
  meals,
  selectedDate,
  onSelectDate,
  selectedAllergens,
  isLoading,
}) => {
  // Group meals by date
  // A school week typically has dates
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  // Helper to parse YYYYMMDD into readable date and weekday
  const formatCardDate = (dateStr: string) => {
    if (dateStr.length !== 8) return { formatted: dateStr, dayName: '' };
    const y = parseInt(dateStr.slice(0, 4), 10);
    const m = parseInt(dateStr.slice(4, 6), 10) - 1;
    const d = parseInt(dateStr.slice(6, 8), 10);
    const dateObj = new Date(y, m, d);
    return {
      formatted: `${m + 1}월 ${d}일`,
      dayName: weekdays[dateObj.getDay()],
      isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
    };
  };

  // Filter mainly Lunch (중식) for weekly preview, or first meal of each day
  const dailyLunches: { [date: string]: MealItem } = {};
  meals.forEach(m => {
    if (m.mealCode === '2' || !dailyLunches[m.date]) {
      dailyLunches[m.date] = m;
    }
  });

  const sortedDates = Object.keys(dailyLunches).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="font-cute text-2xl font-bold text-amber-950">
            이번 주 급식 식단표 (중식)
          </h3>
        </div>
        <span className="text-xs text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-xl font-medium">
          날짜를 클릭하면 상세 식판으로 이동합니다
        </span>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <p className="text-sm font-medium">주간 식단을 불러오는 중입니다...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="py-12 bg-white/80 rounded-3xl border border-amber-200 text-center space-y-2 p-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Utensils className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">이번 주 등록된 급식 식단이 없습니다.</h4>
          <p className="text-xs text-slate-400">방학 기간이거나 학교에서 식단을 아직 등록하지 않았을 수 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedDates.map(dateKey => {
            const meal = dailyLunches[dateKey];
            const { formatted, dayName, isWeekend } = formatCardDate(dateKey);
            const isSelected = dateKey === selectedDate;
            const hasAllergenWarning = meal.dishes.some(d =>
              d.allergens.some(id => selectedAllergens.includes(id))
            );

            return (
              <div
                key={dateKey}
                onClick={() => onSelectDate(dateKey)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-md'
                    : 'bg-white/90 hover:bg-amber-50/40 border-amber-200/80 hover:border-amber-300 shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isWeekend ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {dayName}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-slate-800">
                          {formatted}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                          {meal.mealName}
                        </span>
                      </div>
                    </div>

                    {hasAllergenWarning && (
                      <span className="p-1 rounded-md bg-rose-100 text-rose-600" title="주의 알레르기 식품 포함">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Dish List Preview */}
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {meal.dishes.map((dish, dIdx) => {
                      const isWarning = dish.allergens.some(id => selectedAllergens.includes(id));
                      return (
                        <li
                          key={dIdx}
                          className={`flex items-center justify-between py-0.5 ${
                            isWarning ? 'text-rose-600 font-bold' : ''
                          }`}
                        >
                          <span className="truncate pr-2">
                            {isWarning && '⚠️ '}
                            {dish.name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Footer with Calories & Action */}
                <div className="mt-4 pt-3 border-t border-amber-100/80 flex items-center justify-between">
                  {meal.calories ? (
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="font-mono tabular-nums">{meal.calories}</span> Kcal
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">칼로리 정보 없음</span>
                  )}

                  <span className="text-xs font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    식판 보기 <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
