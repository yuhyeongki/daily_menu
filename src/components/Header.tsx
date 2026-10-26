import React from 'react';
import { SchoolItem } from '../types/neis';
import { School, KeyRound, ShieldAlert, CalendarDays, UtensilsCrossed } from 'lucide-react';

interface HeaderProps {
  currentSchool: SchoolItem | null;
  onOpenSchoolSearch: () => void;
  onOpenApiKeyModal: () => void;
  onOpenAllergyModal: () => void;
  hasCustomKey: boolean;
  activeAllergyCount: number;
  viewMode: 'daily' | 'weekly';
  setViewMode: (mode: 'daily' | 'weekly') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSchool,
  onOpenSchoolSearch,
  onOpenApiKeyModal,
  onOpenAllergyModal,
  hasCustomKey,
  activeAllergyCount,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-100 to-rose-100 p-1 border border-amber-200/60 shadow-xs flex items-center justify-center overflow-hidden">
            <img
              src="/src/assets/images/cute_meal_mascot_1793012475981.jpg"
              alt="나도급식 마스코트"
              className="w-full h-full object-cover rounded-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-cute text-2xl font-bold tracking-tight text-amber-900 leading-none">
                나도급식
              </span>
              <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                실시간
              </span>
            </div>
            <p className="text-xs text-amber-700/80 font-medium truncate max-w-[140px] sm:max-w-xs">
              {currentSchool ? currentSchool.schoolName : '학교를 선택해주세요'}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation & Quick Actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {/* School Selector Button */}
          <button
            onClick={onOpenSchoolSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="학교 변경하기"
          >
            <School className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">
              {currentSchool ? '학교 변경' : '학교 찾기'}
            </span>
          </button>

          {/* Daily vs Weekly Toggle */}
          <div className="flex items-center p-1 bg-amber-100/60 rounded-xl border border-amber-200/50">
            <button
              onClick={() => setViewMode('daily')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'daily'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>오늘 식단</span>
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'weekly'
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>주간 식단</span>
            </button>
          </div>

          {/* Allergy filter button */}
          <button
            onClick={onOpenAllergyModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeAllergyCount > 0
                ? 'bg-rose-100/80 text-rose-800 border border-rose-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
            title="알레르기 유발 식품 관리"
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline">알레르기</span>
            {activeAllergyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeAllergyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Primary Action (NEIS API Key Setup) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs hover:scale-[1.02] active:scale-[0.98] ${
              hasCustomKey
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600'
                : 'bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white border-amber-400'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">나이스 API키</span>
            <span className="text-[11px] font-normal opacity-90">
              {hasCustomKey ? '등록됨' : '설정'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
