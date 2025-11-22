import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ContentItem } from '../entities/ContentItem';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { generateEducationalContent, chatForCreation } from '../services/gemini.service';

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

    if (!title || !description || !type || !subject || !ageRange || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Check if user can create content (premium or teacher)
    if (req.user!.plan !== 'premium' && req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Apenas usuários Premium ou Professores podem criar conteúdo' });
    }

    const contentRepository = AppDataSource.getRepository(ContentItem);
    const content = contentRepository.create({
      title,
      description,
      type,
      authorId: req.user!.id,
      authorName: req.user!.name,
      authorRole: req.user!.role,
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
    const { prompt, age, contentType, files, sourceContext } = req.body;

    if (!prompt || !age || !contentType) {
      return res.status(400).json({ error: 'Prompt, idade e tipo de conteúdo são obrigatórios' });
    }

    // Check if user can generate content
    if (req.user!.plan !== 'premium' && req.user!.role !== 'teacher') {
      return res.status(403).json({ error: 'Apenas usuários Premium ou Professores podem gerar conteúdo com IA' });
    }

    const generated = await generateEducationalContent(
      prompt,
      age,
      contentType,
      files || [],
      sourceContext
    );

    res.json({ generated });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ error: 'Erro ao gerar conteúdo' });
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

