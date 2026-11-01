import { lazy } from 'react';

// Export lazy-loaded picker for platform-wide use
export const LocationPickerDialog = lazy(() => import('./LocationPickerDialog'));

export * from './types';
