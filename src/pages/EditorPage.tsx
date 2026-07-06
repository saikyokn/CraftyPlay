import { WorldProvider } from "@/context/WorldContext";
import { EditorLayout } from "@/components/EditorLayout";

export function EditorPage() {
  return (
    <WorldProvider>
      <EditorLayout />
    </WorldProvider>
  );
}
