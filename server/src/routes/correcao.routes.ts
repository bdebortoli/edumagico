import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { corrigirResposta, CorrecaoPayload } from '../services/correcao.service';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

/**
 * POST /api/correcao
 * Corrige uma resposta discursiva do aluno
 * 
 * Body:
 * {
 *   "resposta_aluno": "texto que o aluno escreveu",
 *   "guideline": "critério usado para correção",
 *   "serie": "2_ano_medio" (opcional),
 *   "idade": 17 (opcional),
 *   "materia": "Biologia" (opcional),
 *   "conteudo": "Seleção natural" (opcional)
 * }
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const payload: CorrecaoPayload = {
      resposta_aluno: req.body.resposta_aluno || '',
      guideline: req.body.guideline || '',
      serie: req.body.serie,
      idade: req.body.idade,
      materia: req.body.materia,
      conteudo: req.body.conteudo
    };

    const resultado = await corrigirResposta(payload);

    if (resultado.step === "erro") {
      return res.status(400).json({
        step: "erro",
        message: resultado.message || "Erro ao processar correção"
      });
    }

    return res.status(200).json(resultado);

  } catch (error: any) {
    console.error("Erro na API de correção:", error);
    return res.status(500).json({
      step: "erro",
      message: "Erro interno ao processar correção"
    });
  }
});

export default router;

