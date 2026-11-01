import { Command, CommandContext } from './types';

export class HistoryManager {
    private past: Command[] = [];
    private future: Command[] = [];
    private context: CommandContext;

    constructor(context: CommandContext) {
        this.context = context;
    }

    public async execute(command: Command, context?: CommandContext): Promise<void> {
        if (context) this.context = context;
        await command.execute(this.context);
        this.past.push(command);
        this.future = []; // Clear redo stack on new action
    }

    public async undo(context?: CommandContext): Promise<void> {
        if (this.past.length === 0) return;

        if (context) this.context = context;

        const command = this.past.pop();
        if (command) {
            await command.undo(this.context);
            this.future.push(command);
        }
    }

    public async redo(context?: CommandContext): Promise<void> {
        if (this.future.length === 0) return;

        if (context) this.context = context;

        const command = this.future.pop();
        if (command) {
            await command.execute(this.context);
            this.past.push(command);
        }
    }

    public canUndo(): boolean {
        return this.past.length > 0;
    }

    public canRedo(): boolean {
        return this.future.length > 0;
    }

    public clear(): void {
        this.past = [];
        this.future = [];
    }
}
