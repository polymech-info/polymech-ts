import React from 'react';
import { Tooltip, Chip, Popover, Box, Typography, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import { Mail, ContentCopy, CheckCircle } from '@mui/icons-material';
import { T, translate } from '../../i18n';

export interface EmailCellProps {
    emails?: Array<{
        email: string;
        source?: string;
        foundAt?: string;
        tool?: string;
    } | string>;
    website?: string;
    isExcluded?: boolean;
}

export const EmailCell: React.FC<EmailCellProps> = ({ emails, website, isExcluded }) => {
    const [copiedEmail, setCopiedEmail] = React.useState<string | null>(null);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handleCopy = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopiedEmail(email);
        setTimeout(() => setCopiedEmail(null), 2000);
    };

    const handleClick = (event: React.MouseEvent<HTMLElement>, email: string, hasMultiple: boolean) => {
        if (hasMultiple) {
            setAnchorEl(event.currentTarget);
        } else {
            handleCopy(email);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const uniqueEmails = React.useMemo(() => {
        if (!emails) return [];

        // Normalize string arrays to object arrays and deduplicate by email address
        const seen = new Set<string>();
        const normalized = emails.map((item: any) => 
            typeof item === 'string' ? { email: item } : item
        );
        
        const unique = normalized.filter((item: any) => {
            if (!item || !item.email) return false;
            const emailLower = item.email.toLowerCase();
            if (seen.has(emailLower)) return false;
            seen.add(emailLower);
            return true;
        });

        // Sort emails: prioritize those matching the website domain
        return unique.sort((a, b) => {
            if (!website) return 0;
            try {
                const hostname = new URL(website).hostname.replace(/^www\./, '');
                const domain = hostname.split('.').slice(-2).join('.');

                const aMatch = a.email.toLowerCase().includes(domain);
                const bMatch = b.email.toLowerCase().includes(domain);

                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            } catch (e) {
                return 0;
            }
        });
    }, [emails, website]);

    // No emails found
    if (!emails || emails.length === 0) {
        // Excluded state
        if (isExcluded) {
            return (
                <div className="flex items-center justify-center h-full w-full">
                    <Tooltip title={translate("Type excluded from search")}>
                        <span className="text-gray-300 text-xs italic select-none"><T>Excluded</T></span>
                    </Tooltip>
                </div>
            )
        }

        return (
            <div className="flex items-center justify-center h-full w-full">
                <span className="text-gray-400 text-sm">-</span>
            </div>
        );
    }

    const primaryEmail = uniqueEmails[0];
    const hasMultiple = uniqueEmails.length > 1;
    const countLabel = hasMultiple ? ` (+${uniqueEmails.length - 1})` : '';

    return (
        <div className="flex items-center justify-start h-full py-1">
            <Tooltip
                title={hasMultiple ? translate("Click to see all emails") : translate("Click to copy")}
            >
                <Chip
                    icon={copiedEmail === primaryEmail.email ? <CheckCircle /> : <Mail />}
                    label={`${primaryEmail.email}${countLabel}`}
                    size="small"
                    onClick={(e) => handleClick(e, primaryEmail.email, hasMultiple)}
                    sx={{
                        cursor: 'pointer',
                        '&:hover': {
                            backgroundColor: 'primary.light',
                        },
                        maxWidth: '100%',
                    }}
                />
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 1, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                        {translate('Found')} {uniqueEmails.length} {uniqueEmails.length === 1 ? translate('email') : translate('emails')}
                    </Typography>
                    <List dense>
                        {uniqueEmails.map((emailData, index) => (
                            <ListItem key={index} disablePadding>
                                <ListItemButton
                                    onClick={() => handleCopy(emailData.email)}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {copiedEmail === emailData.email ?
                                            <CheckCircle color="success" fontSize="small" /> :
                                            <ContentCopy fontSize="small" />
                                        }
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={emailData.email}
                                        secondary={
                                            <>
                                                {emailData.source && <span style={{ display: 'block', fontSize: '0.75rem' }}><T>Source</T>: {emailData.source}</span>}
                                                {emailData.foundAt && <span style={{ display: 'block', fontSize: '0.75rem' }}><T>Found</T>: {new Date(emailData.foundAt).toLocaleDateString()}</span>}
                                            </>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Popover>
        </div>
    );
};
