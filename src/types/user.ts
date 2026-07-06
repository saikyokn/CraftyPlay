export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  avatarSkinId: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: string;
}

export interface RegisterInput {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
}
