"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    // req.user는 authenticateToken 미들웨어에서 설정됨
    const user = req.user;
    if (!user) {
        return res.status(401).json({
            success: false,
            message: '인증이 필요합니다.',
        });
    }
    if (user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.',
        });
    }
    return next();
};
exports.requireAdmin = requireAdmin;
