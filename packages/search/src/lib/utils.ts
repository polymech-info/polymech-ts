import { execSync } from 'child_process'
import { logger } from '../'

export function closeAppByName(appName: string): void {
    try {
        // Get the process ID of the app by name
        const command = `tasklist /FI "IMAGENAME eq ${appName}.exe" /NH`;
        const output = execSync(command).toString();
        const lines = output.split('\n');
        const processIdLine = lines.find(line => line.includes(appName));
        if (!processIdLine) {
            return;
        }
        const processId = parseInt(processIdLine.split(/\s+/)[1], 10);

        // Terminate the app process
        execSync(`taskkill /F /PID ${processId}`);
    } catch (error) {
        logger.error(`Failed to close app '${appName}': ${error}`);
    }
}