import { CompetitorFull } from '@polymech/shared';

export interface EnrichmentContext {
    userId: string;
    logger?: any;
}

export interface IEnricher {
    name: string;
    type: 'meta' | 'email' | string;

    /**
     * Enrich a single location.
     * @param location The partial competitor data available
     * @param context Execution context
     */
    enrich(location: CompetitorFull, context: EnrichmentContext): Promise<Partial<CompetitorFull>>;
}

export class EnricherRegistry {
    private static enrichers: Map<string, IEnricher> = new Map();

    static register(name: string, enricher: IEnricher) {
        this.enrichers.set(name, enricher);
    }

    static get(name: string): IEnricher | undefined {
        return this.enrichers.get(name);
    }

    static getAll(): IEnricher[] {
        return Array.from(this.enrichers.values());
    }
}
