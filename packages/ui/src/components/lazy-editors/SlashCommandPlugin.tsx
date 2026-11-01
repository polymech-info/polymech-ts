import React, { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalTypeaheadMenuPlugin, MenuOption, useBasicTypeaheadTriggerMatch } from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode, $createParagraphNode, $getSelection, $isRangeSelection, FORMAT_ELEMENT_COMMAND, $getRoot } from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND } from '@lexical/list';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Table,
    Quote,
    Image,
    Code,
    Sparkles,
    Bot,
    Link,
    FolderOpen
} from 'lucide-react';
import * as ReactDOM from 'react-dom';
import { OPEN_IMAGE_GEN_COMMAND } from './AIImageGenerationPlugin';
import { OPEN_AI_TEXT_GEN_COMMAND } from './AIGenerationPlugin';
import { OPEN_LINK_EDITOR_COMMAND } from './LinkPlugin';

// Import from MDXEditor to hook into its plugin system
import { RealmPlugin, addComposerChild$, $createImageNode } from '@mdxeditor/editor';
import { $insertNodes } from 'lexical';

// Define the option type for the menu
class SlashCommandOption extends MenuOption {
    title: string;
    icon: React.ReactNode;
    keywords: string[];
    onSelect: (editor: any) => void;

    constructor(title: string, icon: React.ReactNode, keywords: string[], onSelect: (editor: any) => void) {
        super(title);
        this.title = title;
        this.icon = icon;
        this.keywords = keywords || [];
        this.onSelect = onSelect;
    }
}

// The Menu Component
function SlashCommandMenu({
    anchorElementRef,
    onRequestImage
}: {
    anchorElementRef: React.MutableRefObject<HTMLElement | null>;
    onRequestImage?: () => Promise<string>;
}) {
    const [editor] = useLexicalComposerContext();
    const [queryString, setQueryString] = useState<string | null>(null);

    const checkForSlashTrigger = useBasicTypeaheadTriggerMatch('/', { minLength: 0 });

    const options = [
        new SlashCommandOption('Heading 1', <Heading1 size={16} />, ['h1', 'heading'], () => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode('h1'));
                }
            });
        }),
        new SlashCommandOption('Heading 2', <Heading2 size={16} />, ['h2', 'heading'], () => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode('h2'));
                }
            });
        }),
        new SlashCommandOption('Heading 3', <Heading3 size={16} />, ['h3', 'heading'], () => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createHeadingNode('h3'));
                }
            });
        }),
        new SlashCommandOption('Bullet List', <List size={16} />, ['ul', 'list', 'bullet'], () => {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }),
        new SlashCommandOption('Numbered List', <ListOrdered size={16} />, ['ol', 'list', 'number'], () => {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }),
        new SlashCommandOption('Check List', <CheckSquare size={16} />, ['todo', 'check', 'task'], () => {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        }),
        new SlashCommandOption('Table', <Table size={16} />, ['table', 'grid'], () => {
            editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: '3', rows: '3', includeHeaders: false });
        }),
        new SlashCommandOption('Quote', <Quote size={16} />, ['quote', 'blockquote'], () => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $setBlocksType(selection, () => $createQuoteNode());
                }
            });
        }),
        new SlashCommandOption('Generate Image', <Sparkles size={16} />, ['ai', 'image', 'generate', 'gen'], () => {
            editor.dispatchCommand(OPEN_IMAGE_GEN_COMMAND, undefined);
        }),
        new SlashCommandOption('AI Assistant', <Bot size={16} />, ['ai', 'text', 'generate', 'ask', 'gpt'], () => {
            editor.dispatchCommand(OPEN_AI_TEXT_GEN_COMMAND, undefined);
        }),
        // Special handling for Image if handler provided
        ...(onRequestImage ? [
            new SlashCommandOption('Image', <Image size={16} />, ['image', 'picture', 'photo'], () => {
                onRequestImage().then(url => {
                    if (url) {
                        editor.update(() => {
                            try {
                                const imageNode = $createImageNode({
                                    src: url,
                                    altText: 'image',
                                    title: 'image'
                                });
                                $insertNodes([imageNode]);
                            } catch (e) {
                                // Selection lost during async dialog — append to end
                                console.warn('[SlashCommand] $insertNodes failed, appending to root:', e);
                                const imageNode = $createImageNode({
                                    src: url,
                                    altText: 'image',
                                    title: 'image'
                                });
                                const paragraph = $createParagraphNode();
                                paragraph.append(imageNode);
                                $getRoot().append(paragraph);
                            }
                        });
                    }
                }).catch((err) => {
                    if (err) console.warn('[SlashCommand] Image request failed:', err);
                });
            })
        ] : []),
        new SlashCommandOption('Link', <Link size={16} />, ['link', 'url', 'href'], () => {
            editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
        }),
        new SlashCommandOption('File Link', <FolderOpen size={16} />, ['file', 'download', 'vfs', 'browse'], () => {
            editor.dispatchCommand(OPEN_LINK_EDITOR_COMMAND, undefined);
        }),
    ];

    // Helper from Lexical to change block type
    const $setBlocksType = (selection: any, createElement: () => any) => {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const nodes = selection.getNodes();
        if (nodes.length === 0 && selection.isCollapsed()) {
            const p = anchor.getNode().getParent();
            if (p) {
                const element = createElement();
                p.replace(element);
                element.select();
            }
        } else {
            // Advanced block logic omitted for simplicity, stick to basic replacement
            // This often requires @lexical/selection imports which might be tricky with transitive deps
            // Let's stick to simplest implementation for H1-H3: replace parent if it's a paragraph
            const anchorNode = anchor.getNode();
            const element = anchorNode.getTopLevelElementOrThrow();
            const newElement = createElement();
            element.replace(newElement);
            newElement.select();
        }
    };

    // We need to fetch the INSERT_IMAGE_COMMAND from somewhere or define it if we want to use it
    // MDXEditor likely exports it or we can import from lexical if it's standard
    // Actually MDXEditor has its own image handling. 
    // Let's simplify and assume the user will define `insertImage` logic 
    // or we need to import `insertImage$` from MDXEditor gurx store.

    // Re-filtering options based on query
    const optionsFilter = useCallback((option: SlashCommandOption, text: string) => {
        if (!text) return true;
        const lowerText = text.toLowerCase();
        return (
            option.title.toLowerCase().includes(lowerText) ||
            option.keywords.some(k => k.includes(lowerText))
        );
    }, []);

    const onSelectOption = useCallback(
        (
            selectedOption: SlashCommandOption,
            nodeToRemove: TextNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                if (nodeToRemove) {
                    nodeToRemove.remove();
                }
                selectedOption.onSelect(editor);
                closeMenu();
            });
        },
        [editor],
    );

    return (
        <LexicalTypeaheadMenuPlugin
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForSlashTrigger}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
            ) => {
                if (anchorElementRef.current == null || options.length === 0) {
                    return null;
                }

                // Compute position from the anchor element's bounding rect
                const rect = anchorElementRef.current.getBoundingClientRect();

                return ReactDOM.createPortal(
                    <div
                        className="z-[9999] min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                        style={{
                            position: 'fixed',
                            top: rect.bottom,
                            left: rect.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col gap-0.5">
                            {options.map((option, i) => {
                                if (queryString && !optionsFilter(option, queryString)) return null;

                                return (
                                    <button
                                        key={option.title}
                                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedIndex === i ? 'bg-accent text-accent-foreground' : ''
                                            }`}
                                        onClick={() => {
                                            setHighlightedIndex(i);
                                            selectOptionAndCleanUp(option);
                                        }}
                                        onMouseEnter={() => {
                                            setHighlightedIndex(i);
                                        }}
                                        type="button"
                                    >
                                        {option.icon}
                                        <span>{option.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>,
                    document.body
                );
            }}
        />
    );
}

// Ensure the command is imported if we use it, otherwise define rudimentary one or omit image for now to avoid breaking
// actually import { imagePlugin } from '@mdxeditor/editor' handles images, 
// usually it listens to standard markdown image syntax or specific commands.

// The Plugin Definition
export const slashCommandPlugin = (params?: { onRequestImage?: () => Promise<string> }): RealmPlugin => {
    return {
        init: (realm) => {
            realm.pubIn({
                [addComposerChild$]: () => (
                    <SlashCommandMenu
                        anchorElementRef={{ current: document.body }} // Placeholder, TypeaheadPlugin uses its own anchoring logic usually or expects a ref
                        onRequestImage={params?.onRequestImage}
                    />
                )
            })
        }
    }
}
