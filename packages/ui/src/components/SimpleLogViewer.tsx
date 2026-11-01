import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from './ui/badge';

interface SimpleLogViewerProps {
  logs: any[];
  title?: string;
  className?: string;
}

const SimpleLogViewer: React.FC<SimpleLogViewerProps> = ({ logs, title = "Stream Logs", className }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logs]);

  const renderLogEntry = (log: any, index: number) => {
    let content: React.ReactNode;
    let type: string = 'UNKNOWN';

    if (typeof log === 'string') {
      content = log;
      type = 'TEXT';
    } else if (log.type === 'message' && log.data) {
      type = `MESSAGE: ${log.data.role}`;
      content = JSON.stringify(log.data.content || log.data.tool_calls, null, 2);
    } else if (log.type === 'tool_call' && log.data) {
      type = `TOOL CALL: ${log.data.function?.name}`;
      content = log.data.function?.arguments;
    } else if (log.type === 'content_chunk' && typeof log.data === 'string') {
      type = 'CONTENT';
      content = log.data;
    } else {
      type = 'RAW_OBJECT';
      content = JSON.stringify(log, null, 2);
    }

    return (
      <div key={index} className="whitespace-pre-wrap mb-2 break-words p-2 rounded bg-background">
        <Badge variant="outline" className="mb-1">{type}</Badge>
        <pre className="text-xs">{content}</pre>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollAreaRef} className="h-64 w-full rounded-md border p-4 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Waiting for stream...
            </div>
          ) : (
            logs.map(renderLogEntry)
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SimpleLogViewer;
