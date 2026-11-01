import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import HomeWidget from "@/components/widgets/HomeWidget";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inputQuery, setInputQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const query = searchParams.get('q') || '';
  const sortBy = (searchParams.get('sortBy') as 'latest' | 'top') || undefined;
  const viewMode = (searchParams.get('viewMode') as 'grid' | 'large' | 'list') || 'grid';
  const showCategories = searchParams.get('showCategories') === 'true';
  const categorySlugs = searchParams.get('categorySlugs') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const showSortBar = searchParams.get('showSortBar') !== 'false';
  const showLayoutToggles = searchParams.get('showLayoutToggles') !== 'false';
  const showFooter = searchParams.get('showFooter') === 'true';
  const center = searchParams.get('center') === 'true';
  const columnsParam = searchParams.get('columns');
  const columns = columnsParam === 'auto' ? 'auto' : (columnsParam ? parseInt(columnsParam, 10) : 4);
  const heading = searchParams.get('heading') || undefined;
  const headingLevel = (searchParams.get('headingLevel') as 'h1' | 'h2' | 'h3' | 'h4') || undefined;
  const initialContentType = (searchParams.get('type') || searchParams.get('initialContentType')) as 'posts' | 'pages' | 'pictures' | 'files' | 'places' | undefined;
  const visibilityFilter = (searchParams.get('visibilityFilter')) as 'invisible' | 'private' | undefined;

  // Sync input with URL query
  useEffect(() => {
    setInputQuery(query);
  }, [query]);

  // Auto-focus on mount when no query
  useEffect(() => {
    if (!query.trim()) {
      searchInputRef.current?.focus();
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', inputQuery.trim());
      navigate(`/search?${newParams.toString()}`);
      searchInputRef.current?.blur();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setInputQuery('');
      searchInputRef.current?.blur();
    }
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="max-w-md mx-auto mt-8 mb-8 sm:hidden">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search pages, posts, pictures, and places..."
                className="pl-10 pr-4 h-11 w-full bg-muted/50 border focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </form>
          </div>
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Enter a search term</h3>
            <p className="text-muted-foreground">Search for pages, posts, pictures, and places</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 max-w-6xl pb-4 sm:hidden">
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search pages, posts, pictures, and places..."
            className="pl-10 pr-4 h-11 w-full bg-muted/50 border focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search"
          />
        </form>
      </div>
      <HomeWidget
        searchQuery={query}
        sortBy={sortBy}
        viewMode={viewMode}
        showCategories={showCategories}
        categorySlugs={categorySlugs}
        categoryId={categoryId}
        userId={userId}
        showSortBar={showSortBar}
        showLayoutToggles={showLayoutToggles}
        showFooter={showFooter}
        center={center}
        columns={columns}
        heading={heading}
        headingLevel={headingLevel}
        initialContentType={initialContentType}
        initialVisibilityFilter={visibilityFilter}
      />
    </div>
  );
};

export default SearchResults;