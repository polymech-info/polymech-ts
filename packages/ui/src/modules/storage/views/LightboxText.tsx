import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Download, FileCode, FileText, Eye } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-makefile';



import 'prismjs/plugins/toolbar/prism-toolbar';
import 'prismjs/plugins/toolbar/prism-toolbar.css';
import 'prismjs/plugins/show-language/prism-show-language';
import 'prismjs/plugins/autolinker/prism-autolinker';
import 'prismjs/plugins/autolinker/prism-autolinker.css';

import '@/styles/prism-custom-theme.css';

interface LightboxTextProps {
    isOpen: boolean;
    onClose: () => void;
    /** URL to fetch text content from */
    url: string;
    /** File name for display and language detection */
    fileName: string;
    /** If true, render inline without the full-screen modal overlay */
    inline?: boolean;
    onLinkClick?: (href: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// Extension → language label for display
const EXT_LANG: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TypeScript (JSX)', js: 'JavaScript', jsx: 'JavaScript (JSX)',
    py: 'Python', rb: 'Ruby', go: 'Go', rs: 'Rust', java: 'Java',
    c: 'C', cpp: 'C++', h: 'C Header', hpp: 'C++ Header', cs: 'C#',
    swift: 'Swift', kt: 'Kotlin', lua: 'Lua', r: 'R',
    sh: 'Shell', bash: 'Bash', zsh: 'Zsh', ps1: 'PowerShell', bat: 'Batch', cmd: 'Batch',
    sql: 'SQL', html: 'HTML', htm: 'HTML', css: 'CSS',
    scss: 'SCSS', sass: 'Sass', less: 'Less',
    json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', xml: 'XML',
    vue: 'Vue', svelte: 'Svelte',
    md: 'Markdown', txt: 'Text', log: 'Log', csv: 'CSV', tsv: 'TSV',
    tex: 'LaTeX', ini: 'INI', cfg: 'Config', conf: 'Config',
    dockerfile: 'Dockerfile', makefile: 'Makefile',
};

function getLanguage(fileName: string): string {
    const lower = fileName.toLowerCase();
    // Handle extensionless names
    if (lower === 'dockerfile') return 'Dockerfile';
    if (lower === 'makefile') return 'Makefile';
    const dot = lower.lastIndexOf('.');
    if (dot < 0) return 'Text';
    const ext = lower.slice(dot + 1);
    return EXT_LANG[ext] || 'Text';
}

function getPrismLanguage(fileName: string): string {
    const lower = fileName.toLowerCase();

    if (lower === 'dockerfile') return 'docker';
    if (lower === 'makefile') return 'makefile';

    const dot = lower.lastIndexOf('.');
    if (dot < 0) return 'none';
    const ext = lower.slice(dot + 1);

    const mapping: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript',
        js: 'javascript', jsx: 'javascript',
        json: 'json',
        sh: 'bash', bash: 'bash', zsh: 'bash',
        css: 'css', scss: 'scss', sass: 'sass', less: 'less',
        c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', ino: 'c',
        py: 'python',
        rs: 'rust',
        go: 'go',
        rb: 'ruby',
        java: 'java',
        sql: 'sql',
        yaml: 'yaml', yml: 'yaml',
        toml: 'toml',
        swift: 'swift',
        kt: 'kotlin',
        lua: 'lua',
        md: 'markdown', markdown: 'markdown',
        html: 'markup', htm: 'markup', xml: 'markup', svg: 'markup'
    };

    return mapping[ext] || 'none';
}

export default function LightboxText({ isOpen, onClose, url, fileName, inline = false, onLinkClick }: LightboxTextProps) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Derived state
    const language = getLanguage(fileName);
    const prismLanguage = getPrismLanguage(fileName);
    const isMarkdown = language === 'Markdown';
    const isCode = language !== 'Text' && language !== 'Log' && !isMarkdown;

    useEffect(() => {
        if ((!isOpen && !inline) || !url) return;
        setLoading(true);
        setError(null);
        setContent(null);
        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            })
            .then(setContent)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [isOpen, url]);

    useEffect(() => {
        if (content && containerRef.current && !loading && isOpen) {
            containerRef.current.innerHTML = '';

            const pre = document.createElement('pre');
            pre.className = '!bg-transparent !p-0 !m-0';
            pre.style.whiteSpace = 'pre';
            pre.style.tabSize = '4';

            const code = document.createElement('code');
            code.className = `language-${prismLanguage} !bg-transparent !p-0`;
            code.textContent = content; // Safely set text content

            pre.appendChild(code);
            containerRef.current.appendChild(pre);

            try {
                Prism.highlightElement(code);
            } catch (err) {
                console.error("Prism highlighting failed:", err);
            }
        }
    }, [content, loading, isOpen, prismLanguage]);

    useEffect(() => {
        if (!isOpen || inline) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, inline, onClose]);

    const handleCopy = async () => {
        if (!content) return;
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const lineCount = content ? content.split('\n').length : 0;

    if (!isOpen && !inline) return null;

    const innerContent = (
        <div
            className="bg-white dark:bg-slate-800/50 text-foreground"
            onClick={e => e.stopPropagation()}
            style={inline ? {
                display: 'flex', flexDirection: 'column',
                height: '100%', width: '100%',
                overflow: 'hidden',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            } : {
                borderRadius: 10,
                width: '90vw', maxWidth: 900, maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderBottom: '1px solid var(--border)', background: 'var(--muted)',
                flexShrink: 0,
            }}>
                {isCode ? <FileCode size={16} style={{ color: 'var(--primary)' }} /> : <FileText size={16} style={{ color: 'var(--muted-foreground)' }} />}
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}>
                    {language}{lineCount > 0 && !(isMarkdown && showPreview) ? ` · ${lineCount} lines` : ''}
                </span>
                {isMarkdown && (
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        title={showPreview ? "View Source" : "View Preview"}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: showPreview ? 'var(--primary)' : 'var(--muted-foreground)', padding: 4, borderRadius: 4,
                            display: 'flex', alignItems: 'center', marginLeft: 8
                        }}
                    >
                        {showPreview ? <FileCode size={16} /> : <Eye size={16} />}
                    </button>
                )}
                <button
                    onClick={handleCopy}
                    title="Copy to clipboard"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copied ? 'var(--primary)' : 'var(--muted-foreground)', padding: 4, borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                    }}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <a
                    href={url}
                    download={fileName}
                    title="Download"
                    style={{
                        color: 'var(--muted-foreground)', padding: 4, borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                    }}
                >
                    <Download size={16} />
                </a>
                {!inline && (
                    <button
                        onClick={onClose}
                        title="Close (Esc)"
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--muted-foreground)', padding: 4, borderRadius: 4,
                            display: 'flex', alignItems: 'center',
                        }}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                {loading && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
                        Loading…
                    </div>
                )}
                {error && (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--destructive)' }}>
                        Failed to load: {error}
                    </div>
                )}
                {content !== null && (
                    isMarkdown && showPreview ? (
                        <div style={{ padding: '24px 32px' }}>
                            <MarkdownRenderer content={content} baseUrl={url} onLinkClick={onLinkClick} />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace", lineHeight: 1.6 }}>
                            {/* Line numbers */}
                            <div style={{
                                padding: '12px 0', textAlign: 'right', userSelect: 'none',
                                color: 'var(--muted-foreground)', borderRight: '1px solid var(--border)',
                                flexShrink: 0, minWidth: 48, background: 'var(--muted)',
                                position: 'sticky', left: 0,
                            }}>
                                {content.split('\n').map((_, i) => (
                                    <div key={i} style={{ padding: '0 12px' }}>{i + 1}</div>
                                ))}
                            </div>
                            {/* Code Container isolated from React updates */}
                            <div
                                ref={containerRef}
                                style={{
                                    flex: 1, overflow: 'auto', position: 'relative'
                                }}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );

    if (inline) {
        return innerContent;
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999, // Ensure it sits well above standard z-indexes
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
            }}
        >
            {innerContent}
        </div >
    );
}
