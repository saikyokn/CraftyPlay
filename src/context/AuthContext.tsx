import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LoginInput, RegisterInput, UserAccount } from "@/types/user";
import type { AvatarSkin } from "@/types/skin";
import {
  createSession,
  getActiveSession,
  getSkinById,
  getUserById,
  loginUser,
  logout as logoutUser,
  registerUser,
  saveSkin,
} from "@/storage/auth";
import { seedCatalogIfEmpty } from "@/storage/platformDb";

interface AuthContextValue {
  user: UserAccount | null;
  skin: AvatarSkin | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateSkin: (patch: Partial<AvatarSkin>) => Promise<void>;
  refreshSkin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [skin, setSkin] = useState<AvatarSkin | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSkin = useCallback(async (skinId: string) => {
    const s = await getSkinById(skinId);
    setSkin(s);
  }, []);

  useEffect(() => {
    void (async () => {
      await seedCatalogIfEmpty();
      const session = await getActiveSession();
      if (session) {
        const u = await getUserById(session.userId);
        if (u) {
          setUser(u);
          await loadSkin(u.avatarSkinId);
        }
      }
      setLoading(false);
    })();
  }, [loadSkin]);

  const login = useCallback(
    async (input: LoginInput) => {
      const u = await loginUser(input);
      await createSession(u.id);
      setUser(u);
      await loadSkin(u.avatarSkinId);
    },
    [loadSkin],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const u = await registerUser(input);
      await createSession(u.id);
      setUser(u);
      await loadSkin(u.avatarSkinId);
    },
    [loadSkin],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setSkin(null);
  }, []);

  const updateSkin = useCallback(
    async (patch: Partial<AvatarSkin>) => {
      if (!skin) return;
      const updated = { ...skin, ...patch, updatedAt: new Date().toISOString() };
      await saveSkin(updated);
      setSkin(updated);
    },
    [skin],
  );

  const refreshSkin = useCallback(async () => {
    if (user) await loadSkin(user.avatarSkinId);
  }, [user, loadSkin]);

  return (
    <AuthContext.Provider
      value={{ user, skin, loading, login, register, logout, updateSkin, refreshSkin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
