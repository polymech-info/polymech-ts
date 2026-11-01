import { Job } from 'pg-boss';

type WorkerHandler = (job: Job<any>) => Promise<any>;

interface WorkerConfig {
    queueName: string;
    handler: WorkerHandler;
    options?: any;
}

export class WorkerRegistry {
    private static workers: Map<string, WorkerConfig> = new Map();

    static register(queueName: string, handler: WorkerHandler, options?: any) {
        this.workers.set(queueName, { queueName, handler, options });
    }

    static get(queueName: string): WorkerConfig | undefined {
        return this.workers.get(queueName);
    }

    static getAll(): WorkerConfig[] {
        return Array.from(this.workers.values());
    }
}
