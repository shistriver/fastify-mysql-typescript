import dotenv from 'dotenv';
import { z } from 'zod';

const config = {
  port: parseInt(process.env.PORT || '3000'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// 加载环境变量
dotenv.config();

// 配置验证Schema
const ConfigSchema = z.object({
  port: z.string().default('3000').transform(Number),
  host: z.string().default('0.0.0.0'),
  ossAccessKeyId: z.string(),
  ossAccessKeySecret: z.string(),
  ossRegion: z.string(),
  ossDefaultBucket: z.string(),
});

// 解析并验证配置
const ossConfig = ConfigSchema.parse({
  port: process.env.PORT,
  host: process.env.HOST,
  ossAccessKeyId: process.env.OSS_ACCESS_KEY_ID,
  ossAccessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  ossRegion: process.env.OSS_REGION,
  ossDefaultBucket: process.env.OSS_DEFAULT_BUCKET,
});

// 验证OSS配置是否完整
const validateOssConfig = () => {
  if (!ossConfig.ossAccessKeyId || !ossConfig.ossAccessKeySecret || !ossConfig.ossRegion) {
    throw new Error('阿里云OSS配置不完整，请检查环境变量');
  }
};

export { config, ossConfig, validateOssConfig };
