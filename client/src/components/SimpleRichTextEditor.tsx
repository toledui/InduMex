'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Link2, Pilcrow, Underline } from 'lucide-react';

type SimpleRichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-slate-300 transition-colors hover:border-[#F58634]/50 hover:text-white"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export default function SimpleRichTextEditor({
  value,
  onChange,
  placeholder = 'Describe tu empresa...',
}: SimpleRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function runCommand(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || '');
  }

  function insertLink() {
    const url = window.prompt('Pega la URL del enlace');
    if (!url) return;
    runCommand('createLink', url);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3">
        <ToolbarButton onClick={() => runCommand('bold')} label="Negritas">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('italic')} label="Italica">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('underline')} label="Subrayado">
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('insertUnorderedList')} label="Lista">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('insertOrderedList')} label="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => runCommand('formatBlock', '<p>')} label="Parrafo">
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertLink} label="Enlace">
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange((event.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="rich-editor min-h-56 px-4 py-4 text-sm leading-relaxed text-slate-200 outline-none"
      />
    </div>
  );
}
