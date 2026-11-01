# Custom Canvas & Widget Extension

## Overview

This document describes the mechanism for extending the playground canvas with custom widgets loaded on-demand.

## Widget Library Structure

External widget libraries are defined in a `library.json` file.
Example: `public/widgets/email/library.json`

```json
{
    "root": "./body.html",
    "name": "email",
    "description": "Email widgets",
    "widgets": [
        {
            "name": "HR",
            "template": "./hr.html"
        },
        ...
    ]
}
```

## HtmlWidget Proxy

To render HTML templates within the React-based canvas, we use a generic `HtmlWidget` component.
This component:

1. Accepts a `templateUrl` prop.
2. Fetches the HTML content from the given URL.
3. Renders the content using `dangerouslySetInnerHTML`.
4. Wraps the content in a container that preserves styles/layout.

## Runtime Registration

Widgets are registered dynamically using `widgetRegistry.register()`.
When a context (e.g., "Email") is loaded:

1. The `library.json` is fetched and parsed.
2. For each widget, a wrapper component is created using `HtmlWidget`.
3. The component is registered via `widgetRegistry.register()` with a unique ID (e.g., `email.hr`).
4. The `WidgetPalette` will automatically reflect these new widgets upon next render (open).
