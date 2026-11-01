import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashtagContent, type ContentSegment } from '@/utils/tagUtils';

interface HashtagTextProps {
  children: string;
  className?: string;
  onTagClick?: (tag: string) => void;
}

const HashtagText: React.FC<HashtagTextProps> = ({ 
  children, 
  className = '',
  onTagClick 
}) => {
  const navigate = useNavigate();
  
  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      navigate(`/tags/${tag}`);
    }
  };

  const segments = parseHashtagContent(children);

  return (
    <span className={className}>
      {segments.map((segment: ContentSegment, index: number) => {
        if (segment.type === 'hashtag') {
          return (
            <button
              key={`tag-${index}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTagClick(segment.content);
              }}
              className="text-primary hover:text-primary/80 font-medium hover:underline cursor-pointer transition-colors"
            >
              #{segment.content}
            </button>
          );
        }
        return <span key={`text-${index}`}>{segment.content}</span>;
      })}
    </span>
  );
};

export default HashtagText;
