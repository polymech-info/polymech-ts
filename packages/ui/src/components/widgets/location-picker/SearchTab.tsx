import React, { useState } from 'react';
import { LocationSelection } from './types';
import { SearchPicker } from '@/modules/places/gridsearch/GridSearchPicker';

interface SearchTabProps {
    onUpdate: (s: LocationSelection) => void;
    currentSelection?: LocationSelection | null;
}

const SearchTab: React.FC<SearchTabProps> = ({ onUpdate, currentSelection }) => {
    const [selectedId, setSelectedId] = useState<string | null>(
        currentSelection?.type === 'search' ? (currentSelection.searchResult?.gid || currentSelection.searchResult?.id) : null
    );

    const handleSelect = (item: any) => {
        const id = item.gid || item.id;
        setSelectedId(id);
        
        const nameMatches = Object.keys(item).filter(k => k.startsWith('NAME_')).sort().reverse();
        const primaryName = nameMatches.length > 0 ? item[nameMatches[0]] : (item.name || item.gadmName);
        const subTexts = nameMatches.slice(1).map(k => item[k]).filter(Boolean);

        onUpdate({
            type: 'search',
            searchResult: item,
            label: primaryName,
            address: subTexts.join(', '),
            lat: item.lat || item.latitude,
            lng: item.lng || item.longitude
        });
    };

    return (
        <div className="flex flex-col h-full bg-background p-6">
            <SearchPicker 
                onSelect={handleSelect} 
                selectedId={selectedId}
            />
        </div>
    );
};

export default SearchTab;

