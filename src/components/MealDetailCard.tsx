import React, { useState } from 'react';
import { MealItem, ALLERGEN_DICT } from '../types/neis';
import { MealTrayView } from './MealTrayView';
import {
  Copy,
  Check,
  Flame,
  Wheat,
  Beef,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Heart,
  Smile,
  AlertTriangle
} from 'lucide-react';

interface MealDetailCardProps {
  meal: MealItem;
  selectedAllergens: number[];
}

export const MealDetailCard: React.FC<MealDetailCardProps> = ({
  meal,
  selectedAllergens,
}) => {
  const [displayMode, setDisplayMode] = useState<'tray' | 'list'>('tray');
  const [showNutrition, setShowNutrition] = useState(false);
  const [showOrigin, setShowOrigin] = useState(false);
  const [copied, setCopied] = useState(false);

  // Student reaction counts stored in localStorage
  const reactionStorageKey = `meal_reaction_${meal.date}_${meal.mealCode}`;
  const [reactions, setReactions] = useState<{ [key: string]: number }>(() => {
    try {
      const saved = localStorage.getItem(reactionStorageKey);
      return saved ? JSON.parse(saved) : { yummy: 12, love: 18, fresh: 7, sweet: 15 };
    } catch {
      return { yummy: 12, love: 18, fresh: 7, sweet: 15 };
    }
  });

  const handleReact = (type: string) => {
    setReactions(prev => {
      const updated = { ...prev, [type]: (prev[type] || 0) + 1 };
      try {
        localStorage.setItem(reactionStorageKey, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleCopyMenu = () => {
    const dishNames = meal.dishes.map(d => `- ${d.name}`).join('\n');
    const textToCopy = `[나도급식] ${meal.date} ${meal.mealName} 메뉴\n${dishNames}\n열량: ${meal.calorieRaw || '정보 없음'}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasAnyAllergenWarning = meal.dishes.some(d =>
    d.allergens.some(a => selectedAllergens.includes(a))
  );

  return (
    <div className="space-y-4">
      {/* Top Controls: View mode switcher & Copy menu */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center p-1 bg-amber-100/70 rounded-2xl border border-amber-200/60">
          <button
            onClick={() => setDisplayMode('tray')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              displayMode === 'tray'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>식판 모드</span>
          </button>
          <button
            onClick={() => setDisplayMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              displayMode === 'list'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>리스트 모드</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasAnyAllergenWarning && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>주의 알레르기 식품 감지</span>
            </div>
          )}

          <button
            onClick={handleCopyMenu}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold transition-all hover:scale-[1.02] shadow-2xs"
            title="식단 복사하기"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-600" />
                <span>식단 복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Meal Visual: Tray vs List */}
      {displayMode === 'tray' ? (
        <MealTrayView meal={meal} selectedAllergens={selectedAllergens} />
      ) : (
        <div className="p-5 sm:p-6 bg-white/95 backdrop-blur-xs rounded-3xl border border-amber-200/80 shadow-md space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-amber-100">
            <h3 className="font-cute text-2xl font-bold text-amber-950">
              {meal.mealName} 메뉴 목록
            </h3>
            {meal.calorieRaw && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                🔥 {meal.calorieRaw}
              </span>
            )}
          </div>

          <div className="divide-y divide-amber-100/60">
            {meal.dishes.map((dish, idx) => {
              const isWarning = dish.allergens.some(id => selectedAllergens.includes(id));
              const matchedAllergens = dish.allergens.filter(id => selectedAllergens.includes(id));

              return (
                <div
                  key={idx}
                  className={`py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl transition-colors ${
                    isWarning ? 'bg-rose-50/80 px-3 border border-rose-200' : 'hover:bg-amber-50/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-sm sm:text-base text-slate-800">
                        {dish.name}
                      </span>
                      {isWarning && (
                        <p className="text-xs text-rose-600 font-bold mt-0.5">
                          ⚠️ 내 알레르기 주의: {matchedAllergens.map(id => ALLERGEN_DICT[id]?.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {dish.allergens.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pl-9 sm:pl-0">
                      {dish.allergens.map(aId => {
                        const isSelected = selectedAllergens.includes(aId);
                        const info = ALLERGEN_DICT[aId];
                        return (
                          <span
                            key={aId}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-0.5 ${
                              isSelected
                                ? 'bg-rose-500 text-white font-bold'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <span>{info?.emoji}</span>
                            <span>{info?.name.split('(')[0] || aId}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Student Reactions */}
      <div className="p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-200/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-700">오늘의 급식 반응</span>
          <span className="text-[11px] text-slate-400">클릭해서 투표해 보세요!</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleReact('yummy')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-transform active:scale-90"
          >
            <span>😋 꿀맛이야</span>
            <span className="font-mono font-bold text-amber-600 tabular-nums">
              {reactions.yummy}
            </span>
          </button>
          <button
            onClick={() => handleReact('love')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-semibold transition-transform active:scale-90"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>최고의 식단</span>
            <span className="font-mono font-bold text-rose-600 tabular-nums">
              {reactions.love}
            </span>
          </button>
          <button
            onClick={() => handleReact('fresh')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-transform active:scale-90"
          >
            <span>🥗 건강 가득</span>
            <span className="font-mono font-bold text-emerald-600 tabular-nums">
              {reactions.fresh}
            </span>
          </button>
          <button
            onClick={() => handleReact('sweet')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold transition-transform active:scale-90"
          >
            <span>🍰 디저트 대만족</span>
            <span className="font-mono font-bold text-purple-600 tabular-nums">
              {reactions.sweet}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Nutrition & Origin Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nutrition Card */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-200/70 p-4 shadow-2xs">
          <div
            onClick={() => setShowNutrition(!showNutrition)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 font-cute text-sm">
                  영양 성분 정보
                </h4>
                <p className="text-[11px] text-slate-400">
                  {meal.calorieRaw || '칼로리 정보 제공'}
                </p>
              </div>
            </div>
            <button className="text-slate-400 group-hover:text-slate-600 p-1">
              {showNutrition ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showNutrition && (
            <div className="mt-3 pt-3 border-t border-amber-100 space-y-2 animate-in fade-in duration-200">
              {meal.nutritions && meal.nutritions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {meal.nutritions.map((nut, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-amber-50/50 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">{nut.name}</span>
                      <span className="font-bold text-slate-800 font-mono tabular-nums">{nut.amount}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">상세 영양 정보가 등록되어 있지 않습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* Origin Card */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-amber-200/70 p-4 shadow-2xs">
          <div
            onClick={() => setShowOrigin(!showOrigin)}
            className="flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Beef className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 font-cute text-sm">
                  식재료 원산지 정보
                </h4>
                <p className="text-[11px] text-slate-400">
                  국내산 농축수산물 검증
                </p>
              </div>
            </div>
            <button className="text-slate-400 group-hover:text-slate-600 p-1">
              {showOrigin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showOrigin && (
            <div className="mt-3 pt-3 border-t border-amber-100 space-y-2 animate-in fade-in duration-200">
              {meal.origins && meal.origins.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {meal.origins.map((orig, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-emerald-50/40 flex items-center justify-between">
                      <span className="font-medium text-slate-700">{orig.item}</span>
                      <span className="font-bold text-emerald-800">{orig.origin}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">원산지 정보가 등록되어 있지 않습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
