import { default as React } from 'react';
interface MilkdownEditorInternalProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}
declare const MilkdownEditorInternal: React.FC<MilkdownEditorInternalProps>;
export default MilkdownEditorInternal;
