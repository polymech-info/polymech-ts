# Tabs Widget Proposal

## Overview
A new **Tabs Widget** that allows organizing content into multiple switchable tabs. Each tab will contain its own nested layout, capable of holding multiple widgets, similar to the `LayoutContainerWidget`.

## Data Structure
The widget will maintain a list of tabs, where each tab holds a reference to a unique "Virtual Page ID" essentially acting as a container for other widgets.

```typescript
interface TabDefinition {
  id: string;          // Unique identifier for the tab
  label: string;       // Display text
  layoutId: string;    // The 'pageId' used for the nested GenericCanvas
  icon?: string;       // Optional icon name
}

interface TabsWidgetProps {
  tabs: TabDefinition[];
  activeTabId: string;
  orientation: 'horizontal' | 'vertical';
  tabBarPosition: 'top' | 'bottom' | 'left' | 'right';
  className?: string; // Container classes
  tabBarClassName?: string; // Tab bar specific classes
  contentClassName?: string; // Content area classes
}
```

## Implementation Strategy

### 1. Widget Registration (`registerWidgets.ts`)
Register a new `TabsWidget` with a custom configuration schema.

- **Tabs Management**: A dedicated property editor (array of objects) to add/remove/reorder tabs and rename them.
- **Orientation/Position**: Selectors for tab bar placement.
- **Styling**: Tailwind CSS class pickers for container, tab bar, and content area.

### 2. Component Structure (`TabsWidget.tsx`)
The component will render:
1.  **Tab Bar**: A list of buttons/tabs.
2.  **Content Area**: renders a `GenericCanvas` for the currently active tab.

```tsx
// simplified pseudo-code
const TabsWidget = ({ tabs, activeTabId, ...props }) => {
  const [currentTabId, setCurrentTabId] = useState(activeTabId || tabs[0]?.id);
  const currentTab = tabs.find(t => t.id === currentTabId);

  return (
    <div className="flex flex-col ...">
      <TabBar 
        tabs={tabs} 
        activeId={currentTabId} 
        onSelect={setCurrentTabId} 
      />
      <div className="flex-1 relative">
         {currentTab && (
           <GenericCanvas 
             key={currentTab.layoutId} // Key ensures remount/proper context switch
             pageId={currentTab.layoutId} 
             isEditMode={isEditMode}
           />
         )}
      </div>
    </div>
  );
}
```

### 3. Widget Properties Interface (`WidgetPropertiesForm.tsx`)
We need a new field type: `'array-objects'` or specifically `'tabs-editor'` to manage the list of tabs.
- **Add Tab**: Generates a new `layoutId` (e.g., `tabs-<widgetId>-<timestamp>`) and adds to the list.
- **Edit Tab**: Change label/icon.
- **Remove Tab**: Removes from list (and ideally cleans up the layout, though we might leave orphans for safety initially).
- **Reorder**: Drag-and-drop reordering.

## UX & Styling
- **Tailwind Support**: Fully transparent styling via props.
- **Default Styles**: Clean, modern tab look (border-b active state).
- **Edit Mode**: When in edit mode, the `GenericCanvas` inside the active tab should allow dropping widgets just like the main canvas.

## Nested Layout Handling
By reusing `GenericCanvas`, we automatically get:
- Drag & Drop support.
- Widget resizing within the tab.
- Persistence (provided the backend `layouts` table or `page_layouts` supports these virtual IDs).

## Dependencies
- `GenericCanvas`: For rendering the nested content.
- `dnd-kit` (or similar): For reordering tabs in the property panel.
- `lucide-react`: For tab icons.

## Roadmap
1.  **Scaffold**: Create `TabsWidget.tsx` and register it.
2.  **Properties**: Update `WidgetPropertiesForm` to support managing a list of tabs.
3.  **Integration**: Verify nested drag-and-drop works correctly within `GenericCanvas`.
