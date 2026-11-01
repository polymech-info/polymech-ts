import { User, Key, Hash, MapPin, Building2, BookUser, Send, Plug, ShoppingBag, Images, FolderTree, FolderOpen } from "lucide-react";
import { translate } from "@/i18n";

export type ActiveSection = 'general' | 'api-keys' | 'variables' | 'addresses' | 'vendor' | 'gallery' | 'purchases' | 'contacts' | 'campaigns' | 'integrations' | 'smtp-servers' | 'categories' | 'my-files';

export interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  settings: Record<string, any>;
}

export const PROFILE_MENU_ITEMS = [
  { id: 'general' as ActiveSection, label: 'General', icon: User },
  { id: 'api-keys' as ActiveSection, label: 'API Keys', icon: Key },
  { id: 'variables' as ActiveSection, label: 'Variables', icon: Hash },
  { id: 'categories' as ActiveSection, label: 'Categories', icon: FolderTree },
  { id: 'addresses' as ActiveSection, label: 'Shipping Addresses', icon: MapPin },
  { id: 'vendor' as ActiveSection, label: 'Vendor Profiles', icon: Building2 },
  { id: 'contacts' as ActiveSection, label: 'Contacts', icon: BookUser },
  { id: 'campaigns' as ActiveSection, label: 'Campaigns', icon: Send },
  { id: 'integrations' as ActiveSection, label: 'IMAP Integrations', icon: Plug },
  { id: 'smtp-servers' as ActiveSection, label: 'SMTP Servers', icon: Send },
  { id: 'purchases' as ActiveSection, label: 'Purchases', icon: ShoppingBag },
  { id: 'my-files' as ActiveSection, label: 'My Files', icon: FolderOpen }
];
