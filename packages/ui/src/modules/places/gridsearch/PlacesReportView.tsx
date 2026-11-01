import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { fetchPlacesGridSearchExport } from '../client-gridsearch';

export function PlacesReportView({ jobId }: { jobId: string }) {
    const [markdown, setMarkdown] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!jobId) return;

        let active = true;
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const text = await fetchPlacesGridSearchExport(jobId, 'md');

                if (active) {
                    setMarkdown(text);
                }
            } catch (err: any) {
                if (active) setError(err.message || 'Failed to generate report');
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => { active = false; };
    }, [jobId]);

    const handleDownload = () => {
        if (!markdown) return;
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GridSearch_Report_${jobId}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 w-full h-full">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-gray-500">Generating report...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 border border-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-medium text-sm">Failed to load report</h4>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 mx-auto w-full h-full overflow-y-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Grid Search Report</h2>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-md transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Download .md
                </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 prose-container overflow-hidden">
                {markdown ? (
                    <MarkdownRenderer content={markdown} />
                ) : (
                    <p className="text-gray-500">No report content available.</p>
                )}
            </div>
        </div>
    );
}
