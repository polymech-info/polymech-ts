import React from 'react';
import { Columns2, Square, Plus, Link, Unlink } from 'lucide-react';
import { T, translate } from '@/i18n';
import { useFileBrowser, type LayoutMode } from './FileBrowserContext';

const LayoutToolbar: React.FC = () => {
    const { layout, setLayout, linked, setLinked, activeSide, addPanel } = useFileBrowser();

    const btnBase: React.CSSProperties = {
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 4,
        borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--border)',
        background: 'var(--background)', color: 'var(--muted-foreground)',
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
    };
    const btnActive: React.CSSProperties = {
        ...btnBase,
        background: 'var(--accent)', color: 'var(--foreground)',
        borderColor: 'var(--ring)',
    };

    const modes: { key: LayoutMode; label: string; icon: React.ReactNode }[] = [
        { key: 'single', label: translate('Single'), icon: <Square size={14} /> },
        { key: 'dual', label: translate('Dual'), icon: <Columns2 size={14} /> },
    ];

    return (
        <div style={{
            padding: '6px 12px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 600, marginRight: 4 }}>
                <T>Layout</T>
            </span>
            {modes.map(m => (
                <button
                    key={m.key}
                    onClick={() => setLayout(m.key)}
                    style={layout === m.key ? btnActive : btnBase}
                    title={translate(`${m.label} pane`)}
                >
                    {m.icon}
                    <span>{m.label}</span>
                </button>
            ))}

            {/* Link toggle — only in dual mode */}
            {layout === 'dual' && (
                <button
                    onClick={() => setLinked(!linked)}
                    style={linked ? btnActive : btnBase}
                    title={linked ? translate('Unlink panes (left stops mirroring to right)') : translate('Link panes (left folder nav mirrors to right)')}
                >
                    {linked ? <Link size={14} /> : <Unlink size={14} />}
                    <span>{linked ? translate('Linked') : translate('Link')}</span>
                </button>
            )}

            <div style={{ flex: 1 }} />

            {/* Add tab to active side */}
            <button
                onClick={() => addPanel(activeSide)}
                style={btnBase}
                title={translate(`Add tab to ${activeSide} side`)}
            >
                <Plus size={14} />
                <span className="hidden sm:inline"><T>New Tab</T></span>
            </button>
        </div>
    );
};

export default LayoutToolbar;

