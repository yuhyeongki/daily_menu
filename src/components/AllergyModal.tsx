import React from 'react';
import { ALLERGEN_DICT } from '../types/neis';
import { ShieldAlert, X, Check, RotateCcw } from 'lucide-react';

interface AllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAllergens: number[];
  onToggleAllergen: (allergenId: number) => void;
  onClearAllergens: () => void;
}

export const AllergyModal: React.FC<AllergyModalProps> = ({
  isOpen,
  onClose,
  selectedAllergens,
  onToggleAllergen,
  onClearAllergens,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-cute text-xl leading-none">
                내 알레르기 식품 설정
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                주의해야 할 식품을 선택하면 식단표에서 강조 표시해 드려요
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              선택된 알레르기 식품 ({selectedAllergens.length}개)
            </span>
            {selectedAllergens.length > 0 && (
              <button
                onClick={onClearAllergens}
                className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                모두 해제
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Object.entries(ALLERGEN_DICT).map(([idStr, info]) => {
              const id = parseInt(idStr, 10);
              const isSelected = selectedAllergens.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => onToggleAllergen(id)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-950 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{info.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs">{info.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">번호: {id}</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-rose-500 text-white' : 'border border-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
            💡 <strong>나이스 표준 알레르기 유발 물질</strong> 19종이 등록되어 있습니다. 해당 식재료가 포함된 급식 메뉴 옆에 귀여운 경고 뱃지가 부착됩니다.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            확인 완료
          </button>
        </div>
      </div>
    </div>
  );
};
