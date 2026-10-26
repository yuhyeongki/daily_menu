import React, { useState, useEffect } from 'react';
import { SchoolItem } from '../types/neis';
import { searchSchools, SAMPLE_SCHOOLS } from '../services/neisApi';
import { Search, X, Star, MapPin, Building2, Check, Sparkles, Loader2 } from 'lucide-react';

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool: (school: SchoolItem) => void;
  currentSchool: SchoolItem | null;
  favorites: SchoolItem[];
  onToggleFavorite: (school: SchoolItem) => void;
  apiKey: string;
}

export const SchoolSearchModal: React.FC<SchoolSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectSchool,
  currentSchool,
  favorites,
  onToggleFavorite,
  apiKey,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SchoolItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchSchools(searchTerm, apiKey);
        setResults(data);
        setHasSearched(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, apiKey]);

  if (!isOpen) return null;

  const isFavorite = (schoolCode: string) => {
    return favorites.some(f => f.schoolCode === schoolCode);
  };

  const getKindBadgeClass = (kind: string) => {
    if (kind.includes('초등')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (kind.includes('중학')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (kind.includes('고등')) return 'bg-sky-100 text-sky-800 border-sky-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-800">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-cute text-xl leading-none">
                학교 찾기
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                전국 초·중·고등학교 급식 식단을 검색해 보세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-amber-100/70 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="학교명을 입력하세요 (예: 서울고, 판교고, 대도초)"
              className="w-full pl-10 pr-10 py-3 bg-amber-50/50 border border-amber-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 text-slate-800 placeholder:text-slate-400 transition-all"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 추천:
            </span>
            {SAMPLE_SCHOOLS.map(sample => (
              <button
                key={sample.schoolCode}
                onClick={() => {
                  onSelectSchool(sample);
                  onClose();
                }}
                className="text-xs px-2.5 py-1 rounded-xl bg-amber-100/60 hover:bg-amber-200/80 text-amber-900 border border-amber-200 font-medium whitespace-nowrap transition-colors"
              >
                {sample.schoolName}
              </button>
            ))}
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Favorites section (if not actively searching) */}
          {!searchTerm.trim() && favorites.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  즐겨찾는 학교 ({favorites.length})
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {favorites.map(fav => (
                  <div
                    key={fav.schoolCode}
                    onClick={() => {
                      onSelectSchool(fav);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      currentSchool?.schoolCode === fav.schoolCode
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-amber-50/30 hover:bg-amber-100/40 border-amber-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-200/50 flex items-center justify-center font-cute text-lg text-amber-900">
                        {fav.schoolName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-800">
                            {fav.schoolName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getKindBadgeClass(fav.schoolKind)}`}>
                            {fav.schoolKind}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{fav.officeName}</span>
                          {fav.address && <span>· {fav.address}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleFavorite(fav);
                        }}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-amber-500 hover:bg-white/80"
                        title="즐겨찾기 해제"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                      {currentSchool?.schoolCode === fav.schoolCode && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Loading */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">학교 목록을 찾는 중입니다...</p>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && hasSearched && results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 px-1">
                검색 결과 <span className="text-amber-600 font-bold">{results.length}</span>개
              </p>
              {results.map(school => {
                const fav = isFavorite(school.schoolCode);
                const isSelected = currentSchool?.schoolCode === school.schoolCode;

                return (
                  <div
                    key={school.schoolCode}
                    onClick={() => {
                      onSelectSchool(school);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-100/60 border-amber-300 ring-2 ring-amber-300'
                        : 'bg-white hover:bg-amber-50/50 border-amber-100 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center font-cute text-lg text-amber-900 border border-amber-200/50">
                        {school.schoolName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">
                            {school.schoolName}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium ${getKindBadgeClass(school.schoolKind)}`}>
                            {school.schoolKind}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{school.officeName}</span>
                          {school.address && <span className="truncate max-w-xs">· {school.address}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleFavorite(school);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          fav ? 'text-amber-400 hover:text-amber-500' : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50'
                        }`}
                        title={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <Star className={`w-4 h-4 ${fav ? 'fill-amber-400' : ''}`} />
                      </button>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty search state */}
          {!isLoading && hasSearched && results.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">검색 결과가 없습니다</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                학교명 철자가 맞는지 확인해 주세요. (예: 서울고, 판교고)
              </p>
            </div>
          )}

          {/* Initial state when no search term and no favorites */}
          {!searchTerm.trim() && favorites.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100/60 flex items-center justify-center text-amber-700">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">원하는 학교를 검색해보세요!</h3>
              <p className="text-xs text-slate-400">
                위의 검색창에 학교 이름을 입력하거나 추천 학교를 눌러보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
