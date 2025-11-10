export interface Member {
  member_id: number;
  member_no: string;
  username?: string;
  password_hash?: string;
  real_name?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: Date;
  age?: number;
  avatar_url?: string;
  phone?: string;
  email?: string;
  phone_verified: boolean;
  email_verified: boolean;
  status: 'normal' | 'frozen' | 'cancelled' | 'banned';
  freeze_reason?: string;
  cancel_time?: Date;
  register_ip?: string;
  register_channel?: string;
  register_time: Date;
  last_login_ip?: string;
  last_login_time?: Date;
  login_count: number;
  remark?: string;
  tags?: string;
  source_referrer?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemberDto {
  username: string;
  password: string;
  real_name?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  register_channel?: string;
  source_referrer?: string;
}

export interface UpdateMemberDto {
  real_name?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: Date;
  avatar_url?: string;
  phone?: string;
  email?: string;
  remark?: string;
  tags?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface MemberLoginResponse {
  token: string;
  member: Omit<Member, 'password_hash'>;
}
