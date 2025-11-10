import { pool } from "../db/mysql";

export class UserController {
  /**
   * 获取所有数据
   */
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM vip_packages');
    return rows;
  }
}