import { pool } from '../db/mysql';

export interface User {
  id?: number;
  name: string;
  email: string;
  age?: number;
  created_at?: Date;
}

export class UserModel {
  /**
   * 获取所有用户
   */
  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute('SELECT * FROM vip_packages');
    return rows as User[];
  }

  /**
   * 通过ID获取用户
   */
  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows as User[];
    return users.length > 0 ? users[0] : null;
  }

  /**
   * 创建新用户
   */
  static async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, age, created_at) VALUES (?, ?, ?, NOW())',
      [user.name, user.email, user.age]
    );

    // @ts-ignore
    const newUserId = result.insertId;
    return this.findById(newUserId) as Promise<User>;
  }

  /**
   * 更新用户
   */
  static async update(id: number, userData: Partial<User>): Promise<boolean> {
    const fields = Object.keys(userData).filter(key => key !== 'id' && key !== 'created_at');
    
    if (fields.length === 0) {
      return false;
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = [...fields.map(field => userData[field as keyof User]), id];

    const [result] = await pool.execute(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );

    // @ts-ignore
    return result.affectedRows > 0;
  }

  /**
   * 删除用户
   */
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    // @ts-ignore
    return result.affectedRows > 0;
  }
}
