import { User, RegisterUserDto, LoginUserDto, UserResponse } from '../types/user';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// 模拟数据库
let users: User[] = [];

export class UserService {
  // 注册新用户
  async register(userData: RegisterUserDto): Promise<UserResponse> {
    // 检查用户是否已存在
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('用户已存在');
    }

    // 密码加密
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // 创建新用户
    const newUser: User = {
      id: uuidv4(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存用户（实际应用中应保存到数据库）
    users.push(newUser);

    // 返回不包含密码的用户信息
    const { password, ...userResponse } = newUser;
    return userResponse;
  }

  // 用户登录
  async login(credentials: LoginUserDto): Promise<{ user: UserResponse; token: string }> {
    // 查找用户
    const user = users.find(u => u.email === credentials.email);
    if (!user) {
      throw new Error('邮箱或密码不正确');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('邮箱或密码不正确');
    }

    // 返回用户信息和令牌（令牌将在路由层生成）
    const { password, ...userResponse } = user;
    return { user: userResponse, token: '' };
  }

  // 根据ID查找用户
  async findById(id: string): Promise<UserResponse | null> {
    const user = users.find(u => u.id === id);
    if (!user) {
      return null;
    }

    const { password, ...userResponse } = user;
    return userResponse;
  }

  // 根据邮箱查找用户（用于验证）
  async findByEmail(email: string): Promise<User | null> {
    return users.find(u => u.email === email) || null;
  }
}

// 创建服务实例
export const userService = new UserService();
