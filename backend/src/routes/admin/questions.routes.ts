import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByTemplate,
  uploadImage,
  upload,
} from '../../controllers/admin/questions.controller';

const router = Router();

// 모든 라우트에 인증 및 관리자 권한 필요
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/questions - 모든 문항 조회
router.get('/', getAllQuestions);

// GET /api/admin/questions/template/:templateCode - 특정 테스트 템플릿의 문항 조회
router.get('/template/:templateCode', getQuestionsByTemplate);

// POST /api/admin/questions/upload-image - 이미지 업로드
router.post('/upload-image', upload.single('image'), uploadImage);

// GET /api/admin/questions/:id - 특정 문항 조회
router.get('/:id', getQuestionById);

// POST /api/admin/questions - 문항 생성
router.post('/', createQuestion);

// PUT /api/admin/questions/:id - 문항 수정
router.put('/:id', updateQuestion);

// DELETE /api/admin/questions/:id - 문항 삭제
router.delete('/:id', deleteQuestion);

export default router;
