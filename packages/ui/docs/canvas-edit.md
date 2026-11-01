# Canvas Inline Editing & Extension Slots Proposal

## Objective

Enable a rich "Design Mode" experience where widget properties (text, images) can be edited directly on the canvas (Inline Editing) and widgets can define "Slots" for nested or extended content.

## 1. Inline Editing

Instead of relying solely on the sidebar or modal settings, we can make properties directly editable within the visual representation of the widget.

### Concept

* **Property Mapping**: Map specific DOM elements in the widget template to widget properties (e.g., `${content}`, `${image-0}`).
* **Editor Activation**: When in "Edit Mode", these elements become interactive targets (contenteditable for text, click-to-pick for images).
* **Data Binding**: Changes to the inline element immediately update the underlying widget property map.

### 1.1 Text Editing

**Example: `text.html`**
Current:

```html
<p style="...${class}">${content}</p>
```

**Proposed Implementation:**
The renderer (HtmlWidget) detects text property placeholders and wraps them in a span that handles the click/edit event.

**Rendered Output (Design Mode):**

```html
<p style="...">
  <span 
    data-widget-prop="content" 
    contenteditable="true"
    onBlur="(e) => updateProp('content', e.target.innerText)"
    class="hover:outline-dashed hover:outline-blue-400"
  >
    ast3
  </span>
</p>
```

### 1.2 Image Editing

**Example: `image_col_3.html`**
Current:

```html
<img src="${image-0}" class="${imgClass} ..." ... />
```

**Proposed Implementation:**
The renderer identifies `<img>` tags where the `src` attribute is bound to a variable (e.g., `${image-0}`). It attaches an `onClick` handler to these images in Design Mode.

**Interaction Flow:**

1. **Hover**: Image overlay indicates "Change Image" (e.g., camera icon, dashed border).
2. **Click**: Triggers `ImagePickerDialog.tsx` popup found in `src/components/widgets/ImagePickerDialog.tsx`.
3. **Select**: User picks an image from the gallery (or uploads new).
4. **Update**: On selection (`onSelectPicture`), the `image_url` is mapped back to the widget's property (e.g., `props['image-0'] = picture.image_url`).

## 2. Extension Slots

Widgets should be able to define "Slots" where other widgets or specialized content can be inserted. This effectively allows widgets to act as layout containers for specific sections.

### Concept

* **Slot Definition**: Define areas within a widget template that serve as drop zones or modification points.
* **Extensions**: Other widgets or "Feature Blocks" that can be plugged into these slots.

### Example: `text.html` with Slots

We might want to allow injecting a "Call to Action" button or a "Divider" *inside* the text block structure, or perhaps an "Action Bar" slot that appears on hover.

**Template Definition (`text.html`):**

```html
<td class="long-text ...">
    <p>${content}</p>
    <!-- Extension Slot: 'footer' -->
    <div data-slot="footer" class="slot-placeholder empty:hidden">
        <!-- In Design Mode, this shows a "+" button if empty -->
    </div>
</td>
```

### Configuration (`library.json`)

```json
{
  "name": "Text",
  "template": "./text.html",
  "slots": {
    "footer": {
      "allowedWidgets": ["button", "link"],
      "maxItems": 1
    }
  }
}
```

## 3. Combined Workflow (Design Mode)

1. **Select Widget**: The toolbar shows standard settings.
2. **Edit Content**: Strings are editable inline; Images trigger the picker.
3. **Slots**: defined "Slots" highlight for drag-and-drop insertion.
4. **Drop Widget**: Dragging a "Button" widget onto the "footer" slot nests it within the Text widget's data structure (e.g., `props.slots.footer = [ButtonWidget]`).

## Next Steps

1. **Parser Update**: Update `HtmlWidget` to:
    * Inject `contenteditable` wrappers for text vars.
    * Attach `onClick` to `<img>` tags mapped to variables.
    * Parse `data-slot` and render `SlotContainer`.
2. **Interaction Layer**: Connect `ImagePickerDialog` and `onClick` handlers in `GenericCanvas`/`HtmlWidget`.
3. **Data Model**: Update widget property structure to support nested slot content.
