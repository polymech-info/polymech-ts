import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, MapPin } from "lucide-react";
import { T, translate } from "@/i18n";
import { getShippingAddresses, saveShippingAddresses, SavedShippingAddress } from "@/modules/user/client-user";

interface ShippingAddressManagerProps {
    userId: string;
}

const emptyAddress: Omit<SavedShippingAddress, "id"> = {
    label: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    country: "",
    note: "",
    isDefault: false,
};

export function ShippingAddressManager({ userId }: ShippingAddressManagerProps) {
    const [addresses, setAddresses] = useState<SavedShippingAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyAddress);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getShippingAddresses(userId);
            setAddresses(data);
        } catch {
            toast.error(translate("Failed to load shipping addresses"));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const persist = async (next: SavedShippingAddress[]) => {
        setSaving(true);
        try {
            await saveShippingAddresses(userId, next);
            setAddresses(next);
            toast.success(translate("Shipping addresses saved"));
        } catch {
            toast.error(translate("Failed to save shipping addresses"));
        } finally {
            setSaving(false);
        }
    };

    const openAdd = () => {
        setEditingId(null);
        setForm({ ...emptyAddress, isDefault: addresses.length === 0 });
        setDialogOpen(true);
    };

    const openEdit = (addr: SavedShippingAddress) => {
        setEditingId(addr.id);
        setForm({ label: addr.label, fullName: addr.fullName, email: addr.email, phone: addr.phone, address: addr.address, city: addr.city, zip: addr.zip, country: addr.country, note: addr.note, isDefault: addr.isDefault });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.country.trim()) {
            toast.error(translate("Please fill in all required fields"));
            return;
        }

        let next: SavedShippingAddress[];

        if (editingId) {
            next = addresses.map(a => a.id === editingId ? { ...a, ...form } : a);
        } else {
            const newAddr: SavedShippingAddress = {
                ...form,
                id: crypto.randomUUID(),
            };
            next = [...addresses, newAddr];
        }

        // If this address is being set as default, unmark others
        if (form.isDefault) {
            const targetId = editingId || next[next.length - 1].id;
            next = next.map(a => ({ ...a, isDefault: a.id === targetId }));
        }

        await persist(next);
        setDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        const next = addresses.filter(a => a.id !== id);
        // If we deleted the default, promote the first remaining
        if (next.length > 0 && !next.some(a => a.isDefault)) {
            next[0].isDefault = true;
        }
        await persist(next);
    };

    const handleSetDefault = async (id: string) => {
        const next = addresses.map(a => ({ ...a, isDefault: a.id === id }));
        await persist(next);
    };

    const field = (key: keyof Omit<SavedShippingAddress, "id">, value: string | boolean) =>
        setForm(prev => ({ ...prev, [key]: value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground"><T>Loading addresses…</T></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {addresses.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground"><T>No shipping addresses saved yet</T></p>
                    <Button onClick={openAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        <T>Add Address</T>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {addresses.map(addr => (
                            <Card key={addr.id} className={addr.isDefault ? "border-primary" : ""}>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="font-medium flex items-center gap-2">
                                            {addr.label || addr.fullName}
                                            {addr.isDefault && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    <T>Default</T>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            {!addr.isDefault && (
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleSetDefault(addr.id)} disabled={saving} title={translate("Set as default")}>
                                                    <Star className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)} disabled={saving}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(addr.id)} disabled={saving}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <div>{addr.fullName}</div>
                                        <div>{addr.address}</div>
                                        <div>{addr.city}, {addr.zip}</div>
                                        <div>{addr.country}</div>
                                        <div className="mt-1 space-y-0.5">
                                            <div>{addr.email}</div>
                                            <div>{addr.phone}</div>
                                        </div>
                                        {addr.note && <div className="mt-1 text-xs italic">{addr.note}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Button variant="outline" onClick={openAdd} disabled={saving}>
                        <Plus className="h-4 w-4 mr-2" />
                        <T>Add Address</T>
                    </Button>
                </>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? <T>Edit Address</T> : <T>Add Address</T>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="sa-label"><T>Label</T></Label>
                            <Input id="sa-label" placeholder={translate("e.g. Home, Office")} value={form.label} onChange={e => field("label", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-name"><T>Full Name</T> *</Label>
                            <Input id="sa-name" required placeholder={translate("Jane Doe")} value={form.fullName} onChange={e => field("fullName", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-email"><T>Email</T> *</Label>
                            <Input id="sa-email" type="email" required placeholder={translate("jane@example.com")} value={form.email} onChange={e => field("email", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-phone"><T>Phone</T> *</Label>
                            <Input id="sa-phone" type="tel" required placeholder={translate("+1 555 123 4567")} value={form.phone} onChange={e => field("phone", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-address"><T>Address</T> *</Label>
                            <Input id="sa-address" required placeholder={translate("123 Main St")} value={form.address} onChange={e => field("address", e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="sa-city"><T>City</T> *</Label>
                                <Input id="sa-city" required placeholder={translate("New York")} value={form.city} onChange={e => field("city", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sa-zip"><T>ZIP / Postal Code</T></Label>
                                <Input id="sa-zip" placeholder={translate("10001")} value={form.zip} onChange={e => field("zip", e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-country"><T>Country</T> *</Label>
                            <Input id="sa-country" required placeholder={translate("United States")} value={form.country} onChange={e => field("country", e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="sa-note"><T>Delivery Note</T></Label>
                            <Input id="sa-note" placeholder={translate("e.g. Ring doorbell, leave at reception…")} value={form.note} onChange={e => field("note", e.target.value)} />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.isDefault} onChange={e => field("isDefault", e.target.checked)} className="rounded" />
                            <span className="text-sm"><T>Set as default address</T></span>
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
