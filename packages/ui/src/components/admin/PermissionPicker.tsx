/**
 * PermissionPicker — reusable permission checkbox row using Radix Checkbox.
 *
 * Usage:
 *   <PermissionPicker value={['read','list']} onChange={setPerms} />
 */
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface PermissionPickerProps {
    /** Currently selected permissions */
    value: string[];
    /** Called with new permissions array on every change */
    onChange: (perms: string[]) => void;
    /** Disable interaction */
    disabled?: boolean;
    /** List of available permissions to pick from */
    availablePermissions: readonly string[];
}

export const PermissionPicker: React.FC<PermissionPickerProps> = ({ value, onChange, disabled, availablePermissions }) => {
    const toggle = (perm: string, checked: boolean) => {
        const next = checked
            ? [...value.filter(p => p !== perm), perm]
            : value.filter(p => p !== perm);
        onChange(next);
    };

    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
            {availablePermissions.map(p => (
                <label key={p} className={`flex items-center gap-1.5 text-xs select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Checkbox
                        checked={value.includes(p)}
                        onCheckedChange={(checked) => toggle(p, !!checked)}
                        disabled={disabled}
                    />
                    {p}
                </label>
            ))}
        </div>
    );
};
