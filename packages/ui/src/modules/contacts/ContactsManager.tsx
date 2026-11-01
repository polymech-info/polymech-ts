import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
    DataGrid, GridColDef, GridRowId
} from '@mui/x-data-grid';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useMuiTheme } from '@/hooks/useMuiTheme';
import {
    filterModelToParams,
    sortModelToParams,
    visibilityModelToParams,
} from '@/components/grids/gridUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
    Plus, Search, Upload, Trash2, Pencil, Users, ChevronDown, FolderOpen, Code2
} from 'lucide-react';

import { ImportContactsDialog } from '@/modules/contacts/ImportContactsDialog';
import { T, translate } from '@/i18n';
import {
    Contact,
    importContacts,
    exportContacts,
} from '@/modules/contacts/client-contacts';

// New modules
import { StatusBadge, STATUSES } from './components/StatusBadge';
import { ContactForm, EMPTY_CONTACT } from './components/ContactForm';
import { ActionBar } from './components/ActionBar';
import { AdvancedFilterPopover } from './components/AdvancedFilterPopover';
import { GroupsDialog } from './components/GroupsDialog';
import { useContactsManager } from './hooks/useContactsManager';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const ContactsManager = () => {
    const muiTheme = useMuiTheme();
    const [, setSearchParams] = useSearchParams();

    const {
        q, setQ,
        filterGroup, setFilterGroup,
        filterStatus, setFilterStatus,
        advancedFilters, setAdvancedFilters,
        groups, contactGroupMap, loading, load,
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
    } = useContactsManager();

    // ── Dialog States ──
    const [editContact, setEditContact] = useState<Partial<Contact> | null>(null);
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [batchDeleteDialogOpen, setBatchDeleteOpen] = useState(false);

    // Groups dialog
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [savingGroup, setSavingGroup] = useState(false);

    // Import
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importing, setImporting] = useState(false);

    // ── Columns ──
    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'name', headerName: translate('Name'), flex: 1.5, minWidth: 180,
            renderCell: (params) => {
                const contact = params.row as Contact;
                return (
                    <div className="flex items-center gap-2 h-full min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {(contact.name || contact.first_name || contact.emails?.[0]?.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex flex-col justify-center leading-tight mt-0.5">
                            <p className="font-medium text-sm truncate">
                                {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || '—'}
                            </p>
                            {contact.organization && (
                                <p className="text-[11px] text-muted-foreground truncate">{contact.organization}</p>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            field: 'actions', headerName: translate('Actions'), width: 110, align: 'right', headerAlign: 'right', sortable: false,
            renderCell: (params) => (
                <div className="flex items-center h-full justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity w-full pr-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                                onClick={(e) => e.stopPropagation()} title={translate('View Dump')}>
                                <Code2 className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-[450px] max-h-[500px] overflow-auto p-4 z-50" onClick={e => e.stopPropagation()}>
                            <pre className="text-[10px] sm:text-xs text-muted-foreground whitespace-pre-wrap break-all font-mono">
                                {JSON.stringify(params.row, null, 2)}
                            </pre>
                        </PopoverContent>
                    </Popover>
                    <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); setEditContact(params.row); setIsNew(false); }}>
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
            field: 'email', headerName: translate('Email'), flex: 1, minWidth: 160,
            valueGetter: (_value, row) => row.emails?.[0]?.email,
            renderCell: (params) => (
                <span className="text-xs text-muted-foreground truncate">
                    {params.value || '—'}
                </span>
            )
        },
        {
            field: 'status', headerName: translate('Status'), width: 100,
            renderCell: (params) => (
                <div className="flex items-center h-full">
                    <StatusBadge status={params.row.status} />
                </div>
            )
        },
        {
            field: 'groups', headerName: translate('Groups'), flex: 1, minWidth: 150,
            valueGetter: (_value, row) => {
                return (contactGroupMap.get(row.id) || []).map(g => g.name).join(', ')
            },
            renderCell: (params) => {
                const itemGroups = contactGroupMap.get(params.row.id) || [];
                return (
                    <div className="flex items-center gap-1 flex-wrap h-full py-1">
                        {itemGroups.slice(0, 2).map((g) => (
                            <Badge key={g.id} variant="secondary" className="text-[10px] h-5 min-h-[20px] px-1.5 py-0 font-medium">
                                <span className="truncate max-w-[60px]">{g.name}</span>
                            </Badge>
                        ))}
                        {itemGroups.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] h-5 min-h-[20px] px-1.5 py-0 font-medium">+{itemGroups.length - 2}</Badge>
                        )}
                    </div>
                );
            }
        },
        {
            field: 'tags', headerName: translate('Tags'), flex: 1, minWidth: 120,
            renderCell: (params) => {
                const tags = params.row.tags || [];
                return (
                    <div className="flex items-center gap-1 flex-wrap h-full py-1">
                        {tags.slice(0, 2).map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[10px] h-5 min-h-[20px] px-1.5 py-0 font-medium">
                                <span className="truncate max-w-[60px]">{t}</span>
                            </Badge>
                        ))}
                        {tags.length > 2 && (
                            <Badge variant="outline" className="text-[10px] h-5 min-h-[20px] px-1.5 py-0 font-medium">+{tags.length - 2}</Badge>
                        )}
                    </div>
                );
            }
        },
        {
            field: 'notes', headerName: translate('Notes / Source'), flex: 1.5, minWidth: 150,
            renderCell: (params) => (
                <div className="flex items-center h-full">
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={params.row.notes || ''}>
                        {params.row.notes?.substring(0, 80) || '—'}
                    </span>
                </div>
            )
        }
    ], [contactGroupMap]);

    // ── Handlers ──
    const onSaveContact = async (data: Partial<Contact>, gids: string[]) => {
        setSaving(true);
        try {
            await handleSave(data, gids, isNew, editContact?.id);
            setEditContact(null);
        } finally { setSaving(false); }
    };

    const onBatchDelete = async () => {
        try {
            await handleBatchDelete(selectedIds.length > 0 ? selectedIds : filtered.map(c => c.id));
            setBatchDeleteOpen(false);
        } catch (e) {}
    };

    const onImportFile = async (targetGroupId?: string, body?: any, format?: 'json' | 'vcard') => {
        if (!body) return { imported: 0, skipped: 0 };
        setImporting(true);
        try {
            const result = await importContacts(body, format!, targetGroupId);
            toast.success(translate(`Imported {{count}} contacts successfully`).replace('{{count}}', String(result.imported)));
            if (targetGroupId) setFilterGroup(targetGroupId);
            load();
            return result;
        } catch (err: any) {
            toast.error(`${translate('Import failed')}: ${err.message}`);
            throw err;
        } finally {
            setImporting(false);
        }
    };

    const onExport = async (format: 'json' | 'vcard') => {
        try {
            const result = await exportContacts({
                format,
                group: filterGroup || undefined,
                ids: selectedIds.length > 0 ? selectedIds : undefined
            });
            const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            const mime = format === 'vcard' ? 'text/vcard' : 'application/json';
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `contacts.${format === 'vcard' ? 'vcf' : 'json'}`; a.click();
            URL.revokeObjectURL(url);
        } catch (e: any) { toast.error(e.message); }
    };

    const onCreateGrp = async () => {
        setSavingGroup(true);
        try {
            await handleCreateGroup(newGroupName);
            setNewGroupName('');
            setGroupDialogOpen(false);
        } finally { setSavingGroup(false); }
    };

    return (
        <div className="space-y-3">
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px] flex items-center">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                    <Input className="pl-8 h-8 text-sm" placeholder={translate('Search…')} value={q} onChange={e => setQ(e.target.value)} />
                    <AdvancedFilterPopover filters={advancedFilters} onFiltersChange={setAdvancedFilters} />
                </div>

                <Select value={filterGroup || '__all'} onValueChange={v => setFilterGroup(v === '__all' ? '' : v)}>
                    <SelectTrigger className="h-8 w-36 text-sm">
                        <FolderOpen className="h-3 w-3 mr-1 text-muted-foreground" />
                        <SelectValue placeholder={translate('All groups')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all"><T>All groups</T></SelectItem>
                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                </Select>

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
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setImportDialogOpen(true)} disabled={importing}>
                        <Upload className="h-3 w-3" /><T>{importing ? 'Importing…' : 'Import'}</T>
                    </Button>

                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setGroupDialogOpen(true)}>
                        <Users className="h-3 w-3" /><T>Groups</T>
                    </Button>
                </div>
            </div>

            <ActionBar
                count={selectedCount}
                total={filtered.length}
                groups={groups}
                onSetGroup={handleBatchSetGroup}
                onRemoveGroups={handleBatchRemoveGroups}
                onSetStatus={handleBatchSetStatus}
                onDelete={() => setBatchDeleteOpen(true)}
                onClear={() => setRowSelectionModel({ type: 'include', ids: new Set<GridRowId>() })}
                onExport={onExport}
                onNew={() => { setEditContact({ ...EMPTY_CONTACT }); setIsNew(true); }}
                busy={batchBusy}
                resetKey={batchResetKey}
            />

            <ImportContactsDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                type="file"
                onImport={onImportFile}
            />

            {/* ── Contact list ── */}
            {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground"><T>Loading…</T></div>
            ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    <T>No contacts found.</T>{' '}
                    <button className="underline" onClick={() => { setEditContact({ ...EMPTY_CONTACT }); setIsNew(true); }}>
                        <T>Add one</T>
                    </button>
                </div>
            ) : (
                <div className="h-[600px] w-full bg-background rounded-md border flex flex-col">
                    <MuiThemeProvider theme={muiTheme}>
                        <DataGrid
                            rows={filtered}
                            columns={columns}
                            checkboxSelection
                            disableRowSelectionOnClick
                            disableColumnMenu
                            rowSelectionModel={rowSelectionModel}
                            onRowSelectionModelChange={setRowSelectionModel}
                            filterModel={filterModel}
                            onFilterModelChange={(newModel) => {
                                setFilterModel(newModel);
                                updateGridParams(filterModelToParams(newModel));
                            }}
                            sortModel={sortModel}
                            onSortModelChange={(newModel) => {
                                setSortModel(newModel);
                                updateGridParams(sortModelToParams(newModel));
                            }}
                            columnVisibilityModel={columnVisibilityModel}
                            onColumnVisibilityModelChange={(newModel) => {
                                setColumnVisibilityModel(newModel);
                                updateGridParams(visibilityModelToParams(newModel));
                            }}
                            paginationModel={paginationModel}
                            onPaginationModelChange={(newModel) => {
                                setPaginationModel(newModel);
                                updateGridParams({
                                    page: newModel.page !== 0 ? String(newModel.page) : null,
                                    pageSize: newModel.pageSize !== 50 ? String(newModel.pageSize) : null
                                });
                            }}
                            pageSizeOptions={[20, 50, 100]}
                            getRowClassName={() => 'group cursor-pointer hover:bg-muted/30 transition-colors'}
                            sx={{
                                border: 0,
                                bgcolor: 'transparent',
                                color: 'hsl(var(--foreground))',
                                '& .MuiDataGrid-columnHeaders': { borderColor: 'hsl(var(--border))' },
                                '& .MuiDataGrid-cell': {
                                    borderColor: 'hsl(var(--border))',
                                    '&:focus, &:focus-within': { outline: 'none' },
                                },
                                '& .MuiDataGrid-columnHeader': {
                                    '&:focus, &:focus-within': { outline: 'none' },
                                },
                                '& .MuiDataGrid-row.Mui-selected': {
                                    backgroundColor: 'hsl(var(--primary) / 0.05)',
                                    '&:hover': { backgroundColor: 'hsl(var(--primary) / 0.1)' },
                                },
                                '& .MuiDataGrid-footerContainer': { borderColor: 'hsl(var(--border))' },
                                '& .MuiTablePagination-root': { color: 'hsl(var(--muted-foreground))' },
                            }}
                        />
                    </MuiThemeProvider>
                </div>
            )}

            {/* ── Edit / Create dialog ── */}
            <Dialog open={!!editContact} onOpenChange={o => !o && setEditContact(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle><T>{isNew ? 'New Contact' : 'Edit Contact'}</T></DialogTitle>
                    </DialogHeader>
                    {editContact && (
                        <ContactForm
                            initial={editContact}
                            onSave={onSaveContact}
                            onCancel={() => setEditContact(null)}
                            saving={saving}
                            groups={groups}
                            initialGroupIds={(contactGroupMap.get(editContact.id ?? '') || []).map(g => g.id)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Single delete confirm ── */}
            <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle><T>Delete contact?</T></AlertDialogTitle>
                        <AlertDialogDescription><T>This cannot be undone.</T></AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <T>Delete</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Batch delete confirm ── */}
            <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            <T>Delete</T> {selectedCount} <T>contacts?</T>
                        </AlertDialogTitle>
                        <AlertDialogDescription><T>This cannot be undone.</T></AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={batchBusy}><T>Cancel</T></AlertDialogCancel>
                        <AlertDialogAction onClick={onBatchDelete} disabled={batchBusy}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            <T>{batchBusy ? 'Deleting…' : 'Delete'}</T>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Groups manager dialog ── */}
            <GroupsDialog
                open={groupDialogOpen}
                onOpenChange={setGroupDialogOpen}
                groups={groups}
                newGroupName={newGroupName}
                onNewGroupNameChange={setNewGroupName}
                onCreateGroup={onCreateGrp}
                onDeleteGroup={handleDeleteGroup}
                busy={savingGroup}
            />
        </div>
    );
};
