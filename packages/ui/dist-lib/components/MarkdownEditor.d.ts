import { default as React } from 'react';
interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}
declare const _default: React.NamedExoticComponent<MarkdownEditorProps>;
export default _default;
