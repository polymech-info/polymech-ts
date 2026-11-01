
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../commons/logger.js';
import { randomUUID } from 'crypto';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VideoJob {
    id: string;
    status: JobStatus;
    inputSource: 'file' | 'url';
    inputPath?: string; // For file uploads
    inputUrl?: string; // For URL downloads
    preset: string;
    createdAt: number;
    updatedAt: number;
    progress: number;
    resultPath?: string;
    error?: string;
}

const JOBS_FILE = path.join(process.cwd(), 'cache', 'video-jobs.json');

export class SimpleJobQueue {
    private jobs: Map<string, VideoJob> = new Map();
    private loaded = false;
    private saveTimer: NodeJS.Timeout | null = null;

    constructor() {
        this.load();
    }

    private async load() {
        try {
            const data = await fs.readFile(JOBS_FILE, 'utf-8');
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                json.forEach(j => this.jobs.set(j.id, j));
            }
            this.loaded = true;
        } catch (e) {
            // Check if file missing
            this.loaded = true;
            logger.info('Initialized new video jobs queue');
        }
    }

    private async save() {
        if (!this.loaded) return;
        if (this.saveTimer) return;

        this.saveTimer = setTimeout(async () => {
            try {
                const jobsArray = Array.from(this.jobs.values());
                await fs.writeFile(JOBS_FILE, JSON.stringify(jobsArray, null, 2));
            } catch (e) {
                logger.error({ err: e }, 'Failed to save video jobs');
            } finally {
                this.saveTimer = null;
            }
        }, 500);
    }

    async add(jobData: Omit<VideoJob, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<VideoJob> {
        if (!this.loaded) await this.load();

        const job: VideoJob = {
            id: randomUUID(),
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            progress: 0,
            ...jobData
        };

        this.jobs.set(job.id, job);
        this.save(); // Fire and forget save
        return job;
    }

    async get(id: string): Promise<VideoJob | undefined> {
        if (!this.loaded) await this.load();
        return this.jobs.get(id);
    }

    async update(id: string, updates: Partial<VideoJob>) {
        if (!this.loaded) await this.load();
        const job = this.jobs.get(id);
        if (job) {
            Object.assign(job, updates, { updatedAt: Date.now() });
            this.jobs.set(id, job);
            this.save();
        }
    }

    async list(): Promise<VideoJob[]> {
        if (!this.loaded) await this.load();
        return Array.from(this.jobs.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
}

export const jobQueue = new SimpleJobQueue();
