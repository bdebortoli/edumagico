import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { hashPassword } from '../services/auth.service';

async function createAdmin() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');
    
    // Verifica se a tabela users existe, se não, cria usando SQL direto
    const tableExists = await AppDataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('🔄 Criando tabela users...');
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          email VARCHAR UNIQUE NOT NULL,
          password VARCHAR NOT NULL,
          role VARCHAR NOT NULL DEFAULT 'parent',
          plan VARCHAR NOT NULL DEFAULT 'basic',
          coins INTEGER NOT NULL DEFAULT 0,
          cpf VARCHAR,
          "birthDate" DATE,
          address JSONB,
          "phoneNumber" VARCHAR,
          "teacherProfile" JSONB,
          "parentProfile" JSONB,
          subscription JSONB,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Tabela users criada');
    }

    const email = 'bdebortoli@gmail.com';
    const name = 'Bruno Debortoli';
    const password = 'admin123'; // Senha padrão - deve ser alterada após primeiro login
    
    const userRepository = AppDataSource.getRepository(User);

    // Verifica se o usuário já existe
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log('✅ Usuário admin já existe com este email');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Nome: ${existingUser.name}`);
        console.log(`   Role: ${existingUser.role}`);
      } else {
        // Atualiza o usuário existente para admin
        existingUser.role = 'admin';
        await userRepository.save(existingUser);
        console.log('✅ Usuário existente atualizado para admin');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Nome: ${existingUser.name}`);
        console.log(`   Role: ${existingUser.role}`);
      }
    } else {
      // Cria novo usuário admin
      const hashedPassword = await hashPassword(password);
      
      const adminUser = userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        plan: 'premium',
        coins: 0
      });

      await userRepository.save(adminUser);
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Nome: ${adminUser.name}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Senha inicial: ${password}`);
      console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    }

    await AppDataSource.destroy();
    console.log('✅ Conexão fechada');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdmin();

