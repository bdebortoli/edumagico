
import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Upload, Loader2, FileType, BookOpen, BrainCircuit, Sparkles, X, MessageCircle, Coins, Paperclip, RotateCw, ArrowLeft, Save, Video, Volume2, Tag } from 'lucide-react';
import { generateEducationalContent, chatForCreation } from '../services/geminiService';
import { ContentType, ContentItem, FileAttachment, UserRole } from '../types';
import ContentRefinement from './ContentRefinement';
import CreatorTutorial from './CreatorTutorial';

interface CreatorStudioProps {
  onContentCreated: (content: ContentItem) => void;
  userPlan: string;
  userRole: UserRole;
  initialSource?: ContentItem | null;
  onCancelRemix?: () => void;
  children?: Array<{ id: string; name: string; grade: string; birthDate?: string; age?: number; educationLevel?: 'pre-escola' | 'fundamental1' | 'fundamental2' | 'ensino-medio' }>; // Filhos do usuário (para pais)
  onNavigateToSubscription?: () => void; // Navegação para tela de assinaturas
  onNavigateToFamily?: () => void; // Navegação para tela de família
  hasCreatedContent?: boolean; // Indica se o usuário já criou algum conteúdo
}

const GRADE_OPTIONS = [
  "Pré-escola", 
  "1º Ano Fund.", "2º Ano Fund.", "3º Ano Fund.", "4º Ano Fund.", "5º Ano Fund.",
  "6º Ano Fund.", "7º Ano Fund.", "8º Ano Fund.", "9º Ano Fund.",
  "1º Ano Médio", "2º Ano Médio", "3º Ano Médio"
];

// Helper function to calculate age from birth date
const calculateAge = (birthDate?: string): number | undefined => {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Helper function to calculate age range from grade
const getAgeRangeFromGrade = (grade: string): { min: number; max: number } => {
  if (!grade) return { min: 6, max: 8 }; // Fallback padrão
  
  const gradeLower = grade.toLowerCase();
  
  // Pré-escola
  if (gradeLower.includes('pré-escola') || gradeLower.includes('pre-escola')) {
    return { min: 4, max: 6 };
  }
  
  // Fundamental 1 (1º a 5º Ano)
  if (gradeLower.includes('1º ano fund')) {
    return { min: 6, max: 7 };
  }
  if (gradeLower.includes('2º ano fund')) {
    return { min: 7, max: 8 };
  }
  if (gradeLower.includes('3º ano fund')) {
    return { min: 8, max: 9 };
  }
  if (gradeLower.includes('4º ano fund')) {
    return { min: 9, max: 10 };
  }
  if (gradeLower.includes('5º ano fund')) {
    return { min: 10, max: 11 };
  }
  
  // Fundamental 2 (6º a 9º Ano)
  if (gradeLower.includes('6º ano fund')) {
    return { min: 11, max: 12 };
  }
  if (gradeLower.includes('7º ano fund')) {
    return { min: 12, max: 13 };
  }
  if (gradeLower.includes('8º ano fund')) {
    return { min: 13, max: 14 };
  }
  if (gradeLower.includes('9º ano fund')) {
    return { min: 14, max: 15 };
  }
  
  // Ensino Médio (1º a 3º Ano)
  if (gradeLower.includes('1º ano médio') || gradeLower.includes('1º ano medio')) {
    return { min: 15, max: 16 };
  }
  if (gradeLower.includes('2º ano médio') || gradeLower.includes('2º ano medio')) {
    return { min: 16, max: 17 };
  }
  if (gradeLower.includes('3º ano médio') || gradeLower.includes('3º ano medio')) {
    return { min: 17, max: 18 };
  }
  
  // Fallback padrão
  return { min: 6, max: 8 };
};

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onContentCreated, userPlan, userRole, initialSource, onCancelRemix, children = [], onNavigateToSubscription, onNavigateToFamily, hasCreatedContent = false }) => {
  // Mode: 'manual' = form based gen, 'chat' = chat gen, 'edit' = editing existing content manually/hybrid
  const [mode, setMode] = useState<'manual' | 'chat' | 'edit'>('manual');
  
  // Form State
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState(''); // Used for manual edit
  const [description, setDescription] = useState(''); // Used for manual edit

  // Get unique grades from children
  const getChildrenGrades = (): string[] => {
    if (!children || children.length === 0) return [];
    const grades = children.map(child => child.grade).filter((grade, index, self) => self.indexOf(grade) === index);
    return grades.sort();
  };

  // Calculate age range from children
  const getChildrenAgeRange = (): { min: number; max: number } | null => {
    if (!children || children.length === 0) return null;
    const ages = children
      .map(child => child.birthDate ? calculateAge(child.birthDate) : child.age)
      .filter((age): age is number => age !== undefined && age !== null);
    
    if (ages.length === 0) return null;
    
    return {
      min: Math.min(...ages),
      max: Math.max(...ages)
    };
  };

  // Get default grade from children (first child's grade)
  const getDefaultGrade = (): string => {
    if (children && children.length > 0) {
      return children[0].grade;
    }
    return '2º Ano Fund.';
  };

  const availableGrades = userRole === 'parent' ? getChildrenGrades() : GRADE_OPTIONS;
  const [grade, setGrade] = useState<string>(userRole === 'parent' ? getDefaultGrade() : '2º Ano Fund.');
  
  // Age Range State - calculado automaticamente a partir da série
  const initialAgeRange = getAgeRangeFromGrade(userRole === 'parent' ? getDefaultGrade() : '2º Ano Fund.');
  const [minAge, setMinAge] = useState<number>(initialAgeRange.min);
  const [maxAge, setMaxAge] = useState<number>(initialAgeRange.max);
  
  // Selected children state - permite múltiplos alunos da mesma série
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  
  const [keywords, setKeywords] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>('story');
  const [subject, setSubject] = useState<string>('Matemática'); // Matéria do conteúdo
  const [price, setPrice] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<ContentItem | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we are editing an OWNED item (Editing) vs Remixing someone else's
  const isEditing = initialSource && initialSource.authorRole === userRole && initialSource.authorId !== 'sys'; // Simplified check

  // Tutorial state - apenas para pais que ainda não criaram conteúdo
  const [showTutorial, setShowTutorial] = useState(false);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    // Verificar se deve mostrar o tutorial
    // O tutorial deve aparecer sempre até ser finalizado ou dispensado com confirmação
    console.log('Tutorial check:', {
      userRole,
      hasCreatedContent,
      isEditing,
      initialSource,
      tutorialCompleted: localStorage.getItem('creator_tutorial_completed'),
      tutorialDismissed: localStorage.getItem('creator_tutorial_dismissed'),
      childrenCount: children?.length || 0
    });
    
    // Verificar se é pai
    if (userRole === 'parent') {
      // Verificar se não criou conteúdo ainda
      if (!hasCreatedContent && !isEditing && !initialSource) {
        // Verificar se o tutorial foi completado ou dispensado
        const tutorialCompleted = localStorage.getItem('creator_tutorial_completed');
        const tutorialDismissed = localStorage.getItem('creator_tutorial_dismissed');
        
        // Só não mostrar se foi explicitamente completado ou dispensado
        if (!tutorialCompleted && !tutorialDismissed) {
          console.log('Mostrando tutorial - condições atendidas', {
            hasChildren: children && children.length > 0
          });
          setShowTutorial(true);
        } else {
          console.log('Tutorial já foi completado ou dispensado');
          setShowTutorial(false);
        }
      } else {
        console.log('Tutorial não deve aparecer:', {
          reason: hasCreatedContent ? 'já criou conteúdo' :
                  isEditing ? 'está editando' :
                  initialSource ? 'está fazendo remix' : 'outro motivo'
        });
        setShowTutorial(false);
      }
    } else {
      console.log('Tutorial não deve aparecer:', {
        reason: 'não é pai'
      });
      setShowTutorial(false);
    }
  }, [userRole, hasCreatedContent, isEditing, initialSource, children]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('creator_tutorial_completed', 'true');
    // Remover flag de dispensado se existir
    localStorage.removeItem('creator_tutorial_dismissed');
  };

  const handleTutorialDismiss = () => {
    // Só dispensar com confirmação
    const confirmed = window.confirm(
      'Tem certeza que deseja dispensar o tutorial?\n\n' +
      'Você pode acessá-lo novamente a qualquer momento. O tutorial ajuda a criar sua primeira atividade educativa.'
    );
    
    if (confirmed) {
      setShowTutorial(false);
      localStorage.setItem('creator_tutorial_dismissed', 'true');
      // Não marcar como completo, apenas dispensado
    }
  };

  const handleTutorialSkip = () => {
    // Esta função não é mais usada, mas mantida para compatibilidade
    // O botão X agora chama handleTutorialDismiss
    handleTutorialDismiss();
  };

  // Initialize grade and calculate ageRange from grade when user is parent
  useEffect(() => {
    if (userRole === 'parent' && children && children.length > 0) {
      const defaultGrade = getDefaultGrade();
      setGrade(defaultGrade);
      const ageRange = getAgeRangeFromGrade(defaultGrade);
      setMinAge(ageRange.min);
      setMaxAge(ageRange.max);
    }
  }, [children, userRole]);
  
  // Atualizar ageRange sempre que a série mudar
  useEffect(() => {
    if (grade) {
      const ageRange = getAgeRangeFromGrade(grade);
      setMinAge(ageRange.min);
      setMaxAge(ageRange.max);
    }
  }, [grade]);

  // Helper function to get available subjects based on education level
  const getAvailableSubjectsForLevel = (educationLevel?: string): string[] => {
    if (!educationLevel) {
      return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
    }

    switch (educationLevel) {
      case 'fundamental1':
      case 'fundamental2':
        return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
      case 'ensino-medio':
        return ['Matemática', 'Física', 'Química', 'Biologia', 'Português', 'Geografia', 'História', 'Inglês', 'Espanhol'];
      case 'pre-escola':
        return ['Matemática', 'Português', 'Arte', 'Psicomotricidade'];
      default:
        return ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
    }
  };

  // Quando alunos são selecionados, atualiza idade e série automaticamente
  useEffect(() => {
    if (userRole === 'parent' && children && children.length > 0) {
      // Se nenhum aluno está selecionado, não faz nada (permite que o usuário escolha)
      if (selectedChildIds.length === 0) {
        return;
      }

      // Pega os alunos selecionados
      const selectedChildren = children.filter(c => selectedChildIds.includes(c.id));
      
      if (selectedChildren.length > 0) {
        // Verifica se todos têm a mesma série
        const grades = selectedChildren.map(c => c.grade);
        const uniqueGrades = [...new Set(grades)];
        
        if (uniqueGrades.length === 1) {
          // Todos têm a mesma série - pode usar o conteúdo para todos
          setGrade(uniqueGrades[0]);
          
          // Calcular ageRange baseado na série (não mais na idade dos alunos)
          const ageRangeFromGrade = getAgeRangeFromGrade(uniqueGrades[0]);
          setMinAge(ageRangeFromGrade.min);
          setMaxAge(ageRangeFromGrade.max);

          // Atualiza matéria disponível baseado no educationLevel
          const firstChild = selectedChildren[0];
          if (firstChild.educationLevel) {
            const availableSubjects = getAvailableSubjectsForLevel(firstChild.educationLevel);
            // Se a matéria atual não está disponível, muda para a primeira disponível
            if (!availableSubjects.includes(subject)) {
              setSubject(availableSubjects[0] || 'Matemática');
            }
          }
        } else {
          // Séries diferentes - mantém apenas o primeiro selecionado
          setSelectedChildIds([selectedChildIds[0]]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChildIds, children, userRole]);

  // Adicionar um useEffect para atualizar ageRange quando grade mudar:
  useEffect(() => {
    if (grade) {
      const ageRangeFromGrade = getAgeRangeFromGrade(grade);
      setMinAge(ageRangeFromGrade.min);
      setMaxAge(ageRangeFromGrade.max);
    }
  }, [grade]);

  // Initialization Logic
  useEffect(() => {
    if (initialSource) {
      if (isEditing) {
        // Edit Mode: Pre-fill data
        setMode('edit');
        setTitle(initialSource.title);
        setDescription(initialSource.description);
        if (initialSource.subject) {
          setSubject(initialSource.subject);
        }
        setTopic(initialSource.title); // Fallback
        // For parents, only allow editing if grade matches children's grades
        if (userRole === 'parent' && children && children.length > 0) {
          const allowedGrades = getChildrenGrades();
          const editGrade = initialSource.grade && allowedGrades.includes(initialSource.grade) 
            ? initialSource.grade 
            : getDefaultGrade();
          setGrade(editGrade);
          // Calcular ageRange baseado na série
          const ageRangeFromGrade = getAgeRangeFromGrade(editGrade);
          setMinAge(ageRangeFromGrade.min);
          setMaxAge(ageRangeFromGrade.max);
        } else {
          // Para professores, usar a série do conteúdo ou calcular a partir da série
          const editGrade = initialSource.grade || '2º Ano Fund.';
          setGrade(editGrade);
          const ageRangeFromGrade = getAgeRangeFromGrade(editGrade);
          setMinAge(ageRangeFromGrade.min);
          setMaxAge(ageRangeFromGrade.max);
        }
        setContentType(initialSource.type);
        setPrice(initialSource.price);
        setKeywords(initialSource.keywords?.join(', ') || '');
        setVideoUrl(initialSource.resources?.videoUrl || '');
        setAudioUrl(initialSource.resources?.audioUrl || '');
      } else {
        // Remix Mode
        setMode('manual');
        if (userRole === 'parent' && children && children.length > 0) {
          const defaultGrade = getDefaultGrade();
          setGrade(defaultGrade);
          // Calcular ageRange baseado na série
          const ageRangeFromGrade = getAgeRangeFromGrade(defaultGrade);
          setMinAge(ageRangeFromGrade.min);
          setMaxAge(ageRangeFromGrade.max);
        } else {
          // Para professores, usar a série do conteúdo ou calcular a partir da série
          const remixGrade = initialSource.grade || '2º Ano Fund.';
          setGrade(remixGrade);
          const ageRangeFromGrade = getAgeRangeFromGrade(remixGrade);
          setMinAge(ageRangeFromGrade.min);
          setMaxAge(ageRangeFromGrade.max);
        }
        // Default to a different type for variety
        if (initialSource.type === 'story') setContentType('quiz');
        else if (initialSource.type === 'quiz') setContentType('summary');
        else setContentType('story');
      }
    }
  }, [initialSource, isEditing, children, userRole]);

  if (userPlan !== 'premium' && userRole !== 'teacher') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <Wand2 className="w-16 h-16 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Recurso Premium</h2>
        <p className="text-slate-600 max-w-md mb-6">
          A criação de conteúdo com IA Mágica está disponível apenas no plano Premium ou para Professores.
        </p>
        <button 
          onClick={onNavigateToSubscription}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
        >
          Fazer Upgrade Agora
        </button>
      </div>
    );
  }

  // For parents, check if they have children registered
  if (userRole === 'parent' && (!children || children.length === 0)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-slate-100 p-8 rounded-full mb-6">
          <Wand2 className="w-16 h-16 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Cadastre um Filho Primeiro</h2>
        <p className="text-slate-600 max-w-md mb-6">
          Para criar conteúdo, você precisa cadastrar pelo menos um filho no perfil. O conteúdo será criado automaticamente para a série do seu filho.
        </p>
        <button 
          onClick={() => window.location.hash = '#family'}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
        >
          Ir para Minha Família
        </button>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file: File) => {
        // Valida tipos de arquivo permitidos (apenas os suportados pelo Gemini API)
        const allowedTypes = [
          'image/', // Todas as imagens (inclui JPG, PNG, etc)
          'application/pdf'
        ];
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        const isAllowedType = allowedTypes.some(type => file.type.startsWith(type)) ||
          fileExtension === 'jpg' || fileExtension === 'jpeg' || 
          fileExtension === 'png' || fileExtension === 'gif' || 
          fileExtension === 'webp' || fileExtension === 'pdf';
        
        if (!isAllowedType) {
          alert(`Tipo de arquivo não suportado: ${file.name}.\n\nFormatos aceitos: PDF, JPG, JPEG, PNG, GIF, WEBP.\n\nArquivos DOC/DOCX não são suportados pela IA.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          // Normaliza mimeType
          let mimeType = file.type;
          if (!mimeType) {
            if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
              mimeType = 'image/jpeg';
            } else if (fileExtension === 'png') {
              mimeType = 'image/png';
            } else if (fileExtension === 'gif') {
              mimeType = 'image/gif';
            } else if (fileExtension === 'webp') {
              mimeType = 'image/webp';
            } else if (fileExtension === 'pdf') {
              mimeType = 'application/pdf';
            }
          }
          
          setFiles(prev => [...prev, {
            name: file.name,
            mimeType: mimeType || 'application/octet-stream',
            data: base64Data
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const response = await chatForCreation(chatHistory, userMsg);
      setChatHistory(prev => [...prev, { role: 'model', text: response || "..." }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  // Helper to extract text from structured content
  const extractSourceText = (item: ContentItem): string => {
    let text = `Title: ${item.title}\nDescription: ${item.description}\n`;
    
    if (item.type === 'story') {
      const data = item.data as any;
      text += data.chapters.map((c: any) => `${c.title}\n${c.text}`).join('\n');
    } else if (item.type === 'summary') {
      const data = item.data as any;
      text += `Explanation: ${data.simpleExplanation}\nPoints: ${data.keyPoints.join(', ')}`;
    } else if (item.type === 'quiz') {
      const data = item.data as any;
      text += data.questions.map((q: any) => `Q: ${q.question} A: ${q.explanation}`).join('\n');
    }
    return text;
  };

  const handleFinalGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Validações básicas
      if (!topic && !initialSource && mode !== 'edit') {
        setError('Por favor, informe o tema ou conteúdo base');
        setIsGenerating(false);
        return;
      }

      if (userRole === 'parent' && (!selectedChildIds || selectedChildIds.length === 0)) {
        setError('Por favor, selecione pelo menos um aluno para criar o conteúdo');
        setIsGenerating(false);
        return;
      }

      // Validar que grade está definido
      if (!grade) {
        setError('Erro: Série não foi definida. Por favor, selecione uma série.');
        setIsGenerating(false);
        return;
      }

      // Validar que subject está definido
      if (!subject) {
        setError('Erro: Matéria não foi selecionada. Por favor, selecione uma matéria.');
        setIsGenerating(false);
        return;
      }

      let promptToUse = topic;
      let sourceContext = undefined;

      let generatedData;
      let finalTitle = title;
      let finalDesc = description;

      if (mode === 'edit' && initialSource) {
         // Preserve content, update metadata
         generatedData = {
            title: title || initialSource.title,
            description: description || initialSource.description,
            content: initialSource.data 
         }
         finalTitle = generatedData.title;
         finalDesc = generatedData.description;
      } else {
        // Generation Logic
        if (initialSource && !isEditing) {
            sourceContext = extractSourceText(initialSource);
            promptToUse = `Derivado de: ${initialSource.title}`;
        } else if (mode === 'chat') {
            promptToUse = `Baseado nessa conversa: ${chatHistory.map(m => m.text).join('\n')}. Resuma o pedido e crie o conteúdo.`;
        }

        // Average age for generation prompt
        const avgAge = Math.round((minAge + maxAge) / 2);
        const response = await generateEducationalContent(promptToUse, avgAge, contentType, files, sourceContext, grade);
        
        // Verificar se precisa de confirmação
        if (response.needsConfirmation) {
          setError(response.confirmationMessage || 'Confirmação necessária antes de gerar conteúdo.');
          setIsGenerating(false);
          return;
        }
        
        // Validação da resposta
        if (!response.generated) {
          throw new Error('Resposta vazia do servidor. Tente novamente.');
        }
        
        if (!response.generated.title || !response.generated.description || !response.generated.content) {
          console.error('Resposta incompleta do servidor:', response.generated);
          throw new Error('Resposta incompleta do servidor. Tente novamente.');
        }
        
        generatedData = {
            title: response.generated.title,
            description: response.generated.description,
            content: response.generated.content
        };
        finalTitle = generatedData.title;
        finalDesc = generatedData.description;
      }
      
      // Calcular ageRange a partir da série
      const calculatedAgeRange = getAgeRangeFromGrade(grade);
      
      // Validação final: garantir que todos os campos obrigatórios estão presentes
      if (!finalTitle || !finalDesc) {
        setError('Erro: Título ou descrição não foram gerados. Tente gerar novamente.');
        setIsGenerating(false);
        return;
      }

      if (!generatedData || !generatedData.content) {
        setError('Erro: Conteúdo gerado está incompleto. Tente gerar novamente.');
        setIsGenerating(false);
        return;
      }
      
      if (!calculatedAgeRange || !calculatedAgeRange.min || !calculatedAgeRange.max) {
        setError('Erro: Não foi possível calcular a faixa etária. Verifique a série selecionada.');
        setIsGenerating(false);
        return;
      }

      // Validação final antes de criar o objeto
      if (!grade || grade.trim() === '') {
        setError('Erro: Série não foi definida. Por favor, selecione uma série.');
        setIsGenerating(false);
        return;
      }

      if (!subject || subject.trim() === '') {
        setError('Erro: Matéria não foi selecionada. Por favor, selecione uma matéria.');
        setIsGenerating(false);
        return;
      }

      // Validação do tipo de conteúdo
      if (!contentType) {
        setError('Erro: Tipo de conteúdo não foi selecionado.');
        setIsGenerating(false);
        return;
      }

      // Log para debug
      console.log('Criando conteúdo com:', {
        title: finalTitle,
        description: finalDesc,
        type: contentType,
        subject: subject,
        grade: grade,
        ageRange: calculatedAgeRange,
        data: generatedData.content ? 'presente' : 'ausente'
      });

      // Garantir que todos os campos obrigatórios estão presentes antes de criar o objeto
      const contentData = generatedData.content;
      if (!contentData) {
        setError('Erro: Dados do conteúdo não foram gerados. Tente novamente.');
        setIsGenerating(false);
        return;
      }

      const newContent: ContentItem = {
        id: isEditing && initialSource ? initialSource.id : Date.now().toString(),
        title: finalTitle.trim(),
        description: finalDesc.trim(),
        type: contentType,
        authorId: userRole === 'teacher' ? 't1' : 'u1', // Será substituído pelo ID real do backend
        authorName: userRole === 'teacher' ? 'Prof. Você' : 'Você',
        authorRole: userRole,
        createdAt: new Date().toISOString(),
        subject: subject.trim(), // Usa a matéria selecionada
        ageRange: calculatedAgeRange, // Calcula automaticamente a partir da série
        grade: grade.trim(), // Garantir que grade não seja undefined e remover espaços
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [],
        resources: {
            videoUrl: videoUrl || '',
            audioUrl: audioUrl || ''
        },
        isAiGenerated: !isEditing,
        price: 0, // Conteúdo criado por pais sempre é gratuito para seus filhos
        salesCount: isEditing && initialSource ? initialSource.salesCount : 0,
        data: contentData // Dados do conteúdo gerado
      };

      // Validação final do objeto antes de enviar
      if (!newContent.title || !newContent.description || !newContent.type || 
          !newContent.subject || !newContent.ageRange || !newContent.grade || !newContent.data) {
        console.error('Conteúdo incompleto:', {
          title: !!newContent.title,
          description: !!newContent.description,
          type: !!newContent.type,
          subject: !!newContent.subject,
          ageRange: !!newContent.ageRange,
          grade: !!newContent.grade,
          data: !!newContent.data
        });
        setError('Erro: Alguns campos obrigatórios estão faltando. Verifique os dados e tente novamente.');
        setIsGenerating(false);
        return;
      }

      // Show refinement modal for AI-generated content
      if (!isEditing) {
        setGeneratedContent(newContent);
        setShowRefinement(true);
      } else {
        // Marcar tutorial como completo quando o conteúdo for criado
        if (userRole === 'parent' && !hasCreatedContent) {
          localStorage.setItem('creator_tutorial_completed', 'true');
          localStorage.removeItem('creator_tutorial_dismissed');
          setShowTutorial(false);
        }
        onContentCreated(newContent);
      }
    } catch (err: any) {
      console.error("Erro na geração:", err);
      let errorMessage = err.message || "Ops! Ocorreu um erro ao processar. Tente novamente.";
      
      // Melhorar mensagens de erro específicas
      if (errorMessage.includes('GEMINI_API_KEY')) {
        errorMessage = "Erro de configuração: A chave da API do Gemini não está configurada no servidor.";
      } else if (errorMessage.includes('Unsupported MIME type')) {
        errorMessage = "Tipo de arquivo não suportado. Use apenas PDF ou imagens (JPG, PNG).";
      } else if (errorMessage.includes('400 Bad Request')) {
        errorMessage = "Erro na requisição. Verifique os arquivos enviados e tente novamente.";
      } else if (errorMessage.includes('403')) {
        errorMessage = "Você não tem permissão para gerar conteúdo. Faça upgrade para Premium.";
      } else if (errorMessage.includes('401')) {
        errorMessage = "Sessão expirada. Faça login novamente.";
      }
      
      setError(errorMessage);
      alert(`Erro ao criar conteúdo: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    // Marcar tutorial como completo quando conteúdo for criado
    if (userRole === 'parent' && !hasCreatedContent) {
      localStorage.setItem('creator_tutorial_completed', 'true');
      localStorage.removeItem('creator_tutorial_dismissed');
      setShowTutorial(false);
    }
    onContentCreated(refinedContent);
    setShowRefinement(false);
    setGeneratedContent(null);
  };

  const handleRefinementSkip = () => {
    if (generatedContent) {
      // Marcar tutorial como completo quando conteúdo for criado
      if (userRole === 'parent' && !hasCreatedContent) {
        localStorage.setItem('creator_tutorial_completed', 'true');
        localStorage.removeItem('creator_tutorial_dismissed');
        setShowTutorial(false);
      }
      onContentCreated(generatedContent);
    }
    setShowRefinement(false);
    setGeneratedContent(null);
  };


  // Função para resetar tutorial (útil para testes)
  const resetTutorial = () => {
    localStorage.removeItem('creator_tutorial_completed');
    localStorage.removeItem('creator_tutorial_dismissed');
    setShowTutorial(true);
  };

  // Expor função globalmente para debug (apenas em desenvolvimento)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).resetTutorial = resetTutorial;
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in creator-studio-container">
      {/* Tutorial */}
      {showTutorial && (
        <CreatorTutorial
          isVisible={showTutorial}
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
          onDismiss={handleTutorialDismiss}
          hasChildren={children && children.length > 0}
          onNavigateToFamily={onNavigateToFamily}
        />
      )}
      {/* Refinement Modal */}
      {showRefinement && generatedContent && (
        <ContentRefinement
          content={generatedContent}
          onRefined={handleRefinementComplete}
          onClose={handleRefinementSkip}
          files={files}
          grade={grade}
          age={Math.round((minAge + maxAge) / 2)}
        />
      )}
      
      {isEditing && (
          <div className="mb-4 flex items-center gap-2 text-indigo-900">
             <button onClick={onCancelRemix} className="p-2 hover:bg-indigo-50 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
             <h2 className="text-2xl font-black font-fredoka">Editar Atividade</h2>
          </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden">
        
        {/* Remix Header */}
        {initialSource && !isEditing ? (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <RotateCw className="w-6 h-6 animate-spin-slow" />
                  <div>
                    <h3 className="font-bold text-lg">Modo Remix Mágico</h3>
                    <p className="text-purple-200 text-sm">Criando novo conteúdo baseado em: <strong>{initialSource.title}</strong></p>
                  </div>
               </div>
               <button onClick={onCancelRemix} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                 <X className="w-5 h-5" />
               </button>
            </div>
        ) : !isEditing && (
            <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setMode('manual')}
                    className={`flex-1 p-6 flex items-center justify-center gap-2 font-bold transition ${mode === 'manual' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Wand2 className="w-5 h-5" /> Criação Rápida
                </button>
                <button 
                    onClick={() => setMode('chat')}
                    className={`flex-1 p-6 flex items-center justify-center gap-2 font-bold transition ${mode === 'chat' ? 'text-purple-600 bg-purple-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <MessageCircle className="w-5 h-5" /> Chat Mágico
                </button>
            </div>
        )}

        <div className="p-8">
          
          {/* Metadata Fields (Visible in Edit Mode or Creation) */}
          {mode === 'edit' && (
             <div className="space-y-4 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <h3 className="font-bold text-slate-700 mb-2">Informações Básicas</h3>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 bg-white" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white" />
                 </div>
             </div>
          )}

          {/* Common Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Atividade</label>
               <div className="flex gap-2" data-tutorial="content-type">
                  {(() => {
                    // Determinar tipos de conteúdo disponíveis baseado no educationLevel
                    let availableTypes: ContentType[] = ['story', 'quiz', 'summary', 'game'];
                    
                    // Se for pai e tiver aluno selecionado, verificar educationLevel
                    if (userRole === 'parent' && selectedChildIds.length > 0 && children) {
                      const selectedChild = children.find(c => selectedChildIds.includes(c.id));
                      if (selectedChild?.educationLevel) {
                        // Para Ensino Médio, remover 'story' (histórias são proibidas)
                        if (selectedChild.educationLevel === 'ensino-medio') {
                          availableTypes = ['quiz', 'summary', 'game'];
                        }
                      }
                    } else if (userRole === 'parent' && children && children.length > 0) {
                      // Se não tiver aluno selecionado, verificar o primeiro aluno
                      const firstChild = children[0];
                      if (firstChild.educationLevel === 'ensino-medio') {
                        availableTypes = ['quiz', 'summary', 'game'];
                      }
                    }
                    
                    // Se o tipo atual não estiver disponível, mudar para o primeiro disponível
                    if (!availableTypes.includes(contentType)) {
                      setTimeout(() => setContentType(availableTypes[0]), 0);
                    }
                    
                    return availableTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => setContentType(t)}
                        disabled={mode === 'edit'} // Lock type when editing for now
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold capitalize transition ${contentType === t ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-50'}`}
                      >
                        {t === 'story' ? 'História' : t === 'quiz' ? 'Quiz' : t === 'summary' ? 'Resumo' : 'Jogo'}
                      </button>
                    ));
                  })()}
               </div>
            </div>
            
            <div className="space-y-4">
                 {/* Child Selection - para pais */}
                 {userRole === 'parent' && children && children.length > 0 && (
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-3">
                       Selecionar Aluno(s)
                     </label>
                     <div className="flex gap-3 flex-wrap" data-tutorial="student-selection">
                       {children.map(child => {
                         const childAge = child.birthDate ? calculateAge(child.birthDate) : child.age;
                         const isSelected = selectedChildIds.includes(child.id);
                         
                         // Verifica se pode selecionar este aluno (mesma série dos já selecionados)
                         const selectedChildren = children.filter(c => selectedChildIds.includes(c.id));
                         const canSelect = selectedChildIds.length === 0 || 
                           (selectedChildren.length > 0 && selectedChildren[0].grade === child.grade);
                         
                         return (
                           <button
                             key={child.id}
                             type="button"
                             onClick={() => {
                               if (isSelected) {
                                 // Deseleciona
                                 setSelectedChildIds(prev => prev.filter(id => id !== child.id));
                               } else if (canSelect) {
                                 // Seleciona (apenas se for da mesma série)
                                 setSelectedChildIds(prev => [...prev, child.id]);
                               }
                             }}
                             disabled={!isSelected && !canSelect}
                             className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full border-2 transition-all whitespace-nowrap ${
                               isSelected 
                                 ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                                 : canSelect
                                 ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                 : 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                             }`}
                             title={!canSelect && !isSelected ? 'Selecione apenas alunos da mesma série' : ''}
                           >
                             <img 
                               src={child.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`} 
                               alt={child.name} 
                               className="w-8 h-8 rounded-full bg-white border border-slate-200" 
                             />
                             <div className="text-left">
                               <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                                 {child.name}
                               </p>
                               <p className="text-[10px] text-slate-400 leading-tight">
                                 {child.grade} {childAge !== undefined && childAge !== null ? `• ${childAge} anos` : ''}
                               </p>
                             </div>
                           </button>
                         );
                       })}
                     </div>
                     {selectedChildIds.length > 0 ? (
                       <p className="text-xs text-indigo-600 mt-2 font-medium">
                         {selectedChildIds.length === 1 
                           ? '✓ O conteúdo será criado especificamente para este aluno'
                           : `✓ O conteúdo será criado para ${selectedChildIds.length} alunos da mesma série`}
                       </p>
                     ) : (
                       <p className="text-xs text-slate-500 mt-2 font-medium">
                         ℹ️ Nenhum aluno selecionado. Selecione um ou mais alunos da mesma série.
                       </p>
                     )}
                   </div>
                 )}

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Matéria
                      {userRole === 'parent' && selectedChildIds.length > 0 && (
                        <span className="text-xs text-indigo-600 font-normal ml-2">✓ Filtrada pela série do aluno</span>
                      )}
                    </label>
                    <select 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white"
                      data-tutorial="subject"
                    >
                      {(() => {
                        // Obtém matérias disponíveis baseado no educationLevel do aluno selecionado
                        let availableSubjects: string[] = [];
                        if (userRole === 'parent' && selectedChildIds.length > 0 && children) {
                          const selectedChild = children.find(c => selectedChildIds.includes(c.id));
                          if (selectedChild?.educationLevel) {
                            availableSubjects = getAvailableSubjectsForLevel(selectedChild.educationLevel);
                          } else {
                            availableSubjects = ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
                          }
                        } else if (userRole === 'parent' && children && children.length > 0) {
                          // Se não há aluno selecionado, usa o primeiro filho
                          const firstChild = children[0];
                          if (firstChild.educationLevel) {
                            availableSubjects = getAvailableSubjectsForLevel(firstChild.educationLevel);
                          } else {
                            availableSubjects = ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês'];
                          }
                        } else {
                          // Professor ou sem filhos: todas as matérias
                          availableSubjects = ['Matemática', 'Ciências', 'Português', 'Geografia', 'História', 'Inglês', 'Física', 'Química', 'Biologia', 'Filosofia', 'Arte', 'Espanhol', 'Psicomotricidade', 'Redação'];
                        }
                        return availableSubjects.map(s => <option key={s} value={s}>{s}</option>);
                      })()}
                    </select>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Série
                      {userRole === 'parent' && children && children.length > 0 && (
                        <span className="text-xs text-slate-500 font-normal ml-2">(apenas séries dos seus filhos)</span>
                      )}
                    </label>
                    {userRole === 'parent' && children && children.length > 0 ? (
                      <select 
                        value={grade} 
                        onChange={(e) => setGrade(e.target.value)} 
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white"
                      >
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : (
                      <select 
                        value={grade} 
                        onChange={(e) => setGrade(e.target.value)} 
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white"
                      >
                        {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    )}
                    {userRole === 'parent' && children && children.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ Você precisa cadastrar pelo menos um filho para criar conteúdo
                      </p>
                    )}
                 </div>
            </div>
          </div>

          {/* Teacher Specific Resources */}
          {userRole === 'teacher' && (
            <div className="space-y-4 mb-8 border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                   <Paperclip className="w-5 h-5 text-indigo-500" /> Recursos & Metadados
                </h4>
                
                {/* Keywords */}
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Palavras-chave (separadas por vírgula)</label>
                   <div className="relative">
                      <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        placeholder="Ex: fotossíntese, plantas, biologia"
                        className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                      />
                   </div>
                </div>

                {/* Multimedia Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link de Vídeo (YouTube/Vimeo)</label>
                        <div className="relative">
                            <Video className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link de Áudio/Podcast</label>
                        <div className="relative">
                            <Volume2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <input 
                                value={audioUrl}
                                onChange={e => setAudioUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Price for Teachers */}
          {userRole === 'teacher' && (
            <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-orange-200 p-2 rounded-lg text-orange-700"><Coins className="w-5 h-5"/></div>
                 <div>
                   <h4 className="font-bold text-orange-900">Vender na Loja</h4>
                   <p className="text-xs text-orange-700">Defina o preço em moedas.</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-900">C$</span>
                <input 
                  type="number" 
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseInt(e.target.value))}
                  className="w-20 p-2 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none font-bold bg-white"
                />
              </div>
            </div>
          )}

          {/* Content Generation Input */}
          {mode !== 'edit' && (
            <>
                {mode === 'manual' && !initialSource && (
                    <div className="space-y-6 animate-fade-in">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tema ou Conteúdo Base</label>
                        <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Explique o ciclo da água..."
                        className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none h-32 resize-none transition bg-white"
                        data-tutorial="topic"
                        />
                    </div>
                    </div>
                )}
                
                {mode === 'chat' && !initialSource && (
                    <div className="h-80 flex flex-col animate-fade-in border border-slate-200 rounded-xl mb-6">
                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {chatHistory.length === 0 && (
                        <div className="text-center text-slate-400 mt-10">
                            <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Olá, Professor(a)! <br/>Posso ajudar a criar um plano de aula ou atividade?</p>
                        </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'}`}>
                            {msg.text}
                            </div>
                        </div>
                        ))}
                        {isChatting && <div className="text-slate-400 text-xs italic ml-2">Digitando...</div>}
                    </div>
                    <div className="p-2 bg-white border-t border-slate-200 flex gap-2">
                        <input 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Descreva a atividade..."
                        className="flex-1 p-2 pl-4 rounded-full bg-slate-100 focus:bg-white focus:ring-2 focus:ring-purple-200 outline-none transition"
                        />
                        <button onClick={handleChatSend} disabled={!chatInput.trim() || isChatting} className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50">
                            <MessageCircle className="w-5 h-5" />
                        </button>
                    </div>
                    </div>
                )}
                
                {/* File Upload for Context (Only Manual Creation) */}
                {mode === 'manual' && !initialSource && (
                    <div className="mt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                        Material de Base (PDF/Imagem)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        {files.map((f, i) => (
                            <div key={i} className="relative group bg-slate-100 rounded-lg p-2 flex flex-col items-center justify-center h-24 border border-slate-200">
                                {(f.mimeType.startsWith('image/') || f.mimeType === 'image/jpeg' || f.mimeType === 'image/jpg') ? (
                                <img src={`data:${f.mimeType};base64,${f.data}`} alt="preview" className="h-16 object-contain" />
                                ) : (
                                <FileType className="h-12 w-12 text-red-500" />
                                )}
                                <span className="text-xs text-slate-500 truncate w-full text-center mt-1">{f.name}</span>
                                <button onClick={() => removeFile(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition">
                                <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition"
                        >
                            <Paperclip className="w-6 h-6 mb-1" />
                            <span className="text-xs font-bold">Adicionar</span>
                        </div>
                        </div>
                        <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf,.jpg,.jpeg,.png,.gif,.webp,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        />
                    </div>
                )}
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <X className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={handleFinalGenerate}
            disabled={isGenerating || (mode === 'manual' && !topic && !initialSource && mode !== 'edit')}
            className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:scale-[1.01] transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            data-tutorial="generate-button"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {isEditing ? 'Salvando...' : 'Criando Magia...'}
              </>
            ) : (
              <>
                {isEditing ? <Save className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                {isEditing ? 'Salvar Alterações' : initialSource ? 'Gerar Derivado' : mode === 'chat' ? 'Gerar' : 'Criar Conteúdo'}
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CreatorStudio;
