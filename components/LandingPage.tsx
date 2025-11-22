
import React, { useState } from 'react';
import { Star, BookOpen, Sparkles, ShieldCheck, ArrowRight, GraduationCap, Users, Briefcase, BrainCircuit, Zap, Coins, Cpu, Gamepad2, LineChart, ShoppingBag } from 'lucide-react';

interface LandingPageProps {
  onLogin: (role: 'parent' | 'teacher') => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}

type Persona = 'parent' | 'teacher' | 'student';

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onShowLogin, onShowRegister }) => {
  const [activePersona, setActivePersona] = useState<Persona>('parent');

  const getContent = () => {
      switch(activePersona) {
          case 'parent':
              return {
                  badge: 'Para Pais & Mães',
                  title: 'Transforme o tempo de tela em aprendizado real.',
                  subtitle: 'Chega de brigas na hora da lição. Crie atividades personalizadas com IA que seu filho vai amar fazer.',
                  cta: 'Começar como Responsável',
                  image: '/images/mother-child-studying.jpeg',
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  features: [
                      { title: 'IA Personalizada', desc: 'Gere quizzes baseados no livro da escola.', icon: <BrainCircuit className="w-6 h-6 text-indigo-600" /> },
                      { title: 'Controle Total', desc: 'Monitore o progresso e filtre conteúdos seguros.', icon: <ShieldCheck className="w-6 h-6 text-indigo-600" /> },
                      { title: 'Conexão Real', desc: 'Participe ativamente da educação dos seus filhos.', icon: <Users className="w-6 h-6 text-indigo-600" /> }
                  ],
                  testimonials: [
                      { name: "Fernanda L.", role: "Mãe de Lucas (8 anos)", text: "O Lucas odiava estudar matemática. Com o EduMágico, criei um quiz sobre Minecraft e agora ele pede para fazer exercícios!", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fernanda" },
                      { name: "Roberto S.", role: "Pai de gêmeos", text: "A melhor parte é o relatório. Consigo ver exatamente onde eles têm dificuldade e a IA sugere reforço.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto" },
                      { name: "Ana P.", role: "Mãe de Sofia (6 anos)", text: "Transformei a hora da leitura em um momento mágico. As histórias interativas são incríveis.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" }
                  ]
              };
          case 'teacher':
              return {
                badge: 'Para Educadores',
                title: 'Monetize seu conhecimento e economize tempo.',
                subtitle: 'Crie planos de aula mágicos em segundos, venda seus materiais exclusivos e acompanhe seus alunos.',
                cta: 'Entrar como Professor',
                image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132&auto=format&fit=crop',
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
                features: [
                    { title: 'Loja de Atividades', desc: 'Venda seus materiais e gere renda extra.', icon: <Coins className="w-6 h-6 text-orange-600" /> },
                    { title: 'Gestão de Turmas', desc: 'Acompanhe o desempenho de cada aluno.', icon: <Briefcase className="w-6 h-6 text-orange-600" /> },
                    { title: 'Produtividade', desc: 'Crie uma semana de conteúdo em minutos.', icon: <Zap className="w-6 h-6 text-orange-600" /> }
                ],
                testimonials: [
                    { name: "Prof. Ricardo", role: "História - Ens. Fundamental", text: "Criei um jogo sobre o Egito Antigo que viralizou na plataforma. Já facturei mais de R$ 500 este mês.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo" },
                    { name: "Profa. Júlia", role: "Alfabetização", text: "A IA me ajuda a criar variações de exercícios para alunos com diferentes níveis. Economizo horas de planejamento.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julia" },
                    { name: "Cláudio M.", role: "Coordenador Pedagógico", text: "Usamos para padronizar as atividades extras da escola. A qualidade aumentou muito.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Claudio" }
                ]
              };
          case 'student':
            return {
                badge: 'Para Alunos',
                title: 'Aprender nunca foi tão divertido.',
                subtitle: 'Descubra histórias onde você é o herói, jogue quizzes desafiadores e ganhe pontos para o ranking.',
                cta: 'Começar Aventura',
                image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                features: [
                    { title: 'Gamificação', desc: 'Ganhe pontos e suba no ranking semanal.', icon: <Star className="w-6 h-6 text-yellow-500" /> },
                    { title: 'Interatividade', desc: 'Histórias e jogos que reagem a você.', icon: <Sparkles className="w-6 h-6 text-yellow-500" /> },
                    { title: 'No seu Ritmo', desc: 'Aprenda sem pressão, do seu jeito.', icon: <GraduationCap className="w-6 h-6 text-yellow-500" /> }
                ],
                testimonials: [
                    { name: "Pedro", role: "3º Ano", text: "É muito legal porque eu ganho moedas e posso trocar meu avatar. Eu aprendi tabuada jogando!", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro" },
                    { name: "Marina", role: "5º Ano", text: "As histórias mudam dependendo do que eu escolho. Parece videogame, mas é aula de ciências.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marina" },
                    { name: "João", role: "8º Ano", text: "Os resumos me ajudam muito na prova. É direto ao ponto e tem curiosidades legais.", img: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao" }
                ]
            };
      }
  }

  const content = getContent();

  // Flowchart Data
  const steps = [
      {
          icon: <Cpu className="w-6 h-6 text-white" />,
          title: "1. Criação Mágica com IA",
          desc: "Professores ou Pais inserem um tema (ex: 'Fotossíntese'). Nossa IA gera histórias, quizzes ou resumos completos em segundos.",
          color: "bg-indigo-500"
      },
      {
          icon: <BookOpen className="w-6 h-6 text-white" />,
          title: "2. Curadoria e Personalização",
          desc: "O conteúdo pode ser editado, enriquecido com vídeos/áudios e adaptado para a faixa etária específica (Pré-escola ao Médio).",
          color: "bg-purple-500"
      },
      {
          icon: <ShoppingBag className="w-6 h-6 text-white" />,
          title: "3. Loja de Conteúdos",
          desc: "Professores publicam materiais premium no Marketplace. Pais compram recursos exclusivos validados por especialistas.",
          color: "bg-pink-500"
      },
      {
          icon: <Gamepad2 className="w-6 h-6 text-white" />,
          title: "4. O Aluno Joga",
          desc: "A criança acessa a atividade gamificada. Responde quizzes, toma decisões na história e recebe feedback imediato.",
          color: "bg-orange-500"
      },
      {
          icon: <LineChart className="w-6 h-6 text-white" />,
          title: "5. Feedback & Ranking",
          desc: "Pais recebem relatórios de desempenho. Alunos ganham XP, moedas e sobem no Ranking Global.",
          color: "bg-emerald-500"
      }
  ];

  return (
    <div className="min-h-screen bg-white font-nunito">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl font-fredoka">
          <Sparkles className="w-8 h-8" />
          EduMágico
        </div>
        <div className="flex gap-4">
          <button onClick={() => onShowLogin?.()} className="text-slate-600 font-semibold hover:text-indigo-600 transition">
            Fazer Login
          </button>
          {onShowRegister && (
            <button onClick={() => onShowRegister()} className="text-slate-600 font-semibold hover:text-indigo-600 transition">
              Cadastrar
            </button>
          )}
          <button onClick={() => onLogin(activePersona === 'teacher' ? 'teacher' : 'parent')} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Começar Grátis
          </button>
        </div>
      </nav>

      {/* Persona Selector Tabs */}
      <div className="max-w-7xl mx-auto px-6 mt-8 text-center md:text-left">
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl shadow-inner">
              <button 
                onClick={() => setActivePersona('parent')} 
                className={`px-6 py-2 rounded-xl font-bold text-sm transition duration-300 ${activePersona === 'parent' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:text-indigo-600'}`}
              >
                Sou Pai/Mãe
              </button>
              <button 
                onClick={() => setActivePersona('student')} 
                className={`px-6 py-2 rounded-xl font-bold text-sm transition duration-300 ${activePersona === 'student' ? 'bg-white text-yellow-600 shadow-sm scale-105' : 'text-slate-500 hover:text-yellow-600'}`}
              >
                Sou Aluno
              </button>
              <button 
                onClick={() => setActivePersona('teacher')} 
                className={`px-6 py-2 rounded-xl font-bold text-sm transition duration-300 ${activePersona === 'teacher' ? 'bg-white text-orange-600 shadow-sm scale-105' : 'text-slate-500 hover:text-orange-600'}`}
              >
                Sou Professor
              </button>
          </div>
      </div>

      {/* Hero Section - Dynamic Content */}
      <header className="relative overflow-hidden pt-12 pb-32 lg:pt-16 animate-fade-in" key={activePersona}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 z-10">
            <span className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-4 inline-block 
                ${activePersona === 'parent' ? 'bg-indigo-100 text-indigo-600' : 
                  activePersona === 'teacher' ? 'bg-orange-100 text-orange-600' : 
                  'bg-yellow-100 text-yellow-600'}`}>
              {content.badge}
            </span>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 leading-tight font-fredoka">
              {content.title}
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
              {content.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onLogin(activePersona === 'teacher' ? 'teacher' : 'parent')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition transform flex items-center justify-center gap-2">
                {content.cta} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse ${
                activePersona === 'parent' ? 'bg-indigo-200' : 
                activePersona === 'teacher' ? 'bg-orange-200' : 'bg-yellow-200'
            }`}></div>
            <div className="relative rounded-3xl shadow-2xl border-4 border-white rotate-1 hover:rotate-0 transition duration-500 overflow-hidden bg-slate-100">
              <img 
                src={content.image}
                alt={activePersona} 
                className="w-full h-full object-cover"
                style={{ 
                  maxHeight: '450px', 
                  width: '100%', 
                  height: 'auto',
                  objectFit: 'cover',
                  display: 'block'
                }}
                loading="lazy"
                onError={(e) => {
                  console.error('Erro ao carregar imagem:', content.image);
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 p-8">Imagem não disponível</div>';
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section - Dynamic */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-fredoka">Por que usar o EduMágico?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Funcionalidades pensadas para cada momento da jornada.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {content.features.map((feat, idx) => (
                <div key={idx} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
                    <div className={`${content.bgColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                        {feat.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 font-fredoka">{feat.title}</h3>
                    <p className="text-slate-600">{feat.desc}</p>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Dynamic */}
      <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-2 mb-12 justify-center md:justify-start">
                 <div className="flex text-yellow-400">
                     <Star className="fill-current w-5 h-5" />
                     <Star className="fill-current w-5 h-5" />
                     <Star className="fill-current w-5 h-5" />
                     <Star className="fill-current w-5 h-5" />
                     <Star className="fill-current w-5 h-5" />
                 </div>
                 <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">O que dizem sobre nós</span>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {content.testimonials.map((t, i) => (
                    <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                        <div className="absolute top-8 left-8 text-6xl font-serif text-slate-200 leading-none">"</div>
                        <p className="text-slate-700 mb-6 relative z-10 pt-4 italic font-medium">
                            {t.text}
                        </p>
                        <div className="flex items-center gap-4">
                            <img src={t.img} className="w-12 h-12 rounded-full bg-white shadow-sm" alt={t.name} />
                            <div>
                                <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                                <p className={`text-xs font-bold uppercase tracking-wide ${content.color}`}>{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      </section>

      {/* "How it Works" Flowchart Section */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Entenda o fluxo</span>
                <h2 className="text-3xl md:text-5xl font-black mb-4 font-fredoka mt-2">O Ciclo da Magia</h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">Como conectamos tecnologia, professores e alunos em um único lugar.</p>
            </div>

            {/* Desktop Flowchart */}
            <div className="hidden md:flex justify-between items-start relative">
                {/* Connecting Line */}
                <div className="absolute top-8 left-0 w-full h-1 bg-slate-700 -z-10 rounded-full"></div>

                {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center w-1/5 px-2 group cursor-default">
                        <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 group-hover:scale-110 transition duration-300 border-4 border-slate-900`}>
                            {step.icon}
                        </div>
                        <h3 className="font-bold text-lg mb-2 font-fredoka">{step.title}</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>

            {/* Mobile Flowchart (Vertical) */}
            <div className="md:hidden space-y-8 relative">
                <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-800 -z-10"></div>
                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-6">
                        <div className={`w-16 h-16 rounded-2xl ${step.color} flex-shrink-0 flex items-center justify-center shadow-lg border-4 border-slate-900`}>
                            {step.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl mb-2 font-fredoka">{step.title}</h3>
                            <p className="text-slate-400 text-sm">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-16">
                <button onClick={() => onLogin('parent')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-900/50 transition transform hover:-translate-y-1">
                    Começar Agora Gratuitamente
                </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-2xl mb-4 font-fredoka text-indigo-600">
              <Sparkles className="w-6 h-6" />
              EduMágico
            </div>
            <p className="text-slate-500 max-w-sm leading-relaxed">Ajudando pais, educadores e alunos a criarem um futuro mais brilhante e divertido através da tecnologia.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Plataforma</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li className="hover:text-indigo-600 cursor-pointer">Planos & Preços</li>
              <li className="hover:text-indigo-600 cursor-pointer">Para Escolas</li>
              <li className="hover:text-indigo-600 cursor-pointer">Área do Professor</li>
              <li className="hover:text-indigo-600 cursor-pointer">Ranking Global</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-900">Legal</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li className="hover:text-indigo-600 cursor-pointer">Privacidade</li>
              <li className="hover:text-indigo-600 cursor-pointer">Termos de Uso</li>
              <li className="hover:text-indigo-600 cursor-pointer">Central de Ajuda</li>
              <li className="hover:text-indigo-600 cursor-pointer">Contato</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-slate-400 mt-16 pt-8 border-t border-slate-100 text-sm">
          © 2024 EduMágico. Todos os direitos reservados. Feito com carinho para o futuro.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
