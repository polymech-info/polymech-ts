import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Home, User, Upload, LogOut, LogIn, Wand2, Search, Grid3x3, Globe, ListFilter, Shield, Activity, ShoppingCart, Pencil, Settings, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useWizardContext } from "@/hooks/useWizardContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "@/contexts/ProfilesContext";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { T, getCurrentLang, supportedLanguages, translate, setLanguage } from "@/i18n";
const CreationWizardPopup = lazy(() => import('./CreationWizardPopup').then(m => ({ default: m.CreationWizardPopup })));

const TopNavigation = () => {
  const { user, signOut, roles } = useAuth();
  const { fetchProfile, profiles } = useProfiles();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentLang = getCurrentLang();

  // Keep nav search in sync with URL when on /search
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get('q') || '');
    } else {
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);
  const { creationWizardOpen, setCreationWizardOpen, wizardInitialImage, creationWizardMode } = useWizardContext();

  // Lazy-load ecommerce cart store to keep the heavy ecommerce bundle out of the initial load
  const [cartItemCount, setCartItemCount] = useState(0);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import("@polymech/ecommerce").then(({ useCartStore }) => {
      // Read initial value
      setCartItemCount(useCartStore.getState().itemCount);
      // Subscribe to changes
      unsubscribe = useCartStore.subscribe((state) => {
        setCartItemCount(state.itemCount);
      });
    }).catch(() => { /* ecommerce not available */ });
    return () => unsubscribe?.();
  }, []);

  const authPath = '/authz';

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  const userProfile = user ? profiles[user.id] : null;
  const username = userProfile?.user_id || user?.id;
  const isActive = (path: string) => location.pathname === path;

  {/* Profile Grid Button - Direct to profile feed */ }
  {
    user && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/user/${username}`)}
        className="h-8 w-8 p-0"
        title={translate("My Profile")}
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
    )
  }

  // ...

  <DropdownMenuItem asChild>
    <Link to={`/user/${username}`} className="flex items-center">
      <User className="mr-2 h-4 w-4" />
      <T>Profile</T>
    </Link>
  </DropdownMenuItem>

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleWizardOpen = () => {
    setCreationWizardOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      searchInputRef.current?.blur();
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 landscape:hidden lg:landscape:block">
      <div className="flex items-center justify-between px-2 h-full">
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center space-x-2">
          <img src="/iPhone.png" alt="Logo" className="h-8 w-auto object-contain" />
          <span className="font-bold text-lg hidden sm:inline-block">PolyMech</span>
        </Link>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder={translate("Search articles, pictures, files ...")}
              className="pl-10 pr-4 h-9 w-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </form>
        </div>

        {/* Center Navigation - Desktop only, moved after search */}
        <nav className="hidden lg:flex items-center space-x-6">

        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Support Chat - public */}
          <Button
            variant={isActive('/support-chat') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/support-chat')}
            className="h-8 w-8 p-0"
            title={translate("Support Chat")}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className="h-8 w-8 p-0 sm:hidden"
            title={translate("Search")}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Magic Button - AI Image Generator */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWizardOpen}
              className="h-8 w-8 p-0"
              title={translate("AI Image Generator")}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          )}

          {/* Profile Grid Button - Direct to profile feed */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/user/${user.id}`)}
              className="h-8 w-8 p-0"
              title={translate("My Profile")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          )}

          {/* Cart Icon with Badge */}
          {cartItemCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="h-8 w-8 p-0 relative"
              title={translate("Cart")}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartItemCount > 9 ? '9+' : cartItemCount}
              </span>
            </Button>
          )}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={translate("Language")}
              >
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {supportedLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onSelect={() => handleLanguageChange(lang.code)}
                  className={currentLang === lang.code ? 'bg-accent' : ''}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-primary text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">User {user.id.slice(0, 8)}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={`/user/${user.id}`} className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <T>Profile</T>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/user/${user.id}/pages/myspace?edit=true`} className="flex items-center">
                    <Pencil className="mr-2 h-4 w-4" />
                    <T>Edit Profile Page</T>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <T>Settings</T>
                  </Link>
                </DropdownMenuItem>

                {roles && roles.includes("admin") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin/users" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        <T>Admin</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/user/${user.id}/pages/home?edit=true`} className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <T>Edit Home Page</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/playground/i18n`} className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <T>I18n</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/playground/chat`} className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <T>Chat</T>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/products/gridsearch`} className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        <T>GridSearch</T>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/?upload=true" className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    <T>Upload</T>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <T>Sign out</T>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to={authPath} className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                <T>Sign in</T>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {user && creationWizardOpen && (
        <Suspense fallback={null}>
          <CreationWizardPopup
            isOpen={creationWizardOpen}
            onClose={() => setCreationWizardOpen(false)}
            preloadedImages={wizardInitialImage ? [wizardInitialImage] : []}
            initialMode={creationWizardMode}
          />
        </Suspense>
      )}
    </header>
  );
};

export default TopNavigation;
