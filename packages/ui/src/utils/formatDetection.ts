
/**
 * Checks for support of modern image formats (AVIF, WebP)
 * and adds corresponding classes to the documentElement (e.g. .avif, .webp)
 * to be used in CSS selectors.
 */

const addClass = (className: string) => {
    if (document.documentElement.classList.contains(className)) return;
    document.documentElement.classList.add(className);
};

const isFormatSupported = (format: string, dataUri: string) => {
    const image = new Image();
    image.src = `data:image/${format};base64,${dataUri}`;
    image.onload = () => {
        if (image.width > 0 && image.height > 0) {
            addClass(format);
        }
    };
    image.onerror = () => {
        // Format not supported
    };
};

export const initFormatDetection = () => {
    // Add fallback classes (optional, or assume no-class = fallback)
    // Here we only add classes for support.

    // WebP test
    isFormatSupported("webp", "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==");

    // AVIF test
    isFormatSupported(
        "avif",
        "AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A="
    );
};
