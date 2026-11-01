import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark } from 'lucide-react';
import AddToCollectionModal from './AddToCollectionModal';
import { useAuth } from '@/hooks/useAuth';

interface CollectionButtonProps {
  pictureId: string;
  size?: 'sm' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
}

const CollectionButton = ({ 
  pictureId, 
  size = 'sm',
  variant = 'ghost',
  className = ''
}: CollectionButtonProps) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={`transition-all duration-200 hover:scale-110 ${className}`}
        title="Add to collection"
      >
        <Bookmark className={`${size === 'sm' ? 'h-3 w-3' : 'h-5 w-5'}`} />
      </Button>

      <AddToCollectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pictureId={pictureId}
      />
    </>
  );
};

export default CollectionButton;
