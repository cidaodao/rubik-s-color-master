
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CubeColor, Statistics, QuizState } from './types';
import { COLOR_MAP, COLOR_DISPLAY_NAMES, OPPOSITES } from './constants';
import { generateQuestion } from './services/cubeLogic';
import { getMnemonicTip } from './services/geminiService';

type QuizStep = 'left' | 'right' | 'done';

const App: React.FC = () => {
  const [enabledColors, setEnabledColors] = useState<CubeColor[]>(Object.values(CubeColor));
  const [fixedTop, setFixedTop] = useState<CubeColor | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizState | null>(null);
  const [stats, setStats] = useState<Statistics>({ total: 0, correct: 0, streak: 0 });
  
  const [selectedLeft, setSelectedLeft] = useState<CubeColor | null>(null);
  const [selectedRight, setSelectedRight] = useState<CubeColor | null>(null);
  
  const [currentStep, setCurrentStep] = useState<QuizStep>('left');
  const [isLeftRevealed, setIsLeftRevealed] = useState(false);
  const [isRightRevealed, setIsRightRevealed] = useState(false);
  
  const [tip, setTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  const startNewQuiz = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const quiz = generateQuestion(enabledColors, fixedTop);
    setCurrentQuiz({
      front: quiz.front,
      top: quiz.top,
      correctLeft: quiz.left,
      correctRight: quiz.right
    });
    setSelectedLeft(null);
    setSelectedRight(null);
    setIsLeftRevealed(false);
    setIsRightRevealed(false);
    setCurrentStep('left');
    setTip(null);
  }, [enabledColors, fixedTop]);

  useEffect(() => {
    startNewQuiz();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [startNewQuiz]);

  const handleToggleColor = (color: CubeColor) => {
    setEnabledColors(prev => {
      if (prev.includes(color)) {
        if (prev.length <= 3) return prev; 
        return prev.filter(c => c !== color);
      }
      return [...prev, color];
    });
  };

  const onSelectLeft = (color: CubeColor) => {
    if (isLeftRevealed) return;
    setSelectedLeft(color);
    setIsLeftRevealed(true);
    
    timerRef.current = window.setTimeout(() => {
      setCurrentStep('right');
    }, 600);
  };

  const onSelectRight = (color: CubeColor) => {
    if (isRightRevealed) return;
    setSelectedRight(color);
    setIsRightRevealed(true);
    
    // Final result calculation
    const isCorrect = selectedLeft === currentQuiz?.correctLeft && color === currentQuiz?.correctRight;
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    // Reveal result briefly, then auto-next
    timerRef.current = window.setTimeout(() => {
      setCurrentStep('done');
      // Auto trigger next after showing the final revealed state for a bit longer
      timerRef.current = window.setTimeout(() => {
        startNewQuiz();
      }, 1200);
    }, 600);
  };

  const fetchTip = async () => {
    if (!currentQuiz) return;
    setLoadingTip(true);
    const result = await getMnemonicTip(
      COLOR_DISPLAY_NAMES[currentQuiz.front],
      COLOR_DISPLAY_NAMES[currentQuiz.top],
      COLOR_DISPLAY_NAMES[currentQuiz.correctLeft],
      COLOR_DISPLAY_NAMES[currentQuiz.correctRight]
    );
    setTip(result || "无建议");
    setLoadingTip(false);
  };

  const isFinalCorrect = currentStep === 'done' && selectedLeft === currentQuiz?.correctLeft && selectedRight === currentQuiz?.correctRight;

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            魔方颜色记忆
          </h1>
        </div>
        
        <div className="flex gap-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700 shadow-lg">
          <StatBox label="总计" value={stats.total} />
          <StatBox label="正确" value={stats.correct} color="text-emerald-400" />
          <StatBox label="连胜" value={stats.streak} color="text-orange-400" />
        </div>
      </header>

      <main className="w-full space-y-6">
        {/* Quiz Area */}
        <section className="w-full">
          {currentQuiz && (
            <div className="bg-slate-800/40 p-5 md:p-8 rounded-3xl border border-slate-700 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col items-center gap-6 relative z-10">
                
                {/* Visual Orientation Display */}
                <div className="flex items-center justify-center gap-6 md:gap-12 perspective-1000">
                   <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">顶面 (Top)</span>
                    <FaceBox color={currentQuiz.top} size="small" />
                   </div>
                   <div className="pt-6">
                      <i className="fas fa-plus text-slate-700 text-xl opacity-30"></i>
                   </div>
                   <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">正面 (Front)</span>
                    <FaceBox color={currentQuiz.front} size="small" isGlowing />
                   </div>
                </div>

                {/* Status Indicator for results */}
                {currentStep === 'done' && (
                  <div className={`w-full py-2 px-4 rounded-xl text-center font-bold animate-in zoom-in duration-200 ${
                    isFinalCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isFinalCorrect ? '✓ 全部正确' : '✗ 存在错误'}
                  </div>
                )}

                {/* Sequential Quiz Logic */}
                <div className="w-full min-h-[380px] flex flex-col items-center justify-center transition-all duration-300">
                  {currentStep === 'left' && (
                    <div className="w-full space-y-5 animate-in slide-in-from-right-4 duration-300">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold inline-flex items-center gap-3 text-blue-400">
                          <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm text-white">1</span>
                          左边是什么颜色？
                        </h3>
                      </div>
                      <ColorGrid 
                        selected={selectedLeft} 
                        onSelect={onSelectLeft} 
                        disabled={isLeftRevealed}
                        correct={isLeftRevealed ? currentQuiz.correctLeft : undefined}
                        isLarge
                      />
                    </div>
                  )}

                  {currentStep === 'right' && (
                    <div className="w-full space-y-5 animate-in slide-in-from-right-4 duration-300">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold inline-flex items-center gap-3 text-blue-400">
                          <span className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm text-white">2</span>
                          右边是什么颜色？
                        </h3>
                      </div>
                      <ColorGrid 
                        selected={selectedRight} 
                        onSelect={onSelectRight} 
                        disabled={isRightRevealed}
                        correct={isRightRevealed ? currentQuiz.correctRight : undefined}
                        isLarge
                      />
                    </div>
                  )}

                  {currentStep === 'done' && (
                    <div className="w-full space-y-6 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-bold uppercase text-center">左侧答案</p>
                          <ColorGrid 
                            selected={selectedLeft} 
                            onSelect={() => {}} 
                            disabled={true} 
                            correct={currentQuiz.correctLeft}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 font-bold uppercase text-center">右侧答案</p>
                          <ColorGrid 
                            selected={selectedRight} 
                            onSelect={() => {}} 
                            disabled={true} 
                            correct={currentQuiz.correctRight}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                         <span className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium">
                            <i className="fas fa-circle-notch fa-spin"></i> 即将进入下一题...
                         </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Action Area */}
                <div className="w-full flex flex-col gap-3 pt-4 border-t border-slate-700/50">
                  <div className="flex gap-3 h-14">
                    {currentStep === 'done' ? (
                      <>
                        <button
                          onClick={startNewQuiz}
                          className="flex-grow bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          立即下一题 <i className="fas fa-forward"></i>
                        </button>
                        <button
                          onClick={fetchTip}
                          disabled={loadingTip || !!tip}
                          className="w-14 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg"
                          title="记忆窍门"
                        >
                          {loadingTip ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lightbulb"></i>}
                        </button>
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse">
                          <i className="fas fa-hand-pointer"></i>
                          点击正确颜色
                        </div>
                        {(isLeftRevealed || isRightRevealed) && <span className="text-emerald-400 text-xs mt-1">揭晓中...</span>}
                      </div>
                    )}
                  </div>

                  {tip && (
                    <div className="w-full p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                      <p className="text-purple-200 italic text-center text-sm">"{tip}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Configuration Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-300 uppercase tracking-widest">
              <i className="fas fa-palette text-blue-400"></i> 颜色池 (可指定)
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-2">
              {Object.values(CubeColor).map(color => (
                <button
                  key={color}
                  onClick={() => handleToggleColor(color)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                    enabledColors.includes(color) 
                      ? 'border-blue-500/50 bg-blue-500/10 text-white' 
                      : 'border-slate-800 bg-slate-950/50 grayscale opacity-40'
                  }`}
                >
                  <div className={`w-3 h-3 rounded shadow-sm ${COLOR_MAP[color]}`}></div>
                  <span className="text-xs font-semibold">{COLOR_DISPLAY_NAMES[color]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-300 uppercase tracking-widest">
              <i className="fas fa-thumbtack text-orange-400"></i> 固定顶面
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setFixedTop(null)}
                className={`p-2 text-[10px] font-bold rounded-lg border transition-all ${
                  fixedTop === null 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                随机
              </button>
              {Object.values(CubeColor).map(color => (
                <button
                  key={color}
                  disabled={!enabledColors.includes(color)}
                  onClick={() => setFixedTop(color)}
                  className={`p-2 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                    !enabledColors.includes(color) ? 'opacity-20 cursor-not-allowed' : ''
                  } ${
                    fixedTop === color 
                      ? 'bg-slate-800 border-blue-500 text-white shadow-md' 
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${COLOR_MAP[color]}`}></div>
                  {COLOR_DISPLAY_NAMES[color]}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Instructional Footer */}
      <footer className="w-full mt-8 p-6 bg-slate-950/20 rounded-2xl border border-slate-800/50 text-slate-500 text-xs text-center">
        标准配色：白对黄，红对橙，蓝对绿。每次选择后都会即时公布正确答案并自动跳转。
      </footer>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="flex flex-col items-center px-2 min-w-[50px]">
    <span className="text-[9px] uppercase text-slate-500 font-bold tracking-tight">{label}</span>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
  </div>
);

const FaceBox: React.FC<{ color: CubeColor; isGlowing?: boolean; size?: 'small' | 'large' }> = ({ color, isGlowing, size = 'large' }) => (
  <div className={`rounded-xl flex flex-col items-center justify-center transition-all duration-500 border-2 border-slate-950 cube-shadow ${COLOR_MAP[color]} ${
    size === 'small' ? 'w-24 h-24 md:w-32 md:h-32' : 'w-28 h-28 md:w-36 md:h-36'
  } ${isGlowing ? 'ring-2 ring-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]' : ''}`}>
    <span className="font-black text-xl md:text-2xl uppercase select-none drop-shadow-sm">
      {COLOR_DISPLAY_NAMES[color]}
    </span>
  </div>
);

const ColorGrid: React.FC<{ 
  selected: CubeColor | null; 
  onSelect: (c: CubeColor) => void;
  disabled?: boolean;
  correct?: CubeColor;
  isLarge?: boolean;
}> = ({ selected, onSelect, disabled, correct, isLarge }) => (
  <div className={`grid grid-cols-3 gap-3 md:gap-5 max-w-2xl mx-auto w-full`}>
    {Object.values(CubeColor).map(color => {
      const isSelected = selected === color;
      const isCorrectValue = correct === color;
      const isIncorrectSelection = isSelected && correct && !isCorrectValue;

      let borderStyle = 'border-slate-800 bg-slate-900/20 hover:bg-slate-800';
      
      if (isSelected) {
        borderStyle = 'border-blue-500/50 ring-2 ring-blue-500/20 bg-blue-500/5';
      }
      
      if (correct !== undefined) {
        if (isCorrectValue) {
          borderStyle = 'border-emerald-500 ring-4 ring-emerald-500/40 opacity-100 bg-emerald-500/10 z-10';
        } else if (isIncorrectSelection) {
          borderStyle = 'border-red-500 ring-4 ring-red-500/40 opacity-100 bg-red-500/10 z-10';
        } else {
          borderStyle = 'border-slate-800 opacity-20 grayscale';
        }
      }

      return (
        <button
          key={color}
          disabled={disabled}
          onClick={() => onSelect(color)}
          className={`relative rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 ${borderStyle} ${
            isLarge ? 'h-32 md:h-44' : 'h-20 md:h-24'
          } ${disabled && !isSelected && !isCorrectValue ? 'cursor-default' : ''}`}
        >
          <div className={`${isLarge ? 'w-10 h-10 md:w-16 md:h-16' : 'w-5 h-5'} rounded-xl shadow-md ${COLOR_MAP[color]}`}></div>
          <span className={`${isLarge ? 'text-lg md:text-xl' : 'text-xs'} font-bold uppercase tracking-wider ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
            {COLOR_DISPLAY_NAMES[color]}
          </span>
          {correct !== undefined && isCorrectValue && (
            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-lg animate-in zoom-in duration-300">
              <i className="fas fa-check"></i>
            </div>
          )}
          {correct !== undefined && isIncorrectSelection && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow-lg animate-in zoom-in duration-300">
              <i className="fas fa-times"></i>
            </div>
          )}
        </button>
      );
    })}
  </div>
);

export default App;
