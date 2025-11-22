import React, { useState, useEffect, useRef } from 'react';
import { ContentItem, QuizData, StoryData, SummaryData, GameData } from '../types';
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, Trophy, ArrowLeft, Volume2, Music, Frown, Wand2, Edit } from 'lucide-react';
import confetti from 'canvas-confetti';
import ContentRefinement from './ContentRefinement';
import MultiplicationTableGame from './MultiplicationTableGame';

interface InteractivePlayerProps {
  content: ContentItem;
  onBack: () => void;
  onComplete: (points: number) => void;
  onContentUpdated?: (updatedContent: ContentItem) => void;
  userRole?: 'parent' | 'teacher';
}

const InteractivePlayer: React.FC<InteractivePlayerProps> = ({ content, onBack, onComplete, onContentUpdated, userRole }) => {
  if (content.type === 'quiz') return <QuizPlayer content={content} onBack={onBack} onComplete={onComplete} onContentUpdated={onContentUpdated} userRole={userRole} />;
  if (content.type === 'story') return <StoryPlayer content={content} onBack={onBack} onComplete={onComplete} onContentUpdated={onContentUpdated} userRole={userRole} />;
  if (content.type === 'summary') return <SummaryPlayer content={content} onBack={onBack} onComplete={onComplete} onContentUpdated={onContentUpdated} userRole={userRole} />;
  if (content.type === 'game') {
    const gameData = content.data as any;
    if (gameData?.gameType === 'multiplication-table') {
      return <MultiplicationTableGame onBack={onBack} onComplete={onComplete} />;
    }
  }
  return <div>Tipo de conteúdo desconhecido</div>;
};

// --- Sub-Components ---

const QuizPlayer: React.FC<InteractivePlayerProps> = ({ content, onBack, onComplete, onContentUpdated, userRole }) => {
  const [currentContent, setCurrentContent] = useState(content);
  const data = currentContent.data as QuizData;
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Sound Effects
  const successAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')); // Ping
  const errorAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3')); // Soft fail

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    
    const isCorrect = index === data.questions[currentQ].correctIndex;

    if (isCorrect) {
      setScore(score + 1);
      setFeedbackMode('correct');
      successAudio.current.volume = 0.5;
      successAudio.current.play().catch(() => {}); // Catch autoplay block
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#ec4899', '#fbbf24']
      });
    } else {
      setFeedbackMode('wrong');
      errorAudio.current.volume = 0.5;
      errorAudio.current.play().catch(() => {});
    }
  };

  const nextQuestion = () => {
    if (currentQ < data.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setFeedbackMode(null);
    } else {
      setIsFinished(true);
      onComplete(score * 10); // 10 points per question
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
        <div className="relative">
           <Trophy className="w-32 h-32 text-yellow-500 mb-6 animate-bounce-slow" />
           <div className="absolute -top-2 -right-2 bg-red-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center animate-ping">
             +{score * 10}
           </div>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-2 font-fredoka">Incrível!</h2>
        <p className="text-xl text-slate-600 mb-8">Você acertou <span className="font-bold text-indigo-600">{score}</span> de {data.questions.length} questões!</p>
        <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition shadow-xl hover:scale-105 transform">
          Voltar e Ver Ranking
        </button>
      </div>
    );
  }

  const question = data.questions[currentQ];

  const [showRefinement, setShowRefinement] = useState(false);
  const canEdit = userRole === 'parent' || userRole === 'teacher' || currentContent.isAiGenerated;

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    setCurrentContent(refinedContent);
    if (onContentUpdated) {
      onContentUpdated(refinedContent);
    }
    setShowRefinement(false);
  };

  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  return (
    <div className="max-w-2xl mx-auto pt-8 pb-20 relative">
      {/* Refinement Modal */}
      {showRefinement && (
        <ContentRefinement
          content={currentContent}
          onRefined={handleRefinementComplete}
          onClose={() => setShowRefinement(false)}
          files={[]}
          grade={currentContent.grade}
          age={Math.round((currentContent.ageRange.min + currentContent.ageRange.max) / 2)}
        />
      )}

      {/* Edit Button */}
      {canEdit && !isFinished && (
        <div className="absolute top-8 right-4 z-10">
          <button
            onClick={() => setShowRefinement(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:scale-105 transform text-sm"
            title="Editar conteúdo com IA"
          >
            <Wand2 className="w-4 h-4" />
            Editar
          </button>
        </div>
      )}
      {/* Wrong Answer Modal Overlay */}
      {feedbackMode === 'wrong' && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl transform scale-100">
               <Frown className="w-16 h-16 text-orange-500 mx-auto mb-4" />
               <h3 className="text-2xl font-black text-slate-800 mb-2 font-fredoka">Não foi dessa vez...</h3>
               <p className="text-slate-600 mb-6">A resposta certa era outra. Mas não desista, aprender é assim mesmo!</p>
               <div className="bg-blue-50 p-4 rounded-xl text-left mb-6 text-sm border border-blue-100">
                 <span className="font-bold text-blue-700 block mb-1">Dica:</span>
                 {question.explanation}
               </div>
               <button 
                 onClick={nextQuestion} 
                 className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
               >
                 Continuar Tentando
               </button>
            </div>
         </div>
      )}

      <button onClick={onBack} className="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-1 font-bold">
        <ArrowLeft className="w-4 h-4" /> Sair
      </button>

      <div className="flex justify-between items-center mb-4">
         <span className="text-sm font-bold text-slate-400">Questão {currentQ + 1}/{data.questions.length}</span>
         <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{score * 10} pts</span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-3 mb-8 overflow-hidden">
        <div className="bg-indigo-500 h-full transition-all duration-500 ease-out" style={{ width: `${((currentQ) / data.questions.length) * 100}%` }}></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 border-b-8 border-indigo-100 relative overflow-hidden">
        
        <h3 className="text-2xl font-bold text-slate-800 mb-8 font-fredoka leading-tight relative z-10">
          {question.question}
        </h3>

        <div className={`grid gap-4 relative z-10 transition-all duration-500 ${feedbackMode === 'correct' ? 'bg-green-50 p-6 -mx-6 rounded-2xl' : ''}`}>
          {question.options.map((opt, idx) => {
            let buttonClass = "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 font-bold text-lg relative transform hover:scale-[1.01] ";
            
            if (selectedOption === null) {
              buttonClass += "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 bg-white";
            } else {
              if (idx === question.correctIndex) {
                buttonClass += "border-green-500 bg-green-100 text-green-800 shadow-lg";
              } else if (idx === selectedOption) {
                buttonClass += "border-red-400 bg-red-50 text-red-800";
              } else {
                buttonClass += "border-slate-100 opacity-40 bg-white";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedOption !== null}
                className={buttonClass}
              >
                <div className="flex justify-between items-center z-10 relative">
                  <span>{opt}</span>
                  {selectedOption !== null && idx === question.correctIndex && <CheckCircle className="w-6 h-6 text-green-600 animate-bounce" />}
                  {selectedOption === idx && idx !== question.correctIndex && <XCircle className="w-6 h-6 text-red-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {feedbackMode === 'correct' && (
          <div className="mt-8 flex flex-col items-center animate-fade-in-up relative z-10">
             <p className="text-green-600 font-bold mb-4 text-lg">✨ Resposta Correta! Mandou bem!</p>
            <button 
              onClick={nextQuestion}
              className="bg-green-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition shadow-lg shadow-green-200 flex items-center gap-2 w-full justify-center"
            >
              Próxima <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const StoryPlayer: React.FC<InteractivePlayerProps> = ({ content, onBack, onComplete, onContentUpdated, userRole }) => {
  const [currentContent, setCurrentContent] = useState(content);
  const data = currentContent.data as StoryData;
  const [chapter, setChapter] = useState(0);
  const [showRefinement, setShowRefinement] = useState(false);
  const canEdit = userRole === 'parent' || userRole === 'teacher' || currentContent.isAiGenerated;

  const finish = () => {
    onComplete(50); // Flat points for reading story
    onBack();
  }

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    setCurrentContent(refinedContent);
    if (onContentUpdated) {
      onContentUpdated(refinedContent);
    }
    setShowRefinement(false);
  };

  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-20">
      {/* Refinement Modal */}
      {showRefinement && (
        <ContentRefinement
          content={currentContent}
          onRefined={handleRefinementComplete}
          onClose={() => setShowRefinement(false)}
          files={[]}
          grade={currentContent.grade}
          age={Math.round((currentContent.ageRange.min + currentContent.ageRange.max) / 2)}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-4">
          <div className="text-slate-400 text-sm font-bold">
            Capítulo {chapter + 1} de {data.chapters.length}
          </div>
          {canEdit && (
            <button
              onClick={() => setShowRefinement(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:scale-105 transform text-sm"
            >
              <Wand2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100 min-h-[500px] flex flex-col relative">
        <div className="bg-orange-100 p-8 text-center relative overflow-hidden">
          <Music className="absolute top-4 right-4 text-orange-300 w-8 h-8 opacity-50" />
          <h2 className="text-2xl md:text-3xl font-black text-orange-800 font-fredoka relative z-10">
            {data.chapters[chapter].title}
          </h2>
        </div>

        <div className="p-8 md:p-12 flex-1 flex flex-col justify-between">
          <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-medium font-fredoka">
            {data.chapters[chapter].text}
          </p>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100">
            <button 
              onClick={() => setChapter(Math.max(0, chapter - 1))}
              disabled={chapter === 0}
              className="text-slate-500 hover:text-indigo-600 disabled:opacity-30 font-bold flex items-center gap-2"
            >
              <ChevronLeft className="w-6 h-6" /> Anterior
            </button>
            
            {chapter < data.chapters.length - 1 ? (
              <button 
                onClick={() => {
                    setChapter(chapter + 1);
                    confetti({ particleCount: 30, origin: { y: 0.8 }, colors: ['#fdba74'] });
                }}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center gap-2 shadow-lg shadow-orange-200"
              >
                Próximo Capítulo <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={finish}
                className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                Concluir Leitura <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryPlayer: React.FC<InteractivePlayerProps> = ({ content, onBack, onComplete, onContentUpdated, userRole }) => {
  const [currentContent, setCurrentContent] = useState(content);
  const data = currentContent.data as SummaryData;
  const [showRefinement, setShowRefinement] = useState(false);

  useEffect(() => {
      // Award points just for opening summary
      const timer = setTimeout(() => onComplete(20), 2000);
      return () => clearTimeout(timer);
  }, []);

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    setCurrentContent(refinedContent);
    if (onContentUpdated) {
      onContentUpdated(refinedContent);
    }
    setShowRefinement(false);
  };

  const handleRefinementSkip = () => {
    setShowRefinement(false);
  };

  // Only show edit button if user is parent or teacher (owner)
  const canEdit = userRole === 'parent' || userRole === 'teacher' || currentContent.isAiGenerated;

  // Update local content when prop changes
  useEffect(() => {
    setCurrentContent(content);
  }, [content]);

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-20">
      {/* Refinement Modal */}
      {showRefinement && (
        <ContentRefinement
          content={currentContent}
          onRefined={handleRefinementComplete}
          onClose={handleRefinementSkip}
          files={[]} // Files not available in player, but refinement can still work
          grade={currentContent.grade}
          age={Math.round((currentContent.ageRange.min + currentContent.ageRange.max) / 2)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {canEdit && (
          <button
            onClick={() => setShowRefinement(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:scale-105 transform"
          >
            <Wand2 className="w-4 h-4" />
            Editar com IA
          </button>
        )}
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-8 border-l-8 border-purple-500">
          <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2 font-fredoka">
            <Volume2 className="w-6 h-6" /> Resumo Simples
          </h2>
          <p className="text-lg text-slate-700 leading-relaxed">
            {data.simpleExplanation}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8 border-l-8 border-blue-500">
          <h2 className="text-2xl font-bold text-blue-900 mb-4 font-fredoka">Pontos Chave</h2>
          <ul className="space-y-3">
            {data.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  {idx + 1}
                </div>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-3xl p-8 border border-yellow-200">
          <h2 className="text-xl font-bold text-yellow-800 mb-2 font-fredoka flex items-center gap-2">
            <span className="text-2xl">💡</span> Curiosidade
          </h2>
          <p className="text-yellow-900 italic">
            "{data.funFact}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default InteractivePlayer;