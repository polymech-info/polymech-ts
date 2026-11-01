import { lazy } from 'react';
import { widgetRegistry } from './widgetRegistry';
import { translate } from '@/i18n';
import {
  Monitor,
  Layout,
  FileText,
  Code,
  Video,
  MessageSquare,
  Map as MapIcon,
} from 'lucide-react';

import type {
  HtmlWidgetProps,
  PhotoGridProps,
  PhotoCardWidgetProps,
  PhotoGridWidgetProps,
  TabsWidgetProps,
  GalleryWidgetProps,
  PageCardWidgetProps,
  MarkdownTextWidgetProps,
  LayoutContainerWidgetProps,
  FileBrowserWidgetProps,
} from '@polymech/shared';

import PageCardWidget from '@/modules/pages/PageCardWidget';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoGridWidget from '@/components/widgets/PhotoGridWidget';
import PhotoCardWidget from '@/components/widgets/PhotoCardWidget';
import LayoutContainerWidget from '@/components/widgets/LayoutContainerWidget';
import MarkdownTextWidget from '@/components/widgets/MarkdownTextWidget';
import GalleryWidget from '@/components/widgets/GalleryWidget';
import TabsWidget from '@/components/widgets/TabsWidget';
import { HtmlWidget } from '@/components/widgets/HtmlWidget';
import HomeWidget from '@/components/widgets/HomeWidget';
import VideoBannerWidget from '@/components/widgets/VideoBannerWidget';
import CategoryFeedWidget from '@/components/widgets/CategoryFeedWidget';
import MenuWidget from '@/components/widgets/MenuWidget';

const SupportChatWidget = lazy(() => import('@/components/widgets/SupportChatWidget'));
const CompetitorsMapWidget = lazy(() => import('@/components/widgets/CompetitorsMapWidget'));
const FileBrowserWidget = lazy(() => import('@/modules/storage/FileBrowserWidget').then(m => ({ default: m.FileBrowserWidget })));

export function registerAllWidgets() {
  // Clear existing registrations (useful for HMR)
  widgetRegistry.clear();

  // HTML Widget
  widgetRegistry.register<HtmlWidgetProps>({
    component: HtmlWidget,
    metadata: {
      id: 'html-widget',
      name: translate('HTML Content'),
      category: 'display',
      description: translate('Render HTML content with variable substitution'),
      icon: Code,
      defaultProps: {
        content: '<div>\n  <h3 class="text-xl font-bold">Hello ${name}</h3>\n  <p>Welcome to our custom widget!</p>\n</div>',
        variables: '{\n  "name": "World"\n}',
        className: ''
      },
      configSchema: {
        content: {
          type: 'markdown', // Using markdown editor for larger text area
          label: 'HTML Content',
          description: 'Enter your HTML code here. Use ${varName} for substitutions.',
          default: '<div>Hello World</div>'
        },
        variables: {
          type: 'markdown', // Using markdown/textarea for JSON input for now
          label: 'Variables (JSON)',
          description: 'JSON object defining variables for substitution.',
          default: '{}'
        },
        className: {
          type: 'classname',
          label: 'CSS Class',
          description: 'Tailwind classes for the container',
          default: ''
        }
      },
      minSize: { width: 300, height: 100 },
      resizable: true,
      tags: ['html', 'code', 'custom', 'embed']
    }
  });

  // Photo widgets
  widgetRegistry.register<PhotoGridProps>({
    component: PhotoGrid,
    metadata: {
      id: 'photo-grid',
      name: translate('Photo Grid'),
      category: 'custom',
      description: translate('Display photos in a responsive grid layout'),
      icon: Monitor,
      defaultProps: {
        variables: {}
      },
      // Note: PhotoGrid fetches data internally based on navigation context
      // For configurable picture selection, use 'photo-grid-widget' instead
      minSize: { width: 300, height: 200 },
      resizable: true,
      tags: ['photo', 'grid', 'gallery']
    }
  });

  widgetRegistry.register<PhotoCardWidgetProps>({
    component: PhotoCardWidget,
    metadata: {
      id: 'photo-card',
      name: translate('Photo Card'),
      category: 'custom',
      description: translate('Display a single photo card with details'),
      icon: Monitor,
      defaultProps: {
        pictureId: null,
        postId: null,
        showHeader: true,
        showFooter: true,
        showAuthor: true,
        showActions: true,
        showTitle: true,
        showDescription: true,
        contentDisplay: 'below',
        imageFit: 'contain',
        variables: {}
      },
      configSchema: {
        pictureId: {
          type: 'imagePicker',
          label: 'Select Picture',
          description: 'Choose a picture from your published images',
          default: null
        },
        showHeader: {
          type: 'boolean',
          label: 'Show Header',
          description: 'Show header with author information',
          default: true
        },
        showFooter: {
          type: 'boolean',
          label: 'Show Footer',
          description: 'Show footer with likes, comments, and actions',
          default: true
        },
        showAuthor: {
          type: 'boolean',
          label: 'Include Author',
          description: 'Show author avatar and name',
          default: true
        },
        showActions: {
          type: 'boolean',
          label: 'Include Actions',
          description: 'Show like, comment, download buttons',
          default: true
        },
        showTitle: {
          type: 'boolean',
          label: 'Show Title',
          description: 'Display the picture title',
          default: true
        },
        showDescription: {
          type: 'boolean',
          label: 'Show Description',
          description: 'Display the picture description',
          default: true
        },
        contentDisplay: {
          type: 'select',
          label: 'Content Display',
          description: 'How to display title and description',
          options: [
            { value: 'below', label: 'Below Image' },
            { value: 'overlay', label: 'Overlay on Hover' },
            { value: 'overlay-always', label: 'Overlay (Always)' }
          ],
          default: 'below'
        },
        imageFit: {
          type: 'select',
          label: 'Image Fit',
          description: 'How the image should fit within the card',
          options: [
            { value: 'contain', label: 'Contain' },
            { value: 'cover', label: 'Cover' }
          ],
          default: 'contain'
        }
      },
      minSize: { width: 300, height: 400 },
      resizable: true,
      tags: ['photo', 'card', 'display']
    }
  });

  widgetRegistry.register<PhotoGridWidgetProps>({
    component: PhotoGridWidget,
    metadata: {
      id: 'photo-grid-widget',
      name: translate('Photo Grid Widget'),
      category: 'custom',
      description: translate('Display a customizable grid of selected photos'),
      icon: Monitor,
      defaultProps: {
        pictureIds: [],
        columns: 'auto',
        variables: {}
      },
      configSchema: {
        pictureIds: {
          type: 'imagePicker', // We'll need to upgrade the config renderer to handle array/multi-select if not already supported, or rely on internal EditMode
          label: 'Select Pictures',
          description: 'Choose pictures to display in the grid',
          default: []
        },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          description: 'Number of columns to display in grid view',
          options: [
            { value: 'auto', label: 'Auto (Responsive)' },
            { value: '1', label: '1 Column' },
            { value: '2', label: '2 Columns' },
            { value: '3', label: '3 Columns' },
            { value: '4', label: '4 Columns' },
            { value: '5', label: '5 Columns' },
            { value: '6', label: '6 Columns' }
          ],
          default: 'auto'
        }
      },
      minSize: { width: 300, height: 300 },
      resizable: true,
      tags: ['photo', 'grid', 'gallery', 'custom']
    }
  });

  widgetRegistry.register<TabsWidgetProps>({
    component: TabsWidget,
    metadata: {
      id: 'tabs-widget',
      name: translate('Tabs Widget'),
      category: 'layout',
      description: translate('Organize content into switchable tabs'),
      icon: Layout,
      defaultProps: {
        tabs: [
          {
            id: 'tab-1',
            label: 'Tab 1',
            layoutId: 'tab-layout-1',
            layoutData: {
              id: 'tab-layout-1',
              name: 'Tab 1',
              containers: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: '1.0.0'
            }
          },
          {
            id: 'tab-2',
            label: 'Tab 2',
            layoutId: 'tab-layout-2',
            layoutData: {
              id: 'tab-layout-2',
              name: 'Tab 2',
              containers: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              version: '1.0.0'
            }
          }
        ],
        orientation: 'horizontal',
        tabBarPosition: 'top',
        tabBarClassName: '',
        contentClassName: '',
        variables: {}
      } as unknown as TabsWidgetProps,

      configSchema: {
        tabs: {
          type: 'tabs-editor',
          label: 'Tabs',
          description: 'Manage tabs and their order',
          default: []
        },
        tabBarPosition: {
          type: 'select',
          label: 'Tab Bar Position',
          description: 'Position of the tab bar',
          options: [
            { value: 'top', label: 'Top' },
            { value: 'bottom', label: 'Bottom' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
          ],
          default: 'top'
        },
        tabBarClassName: {
          type: 'classname',
          label: 'Tab Bar Style',
          description: 'Tailwind classes for the tab bar',
          default: ''
        },
        contentClassName: {
          type: 'classname',
          label: 'Content Area Style',
          description: 'Tailwind classes for the content area',
          default: ''
        }
      },
      minSize: { width: 400, height: 300 },
      resizable: true,
      tags: ['layout', 'tabs', 'container']
    },
    getNestedLayouts: (props: TabsWidgetProps) => {
      if (!props.tabs || !Array.isArray(props.tabs)) return [];
      return props.tabs.map((tab: unknown) => ({
        id: (tab as any).id,
        label: (tab as any).label,
        layoutId: (tab as any).layoutId
      }));
    }
  });

  widgetRegistry.register<GalleryWidgetProps>({
    component: GalleryWidget,
    metadata: {
      id: 'gallery-widget',
      name: translate('Gallery'),
      category: 'custom',
      description: translate('Interactive gallery with main viewer and filmstrip navigation'),
      icon: Monitor,
      defaultProps: {
        pictureIds: [],
        thumbnailLayout: 'strip',
        imageFit: 'contain',
        thumbnailsPosition: 'bottom',
        thumbnailsOrientation: 'horizontal',
        zoomEnabled: false,
        showVersions: false,
        showTitle: false,
        showDescription: false,
        autoPlayVideos: false,
        thumbnailsClassName: '',
        variables: {}
      },
      configSchema: {
        pictureIds: {
          type: 'imagePicker',
          label: 'Select Pictures',
          description: 'Choose pictures to display in the gallery',
          default: [],
          multiSelect: true
        },
        showTitle: {
          type: 'boolean',
          label: 'Show Title',
          description: 'Display the title of each picture below the main image',
          default: false
        },
        showDescription: {
          type: 'boolean',
          label: 'Show Description',
          description: 'Display the description of each picture below the main image',
          default: false
        },
        thumbnailLayout: {
          type: 'select',
          label: 'Thumbnail Layout',
          description: 'How to display thumbnails below the main image',
          options: [
            { value: 'strip', label: 'Horizontal Strip (scrollable)' },
            { value: 'grid', label: 'Grid (multiple rows, fit width)' }
          ],
          default: 'strip'
        },
        imageFit: {
          type: 'select',
          label: 'Main Image Fit',
          description: 'How the main image should fit within its container',
          options: [
            { value: 'contain', label: 'Contain (fit within bounds, show full image)' },
            { value: 'cover', label: 'Cover (fill container, may crop image)' }
          ],
          default: 'cover'
        },
        thumbnailsPosition: {
          type: 'select',
          label: 'Thumbnails Position',
          description: 'Where to place the thumbnails relative to the main image',
          options: [
            { value: 'bottom', label: 'Bottom' },
            { value: 'top', label: 'Top' },
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
          ],
          default: 'bottom'
        },
        thumbnailsOrientation: {
          type: 'select',
          label: 'Thumbnails Orientation',
          description: 'Direction of the thumbnail strip',
          options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' }
          ],
          default: 'horizontal'
        },
        zoomEnabled: {
          type: 'boolean',
          label: 'Enable Pan Zoom',
          description: 'Enlarge image and pan on hover',
          default: false
        },
        showVersions: {
          type: 'boolean',
          label: 'Show Versions',
          description: 'Show version navigation in the filmstrip for pictures with versions',
          default: false
        },
        autoPlayVideos: {
          type: 'boolean',
          label: 'Auto Play Videos',
          description: 'Automatically play video items when selected (muted)',
          default: false
        },
        thumbnailsClassName: {
          type: 'classname',
          label: 'Thumbnails CSS Class',
          description: 'Additional CSS classes for the thumbnail strip container',
          default: ''
        }
      },
      minSize: { width: 600, height: 500 },
      resizable: true,
      tags: ['photo', 'gallery', 'viewer', 'slideshow']
    }
  });

  widgetRegistry.register<PageCardWidgetProps>({
    component: PageCardWidget,
    metadata: {
      id: 'page-card',
      name: translate('Page Card'),
      category: 'custom',
      description: translate('Display a single page card with details'),
      icon: FileText,
      defaultProps: {
        pageId: null,
        showHeader: true,
        showFooter: true,
        showAuthor: true,
        showActions: true,
        showTitle: true,
        showDescription: false,
        contentDisplay: 'below',
        variables: {}
      },
      configSchema: {
        pageId: {
          type: 'pagePicker',
          label: 'Select Page',
          description: 'Choose a page to display',
          default: null
        },
        showHeader: {
          type: 'boolean',
          label: 'Show Header',
          description: 'Show header with author information',
          default: true
        },
        showFooter: {
          type: 'boolean',
          label: 'Show Footer',
          description: 'Show footer with likes, comments, and actions',
          default: true
        },
        showAuthor: {
          type: 'boolean',
          label: 'Show Author',
          description: 'Show author avatar and name',
          default: true
        },
        showActions: {
          type: 'boolean',
          label: 'Show Actions',
          description: 'Show like and comment buttons',
          default: true
        },
        showTitle: {
          type: 'boolean',
          label: 'Show Title',
          description: 'Display the page title on the card',
          default: true
        },
        showDescription: {
          type: 'boolean',
          label: 'Show Description',
          description: 'Display the page description on the card',
          default: false
        },
        contentDisplay: {
          type: 'select',
          label: 'Content Display',
          description: 'How to display title and description',
          options: [
            { value: 'below', label: 'Below Image' },
            { value: 'overlay', label: 'Overlay on Hover' },
            { value: 'overlay-always', label: 'Overlay (Always)' }
          ],
          default: 'below'
        }
      },
      minSize: { width: 300, height: 400 },
      resizable: true,
      tags: ['page', 'card', 'display']
    }
  });

  // Content widgets
  widgetRegistry.register<MarkdownTextWidgetProps>({
    component: MarkdownTextWidget,
    metadata: {
      id: 'markdown-text',
      name: translate('Text Block'),
      category: 'display',
      description: translate('Add rich text content with Markdown support'),
      icon: FileText,
      defaultProps: {
        content: '',
        placeholder: 'Enter your text here...',
        variables: {}
      },
      configSchema: {
        placeholder: {
          type: 'text',
          label: 'Placeholder Text',
          description: 'Text shown when content is empty',
          default: 'Enter your text here...'
        }
      },
      minSize: { width: 300, height: 150 },
      resizable: true,
      tags: ['text', 'markdown', 'content', 'editor']
    }
  });

  widgetRegistry.register<LayoutContainerWidgetProps>({
    component: LayoutContainerWidget,
    metadata: {
      id: 'layout-container-widget',
      name: translate('Nested Layout Container'),
      category: 'custom',
      description: translate('A widget that contains its own independent layout canvas.'),
      icon: Layout,
      defaultProps: {
        nestedPageName: 'Nested Container',
        showControls: true,
        variables: {}
      },
      configSchema: {
        nestedPageName: {
          type: 'text',
          label: 'Canvas Name',
          description: 'The display name for the nested layout canvas.',
          default: 'Nested Container'
        },
        showControls: {
          type: 'boolean',
          label: 'Show Canvas Controls',
          description: 'Show the main controls (Add Container, Save, etc.) inside this nested canvas.',
          default: true
        }
      },
      minSize: { width: 300, height: 200 },
      resizable: true,
      tags: ['layout', 'container', 'nested', 'canvas']
    },
    getNestedLayouts: (props: LayoutContainerWidgetProps) => {
      if (props.nestedPageId) {
        return [{
          id: 'nested-container',
          label: props.nestedPageName || 'Nested Container',
          layoutId: props.nestedPageId
        }];
      }
      return [];
    }
  });

  widgetRegistry.register({
    component: SupportChatWidget,
    metadata: {
      id: 'support-chat-widget',
      name: translate('Support Chat Widget'),
      category: 'custom',
      description: translate('Floating support chat button that expands into a full chat panel.'),
      icon: MessageSquare,
      defaultProps: {
        buttons: [{ id: 'default', label: 'Ask Questions', contextPrompt: '' }],
        position: 'bottom-right',
        mode: 'floating',
        autoOpen: false,
        variables: {}
      },
      configSchema: {
        position: {
          type: 'select',
          label: 'Button Position (Floating)',
          description: 'Screen corner position (Only applies if Mode is Floating).',
          options: [
            { value: 'bottom-right', label: 'Bottom Right' },
            { value: 'bottom-left', label: 'Bottom Left' }
          ],
          default: 'bottom-right'
        },
        mode: {
          type: 'select',
          label: 'Display Mode',
          description: 'Whether the chat button floats over the page or renders inline within the layout.',
          options: [
            { value: 'floating', label: 'Floating (Corner)' },
            { value: 'inline', label: 'Inline (In Layout)' }
          ],
          default: 'floating'
        },
        autoOpen: {
          type: 'boolean',
          label: 'Auto Open',
          description: 'Open automatically when the page loads.',
          default: false
        }
      },
      minSize: { width: 100, height: 100 },
      resizable: false,
      tags: ['chat', 'support', 'ai', 'floating', 'button']
    }
  });

  // File Browser Widget
  widgetRegistry.register<FileBrowserWidgetProps>({
    component: FileBrowserWidget,
    metadata: {
      id: 'file-browser',
      name: translate('File Browser'),
      category: 'custom',
      description: translate('Browse files and directories on VFS mounts'),
      icon: Monitor,
      defaultProps: {
        mount: 'root',
        path: '/',
        glob: '*.*',
        mode: 'simple',
        viewMode: 'list',
        sortBy: 'name',
        showToolbar: true,
        canChangeMount: true,
        allowFileViewer: true,
        allowLightbox: true,
        allowDownload: true,
        allowPreview: false,
        initialFile: '',
        jail: false,
        minHeight: '600px',
        showStatusBar: true,
        searchQuery: '',
        variables: {}
      },
      configSchema: {
        mountAndPath: {
          type: 'vfsPicker',
          label: 'Mount & Initial Path',
          description: 'Browse to select the mount and starting directory',
          mountKey: 'mount',
          pathKey: 'path',
          defaultMount: 'home',
        },
        searchQuery: {
          type: 'text',
          label: 'Initial Search Query',
          description: 'If set, the file browser will start in search mode matching this query',
          default: ''
        },
        initialFile: {
          type: 'text',
          label: 'Initial File',
          description: 'If set, automatically selects and opens this file on load (needs filename + extension)',
          default: ''
        },
        glob: {
          type: 'selectWithText',
          label: 'File Filter',
          description: 'Filter which files are shown',
          options: [
            { value: '*.*', label: 'All Files' },
            { value: '*.{jpg,jpeg,png,gif,webp,svg,bmp,avif,mp4,webm,mov,avi,mkv}', label: 'Media (Images & Video)' },
            { value: '*.{jpg,jpeg,png,gif,webp,svg,bmp,avif}', label: 'Images Only' },
            { value: '*.{mp4,webm,mov,avi,mkv,flv}', label: 'Videos Only' },
          ],
          default: '*.*'
        },
        mode: {
          type: 'select',
          label: 'Mode',
          description: 'Simple = browse only. Advanced = file detail panel.',
          options: [
            { value: 'simple', label: 'Simple' },
            { value: 'advanced', label: 'Advanced' }
          ],
          default: 'simple'
        },
        viewMode: {
          type: 'select',
          label: 'View Mode',
          description: 'List, thumbnail grid or tree view',
          options: [
            { value: 'list', label: 'List' },
            { value: 'thumbs', label: 'Thumbnails' },
            { value: 'tree', label: 'Tree' }
          ],
          default: 'list'
        },
        sortBy: {
          type: 'select',
          label: 'Sort By',
          description: 'Default sort order',
          options: [
            { value: 'name', label: 'Name' },
            { value: 'ext', label: 'Extension' },
            { value: 'date', label: 'Date' },
            { value: 'type', label: 'Type' }
          ],
          default: 'name'
        },
        showToolbar: {
          type: 'boolean',
          label: 'Show Toolbar',
          description: 'Show navigation toolbar with breadcrumbs, sort, and view toggle',
          default: true
        },
        canChangeMount: {
          type: 'boolean',
          label: 'Allow Mount Switching',
          description: 'Let users switch between VFS mounts',
          default: true
        },
        allowLightbox: {
          type: 'boolean',
          label: 'Allow Image/Video Lightbox',
          description: 'Open images and videos in a fullscreen lightbox',
          default: true
        },
        allowFileViewer: {
          type: 'boolean',
          label: 'Allow Text File Viewer',
          description: 'Open text/code files in the built-in viewer',
          default: true
        },
        allowDownload: {
          type: 'boolean',
          label: 'Allow Download',
          description: 'Show download button for files',
          default: true
        },
        allowPreview: {
          type: 'boolean',
          label: 'Allow Document & 3D Preview',
          description: 'Open document and 3D files in a modal preview',
          default: true
        },
        jail: {
          type: 'boolean',
          label: 'Jail Mode',
          description: 'Prevent navigating above the configured mount and path',
          default: false
        },
        minHeight: {
          type: 'selectWithText',
          label: 'Min Height',
          description: 'Minimum height of the widget (e.g. 600px, 70vh, 50%)',
          options: [
            { value: '400px', label: '400px' },
            { value: '500px', label: '500px' },
            { value: '600px', label: '600px' },
            { value: '800px', label: '800px' },
            { value: '50vh', label: '50vh' },
            { value: '70vh', label: '70vh' },
          ],
          default: '600px'
        },
        showStatusBar: {
          type: 'boolean',
          label: 'Show Status Bar',
          description: 'Show item count and path info at the bottom',
          default: true
        }
      },
      minSize: { width: 300, height: 300 },
      resizable: true,
      tags: ['file', 'browser', 'vfs', 'storage', 'explorer']
    }
  });

  // Home Widget
  widgetRegistry.register({
    component: HomeWidget,
    metadata: {
      id: 'home',
      name: translate('Home Feed'),
      category: 'display',
      description: translate('Display the main home feed with photos, categories, and sorting'),
      icon: Monitor,
      defaultProps: {
        sortBy: 'latest',
        viewMode: 'grid',
        showCategories: false,
        categorySlugs: '',
        categoryId: '',
        userId: '',
        showSortBar: true,
        showLayoutToggles: true,
        showFooter: true,
        showTitle: true,
        showDescription: false,
        showAuthor: true,
        showSocial: true,
        center: false,
        columns: 'auto',
        heading: '',
        headingLevel: 'h2',
        searchQuery: '',
        initialContentType: '',
        fillHeight: false,
        variables: {}
      },
      configSchema: {
        heading: {
          type: 'text',
          label: 'Heading',
          description: 'Section heading displayed above the feed',
          default: ''
        },
        headingLevel: {
          type: 'select',
          label: 'Heading Level',
          description: 'HTML heading level',
          options: [
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
            { value: 'h4', label: 'H4' }
          ],
          default: 'h2'
        },
        sortBy: {
          type: 'select',
          label: 'Sort By',
          description: 'Default sort order for the feed',
          options: [
            { value: 'latest', label: 'Latest' },
            { value: 'top', label: 'Top' }
          ],
          default: 'latest'
        },
        viewMode: {
          type: 'select',
          label: 'View Mode',
          description: 'Default display mode for the feed',
          options: [
            { value: 'grid', label: 'Grid' },
            { value: 'large', label: 'Large Gallery' },
            { value: 'list', label: 'List' }
          ],
          default: 'grid'
        },
        initialContentType: {
          type: 'select',
          label: 'Content Type',
          description: 'Filter by content type',
          options: [
            { value: 'all', label: 'All Content' },
            { value: 'posts', label: 'Posts' },
            { value: 'pages', label: 'Pages' },
            { value: 'pictures', label: 'Pictures' },
            { value: 'files', label: 'Files' },
            { value: 'places', label: 'Places' }
          ],
          default: 'all'
        },
        categoryId: {
          type: 'categoryPicker',
          label: 'Category',
          description: 'Select a category to filter the feed',
          default: ''
        },
        showCategories: {
          type: 'boolean',
          label: 'Show Categories Sidebar',
          description: 'Show the category tree sidebar on desktop',
          default: false
        },
        categorySlugs: {
          type: 'text',
          label: 'Category Slugs',
          description: 'Comma-separated category slugs to filter by (leave empty for all)',
          default: ''
        },
        userId: {
          type: 'userPicker',
          label: 'User Filter',
          description: 'Filter feed to show only content from a specific user',
          default: ''
        },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          description: 'Number of columns to display in grid view',
          options: [
            { value: 'auto', label: 'Auto (Responsive)' },
            { value: '1', label: '1 Column' },
            { value: '2', label: '2 Columns' },
            { value: '3', label: '3 Columns' },
            { value: '4', label: '4 Columns' },
            { value: '5', label: '5 Columns' },
            { value: '6', label: '6 Columns' }
          ],
          default: 'auto'
        },
        showSortBar: {
          type: 'boolean',
          label: 'Show Sort Bar',
          description: 'Show the sort and category toggle bar',
          default: true
        },
        showLayoutToggles: {
          type: 'boolean',
          label: 'Show Layout Toggles',
          description: 'Show grid/large/list view toggle buttons',
          default: true
        },
        showFooter: {
          type: 'boolean',
          label: 'Show Footer',
          description: 'Show the site footer below the feed',
          default: true
        },
        showTitle: {
          type: 'boolean',
          label: 'Show Title',
          description: 'Display the picture/post title on feed cards',
          default: true
        },
        showDescription: {
          type: 'boolean',
          label: 'Show Description',
          description: 'Display the picture/post description on feed cards',
          default: false
        },
        showAuthor: {
          type: 'boolean',
          label: 'Show Author',
          description: 'Show author avatar and name on feed cards',
          default: true
        },
        showSocial: {
          type: 'boolean',
          label: 'Show Social',
          description: 'Show likes and comments on feed cards',
          default: true
        },
        center: {
          type: 'boolean',
          label: 'Center Content',
          description: 'Center the widget content with a maximum width container',
          default: false
        },
        fillHeight: {
          type: 'boolean',
          label: 'Fill Height',
          description: 'Fill the parent container height (use when embedding in a fixed-height layout)',
          default: false
        },
        searchQuery: {
          type: 'text',
          label: 'Initial Search Query',
          description: 'Load feed matching this search query',
          default: ''
        }
      },
      minSize: { width: 400, height: 400 },
      resizable: true,
      tags: ['home', 'feed', 'gallery', 'photos', 'categories']
    }
  });

  // Video Banner Widget
  widgetRegistry.register({
    component: VideoBannerWidget,
    metadata: {
      id: 'video-banner',
      name: translate('Hero'),
      category: 'display',
      description: translate('Full-width hero banner with background video, text overlay, and call-to-action buttons'),
      icon: Video,
      defaultProps: {
        videoId: null,
        posterImageId: null,
        backgroundImageId: null,
        heading: '',
        description: '',
        minHeight: 500,
        overlayOpacity: 'medium',
        objectFit: 'cover',
        buttons: [],
        variables: {}
      },
      configSchema: {
        videoId: {
          type: 'imagePicker',
          label: 'Background Video',
          description: 'Select a video-intern picture to use as background',
          default: null
        },
        backgroundImageId: {
          type: 'imagePicker',
          label: 'Background Image',
          description: 'Static image to use as background (when no video is set)',
          default: null
        },
        posterImageId: {
          type: 'imagePicker',
          label: 'Poster Image',
          description: 'Fallback image shown while video loads',
          default: null
        },
        objectFit: {
          type: 'select',
          label: 'Image Fit',
          description: 'How the background image fills the banner',
          options: [
            { value: 'cover', label: 'Cover (fill, may crop)' },
            { value: 'contain', label: 'Contain (fit, may letterbox)' }
          ],
          default: 'cover'
        },
        heading: {
          type: 'text',
          label: 'Heading',
          description: 'Main banner heading text',
          default: ''
        },
        description: {
          type: 'text',
          label: 'Description',
          description: 'Banner description text',
          default: ''
        },
        minHeight: {
          type: 'number',
          label: 'Minimum Height (px)',
          description: 'Minimum height of the banner in pixels',
          default: 500
        },
        overlayOpacity: {
          type: 'select',
          label: 'Overlay Darkness',
          description: 'How dark the text background pane is',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'medium', label: 'Medium' },
            { value: 'dark', label: 'Dark' }
          ],
          default: 'medium'
        },
        buttons: {
          type: 'buttons-editor',
          label: 'CTA Buttons',
          description: 'Call-to-action buttons with page links',
          default: []
        }
      },
      minSize: { width: 400, height: 300 },
      resizable: true,
      tags: ['video', 'banner', 'hero', 'landing']
    }
  });

  // Category Feed Widget
  widgetRegistry.register({
    component: CategoryFeedWidget,
    metadata: {
      id: 'category-feed',
      name: translate('Category Feed'),
      category: 'display',
      description: translate('Display a filtered feed for a specific category with heading and content type filter'),
      icon: Monitor,
      defaultProps: {
        categoryId: '',
        heading: '',
        headingLevel: 'h2',
        filterType: undefined,
        showCategoryName: false,
        sortBy: 'latest',
        viewMode: 'grid',
        showCategories: false,
        userId: '',
        showSortBar: true,
        showLayoutToggles: true,
        showFooter: false,
        showTitle: true,
        showDescription: false,
        showAuthor: true,
        showSocial: true,
        center: false,
        columns: 'auto',
        variables: {}
      },
      configSchema: {
        categoryId: {
          type: 'categoryPicker',
          label: 'Category',
          description: 'Select a category to filter the feed',
          default: ''
        },
        heading: {
          type: 'text',
          label: 'Heading',
          description: 'Section heading displayed above the feed (overrides category name)',
          default: ''
        },
        showCategoryName: {
          type: 'boolean',
          label: 'Show Category Name',
          description: 'Display the selected category name as heading (when no custom heading is set)',
          default: false
        },
        headingLevel: {
          type: 'select',
          label: 'Heading Level',
          description: 'HTML heading level',
          options: [
            { value: 'h1', label: 'H1' },
            { value: 'h2', label: 'H2' },
            { value: 'h3', label: 'H3' },
            { value: 'h4', label: 'H4' }
          ],
          default: 'h2'
        },
        filterType: {
          type: 'select',
          label: 'Content Type',
          description: 'Filter to show only a specific content type',
          options: [
            { value: 'all', label: 'All' },
            { value: 'posts', label: 'Posts' },
            { value: 'pages', label: 'Pages' },
            { value: 'pictures', label: 'Pictures' }
          ],
          default: 'all'
        },
        sortBy: {
          type: 'select',
          label: 'Sort By',
          description: 'Default sort order for the feed',
          options: [
            { value: 'latest', label: 'Latest' },
            { value: 'top', label: 'Top' }
          ],
          default: 'latest'
        },
        viewMode: {
          type: 'select',
          label: 'View Mode',
          description: 'Default display mode for the feed',
          options: [
            { value: 'grid', label: 'Grid' },
            { value: 'large', label: 'Large Gallery' },
            { value: 'list', label: 'List' }
          ],
          default: 'grid'
        },
        showCategories: {
          type: 'boolean',
          label: 'Show Categories Sidebar',
          description: 'Show the category tree sidebar on desktop',
          default: false
        },
        userId: {
          type: 'userPicker',
          label: 'User Filter',
          description: 'Filter feed to show only content from a specific user',
          default: ''
        },
        showSortBar: {
          type: 'boolean',
          label: 'Show Sort Bar',
          description: 'Show the sort and category toggle bar',
          default: true
        },
        showLayoutToggles: {
          type: 'boolean',
          label: 'Show Layout Toggles',
          description: 'Show grid/large/list view toggle buttons',
          default: true
        },
        showFooter: {
          type: 'boolean',
          label: 'Show Footer',
          description: 'Show the site footer below the feed',
          default: false
        },
        showTitle: {
          type: 'boolean',
          label: 'Show Title',
          description: 'Display the picture/post title',
          default: true
        },
        showDescription: {
          type: 'boolean',
          label: 'Show Description',
          description: 'Display the picture/post description beneath the title',
          default: false
        },
        showAuthor: {
          type: 'boolean',
          label: 'Show Author',
          description: 'Show author avatar and name on feed cards',
          default: true
        },
        showSocial: {
          type: 'boolean',
          label: 'Show Social',
          description: 'Show likes and comments on feed cards',
          default: true
        },
        center: {
          type: 'boolean',
          label: 'Center Content',
          description: 'Center the widget content with a maximum width container',
          default: false
        },
        columns: {
          type: 'select',
          label: 'Grid Columns',
          description: 'Number of columns to display in grid view',
          options: [
            { value: 'auto', label: 'Auto (Responsive)' },
            { value: '1', label: '1 Column' },
            { value: '2', label: '2 Columns' },
            { value: '3', label: '3 Columns' },
            { value: '4', label: '4 Columns' },
            { value: '5', label: '5 Columns' },
            { value: '6', label: '6 Columns' }
          ],
          default: 'auto'
        }
      },
      minSize: { width: 400, height: 400 },
      resizable: true,
      tags: ['category', 'feed', 'home', 'filter', 'section']
    }
  });

  // Menu Widget
  widgetRegistry.register({
    component: MenuWidget,
    metadata: {
      id: 'menu-widget',
      name: translate('Menu'),
      description: translate('Navigation menu with custom, page, and category links'),
      icon: Layout,
      category: 'navigation',
      defaultProps: {
        items: [],
        orientation: 'horizontal',
        size: 'md',
        align: 'left',
        variant: 'plain',
        padding: 'none',
        margin: 'none',
        bg: 'none',
        bgFrom: '#3b82f6',
        bgTo: '#8b5cf6',
        variables: {}
      },
      configSchema: {
        orientation: {
          type: 'select',
          label: 'Orientation',
          description: 'Menu layout direction',
          options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' }
          ],
          default: 'horizontal'
        },
        size: {
          type: 'select',
          label: 'Size',
          description: 'Size of menu items',
          options: [
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'Extra Large' }
          ],
          default: 'md'
        },
        align: {
          type: 'select',
          label: 'Alignment',
          description: 'Horizontal alignment of menu items',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' }
          ],
          default: 'left'
        },
        variant: {
          type: 'select',
          label: 'Style',
          description: 'Visual style of the menu',
          options: [
            { value: 'plain', label: 'Plain' },
            { value: 'bar', label: 'Bar (Solid Background)' },
            { value: 'glass', label: 'Glass (Blur Effect)' },
            { value: 'pill', label: 'Pill (Rounded Items)' },
            { value: 'underline', label: 'Underline' }
          ],
          default: 'plain'
        },
        padding: {
          type: 'select',
          label: 'Padding',
          description: 'Inner spacing around menu items',
          options: [
            { value: 'none', label: 'None' },
            { value: 'xs', label: 'XS' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'XL' }
          ],
          default: 'none'
        },
        margin: {
          type: 'select',
          label: 'Margin',
          description: 'Outer spacing around the menu',
          options: [
            { value: 'none', label: 'None' },
            { value: 'xs', label: 'XS' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'XL' }
          ],
          default: 'none'
        },
        bg: {
          type: 'select',
          label: 'Background',
          description: 'Background color or gradient for the full row',
          options: [
            { value: 'none', label: 'None (Transparent)' },
            { value: 'muted', label: 'Muted' },
            { value: 'dark', label: 'Dark' },
            { value: 'primary', label: 'Primary' },
            { value: 'accent', label: 'Accent' },
            { value: 'gradient-primary', label: 'Gradient — Primary' },
            { value: 'gradient-dark', label: 'Gradient — Dark' },
            { value: 'gradient-ocean', label: 'Gradient — Ocean' },
            { value: 'gradient-sunset', label: 'Gradient — Sunset' },
            { value: 'gradient-forest', label: 'Gradient — Forest' },
            { value: 'gradient-brand', label: 'Gradient — Brand (Amber)' },
            { value: 'custom', label: 'Custom Gradient…' }
          ],
          default: 'none'
        },
        bgFrom: {
          type: 'color',
          label: 'Gradient Start',
          description: 'Left / start color of the custom gradient',
          default: '#3b82f6',
          showWhen: { field: 'bg', value: 'custom' }
        },
        bgTo: {
          type: 'color',
          label: 'Gradient End',
          description: 'Right / end color of the custom gradient',
          default: '#8b5cf6',
          showWhen: { field: 'bg', value: 'custom' }
        }
      },
      minSize: { width: 200, height: 40 },
      resizable: true,
      tags: ['menu', 'navigation', 'links', 'nav']
    }
  });

  // Competitors Map Widget
  widgetRegistry.register({
    component: CompetitorsMapWidget,
    metadata: {
      id: 'competitors-map',
      name: translate('Competitors Map'),
      category: 'custom',
      description: translate('Interactive map with clustering, regional analysis, and grid search simulator.'),
      icon: MapIcon,
      defaultProps: {
        jobId: '',
        enableSimulator: true,
        enableRuler: true,
        enableInfoPanel: true,
        enableLayerToggles: true,
        showRegions: true,
        showSettings: true,
        showLocations: true,
        posterMode: false,
        enableLocationDetails: true,
        maxHeight: '800px',
        preset: 'Minimal',
        variables: {}
      },
      configSchema: {
        preset: {
          type: 'select',
          label: 'Display Preset',
          description: 'Choose between full search view or minimal dashboard view.',
          options: [
            { value: 'SearchView', label: 'Search View (Full)' },
            { value: 'Minimal', label: 'Minimal (Dashboard)' }
          ],
          default: 'Minimal'
        },
        enableSimulator: {
          type: 'boolean',
          label: 'Enable Grid Simulator',
          description: 'Show grid search simulator and regional playback tools.',
          default: true
        },
        enableRuler: {
          type: 'boolean',
          label: 'Enable Distance Ruler',
          description: 'Show tool for measuring distances on the map.',
          default: true
        },
        enableInfoPanel: {
          type: 'boolean',
          label: 'Enable Statistics Panel',
          description: 'Show summary statistics for the visible map area.',
          default: true
        },
        enableLayerToggles: {
          type: 'boolean',
          label: 'Enable Layer Toggles',
          description: 'Allow toggling between density heatmap and center points.',
          default: true
        },
        targetLocation: {
          type: 'locationPicker',
          label: 'Map Target Location',
          description: 'Pick the starting point or administrative region for the map.',
        },
        showRegions: {
          type: 'boolean',
          label: 'Show GADM Regions',
          description: 'Display red/green boundary polygons for searched regions.',
          default: true
        },
        showSettings: {
          type: 'boolean',
          label: 'Show Grid Simulator',
          description: 'Display density points and grid centers from the simulator.',
          default: true
        },
        showLocations: {
          type: 'boolean',
          label: 'Show Search Results',
          description: 'Display the actual found location pins and clusters.',
          default: true
        },
        posterMode: {
          type: 'boolean',
          label: 'Poster Mode',
          description: 'Display the map in stylized poster view with themed overlays.',
          default: false
        },
        enableLocationDetails: {
          type: 'boolean',
          label: 'Allow Location Details',
          description: 'Click on a location to open the detail panel with address, ratings, and contact info.',
          default: true
        },
        maxHeight: {
          type: 'string',
          label: 'Max Height',
          description: 'Maximum height of the map widget (e.g. 800px, 100vh, none).',
          default: '800px'
        }
      },
      minSize: { width: 400, height: 400 },
      resizable: true,
      tags: ['map', 'places', 'competitors', 'search', 'simulator']
    }
  });

}
