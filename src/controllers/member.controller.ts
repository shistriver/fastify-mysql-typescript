import { FastifyRequest, FastifyReply } from 'fastify';
import { tokenBlacklist } from '../middlewares/auth.middleware'

export class MemberController {
  /**
   * 获取所有数据
   */
  static async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 从请求头中获取令牌
      const token = request.headers.authorization?.split(' ')[1];
      // console.log('token', token)
      // console.log('tokenBlacklist', tokenBlacklist)
      
      if (token) {
        // 将令牌加入黑名单
        tokenBlacklist.add(token);
        // 可以设置一个定时任务定期清理过期的令牌
        // TODO
      }

      // 提示客户端删除存储的令牌
      reply.header('Clear-Site-Data', '"storage"');
      
      return reply.send({ 
        message: '成功登出' 
      });
    } catch (error) {
      return reply.status(500).send({ 
        message: '登出失败', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}