import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
    GridRowSelectionModel, GridRowId,
    type GridFilterModel, type GridSortModel, type GridColumnVisibilityModel, type GridPaginationModel
} from '@mui/x-data-grid';
import {
    paramsToFilterModel,
    paramsToSortModel,
    paramsToVisibilityModel,
} from '@/components/grids/gridUtils';
import {
    Contact, ContactGroup,
    fetchContacts, createContact, updateContact, deleteContact, batchDeleteContacts,
    fetchContactGroups, createContactGroup, deleteContactGroup,
    addGroupMembers, fetchGroupMembers, removeGroupMember,
} from '@/modules/contacts/client-contacts';
import { translate } from '@/i18n';
import { AdvancedFilter } from '../components/AdvancedFilterPopover';

export const useContactsManager = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // ─── Filters from URL ─────────────────────────────────────────────────────
    const q = searchParams.get('q') || '';
    const filterGroup = searchParams.get('group') || '';
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
    const setFilterGroup = useCallback((v: string) => setFilter('group', v), [setFilter]);
    const setFilterStatus = useCallback((v: string) => setFilter('status', v), [setFilter]);

    // Advanced filters
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([]);

    // ─── Data State ───────────────────────────────────────────────────────────
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<ContactGroup[]>([]);
    const [contactGroupMap, setContactGroupMap] = useState<Map<string, ContactGroup[]>>(new Map());
    const [loading, setLoading] = useState(true);

    // ─── Grid State ───────────────────────────────────────────────────────────
    const [filterModel, setFilterModel] = useState<GridFilterModel>(() => paramsToFilterModel(searchParams));
    const [sortModel, setSortModel] = useState<GridSortModel>(() => paramsToSortModel(searchParams));
    const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>(() => paramsToVisibilityModel(searchParams));
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(() => ({
        page: parseInt(searchParams.get('page') || '0', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '50', 10),
    }));

    // ─── Selection ────────────────────────────────────────────────────────────
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set<GridRowId>() });
    const [batchBusy, setBatchBusy] = useState(false);
    const [batchResetKey, setBatchResetKey] = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [c, g, members] = await Promise.all([
                fetchContacts({ q: q || undefined, group: filterGroup || undefined, status: filterStatus || undefined, limit: 10000 }),
                fetchContactGroups(),
                fetchGroupMembers(),
            ]);
            const gMap = new Map<string, ContactGroup[]>();
            const groupById = new Map(g.map(grp => [grp.id, grp]));
            for (const m of members) {
                const grp = groupById.get(m.group_id);
                if (!grp) continue;
                const list = gMap.get(m.contact_id) || [];
                list.push(grp);
                gMap.set(m.contact_id, list);
            }
            setContactGroupMap(gMap);
            setGroups(g);

            const enrichedContacts = c.map(contact => ({
                ...contact,
                groups: gMap.get(contact.id) || []
            }));
            setContacts(enrichedContacts);
            setRowSelectionModel({ type: 'include', ids: new Set<GridRowId>() });
        } catch (e: any) { toast.error(e.message); }
        finally { setLoading(false); }
    }, [q, filterGroup, filterStatus]);

    useEffect(() => { load(); }, [load]);

    // ─── Filtering Logic ──────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        return contacts.filter(c => {
            let match = true;
            if (q) {
                const needle = q.toLowerCase();
                match = !!(
                    c.name?.toLowerCase().includes(needle) ||
                    c.organization?.toLowerCase().includes(needle) ||
                    c.notes?.toLowerCase().includes(needle) ||
                    c.phone?.toLowerCase().includes(needle) ||
                    c.status?.toLowerCase().includes(needle) ||
                    c.source?.toLowerCase().includes(needle) ||
                    c.emails?.some(e => e.email.toLowerCase().includes(needle)) ||
                    c.tags?.some(t => t.toLowerCase().includes(needle)) ||
                    c.address?.some(a =>
                        a.city?.toLowerCase().includes(needle) ||
                        a.country?.toLowerCase().includes(needle) ||
                        a.street?.toLowerCase().includes(needle)
                    ) ||
                    (c.meta && Object.values(c.meta).some(val =>
                        typeof val === 'string' && val.toLowerCase().includes(needle)
                    ))
                );
            }
            if (!match) return false;

            if (advancedFilters.length > 0) {
                for (const f of advancedFilters) {
                    const op = f.op || 'contains';
                    const v = (f.value || '').toLowerCase();
                    if (!v && !['is empty', 'is not empty'].includes(op)) continue;

                    let fieldVal = '';
                    if (f.field === 'name') fieldVal = c.name || '';
                    else if (f.field === 'organization') fieldVal = c.organization || '';
                    else if (f.field === 'phone') fieldVal = c.phone || '';
                    else if (f.field === 'email') fieldVal = c.emails?.map(e => e.email).join(', ') || '';
                    else if (f.field === 'tags') fieldVal = c.tags?.join(', ') || '';
                    else if (f.field === 'website') fieldVal = (c.meta as any)?.websites?.map((w: any) => w.url).join(', ') || '';
                    else if (f.field === 'status') fieldVal = c.status || '';
                    else if (f.field === 'group') fieldVal = (contactGroupMap.get(c.id) || []).map(g => g.name).join(', ');
                    else if (f.field === 'city' || f.field === 'country') {
                        fieldVal = c.address?.map(a => (a as any)[f.field]).filter(Boolean).join(', ') || '';
                    }
                    else if (f.field === 'meta_all') {
                        fieldVal = c.meta ? Object.values(c.meta).map(v => typeof v === 'object' ? '' : String(v)).join(', ') : '';
                    }
                    else if (f.field === 'meta_key') {
                        const mk = f.metaKey?.trim();
                        if (mk && c.meta) {
                            const val = c.meta[mk] ?? c.meta[mk.toLowerCase()] ?? c.meta[mk.charAt(0).toUpperCase() + mk.slice(1)];
                            fieldVal = val != null && typeof val !== 'object' ? String(val) : '';
                        }
                    }

                    fieldVal = fieldVal.toLowerCase();
                    let ruleMatch = false;
                    switch (op) {
                        case 'contains': ruleMatch = fieldVal.includes(v); break;
                        case 'does not contain': ruleMatch = !fieldVal.includes(v); break;
                        case 'equals': ruleMatch = fieldVal === v; break;
                        case 'does not equal': ruleMatch = fieldVal !== v; break;
                        case 'starts with': ruleMatch = fieldVal.startsWith(v); break;
                        case 'ends with': ruleMatch = fieldVal.endsWith(v); break;
                        case 'is empty': ruleMatch = !fieldVal; break;
                        case 'is not empty': ruleMatch = !!fieldVal; break;
                        case 'is any of':
                            const parts = v.split(',').map(p => p.trim()).filter(Boolean);
                            ruleMatch = parts.some(p => fieldVal.includes(p));
                            break;
                        default: ruleMatch = fieldVal.includes(v);
                    }
                    if (!ruleMatch) { match = false; break; }
                }
            }
            return match;
        });
    }, [contacts, q, advancedFilters, contactGroupMap]);

    const isExclude = rowSelectionModel.type === 'exclude';
    const selectedCount = isExclude
        ? filtered.length - rowSelectionModel.ids.size
        : rowSelectionModel.ids.size;

    const selectedIds = useMemo(() => isExclude
        ? filtered.filter(c => !rowSelectionModel.ids.has(c.id)).map(c => c.id)
        : ([...rowSelectionModel.ids] as string[]),
        [isExclude, filtered, rowSelectionModel.ids]);

    // ─── CRUD Handlers ────────────────────────────────────────────────────────
    const handleSave = async (data: Partial<Contact>, newGroupIds: string[], isNew: boolean, editId?: string) => {
        try {
            let savedId: string | undefined;
            if (isNew) {
                const created = await createContact(data);
                setContacts(prev => [created, ...prev]);
                savedId = created.id;
                toast.success(translate('Contact created'));
            } else if (editId) {
                const updated = await updateContact(editId, data);
                setContacts(prev => prev.map(x => x.id === updated.id ? updated : x));
                savedId = updated.id;
                toast.success(translate('Contact saved'));
            }
            if (savedId) {
                const oldGroupIds = new Set((contactGroupMap.get(savedId) || []).map(g => g.id));
                const newSet = new Set(newGroupIds);
                const toAdd = newGroupIds.filter(id => !oldGroupIds.has(id));
                const toRemove = [...oldGroupIds].filter(id => !newSet.has(id));
                await Promise.all([
                    ...toAdd.map(gid => addGroupMembers(gid, [savedId!])),
                    ...toRemove.map(gid => removeGroupMember(gid, savedId!)),
                ]);
                if (toAdd.length || toRemove.length) load();
            }
        } catch (e: any) { toast.error(e.message); throw e; }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteContact(id);
            setContacts(prev => prev.filter(c => c.id !== id));
            setRowSelectionModel((prev) => { const ids = new Set(prev.ids); ids.delete(id); return { ...prev, ids }; });
            toast.success(translate('Contact deleted'));
        } catch (e: any) { toast.error(e.message); }
    };

    // ─── Batch Actions ──────────────────────────────────────────────────────────
    const getTargetIds = useCallback(() => selectedIds.length > 0 ? selectedIds : filtered.map(c => c.id), [selectedIds, filtered]);

    const handleBatchSetGroup = async (groupId: string) => {
        const ids = getTargetIds();
        if (!ids.length) return;
        setBatchBusy(true);
        try {
            await addGroupMembers(groupId, ids);
            const g = groups.find(x => x.id === groupId);
            toast.success(`${ids.length} ${translate('contacts added to')} "${g?.name ?? groupId}"`);
            load();
        } catch (e: any) { toast.error(e.message); }
        finally { setBatchBusy(false); setBatchResetKey(k => k + 1); }
    };

    const handleBatchRemoveGroups = async () => {
        const ids = getTargetIds();
        if (!ids.length) return;
        setBatchBusy(true);
        try {
            const removals: Promise<any>[] = [];
            for (const cid of ids) {
                const cGroups = contactGroupMap.get(cid) || [];
                for (const g of cGroups) {
                    removals.push(removeGroupMember(g.id, cid));
                }
            }
            await Promise.all(removals);
            toast.success(`${ids.length} ${translate('contacts removed from all groups')}`);
            load();
        } catch (e: any) { toast.error(e.message); }
        finally { setBatchBusy(false); setBatchResetKey(k => k + 1); }
    };

    const handleBatchSetStatus = async (status: string) => {
        const ids = getTargetIds();
        if (!ids.length) return;
        setBatchBusy(true);
        try {
            await Promise.all(ids.map(id => updateContact(id, { status: status as any })));
            const idsSet = new Set(ids);
            setContacts(prev => prev.map(c => idsSet.has(c.id) ? { ...c, status: status as any } : c));
            toast.success(`${ids.length} ${translate('contacts updated')}`);
        } catch (e: any) { toast.error(e.message); }
        finally { setBatchBusy(false); setBatchResetKey(k => k + 1); }
    };

    const handleBatchDelete = async (ids: string[]) => {
        setBatchBusy(true);
        try {
            await batchDeleteContacts(ids);
            const idsSet = new Set(ids);
            setContacts(prev => prev.filter(c => !idsSet.has(c.id)));
            setRowSelectionModel({ type: 'include', ids: new Set<GridRowId>() });
            toast.success(`${ids.length} ${translate('contacts deleted')}`);
        } catch (e: any) { toast.error(e.message); throw e; }
        finally { setBatchBusy(false); }
    };

    // ─── Groups ───────────────────────────────────────────────────────────────
    const handleCreateGroup = async (name: string) => {
        try {
            const g = await createContactGroup({ name: name.trim() });
            setGroups(prev => [...prev, g]);
            toast.success(translate('Group created'));
            return g;
        } catch (e: any) { toast.error(e.message); throw e; }
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            await deleteContactGroup(id);
            setGroups(prev => prev.filter(g => g.id !== id));
            if (filterGroup === id) setFilterGroup('');
            toast.success(translate('Group deleted'));
        } catch (e: any) { toast.error(e.message); }
    };

    // ─── Sync search params ───────────────────────────────────────────────────
    const updateGridParams = useCallback((patch: Record<string, string | null>) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            Object.entries(patch).forEach(([k, v]) => {
                if (v === null) next.delete(k);
                else next.set(k, v);
            });
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    return {
        q, setQ,
        filterGroup, setFilterGroup,
        filterStatus, setFilterStatus,
        advancedFilters, setAdvancedFilters,
        contacts, groups, contactGroupMap, loading, load,
        filtered,
        selectedCount, selectedIds, rowSelectionModel, setRowSelectionModel,
        batchBusy, batchResetKey,
        filterModel, setFilterModel,
        sortModel, setSortModel,
        columnVisibilityModel, setColumnVisibilityModel,
        paginationModel, setPaginationModel,
        handleSave, handleDelete,
        handleBatchSetGroup, handleBatchRemoveGroups, handleBatchSetStatus, handleBatchDelete,
        handleCreateGroup, handleDeleteGroup,
        updateGridParams
    };
};
