import React from 'react';
import { T } from '@/i18n';

export const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500/15 text-green-600',
    unsubscribed: 'bg-yellow-500/15 text-yellow-600',
    bounced: 'bg-orange-500/15 text-orange-600',
    blocked: 'bg-red-500/15 text-red-600',
};

export const STATUSES = ['active', 'unsubscribed', 'bounced', 'blocked'] as const;

export const StatusBadge = ({ status }: { status?: string }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status || 'active'] ?? STATUS_COLORS.active}`}>
        <T>{status || 'active'}</T>
    </span>
);
