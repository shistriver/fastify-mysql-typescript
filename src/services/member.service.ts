import { pool } from '../db/mysql';
import { Member, CreateMemberDto, UpdateMemberDto } from '../types/member';
import bcrypt from 'bcrypt';

// 生成会员编号
const generateMemberNo = (): string => {
  return `MEM${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

// 密码加密
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// 验证密码
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// 获取所有会员
export const getAllMembers = async (page: number = 1, limit: number = 10): Promise<{ members: Member[], total: number }> => {
  const offset = (page - 1) * limit;
  const [members] = await pool.execute(
    'SELECT * FROM members LIMIT ? OFFSET ?',
    [limit, offset]
  );
  
  const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM members');
  const total = (totalResult as any[])[0].total;
  
  return {
    members: members as Member[],
    total
  };
};

// 根据ID获取会员
export const getMemberById = async (id: number): Promise<Member | null> => {
  const [rows] = await pool.execute(
    'SELECT * FROM members WHERE member_id = ?',
    [id]
  );
  
  const member = (rows as Member[])[0];
  return member || null;
};

// 根据用户名获取会员
export const getMemberByUsername = async (username: string): Promise<Member | null> => {
  const [rows] = await pool.execute(
    'SELECT * FROM members WHERE username = ?',
    [username]
  );
  
  const member = (rows as Member[])[0];
  return member || null;
};

// 创建会员
export const createMember = async (memberData: CreateMemberDto): Promise<Member> => {
  const memberNo = generateMemberNo();
  const passwordHash = await hashPassword(memberData.password);
  const now = new Date();
  
  const [result] = await pool.execute(
    `INSERT INTO members (
      member_no, username, password_hash, real_name, nickname, 
      phone, email, register_channel, source_referrer, 
      register_time, login_count, status, 
      phone_verified, email_verified, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      memberNo,
      memberData.username,
      passwordHash,
      memberData.real_name || null,
      memberData.nickname || null,
      memberData.phone || null,
      memberData.email || null,
      memberData.register_channel || null,
      memberData.source_referrer || null,
      now,
      0,
      'normal',
      0,
      0,
      now,
      now
    ]
  );
  
  const insertId = (result as any).insertId;
  return getMemberById(insertId) as Promise<Member>;
};

// 更新会员
export const updateMember = async (id: number, memberData: UpdateMemberDto): Promise<Member | null> => {
  const existingMember = await getMemberById(id);
  if (!existingMember) {
    return null;
  }
  
  const now = new Date();
  let age = existingMember.age;
  
  // 如果生日更新了，重新计算年龄
  if (memberData.birthday) {
    const birthDate = new Date(memberData.birthday);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  
  const [result] = await pool.execute(
    `UPDATE members SET 
      real_name = ?, nickname = ?, gender = ?, 
      birthday = ?, age = ?, avatar_url = ?, 
      phone = ?, email = ?, remark = ?, tags = ?,
      updated_at = ?
     WHERE member_id = ?`,
    [
      memberData.real_name || existingMember.real_name,
      memberData.nickname || existingMember.nickname,
      memberData.gender || existingMember.gender,
      memberData.birthday || existingMember.birthday,
      age,
      memberData.avatar_url || existingMember.avatar_url,
      memberData.phone || existingMember.phone,
      memberData.email || existingMember.email,
      memberData.remark || existingMember.remark,
      memberData.tags || existingMember.tags,
      now,
      id
    ]
  );
  
  return getMemberById(id);
};

// 更新会员状态
export const updateMemberStatus = async (id: number, status: Member['status'], reason?: string): Promise<Member | null> => {
  const existingMember = await getMemberById(id);
  if (!existingMember) {
    return null;
  }
  
  const now = new Date();
  let cancelTime = existingMember.cancel_time;
  
  // 如果状态是注销，记录注销时间
  if (status === 'cancelled') {
    cancelTime = now;
  }
  
  const [result] = await pool.execute(
    `UPDATE members SET 
      status = ?, freeze_reason = ?, cancel_time = ?,
      updated_at = ?
     WHERE member_id = ?`,
    [
      status,
      reason || null,
      cancelTime,
      now,
      id
    ]
  );
  
  return getMemberById(id);
};

// 更新登录信息
export const updateLoginInfo = async (id: number, ip: string): Promise<Member | null> => {
  const existingMember = await getMemberById(id);
  if (!existingMember) {
    return null;
  }
  
  const now = new Date();
  
  const [result] = await pool.execute(
    `UPDATE members SET 
      last_login_ip = ?, last_login_time = ?,
      login_count = ?, updated_at = ?
     WHERE member_id = ?`,
    [
      ip,
      now,
      existingMember.login_count + 1,
      now,
      id
    ]
  );
  
  return getMemberById(id);
};

// 删除会员（逻辑删除，更新状态为注销）
export const deleteMember = async (id: number): Promise<boolean> => {
  const result = await updateMemberStatus(id, 'cancelled', '用户主动删除');
  return !!result;
};
