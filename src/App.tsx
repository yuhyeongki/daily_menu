/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SchoolItem, MealItem } from './types/neis';
import { fetchMeals, SAMPLE_SCHOOLS, getSampleMeals } from './services/neisApi';
import { Header } from './components/Header';
import { SchoolSearchModal } from './components/SchoolSearchModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AllergyModal } from './components/AllergyModal';
import { MealDetailCard } from './components/MealDetailCard';
import { WeeklyMealView } from './components/WeeklyMealView';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunrise,
  Sunset,
  Utensils,
  KeyRound,
  ShieldCheck,
  Building,
  RefreshCw,
  Info
} from 'lucide-react';

export default function App() {
  // 1. NEIS API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('nado_neis_api_key') || '';
  });

  // 2. Selected School State
  const [currentSchool, setCurrentSchool] = useState<SchoolItem | null>(() => {
    try {
      const saved = localStorage.getItem('nado_selected_school');
      return saved ? JSON.parse(saved) : SAMPLE_SCHOOLS[0];
    } catch {
      return SAMPLE_SCHOOLS[0];
    }
  });

  // 3. Favorites State
  const [favorites, setFavorites] = useState<SchoolItem[]>(() => {
    try {
      const saved = localStorage.getItem('nado_favorite_schools');
      return saved ? JSON.parse(saved) : [SAMPLE_SCHOOLS[0], SAMPLE_SCHOOLS[2]];
    } catch {
      return [SAMPLE_SCHOOLS[0], SAMPLE_SCHOOLS[2]];
    }
  });

  // 4. Allergy filter preferences
  const [selectedAllergens, setSelectedAllergens] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('nado_user_allergens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Date & Meal Navigation
  const getTodayString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  };

  const [currentDate, setCurrentDate] = useState<string>(getTodayString);
  const [mealCode, setMealCode] = useState<string>(() => {
    const hour = new Date().getHours();
    if (hour < 8) return '1'; // Breakfast
    if (hour >= 14 && hour < 20) return '3'; // Dinner
    return '2'; // Lunch
  });

  // 6. View Mode: 'daily' vs 'weekly'
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  // 7. Modals
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);

  // 8. Meals data and loading
  const [dailyMeals, setDailyMeals] = useState<MealItem[]>([]);
  const [weeklyMeals, setWeeklyMeals] = useState<MealItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Save selected school to localStorage
  const handleSelectSchool = (school: SchoolItem) => {
    setCurrentSchool(school);
    try {
      localStorage.setItem('nado_selected_school', JSON.stringify(school));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle favorite school
  const handleToggleFavorite = (school: SchoolItem) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.schoolCode === school.schoolCode);
      const updated = exists
        ? prev.filter(f => f.schoolCode !== school.schoolCode)
        : [...prev, school];
      try {
        localStorage.setItem('nado_favorite_schools', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Save API Key
  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      if (key) {
        localStorage.setItem('nado_neis_api_key', key);
      } else {
        localStorage.removeItem('nado_neis_api_key');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle allergen
  const handleToggleAllergen = (id: number) => {
    setSelectedAllergens(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('nado_user_allergens', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleClearAllergens = () => {
    setSelectedAllergens([]);
    try {
      localStorage.removeItem('nado_user_allergens');
    } catch (e) {
      console.error(e);
    }
  };

  // Date manipulation helpers
  const shiftDate = (days: number) => {
    const y = parseInt(currentDate.slice(0, 4), 10);
    const m = parseInt(currentDate.slice(4, 6), 10) - 1;
    const d = parseInt(currentDate.slice(6, 8), 10);
    const newDate = new Date(y, m, d + days);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}${mm}${dd}`);
  };

  // Calculate week start and end (Monday to Friday)
  const getWeekRange = useCallback((targetDateStr: string) => {
    const y = parseInt(targetDateStr.slice(0, 4), 10);
    const m = parseInt(targetDateStr.slice(4, 6), 10) - 1;
    const d = parseInt(targetDateStr.slice(6, 8), 10);
    const current = new Date(y, m, d);
    const day = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diffToMonday));
    const friday = new Date(new Date(monday).setDate(monday.getDate() + 4));

    const formatYMD = (dt: Date) => {
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    return {
      fromDate: formatYMD(monday),
      toDate: formatYMD(friday),
    };
  }, []);

  // Fetch meals for current date and week
  const loadMealData = useCallback(async () => {
    if (!currentSchool) return;

    setIsLoading(true);
    setHasError(false);

    try {
      // 1. Fetch current date meals
      const dayMeals = await fetchMeals(
        currentSchool.officeCode,
        currentSchool.schoolCode,
        { date: currentDate },
        apiKey
      );
      setDailyMeals(dayMeals);

      // 2. Fetch weekly range meals
      const { fromDate, toDate } = getWeekRange(currentDate);
      const weekMeals = await fetchMeals(
        currentSchool.officeCode,
        currentSchool.schoolCode,
        { fromDate, toDate },
        apiKey
      );
      setWeeklyMeals(weekMeals);
    } catch (err) {
      console.error('Failed to load meals:', err);
      setHasError(true);
      // Fallback sample
      setDailyMeals(getSampleMeals(currentDate));
    } finally {
      setIsLoading(false);
    }
  }, [currentSchool, currentDate, apiKey, getWeekRange]);

  useEffect(() => {
    loadMealData();
  }, [loadMealData]);

  // Current active meal for daily view
  const currentMeal = useMemo(() => {
    const match = dailyMeals.find(m => m.mealCode === mealCode);
    if (match) return match;
    // If specific mealCode not found, default to Lunch (2) or first available
    return dailyMeals.find(m => m.mealCode === '2') || dailyMeals[0] || null;
  }, [dailyMeals, mealCode]);

  // Format date display
  const formattedDateTitle = useMemo(() => {
    if (currentDate.length !== 8) {
      return { text: currentDate, isToday: false, raw: currentDate };
    }
    const y = currentDate.slice(0, 4);
    const m = currentDate.slice(4, 6);
    const d = currentDate.slice(6, 8);
    const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const isToday = currentDate === getTodayString();
    return {
      text: `${parseInt(m, 10)}월 ${parseInt(d, 10)}일 ${weekdays[dt.getDay()]}`,
      isToday,
      raw: `${y}-${m}-${d}`,
    };
  }, [currentDate]);

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800 antialiased overflow-x-hidden">
      {/* Adorable Student-friendly Background Image */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-35"
        style={{
          backgroundImage: `url('/src/assets/images/cute_school_meal_bg_1793012476831.jpg')`,
        }}
        aria-hidden="true"
      />

      {/* Gentle pastel gradient overlay to guarantee top-tier text contrast and comfort */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#FFFDF7]/90 via-[#FFF9F2]/75 to-[#FFFDF7]/95" aria-hidden="true" />

      {/* Main Header */}
      <Header
        currentSchool={currentSchool}
        onOpenSchoolSearch={() => setIsSchoolModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenAllergyModal={() => setIsAllergyModalOpen(true)}
        hasCustomKey={!!apiKey}
        activeAllergyCount={selectedAllergens.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* API Key Reminder Banner (Subtle & Friendly) */}
        {!apiKey && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-100/70 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔑</span>
              <div>
                <p className="text-xs sm:text-sm font-bold leading-tight">
                  나이스(NEIS) API 키를 등록하고 전국 모든 학교의 실시간 식단을 조회해 보세요!
                </p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  현재는 공개 샘플 모드로 동작 중입니다. 상단 [나이스 API키 설정]에서 무료 키를 손쉽게 등록할 수 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shrink-0 shadow-2xs"
            >
              키 등록하기
            </button>
          </div>
        )}

        {/* School Info Hero Card */}
        {currentSchool && (
          <div className="p-5 sm:p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-100 via-rose-100 to-orange-100 p-2 flex items-center justify-center border border-amber-200/70 text-amber-900 shrink-0">
                <Building className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-cute text-2xl sm:text-3xl font-bold text-amber-950 leading-tight">
                    {currentSchool.schoolName}
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    {currentSchool.schoolKind}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                    {currentSchool.officeName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>{currentSchool.address}</span>
                  {currentSchool.homepage && (
                    <a
                      href={currentSchool.homepage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      홈페이지 바로가기
                    </a>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Favorites or Switch Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSchoolModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors"
              >
                다른 학교 찾기
              </button>
              <button
                onClick={loadMealData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                title="새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Date Selector Navigation Bar */}
        <div className="p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between flex-wrap gap-2">
          {/* Previous / Next buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 rounded-xl hover:bg-amber-100/60 text-slate-600 transition-colors"
              title="어제 식단"
            >
              <ChevronLeft className="w-5 h-5 text-amber-700" />
            </button>
            <button
              onClick={() => setCurrentDate(getTodayString())}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                formattedDateTitle.isToday
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-100/70 hover:bg-amber-200/70 text-amber-900'
              }`}
            >
              오늘
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 rounded-xl hover:bg-amber-100/60 text-slate-600 transition-colors"
              title="내일 식단"
            >
              <ChevronRight className="w-5 h-5 text-amber-700" />
            </button>
          </div>

          {/* Current Date Display with Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span className="font-cute text-xl sm:text-2xl font-bold text-amber-950">
              {formattedDateTitle.text}
            </span>
            <input
              type="date"
              value={formattedDateTitle.raw}
              onChange={e => {
                if (e.target.value) {
                  setCurrentDate(e.target.value.replace(/-/g, ''));
                }
              }}
              className="w-7 h-7 opacity-0 absolute cursor-pointer"
              title="원하는 날짜 선택"
            />
          </div>

          {/* Meal Time Tabs: 조식 / 중식 / 석식 */}
          {viewMode === 'daily' && (
            <div className="flex items-center p-1 bg-amber-100/60 rounded-xl border border-amber-200/50">
              <button
                onClick={() => setMealCode('1')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mealCode === '1'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <Sunrise className="w-3.5 h-3.5 text-orange-500" />
                <span>조식</span>
              </button>
              <button
                onClick={() => setMealCode('2')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mealCode === '2'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>중식</span>
              </button>
              <button
                onClick={() => setMealCode('3')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mealCode === '3'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <Sunset className="w-3.5 h-3.5 text-purple-500" />
                <span>석식</span>
              </button>
            </div>
          )}
        </div>

        {/* View Content: Daily vs Weekly */}
        {viewMode === 'weekly' ? (
          <WeeklyMealView
            meals={weeklyMeals}
            selectedDate={currentDate}
            onSelectDate={date => {
              setCurrentDate(date);
              setViewMode('daily');
            }}
            selectedAllergens={selectedAllergens}
            isLoading={isLoading}
          />
        ) : (
          <div>
            {isLoading ? (
              <div className="py-20 bg-white/80 backdrop-blur-md rounded-3xl border border-amber-200 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-bounce">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="font-cute text-2xl font-bold text-amber-950">
                  맛있는 급식을 준비하고 있어요!
                </h3>
                <p className="text-xs text-slate-500">나이스 급식 서버에서 실시간 식단을 조회하고 있습니다...</p>
              </div>
            ) : currentMeal ? (
              <MealDetailCard meal={currentMeal} selectedAllergens={selectedAllergens} />
            ) : (
              <div className="py-16 bg-white/90 backdrop-blur-md rounded-3xl border border-amber-200 text-center space-y-4 p-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Utensils className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-cute text-2xl font-bold text-amber-950">
                    선택하신 일자({formattedDateTitle.text})에는 등록된 급식이 없습니다.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    주말, 공휴일, 재량휴업일이거나 해당 학교에서 아직 식단을 전산 등록하지 않은 상태일 수 있습니다.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => shiftDate(1)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    다음 날 식단 확인하기
                  </button>
                  <button
                    onClick={() => setViewMode('weekly')}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold transition-all"
                  >
                    주간 전체 식단 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-12 py-6 border-t border-amber-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-cute text-xl font-bold text-amber-900">나도급식</span>
            <span>·</span>
            <span>교육부 나이스(NEIS) 교육정보 개방포털 실시간 데이터 연동</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>초·중·고 전국 학교 지원</span>
            <span>·</span>
            <span>알레르기 19종 안심 체크</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SchoolSearchModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        onSelectSchool={handleSelectSchool}
        currentSchool={currentSchool}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        apiKey={apiKey}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />

      <AllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => setIsAllergyModalOpen(false)}
        selectedAllergens={selectedAllergens}
        onToggleAllergen={handleToggleAllergen}
        onClearAllergens={handleClearAllergens}
      />
    </div>
  );
}
