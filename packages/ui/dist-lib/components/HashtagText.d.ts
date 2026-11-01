import { default as React } from 'react';
interface HashtagTextProps {
    children: string;
    className?: string;
    onTagClick?: (tag: string) => void;
}
declare const HashtagText: React.FC<HashtagTextProps>;
export default HashtagText;
