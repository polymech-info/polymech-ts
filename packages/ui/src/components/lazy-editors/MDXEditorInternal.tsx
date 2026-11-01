import React, { useEffect } from 'react';
import {
    MDXEditor, headingsPlugin, linkPlugin,
    diffSourcePlugin, toolbarPlugin, imagePlugin,
    quotePlugin, thematicBreakPlugin, tablePlugin,
    UndoRedo, BoldItalicUnderlineToggles,
    DiffSourceToggleWrapper, BlockTypeSelect, InsertThematicBreak,
    InsertTable, ListsToggle, listsPlugin, codeBlockPlugin, codeMirrorPlugin, sandpackPlugin,
    SandpackConfig
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import '@/styles/mdx-editor-theme.css';
import { InsertCustomImage, MicrophoneTranscribe, FullscreenToggle, SaveButton } from '@/components/EditorActions';
import { useTheme } from '@/components/ThemeProvider';
import { useState } from 'react';
import { slashCommandPlugin } from './SlashCommandPlugin';
import { aiGenerationPlugin } from './AIGenerationPlugin';
import { aiImageGenerationPlugin } from './AIImageGenerationPlugin';
import { linkEditorPlugin, InsertLinkToolbarButton } from './LinkPlugin';

export interface MDXEditorWithImagePickerProps {
    value: string;
    onChange: (markdown: string) => void;
    placeholder: string;
    onRequestImage: () => Promise<string>;
    onTextInsert: (text: string) => void;
    onSelectionChange?: (selectedText: string) => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
    onSave?: () => void;
    editorRef: React.MutableRefObject<any>;
}
const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

const simpleSandpackConfig: SandpackConfig = {
    defaultPreset: 'react',
    presets: [
        {
            label: 'React',
            name: 'react',
            meta: 'live react',
            sandpackTemplate: 'react',
            sandpackTheme: 'light',
            snippetFileName: '/App.js',
            snippetLanguage: 'jsx',
            initialSnippetContent: defaultSnippetContent
        }
    ]
}

export default function MDXEditorInternal({
    value,
    onChange,
    placeholder,
    onRequestImage,
    onTextInsert,
    onSelectionChange,
    isFullscreen,
    onToggleFullscreen,
    onSave,
    editorRef
}: MDXEditorWithImagePickerProps) {
    // Handle text selection changes
    useEffect(() => {
        const handleSelectionChange = () => {
            if (onSelectionChange) {
                const selection = window.getSelection();
                if (selection && selection.toString().trim()) {
                    onSelectionChange(selection.toString().trim());
                } else {
                    onSelectionChange('');
                }
            }
        };

        // Add selection change listener
        document.addEventListener('selectionchange', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
        };
    }, [onSelectionChange]);

    const { theme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
        return theme === 'dark';
    });

    useEffect(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);

            // Set initial
            setIsDarkMode(mediaQuery.matches);

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            setIsDarkMode(theme === 'dark');
        }
    }, [theme]);

    const allPlugins = React.useMemo(() => [
        headingsPlugin(),
        linkPlugin(),
        linkEditorPlugin(),
        imagePlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        listsPlugin(),
        tablePlugin(),
        diffSourcePlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
        codeMirrorPlugin({
            codeBlockLanguages: {
                js: 'JavaScript',
                css: 'CSS',
                'json': 'JSON',
                'custom-gallery': 'JSON',
                '': 'Text'
            }
        }),
        sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),
        slashCommandPlugin({ onRequestImage }),
        aiGenerationPlugin(),
        aiImageGenerationPlugin(),
        toolbarPlugin({
            toolbarClassName: 'mdx-toolbar',
            toolbarContents: () => (
                <>
                    <UndoRedo />
                    <ListsToggle />
                    <BoldItalicUnderlineToggles />
                    <InsertLinkToolbarButton />
                    <InsertThematicBreak />
                    <InsertTable />
                    <InsertCustomImage onRequestImage={onRequestImage} />
                    <SaveButton onSave={onSave} />
                    <DiffSourceToggleWrapper>
                        <></>
                    </DiffSourceToggleWrapper>
                </>
            )
        })
    ], [onRequestImage]);

    return (
        <MDXEditor
            className={isDarkMode ? 'dark-theme dark-editor' : ''}
            ref={editorRef}
            markdown={value || ''}
            onChange={onChange}
            plugins={allPlugins}
            placeholder={placeholder}
            contentEditableClassName={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}
        />
    );
}
