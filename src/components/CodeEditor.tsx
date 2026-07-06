import Editor, { type OnMount } from "@monaco-editor/react";
import { useWorld } from "@/context/WorldContext";
import { useCallback, useRef } from "react";
import type { editor } from "monaco-editor";

const ASSEMBLYSCRIPT_KEYWORDS = [
  "export", "function", "class", "const", "let", "var", "if", "else",
  "for", "while", "return", "break", "continue", "switch", "case",
  "default", "void", "null", "true", "false", "as", "instanceof",
];

const ASSEMBLYSCRIPT_TYPES = [
  "i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64",
  "f32", "f64", "bool", "string", "Array", "Map", "Set",
];

const ASSEMBLYSCRIPT_BUILTINS = [
  "onStart", "onUpdate", "onTouch", "onCollision",
  "console.log", "Math", "Date",
];

function registerAssemblyScriptLanguage(monaco: typeof import("monaco-editor")) {
  const langId = "assemblyscript";

  if (monaco.languages.getLanguages().some((l) => l.id === langId)) return;

  monaco.languages.register({ id: langId });

  monaco.languages.setMonarchTokensProvider(langId, {
    defaultToken: "",
    keywords: ASSEMBLYSCRIPT_KEYWORDS,
    typeKeywords: ASSEMBLYSCRIPT_TYPES,
    builtins: ASSEMBLYSCRIPT_BUILTINS,
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/\b\d+(\.\d+)?(f32|f64)?\b/, "number"],
        [
          /\b(export|function|class|const|let|var|if|else|for|while|return|break|continue|switch|case|default|void|null|true|false|as|instanceof)\b/,
          "keyword",
        ],
        [/\b(i8|i16|i32|i64|u8|u16|u32|u64|f32|f64|bool|string)\b/, "type"],
        [/\b(onStart|onUpdate|onTouch|onCollision)\b/, "predefined"],
        [/[a-zA-Z_]\w*/, "identifier"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });

  monaco.languages.registerCompletionItemProvider(langId, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const keywordSuggestions = [
        ...ASSEMBLYSCRIPT_KEYWORDS,
        ...ASSEMBLYSCRIPT_TYPES,
        ...ASSEMBLYSCRIPT_BUILTINS,
      ].map((label) => ({
        label,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: label,
        range,
      }));

      const snippetSuggestions = [
        {
          label: "onStart",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "export function onStart(): void {",
            "  $0",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "onUpdate",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: [
            "export function onUpdate(deltaTime: f32): void {",
            "  $0",
            "}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
      ];

      return { suggestions: [...keywordSuggestions, ...snippetSuggestions] };
    },
  });
}

export function CodeEditorPanel() {
  const { activeScript, updateScript } = useWorld();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = useCallback((ed, monaco) => {
    editorRef.current = ed;
    registerAssemblyScriptLanguage(monaco);
    monaco.editor.setTheme("craftyplay-dark");
  }, []);

  if (!activeScript) {
    return (
      <div className="flex h-full flex-col bg-surface-950">
        <header className="flex items-center border-b border-surface-800 bg-surface-900 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Script Editor
          </span>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-surface-500">
          スクリプト付きオブジェクトを選択してください
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-950">
      <header className="flex items-center gap-2 border-b border-surface-800 bg-surface-900 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Script Editor
        </span>
        <span className="text-surface-600">/</span>
        <span className="truncate text-sm text-surface-200">{activeScript.name}</span>
        <span className="ml-auto rounded bg-accent-500/15 px-2 py-0.5 text-[10px] font-medium text-accent-400">
          AssemblyScript
        </span>
      </header>
      <div className="flex-1">
        <Editor
          height="100%"
          language="assemblyscript"
          theme="vs-dark"
          value={activeScript.source}
          onChange={(value) => {
            if (value !== undefined) updateScript(activeScript.id, value);
          }}
          onMount={handleMount}
          beforeMount={(monaco) => {
            monaco.editor.defineTheme("craftyplay-dark", {
              base: "vs-dark",
              inherit: true,
              rules: [
                { token: "keyword", foreground: "c792ea" },
                { token: "type", foreground: "82aaff" },
                { token: "predefined", foreground: "ffcb6b" },
                { token: "string", foreground: "c3e88d" },
                { token: "comment", foreground: "546e7a", fontStyle: "italic" },
              ],
              colors: {
                "editor.background": "#0d0f14",
                "editor.lineHighlightBackground": "#1a1e28",
                "editorCursor.foreground": "#818cf8",
                "editor.selectionBackground": "#6366f133",
              },
            });
          }}
          options={{
            fontFamily: "ui-monospace, Consolas, monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            tabSize: 2,
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  );
}
