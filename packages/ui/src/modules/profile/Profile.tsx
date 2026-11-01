import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { T, getCurrentLang } from "@/i18n";
import { SidebarProvider } from "@/components/ui/sidebar";

// Types
import { ActiveSection } from "@/modules/profile/types";

// Hooks
import { useProfile } from "@/modules/profile/hooks/useProfile";
import { useAvatar } from "@/modules/profile/hooks/useAvatar";
import { useUserImages } from "@/modules/profile/hooks/useUserImages";

// Components
import { ProfileSidebar } from "@/modules/profile/components/ProfileSidebar";
import { GeneralSettings } from "@/modules/profile/components/GeneralSettings";
import { ApiKeysSettings } from "@/modules/profile/components/ApiKeysSettings";
import { ProfileGallery } from "@/modules/profile/components/ProfileGallery";

// Lazy Loaded Modules
const FileBrowser = React.lazy(() => import('@/modules/storage/FileBrowser'));

const LazyPurchasesList = React.lazy(() =>
  import("@polymech/ecommerce").then(m => ({ default: m.PurchasesList }))
);
const VariablesEditor = React.lazy(() =>
  import('@/components/variables/VariablesEditor').then(m => ({ default: m.VariablesEditor }))
);
const ShippingAddressManager = React.lazy(() =>
  import('@/components/ShippingAddressManager').then(m => ({ default: m.ShippingAddressManager }))
);
const VendorProfileManager = React.lazy(() =>
  import('@/components/VendorProfileManager').then(m => ({ default: m.VendorProfileManager }))
);
const ContactsManager = React.lazy(() =>
  import('@/modules/contacts/ContactsManager').then(m => ({ default: m.ContactsManager }))
);
const CampaignsManager = React.lazy(() =>
  import('@/components/CampaignsManager').then(m => ({ default: m.CampaignsManager }))
);
const GmailIntegrations = React.lazy(() =>
  import('@/components/GmailIntegrations').then(m => ({ default: m.GmailIntegrations }))
);
const SmtpIntegrations = React.lazy(() =>
  import('@/components/SmtpIntegrations').then(m => ({ default: m.SmtpIntegrations }))
);
const CategoryManager = React.lazy(() =>
  import('@/components/widgets/CategoryManager').then(m => ({ default: m.CategoryManager }))
);

const Profile = () => {
  const { user, loading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract active section from pathname
  const pathParts = location.pathname.split('/');
  const activeSection = (pathParts[2] || 'general') as ActiveSection;

  const setActiveSection = (section: ActiveSection) => {
    if (section === 'general') {
      navigate('/profile', { replace: true });
    } else {
      navigate(`/profile/${section}`, { replace: true });
    }
  };

  // State & Logic Hooks
  const {
    profile,
    setProfile,
    secrets,
    handleSecretChange,
    handleSecretFocus,
    email,
    setEmail,
    updatingProfile,
    handleProfileUpdate
  } = useProfile(user);

  const {
    images,
    fetchingImages,
    currentIndex,
    setCurrentIndex,
    handleImageDelete
  } = useUserImages(user);

  const {
    avatarDialogOpen,
    setAvatarDialogOpen,
    uploadingAvatar,
    handleAvatarUpload,
    handleSelectFromGallery
  } = useAvatar(user, (url) => setProfile(prev => ({ ...prev, avatar_url: url })));

  const [selectedLanguage, setSelectedLanguage] = useState(getCurrentLang());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground"><T>Loading...</T></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ProfileSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        <main className="flex-1 p-2 overflow-auto">
          <div className="mx-auto">
            <Routes>
              <Route path="/" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>General Settings</T></CardTitle>
                  </CardHeader>
                  <GeneralSettings
                    email={email}
                    setEmail={setEmail}
                    profile={profile}
                    setProfile={setProfile}
                    selectedLanguage={selectedLanguage}
                    setSelectedLanguage={(lang) => setSelectedLanguage(lang as any)}
                    resetPassword={resetPassword}
                    onSubmit={handleProfileUpdate}
                    updating={updatingProfile}
                    avatarPickerProps={{
                      open: avatarDialogOpen,
                      onOpenChange: setAvatarDialogOpen,
                      uploading: uploadingAvatar,
                      onUpload: handleAvatarUpload,
                      galleryImages: images,
                      onSelectFromGallery: handleSelectFromGallery
                    }}
                  />
                </div>
              } />

              <Route path="api-keys" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>API Keys</T></CardTitle>
                  </CardHeader>
                  <ApiKeysSettings
                    secrets={secrets}
                    handleSecretChange={handleSecretChange}
                    handleSecretFocus={handleSecretFocus}
                    onSubmit={handleProfileUpdate}
                    updating={updatingProfile}
                  />
                </div>
              } />

              <Route path="variables" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>Variables</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <VariablesEditor
                      onLoad={async () => {
                        const { getUserVariables } = await import('@/modules/user/client-user');
                        return await getUserVariables(user.id) || {};
                      }}
                      onSave={async (data) => {
                        const { updateUserVariables } = await import('@/modules/user/client-user');
                        await updateUserVariables(user.id, data);
                      }}
                    />
                  </React.Suspense>
                </div>
              } />

              <Route path="addresses" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>Shipping Addresses</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <ShippingAddressManager userId={user.id} />
                  </React.Suspense>
                </div>
              } />

              <Route path="vendor" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>Vendor Profiles</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <VendorProfileManager userId={user.id} />
                  </React.Suspense>
                </div>
              } />

              <Route path="purchases" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>My Purchases</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <LazyPurchasesList
                      onFetchTransactions={async () => {
                        const { listTransactions } = await import('@/modules/ecommerce/client-ecommerce');
                        return listTransactions();
                      }}
                      onNavigate={navigate}
                      toast={{
                        error: (msg: string) => {
                          import("sonner").then(m => m.toast.error(msg));
                        }
                      }}
                    />
                  </React.Suspense>
                </div>
              } />

              <Route path="contacts" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>Contacts</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <ContactsManager />
                  </React.Suspense>
                </div>
              } />

              <Route path="campaigns" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>Campaigns</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <CampaignsManager />
                  </React.Suspense>
                </div>
              } />

              <Route path="categories" element={
                <div className="flex flex-col h-[75vh] min-h-[600px]">
                  <CardHeader>
                    <CardTitle><T>Categories</T></CardTitle>
                  </CardHeader>
                  <div className="flex-1 min-h-0 px-0 pb-1 md:px-6 md:pb-6 relative overflow-hidden">
                    <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                      <CategoryManager isOpen={true} onClose={() => { }} asView={true} />
                    </React.Suspense>
                  </div>
                </div>
              } />

              <Route path="integrations" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>IMAP Integrations</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <GmailIntegrations />
                  </React.Suspense>
                </div>
              } />

              <Route path="smtp-servers" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>SMTP Servers</T></CardTitle>
                  </CardHeader>
                  <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                    <SmtpIntegrations />
                  </React.Suspense>
                </div>
              } />

              <Route path="gallery" element={
                <div>
                  <CardHeader>
                    <CardTitle><T>My Gallery</T></CardTitle>
                  </CardHeader>
                  <ProfileGallery
                    fetching={fetchingImages}
                    images={images}
                    currentIndex={currentIndex}
                    setCurrentIndex={setCurrentIndex}
                    onDelete={handleImageDelete}
                    onNavigate={navigate}
                  />
                </div>
              } />

              <Route path="my-files/*" element={
                <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] overflow-hidden">
                  <CardHeader>
                    <CardTitle><T>My Files</T></CardTitle>
                  </CardHeader>
                  <div className="flex-1 min-h-0 px-2 pb-1 md:px-6 md:pb-6 relative overflow-hidden">
                    <React.Suspense fallback={<div className="flex items-center justify-center py-12 text-muted-foreground"><T>Loading...</T></div>}>
                      <FileBrowser
                        allowPanels={false}
                        mode="simple"
                        disableRoutingSync={true}
                        initialMount="home"
                      />
                    </React.Suspense>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Profile;