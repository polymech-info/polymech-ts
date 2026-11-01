import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Globe, Phone, Clock } from 'lucide-react';
import { type PlaceFull } from '@polymech/shared';
import { THUMBNAIL_WIDTH } from '@/constants';

interface PlacesThumbViewProps {
    places: PlaceFull[];
    filters: string[];
    toggleFilter: (filter: string) => void;
}

export const PlacesThumbView: React.FC<PlacesThumbViewProps> = ({
    places,
    filters,
    toggleFilter
}) => {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {places.map((place) => {
                let imageUrl = place.raw_data?.google_media?.photos?.[0]?.image;
                if (imageUrl) {
                    imageUrl = imageUrl.replace(/=w\d+[^&]*/, `=w${THUMBNAIL_WIDTH}`);
                }
                imageUrl = imageUrl || place.thumbnail || undefined;

                return (
                    <div key={place.place_id} className="border overflow-hidden">
                        {imageUrl && (
                            <div className="h-48 w-full overflow-hidden ">
                                <img
                                    src={imageUrl}
                                    alt={place.title}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}
                        <div className="px-4 py-5 sm:p-6">
                            <Link to={`/products/places/detail/${place.place_id}`} className="block">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2 hover:text-indigo-600">{place.title}</h3>
                            </Link>
                            <div className="mb-3 flex flex-wrap gap-1">
                                {(() => {
                                    const businessTypes = place.types || [];
                                    const mediaCategories = place.raw_data?.google_media?.categories || [];
                                    const city = place.city || place.raw_data?.geo?.city;

                                    // Display up to 3 items total, prioritizing city, then business types
                                    const displayLimit = 3;
                                    let totalItems = businessTypes.length + mediaCategories.length;
                                    if (city) totalItems += 1;

                                    let displayedCount = 0;
                                    const items: React.ReactNode[] = [];

                                    // Add City
                                    if (city && displayedCount < displayLimit) {
                                        items.push(
                                            <button
                                                key={`city-${city}`}
                                                onClick={(e) => { e.preventDefault(); toggleFilter(city); }}
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${filters.includes(city)
                                                    ? 'bg-green-200 text-green-900 ring-1 ring-green-400'
                                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    }`}
                                            >
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {city}
                                            </button>
                                        );
                                        displayedCount++;
                                    }

                                    // Add Business Types
                                    for (const type of businessTypes) {
                                        if (displayedCount < displayLimit) {
                                            if (type == null || typeof type === 'object') continue;
                                            const typeStr = String(type);
                                            items.push(
                                                <button
                                                    key={`type-${typeStr}`}
                                                    onClick={(e) => { e.preventDefault(); toggleFilter(typeStr); }}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize transition-colors ${filters.includes(typeStr)
                                                        ? 'bg-blue-200 text-blue-900 ring-1 ring-blue-400'
                                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                        }`}
                                                >
                                                    {typeStr.replace(/_/g, ' ')}
                                                </button>
                                            );
                                            displayedCount++;
                                        }
                                    }

                                    // Add Media Categories if space permits
                                    for (const cat of mediaCategories) {
                                        if (displayedCount < displayLimit) {
                                            items.push(
                                                <button
                                                    key={`cat-${cat.id}`}
                                                    onClick={(e) => { e.preventDefault(); toggleFilter(cat.title); }}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium transition-colors ${filters.includes(cat.title)
                                                        ? 'bg-gray-300 text-gray-900 ring-1 ring-gray-400'
                                                        : ' text-gray-800 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {cat.title}
                                                </button>
                                            );
                                            displayedCount++;
                                        }
                                    }

                                    return (
                                        <>
                                            {items}
                                            {totalItems > displayLimit && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium  text-gray-800">
                                                    +{totalItems - displayLimit}
                                                </span>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="space-y-2 text-sm text-gray-500">
                                <div className="flex items-start">
                                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                                    <span>{place.address}</span>
                                </div>
                                {place.phone && (
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                                        <span>{place.phone}</span>
                                    </div>
                                )}
                                {place.website && (
                                    <div className="flex items-center">
                                        <Globe className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                                        <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 truncate">
                                            Visit Website
                                        </a>
                                    </div>
                                )}
                                {place.operating_hours && (
                                    <div className="flex items-start">
                                        <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                                        <span className="text-xs">Operating hours available</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
