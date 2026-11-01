import React, { useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw } from 'lucide-react';
import Form from './RJSFForm';
import { generateRandomData } from './randomDataGenerator';

import { toast } from 'sonner';
import { generateSchemaForType, generateUiSchemaForType, deepMergeUiSchema } from '@/modules/types/schema-utils';
import { TypeDefinition } from './client-types';

export interface TypeRendererRef {
    triggerSave: () => Promise<void>;
    triggerPreview: () => void;
}

interface TypeRendererProps {
    editedType: TypeDefinition;
    types: TypeDefinition[];
    onSave: (jsonSchema: string, uiSchema: string) => Promise<void>;
}

export const TypeRenderer = forwardRef<TypeRendererRef, TypeRendererProps>(({
    editedType,
    types,
    onSave,
}, ref) => {
    const [jsonSchemaString, setJsonSchemaString] = useState('{}');
    const [uiSchemaString, setUiSchemaString] = useState('{}');
    const [showPreview, setShowPreview] = useState(false);
    const [previewFormData, setPreviewFormData] = useState<any>({});
    const [previewKey, setPreviewKey] = useState(0);

    // Generate JSON schema and UI schema when editedType changes
    React.useEffect(() => {
        if (!editedType) return;

        const generatedSchema = generateSchemaForType(editedType.id, types);
        setJsonSchemaString(JSON.stringify(generatedSchema, null, 2));

        const generatedUiSchema = generateUiSchemaForType(editedType.id, types);
        // Merge with component's own UI schema (metadata) using deep merge
        const finalUiSchema = deepMergeUiSchema(generatedUiSchema, editedType.meta?.uiSchema || {});

        setUiSchemaString(JSON.stringify(finalUiSchema, null, 2));

        // Reset preview when type changes
        setShowPreview(false);
    }, [editedType, types]);

    const previewSchema = useMemo(() => {
        try {
            return JSON.parse(jsonSchemaString);
        } catch (e) {
            return {};
        }
    }, [jsonSchemaString]);

    const previewUiSchema = useMemo(() => {
        try {
            return JSON.parse(uiSchemaString);
        } catch (e) {
            return {};
        }
    }, [uiSchemaString]);

    const handleSave = async () => {
        await onSave(jsonSchemaString, uiSchemaString);
    };

    useImperativeHandle(ref, () => ({
        triggerSave: handleSave,
        triggerPreview: () => {
            if (!showPreview && editedType?.json_schema) {
                const randomData = generateRandomData(previewSchema);
                setPreviewFormData(randomData);
            }
            setShowPreview(prev => !prev);
        }
    }));

    const handleRegenerateData = () => {
        if (previewSchema) {
            const randomData = generateRandomData(previewSchema);
            setPreviewFormData(randomData);
        }
    };

    return (
        <>
            <CardHeader className="border-b py-3 md:py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{editedType.name}</CardTitle>
                            <span className="text-xs uppercase tracking-wider font-mono bg-muted px-2 py-0.5 rounded border">
                                {editedType.kind}
                            </span>
                        </div>
                        <CardDescription className="text-xs mt-1 truncate max-w-md">
                            {editedType.description || "No description"}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
                <div className="grid grid-cols-2 h-full divide-x">
                    {/* Editor Column */}
                    <div className="flex flex-col h-full min-h-0 bg-muted/10">
                        <Tabs defaultValue="schema" className="flex-1 flex flex-col min-h-0">
                            <div className="px-4 py-2 border-b bg-background">
                                <TabsList className="w-full justify-start h-8 p-0 bg-transparent">
                                    <TabsTrigger value="schema" className="data-[state=active]:bg-muted data-[state=active]:shadow-none h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 bg-transparent">JSON Schema</TabsTrigger>
                                    <TabsTrigger value="uischema" className="data-[state=active]:bg-muted data-[state=active]:shadow-none h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 bg-transparent">UI Schema</TabsTrigger>
                                    <TabsTrigger value="meta" className="data-[state=active]:bg-muted data-[state=active]:shadow-none h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 bg-transparent">Meta & Settings</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="schema" className="flex-1 m-0 min-h-0 relative">
                                <Textarea
                                    value={jsonSchemaString}
                                    onChange={e => setJsonSchemaString(e.target.value)}
                                    className="absolute inset-0 w-full h-full resize-none rounded-none border-0 font-mono text-xs p-4 focus-visible:ring-0"
                                    spellCheck={false}
                                />
                            </TabsContent>
                            <TabsContent value="uischema" className="flex-1 m-0 min-h-0 relative">
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="p-2 text-xs text-muted-foreground bg-muted/30 border-b">
                                        Edit the <code>uiSchema</code> object below. This is stored in <code>meta.uiSchema</code>.
                                    </div>
                                    <Textarea
                                        value={uiSchemaString}
                                        onChange={e => setUiSchemaString(e.target.value)}
                                        className="flex-1 w-full h-full resize-none rounded-none border-0 font-mono text-xs p-4 focus-visible:ring-0"
                                        spellCheck={false}
                                    />
                                </div>
                            </TabsContent>
                            <TabsContent value="meta" className="flex-1 m-0 min-h-0 relative p-4 overflow-auto">
                                <pre className="text-xs font-mono">{JSON.stringify(editedType, null, 2)}</pre>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Preview Column */}
                    <div className="flex flex-col h-full min-h-0 bg-background/50">
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-background h-[3rem]">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {showPreview ? 'Preview with Data' : 'Preview'}
                            </span>
                            <div className="flex gap-1">
                                {showPreview && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={handleRegenerateData}
                                    >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Regenerate
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewKey(k => k + 1)}>
                                    <RefreshCw className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-md mx-auto space-y-4">
                                <Form
                                    key={previewKey}
                                    schema={previewSchema}
                                    uiSchema={previewUiSchema}
                                    formData={showPreview ? previewFormData : undefined}
                                    onChange={({ formData }) => showPreview && setPreviewFormData(formData)}
                                    onSubmit={({ formData }) => toast.success("Form submitted (check console)")}
                                    onError={(errors) => console.log('Form errors:', errors)}
                                    className="space-y-4"
                                >
                                    <Button type="submit" className="w-full mt-4">Submit Test</Button>
                                </Form>
                                {showPreview && (
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Form Data (JSON)</span>
                                        </div>
                                        <pre className="text-xs font-mono bg-muted p-3 rounded border overflow-x-auto">
                                            {JSON.stringify(previewFormData, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </>
    );
});

export default TypeRenderer;
