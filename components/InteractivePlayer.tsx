import React, { useState, useEffect, useRef } from 'react';
import { ContentItem, QuizData, StoryData, SummaryData, GameData } from '../types';
import { CheckCircle, XCircle, ChevronRight, ChevronLeft, Trophy, ArrowLeft, Volume2, Music, Frown, Wand2, Edit, Loader2, Send, Lightbulb, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import ContentRefinement from './ContentRefinement';
import MultiplicationTableGame from './MultiplicationTableGame';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  // TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO, ANTES DE QUALQUER RETURN
  const [currentContent, setCurrentContent] = useState(content);
  const data = currentContent.data as QuizData;
  
  // Função para converter questões fill e vf para múltipla escolha (se ainda não convertidas)
  const convertQuestionToMultipleChoice = (q: any): any => {
    if (!q || !q.question) return null;
    
    // Se já tem options e correctIndex, está convertida
    if (q.options && Array.isArray(q.options) && q.options.length > 0 && 
        (q.correctIndex !== undefined && q.correctIndex !== null)) {
      return q;
    }
    
    // Converter fill para múltipla escolha
    if (q.type === 'fill' && q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
      let options = [...q.answers];
      
      // Se tem apenas uma resposta, criar opções adicionais para tornar múltipla escolha
      if (options.length === 1) {
        const correctAnswer = options[0].toLowerCase();
        const questionText = (q.q || q.question || '').toLowerCase();
        
        // Gerar opções incorretas baseadas no contexto da pergunta
        let wrongOptions: string[] = [];
        
        // Se a pergunta é sobre escambo/troca
        if (questionText.includes('escambo') || questionText.includes('troca') || questionText.includes('sem usar dinheiro')) {
          wrongOptions = ['comércio', 'negociação', 'venda', 'compra', 'trocas', 'permuta'];
        }
        // Se a pergunta é sobre capitanias
        else if (questionText.includes('capitania') || questionText.includes('dividir') || questionText.includes('terras')) {
          wrongOptions = ['províncias', 'estados', 'regiões', 'territórios', 'domínios', 'feudos'];
        }
        // Se a pergunta é sobre açúcar/cana
        else if (questionText.includes('açúcar') || questionText.includes('cana')) {
          wrongOptions = ['café', 'algodão', 'tabaco', 'ouro', 'prata', 'cacau'];
        }
        // Se a pergunta é sobre colonização/portugueses
        else if (questionText.includes('português') || questionText.includes('colonização') || questionText.includes('brasil')) {
          wrongOptions = ['espanhóis', 'franceses', 'holandeses', 'ingleses', 'italianos'];
        }
        // Opções genéricas
        else {
          wrongOptions = ['opção A', 'opção B', 'opção C', 'alternativa', 'solução', 'resposta'];
        }
        
        // Filtrar opções que são muito similares à resposta correta
        wrongOptions = wrongOptions
          .filter(opt => {
            const optLower = opt.toLowerCase();
            return optLower !== correctAnswer && 
                   !correctAnswer.includes(optLower) && 
                   !optLower.includes(correctAnswer) &&
                   optLower.length > 2; // Evitar opções muito curtas
          })
          .slice(0, 3); // Pegar até 3 opções incorretas
        
        // Se não conseguiu gerar opções suficientes, usar genéricas
        if (wrongOptions.length < 3) {
          const genericOptions = ['alternativa A', 'alternativa B', 'alternativa C', 'opção 1', 'opção 2'];
          wrongOptions = [...wrongOptions, ...genericOptions]
            .filter(opt => {
              const optLower = opt.toLowerCase();
              return optLower !== correctAnswer;
            })
            .slice(0, 3);
        }
        
        // Combinar e embaralhar (sempre manter pelo menos 4 opções)
        options = [options[0], ...wrongOptions].sort(() => Math.random() - 0.5);
      }
      
      // Encontrar o índice da resposta correta (pode ser qualquer uma das respostas aceitas)
      const correctIndex = options.findIndex(opt => 
        q.answers.some((ans: string) => ans.toLowerCase() === opt.toLowerCase())
      );
      
      return {
        ...q,
        options: options.length >= 2 ? options : [...options, 'Outra opção', 'Mais uma opção'], // Garantir pelo menos 4 opções
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: q.explanation || `Respostas aceitas: ${q.answers.join(', ')}`,
        originalType: 'fill' // Marcar como fill original para referência
      };
    }
    
    // Converter vf para múltipla escolha
    if (q.type === 'vf' && (q.answer === 'V' || q.answer === 'F')) {
      return {
        ...q,
        options: ['Verdadeiro', 'Falso'],
        correctIndex: q.answer === 'V' ? 0 : 1,
        explanation: q.explanation || `Resposta correta: ${q.answer === 'V' ? 'Verdadeiro' : 'Falso'}`,
        originalType: 'vf' // Marcar como vf original para referência
      };
    }
    
    return null;
  };
  
  // Encontrar a primeira questão válida (múltipla escolha ou discursiva)
  const findFirstValidQuestion = () => {
    if (!data.questions || !Array.isArray(data.questions)) return 0;
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const converted = convertQuestionToMultipleChoice(q);
      const isDiscursive = (q as any)?.type === 'discursiva' || 
                           (q as any)?.guideline || 
                           (q as any)?.type === 'discursive';
      const isMultipleChoice = converted && converted.options && Array.isArray(converted.options) && converted.options.length > 0 && 
                               (converted.correctIndex !== undefined && converted.correctIndex !== null);
      if (isMultipleChoice || isDiscursive) {
        return i;
      }
    }
    return 0;
  };
  
  const [currentQ, setCurrentQ] = useState(findFirstValidQuestion());
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedbackMode, setFeedbackMode] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  // Estados para questões discursivas
  const [discursiveAnswer, setDiscursiveAnswer] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<any>(null);
  
  // Estados para refinamento (DEVEM estar aqui, não depois dos returns)
  const [showRefinement, setShowRefinement] = useState(false);
  const canEdit = userRole === 'parent' || userRole === 'teacher' || currentContent.isAiGenerated;

  // Sound Effects
  const successAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')); // Ping
  const errorAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3')); // Soft fail
  
  // useEffect também deve estar aqui
  useEffect(() => {
    setCurrentContent(content);
  }, [content]);
  
  // Limpar timeouts quando mudar de questão ou desmontar
  useEffect(() => {
    return () => {
      // Limpar qualquer timeout pendente ao mudar de questão
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, [currentQ]);
  
  // Reset selectedOption quando mudar de questão
  useEffect(() => {
    setSelectedOption(null);
    setFeedbackMode(null);
  }, [currentQ]);

  // Ref para armazenar timeout e poder cancelá-lo se necessário
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    
    // Usar a questão convertida (já calculada no render)
    const rawQuestion = data.questions[currentQ];
    if (!rawQuestion) {
      console.error('Questão não encontrada no índice:', currentQ);
      return;
    }
    
    const currentQuestion = convertQuestionToMultipleChoice(rawQuestion) || rawQuestion;
    
    if (!currentQuestion || !currentQuestion.options || !Array.isArray(currentQuestion.options) || currentQuestion.options.length === 0) {
      console.error('Questão inválida ou sem options:', currentQuestion);
      return;
    }
    
    // Limpar timeout anterior se existir
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    
    setSelectedOption(index);
    
    const isCorrect = currentQuestion.correctIndex !== undefined && currentQuestion.correctIndex !== null && index === currentQuestion.correctIndex;

    if (isCorrect) {
      setScore(prevScore => prevScore + 1); // Usar função para evitar closure stale
      setFeedbackMode('correct');
      successAudio.current.volume = 0.5;
      successAudio.current.play().catch(() => {}); // Catch autoplay block
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#ec4899', '#fbbf24']
      });
      
      // Avançar automaticamente após 2 segundos para resposta correta
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        nextQuestion();
      }, 2000);
    } else {
      setFeedbackMode('wrong');
      errorAudio.current.volume = 0.5;
      errorAudio.current.play().catch(() => {});
      
      // Avançar automaticamente após 3 segundos para resposta incorreta (dar tempo para ler o feedback)
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        nextQuestion();
      }, 3000);
    }
  };

  const handleDiscursiveCorrection = async () => {
    if (!discursiveAnswer.trim()) {
      alert('Por favor, escreva sua resposta antes de enviar.');
      return;
    }

    const currentQuestion = data.questions[currentQ];
    const guideline = (currentQuestion as any)?.guideline || currentQuestion?.explanation || '';
    if (!guideline) {
      alert('Esta questão não possui critério de correção. Não é possível avaliar.');
      return;
    }

    setIsCorrecting(true);
    setCorrectionResult(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Você precisa estar autenticado para enviar respostas.');
      }

      const response = await fetch(`${API_BASE}/correcao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resposta_aluno: discursiveAnswer.trim(),
          guideline: guideline,
          serie: currentContent.grade,
          idade: Math.round((currentContent.ageRange.min + currentContent.ageRange.max) / 2),
          materia: currentContent.subject,
          conteudo: currentContent.title
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao corrigir resposta');
      }

      const result = await response.json();
      setCorrectionResult(result);

      // Atualizar pontuação baseado na aderência
      if (result.data?.avaliacao?.aderencia_guideline === 'correta') {
        setScore(score + 1);
        setFeedbackMode('correct');
        successAudio.current.volume = 0.5;
        successAudio.current.play().catch(() => {});
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#ec4899', '#fbbf24']
        });
      } else if (result.data?.avaliacao?.aderencia_guideline === 'parcial') {
        setScore(score + 0.5); // Meio ponto para parcial
        setFeedbackMode('correct');
      } else {
        setFeedbackMode('wrong');
        errorAudio.current.volume = 0.5;
        errorAudio.current.play().catch(() => {});
      }
    } catch (error: any) {
      console.error('Erro ao corrigir resposta:', error);
      alert(`Erro ao corrigir resposta: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsCorrecting(false);
    }
  };

  const nextQuestion = () => {
    // Limpar timeout de auto-avanço se existir
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    // Reset estados de questão discursiva
    setDiscursiveAnswer('');
    setCorrectionResult(null);
    
    // Pular questões inválidas automaticamente
    let nextIndex = currentQ + 1;
    while (nextIndex < data.questions.length) {
      const nextQ = data.questions[nextIndex];
      // Tentar converter questão fill/vf para múltipla escolha
      const converted = convertQuestionToMultipleChoice(nextQ);
      
      // Verificar se a questão tem estrutura válida (múltipla escolha ou discursiva)
      const isNextDiscursive = (nextQ as any)?.type === 'discursiva' || 
                                (nextQ as any)?.guideline || 
                                (nextQ as any)?.type === 'discursive';
      const hasValidStructure = 
        (nextQ && nextQ.question && 
         ((converted && converted.options && Array.isArray(converted.options) && converted.options.length > 0 && 
           (converted.correctIndex !== undefined && converted.correctIndex !== null)) ||
          (nextQ.options && Array.isArray(nextQ.options) && nextQ.options.length > 0 && 
           (nextQ.correctIndex !== undefined && nextQ.correctIndex !== null)) ||
          isNextDiscursive));
      
      if (hasValidStructure) {
        break;
      }
      // Se a questão não é válida, pular para a próxima
      console.warn(`Pulando questão ${nextIndex + 1} (índice ${nextIndex}): estrutura inválida`, nextQ);
      nextIndex++;
    }
    
    if (nextIndex < data.questions.length) {
      setCurrentQ(nextIndex);
      setSelectedOption(null);
      setFeedbackMode(null);
    } else {
      setIsFinished(true);
      
      // Calcular porcentagem de acertos
      const totalQuestions = data.questions.length;
      const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      
      // Calcular pontos base (10 pontos por questão)
      let basePoints = score * 10;
      
      // Bônus para 91-100% de acertos
      let bonusPoints = 0;
      if (percentage >= 91 && percentage <= 100) {
        bonusPoints = Math.round(basePoints * 0.5); // 50% de bônus
      }
      
      const totalPoints = basePoints + bonusPoints;
      onComplete(totalPoints);
    }
  };

  // Função para obter mensagem e estilo baseado na porcentagem
  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 0 && percentage <= 30) {
      return {
        message: "Precisa melhorar",
        emoji: "📚",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      };
    } else if (percentage >= 31 && percentage <= 50) {
      return {
        message: "Não foi o ideal, com um pouco mais você consegue",
        emoji: "💪",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200"
      };
    } else if (percentage >= 51 && percentage <= 75) {
      return {
        message: "Quase lá! Você consegue!",
        emoji: "🎯",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    } else if (percentage >= 76 && percentage <= 90) {
      return {
        message: "Muito bem! Falta pouco para detonar!",
        emoji: "🔥",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      };
    } else { // 91-100%
      return {
        message: "Excelente! Você está de parabéns, continue estudando para não perder o ritmo",
        emoji: "🏆",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      };
    }
  };

  if (isFinished) {
    const totalQuestions = data.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const performance = getPerformanceMessage(percentage);
    
    // Calcular pontos
    const basePoints = score * 10;
    const bonusPoints = (percentage >= 91 && percentage <= 100) ? Math.round(basePoints * 0.5) : 0;
    const totalPoints = basePoints + bonusPoints;
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
        <div className="relative">
           <Trophy className="w-32 h-32 text-yellow-500 mb-6 animate-bounce-slow" />
           <div className="absolute -top-2 -right-2 bg-red-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center animate-ping">
             +{totalPoints}
           </div>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-2 font-fredoka">Quiz Finalizado!</h2>
        <p className="text-xl text-slate-600 mb-4">
          Você acertou <span className="font-bold text-indigo-600">{score}</span> de {totalQuestions} questões!
        </p>
        <p className="text-2xl font-bold text-indigo-600 mb-6">
          {percentage}% de acertos
        </p>
        
        {/* Mensagem de performance escalonada */}
        <div className={`${performance.bgColor} ${performance.borderColor} border-2 rounded-2xl p-6 mb-6 max-w-md w-full`}>
          <div className="text-4xl mb-3">{performance.emoji}</div>
          <p className={`${performance.color} font-bold text-lg`}>
            {performance.message}
          </p>
        </div>
        
        {/* Mostrar bônus se aplicável */}
        {bonusPoints > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl p-4 mb-6 max-w-md w-full animate-pulse">
            <div className="text-2xl font-bold mb-1">🎉 Bônus Extra! 🎉</div>
            <p className="text-lg">Você ganhou <span className="font-black text-2xl">+{bonusPoints}</span> pontos bônus!</p>
            <p className="text-sm opacity-90 mt-2">Por ter acertado mais de 90% das questões!</p>
          </div>
        )}
        
        {/* Resumo de pontos */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6 max-w-md w-full border border-slate-200">
          <p className="text-slate-600 text-sm mb-2">Resumo de Pontos:</p>
          <div className="flex justify-between items-center">
            <span className="text-slate-700">Pontos base ({score} acertos × 10):</span>
            <span className="font-bold text-slate-800">{basePoints} pts</span>
          </div>
          {bonusPoints > 0 && (
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-700">Bônus (90%+ de acertos):</span>
              <span className="font-bold text-green-600">+{bonusPoints} pts</span>
            </div>
          )}
          <div className="flex justify-between items-center mt-2 pt-2 border-t-2 border-indigo-200">
            <span className="font-bold text-slate-800">Total:</span>
            <span className="font-black text-indigo-600 text-xl">{totalPoints} pts</span>
          </div>
        </div>
        
        <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition shadow-xl hover:scale-105 transform">
          Voltar e Ver Ranking
        </button>
      </div>
    );
  }

  const rawQuestion = data.questions[currentQ];
  
  // Converter questão fill/vf para múltipla escolha se necessário
  const question = convertQuestionToMultipleChoice(rawQuestion) || rawQuestion;

  // Verificar se a questão tem a estrutura necessária para ser renderizada
  if (!question || !question.question) {
    console.error('Questão não encontrada:', { currentQ, totalQuestions: data.questions.length, questions: data.questions });
    return (
      <div className="max-w-2xl mx-auto pt-8 pb-20 text-center">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-red-800 mb-2">Erro ao carregar questão</h3>
          <p className="text-red-600 mb-6">A questão {currentQ + 1} não foi encontrada ou está com formato inválido.</p>
          <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Verificar se é questão de múltipla escolha (após conversão)
  // Questões fill e vf convertidas devem ser tratadas como múltipla escolha
  const isMultipleChoice = question.options && Array.isArray(question.options) && question.options.length > 0 && 
                           (question.correctIndex !== undefined || question.correctIndex !== null);
  
  // Verificar se é questão discursiva (NÃO incluir fill/vf convertidas)
  // Apenas questões que realmente são discursivas (não convertidas)
  const isDiscursive = !question.originalType && // Não é fill/vf convertida
                       ((rawQuestion as any)?.type === 'discursiva' || 
                        (rawQuestion as any)?.guideline || 
                        (rawQuestion as any)?.type === 'discursive');

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    setCurrentContent(refinedContent);
    if (onContentUpdated) {
      onContentUpdated(refinedContent);
    }
    setShowRefinement(false);
  };

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
                 {question.explanation || 'A resposta correta está marcada em verde.'}
               </div>
               <p className="text-xs text-slate-400 mb-4">Avançando automaticamente em alguns segundos...</p>
               <button 
                 onClick={nextQuestion} 
                 className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
               >
                 Continuar Agora
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
          {question.question || 'Questão sem texto'}
        </h3>

        {isDiscursive ? (
          // Interface para questão discursiva
          <div className="space-y-6">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-indigo-900 mb-2">Questão Discursiva</h4>
                  <p className="text-sm text-indigo-700">
                    Escreva sua resposta abaixo. A IA irá analisar e fornecer feedback detalhado.
                  </p>
                </div>
              </div>
              
              <textarea
                value={discursiveAnswer}
                onChange={(e) => setDiscursiveAnswer(e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="w-full min-h-[200px] p-4 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none resize-y text-slate-700 font-medium"
                disabled={isCorrecting || !!correctionResult}
              />
              
              {!correctionResult && (
                <button
                  onClick={handleDiscursiveCorrection}
                  disabled={isCorrecting || !discursiveAnswer.trim()}
                  className="mt-4 w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCorrecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Corrigindo...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar para Correção
                    </>
                  )}
                </button>
              )}
            </div>

            {correctionResult && correctionResult.data?.avaliacao && (
              <div className="bg-white border-2 rounded-2xl p-6 space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  correctionResult.data.avaliacao.aderencia_guideline === 'correta' 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : correctionResult.data.avaliacao.aderencia_guideline === 'parcial'
                    ? 'bg-yellow-50 border-2 border-yellow-200'
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  {correctionResult.data.avaliacao.aderencia_guideline === 'correta' ? (
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  ) : correctionResult.data.avaliacao.aderencia_guideline === 'parcial' ? (
                    <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-lg">
                      {correctionResult.data.avaliacao.aderencia_guideline === 'correta' 
                        ? 'Resposta Correta! 🎉' 
                        : correctionResult.data.avaliacao.aderencia_guideline === 'parcial'
                        ? 'Resposta Parcialmente Correta'
                        : 'Resposta Precisa de Melhorias'}
                    </h4>
                    <p className="text-sm opacity-80 mt-1">
                      {correctionResult.data.avaliacao.aderencia_guideline === 'correta' 
                        ? 'Parabéns! Sua resposta está completa e correta.' 
                        : correctionResult.data.avaliacao.aderencia_guideline === 'parcial'
                        ? 'Sua resposta está no caminho certo, mas pode ser melhorada.'
                        : 'Sua resposta precisa de ajustes. Veja as sugestões abaixo.'}
                    </p>
                  </div>
                </div>

                {correctionResult.data.avaliacao.pontos_positivos && correctionResult.data.avaliacao.pontos_positivos.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h5 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Pontos Positivos
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                      {correctionResult.data.avaliacao.pontos_positivos.map((ponto: string, idx: number) => (
                        <li key={idx}>{ponto}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {correctionResult.data.avaliacao.corrigir && correctionResult.data.avaliacao.corrigir.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h5 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5" />
                      O que Melhorar
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                      {correctionResult.data.avaliacao.corrigir.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {correctionResult.data.avaliacao.resposta_modelo && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h5 className="font-bold text-purple-800 mb-2">Resposta Modelo</h5>
                    <p className="text-purple-700 text-sm leading-relaxed">
                      {correctionResult.data.avaliacao.resposta_modelo}
                    </p>
                  </div>
                )}

                <button
                  onClick={nextQuestion}
                  className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  Próxima Questão <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : !isMultipleChoice ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
            <p className="text-yellow-800 font-bold mb-4">
              ⚠️ Este tipo de questão ainda não é suportado no player interativo.
            </p>
            <p className="text-yellow-700 text-sm mb-6">
              Tipo de questão: {question.type || 'desconhecido'}
            </p>
            {question.explanation && (
              <div className="bg-white rounded-xl p-4 mb-4 text-left">
                <span className="font-bold text-yellow-800 block mb-2">Informação:</span>
                <p className="text-yellow-700">{question.explanation}</p>
              </div>
            )}
            <button 
              onClick={nextQuestion}
              className="bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-600 transition"
            >
              Pular para Próxima <ChevronRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        ) : (
          <>
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedOption === null) {
                        handleAnswer(idx);
                      }
                    }}
                    disabled={selectedOption !== null}
                    className={buttonClass}
                    type="button"
                  >
                    <div className="flex justify-between items-center z-10 relative">
                      <span>{opt}</span>
                      {selectedOption !== null && question.correctIndex !== undefined && idx === question.correctIndex && <CheckCircle className="w-4 h-4 text-green-600 animate-bounce flex-shrink-0" />}
                      {selectedOption === idx && question.correctIndex !== undefined && idx !== question.correctIndex && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

        {feedbackMode === 'correct' && (
          <div className="mt-8 flex flex-col items-center animate-fade-in-up relative z-10">
             <p className="text-green-600 font-bold mb-4 text-lg">✨ Resposta Correta! Mandou bem!</p>
             <p className="text-xs text-slate-400 mb-4">Avançando automaticamente em alguns segundos...</p>
            <button 
              onClick={nextQuestion}
              className="bg-green-500 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition shadow-lg shadow-green-200 flex items-center gap-2 w-full justify-center"
            >
              Próxima Agora <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
          </>
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