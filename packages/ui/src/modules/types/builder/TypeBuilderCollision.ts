import {
    closestCenter,
    pointerWithin,
    rectIntersection,
    type CollisionDetection,
} from '@dnd-kit/core';

/** Draggable palette item ids (see TypeBuilderContent + TypeCategoryTree) */
export function isPaletteDragId(id: string | number): boolean {
    const s = String(id);
    return (
        s.startsWith('primitive-') ||
        s.startsWith('type-') ||
        s.startsWith('palette-app-') ||
        s.startsWith('palette-primitive-')
    );
}

/**
 * Palette → canvas: prefer the canvas droppable whenever the pointer intersects it,
 * so sortable field cards do not steal hits from `closestCenter`.
 * Field reorder: keep default closest-center behavior.
 */
export const typeBuilderCollisionDetection: CollisionDetection = (args) => {
    const activeId = args.active?.id;
    if (activeId == null) {
        return closestCenter(args);
    }

    if (!isPaletteDragId(activeId)) {
        return closestCenter(args);
    }

    const pointerHits = pointerWithin(args);
    const canvasPointer = pointerHits.find((c) => c.id === 'canvas');
    if (canvasPointer) {
        return [canvasPointer];
    }

    // Slightly more forgiving when the pointer is near the edge of the scroll area
    const rectHits = rectIntersection(args);
    const canvasRect = rectHits.find((c) => c.id === 'canvas');
    if (canvasRect) {
        return [canvasRect];
    }

    // Do not fall back to closestCenter for palette drags — it targets sortable fields.
    return [];
};
