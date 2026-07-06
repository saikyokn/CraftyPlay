import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type AuthMode = "login" | "register";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("register");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("パスワードが一致しません");
        }
        if (password.length < 6) {
          throw new Error("パスワードは6文字以上にしてください");
        }
        await register({ username, displayName, email, password });
      } else {
        await login({ usernameOrEmail: username, password });
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Branding side */}
      <aside className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-accent-600/30 via-surface-900 to-surface-950 p-10 lg:flex">
        <div>
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent-500 text-lg font-bold text-white">
            CP
          </div>
          <h1 className="mt-8 text-4xl font-bold text-surface-100">Join CraftyPlay</h1>
          <p className="mt-4 max-w-sm text-surface-400">
            アカウントを作成して、ワールドを作り、スキンをカスタマイズし、友達とプレイしよう。
            すべてブラウザ内で完結します。
          </p>
        </div>
        <ul className="space-y-3 text-sm text-surface-400">
          <li>🎮 ユーザー作成ワールドをプレイ</li>
          <li>👤 アバタースキンエディタ</li>
          <li>🔧 ワールドビルダー（UGC エディタ）</li>
          <li>💾 データはブラウザ内 IndexedDB に保存</li>
        </ul>
      </aside>

      {/* Form side */}
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-surface-100">
              {mode === "register" ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              {mode === "register"
                ? "無料でアカウントを作成"
                : "アカウントにログイン"}
            </p>
          </div>

          <div className="mb-6 flex rounded-lg border border-surface-800 bg-surface-900 p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={[
                  "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-accent-500 text-white"
                    : "text-surface-400 hover:text-surface-200",
                ].join(" ")}
              >
                {m === "register" ? "Sign Up" : "Log In"}
              </button>
            ))}
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-surface-400">Username</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2.5 text-sm outline-none focus:border-accent-500"
                placeholder="coolbuilder42"
              />
            </label>

            {mode === "register" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-surface-400">Display Name</span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2.5 text-sm outline-none focus:border-accent-500"
                  placeholder="Cool Builder"
                />
              </label>
            )}

            {mode === "register" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-surface-400">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2.5 text-sm outline-none focus:border-accent-500"
                  placeholder="you@example.com"
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-surface-400">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2.5 text-sm outline-none focus:border-accent-500"
                placeholder="••••••••"
              />
            </label>

            {mode === "register" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-surface-400">Confirm Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2.5 text-sm outline-none focus:border-accent-500"
                  placeholder="••••••••"
                />
              </label>
            )}

            {error && (
              <p className="rounded-lg bg-danger-500/10 px-3 py-2 text-sm text-danger-500">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent-500 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
            >
              {loading
                ? "Please wait…"
                : mode === "register"
                  ? "Create Account"
                  : "Log In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-surface-500">
            <Link to="/" className="text-accent-400 hover:underline">
              ← Back to Home
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
