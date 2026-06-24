import { ingestRaw, startEmpty } from '../lib/v2/ingest';
import { readJsonFile } from '../lib/utils';

interface EmptyStateProps {
  onOpenClick: () => void;
}

export default function EmptyState({ onOpenClick }: EmptyStateProps) {
  const handleStartEmpty = () => startEmpty();

  const handlePaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    try {
      ingestRaw(JSON.parse(text));
    } catch {
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    const jsonFile = files.find(f => f.type === 'application/json' || f.name.endsWith('.json'));
    if (jsonFile) readJsonFile(jsonFile, ingestRaw);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]" onPaste={handlePaste as any}>
      <div
        className="w-full max-w-2xl text-center p-8 border border-dashed border-slate-600 rounded-xl bg-slate-900/40"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <h2 className="text-lg mb-2 text-slate-100">Get Started</h2>
        <p className="mb-4 text-slate-400">Choose an option to begin</p>
        <div className="flex flex-col gap-2 items-center">
          <button className="btn primary" onClick={handleStartEmpty}>Start with Empty Structure</button>
          <button className="btn" onClick={onOpenClick}>Open Existing JSON…</button>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          Tip: drop or paste JSON here. Legacy v1 files are converted to v2 automatically.
        </div>
      </div>
    </div>
  );
}
