import { WorldProvider } from "@/context/WorldContext";
import { EditorLayout } from "@/components/EditorLayout";

export default function App() {
  return (
    <WorldProvider>
      <EditorLayout />
    </WorldProvider>
  );
}
