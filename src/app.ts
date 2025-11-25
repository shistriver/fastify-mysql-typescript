import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { testConnection } from './db/mysql';
import { UserModel, User } from './models/user';
import { memberRoutes } from './routes/member.routes';
import { userRoutes } from './routes/user.routes';
import { ossRoutes } from './routes/oss.routes';
import { categoryRoutes } from './routes/category.routes';
import { articleRoutes } from './routes/article.routes';
import { config } from './config';
import { processDates } from './utils/dateHelper';

// 加载环境变量
dotenv.config();

const app: FastifyInstance = fastify({
  logger: false,
  // logger: {
  //   level: 'info'
  // }
});

// 使用钩子函数拦截所有响应，确保时间格式化生效
app.addHook('preSerialization', (request, reply, payload, done) => {
  try {
    // 处理响应数据
    const processedPayload = processDates(payload);
    done(null, processedPayload);
  } catch (error) {
    done(error as Error);
  }
});

// 注册插件
app.register(cors, {
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// 安全的中间件：防止XSS攻击
app.register(helmet);

app.register(jwt, {
  secret: config.jwtSecret
});

// 注册multipart插件用于处理文件上传
app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制单个文件大小为10MB
    files: 10 // 限制最多10个文件
  }
});

// 注册路由
app.register(memberRoutes, { prefix: '/api/members' });

// 注册路由
app.register(userRoutes, { prefix: '/api/users' });

// 注册OSS相关路由
app.register(ossRoutes, { prefix: '/oss' });

// 注册分类相关路由
app.register(categoryRoutes, { prefix: '/api/category' });

// 注册文章相关路由
app.register(articleRoutes, { prefix: '/api' });

// 定义路由
app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
  const user = { id: 1, username: 'test', role: 'user' };
  const token = app.jwt.sign({
    id: user.id,
    username: user.username,
    role: user.role,
  });
  return { message: token };
  // return { message: '欢迎使用 API' };
});

// 用户相关路由
app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const users = await UserModel.findAll();
    return users;
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch users' });
  }
});

app.get('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return user;
  } catch (error) {
    reply.status(500).send({ error: 'Failed to fetch user' });
  }
});

app.post('/users', async (request: FastifyRequest<{ Body: Omit<User, 'id' | 'created_at'> }>, reply: FastifyReply) => {
  try {
    const newUser = await UserModel.create(request.body);
    reply.status(201).send(newUser);
  } catch (error) {
    reply.status(500).send({ error: 'Failed to create user' });
  }
});

app.put('/users/:id', async (request: FastifyRequest<{ 
  Params: { id: string },
  Body: Partial<User>
}>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    const updated = await UserModel.update(id, request.body);
    if (!updated) {
      return reply.status(404).send({ error: 'User not found or no changes made' });
    }
    
    return { message: 'User updated successfully' };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to update user' });
  }
});

app.delete('/users/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const id = parseInt(request.params.id);
    if (isNaN(id)) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    const deleted = await UserModel.delete(id);
    if (!deleted) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return { message: 'User deleted successfully' };
  } catch (error) {
    reply.status(500).send({ error: 'Failed to delete user' });
  }
});

// 启动服务器
const start = async () => {
  try {
    // 连接数据库
    await testConnection();
    
    // 启动服务器
    await app.listen({ port: config.port });
    console.log(`服务器运行在 http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
