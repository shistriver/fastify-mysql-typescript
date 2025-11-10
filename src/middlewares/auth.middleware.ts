import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

// 定义预处理器类型（可选，增强类型提示）
type PreHandler = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => Promise<void>;

// 简单的令牌黑名单存储（实际应用中应使用Redis等持久化存储）
export const tokenBlacklist = new Set<string>();

/**
 * 验证用户是否登录的预处理器
 */
export const requireAuth: PreHandler = async (request, reply) => {
  const token = request.headers.authorization?.split(' ')[1];
  
  if (!token) {
    reply.code(401).send({ error: '未提供令牌' });
    return; // 终止后续执行
  }
  
  try {
    // 验证令牌（示例，实际需结合业务实现）
    const decoded = await request.server.jwt.verify(token);
    request.user = decoded; // 将用户信息附加到request
  } catch (err) {
    reply.code(401).send({ error: '无效的令牌' });
  }
};

// 认证中间件 - 验证用户是否已登录
export const authenticate: PreHandler = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ message: '未授权访问，请先登录' });
  }
};

/**
 * 验证用户是否为管理员的预处理器
 */
export const isAdmin: PreHandler = async (request, reply) => {
  try {
    const payload = await request.jwtVerify<{ member_id: number }>();
    
    // 假设管理员的member_id为1，实际应用中应该有专门的角色字段
    if (payload.member_id !== 1) {
      return reply.code(403).send({ message: '没有权限执行此操作' });
    }
  } catch (err) {
    reply.code(401).send({ message: '未授权访问，请先登录' });
  }
};
