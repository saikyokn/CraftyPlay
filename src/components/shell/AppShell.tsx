import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AvatarPreview } from "@/components/avatar/AvatarPreview";
import { createDefaultSkin } from "@/types/skin";

const NAV = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/avatar", label: "Avatar", icon: "👤" },
  { to: "/create", label: "Create", icon: "🔧" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, skin, logout } = useAuth();
  const previewSkin = skin ?? createDefaultSkin("guest", "Guest");

  return (
    <div className="flex h-screen flex-col bg-surface-950">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-surface-800 bg-surface-900/95 px-4 backdrop-blur-sm">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent-500 text-xs font-bold text-white">
            CP
          </div>
          <span className="text-sm font-semibold text-surface-100">CraftyPlay</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent-500/20 text-accent-400"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200",
                ].join(" ")
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <AvatarPreview skin={previewSkin} size="sm" />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-surface-200">{user.displayName}</p>
                  <p className="text-[10px] text-surface-500">@{user.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-surface-400 hover:bg-surface-800 hover:text-surface-200"
              >
                Logout
              </button>
            </>
          ) : (
            <NavLink
              to="/auth"
              className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
            >
              Sign In
            </NavLink>
          )}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
