import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, Building2 } from "lucide-react";
import { T, translate } from "@/i18n";
import { getVendorProfiles, saveVendorProfiles, VendorProfile } from "@/modules/user/client-user";

interface VendorProfileManagerProps {
    userId: string;
}

const emptyProfile: Omit<VendorProfile, "id"> = {
    label: "",
    companyName: "",
    email: "",
    phone: "",
    vatId: "",
    eoriNumber: "",
    logoUrl: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    defaultCurrency: "",
    defaultCountryOfOrigin: "",
    note: "",
    isDefault: false,
};

export function VendorProfileManager({ userId }: VendorProfileManagerProps) {
    const [profiles, setProfiles] = useState<VendorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyProfile);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getVendorProfiles(userId);
            setProfiles(data);
        } catch {
            toast.error(translate("Failed to load vendor profiles"));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const persist = async (next: VendorProfile[]) => {
        setSaving(true);
        try {
            await saveVendorProfiles(userId, next);
            setProfiles(next);
            toast.success(translate("Vendor profiles saved"));
        } catch {
            toast.error(translate("Failed to save vendor profiles"));
        } finally {
            setSaving(false);
        }
    };

    const openAdd = () => {
        setEditingId(null);
        setForm({ ...emptyProfile, isDefault: profiles.length === 0 });
        setDialogOpen(true);
    };

    const openEdit = (p: VendorProfile) => {
        setEditingId(p.id);
        const { id, ...rest } = p;
        setForm(rest);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.companyName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.country.trim()) {
            toast.error(translate("Please fill in all required fields"));
            return;
        }

        let next: VendorProfile[];

        if (editingId) {
            next = profiles.map(p => p.id === editingId ? { ...p, ...form } : p);
        } else {
            const newProfile: VendorProfile = { ...form, id: crypto.randomUUID() };
            next = [...profiles, newProfile];
        }

        if (form.isDefault) {
            const targetId = editingId || next[next.length - 1].id;
            next = next.map(p => ({ ...p, isDefault: p.id === targetId }));
        }

        await persist(next);
        setDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        const next = profiles.filter(p => p.id !== id);
        if (next.length > 0 && !next.some(p => p.isDefault)) {
            next[0].isDefault = true;
        }
        await persist(next);
    };

    const handleSetDefault = async (id: string) => {
        const next = profiles.map(p => ({ ...p, isDefault: p.id === id }));
        await persist(next);
    };

    const field = (key: keyof Omit<VendorProfile, "id">, value: string | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground"><T>Loading vendor profiles…</T></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {profiles.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground"><T>No vendor profiles saved yet</T></p>
                    <Button onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        <T>Add Vendor Profile</T>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {profiles.map(p => (
                            <Card key={p.id} className={p.isDefault ? "border-primary" : ""}>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="font-medium flex items-center gap-2">
                                            {p.logoUrl && <img src={p.logoUrl} alt="" className="h-5 w-5 rounded object-cover" />}
                                            {p.label || p.companyName}
                                            {p.isDefault && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    <T>Default</T>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {!p.isDefault && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetDefault(p.id)} disabled={saving} title={translate("Set as default")}>
                                                    <Star className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} disabled={saving}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)} disabled={saving}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div>{p.companyName}</div>
                                        <div>{p.address}</div>
                                        <div>{p.city}, {p.zip}</div>
                                        <div>{p.country}</div>
                                        <div className="mt-1 space-y-0.5">
                                            <div>{p.email}</div>
                                            <div>{p.phone}</div>
                                        </div>
                                        {(p.vatId || p.eoriNumber) && (
                                            <div className="mt-1 text-xs">
                                                {p.vatId && <span>VAT: {p.vatId}</span>}
                                                {p.vatId && p.eoriNumber && <span> · </span>}
                                                {p.eoriNumber && <span>EORI: {p.eoriNumber}</span>}
                                            </div>
                                        )}
                                        {(p.defaultCurrency || p.defaultCountryOfOrigin) && (
                                            <div className="mt-0.5 text-xs">
                                                {p.defaultCurrency && <span>{p.defaultCurrency}</span>}
                                                {p.defaultCurrency && p.defaultCountryOfOrigin && <span> · </span>}
                                                {p.defaultCountryOfOrigin && <span>Origin: {p.defaultCountryOfOrigin}</span>}
                                            </div>
                                        )}
                                        {p.note && <div className="mt-1 text-xs italic">{p.note}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button variant="outline" onClick={openAdd} disabled={saving}>
                        <Plus className="h-4 w-4 mr-2" />
                        <T>Add Vendor Profile</T>
                    </Button>
                </>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? <T>Edit Vendor Profile</T> : <T>Add Vendor Profile</T>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="vp-label"><T>Label</T></Label>
                            <Input id="vp-label" placeholder={translate("e.g. Main Business, EU Branch")} value={form.label} onChange={e => field("label", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vp-company"><T>Company Name</T> *</Label>
                            <Input id="vp-company" required placeholder={translate("Acme Corp")} value={form.companyName} onChange={e => field("companyName", e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-email"><T>Email</T> *</Label>
                                <Input id="vp-email" type="email" required placeholder={translate("sales@acme.com")} value={form.email} onChange={e => field("email", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-phone"><T>Phone</T> *</Label>
                                <Input id="vp-phone" type="tel" required placeholder={translate("+1 555 000 0000")} value={form.phone} onChange={e => field("phone", e.target.value)} />
                            </div>
                        </div>

                        <hr className="my-1" />

                        <div className="space-y-1.5">
                            <Label htmlFor="vp-address"><T>Source Address</T> *</Label>
                            <Input id="vp-address" required placeholder={translate("123 Warehouse Blvd")} value={form.address} onChange={e => field("address", e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-city"><T>City</T> *</Label>
                                <Input id="vp-city" required value={form.city} onChange={e => field("city", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-zip"><T>ZIP / Postal Code</T></Label>
                                <Input id="vp-zip" value={form.zip} onChange={e => field("zip", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vp-country"><T>Country</T> *</Label>
                            <Input id="vp-country" required placeholder={translate("United States")} value={form.country} onChange={e => field("country", e.target.value)} />
                        </div>

                        <hr className="my-1" />

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-vat"><T>VAT / Tax ID</T></Label>
                                <Input id="vp-vat" placeholder={translate("DE123456789")} value={form.vatId} onChange={e => field("vatId", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-eori"><T>EORI Number</T></Label>
                                <Input id="vp-eori" placeholder={translate("DE123456789000")} value={form.eoriNumber} onChange={e => field("eoriNumber", e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-currency"><T>Default Currency</T></Label>
                                <Input id="vp-currency" placeholder={translate("EUR")} value={form.defaultCurrency} onChange={e => field("defaultCurrency", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="vp-origin"><T>Country of Origin</T></Label>
                                <Input id="vp-origin" placeholder={translate("DE")} value={form.defaultCountryOfOrigin} onChange={e => field("defaultCountryOfOrigin", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vp-logo"><T>Logo URL</T></Label>
                            <Input id="vp-logo" type="url" placeholder={translate("https://…")} value={form.logoUrl} onChange={e => field("logoUrl", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vp-note"><T>Note</T></Label>
                            <Input id="vp-note" placeholder={translate("Internal notes, instructions…")} value={form.note} onChange={e => field("note", e.target.value)} />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isDefault} onChange={e => field("isDefault", e.target.checked)} className="rounded" />
                            <span className="text-sm"><T>Set as default vendor profile</T></span>
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            <T>Cancel</T>
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <T>Saving…</T> : editingId ? <T>Update</T> : <T>Add</T>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
