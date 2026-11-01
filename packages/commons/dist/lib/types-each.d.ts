export interface each {
    logLevel?: string;
    main: string;
    log?: string | undefined;
    list: string;
    /** the current working directory to use, otherwise . is being assumed */
    cwd: string;
    trace?: boolean;
    env?: string;
    profile?: string;
}
