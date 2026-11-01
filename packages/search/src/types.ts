export interface Hash<T> {
    [id: string]: T
}

export type IOptionsMap = {
    debug: boolean
    dst: string
    engine: string
    env_key: string
    google_domain: string
    hl: string
    language: string
    ll: string
    location: string
    query: string
    searchCoord: string
    type: string
};

