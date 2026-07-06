import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/shell/AppShell";
import { AuthPage } from "@/pages/AuthPage";
import { EditorPage } from "@/pages/EditorPage";
import { HomePage } from "@/pages/HomePage";
import { PlayPage } from "@/pages/PlayPage";
import { SkinEditorPage } from "@/pages/SkinEditorPage";

function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/play/:worldId" element={<PlayPage />} />
          <Route path="/create" element={<EditorPage />} />

          <Route
            path="/"
            element={
              <ShellLayout>
                <HomePage />
              </ShellLayout>
            }
          />
          <Route
            path="/avatar"
            element={
              <ShellLayout>
                <SkinEditorPage />
              </ShellLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
