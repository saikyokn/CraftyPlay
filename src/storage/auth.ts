import type { AuthSession, LoginInput, RegisterInput, UserAccount } from "@/types/user";
import type { AvatarSkin } from "@/types/skin";
import { createDefaultSkin } from "@/types/skin";
import {
  platformGet,
  platformGetAll,
  platformGetByIndex,
  platformPut,
  platformSetSetting,
  platformGetSetting,
} from "@/storage/platformDb";

const SESSION_KEY = "activeSession";

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function registerUser(input: RegisterInput): Promise<UserAccount> {
  const existingUser = await platformGetByIndex<UserAccount>("users", "username", input.username);
  if (existingUser) throw new Error("このユーザー名は既に使われています");

  const existingEmail = await platformGetByIndex<UserAccount>("users", "email", input.email);
  if (existingEmail) throw new Error("このメールアドレスは既に登録されています");

  const skin = createDefaultSkin("pending", `${input.displayName}'s Avatar`);
  const user: UserAccount = {
    id: crypto.randomUUID(),
    username: input.username,
    displayName: input.displayName,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    avatarSkinId: skin.id,
    createdAt: new Date().toISOString(),
  };

  skin.userId = user.id;
  await platformPut("skins", skin);
  await platformPut("users", user);
  return user;
}

export async function loginUser(input: LoginInput): Promise<UserAccount> {
  let user =
    (await platformGetByIndex<UserAccount>("users", "username", input.usernameOrEmail)) ??
    (await platformGetByIndex<UserAccount>("users", "email", input.usernameOrEmail));

  if (!user) throw new Error("ユーザーが見つかりません");

  const hash = await hashPassword(input.password);
  if (hash !== user.passwordHash) throw new Error("パスワードが正しくありません");

  return user;
}

export async function createSession(userId: string): Promise<AuthSession> {
  const session: AuthSession = {
    userId,
    token: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  await platformSetSetting(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getActiveSession(): Promise<AuthSession | null> {
  const raw = await platformGetSetting(SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw) as AuthSession;
  if (new Date(session.expiresAt) < new Date()) {
    await logout();
    return null;
  }
  return session;
}

export async function logout(): Promise<void> {
  await platformSetSetting(SESSION_KEY, "");
}

export async function getUserById(id: string): Promise<UserAccount | null> {
  return platformGet<UserAccount>("users", id);
}

export async function getSkinById(id: string): Promise<AvatarSkin | null> {
  return platformGet<AvatarSkin>("skins", id);
}

export async function saveSkin(skin: AvatarSkin): Promise<void> {
  await platformPut("skins", { ...skin, updatedAt: new Date().toISOString() });
}

export async function getAllUsers(): Promise<UserAccount[]> {
  return platformGetAll<UserAccount>("users");
}
