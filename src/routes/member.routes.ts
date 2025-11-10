import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getAllMembers, 
  getMemberById, 
  createMember, 
  updateMember, 
  updateMemberStatus, 
  deleteMember,
  getMemberByUsername,
  verifyPassword,
  updateLoginInfo
} from '../services/member.service';
import { CreateMemberDto, UpdateMemberDto, LoginDto } from '../types/member';
import { authenticate, isAdmin } from '../middlewares/auth.middleware';
import { config } from '../config';
import { MemberController } from '../controllers/member.controller'

export const memberRoutes = async (app: FastifyInstance) => {
  // 会员注册
  app.post<{ Body: CreateMemberDto }>('/register', async (request, reply) => {
    try {
      const { username } = request.body;
      
      // 检查用户名是否已存在
      const existingMember = await getMemberByUsername(username);
      if (existingMember) {
        return reply.code(400).send({ message: '用户名已存在' });
      }
      
      const member = await createMember(request.body);
      
      // 移除密码哈希，不返回给客户端
      const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.code(201).send({
        message: '会员注册成功',
        member: memberWithoutPassword
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '注册失败' });
    }
  });
  
  // 会员登录
  app.post<{ Body: LoginDto }>('/login', async (request, reply) => {
    try {
      const { username, password } = request.body;
      
      // 查找会员
      const member = await getMemberByUsername(username);
      if (!member) {
        return reply.code(401).send({ message: '用户名或密码错误' });
      }
      
      // 检查会员状态
      if (member.status !== 'normal') {
        return reply.code(403).send({ 
          message: `账号状态异常: ${member.status}`,
          reason: member.freeze_reason
        });
      }
      
      // 验证密码
      const isPasswordValid = await verifyPassword(password, member.password_hash!);
      if (!isPasswordValid) {
        return reply.code(401).send({ message: '用户名或密码错误' });
      }
      
      // 更新登录信息
      const ip = request.ip;
      await updateLoginInfo(member.member_id, ip);
      
      // 生成JWT令牌
      const token = app.jwt.sign(
        { member_id: member.member_id, username: member.username },
        { expiresIn: config.jwtExpiresIn }
      );
      
      // 移除密码哈希，不返回给客户端
      // const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.code(200).send({
        status: 'ok',
        message: '登录成功',
        token,
        // member: memberWithoutPassword
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '登录失败' });
    }
  });
  
  // 获取当前登录会员信息
  app.get('/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const payload = request.user as { member_id: number };
      const member = await getMemberById(payload.member_id);
      
      if (!member) {
        return reply.code(404).send({ message: '会员不存在' });
      }
      
      // 移除密码哈希，不返回给客户端
      const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.send({ data: memberWithoutPassword });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '获取会员信息失败' });
    }
  });
  
  // 获取所有会员（需要管理员权限）
  // app.get('/', { preHandler: [authenticate, isAdmin] }, async (request, reply) => {
  app.get('/', async (request, reply) => {
    try {
      const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
      const result = await getAllMembers(page, limit);
      return reply.send(result);
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '获取会员列表失败' });
    }
  });
  
  // 获取指定会员
  // app.get<{ Params: { id: number } }>('/:id', { preHandler: authenticate }, async (request, reply) => {
  app.get<{ Params: { id: number } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const payload = request.user as { member_id: number };
      
      // 管理员可以查看所有会员，普通会员只能查看自己
      if (payload.member_id !== id && payload.member_id !== 1) {
        return reply.code(403).send({ message: '没有权限查看此会员信息' });
      }
      
      const member = await getMemberById(id);
      
      if (!member) {
        return reply.code(404).send({ message: '会员不存在' });
      }
      
      // 移除密码哈希，不返回给客户端
      const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.send({ member: memberWithoutPassword });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '获取会员信息失败' });
    }
  });
  
  // 更新会员信息
  // app.put<{ Params: { id: number }, Body: UpdateMemberDto }>('/:id', { preHandler: authenticate }, async (request, reply) => {
  app.put<{ Params: { id: number }, Body: UpdateMemberDto }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const payload = request.user as { member_id: number };
      
      // 只能更新自己的信息，管理员除外
      if (payload.member_id !== id && payload.member_id !== 1) {
        return reply.code(403).send({ message: '没有权限更新此会员信息' });
      }
      
      const member = await updateMember(id, request.body);
      
      if (!member) {
        return reply.code(404).send({ message: '会员不存在' });
      }
      
      // 移除密码哈希，不返回给客户端
      const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.send({
        message: '会员信息更新成功',
        member: memberWithoutPassword
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '更新会员信息失败' });
    }
  });
  
  // 更新会员状态（需要管理员权限）
  // app.patch<{ Params: { id: number }, Body: { status: string, reason?: string } }>('/:id/status', { preHandler: [authenticate, isAdmin] }, async (request, reply) => {
  app.patch<{ Params: { id: number }, Body: { status: string, reason?: string } }>('/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, reason } = request.body;
      
      // 验证状态值是否有效
      const validStatuses = ['normal', 'frozen', 'cancelled', 'banned'];
      if (!validStatuses.includes(status)) {
        return reply.code(400).send({ message: '无效的状态值' });
      }
      
      const member = await updateMemberStatus(id, status as any, reason);
      
      if (!member) {
        return reply.code(404).send({ message: '会员不存在' });
      }
      
      // 移除密码哈希，不返回给客户端
      const { password_hash, ...memberWithoutPassword } = member;
      
      return reply.send({
        message: '会员状态更新成功',
        member: memberWithoutPassword
      });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '更新会员状态失败' });
    }
  });
  
  // 删除会员（逻辑删除）
  // app.delete<{ Params: { id: number } }>('/:id', { preHandler: authenticate }, async (request, reply) => {
  app.delete<{ Params: { id: number } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const payload = request.user as { member_id: number };
      
      // 只能删除自己的账号，管理员可以删除任何账号
      if (payload.member_id !== id && payload.member_id !== 1) {
        return reply.code(403).send({ message: '没有权限删除此会员' });
      }
      
      const result = await deleteMember(id);
      
      if (!result) {
        return reply.code(404).send({ message: '会员不存在' });
      }
      
      return reply.send({ message: '会员删除成功' });
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({ message: '删除会员失败' });
    }
  });

  app.post('/logout', { preHandler: authenticate }, MemberController.logout);
  
};
