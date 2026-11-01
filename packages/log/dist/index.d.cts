import { ISettingsParam, Logger } from 'tslog';

declare enum ELogTargets {
    Console = 1,
    FileText = 2,
    FileJson = 4,
    Seq = 8
}
declare function createLogger(name: string, options?: ISettingsParam): Logger;

export { ELogTargets, createLogger };
