import React, { useState, useEffect } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import FilePickerWidget from './FilePickerWidget';

interface SchemaFormProps {
  schema?: any;
  uiSchema?: any;
  formData?: any;
  title?: string;
  cliOptions?: any;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

const SchemaForm: React.FC<SchemaFormProps> = ({
  schema,
  uiSchema,
  formData,
  title = 'Configuration',
  cliOptions,
  onSubmit,
  onCancel,
}) => {
  // Merge CLI options with form data, CLI options take precedence
  const initialFormData = { ...formData, ...cliOptions };
  const [currentFormData, setCurrentFormData] = useState(initialFormData);

  useEffect(() => {
    // Listen for schema data from Electron main process
    const handleSchemaData = (data: any) => {
      console.log('Received schema data:', data);
    };

    if (window.ipc) {
      window.ipc.on('schema-data', handleSchemaData);
      return () => window.ipc.clear('schema-data');
    }
  }, []);

  const handleSubmit = (data: any) => {
    const submitData = data.formData;
    console.log('Form submitted:', submitData);
    
    if (window.ipc) {
      window.ipc.send('content', submitData);
    }
    
    if (onSubmit) {
      onSubmit(submitData);
    }
  };

  const handleCancel = () => {
    if (window.ipc) {
      window.ipc.send('cancel');
    }
    
    if (onCancel) {
      onCancel();
    }
  };

  // Default schema for testing
  const defaultSchema = {
    type: 'object',
    properties: {
      src: {
        type: 'string',
        title: 'Source',
        description: 'Source file(s) to process'
      },
      dst: {
        type: 'string',
        title: 'Destination',
        description: 'Destination for processed files'
      },
      width: {
        type: 'number',
        title: 'Width',
        description: 'Target width in pixels'
      },
      height: {
        type: 'number',
        title: 'Height',
        description: 'Target height in pixels'
      }
    },
    required: ['src']
  };

  const defaultUiSchema = {
    src: {
      'ui:placeholder': 'Select source files...'
    },
    dst: {
      'ui:placeholder': 'Select destination...'
    }
  };

  const currentSchema = schema || defaultSchema;
  const currentUiSchema = uiSchema || defaultUiSchema;

  // Custom widgets for file picking
  const widgets = {
    FilePickerWidget: (props: any) => (
      <FilePickerWidget
        {...props}
        multiple={props.schema.type === 'array'}
        directory={props.id.includes('dst')}
      />
    )
  };

  // Enhanced UI schema with file picker widgets
  const enhancedUiSchema = {
    ...currentUiSchema,
    src: {
      ...currentUiSchema?.src,
      'ui:widget': 'FilePickerWidget'
    },
    dst: {
      ...currentUiSchema?.dst,
      'ui:widget': 'FilePickerWidget'
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form
            schema={currentSchema}
            uiSchema={enhancedUiSchema}
            formData={currentFormData}
            validator={validator}
            onSubmit={handleSubmit}
            onChange={({ formData }) => setCurrentFormData(formData)}
            widgets={widgets}
          >
            <div className="flex gap-2 pt-4">
              <Button type="submit">Apply</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemaForm;
