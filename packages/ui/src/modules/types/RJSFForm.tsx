import React from 'react';
import BaseForm, { FormProps } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { customWidgets, customTemplates } from './RJSFTemplates';

/**
 * A wrapper around `@rjsf/core` Form that pre-injects our standard validator,
 * widget registry, and custom templates to avoid prop drilling everywhere.
 */
export const RJSFForm = <T = any, S extends import('@rjsf/utils').StrictRJSFSchema = import('@rjsf/utils').RJSFSchema, F extends import('@rjsf/utils').FormContextType = any>(
    props: Omit<FormProps<T, S, F>, 'validator' | 'widgets' | 'templates'> & {
        validator?: import('@rjsf/utils').ValidatorType<T, S, F>;
        widgets?: import('@rjsf/utils').RegistryWidgetsType<T, S, F>;
        templates?: Partial<import('@rjsf/utils').TemplatesType<T, S, F>>;
    }
) => {
    return (
        <BaseForm
            {...props}
            validator={props.validator || validator as any}
            widgets={{ ...customWidgets, ...props.widgets } as any}
            templates={{ ...customTemplates, ...props.templates } as any}
        />
    );
};

export default RJSFForm;
