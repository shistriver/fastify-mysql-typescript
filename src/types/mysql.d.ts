import { RowDataPacket, FieldPacket, ResultSetHeader, OkPacket } from 'mysql2';

// 明确区分单条数据和数组的类型
export type MySqlSingleResult<T> = [T & RowDataPacket, FieldPacket[]];
export type MySqlArrayResult<T> = [(T & RowDataPacket)[], FieldPacket[]];
export type MySqlCommandResult = [ResultSetHeader | OkPacket, FieldPacket[]];