import React from 'react';
import { Video as VideoIcon, Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeWidgetProps {
  data: any;
  codeMode: 'code' | 'preview';
  setCodeMode: (mode: 'code' | 'preview') => void;
  copied: boolean;
  handleCopy: () => void;
}

export function CodeWidget({ data, codeMode, setCodeMode, copied, handleCopy }: CodeWidgetProps) {
  if (!data) return null;

  return (
    <div className="w-full relative group pointer-events-auto flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button 
            onClick={() => setCodeMode('code')}
            className={`px-2 py-1 text-[9px] rounded border transition-colors ${codeMode === 'code' ? 'bg-jarvis-cyan/20 border-jarvis-cyan text-jarvis-cyan' : 'border-jarvis-cyan/20 text-jarvis-cyan/50 hover:text-jarvis-cyan'}`}
          >
            SOURCE_CODE
          </button>
          {(data.language === 'html' || data.code.includes('<html') || data.code.includes('<div')) && (
            <button 
              onClick={() => setCodeMode('preview')}
              className={`px-2 py-1 text-[9px] rounded border transition-colors flex items-center gap-1 ${codeMode === 'preview' ? 'bg-jarvis-orange/20 border-jarvis-orange text-jarvis-orange' : 'border-jarvis-orange/20 text-jarvis-orange/50 hover:text-jarvis-orange'}`}
            >
              <VideoIcon className="w-3 h-3" /> HOLO_DECK
            </button>
          )}
        </div>
        {codeMode === 'code' && (
          <button 
            onClick={handleCopy}
            className="p-1.5 bg-jarvis-bg/80 border border-jarvis-cyan/30 rounded text-jarvis-cyan hover:bg-jarvis-cyan/20 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
      
      {codeMode === 'code' ? (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar rounded border border-jarvis-cyan/20 text-[11px]">
          <SyntaxHighlighter 
            language={data.language || 'javascript'} 
            style={atomDark}
            customStyle={{ margin: 0, padding: '1rem', background: 'rgba(0,0,0,0.5)' }}
            wrapLines={true}
            wrapLongLines={true}
          >
            {data.code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <div className="w-full h-[400px] rounded border border-jarvis-orange/30 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-jarvis-orange/50 animate-pulse" />
          <iframe 
            srcDoc={data.code}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            title="Holo-Deck Preview"
          />
        </div>
      )}
    </div>
  );
}
