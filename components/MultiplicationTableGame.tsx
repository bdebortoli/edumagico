import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface MultiplicationTableGameProps {
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

interface CellState {
  revealed: boolean; // Se a equação foi revelada
  isCorrect: boolean | null; // null = não respondido, true = correto, false = errado
  userAnswer?: string; // Resposta do usuário (só guarda se errou)
}

const MultiplicationTableGame: React.FC<MultiplicationTableGameProps> = ({ onComplete, onBack }) => {
  const [cellsState, setCellsState] = useState<Map<string, CellState>>(new Map());
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

  const getCellValue = (row: number, col: number): number => {
    return row * col;
  };

  const getCellKey = (row: number, col: number): string => {
    return `${row}-${col}`;
  };

  const handleCellClick = (row: number, col: number) => {
    const cellKey = getCellKey(row, col);
    const cellState = cellsState.get(cellKey);
    
    // Se já foi respondida (correta ou errada), não permite nova tentativa
    if (cellState && cellState.isCorrect !== null) {
      return;
    }

    // Revela a equação e seleciona a célula
    setCellsState(prev => {
      const newMap = new Map(prev);
      newMap.set(cellKey, {
        revealed: true,
        isCorrect: null
      });
      return newMap;
    });
    
    // Seleciona a célula para resposta
    setSelectedCell(cellKey);
    setInputValue('');
  };

  const handleSubmitAnswer = () => {
    if (!selectedCell || !inputValue.trim()) return;

    const cellState = cellsState.get(selectedCell);
    if (!cellState || cellState.isCorrect !== null) return; // Já respondida

    const userAnswer = inputValue.trim();
    const [row, col] = selectedCell.split('-').map(n => parseInt(n));
    const correctAnswer = getCellValue(row, col).toString();
    const isCorrect = userAnswer === correctAnswer;

    setCellsState(prev => {
      const newMap = new Map(prev);
      newMap.set(selectedCell, {
        ...cellState,
        isCorrect,
        userAnswer: isCorrect ? undefined : userAnswer // Só guarda se errou
      });
      return newMap;
    });

    if (isCorrect) {
      const newScore = score + 10;
      setScore(newScore);
      
      // Verifica se todas foram respondidas corretamente
      setTimeout(() => {
        setCellsState(current => {
          const allCorrect = Array.from({ length: 10 }, (_, r) => 
            Array.from({ length: 10 }, (_, c) => {
              const key = getCellKey(r + 1, c + 1);
              const state = current.get(key);
              return state?.isCorrect === true;
            })
          ).flat().every(Boolean);

          if (allCorrect && onComplete) {
            onComplete(newScore);
          }
          
          return current;
        });
      }, 500);
    }

    setSelectedCell(null);
    setInputValue('');
  };

  const resetGame = () => {
    setCellsState(new Map());
    setSelectedCell(null);
    setInputValue('');
    setScore(0);
    setShowAll(false);
  };

  const revealAll = () => {
    const allCells = new Map<string, CellState>();
    let totalScore = score; // Mantém a pontuação atual
    
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 10; col++) {
        const cellKey = getCellKey(row, col);
        const currentState = cellsState.get(cellKey);
        
        // Se já estava respondida, mantém o estado (correta ou errada)
        // Se não estava respondida, revela como correta
        if (currentState && currentState.isCorrect !== null) {
          allCells.set(cellKey, currentState);
        } else {
          allCells.set(cellKey, {
            revealed: true,
            isCorrect: true // Revela como correta se não estava respondida
          });
        }
      }
    }
    setCellsState(allCells);
    setShowAll(true);
    setSelectedCell(null);
    setInputValue('');
  };

  const completedCount = Array.from(cellsState.values()).filter(c => c.isCorrect !== null).length;

  // Verifica se deve mostrar o campo de input
  const selectedCellState = selectedCell ? cellsState.get(selectedCell) : null;
  
  // Foca no input quando uma célula é selecionada
  useEffect(() => {
    if (selectedCell && selectedCellState && selectedCellState.revealed && selectedCellState.isCorrect === null) {
      setTimeout(() => {
        const input = document.querySelector('input[type="number"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  }, [selectedCell, selectedCellState]);

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-fredoka mb-2">Jogo da Tabuada</h1>
          <p className="text-slate-600">Clique nas casas para descobrir os resultados!</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-500 font-bold">Pontos</div>
            <div className="text-2xl font-black text-indigo-600">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 font-bold">Respondidas</div>
            <div className="text-2xl font-black text-green-600">{completedCount}/100</div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar
        </button>
        {!showAll && (
          <button
            onClick={revealAll}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-bold transition"
          >
            Revelar Tudo
          </button>
        )}
        {showAll && (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold">
            ✓ Todos os resultados revelados
          </div>
        )}
      </div>

      {/* Multiplication Table */}
      <div className="bg-white rounded-3xl shadow-xl p-6 border border-slate-200 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-16 h-16"></th>
                {numbers.map(num => (
                  <th
                    key={num}
                    className="w-16 h-16 bg-yellow-100 border-2 border-yellow-300 rounded-full text-center font-black text-yellow-800"
                  >
                    {num}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {numbers.map(row => (
                <tr key={row}>
                  <td className="w-16 h-16 bg-green-100 border-2 border-green-300 rounded-full text-center font-black text-green-800">
                    {row}
                  </td>
                  {numbers.map(col => {
                    const cellKey = getCellKey(row, col);
                    const cellState = cellsState.get(cellKey);
                    const isRevealed = cellState?.revealed || false;
                    const isSelected = selectedCell === cellKey;
                    const value = getCellValue(row, col);
                    const isCorrect = cellState?.isCorrect;
                    const userAnswer = cellState?.userAnswer;

                    let cellClassName = 'w-20 h-20 border-2 text-center font-bold text-sm transition-all duration-200 ';
                    let cellContent;

                    if (!isRevealed) {
                      // Célula não revelada
                      cellClassName += 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 cursor-pointer';
                      cellContent = (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        </div>
                      );
                    } else if (isCorrect === true) {
                      // Célula correta (verde)
                      cellClassName += 'bg-green-100 border-green-400 text-green-900';
                      cellContent = (
                        <div className="flex flex-col items-center justify-center h-full relative">
                          <CheckCircle className="absolute top-1 right-1 w-5 h-5 text-green-600" />
                          <div className="text-xs text-green-600 mb-0.5 font-bold">
                            {row} × {col}
                          </div>
                          <div className="text-lg font-black text-green-700">
                            {value}
                          </div>
                        </div>
                      );
                    } else if (isCorrect === false) {
                      // Célula errada (vermelho) - mostra resposta errada e correta
                      cellClassName += 'bg-red-100 border-red-400 text-red-900';
                      cellContent = (
                        <div className="flex flex-col items-center justify-center h-full relative">
                          <XCircle className="absolute top-1 right-1 w-5 h-5 text-red-600" />
                          <div className="text-xs text-red-600 mb-0.5 font-bold">
                            {row} × {col}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-red-500 line-through">{userAnswer}</span>
                            <span className="text-lg font-black text-green-600">{value}</span>
                          </div>
                        </div>
                      );
                    } else {
                      // Célula revelada mas não respondida (mostra equação e input)
                      cellClassName += `bg-indigo-50 border-indigo-300 text-indigo-900 ${isSelected ? 'ring-4 ring-indigo-400 ring-offset-2' : ''}`;
                      cellContent = (
                        <div className="flex flex-col items-center justify-center h-full p-1">
                          <div className="text-xs text-indigo-700 font-bold mb-1">
                            {row} × {col}
                          </div>
                          {isSelected ? (
                            <input
                              type="number"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSubmitAnswer();
                                }
                              }}
                              onBlur={() => {
                                // Não fecha automaticamente ao perder foco
                              }}
                              className="w-12 h-8 text-center text-sm font-black border-2 border-indigo-400 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                              placeholder="?"
                              autoFocus
                              maxLength={3}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-2 border-indigo-200">
                              <span className="text-lg font-black text-indigo-600">?</span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <td
                        key={col}
                        className={cellClassName}
                        onClick={() => {
                          // Não permite clicar se "Revelar Tudo" foi ativado
                          if (showAll) {
                            return;
                          }
                          // Permite clicar se não estiver respondida
                          const currentState = cellsState.get(cellKey);
                          if (!currentState || currentState.isCorrect === null) {
                            handleCellClick(row, col);
                          }
                        }}
                        title={isRevealed ? (isCorrect === null ? 'Digite o resultado abaixo' : `${row} × ${col} = ${value}`) : 'Clique para revelar a equação'}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer Input - Botões de ação quando uma célula está selecionada */}
      {!showAll && selectedCell && selectedCellState && selectedCellState.revealed && selectedCellState.isCorrect === null && (
        <div className="mt-6 bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-sm font-bold text-indigo-700">
              Digite o resultado de {selectedCell.split('-').map(n => parseInt(n)).join(' × ')} e pressione Enter
            </div>
            <button
              onClick={handleSubmitAnswer}
              disabled={!inputValue.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Responder
            </button>
            <button
              onClick={() => {
                setSelectedCell(null);
                setInputValue('');
              }}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 font-bold">
          💡 <strong>Como jogar:</strong> Clique em uma casa para revelar a equação. Digite o resultado no campo abaixo e pressione Enter ou clique em "Responder". 
          Se acertar, fica verde! Se errar, fica vermelho e mostra a resposta correta ao lado. Você só tem uma chance por equação!
        </p>
      </div>

      {/* Completion Message - Só aparece quando todas foram respondidas (não quando revelar tudo) */}
      {completedCount === 100 && !showAll && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-slate-800 mb-2 font-fredoka">Parabéns! 🎉</h2>
            <p className="text-slate-600 mb-6">
              Você respondeu todas as multiplicações da tabuada!
            </p>
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-slate-500 mb-1">Pontuação Final</div>
              <div className="text-4xl font-black text-indigo-600">{score} pontos</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
              >
                Jogar Novamente
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiplicationTableGame;
