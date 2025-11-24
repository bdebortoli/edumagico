import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { ChildProfile } from '../entities/ChildProfile';

// Helper function to categorize education level based on grade
function getEducationLevel(grade: string): 'pre-escola' | 'fundamental1' | 'fundamental2' | 'ensino-medio' | undefined {
  if (!grade) return undefined;
  
  const gradeLower = grade.toLowerCase();
  
  // Pré-escola
  if (gradeLower.includes('pré-escola') || gradeLower.includes('pre-escola')) {
    return 'pre-escola';
  }
  
  // Fundamental 1 (1º a 5º Ano Fund.)
  if (gradeLower.includes('1º ano fund') || 
      gradeLower.includes('2º ano fund') || 
      gradeLower.includes('3º ano fund') || 
      gradeLower.includes('4º ano fund') || 
      gradeLower.includes('5º ano fund')) {
    return 'fundamental1';
  }
  
  // Fundamental 2 (6º a 9º Ano Fund.)
  if (gradeLower.includes('6º ano fund') || 
      gradeLower.includes('7º ano fund') || 
      gradeLower.includes('8º ano fund') || 
      gradeLower.includes('9º ano fund')) {
    return 'fundamental2';
  }
  
  // Ensino Médio (1º a 3º Ano Médio)
  if (gradeLower.includes('1º ano médio') || 
      gradeLower.includes('2º ano médio') || 
      gradeLower.includes('3º ano médio')) {
    return 'ensino-medio';
  }
  
  return undefined;
}

async function updateEducationLevels() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const childRepository = AppDataSource.getRepository(ChildProfile);
    const children = await childRepository.find();

    console.log(`📊 Encontrados ${children.length} alunos no banco de dados`);

    let updated = 0;
    for (const child of children) {
      if (!child.educationLevel && child.grade) {
        const educationLevel = getEducationLevel(child.grade);
        if (educationLevel) {
          child.educationLevel = educationLevel;
          await childRepository.save(child);
          updated++;
          console.log(`✅ Atualizado: ${child.name} (${child.grade}) → ${educationLevel}`);
        }
      }
    }

    console.log(`\n✅ Processo concluído! ${updated} aluno(s) atualizado(s)`);
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao atualizar education levels:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

updateEducationLevels();

