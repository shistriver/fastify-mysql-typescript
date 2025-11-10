import OSS from 'ali-oss';
const { Readable } = require('stream');
import * as fs from 'fs';
import * as path from 'path';

// OSS 配置
const config = {
  accessKeyId: String(process.env.OSS_ACCESS_KEY_ID),
  accessKeySecret: String(process.env.OSS_ACCESS_KEY_SECRET),
  bucket: String(process.env.OSS_DEFAULT_BUCKET),
  region: String(process.env.OSS_REGION)
};

// 初始化 OSS 客户端
const client = new OSS(config);

/**
 * 上传文件到 OSS
 * @param localFilePath 本地文件路径
 * @param ossFilePath OSS 上的文件路径
 */
export const uploadFile = async(ossFilePath: string, file: any) => {
  try {

    // 直接通过流上传（更高效）
    await client.putStream(ossFilePath, Readable.from(file));
    
    const fileUrl = `https://${config.bucket}.${config.region}.aliyuncs.com/${ossFilePath}`;
    
    return fileUrl;
  } catch (error) {
    throw error;
  }
}

/**
 * 从 OSS 下载文件
 * @param ossFilePath OSS 上的文件路径
 * @param localFilePath 保存到本地的文件路径
 */
export const downloadFile = async (ossFilePath: string, localFilePath: string) => {
  try {
    console.log(`开始下载文件: ${ossFilePath} 到 ${localFilePath}`);
    
    // 确保本地目录存在
    const localDir = path.dirname(localFilePath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    // 下载文件
    const result = await client.get(ossFilePath, localFilePath);
    
    console.log('文件下载成功');
    return result;
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
}

/**
 * 列举 OSS 上的文件
 * @param prefix 文件名前缀，用于筛选
 * @param maxKeys 最大返回数量
 */
export const listFiles = async (prefix: string = '', maxKeys: number = 10) => {
  try {
    console.log(`列举文件，前缀: ${prefix}, 最大数量: ${maxKeys}`);
    
    const result = await client.list(
      { prefix, 'max-keys': maxKeys },  // 第一个参数：查询条件
      {}  // 第二个参数：请求选项（可以是空对象）
    );
    
    console.log(`找到 ${result.objects?.length || 0} 个文件`);
    return result.objects;
  } catch (error) {
    console.error('列举文件失败:', error);
    throw error;
  }
}

/**
 * 删除 OSS 上的文件
 * @param ossFilePath 要删除的文件路径
 */
export const deleteFile = async (ossFilePath: string) => {
  try {
    console.log(`删除文件: ${ossFilePath}`);
    
    const result = await client.delete(ossFilePath);
    
    console.log('文件删除成功');
    return result;
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
}

/**
 * 获取文件的访问 URL
 * @param ossFilePath 文件路径
 * @param expiration 过期时间，单位秒，默认3600秒
 */
export const getFileUrl = async (ossFilePath: string, expiration: number = 3600) => {
  try {
    console.log(`获取文件 ${ossFilePath} 的访问 URL`);
    
    // 生成带签名的 URL，用于临时访问私有文件
    const url = client.signatureUrl(ossFilePath, {
      expires: expiration
    });
    
    console.log('文件访问 URL:', url);
    return url;
  } catch (error) {
    console.error('获取文件 URL 失败:', error);
    throw error;
  }
}
