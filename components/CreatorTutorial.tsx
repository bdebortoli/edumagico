import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // Seletor CSS do elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Ação a executar neste passo
}

interface CreatorTutorialProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  hasChildren?: boolean; // Indica se o usuário tem filhos cadastrados
  onNavigateToFamily?: () => void; // Função para navegar para tela de família
}

const CreatorTutorial: React.FC<CreatorTutorialProps> = ({ isVisible, onComplete, onSkip, onDismiss, hasChildren = true, onNavigateToFamily }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<React.CSSProperties>({});
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ display: 'none' });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Steps quando não há filhos cadastrados
  const stepsWithoutChildren: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Criador de Conteúdo! 🎉',
      description: 'Antes de criar sua primeira atividade, você precisa cadastrar pelo menos um aluno. Vamos fazer isso juntos!',
      targetSelector: '.creator-studio-container',
      position: 'center'
    },
    {
      id: 'create-student',
      title: '1️⃣ Cadastre um Aluno',
      description: 'Primeiro, você precisa cadastrar um aluno. Clique no botão abaixo para ir à tela de gerenciamento de família e adicionar seu primeiro filho.',
      targetSelector: '.creator-studio-container',
      position: 'center',
      action: onNavigateToFamily
    }
  ];

  // Steps quando há filhos cadastrados
  const stepsWithChildren: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Criador de Conteúdo! 🎉',
      description: 'Vamos criar sua primeira atividade educativa passo a passo. É mais fácil do que você imagina!',
      targetSelector: '.creator-studio-container',
      position: 'center'
    },
    {
      id: 'select-student',
      title: '1️⃣ Selecione o Aluno',
      description: 'Primeiro, escolha o aluno para quem você vai criar o conteúdo. Clique no card do aluno abaixo.',
      targetSelector: '[data-tutorial="student-selection"]',
      position: 'bottom'
    },
    {
      id: 'content-type',
      title: '2️⃣ Escolha o Tipo de Conteúdo',
      description: 'Agora escolha o tipo de atividade: Quiz, Resumo ou Jogo. Cada tipo tem seu propósito educativo.',
      targetSelector: '[data-tutorial="content-type"]',
      position: 'bottom'
    },
    {
      id: 'subject',
      title: '3️⃣ Selecione a Matéria',
      description: 'Escolha a matéria do conteúdo. As opções disponíveis dependem da série do aluno selecionado.',
      targetSelector: '[data-tutorial="subject"]',
      position: 'bottom'
    },
    {
      id: 'topic',
      title: '4️⃣ Digite o Tema',
      description: 'Agora digite o tema ou assunto do conteúdo. Por exemplo: "Sistema Solar", "Tabuada do 5", "História do Brasil".',
      targetSelector: '[data-tutorial="topic"]',
      position: 'bottom'
    },
    {
      id: 'generate',
      title: '5️⃣ Crie o Conteúdo',
      description: 'Por fim, clique no botão "Criar Conteúdo" e aguarde a IA gerar sua atividade personalizada!',
      targetSelector: '[data-tutorial="generate-button"]',
      position: 'top'
    }
  ];

  const steps = hasChildren ? stepsWithChildren : stepsWithoutChildren;

  useEffect(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
    if (!step) return;

    const updateTarget = () => {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);
      
      // Scroll para o elemento se necessário (com offset para mobile)
      if (element) {
        const isMobile = window.innerWidth < 640;
        const scrollOptions: ScrollIntoViewOptions = {
          behavior: 'smooth',
          block: isMobile ? 'center' : 'center',
          inline: 'nearest'
        };
        
        // Aguardar um pouco antes de fazer scroll para garantir que o elemento está renderizado
        setTimeout(() => {
          element.scrollIntoView(scrollOptions);
          
          // Em mobile, adicionar um pequeno offset adicional após o scroll
          if (isMobile) {
            setTimeout(() => {
              window.scrollBy({ top: -20, behavior: 'smooth' });
            }, 300);
          }
        }, 150);
      }
    };

    // Aguardar um pouco para garantir que o DOM está renderizado
    const timer = setTimeout(updateTarget, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [currentStep, isVisible, steps]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    // Executar ação do passo atual se houver
    if (currentStepData.action) {
      currentStepData.action();
      // Se for o último passo com ação, completar o tutorial
      if (isLastStep) {
        onComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calcular posição do tooltip (responsivo)
  const getTooltipPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = targetElement.getBoundingClientRect();
    const position = currentStepData.position || 'bottom';
    
    // Tamanhos responsivos
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const tooltipWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 320; // 16px padding de cada lado
    const tooltipHeight = isMobile ? 250 : 220; // Mais alto em mobile para acomodar conteúdo
    const spacing = isMobile ? 12 : 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16; // Padding mínimo da tela

    let top = 0;
    let left = 0;
    let transform = '';

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        transform = 'translateY(-100%)';
        
        // Se sair do topo, colocar embaixo
        if (top < padding) {
          top = rect.bottom + spacing;
          transform = '';
        }
        break;
        
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        
        // Se sair da parte inferior, colocar em cima
        if (top + tooltipHeight > viewportHeight - padding) {
          top = rect.top - tooltipHeight - spacing;
          transform = 'translateY(-100%)';
          // Se ainda sair, centralizar verticalmente
          if (top < padding) {
            top = Math.max(padding, (viewportHeight - tooltipHeight) / 2);
            transform = '';
          }
        }
        break;
        
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - spacing;
        transform = 'translateY(-50%)';
        
        // Se sair da esquerda, colocar à direita
        if (left < padding) {
          left = rect.right + spacing;
        }
        // Ajustar verticalmente se sair
        if (top < padding) {
          top = padding;
          transform = '';
        } else if (top + tooltipHeight > viewportHeight - padding) {
          top = viewportHeight - tooltipHeight - padding;
          transform = '';
        }
        break;
        
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + spacing;
        transform = 'translateY(-50%)';
        
        // Se sair da direita, colocar à esquerda
        if (left + tooltipWidth > viewportWidth - padding) {
          left = rect.left - tooltipWidth - spacing;
        }
        // Ajustar verticalmente se sair
        if (top < padding) {
          top = padding;
          transform = '';
        } else if (top + tooltipHeight > viewportHeight - padding) {
          top = viewportHeight - tooltipHeight - padding;
          transform = '';
        }
        break;
        
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: `${viewportWidth - 32}px`,
          width: isMobile ? 'calc(100% - 32px)' : '320px'
        };
    }

    // Garantir que não saia das bordas horizontalmente
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }

    // Garantir que não saia das bordas verticalmente
    if (top < padding) {
      top = padding;
      transform = '';
    } else if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
      transform = '';
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      transform,
      maxWidth: `${tooltipWidth}px`,
      width: isMobile ? 'calc(100vw - 32px)' : `${tooltipWidth}px`
    };
  };

  // Calcular highlight do elemento (responsivo)
  const getHighlightStyle = () => {
    if (!targetElement) return { display: 'none' };

    const rect = targetElement.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const borderWidth = isMobile ? 3 : 4;
    const borderRadius = isMobile ? '8px' : '12px';
    
    // Garantir que o highlight não saia da tela
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = Math.max(0, rect.top);
    let left = Math.max(0, rect.left);
    let width = Math.min(rect.width, viewportWidth - left);
    let height = Math.min(rect.height, viewportHeight - top);
    
    // Se o elemento estiver parcialmente fora da tela, ajustar
    if (rect.top < 0) {
      top = 0;
      height = Math.min(rect.height + rect.top, viewportHeight);
    }
    if (rect.left < 0) {
      left = 0;
      width = Math.min(rect.width + rect.left, viewportWidth);
    }
    
    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius,
      boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 ${borderWidth}px #6366f1, 0 0 ${isMobile ? '15px' : '20px'} rgba(99, 102, 241, 0.5)`,
      pointerEvents: 'none' as const,
      zIndex: 9998,
      transition: 'all 0.3s ease'
    };
  };

  // Atualizar posições quando targetElement mudar ou quando a janela redimensionar/scrollar
  useEffect(() => {
    if (!isVisible || !targetElement) {
      setTooltipPosition({});
      setHighlightStyle({ display: 'none' });
      return;
    }

    const updatePositions = () => {
      if (targetElement) {
        setTooltipPosition(getTooltipPosition());
        setHighlightStyle(getHighlightStyle());
      }
    };

    // Aguardar um pouco para garantir que o elemento está posicionado
    const timer = setTimeout(updatePositions, 200);

    // Atualizar quando a janela redimensionar ou scrollar
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [targetElement, currentStep, isVisible, currentStepData]);

  return (
    <>
      {/* Overlay escuro */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 z-[9997] transition-opacity"
        onClick={(e) => {
          // Não fechar ao clicar no overlay, apenas no botão de pular
          e.stopPropagation();
        }}
      />

      {/* Highlight do elemento alvo */}
      {targetElement && (
        <div
          style={highlightStyle}
          className="tutorial-highlight"
        />
      )}

      {/* Tooltip do tutorial */}
      <div
        style={tooltipPosition}
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl p-4 sm:p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="bg-indigo-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-slate-900 text-base sm:text-lg leading-tight">{currentStepData.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                Passo {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 transition p-1 flex-shrink-0"
            title="Dispensar tutorial"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Descrição */}
        <p className="text-slate-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
          {currentStepData.description}
        </p>

        {/* Progress bar */}
        <div className="mb-4 sm:mb-6">
          <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-bold transition text-sm sm:text-base ${
              isFirstStep
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">Ant</span>
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg text-sm sm:text-base"
          >
            {isLastStep ? (
              currentStepData.id === 'create-student' ? (
                <>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Ir para Cadastro</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Começar!</span>
                </>
              )
            ) : (
              <>
                <span className="hidden sm:inline">Próximo</span>
                <span className="sm:hidden">Próx</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default CreatorTutorial;

