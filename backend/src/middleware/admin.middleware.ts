import { Request, Response, NextFunction } from 'express';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // req.user는 authenticateToken 미들웨어에서 설정됨
  const user = (req as any).user;

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

  next();
};
