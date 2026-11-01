export * from './types.js'
export * from './googlemaps.js'
export * from './map_types.js'
export * from './email.js'
export * from './html.js'
export * from './providers.js'
export * from './geo.js'
import { generate_interfaces } from '@polymech/commons'
import { zodSchema as zodSchemaGoogleMaps, zodSchemaEach } from './googlemaps.js'

export const types = () => generate_interfaces([
    zodSchemaGoogleMaps() as any,
    zodSchemaEach() as any,
], 'src/lib/types-googlemaps.ts')