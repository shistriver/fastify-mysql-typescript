import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { uploadFile, listFiles } from '../services/oss.service';

// 定义路由参数类型
interface UploadQuery {
  bucket?: string;
  folder?: string;
}

// 注册OSS相关路由
export const ossRoutes = async (app: FastifyInstance) => {
  // 获取Bucket列表
  app.get('/buckets', async () => {
    try {
      const buckets = await listFiles();
      return {
        success: true,
        data: buckets,
      };
    } catch (error) {
      app.log.error('获取Bucket列表失败:' + error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取Bucket列表失败',
      };
    }
  });

  // 单文件上传
  app.post<{ Querystring: UploadQuery }>('/upload', async (request, reply) => {
    try {
      // 获取上传的文件
      const data = await request.file();
      
      // 检查是否有文件上传
      if (!data) {
        return reply.status(400).send({ error: '没有上传任何文件' });
      }
      
      // 检查文件类型（可根据需求修改）
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'video/mp4',         // MP4
        'video/mpeg',        // MPEG
        'video/quicktime',   // MOV
        'video/x-msvideo',   // AVI
        'video/x-ms-wmv',    // WMV
        'video/x-flv',       // FLV
        'video/webm',        // WebM
        'video/3gpp',        // 3GP
        'video/3gpp2'        // 3G2
      ];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        await data.toBuffer(); // 消耗流
        return reply.status(400).send({ 
          error: '不支持的文件类型' 
        });
      }
    
      // 生成唯一的文件名
      const fileExt = data.filename.split('.').pop() || '';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt ? `.${fileExt}` : ''}`;
      const objectPath = `uploads/${fileName}`; // OSS中的存储路径
      
      const result = await uploadFile(objectPath, data.file);

      return {
        errno: 0, // 注意：值是数字，不能是字符串
        data: {
          url: result, // 图片、视频 src ，必须
        }
      }
    } catch (error) {
      app.log.error('文件上传失败:' + error);
      return reply.code(400).send({
        ok: false,
        message: error instanceof Error ? error.message : '文件上传失败',
      });
    }
  });

  // 多文件上传
  // app.post<{ Querystring: UploadQuery }>('/upload-multiple', async (request, reply) => {
  //   try {
  //     const parts = request.parts();
  //     const files: any[] = [];
      
  //     // 收集所有文件
  //     for await (const part of parts) {
  //       if (part.type === 'file') {
  //         files.push(part);
  //       }
  //     }
      
  //     if (files.length === 0) {
  //       return reply.code(400).send({
  //         success: false,
  //         message: '未找到上传的文件',
  //       });
  //     }
      
  //     const { bucket, folder } = request.query;
      
  //     const results = await ossService.uploadMultipleFilesToOss(files, bucket, folder);
      
  //     return {
  //       success: true,
  //       count: results.length,
  //       data: results,
  //     };
  //   } catch (error) {
  //     app.log.error('多文件上传失败:' + error);
  //     return reply.code(400).send({
  //       success: false,
  //       message: error instanceof Error ? error.message : '多文件上传失败',
  //     });
  //   }
  // });
};
    