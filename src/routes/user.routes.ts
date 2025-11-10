import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RegisterUserDto, LoginUserDto } from '../types/user';
import { userService } from '../services/user.service';
import { isAdmin } from '../middlewares/auth.middleware';
import { config } from '../config';
import { UserController } from '../controllers/user.controller';

// 定义路由
export const userRoutes = async (app: FastifyInstance) => {
  app.get('/notice', { preHandler: isAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await UserController.findAll();
      return users;
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  // 注册
  app.post<{ Body: RegisterUserDto }>(
    '/register',
    async (request: FastifyRequest<{ Body: RegisterUserDto }>, reply: FastifyReply) => {
      try {
        const user = await userService.register(request.body);
        return reply.status(201).send({ message: '注册成功', user });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        return reply.status(500).send({ message: '服务器错误' });
      }
    }
  );

  // 登录
  app.post<{ Body: LoginUserDto }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginUserDto }>, reply: FastifyReply) => {
      try {
        const { user } = await userService.login(request.body);
        
        // 生成 JWT 令牌
        const token = app.jwt.sign(
          { id: user.id, email: user.email },
          { expiresIn: config.jwtExpiresIn }
        );

        return reply.status(200).send({ message: '登录成功', user, token });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        return reply.status(500).send({ message: '服务器错误' });
      }
    }
  );

  // 获取当前用户信息（需要认证）
  app.get(
    '/me',
    // { preHandler: roleMiddleware },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = await userService.findById(request.params.id);
        if (!user) {
          return reply.status(404).send({ message: '用户不存在' });
        }
        return reply.status(200).send({ user });
      } catch (error) {
        return reply.status(500).send({ message: '服务器错误' });
      }
    }
  );
};
