# 🎮 Adicionar Jogo da Tabuada Manualmente

Se o jogo da tabuada não aparecer automaticamente, você pode adicioná-lo manualmente:

## Método 1: Via Console do Navegador (Mais Rápido)

1. Abra o console do navegador (F12)
2. Cole e execute este código:

```javascript
// Adicionar Jogo da Tabuada
const gameContent = {
  id: '5',
  title: 'Jogo da Tabuada Interativo',
  description: 'Descubra todas as multiplicações da tabuada clicando nas casas! Aprenda de forma divertida e interativa.',
  type: 'game',
  authorId: 'sys',
  authorName: 'EduMágico',
  authorRole: 'teacher',
  createdAt: '2023-10-15T10:00:00Z',
  subject: 'Matemática',
  ageRange: { min: 7, max: 10 },
  grade: '2º Ano Fund.',
  keywords: ['tabuada', 'multiplicação', 'matemática', 'jogo'],
  isAiGenerated: false,
  price: 0,
  salesCount: 0,
  data: {
    gameType: 'multiplication-table',
    config: {}
  }
};

const existingContent = JSON.parse(localStorage.getItem('edumagico_content') || '[]');
const exists = existingContent.find(c => c.id === '5');
if (!exists) {
  existingContent.push(gameContent);
  localStorage.setItem('edumagico_content', JSON.stringify(existingContent));
  console.log('✅ Jogo da Tabuada adicionado! Recarregue a página.');
} else {
  console.log('ℹ️ Jogo da Tabuada já existe no banco de dados.');
}
```

3. Recarregue a página (F5)

## Método 2: Limpar e Recarregar Tudo

1. Abra o console do navegador (F12)
2. Execute: `localStorage.clear()`
3. Recarregue a página (F5)
4. O jogo será adicionado automaticamente

## Verificar se Funcionou

Após adicionar, vá em:
- "Minhas Atividades" ou "Biblioteca"
- Procure por "Jogo da Tabuada Interativo"
- Deve aparecer com ícone roxo (tipo "game")

