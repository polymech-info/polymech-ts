# Tetris LLM Strategy: The "5-Game Coach"

The user has proposed a "Batch Tuning" model where an LLM analyzes gameplay every 5 games and adjusts the heuristic weights. This avoids real-time latency issues while leveraging the LLM's high-level reasoning capabilities.

---

## Architecture: "The Coach Loop"

### 1. The Cycle (5 Games)
The AI plays 5 consecutive games using the *current* weight set. During these games, we collect **performance metrics** rather than just raw moves.

**Metrics Collected per Game:**
*   **Survival Time**: How long the game lasted.
*   **Death Cause**: Did it top out? Was it a specific hole pattern?
*   **Average Height**: Was the stack too high?
*   **Holes Created**: A measure of "messiness".
*   **Tetris Rate**: Percentage of lines cleared via 4-line clears (efficiency).

### 2. The Analysis Phase (Async)
After Game #5 ends, the `LLMCoachStrategy` triggers.
It constructs a prompt for the LLM (e.g., GPT-4o or Claude 3.5 Sonnet):

> **System Prompt:** You are a Tetris Grandmaster Coach. You tune heuristic weights for a bot.
>
> **Input:**
> "Over the last 5 games, the bot averaged 45,000 points.
> It died consistently due to **high stack height (avg 14)** and **inability to clear garbage lines**.
> Current Weights: { heightPenalty: 200, holesPenalty: 500, ... }"
>
> **Task:**
> Output a JSON object with NEW weights to fix these specific flaws.
> (e.g., "Increase heightPenalty to 350 to force lower play.")

### 3. The Adjustment
The LLM returns a JSON:
```json
{
  "reasoning": "The bot is playing too dangerously high. Increasing height penalty.",
  "weights": {
    "heightAdded": 350,
    "holesCreated": 550,
    ...
  }
}
```
The game engine applies these weights immediately for the **next 5 games**.

---

## Implementation Details

### New Strategy: `LLMCoachStrategy`
Located in `src/apps/tetris/aiStrategies.ts`.

```typescript
class LLMCoachStrategy implements AIStrategy {
    id = 'llm-coach';
    buffer: GameResult[] = [];

    onGameEnd(result: GameResult) {
        this.buffer.push(result);

        if (this.buffer.length >= 5) {
            this.triggerCoachingSession();
            this.buffer = []; // Clear buffer
        }
    }

    async triggerCoachingSession() {
        const stats = this.analyzeBuffer(this.buffer);
        const newWeights = await fetchLLMAdvice(stats);
        
        // Apply weights
        setManualOverride(newWeights);
    }
}
```

### Advantages
1.  **Zero Latency Impact**: The LLM call happens *between* games (or in background), so it never lags the active gameplay.
2.  **Semantic Tuning**: The LLM understands *concepts* ("Playing too risky") rather than just gradients, potentially escaping local minima that the Neural Network might get stuck in.
3.  **Explainability**: The LLM provides a *reason* for every change, which we can display in the UI ("Coach says: 'Play safer!'").

---

## Integration Plan
1.  **Backend**: Add an Edge Function `analyze-gameplay` that wraps the OpenAI/Anthropic API.
2.  **Frontend**: Add the `LLMCoachStrategy` to `aiStrategies.ts`.
3.  **UI**: Add a "Coach's Corner" panel to show the LLM's last advice and current "Focus".
