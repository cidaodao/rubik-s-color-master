
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CubeColor, Statistics, QuizState } from './types';
import { COLOR_MAP, COLOR_DISPLAY_NAMES, OPPOSITES } from './constants';
import { generateQuestion } from './services/cubeLogic';
import { getMnemonicTip } from './services/geminiService';

type QuizStep = 'left' | 'right' | 'done';

const App: React.FC = () => {
  const [enabledColors, setEnabledColors] = useState<CubeColor[]>(Object.values(CubeColor));
  const [fixedTop, setFixedTop] = useState<CubeColor | null>(CubeColor.YELLOW);
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
    
    // Auto move to next part of the question
    timerRef.current = window.setTimeout(() => {
      setCurrentStep('right');
    }, 800);
  };

  const onSelectRight = (color: CubeColor) => {
    if (isRightRevealed) return;
    setSelectedRight(color);
    setIsRightRevealed(true);
    
    // Result logic
    const isCorrect = selectedLeft === currentQuiz?.correctLeft && color === currentQuiz?.correctRight;
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    // Auto trigger next full question
    timerRef.current = window.setTimeout(() => {
      setCurrentStep('done');
      timerRef.current = window.setTimeout(() => {
        startNewQuiz();
      }, 1500);
    }, 800);
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-5xl mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-yellow-400">
            魔方配色训练
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium tracking-wide">Rubik's Color Training</p>
        </div>
        
        <div className="flex gap-4 bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-xl">
          <StatBox label="总计" value={stats.total} />
          <StatBox label="正确" value={stats.correct} color="text-emerald-400" />
          <StatBox label="连胜" value={stats.streak} color="text-yellow-400" />
        </div>
      </header>

      <main className="w-full space-y-8">
        {/* Main Quiz Interaction */}
        <section className="w-full">
          {currentQuiz && (
            <div className="bg-slate-900/60 p-6 md:p-10 rounded-[2.5rem] border border-slate-800 relative overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col items-center gap-8 relative z-10">
                
                {/* Visual Cube Representation */}
                <div className="flex items-center justify-center gap-8 md:gap-16">
                   <div className="flex flex-col items-center group">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-3 font-bold group-hover:text-yellow-400 transition-colors">顶面 TOP</span>
                    <FaceBox color={currentQuiz.top} size="small" />
                   </div>
                   <div className="pt-8 opacity-20">
                      <div className="w-px h-16 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
                   </div>
                   <div className="flex flex-col items-center group">
                    <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-3 font-bold group-hover:text-blue-400 transition-colors">正面 FRONT</span>
                    <FaceBox color={currentQuiz.front} size="small" isGlowing />
                   </div>
                </div>

                {/* Question Section - Switches Content based on Step */}
                <div className="w-full min-h-[420px] flex flex-col items-center justify-center">
                  {currentStep === 'left' && (
                    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <div className="text-center">
                        <h3 className="text-3xl font-black text-white inline-flex items-center gap-4">
                          <span className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">1</span>
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
                    <div className="w-full space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                      <div className="text-center">
                        <h3 className="text-3xl font-black text-white inline-flex items-center gap-4">
                          <span className="bg-emerald-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/40">2</span>
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
                    <div className="w-full space-y-8 animate-in zoom-in-95 fade-in duration-700">
                      <div className={`py-3 px-6 rounded-2xl text-center font-black text-xl tracking-widest uppercase ${
                        isFinalCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {isFinalCorrect ? 'Perfect! ✓' : 'Incorrect ✗'}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500 font-black uppercase text-center tracking-widest">左侧答案</p>
                          <ColorGrid 
                            selected={selectedLeft} 
                            onSelect={() => {}} 
                            disabled={true} 
                            correct={currentQuiz.correctLeft}
                          />
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500 font-black uppercase text-center tracking-widest">右侧答案</p>
                          <ColorGrid 
                            selected={selectedRight} 
                            onSelect={() => {}} 
                            disabled={true} 
                            correct={currentQuiz.correctRight}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-3 text-slate-500 text-sm font-bold uppercase tracking-widest">
                        <i className="fas fa-spinner fa-spin text-blue-400"></i>
                        自动载入下一题
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Controls / Help */}
                <div className="w-full flex flex-col gap-4 pt-6 border-t border-slate-800/60">
                  <div className="flex gap-4">
                    {currentStep === 'done' ? (
                      <div className="flex-grow flex gap-4">
                        <button
                          onClick={startNewQuiz}
                          className="flex-grow bg-slate-800 hover:bg-slate-700 text-white rounded-[1.25rem] font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group"
                        >
                          立即跳转 <i className="fas fa-bolt text-yellow-400 group-hover:scale-125 transition-transform"></i>
                        </button>
                        <button
                          onClick={fetchTip}
                          disabled={loadingTip || !!tip}
                          className="w-16 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-[1.25rem] font-black flex items-center justify-center transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
                          title="助记提示"
                        >
                          {loadingTip ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-lightbulb"></i>}
                        </button>
                      </div>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center py-2">
                        <span className="text-slate-400 text-sm font-bold animate-pulse flex items-center gap-2">
                          <i className="fas fa-hand-pointer text-blue-400"></i> 请选择正确色块
                        </span>
                      </div>
                    )}
                  </div>

                  {tip && (
                    <div className="w-full p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in slide-in-from-top-4 fade-in duration-500">
                      <p className="text-indigo-200 italic text-center leading-relaxed font-medium">"{tip}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Configuration Panel */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 backdrop-blur-sm shadow-inner">
          <div className="space-y-6">
            <h2 className="text-xs font-black flex items-center gap-3 text-slate-400 uppercase tracking-[0.25em]">
              <i className="fas fa-swatches text-blue-400"></i> 颜色池设定
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-3">
              {Object.values(CubeColor).map(color => (
                <button
                  key={color}
                  onClick={() => handleToggleColor(color)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    enabledColors.includes(color) 
                      ? 'border-blue-500/40 bg-blue-500/5 text-white ring-2 ring-blue-500/10 shadow-lg' 
                      : 'border-slate-800/40 bg-transparent grayscale opacity-30 text-slate-600'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg shadow-sm border border-black/10 ${COLOR_MAP[color]}`}></div>
                  <span className="text-[10px] font-black tracking-widest">{COLOR_DISPLAY_NAMES[color]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xs font-black flex items-center gap-3 text-slate-400 uppercase tracking-[0.25em]">
              <i className="fas fa-anchor text-yellow-400"></i> 顶面锁定
            </h2>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => setFixedTop(null)}
                className={`p-3 text-[10px] font-black rounded-xl border-2 transition-all uppercase tracking-widest ${
                  fixedTop === null 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                    : 'bg-slate-950/50 border-slate-800/60 text-slate-600 hover:border-slate-700'
                }`}
              >
                全部随机
              </button>
              {Object.values(CubeColor).map(color => (
                <button
                  key={color}
                  disabled={!enabledColors.includes(color)}
                  onClick={() => setFixedTop(color)}
                  className={`p-3 text-[10px] font-black rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 tracking-widest ${
                    !enabledColors.includes(color) ? 'opacity-20 cursor-not-allowed border-transparent grayscale' : ''
                  } ${
                    fixedTop === color 
                      ? 'bg-slate-800 border-yellow-500 text-white shadow-xl ring-2 ring-yellow-500/10' 
                      : 'bg-slate-950/50 border-slate-800/60 text-slate-600 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border border-black/10 ${COLOR_MAP[color]}`}></div>
                  {COLOR_DISPLAY_NAMES[color]}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full mt-10 p-8 bg-slate-950/40 rounded-3xl border border-slate-800/40 text-slate-500 text-[10px] text-center font-bold tracking-[0.1em] leading-relaxed max-w-2xl">
        魔方标准：<span className="text-slate-400">白对黄 / 蓝对绿 / 红对橙</span><br/>
        基于标准西方配色方案。每次选择都会即时校验并自动进入下一循环，大幅提升肌肉记忆效率。
      </footer>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = "text-white" }) => (
  <div className="flex flex-col items-center px-4 min-w-[70px] border-r border-slate-700/50 last:border-0">
    <span className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">{label}</span>
    <span className={`text-2xl font-black tabular-nums ${color}`}>{value}</span>
  </div>
);

const FaceBox: React.FC<{ color: CubeColor; isGlowing?: boolean; size?: 'small' | 'large' }> = ({ color, isGlowing, size = 'large' }) => (
  <div className={`rounded-3xl flex flex-col items-center justify-center transition-all duration-700 border-4 border-slate-950 cube-shadow relative group ${COLOR_MAP[color]} ${
    size === 'small' ? 'w-28 h-28 md:w-36 md:h-36' : 'w-32 h-32 md:w-44 md:h-44'
  } ${isGlowing ? 'ring-8 ring-blue-500/10 shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)]' : ''}`}>
    <span className="font-black text-2xl md:text-3xl uppercase select-none drop-shadow-md tracking-widest">
      {COLOR_DISPLAY_NAMES[color]}
    </span>
    {isGlowing && (
       <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
    )}
  </div>
);

const ColorGrid: React.FC<{ 
  selected: CubeColor | null; 
  onSelect: (c: CubeColor) => void;
  disabled?: boolean;
  correct?: CubeColor;
  isLarge?: boolean;
}> = ({ selected, onSelect, disabled, correct, isLarge }) => (
  <div className={`grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto w-full`}>
    {Object.values(CubeColor).map(color => {
      const isSelected = selected === color;
      const isCorrectValue = correct === color;
      const isIncorrectSelection = isSelected && correct && !isCorrectValue;

      let borderStyle = 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 border-2';
      
      if (isSelected) {
        borderStyle = 'border-blue-500/50 ring-4 ring-blue-500/10 bg-blue-500/5 border-2';
      }
      
      if (correct !== undefined) {
        if (isCorrectValue) {
          borderStyle = 'border-emerald-500 ring-8 ring-emerald-500/10 opacity-100 bg-emerald-500/5 z-20 border-2 shadow-lg shadow-emerald-900/20 scale-105';
        } else if (isIncorrectSelection) {
          borderStyle = 'border-red-500 ring-8 ring-red-500/10 opacity-100 bg-red-500/5 z-20 border-2 shadow-lg shadow-red-900/20 scale-105';
        } else {
          borderStyle = 'border-slate-800/40 opacity-10 grayscale blur-[1px]';
        }
      }

      return (
        <button
          key={color}
          disabled={disabled}
          onClick={() => onSelect(color)}
          className={`relative rounded-[2rem] border-2 flex flex-col items-center justify-center gap-4 transition-all transform hover:scale-[1.03] active:scale-95 ${borderStyle} ${
            isLarge ? 'h-36 md:h-52' : 'h-24 md:h-28'
          } ${disabled && !isSelected && !isCorrectValue ? 'cursor-default' : ''}`}
        >
          <div className={`${isLarge ? 'w-14 h-14 md:w-20 md:h-20' : 'w-8 h-8'} rounded-2xl shadow-xl border border-black/20 ${COLOR_MAP[color]}`}></div>
          <span className={`${isLarge ? 'text-lg md:text-2xl' : 'text-sm'} font-black uppercase tracking-[0.2em] ${isSelected ? 'text-blue-300' : 'text-slate-500'}`}>
            {COLOR_DISPLAY_NAMES[color]}
          </span>
          {correct !== undefined && isCorrectValue && (
            <div className="absolute -top-3 -right-3 bg-emerald-500 text-white rounded-2xl w-10 h-10 flex items-center justify-center text-lg shadow-2xl animate-in zoom-in duration-500 border-4 border-slate-950">
              <i className="fas fa-check"></i>
            </div>
          )}
          {correct !== undefined && isIncorrectSelection && (
            <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-2xl w-10 h-10 flex items-center justify-center text-lg shadow-2xl animate-in zoom-in duration-500 border-4 border-slate-950">
              <i className="fas fa-times"></i>
            </div>
          )}
        </button>
      );
    })}
  </div>
);

export default App;
