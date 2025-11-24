
import { User, ContentItem } from '../types';

const DB_KEYS = {
  USERS: 'edumagico_users',
  CONTENT: 'edumagico_content',
  CURRENT_USER_ID: 'edumagico_current_user_id'
};

// Mock Initial Data (Seed)
const SEED_CONTENT: ContentItem[] = [
  {
    id: '1',
    title: 'Aventuras no Espaço',
    description: 'Uma viagem pelo sistema solar para aprender sobre planetas.',
    type: 'story',
    authorId: 'sys',
    authorName: 'EduMágico',
    authorRole: 'teacher',
    createdAt: '2023-10-01T10:00:00Z',
    subject: 'Ciências',
    ageRange: { min: 7, max: 9 },
    grade: '3º Ano Fund.',
    keywords: ['planetas', 'espaço', 'solar'],
    isAiGenerated: false,
    price: 0,
    salesCount: 0,
    data: {
      chapters: [
        { title: 'A Decolagem', text: 'Pedro vestiu seu traje espacial prateado. 3, 2, 1... O foguete tremeu e subiu aos céus, deixando um rastro de fumaça branca.' },
        { title: 'Flutuando', text: 'No espaço, tudo flutuava. Pedro viu sua caneta girando no ar. "Olhe pela janela!", disse o computador de bordo.' },
        { title: 'Marte Vermelho', text: 'Lá embaixo, um planeta vermelho brilhava. Era Marte, nosso vizinho empoeirado.' }
      ]
    }
  },
  {
    id: '2',
    title: 'Matemática Divertida',
    description: 'Teste seus conhecimentos sobre multiplicação.',
    type: 'quiz',
    authorId: 'u1',
    authorName: 'Cláudia Santos',
    authorRole: 'parent',
    createdAt: '2023-10-05T14:00:00Z',
    subject: 'Matemática',
    ageRange: { min: 7, max: 9 },
    grade: '2º Ano Fund.',
    keywords: ['multiplicação', 'tabuada'],
    isAiGenerated: true,
    price: 0,
    salesCount: 0,
    data: {
      questions: [
        { id: 1, question: 'Quanto é 5 x 5?', options: ['10', '25', '55', '15'], correctIndex: 1, explanation: '5 grupos de 5 é igual a 25.' },
        { id: 2, question: 'Se eu tenho 2 caixas com 3 maçãs cada, quantas maçãs tenho?', options: ['6', '5', '8', '23'], correctIndex: 0, explanation: '2 vezes 3 é igual a 6.' }
      ]
    }
  },
  {
    id: '3',
    title: 'O Segredo das Pirâmides',
    description: 'Jogo de história premium criado por especialista. Descubra como os faraós viviam.',
    type: 'quiz',
    authorId: 't1',
    authorName: 'Prof. Carlos',
    authorRole: 'teacher',
    createdAt: '2023-10-10T16:00:00Z',
    subject: 'História',
    ageRange: { min: 9, max: 12 },
    grade: '5º Ano Fund.',
    keywords: ['egito', 'piramides', 'faraó'],
    isAiGenerated: false,
    price: 50,
    salesCount: 128,
    data: {
      questions: [
        { id: 1, question: 'Onde ficam as pirâmides?', options: ['Brasil', 'Egito', 'China', 'EUA'], correctIndex: 1, explanation: 'No Egito Antigo.' },
        { id: 2, question: 'Quem eram os faraós?', options: ['Reis', 'Médicos', 'Agricultores', 'Soldados'], correctIndex: 0, explanation: 'Eram os governantes supremos do Egito.' }
      ]
    }
  },
  {
    id: '4',
    title: 'Animais da Fazenda',
    description: 'Conheça os sons e hábitos dos animais.',
    type: 'story',
    authorId: 'sys',
    authorName: 'EduMágico',
    authorRole: 'teacher',
    createdAt: '2023-10-12T09:00:00Z',
    subject: 'Ciências',
    ageRange: { min: 4, max: 6 },
    grade: 'Pré-escola',
    keywords: ['animais', 'sons', 'natureza'],
    isAiGenerated: false,
    price: 0,
    salesCount: 0,
    data: { chapters: [{ title: 'O Galo', text: 'O galo canta bem cedo: Cocoricó!' }] }
  },
  {
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
  }
];

const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Cláudia Santos',
    email: 'claudia@example.com',
    role: 'parent',
    plan: 'basic',
    coins: 150,
    children: [{ 
        id: 'c1', 
        name: 'Pedro', 
        age: 8, 
        grade: '3º Ano Fund.', 
        school: 'Escola Futuro Brilhante',
        state: 'SP',
        city: 'São Paulo',
        points: 1250, 
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro' 
    }],
    activityHistory: []
  },
  {
    id: 't1',
    name: 'Prof. Carlos',
    email: 'carlos@escola.com',
    role: 'teacher',
    plan: 'basic',
    coins: 500,
  }
];

export const db = {
  init: () => {
    // Initialize content
    if (!localStorage.getItem(DB_KEYS.CONTENT)) {
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(SEED_CONTENT));
    } else {
      // Add new seed content if it doesn't exist
      const existingContent = JSON.parse(localStorage.getItem(DB_KEYS.CONTENT) || '[]');
      const tabuadaGame = SEED_CONTENT.find(c => c.id === '5');
      // Sempre garantir que jogo de tabuada existe (restaurar se foi deletado)
      if (tabuadaGame) {
        const tabuadaExists = existingContent.find((c: ContentItem) => 
          c.id === '5' || 
          (c.type === 'game' && (c.data as any)?.gameType === 'multiplication-table') ||
          (c.title?.toLowerCase().includes('tabuada'))
        );
        if (!tabuadaExists) {
          existingContent.push(tabuadaGame);
          localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(existingContent));
        }
      }
    }
    
    // Initialize users
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
  },

  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  },

  saveUser: (updatedUser: User) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index >= 0) {
      users[index] = updatedUser;
    } else {
      users.push(updatedUser);
    }
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  },

  getUserById: (id: string): User | undefined => {
    const users = db.getUsers();
    return users.find(u => u.id === id);
  },

  getContent: (): ContentItem[] => {
    return JSON.parse(localStorage.getItem(DB_KEYS.CONTENT) || '[]');
  },

  saveContent: (content: ContentItem) => {
    const contents = db.getContent();
    const index = contents.findIndex(c => c.id === content.id);
    if (index >= 0) {
      contents[index] = content;
    } else {
      contents.unshift(content); // Add to top
    }
    localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(contents));
  },

  deleteContent: (id: string) => {
    // Proteger jogo de tabuada
    const contents = db.getContent();
    const content = contents.find((c: ContentItem) => c.id === id);
    if (content) {
      const isTabuadaGame = content.id === '5' || 
        (content.type === 'game' && (content.data as any)?.gameType === 'multiplication-table') ||
        (content.title?.toLowerCase().includes('tabuada'));
      
      if (isTabuadaGame) {
        console.warn('Tentativa de deletar jogo de tabuada bloqueada');
        return;
      }
    }
    const filteredContents = contents.filter(c => c.id !== id);
    localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(filteredContents));
  }
};

// Initialize on load
db.init();
