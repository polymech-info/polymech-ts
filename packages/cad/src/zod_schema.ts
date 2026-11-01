import { z } from 'zod';
/*
import { generate_interfaces, write, ZodMetaMap } from '@polymech/commons/schemas'

export const ZPathInfoSchema = z.unknown();

export const ZOptionsCacheSchema = z.object({
  cache: z.boolean().optional(),
  clear: z.boolean().optional(),
});


export const ZNodeCallbackSchema = z.lazy(() =>
  z.object({
    src: z.string(),
    target: z.string(),
    options: ZOptionsBaseSchema,
  })
);

export const ZOptionsBaseSchema = z.lazy(() =>
  ZOptionsCacheSchema.extend({
    src: z.string(),
    srcInfo: ZPathInfoSchema.optional(),
    dstInfo: ZPathInfoSchema.optional(),
    dst: z.string().optional(),
    alt: z.boolean().optional(),
    debug: z.boolean().optional(),
    verbose: z.boolean().optional(),
    dry: z.boolean().optional(),
    report: z.string().optional(),
    variables: z.record(z.string()),
    script: z.string().optional(),
    args: z.string().optional(),
    onNode: z.function().args(ZNodeCallbackSchema).returns(z.promise(z.void())),
  })
);

export const ZSolidworkOptionsSchema = ZOptionsBaseSchema.extend({
  'bom-template': z.string().optional(),
  'bom-detail': z.number().optional(),
  'bom-type': z.number().optional(),
  'bom-images': z.boolean().optional(),
  'bom-config': z.string().optional(),
  close: z.boolean().optional(),
  configuration: z.string().optional(),
  height: z.number().optional(),
  hidden: z.string().optional(),
  light: z.boolean().optional(),
  logLevel: z.string().optional(),
  pack: z.boolean().optional(),
  quality: z.number().optional(),
  rebuild: z.boolean().optional(),
  renderer: z.string().optional(),
  save: z.boolean().optional(),
  sw: z.string().optional(),
  swv: z.number().optional(),
  view: z.string().optional(),
  width: z.number().optional(),
  write: z.boolean().optional(),
});

export type ZOptionsCache = z.infer<typeof ZOptionsCacheSchema>;
export type ZOptionsBase = z.infer<typeof ZOptionsBaseSchema>;
export type ZNodeCallback = z.infer<typeof ZNodeCallbackSchema>;
export type ZSolidworkOptions = z.infer<typeof ZSolidworkOptionsSchema>;


export const types = () => {
    generate_interfaces([ZSolidworkOptionsSchema], 'src/zod_types.ts')
    schemas()
  }
  
  export const schemas = () => {
    
  }
*/