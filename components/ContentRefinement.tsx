import React, { useState } from 'react';
import { ContentItem } from '../types';
import { Sparkles, MessageSquare, Wand2, X, Send, Loader2 } from 'lucide-react';
import { REFINEMENT_OPTIONS } from '../services/refinementService';
import { generateEducationalContent } from '../services/geminiService';

interface ContentRefinementProps {
  content: ContentItem;
  onRefined: (refinedContent: ContentItem) => void;
  onClose: () => void;
  files: any[];
  grade?: string;
  age: number;
}

const ContentRefinement: React.FC<ContentRefinementProps> = ({
  content,
  onRefined,
  onClose,
  files,
  grade,
  age
}) => {
  const [refinementMode, setRefinementMode] = useState<'options' | 'chat'>('options');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [customRequest, setCustomRequest] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickRefinement = async (optionId: string) => {
    const option = REFINEMENT_OPTIONS.find(opt => opt.id === optionId);
    if (!option) return;

    setIsRefining(true);
    setError(null);
    setSelectedOption(optionId);

    try {
      // Extract current content text for context
      let currentContentText = '';
      if (content.type === 'story') {
        const data = content.data as any;
        currentContentText = data.chapters?.map((ch: any) => `${ch.title}\n${ch.text}`).join('\n\n') || '';
      } else if (content.type === 'quiz') {
        const data = content.data as any;
        currentContentText = data.questions?.map((q: any) => {
          let questionText = q.question || '';
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            questionText += `\n${q.options.join(', ')}`;
          }
          if (q.explanation) {
            questionText += `\nResposta: ${q.explanation}`;
          }
          return questionText;
        }).join('\n\n') || '';
      } else if (content.type === 'summary') {
        const data = content.data as any;
        const keyPoints = data.keyPoints && Array.isArray(data.keyPoints) ? data.keyPoints.join(', ') : '';
        currentContentText = `${data.simpleExplanation || ''}\n\n${keyPoints ? `Pontos-chave: ${keyPoints}\n\n` : ''}${data.funFact ? `Curiosidade: ${data.funFact}` : ''}`;
      }

      const avgAge = Math.round(age);
      const response = await generateEducationalContent(
        content.title,
        avgAge,
        content.type,
        files,
        currentContentText,
        grade,
        option.prompt
      );

      // Verificar se precisa de confirmação
      if (response.needsConfirmation) {
        setError(response.confirmationMessage || 'Confirmação necessária');
        setIsRefining(false);
        setSelectedOption(null);
        return;
      }

      // Verificar se o conteúdo foi gerado
      if (!response.generated || !response.generated.content) {
        setError('Erro: Conteúdo não foi gerado corretamente. Tente novamente.');
        setIsRefining(false);
        setSelectedOption(null);
        return;
      }

      const refinedContent: ContentItem = {
        ...content,
        title: response.generated.title || content.title,
        description: response.generated.description || content.description,
        data: response.generated.content
      };

      onRefined(refinedContent);
    } catch (err: any) {
      console.error("Erro no refinamento:", err);
      setError(err.message || "Erro ao refinar conteúdo. Tente novamente.");
    } finally {
      setIsRefining(false);
      setSelectedOption(null);
    }
  };

  const handleCustomRefinement = async () => {
    if (!customRequest.trim()) return;

    setIsRefining(true);
    setError(null);

    try {
      // Extract current content text for context
      let currentContentText = '';
      if (content.type === 'story') {
        const data = content.data as any;
        currentContentText = data.chapters?.map((ch: any) => `${ch.title}\n${ch.text}`).join('\n\n') || '';
      } else if (content.type === 'quiz') {
        const data = content.data as any;
        currentContentText = data.questions?.map((q: any) => {
          let questionText = q.question || '';
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            questionText += `\n${q.options.join(', ')}`;
          }
          if (q.explanation) {
            questionText += `\nResposta: ${q.explanation}`;
          }
          return questionText;
        }).join('\n\n') || '';
      } else if (content.type === 'summary') {
        const data = content.data as any;
        const keyPoints = data.keyPoints && Array.isArray(data.keyPoints) ? data.keyPoints.join(', ') : '';
        currentContentText = `${data.simpleExplanation || ''}\n\n${keyPoints ? `Pontos-chave: ${keyPoints}\n\n` : ''}${data.funFact ? `Curiosidade: ${data.funFact}` : ''}`;
      }

      const avgAge = Math.round(age);
      const response = await generateEducationalContent(
        content.title,
        avgAge,
        content.type,
        files,
        currentContentText,
        grade,
        customRequest
      );

      // Verificar se precisa de confirmação
      if (response.needsConfirmation) {
        setError(response.confirmationMessage || 'Confirmação necessária');
        setIsRefining(false);
        return;
      }

      // Verificar se o conteúdo foi gerado
      if (!response.generated || !response.generated.content) {
        setError('Erro: Conteúdo não foi gerado corretamente. Tente novamente.');
        setIsRefining(false);
        return;
      }

      const refinedContent: ContentItem = {
        ...content,
        title: response.generated.title || content.title,
        description: response.generated.description || content.description,
        data: response.generated.content
      };

      onRefined(refinedContent);
      setCustomRequest('');
    } catch (err: any) {
      console.error("Erro no refinamento:", err);
      setError(err.message || "Erro ao refinar conteúdo. Tente novamente.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isRefining) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory([...chatHistory, { role: 'user', text: userMessage }]);
    setIsRefining(true);
    setError(null);

    try {
      // Simulate AI response (in real app, this would call the chat API)
      const aiResponse = `Entendi! Você quer: "${userMessage}". Vou aplicar essas melhorias ao conteúdo.`;
      setChatHistory(prev => [...prev, { role: 'model', text: aiResponse }]);

      // Extract current content text for context
      let currentContentText = '';
      if (content.type === 'story') {
        const data = content.data as any;
        currentContentText = data.chapters?.map((ch: any) => `${ch.title}\n${ch.text}`).join('\n\n') || '';
      } else if (content.type === 'quiz') {
        const data = content.data as any;
        currentContentText = data.questions?.map((q: any) => {
          let questionText = q.question || '';
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            questionText += `\n${q.options.join(', ')}`;
          }
          if (q.explanation) {
            questionText += `\nResposta: ${q.explanation}`;
          }
          return questionText;
        }).join('\n\n') || '';
      } else if (content.type === 'summary') {
        const data = content.data as any;
        const keyPoints = data.keyPoints && Array.isArray(data.keyPoints) ? data.keyPoints.join(', ') : '';
        currentContentText = `${data.simpleExplanation || ''}\n\n${keyPoints ? `Pontos-chave: ${keyPoints}\n\n` : ''}${data.funFact ? `Curiosidade: ${data.funFact}` : ''}`;
      }

      // Apply refinement
      const avgAge = Math.round(age);
      const response = await generateEducationalContent(
        content.title,
        avgAge,
        content.type,
        files,
        currentContentText,
        grade,
        userMessage
      );

      // Verificar se precisa de confirmação
      if (response.needsConfirmation) {
        setError(response.confirmationMessage || 'Confirmação necessária');
        setIsRefining(false);
        setChatHistory(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
        return;
      }

      // Verificar se o conteúdo foi gerado
      if (!response.generated || !response.generated.content) {
        setError('Erro: Conteúdo não foi gerado corretamente. Tente novamente.');
        setIsRefining(false);
        setChatHistory(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
        return;
      }

      const refinedContent: ContentItem = {
        ...content,
        title: response.generated.title || content.title,
        description: response.generated.description || content.description,
        data: response.generated.content
      };

      onRefined(refinedContent);
    } catch (err: any) {
      console.error("Erro no refinamento:", err);
      setError(err.message || "Erro ao refinar conteúdo. Tente novamente.");
      setChatHistory(prev => [...prev, { role: 'model', text: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 font-fredoka">Refinar Conteúdo</h2>
              <p className="text-sm text-slate-500">Melhore seu conteúdo com a IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setRefinementMode('options')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition ${
                refinementMode === 'options'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Opções Rápidas
            </button>
            <button
              onClick={() => setRefinementMode('chat')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition ${
                refinementMode === 'chat'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Conversar com IA
            </button>
          </div>

          {refinementMode === 'options' ? (
            <>
              {/* Quick Options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {REFINEMENT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    onClick={() => handleQuickRefinement(option.id)}
                    disabled={isRefining}
                    className={`p-4 border-2 rounded-xl text-left transition ${
                      selectedOption === option.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    } ${isRefining ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-bold text-slate-900 mb-1">{option.label}</div>
                    <div className="text-xs text-slate-600">{option.description}</div>
                  </button>
                ))}
              </div>

              {/* Custom Request */}
              <div className="border-t border-slate-200 pt-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Ou descreva o que você quer melhorar:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomRefinement()}
                    placeholder="Ex: Adicionar mais exercícios sobre multiplicação..."
                    className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={isRefining}
                  />
                  <button
                    onClick={handleCustomRefinement}
                    disabled={isRefining || !customRequest.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRefining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Aplicar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Chat Interface */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold mb-2">Converse com a IA</p>
                    <p className="text-sm">Explique o que você quer melhorar no conteúdo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-xl ${
                            msg.role === 'user'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isRefining && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-3 rounded-xl">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ex: Quero que o conteúdo seja mais interativo e tenha mais exemplos práticos..."
                  className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={isRefining}
                />
                <button
                  onClick={handleChatSend}
                  disabled={isRefining || !chatInput.trim()}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRefining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentRefinement;

