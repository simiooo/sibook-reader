export type User = Partial<{
  id: string,
  username: string,
  nickname: string,
  des: string,
  email: string,
  phone: string,
  created_at: string,
  updated_at: string,
  salt: string,
  gender: '男' | '女', // 假设性别只有男女两种情况，如果有其他情况可以继续添加
  avatar: string
}>

export type UserSimply = Partial<{
  id: string,
  username: string,
  nickname: string,
  avatar: string
}>

export type IslandMembers = Partial<{
  id: number;
  islandId: number;
  memberId: string;
  memberName: string;
  joinDate: string; // 或者使用 Date 类型，如果你希望将字符串转换为 Date 对象
}>