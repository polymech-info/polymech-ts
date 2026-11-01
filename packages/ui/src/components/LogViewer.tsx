import { useMemo, useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from './ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ListFilter, ArrowDownCircle, Trash2, Download, X } from 'lucide-react';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { useLog, LogEntry } from '@/contexts/LogContext';

interface LogViewerProps {
  onClose?: () => void;
  logs?: LogEntry[];
  clearLogs?: () => void;
  title?: string;
  sourceInfo?: React.ReactNode;
}

const LogViewer: React.FC<LogViewerProps> = ({ onClose, logs: propLogs, clearLogs: propClearLogs, title = "Activity Logs", sourceInfo }) => {
  const context = useLog();

  const logs = propLogs || context.logs;
  const clearLogs = propClearLogs || context.clearLogs;

  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const safeToString = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value === null || typeof value === 'undefined') return '';
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Unserializable object]';
    }
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (searchTerm) {
      const searchTerms = searchTerm.toLowerCase().split(' ').filter(term => term.trim() !== '');
      if (searchTerms.length > 0) {
        filtered = filtered.filter(log =>
          searchTerms.every(term =>
            (log.message && safeToString(log.message).toLowerCase().includes(term)) ||
            (log.level && log.level.toLowerCase().includes(term)) ||
            (log.category && safeToString(log.category).toLowerCase().includes(term))
          )
        );
      }
    }

    return {
      all: filtered,
      info: filtered.filter(log => log.level === 'info'),
      debug: filtered.filter(log => log.level === 'debug'),
      warning: filtered.filter(log => log.level === 'warning'),
      error: filtered.filter(log => log.level === 'error'),
      success: filtered.filter(log => log.level === 'success'),
    };
  }, [logs, searchTerm]);

  useEffect(() => {
    if (autoScrollEnabled && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [filteredLogs[activeTab as keyof typeof filteredLogs], activeTab, autoScrollEnabled]);

  const handleDownloadJson = () => {
    if (filteredLogs.all.length === 0) {
      toast.info("No logs to download based on the current filter.");
      return;
    }

    const jsonString = JSON.stringify(filteredLogs.all, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `wizard-logs-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Filtered logs have been downloaded.");
  };

  const renderLogList = (level: keyof typeof filteredLogs) => (
    <ScrollArea
      ref={activeTab === level ? scrollAreaRef : undefined}
      className="h-full w-full rounded-md border border-border bg-muted/30 p-2 md:p-3 font-mono text-[10px] sm:text-xs overflow-hidden"
    >
      {filteredLogs[level].length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
          No {level !== 'all' ? `${level} ` : ''}logs available.
        </div>
      ) : (
        <>
          {filteredLogs[level].map((log) => (
            <div key={log.id} className="whitespace-pre-wrap mb-1 break-words">
              <span className="text-muted-foreground mr-1 sm:mr-2">
                {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`mr-1 sm:mr-2 font-semibold ${getLogLevelColor(log.level)}`}>
                [{log.level.toUpperCase()}]
              </span>
              {log.category && (
                <span className="text-orange-400 mr-1 sm:mr-2">
                  [{safeToString(log.category)}]
                </span>
              )}
              <span className="break-all">{safeToString(log.message)}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-purple-400';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="border border-border rounded-lg p-2 md:p-4 bg-card flex flex-col h-full">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-2 mb-3 md:mb-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
            <ListFilter className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">{title}</span>
            <span className="sm:hidden">Logs</span>
            {sourceInfo}
          </h3>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 md:px-2 md:w-auto"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Row */}
        <Input
          placeholder="Search logs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full h-9 text-sm"
        />

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-scroll-switch"
              checked={autoScrollEnabled}
              onCheckedChange={setAutoScrollEnabled}
            />
            <Label htmlFor="auto-scroll-switch" className="text-xs font-mono flex items-center gap-1 whitespace-nowrap">
              <ArrowDownCircle className="h-3 w-3" />
              <span className="hidden sm:inline">Auto Scroll</span>
              <span className="sm:hidden">Auto</span>
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                clearLogs();
                toast.success("Logs cleared");
              }}
              disabled={logs.length === 0}
              className="h-8 w-8 p-0 md:w-auto md:px-3"
              title="Clear logs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden md:inline md:ml-1.5">Clear</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJson}
              disabled={filteredLogs.all.length === 0}
              className="h-8 w-8 p-0 md:w-auto md:px-3"
              title="Download logs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline md:ml-1.5">Download</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        className="w-full flex flex-col flex-grow min-h-0"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-2 h-auto bg-muted/50 p-0.5">
          <TabsTrigger value="all" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            All<span className="hidden sm:inline ml-0.5">({filteredLogs.all.length})</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            Info<span className="hidden sm:inline ml-0.5">({filteredLogs.info.length})</span>
          </TabsTrigger>
          <TabsTrigger value="success" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            OK<span className="hidden sm:inline ml-0.5">({filteredLogs.success.length})</span>
          </TabsTrigger>
          <TabsTrigger value="debug" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            Debug<span className="hidden sm:inline ml-0.5">({filteredLogs.debug.length})</span>
          </TabsTrigger>
          <TabsTrigger value="warning" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            Warn<span className="hidden sm:inline ml-0.5">({filteredLogs.warning.length})</span>
          </TabsTrigger>
          <TabsTrigger value="error" className="text-[11px] sm:text-xs px-1 sm:px-2 py-1.5">
            Err<span className="hidden sm:inline ml-0.5">or ({filteredLogs.error.length})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="flex-grow min-h-0"><div className="h-full">{renderLogList('all')}</div></TabsContent>
        <TabsContent value="info" className="flex-grow min-h-0"><div className="h-full">{renderLogList('info')}</div></TabsContent>
        <TabsContent value="success" className="flex-grow min-h-0"><div className="h-full">{renderLogList('success')}</div></TabsContent>
        <TabsContent value="debug" className="flex-grow min-h-0"><div className="h-full">{renderLogList('debug')}</div></TabsContent>
        <TabsContent value="warning" className="flex-grow min-h-0"><div className="h-full">{renderLogList('warning')}</div></TabsContent>
        <TabsContent value="error" className="flex-grow min-h-0"><div className="h-full">{renderLogList('error')}</div></TabsContent>
      </Tabs>
    </div>
  );
};

export default LogViewer;

