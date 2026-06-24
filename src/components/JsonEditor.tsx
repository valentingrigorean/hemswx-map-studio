import { useRef } from 'preact/hooks';
import { useComputed, useSignal } from '@preact/signals';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

interface JsonEditorProps {
  title?: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const cmdKey = isMac ? 'Cmd' : 'Ctrl';

const opacityReplacer = (key: string, value: any) => {
  if (key === 'opacity' && typeof value === 'number') {
    return parseFloat(value.toFixed(1));
  }
  return value;
};

function formatConfigJson(value: any): string {
  const jsonStr = JSON.stringify(value, opacityReplacer, 2);
  return jsonStr.replace(/"opacity":\s*(\d+)(?!\.)/g, '"opacity": $1.0');
}

export default function JsonEditor({
  title = 'JSON Editor',
  value,
  onChange,
  placeholder = '{}',
  readOnly = false,
  height = '400px'
}: JsonEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const isValidJson = useSignal(true);
  const errorMessage = useSignal<string>('');
  const isFormatting = useSignal(false);

  const jsonString = useComputed(() => {
    try {
      if (value === null || value === undefined) {
        return '';
      }
      return formatConfigJson(value);
    } catch (error) {
      return '';
    }
  });

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false,
    });

    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 12,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      bracketPairColorization: { enabled: true },
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
      formatJson();
    });
  };

  const parseAndFlag = (text: string): any | undefined => {
    try {
      const parsed = JSON.parse(text);
      isValidJson.value = true;
      errorMessage.value = '';
      return parsed;
    } catch (error) {
      isValidJson.value = false;
      errorMessage.value = error instanceof Error ? error.message : 'Invalid JSON';
      return undefined;
    }
  };

  const commit = (text: string) => {
    const parsed = parseAndFlag(text);
    if (parsed !== undefined) onChange(parsed);
  };

  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = (newValue: string | undefined) => {
    if (readOnly || !newValue) return;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => commit(newValue), 400);
  };

  const handleSave = () => {
    if (!editorRef.current || readOnly) return;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commit(editorRef.current.getValue());
  };

  const formatJson = async () => {
    if (!editorRef.current || !monacoRef.current || readOnly) return;

    isFormatting.value = true;

    try {
      const parsed = JSON.parse(editorRef.current.getValue());
      editorRef.current.setValue(formatConfigJson(parsed));
      onChange(parsed);

      isValidJson.value = true;
      errorMessage.value = '';
    } catch (error) {
      await editorRef.current.getAction('editor.action.formatDocument')?.run();
    } finally {
      isFormatting.value = false;
    }
  };

  const validateJson = () => {
    if (!editorRef.current) return;
    return parseAndFlag(editorRef.current.getValue()) !== undefined;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap gap-2 mb-3 items-center flex-shrink-0">
        <span className="text-slate-500">{title}</span>
        <div className="ml-auto flex gap-2">
          {!readOnly && (
            <>
              <button
                className="btn small"
                onClick={validateJson}
                title="Validate JSON"
              >
                Validate
              </button>
              <button
                className="btn small"
                onClick={formatJson}
                disabled={isFormatting.value}
                title={`Format JSON (${cmdKey}+Shift+F)`}
              >
                {isFormatting.value ? 'Formatting...' : 'Format'}
              </button>
            </>
          )}
        </div>
      </div>

      {!isValidJson.value && errorMessage.value && (
        <div className="bg-red-900/30 border border-red-500/50 rounded p-2 mb-2 flex-shrink-0">
          <div className="text-red-300 text-xs">
            <span className="font-medium">JSON Error:</span> {errorMessage.value}
          </div>
        </div>
      )}

      {isValidJson.value && !readOnly && (
        <div className="bg-green-900/30 border border-green-500/50 rounded p-2 mb-2 flex-shrink-0">
          <div className="text-green-300 text-xs">
            ✓ Valid JSON - Press {cmdKey}+S to save changes
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 border border-slate-600 rounded overflow-hidden">
        <Editor
          height={height}
          language="json"
          theme="vs-dark"
          value={jsonString.value || placeholder}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: readOnly,
            contextmenu: true,
            automaticLayout: true,
          }}
          loading={<div className="flex items-center justify-center h-full text-slate-400">Loading JSON Editor...</div>}
        />
      </div>

      <div className="text-xs text-slate-500 mt-2 flex-shrink-0">
        {readOnly ? (
          'Read-only JSON view'
        ) : (
          <>
            <span className="font-medium">Shortcuts:</span> {cmdKey}+S to save • {cmdKey}+Shift+F to format • Auto-validation enabled
          </>
        )}
      </div>
    </div>
  );
}
