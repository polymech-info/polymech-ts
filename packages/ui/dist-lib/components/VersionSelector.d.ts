import { default as React } from 'react';
interface VersionSelectorProps {
    currentPictureId: string;
    onVersionSelect: (selectedVersionId: string) => void;
}
declare const VersionSelector: React.FC<VersionSelectorProps>;
export default VersionSelector;
