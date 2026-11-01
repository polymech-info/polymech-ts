import React from "react";
import { User, Save, Key, Globe } from "lucide-react";
import { T, translate, supportedLanguages, setLanguage, getCurrentLang } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileData } from "../types";
import { AvatarPicker } from "./AvatarPicker";
import { ImageFile } from "@/types";

interface GeneralSettingsProps {
  email: string;
  setEmail: (val: string) => void;
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  resetPassword: (email: string) => void;
  onSubmit: () => void;
  updating: boolean;
  avatarPickerProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    uploading: boolean;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    galleryImages: ImageFile[];
    onSelectFromGallery: (url: string) => void;
  };
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  email,
  setEmail,
  profile,
  setProfile,
  selectedLanguage,
  setSelectedLanguage,
  resetPassword,
  onSubmit,
  updating,
  avatarPickerProps
}) => {
  return (
    <CardContent className="space-y-4">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4 pb-6 border-b">
        <Avatar className="h-32 w-32">
          <AvatarImage src={profile.avatar_url} alt={translate("Profile picture")} />
          <AvatarFallback className="bg-gradient-primary text-white text-4xl">
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>
        <AvatarPicker {...avatarPickerProps} />
      </div>

      {/* Profile Form Fields */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email"><T>Email</T></Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={translate("your.email@example.com")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username"><T>Username</T></Label>
          <Input
            id="username"
            value={profile.username}
            onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
            placeholder={translate("Enter username")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name"><T>Display Name</T></Label>
        <Input
          id="display_name"
          value={profile.display_name}
          onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder={translate("Enter display name")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio"><T>Bio</T></Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
          placeholder={translate("Tell us about yourself...")}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <T>Language</T>
        </Label>
        <Select
          value={selectedLanguage}
          onValueChange={(value) => setSelectedLanguage(value as any)}
        >
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {supportedLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          <T>Your preferred language for the interface</T>
        </p>
      </div>

      {/* Change Password */}
      <div className="space-y-2 pt-4 border-t">
        <Label className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          <T>Password</T>
        </Label>
        <p className="text-sm text-muted-foreground">
          <T>Send a password reset link to your email address</T>
        </p>
        <Button
          variant="outline"
          onClick={() => resetPassword(email)}
        >
          <T>Change Password</T>
        </Button>
      </div>

      <Button
        onClick={() => {
          onSubmit();
          if (selectedLanguage !== getCurrentLang()) {
            setLanguage(selectedLanguage as any);
          }
        }}
        disabled={updating}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        <T>{updating ? 'Saving...' : 'Save Changes'}</T>
      </Button>
    </CardContent>
  );
};
