"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const env_1 = require("../../config/env");
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    try {
        const { email, password, name, role = 'student', phone } = req.body;
        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: '이메일, 비밀번호, 이름은 필수 항목입니다.',
            });
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
        const passwordHash = await bcrypt_1.default.hash(password, env_1.env.BCRYPT_ROUNDS);
        // Create user
        const user = await prisma.user.create({
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
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRY });
        return res.status(201).json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.',
            });
        }
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
        }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRY });
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
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.',
        });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
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
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다.',
        });
    }
};
exports.getProfile = getProfile;
