import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ContentItem } from '../entities/ContentItem';
import { User } from '../entities/User';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { generateEducationalContent, chatForCreation, validateContentRequest } from '../services/gemini.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all content (user's library)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { subject, grade, childAge } = req.query;

    const contentRepository = AppDataSource.getRepository(ContentItem);
    let query = contentRepository.createQueryBuilder('content')
      .where('content.authorId = :userId OR content.authorId = :systemId', {
        userId: req.user!.id,
        systemId: 'sys'
      })
      .andWhere('content.price = 0'); // Only free or owned content

    if (subject && subject !== 'Todos') {
      query = query.andWhere('content.subject = :subject', { subject });
    }

    if (grade && grade !== 'Todos') {
      query = query.andWhere('content.grade = :grade', { grade });
    }

    if (childAge) {
      const age = parseInt(childAge as string);
      query = query.andWhere('content.ageRange->>\'min\' <= :age', { age })
        .andWhere('content.ageRange->>\'max\' >= :age', { age });
    }

    const content = await query
      .orderBy('content.createdAt', 'DESC')
      .getMany();

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Erro ao buscar conteúdo' });
  }
});

// Get content by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = await contentRepository.findOne({
      where: { id: req.params.id },
      relations: ['author']
    });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({ error: 'Erro ao buscar conteúdo' });
  }
});

// Create content
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      type,
      subject,
      ageRange,
      grade,
      keywords,
      resources,
      price,
      data,
      isAiGenerated
    } = req.body;

    // Validação detalhada dos campos obrigatórios
    const missingFields: string[] = [];
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!type) missingFields.push('type');
    if (!subject) missingFields.push('subject');
    if (!ageRange) missingFields.push('ageRange');
    if (!grade) missingFields.push('grade');
    if (!data) missingFields.push('data');
    
    if (missingFields.length > 0) {
      console.error('Campos faltando:', missingFields);
      console.error('Body recebido:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando',
        missingFields: missingFields
      });
    }

    // Check if user can create content (premium or teacher)
    if (req.user!.plan !== 'premium' && req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Apenas usuários Premium ou Professores podem criar conteúdo' });
    }

    // For parents, validate that grade matches one of their children's grades
    if (req.user!.role === 'parent') {
      const userRepository = AppDataSource.getRepository(User);
      const userWithChildren = await userRepository.findOne({
        where: { id: req.user!.id },
        relations: ['children']
      });

      if (!userWithChildren || !userWithChildren.children || userWithChildren.children.length === 0) {
        return res.status(400).json({ error: 'Você precisa cadastrar pelo menos um filho para criar conteúdo' });
      }

      const childrenGrades = userWithChildren.children.map(child => child.grade);
      if (grade && !childrenGrades.includes(grade)) {
        return res.status(403).json({ 
          error: `Você só pode criar conteúdo para as séries dos seus filhos: ${childrenGrades.join(', ')}` 
        });
      }
    }

    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = contentRepository.create({
      title,
      description,
      type,
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role as 'parent' | 'teacher',
      subject,
      ageRange,
      grade,
      keywords: keywords || [],
      resources,
      isAiGenerated: isAiGenerated || false,
      price: req.user!.role === 'teacher' ? (price || 0) : 0,
      salesCount: 0,
      data
    });

    await contentRepository.save(content);

    res.status(201).json({ content });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Erro ao criar conteúdo' });
  }
});

// Update content
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = await contentRepository.findOne({
      where: { id: req.params.id }
    });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    // Check ownership
    if (content.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este conteúdo' });
    }

    const { title, description, subject, ageRange, grade, keywords, resources, price, data } = req.body;

    if (title) content.title = title;
    if (description) content.description = description;
    if (subject) content.subject = subject;
    if (ageRange) content.ageRange = ageRange;
    if (grade) content.grade = grade;
    if (keywords) content.keywords = keywords;
    if (resources) content.resources = resources;
    if (price !== undefined && req.user!.role === 'teacher') content.price = price;
    if (data) content.data = data;

    await contentRepository.save(content);

    res.json({ content });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Erro ao atualizar conteúdo' });
  }
});

// Delete content
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = await contentRepository.findOne({
      where: { id: req.params.id }
    });

    if (!content) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    // Proteger jogo de tabuada (não pode ser deletado)
    const isTabuadaGame = content.id === '5' || 
      (content.type === 'game' && (content.data as any)?.gameType === 'multiplication-table') ||
      (content.title?.toLowerCase().includes('tabuada')) ||
      (content.authorId === 'sys' && content.type === 'game');

    if (isTabuadaGame) {
      return res.status(403).json({ error: 'O jogo de tabuada é fixo e não pode ser removido' });
    }

    // Check ownership
    if (content.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Você não tem permissão para deletar este conteúdo' });
    }

    await contentRepository.remove(content);

    res.json({ message: 'Conteúdo deletado com sucesso' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Erro ao deletar conteúdo' });
  }
});

// Generate content with AI
router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, age, contentType, files, sourceContext, grade, refinementPrompt, sizeParams } = req.body;

    if (!prompt || !age || !contentType) {
      return res.status(400).json({ error: 'Prompt, idade e tipo de conteúdo são obrigatórios' });
    }

    // Check if user can generate content
    if (req.user!.plan !== 'premium' && req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Apenas usuários Premium ou Professores podem gerar conteúdo com IA' });
    }

    // Validação de arquivos
    const MAX_FILES = 20;
    const MAX_FILE_SIZE_BASE64 = 30 * 1024 * 1024; // ~30MB em base64 (aproximadamente 20MB original)
    const MAX_TOTAL_SIZE_BASE64 = 120 * 1024 * 1024; // ~120MB total em base64 (aumentado para acomodar mais arquivos)
    
    if (files && Array.isArray(files)) {
      // Validar quantidade de arquivos
      if (files.length > MAX_FILES) {
        return res.status(400).json({ 
          error: `Limite de arquivos excedido. Máximo permitido: ${MAX_FILES} arquivos por requisição.` 
        });
      }
      
      // Validar tamanho de cada arquivo e tamanho total
      let totalSize = 0;
      for (const file of files) {
        if (!file.data || typeof file.data !== 'string') {
          return res.status(400).json({ 
            error: `Arquivo inválido: ${file.name || 'desconhecido'}. Dados do arquivo estão corrompidos.` 
          });
        }
        
        const fileSize = Buffer.from(file.data, 'base64').length;
        if (fileSize > MAX_FILE_SIZE_BASE64) {
          return res.status(400).json({ 
            error: `Arquivo muito grande: ${file.name || 'desconhecido'}. Tamanho máximo: ${MAX_FILE_SIZE_BASE64 / (1024 * 1024)}MB.` 
          });
        }
        
        totalSize += fileSize;
      }
      
      if (totalSize > MAX_TOTAL_SIZE_BASE64) {
        return res.status(400).json({ 
          error: `Tamanho total dos arquivos excedido. Limite: ${MAX_TOTAL_SIZE_BASE64 / (1024 * 1024)}MB. Remova alguns arquivos e tente novamente.` 
        });
      }
      
      // Validar tipos MIME suportados
      const supportedMimeTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      
      for (const file of files) {
        if (!file.mimeType) {
          return res.status(400).json({ 
            error: `Tipo de arquivo não identificado: ${file.name || 'desconhecido'}.` 
          });
        }
        
        const isSupported = supportedMimeTypes.includes(file.mimeType) || 
                           file.mimeType.startsWith('image/');
        
        if (!isSupported) {
          return res.status(400).json({ 
            error: `Tipo de arquivo não suportado: ${file.mimeType}. Use apenas PDF ou imagens (JPG, PNG, GIF, WEBP).` 
          });
        }
      }
    }

    // MIDDLEWARE DE VALIDAÇÃO: Verificar se precisa de confirmação de tamanho (passa grade para validação)
    const validation = validateContentRequest(prompt, contentType, grade);
    
    if (validation.needsConfirmation) {
      return res.status(200).json({
        needsConfirmation: true,
        confirmationMessage: validation.confirmationMessage,
        contentType: validation.contentType
      });
    }

    const generated = await generateEducationalContent(
      prompt,
      age,
      contentType,
      files || [],
      sourceContext,
      grade,
      refinementPrompt,
      sizeParams
    );

    res.json({ generated });
  } catch (error: any) {
    console.error('Generate content error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body info:', {
      hasPrompt: !!req.body.prompt,
      hasAge: !!req.body.age,
      hasContentType: !!req.body.contentType,
      filesCount: req.body.files?.length || 0,
      filesTotalSize: req.body.files?.reduce((sum: number, f: any) => sum + (f.data?.length || 0), 0) || 0
    });
    
    // Retornar mensagem de erro mais específica
    let errorMessage = error.message || 'Erro ao gerar conteúdo';
    let statusCode = error.status || 500;
    
    // Melhorar mensagens de erro comuns
    if (errorMessage.includes('GEMINI_API_KEY')) {
      errorMessage = 'Erro de configuração: A chave da API do Gemini não está configurada no servidor.';
      statusCode = 500;
    } else if (errorMessage.includes('Unsupported MIME type')) {
      errorMessage = 'Tipo de arquivo não suportado. Use apenas PDF ou imagens (JPG, PNG).';
      statusCode = 400;
    } else if (errorMessage.includes('400 Bad Request') || errorMessage.includes('400')) {
      errorMessage = 'Erro na requisição ao Gemini. Verifique os arquivos enviados e tente novamente.';
      statusCode = 400;
    } else if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      errorMessage = 'Limite de requisições excedido. Tente novamente em alguns instantes.';
      statusCode = 429;
    } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
      errorMessage = 'Arquivos muito grandes. Tente enviar menos arquivos ou arquivos menores.';
      statusCode = 413;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Chat for creation
router.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const { history, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Check if user can use chat
    if (req.user!.plan !== 'premium' && req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Apenas usuários Premium ou Professores podem usar o chat' });
    }

    const response = await chatForCreation(history || [], message);

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Erro ao processar chat' });
  }
});

export default router;

