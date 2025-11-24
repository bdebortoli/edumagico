import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ContentItem } from '../entities/ContentItem';

async function restoreTabuadaGame() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const contentRepository = AppDataSource.getRepository(ContentItem);

    // Verifica se o jogo de tabuada já existe
    const existingTabuada = await contentRepository
      .createQueryBuilder('content')
      .where('content.title = :title', { title: 'Jogo da Tabuada Interativo' })
      .orWhere("content.data->>'gameType' = :gameType", { gameType: 'multiplication-table' })
      .getOne();

    if (existingTabuada) {
      // Verifica se é realmente o jogo de tabuada
      const isTabuada = (existingTabuada.type === 'game' && (existingTabuada.data as any)?.gameType === 'multiplication-table') ||
        existingTabuada.title?.toLowerCase().includes('tabuada');

      if (isTabuada) {
        console.log('✅ Jogo de tabuada já existe no banco de dados');
        console.log('   ID:', existingTabuada.id);
        console.log('   Título:', existingTabuada.title);
        await AppDataSource.destroy();
        return;
      }
    }

    // Cria o jogo de tabuada
    console.log('🔄 Criando jogo de tabuada...');
    const tabuadaGame = contentRepository.create({
      title: 'Jogo da Tabuada Interativo',
      description: 'Descubra todas as multiplicações da tabuada clicando nas casas! Aprenda de forma divertida e interativa.',
      type: 'game',
      authorId: 'sys',
      authorName: 'EduMágico',
      authorRole: 'teacher',
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
    });

    await contentRepository.save(tabuadaGame);
    console.log('✅ Jogo de tabuada criado com sucesso!');
    console.log('   ID:', tabuadaGame.id);
    console.log('   Título:', tabuadaGame.title);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao restaurar jogo de tabuada:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

restoreTabuadaGame();

