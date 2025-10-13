import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role = 'student', phone, grade, schoolName, parentPhone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수 항목입니다.',
      });
    }

    // Validate grade for students
    if (role === 'student') {
      if (!grade || grade < 1 || grade > 9) {
        return res.status(400).json({
          success: false,
          message: '학생은 학년 정보(1-9)가 필수입니다.',
        });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 이메일입니다.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Create user and student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          phone,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Create Student profile if role is student
      if (role === 'student') {
        await tx.student.create({
          data: {
            userId: user.id,
            grade: parseInt(grade),
            schoolName: schoolName || null,
            parentPhone: parentPhone || null,
          },
        });
      }

      return user;
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: result.id,
        email: result.email,
        role: result.role,
      },
      env.JWT_SECRET as string,
      { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
    );

    return res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        user: result,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', { email, timestamp: new Date().toISOString() });

    // Validation
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.',
      });
    }

    // Find user
    console.log('🔍 Searching for user:', email);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    console.log('✅ User found:', { id: user.id, role: user.role });

    // Verify password
    console.log('🔑 Verifying password...');
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    console.log('✅ Password verified successfully');

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET as string,
      { expiresIn: env.JWT_ACCESS_EXPIRY } as jwt.SignOptions
    );

    console.log('✅ Login successful:', { userId: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      ...(process.env.NODE_ENV === 'development' && { error: (error as Error).message }),
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.',
    });
  }
};
