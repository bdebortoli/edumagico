
import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Upload, Loader2, FileType, BookOpen, BrainCircuit, Sparkles, X, MessageCircle, Coins, Paperclip, RotateCw, ArrowLeft, Save, Video, Volume2, Tag } from 'lucide-react';
import { generateEducationalContent, chatForCreation } from '../services/geminiService';
import { ContentType, ContentItem, FileAttachment, UserRole } from '../types';
import ContentRefinement from './ContentRefinement';

interface CreatorStudioProps {
  onContentCreated: (content: ContentItem) => void;
  userPlan: string;
  userRole: UserRole;
  initialSource?: ContentItem | null;
  onCancelRemix?: () => void;
}

const GRADE_OPTIONS = [
  "Pré-escola", 
  "1º Ano Fund.", "2º Ano Fund.", "3º Ano Fund.", "4º Ano Fund.", "5º Ano Fund.",
  "6º Ano Fund.", "7º Ano Fund.", "8º Ano Fund.", "9º Ano Fund.",
  "1º Ano Médio", "2º Ano Médio", "3º Ano Médio"
];

const CreatorStudio: React.FC<CreatorStudioProps> = ({ onContentCreated, userPlan, userRole, initialSource, onCancelRemix }) => {
  // Mode: 'manual' = form based gen, 'chat' = chat gen, 'edit' = editing existing content manually/hybrid
  const [mode, setMode] = useState<'manual' | 'chat' | 'edit'>('manual');
  
  // Form State
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState(''); // Used for manual edit
  const [description, setDescription] = useState(''); // Used for manual edit
  
  // Age Range State
  const [minAge, setMinAge] = useState<number>(6);
  const [maxAge, setMaxAge] = useState<number>(8);

  const [grade, setGrade] = useState<string>('2º Ano Fund.');
  const [keywords, setKeywords] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>('story');
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Initialization Logic
  useEffect(() => {
    if (initialSource) {
      if (isEditing) {
        // Edit Mode: Pre-fill data
        setMode('edit');
        setTitle(initialSource.title);
        setDescription(initialSource.description);
        setTopic(initialSource.title); // Fallback
        setMinAge(initialSource.ageRange.min);
        setMaxAge(initialSource.ageRange.max);
        setGrade(initialSource.grade || '2º Ano Fund.');
        setContentType(initialSource.type);
        setPrice(initialSource.price);
        setKeywords(initialSource.keywords?.join(', ') || '');
        setVideoUrl(initialSource.resources?.videoUrl || '');
        setAudioUrl(initialSource.resources?.audioUrl || '');
      } else {
        // Remix Mode
        setMode('manual');
        setMinAge(initialSource.ageRange.min);
        setMaxAge(initialSource.ageRange.max);
        setGrade(initialSource.grade || '2º Ano Fund.');
        // Default to a different type for variety
        if (initialSource.type === 'story') setContentType('quiz');
        else if (initialSource.type === 'quiz') setContentType('summary');
        else setContentType('story');
      }
    }
  }, [initialSource, isEditing]);

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
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
          Fazer Upgrade Agora
        </button>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          
          setFiles(prev => [...prev, {
            name: file.name,
            mimeType: file.type,
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
        generatedData = {
            title: response.title,
            description: response.description,
            content: response.content
        };
        finalTitle = generatedData.title;
        finalDesc = generatedData.description;
      }
      
      const newContent: ContentItem = {
        id: isEditing && initialSource ? initialSource.id : Date.now().toString(),
        title: finalTitle,
        description: finalDesc,
        type: contentType,
        authorId: userRole === 'teacher' ? 't1' : 'u1', // Mock ID from DB in real app
        authorName: userRole === 'teacher' ? 'Prof. Você' : 'Você',
        authorRole: userRole,
        createdAt: new Date().toISOString(),
        subject: initialSource && !isEditing ? initialSource.subject : 'Geral', // Simple subject logic
        ageRange: { min: minAge, max: maxAge },
        grade: grade,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        resources: {
            videoUrl: videoUrl,
            audioUrl: audioUrl
        },
        isAiGenerated: !isEditing,
        price: userRole === 'teacher' ? price : 0,
        salesCount: isEditing && initialSource ? initialSource.salesCount : 0,
        data: generatedData.content
      };

      // Show refinement modal for AI-generated content
      if (!isEditing) {
        setGeneratedContent(newContent);
        setShowRefinement(true);
      } else {
        onContentCreated(newContent);
      }
    } catch (err: any) {
      console.error("Erro na geração:", err);
      const errorMessage = err.message || "Ops! Ocorreu um erro ao processar. Tente novamente.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinementComplete = (refinedContent: ContentItem) => {
    onContentCreated(refinedContent);
    setShowRefinement(false);
    setGeneratedContent(null);
  };

  const handleRefinementSkip = () => {
    if (generatedContent) {
      onContentCreated(generatedContent);
    }
    setShowRefinement(false);
    setGeneratedContent(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
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
               <div className="flex gap-2">
                  {(['story', 'quiz', 'summary'] as ContentType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setContentType(t)}
                      disabled={mode === 'edit'} // Lock type when editing for now
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold capitalize transition ${contentType === t ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300 disabled:opacity-50'}`}
                    >
                      {t === 'story' ? 'História' : t === 'quiz' ? 'Quiz' : 'Resumo'}
                    </button>
                  ))}
               </div>
            </div>
            
            <div className="space-y-4">
                 {/* Age Range Selection */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Faixa Etária Recomendada</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <input 
                                type="number" min="2" max="18"
                                value={minAge}
                                onChange={(e) => setMinAge(Number(e.target.value))}
                                className="w-full p-2 pl-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white"
                            />
                            <span className="absolute right-2 top-2 text-xs text-slate-400">anos</span>
                        </div>
                        <span className="text-slate-400 font-bold">até</span>
                        <div className="relative flex-1">
                            <input 
                                type="number" min={minAge} max="18"
                                value={maxAge}
                                onChange={(e) => setMaxAge(Number(e.target.value))}
                                className="w-full p-2 pl-3 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white"
                            />
                            <span className="absolute right-2 top-2 text-xs text-slate-400">anos</span>
                        </div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Série</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 bg-white">
                        {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
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
                        Material de Base (PDF/Imagem do Livro)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        {files.map((f, i) => (
                            <div key={i} className="relative group bg-slate-100 rounded-lg p-2 flex flex-col items-center justify-center h-24 border border-slate-200">
                                {f.mimeType.startsWith('image/') ? (
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
                        accept="image/*,application/pdf"
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
