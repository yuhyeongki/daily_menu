import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, ExternalLink, X, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    const trimmed = keyInput.trim();
    if (!trimmed) {
      onSaveKey('');
      setStatusMessage('인증키가 해제되었습니다. (기본 모드)');
      setTestStatus('idle');
      setTimeout(onClose, 800);
      return;
    }

    setTestStatus('testing');
    setStatusMessage('나이스(NEIS) 서버에 인증키를 검증하는 중입니다...');

    try {
      // Test key via school search proxy
      const testRes = await fetch(`/api/neis/school?query=${encodeURIComponent('서울고')}&key=${encodeURIComponent(trimmed)}`);
      const data = await testRes.json();

      if (data.success) {
        setTestStatus('valid');
        setStatusMessage('인증키 검증 성공! 정상적으로 등록되었습니다.');
        onSaveKey(trimmed);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setTestStatus('invalid');
        setStatusMessage(data.error || '유효하지 않은 인증키입니다. 키를 다시 확인해주세요.');
      }
    } catch (err: any) {
      // Even if network fails, allow saving the key
      setTestStatus('valid');
      setStatusMessage('인증키가 저장되었습니다.');
      onSaveKey(trimmed);
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
    setTestStatus('idle');
    setStatusMessage('인증키가 초기화되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-800">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-cute text-xl leading-none">
                나이스(NEIS) Open API 키 설정
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                직접 발급받은 인증키를 등록하여 실시간 식단을 조회하세요
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

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Key input group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              나이스 인증키 (API KEY)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => {
                  setKeyInput(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="예: 32자리 영문/숫자 인증키를 붙여넣으세요"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showKey ? '가리기' : '보기'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              * 입력하신 API 키는 브라우저 로컬 저장소에 안전하게 보관됩니다.
            </p>
          </div>

          {/* Test Status feedback */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                testStatus === 'valid'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : testStatus === 'invalid'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {testStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {testStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Guide Card */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center justify-between">
              <span>💡 나이스 Open API 키 발급 방법</span>
              <a
                href="https://open.neis.go.kr"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 underline font-medium"
              >
                나이스 포털 바로가기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>나이스 교육정보 개방포털(open.neis.go.kr) 회원가입 및 로그인</li>
              <li>상단 메뉴의 [인증키 발급 및 관리] 클릭</li>
              <li>신청서 작성 후 발급받은 인증키를 복사하여 위 입력창에 등록</li>
            </ol>
            <p className="text-[11px] text-amber-800/80 pt-1">
              ※ 키가 없어도 기본 샘플 및 공개 조회 모드로 자유롭게 둘러보실 수 있습니다.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors"
            >
              키 초기화
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-transparent hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleTestAndSave}
                disabled={testStatus === 'testing'}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {testStatus === 'testing' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>검증 및 저장</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
