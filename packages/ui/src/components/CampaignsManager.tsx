import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
    DataGrid, GridColDef, type GridFilterModel, type GridSortModel,
    type GridColumnVisibilityModel, type GridPaginationModel
} from '@mui/x-data-grid';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useMuiTheme } from '@/hooks/useMuiTheme';
import {
    filterModelToParams, paramsToFilterModel,
    sortModelToParams, paramsToSortModel,
    visibilityModelToParams, paramsToVisibilityModel,
} from '@/components/grids/gridUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Plus, Search, Trash2, Pencil, Check, FileText, Users, Send, ChevronDown, BarChart2
} from 'lucide-react';
import { T, translate } from '@/i18n';
import {
    Campaign,
    fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign,
} from '@/modules/campaigns/client-campaigns';
import { fetchContactGroups, ContactGroup } from '@/modules/contacts/client-contacts';
import { PagePickerDialog } from '@/modules/pages/PagePickerDialog';
import { ContactsPicker } from '@/components/ContactsPicker';
import { listMailboxes, type MailboxItem } from '@/modules/contacts/client-mailboxes';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-500/15 text-slate-600',
    scheduled: 'bg-blue-500/15 text-blue-600',
    sending: 'bg-yellow-500/15 text-yellow-600',
    sent: 'bg-green-500/15 text-green-600',
    failed: 'bg-red-500/15 text-red-600',
};

const STATUSES = ['draft', 'scheduled', 'sending', 'sent', 'failed'] as const;

const StatusBadge = ({ status }: { status?: string }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status || 'draft'] ?? STATUS_COLORS.draft}`}>
        <T>{status || 'draft'}</T>
    </span>
);

// ─── Campaign Form ────────────────────────────────────────────────────────────

const EMPTY: Partial<Campaign> = {
    name: '', page_slug: '', page_id: '', subject: '',
    group_ids: [], lang: '', tracking_id: '', vars: {}, status: 'draft',
};

const CampaignForm = ({
    initial, onSave, onCancel, saving, groups, mailboxes
}: {
    initial: Partial<Campaign>;
    onSave: (c: Partial<Campaign>) => void;
    onCancel: () => void;
    saving: boolean;
    groups: ContactGroup[];
    mailboxes: MailboxItem[];
}) => {
    const [c, setC] = useState<Partial<Campaign>>(initial);
    const [pagePicker, setPagePicker] = useState(false);

    const set = (k: keyof Campaign, v: any) => setC(prev => ({ ...prev, [k]: v }));

    const groupNames = useMemo(() => {
        const gMap = new Map(groups.map(g => [g.id, g.name]));
        return (c.group_ids || []).map(id => gMap.get(id) || id);
    }, [c.group_ids, groups]);

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
                <Label><T>Campaign name</T></Label>
                <Input value={c.name || ''} onChange={e => set('name', e.target.value)} placeholder={translate('March Newsletter')} />
            </div>

            <div className="space-y-1">
                <Label><T>Subject</T></Label>
                <Input value={c.subject || ''} onChange={e => set('subject', e.target.value)} placeholder={translate('Newsletter — March 2026')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* From Address */}
                <div className="space-y-1 col-span-2">
                    <Label><T>Send From</T></Label>
                    <Select
                        value={c.meta?.settings?.from_address || 'default'}
                        onValueChange={v => set('meta', {
                            ...(c.meta || {}),
                            settings: {
                                ...((c.meta as any)?.settings || {}),
                                from_address: v === 'default' ? null : v
                            }
                        })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={translate('System Default (config.json)')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default"><T>System Default (config.json)</T></SelectItem>
                            {mailboxes.map(mb => (
                                <SelectItem key={mb.id} value={mb.user}>
                                    {mb.user} {mb.label ? `(${mb.label})` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label><T>Language</T></Label>
                    <Input value={c.lang || ''} onChange={e => set('lang', e.target.value)} placeholder="en, de…" />
                </div>
                <div className="space-y-1">
                    <Label><T>Tracking ID</T></Label>
                    <Input value={c.tracking_id || ''} onChange={e => set('tracking_id', e.target.value)} placeholder="mail-DD-HH-mm" />
                </div>
            </div>

            {/* Page picker */}
            <div className="space-y-1">
                <Label className="flex items-center gap-1"><FileText className="h-3 w-3" /><T>Email page</T></Label>
                <div className="flex items-center gap-2">
                    <Input readOnly value={c.page_slug || ''} placeholder={translate('Select a page…')} className="flex-1 cursor-pointer" onClick={() => setPagePicker(true)} />
                    <Button type="button" size="sm" variant="outline" onClick={() => setPagePicker(true)}>
                        <FileText className="h-3 w-3" />
                    </Button>
                </div>
                <PagePickerDialog
                    isOpen={pagePicker}
                    onClose={() => setPagePicker(false)}
                    onSelect={(page) => {
                        if (page) {
                            set('page_slug', page.slug);
                            set('page_id', page.id);
                        }
                    }}
                    currentValue={c.page_id || null}
                />
            </div>

            {/* Group picker */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /><T>Target groups</T></Label>
                <ContactsPicker
                    value={c.group_ids || []}
                    onChange={(ids) => set('group_ids', ids)}
                />
                {groupNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {groupNames.map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{name}</Badge>
                        ))}
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}><T>Cancel</T></Button>
                <Button onClick={() => onSave(c)} disabled={saving || !c.name?.trim()}>
                    <Check className="h-3 w-3 mr-1" /><T>{saving ? 'Saving…' : 'Save'}</T>
                </Button>
            </DialogFooter>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const CampaignsManager = () => {
    const muiTheme = useMuiTheme();
    const [searchParams, setSearchParams] = useSearchParams();

    const q = searchParams.get('q') || '';
    const filterStatus = searchParams.get('status') || '';

    const setFilter = useCallback((key: string, value: string) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const setQ = useCallback((v: string) => setFilter('q', v), [setFilter]);
    const setFilterStatus = useCallback((v: string) => setFilter('status', v), [setFilter]);

    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Grid state from URL
    const [filterModel, setFilterModel] = useState<GridFilterModel>(() => paramsToFilterModel(searchParams));
    const [sortModel, setSortModel] = useState<GridSortModel>(() => paramsToSortModel(searchParams));
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => paramsToVisibilityModel(searchParams));
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(() => ({
        page: parseInt(searchParams.get('page') || '0', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
    }));

    // Dialogs
    const [editCampaign, setEditCampaign] = useState<Partial<Campaign> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [sendId, setSendId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendInterval, setSendInterval] = useState(1);

    const load = async () => {
        setLoading(true);
        try {
            const [c, g, mbs] = await Promise.all([
                fetchCampaigns({ q: q || undefined, status: filterStatus || undefined }),
                fetchContactGroups(),
                listMailboxes(),
            ]);
            setCampaigns(c);
            setGroups(g);
            setMailboxes(mbs);
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [q, filterStatus]);

    // Group name lookup
    const groupById = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);

    // ── Columns ──
    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'name', headerName: translate('Name'), flex: 1, minWidth: 200,
            renderCell: (params: any) => (
                <div className="flex items-center gap-2 h-full min-w-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-white font-semibold text-xs shrink-0">
                        <Send className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex flex-col justify-center leading-tight mt-0.5">
                        <p className="font-medium text-sm truncate">{params.row.name || '—'}</p>
                        {params.row.subject && (
                            <p className="text-[11px] text-muted-foreground truncate">{params.row.subject}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            field: 'actions', headerName: translate('Actions'), width: 130, align: 'right', headerAlign: 'right', sortable: false,
            renderCell: (params: any) => (
                <div className="flex items-center h-full justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-full pr-2">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); setSendId(params.row.id); }}>
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Open analytics pre-filtered by the tracking query
                            const url = `/admin/analytics?filter_search_contains=tracking%3D${params.row.tracking_id}`;
                            window.open(url, '_blank');
                        }}>
                        <BarChart2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); setEditCampaign(params.row); setIsNew(false); }}>
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(params.row.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )
        },
        {
            field: 'page_slug', headerName: translate('Page'), width: 160,
            renderCell: (params: any) => (
                <span className="text-xs text-muted-foreground truncate">
                    {params.value ? `/${params.value}` : '—'}
                </span>
            )
        },
        {
            field: 'status', headerName: translate('Status'), width: 120,
            renderCell: (params: any) => (
                <div className="flex items-center h-full">
                    <StatusBadge status={params.row.status} />
                </div>
            )
        },
        {
            field: 'group_ids', headerName: translate('Groups'), width: 180,
            renderCell: (params: any) => {
                const ids: string[] = params.row.group_ids || [];
                return (
                    <div className="flex items-center gap-1 flex-wrap h-full py-1">
                        {ids.slice(0, 2).map(id => {
                            const g = groupById.get(id);
                            return <Badge key={id} variant="secondary" className="text-[10px] px-1.5 py-0 max-w-[66px] truncate">{g?.name || id.slice(0, 6)}</Badge>;
                        })}
                        {ids.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{ids.length - 2}</Badge>
                        )}
                    </div>
                );
            }
        },
        {
            field: 'stats', headerName: translate('Stats'), width: 140,
            renderCell: (params: any) => {
                const s = params.row.stats || {};
                if (!s.total) return <span className="text-xs text-muted-foreground">—</span>;
                return (
                    <div className="flex items-center gap-1.5 h-full text-xs tabular-nums">
                        <span className="text-green-600">{s.sent ?? 0}✓</span>
                        {(s.failed ?? 0) > 0 && <span className="text-red-500">{s.failed}✕</span>}
                        {(s.skipped ?? 0) > 0 && <span className="text-muted-foreground">{s.skipped}⊘</span>}
                        <span className="text-muted-foreground">/ {s.total}</span>
                    </div>
                );
            }
        },
        {
            field: 'created_at', headerName: translate('Created'), width: 140,
            renderCell: (params: any) => (
                <span className="text-xs text-muted-foreground">
                    {params.value ? new Date(params.value).toLocaleDateString() : '—'}
                </span>
            )
        },
    ], [groupById]);

    // ── CRUD ──────────────────────────────────────────────────────────────────

    const handleSave = async (data: Partial<Campaign>) => {
        setSaving(true);
        try {
            if (isNew) {
                const created = await createCampaign(data);
                setCampaigns(prev => [created, ...prev]);
                toast.success(translate('Campaign created'));
            } else if (editCampaign?.id) {
                const updated = await updateCampaign(editCampaign.id, data);
                setCampaigns(prev => prev.map(x => x.id === updated.id ? updated : x));
                toast.success(translate('Campaign saved'));
            }
            setEditCampaign(null);
        } catch (e: any) { toast.error(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteCampaign(deleteId);
            setCampaigns(prev => prev.filter(c => c.id !== deleteId));
            toast.success(translate('Campaign deleted'));
        } catch (e: any) { toast.error(e.message); }
        finally { setDeleteId(null); }
    };

    const handleSend = async () => {
        if (!sendId) return;
        setSending(true);
        try {
            const stats = await sendCampaign(sendId, sendInterval);
            toast.success(translate(`Sent: ${stats.sent}/${stats.total}${stats.failed ? `, ${stats.failed} failed` : ''}`));
            await load(); // Refresh to show updated status + stats
        } catch (e: any) { toast.error(e.message); }
        finally { setSending(false); setSendId(null); }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-3">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="pl-8 h-8 text-sm" placeholder={translate('Search…')} value={q} onChange={e => setQ(e.target.value)} />
                </div>

                <Select value={filterStatus || '__all'} onValueChange={v => setFilterStatus(v === '__all' ? '' : v)}>
                    <SelectTrigger className="h-8 w-36 text-sm">
                        <ChevronDown className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue placeholder={translate('All statuses')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all"><T>All statuses</T></SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{translate(s)}</SelectItem>)}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-1 ml-auto">
                    <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setEditCampaign({ ...EMPTY }); setIsNew(true); }}>
                        <Plus className="h-3 w-3" /><T>New Campaign</T>
                    </Button>
                </div>
            </div>

            {/* ── DataGrid ── */}
            {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground"><T>Loading…</T></div>
            ) : campaigns.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    <T>No campaigns found.</T>{' '}
                    <button className="underline" onClick={() => { setEditCampaign({ ...EMPTY }); setIsNew(true); }}>
                        <T>Create one</T>
                    </button>
                </div>
            ) : (
                <div className="h-[600px] w-full bg-background rounded-md border">
                    <MuiThemeProvider theme={muiTheme}>
                        <DataGrid
                            rows={campaigns}
                            columns={columns}
                            getRowId={(row) => row.id}
                            showToolbar
                            disableRowSelectionOnClick
                            filterModel={filterModel}
                            onFilterModelChange={(newFilterModel) => {
                                setFilterModel(newFilterModel);
                                setSearchParams(prev => {
                                    const p = new URLSearchParams(prev);
                                    Array.from(p.keys()).forEach(k => { if (k.startsWith('filter_')) p.delete(k); });
                                    Object.entries(filterModelToParams(newFilterModel)).forEach(([k, v]) => p.set(k, v));
                                    return p;
                                }, { replace: true });
                            }}
                            sortModel={sortModel}
                            onSortModelChange={(newSortModel) => {
                                setSortModel(newSortModel);
                                setSearchParams(prev => {
                                    const p = new URLSearchParams(prev);
                                    p.delete('sort');
                                    const sp = sortModelToParams(newSortModel);
                                    if (sp.sort) p.set('sort', sp.sort);
                                    return p;
                                }, { replace: true });
                            }}
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={(newModel) => {
                                setColumnVisibilityModel(newModel);
                                setSearchParams(prev => {
                                    const p = new URLSearchParams(prev);
                                    p.delete('hidden');
                                    const vp = visibilityModelToParams(newModel);
                                    if (vp.hidden !== undefined) p.set('hidden', vp.hidden);
                                    return p;
                                }, { replace: true });
                            }}
                            paginationModel={paginationModel}
                            onPaginationModelChange={(newPaginationModel) => {
                                setPaginationModel(newPaginationModel);
                                setSearchParams(prev => {
                                    const p = new URLSearchParams(prev);
                                    if (newPaginationModel.page !== 0) p.set('page', String(newPaginationModel.page));
                                    else p.delete('page');
                                    if (newPaginationModel.pageSize !== 25) p.set('pageSize', String(newPaginationModel.pageSize));
                                    else p.delete('pageSize');
                                    return p;
                                }, { replace: true });
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            getRowClassName={() => 'group cursor-pointer hover:bg-muted/30 transition-colors'}
                            sx={{
                                border: 0,
                                bgcolor: 'transparent',
                                color: 'hsl(var(--foreground))',
                                '& .MuiDataGrid-columnHeaders': {
                                    borderColor: 'hsl(var(--border))',
                                },
                                '& .MuiDataGrid-cell': {
                                    borderColor: 'hsl(var(--border))',
                                    '&:focus, &:focus-within': { outline: 'none' },
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    '&:focus, &:focus-within': { outline: 'none' },
                                },
                                '& .MuiDataGrid-footerContainer': {
                                    borderColor: 'hsl(var(--border))',
                                },
                                '& .MuiTablePagination-root': {
                                    color: 'hsl(var(--muted-foreground))',
                                },
                                '& .MuiDataGrid-overlay': {
                                    bgcolor: 'transparent',
                                },
                                '& .MuiCheckbox-root': {
                                    color: 'hsl(var(--muted-foreground))',
                                    '&.Mui-checked': {
                                        color: 'hsl(var(--primary))',
                                    },
                                },
                                '& .MuiDataGrid-columnSeparator': {
                                    color: 'hsl(var(--border))',
                                },
                                '& .MuiDataGrid-menuIcon button, & .MuiDataGrid-iconButtonContainer button': {
                                    color: 'hsl(var(--muted-foreground))',
                                },
                            }}
                        />
                    </MuiThemeProvider>
                </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
                {campaigns.length} {translate(campaigns.length !== 1 ? 'campaigns' : 'campaign')}
            </p>

            {/* ── Edit / Create dialog ── */}
            <Dialog open={!!editCampaign} onOpenChange={o => !o && setEditCampaign(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle><T>{isNew ? 'New Campaign' : 'Edit Campaign'}</T></DialogTitle>
                    </DialogHeader>
                    {editCampaign && (
                        <CampaignForm
                            initial={editCampaign}
                            onSave={handleSave}
                            onCancel={() => setEditCampaign(null)}
                            saving={saving}
                            groups={groups}
                            mailboxes={mailboxes}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Delete confirm ── */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Delete campaign?</T></AlertDialogTitle>
                        <AlertDialogDescription><T>This cannot be undone.</T></AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <T>Delete</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Send confirm ── */}
            <AlertDialog open={!!sendId} onOpenChange={o => !o && !sending && setSendId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Send campaign?</T></AlertDialogTitle>
                        <AlertDialogDescription><T>This will send the email to all contacts in the target groups. This cannot be undone.</T></AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-3">
                        <Label className="text-sm"><T>Interval between sends (seconds)</T></Label>
                        <Input
                            type="number" min={0} step={0.5}
                            value={sendInterval}
                            onChange={e => setSendInterval(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="mt-1 w-32 h-8 text-sm"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={sending}><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction onClick={handleSend} disabled={sending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Send className="h-3 w-3 mr-1" /><T>{sending ? 'Sending…' : 'Send'}</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
