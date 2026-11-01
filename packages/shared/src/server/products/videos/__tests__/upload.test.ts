
import { describe, expect, it } from 'vitest';
import { app } from '../../../index.js';
import fs from 'fs/promises';
import path from 'path';

describe('Video Upload & Probe', () => {

    const TEST_VIDEO_DIR = path.join(process.cwd(), 'tests', 'video');
    const TEST_VIDEO_NAME = 'small.mp4';
    const TEST_VIDEO_PATH = path.join(TEST_VIDEO_DIR, TEST_VIDEO_NAME);


    // Helper to wait for job completion
    const waitForJob = async (jobId: string, maxAttempts = 100) => {
        for (let i = 0; i < maxAttempts; i++) {
            const res = await app.request(`http://localhost:3333/api/videos/jobs/${jobId}`);
            if (res.status === 200) {
                const json = await res.json();
                console.log(`Waiting for job ${jobId}: ${json.status || 'unknown'}`);
                if (json.status === 'completed') return json;
                if (json.status === 'failed') throw new Error(`Job failed: ${json.error}`);
            } else {
                console.log(`Waiting for job ${jobId}: HTTP ${res.status}`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        throw new Error('Timeout waiting for job');
    };

    it('should upload video, probe it, create supabase entry, and allow download', async () => {
        // Authenticate to get real User ID
        const { supabase } = await import('../../../commons/supabase.js');
        const email = process.env.TEST_EMAIL;
        const password = process.env.TEST_PASSWORD;

        if (!email || !password) {
            console.warn('Skipping test - TEST_EMAIL or TEST_PASSWORD missing');
            return;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError || !authData.user) {
            console.error('Auth failed:', authError);
            throw new Error('Authentication failed for test user');
        }

        const userId = authData.user.id;
        console.log('Test User ID:', userId);

        let videoBuffer: Buffer;
        try {
            videoBuffer = await fs.readFile(TEST_VIDEO_PATH);
        } catch (e) {
            console.warn(`Skipping video upload test - ${TEST_VIDEO_NAME} not found in tests/video`);
            return;
        }

        const formData = new FormData();
        const blob = new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' });
        formData.append('file', blob, 'uploaded.mp4');


        const res = await app.request(`http://localhost:3333/api/videos/upload?preset=web-720p&userId=${userId}&title=TestVideo`, {
            method: 'POST',
            body: formData
        });

        if (res.status !== 200) {
            const errorText = await res.text();
            console.error('Upload failed with:', errorText);
            throw new Error(`Upload failed: ${res.status} ${errorText}`);
        }

        expect(res.status).toBe(200);


        const json = await res.json();
        expect(json).toHaveProperty('jobId');
        expect(json).toHaveProperty('dbId');
        expect(json).toHaveProperty('videoUrl');
        expect(json.meta).toHaveProperty('mux_playback_id', json.jobId);
        expect(json.meta).toHaveProperty('duration');
        expect(json.meta).toHaveProperty('max_stored_resolution');
        expect(json.meta.tracks[0]).toHaveProperty('max_width');
        expect(json).toHaveProperty('thumbnailUrl');

        console.log('Upload success:', json);


        // Verify Thumbnail Download
        console.log(`Downloading thumbnail from ${json.thumbnailUrl}...`);
        const thumbRes = await app.request(json.thumbnailUrl);
        expect(thumbRes.status).toBe(200);
        const thumbBlob = await thumbRes.blob();
        expect(thumbBlob.size).toBeGreaterThan(0);
        expect(thumbRes.headers.get('Content-Type')).toBe('image/jpeg');
        console.log('Thumbnail download success, size:', thumbBlob.size);

        // Wait for Job Completion
        console.log('Waiting for processing...');
        const jobResult = await waitForJob(json.jobId);
        expect(jobResult.status).toBe('completed');
        console.log('Job completed');

        // Verify Download (Preview URL)
        console.log(`Downloading from ${json.videoUrl}...`);
        const dlRes = await app.request(json.videoUrl);
        expect(dlRes.status).toBe(200);
        const dlBlob = await dlRes.blob();
        expect(dlBlob.size).toBeGreaterThan(0);
        expect(dlRes.headers.get('Content-Type')).toMatch(/video\//);
        console.log('Download success, size:', dlBlob.size);

        // Cleanup Supabase
        const { error } = await supabase.from('pictures').delete().eq('id', json.dbId);
        if (error) console.error('Cleanup failed:', error);
        expect(error).toBeNull();
    }, 120000);
});
