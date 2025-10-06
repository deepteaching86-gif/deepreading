"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const admin_middleware_1 = require("../../middleware/admin.middleware");
const questions_controller_1 = require("../../controllers/admin/questions.controller");
const router = (0, express_1.Router)();
// 모든 라우트에 인증 및 관리자 권한 필요
router.use(auth_middleware_1.authenticateToken);
router.use(admin_middleware_1.requireAdmin);
// GET /api/admin/questions - 모든 문항 조회
router.get('/', questions_controller_1.getAllQuestions);
// GET /api/admin/questions/template/:templateCode - 특정 테스트 템플릿의 문항 조회
router.get('/template/:templateCode', questions_controller_1.getQuestionsByTemplate);
// GET /api/admin/questions/:id - 특정 문항 조회
router.get('/:id', questions_controller_1.getQuestionById);
// POST /api/admin/questions - 문항 생성
router.post('/', questions_controller_1.createQuestion);
// PUT /api/admin/questions/:id - 문항 수정
router.put('/:id', questions_controller_1.updateQuestion);
// DELETE /api/admin/questions/:id - 문항 삭제
router.delete('/:id', questions_controller_1.deleteQuestion);
exports.default = router;
