# Tetris AI Strategies Analysis Report

**Date:** 2026-02-07
**Target File:** `src/apps/tetris/aiStrategies.ts`
**Context:** `neuralAI.ts`, `gameLogic.ts`, `ai_heuristics.md` (KI)

## Executive Summary

The `aiStrategies.ts` file implements a robust **Strategy Pattern** for managing AI behavior, specifically focusing on "Meta-Learning" features like Experience Replay (`HallOfFameStrategy`) and Performance Safe-Guarding (`AutoRevertStrategy`). The implementation is logically sound, type-safe, and well-integrated with the core Neural Network engine (`neuralAI.ts`).

However, two significant findings require attention:
1.  **Critical Versioning Risk**: The `AutoRevertStrategy` lacks version compatibility checks for the stored "Best Network".
2.  **Weight Scaling Divergence**: The Neural Network's weight output ranges differ significantly from the documented "Default Baseline" heuristics.

---

## Detailed Analysis

### 1. Strategy Manager Architecture
**Status: ✅ Correct**
*   **Singleton Implementation**: The `StrategyManager` correctly implements the Singleton pattern, ensuring a centralized point of control for AI behaviors across the application lifecycle.
*   **Hooks**: The lifecycle hooks (`onGameEnd`, `onTrainingStart`, `onWeightsRequested`) provide the necessary injection points to modify training data and runtime behavior without coupling the core logic to specific strategies.
*   **Persistence**: Configuration state (enabled/disabled strategies) is correctly persisted to `localStorage`.

### 2. Hall of Fame Strategy (Experience Replay)
**Status: ✅ Correct**
*   **Logic**: The strategy correctly maintains a rolling buffer of the top 10 best games.
*   **Training Injection**: The `50/50` mixing logic in `onTrainingStart` is implemented correctly:
    *   It takes the most recent 5 games from the current batch.
    *   It fills the remaining slots with random samples from the Hall of Fame.
    *   **Benefit**: This effectively mitigates "Catastrophic Forgetting" by ensuring the network constantly rehearses known successful patterns even while exploring new (potentially poor) strategies.

### 3. Auto-Revert Strategy (Safety Net)
**Status: ⚠️ Risk Identified**
*   **Logic**: The performance monitoring logic (detecting a 50% drop from peak moving average) is sound.
*   **Risk**: **Versioning Incompatibility**.
    *   **Scenario**: If the developer updates `NETWORK_CONFIG` (e.g., changing layer sizes from `[16, 12]` to `[20, 20]`) and increments `CURRENT_VERSION` in `neuralAI.ts`:
        1.  `neuralAI.ts` correctly clears the *current* network to start fresh.
        2.  However, `AutoRevertStrategy` **retains the old "Best Network" snapshot** in a separate localStorage key (`tetris-neural-network-best`).
        3.  If the new network performs poorly (which is expected during initial training), the `AutoRevertStrategy` may trigger.
        4.  It will attempt to load the **Old Version** network into the **New Version** codebase.
    *   **Consequence**: `NeuralNetwork.fromJSON()` might fail if the topology doesn't match, or worse, it might succeed but load incompatible weight matrices, causing runtime errors or undefined behavior.
    *   **Recommendation**: The `AutoRevertStrategy` snapshot should include the network version. Before reverting, verify that `snapshot.version === CURRENT_VERSION`.

### 4. Neural Network Integration & Heuristics
**Status: ℹ️ Note on Divergence**
*   **Feature Alignment**: The 10 input features in `neuralAI.ts` (`extractBoardFeatures`) perfectly match the documentation in the Knowledge Item.
*   **Weight Discrepancy**: There is a notable difference between the **Default Manual Weights** (documented in KI) and the **Neural Network Output Caps**:

| Weight | Default (Manual) | Neural Max Output | Assessment |
| :--- | :--- | :--- | :--- |
| `lineCleared` | **10,000** | **1,000** | **Drastic Reduction**. The Neural AI is forced to undervalue line clears compared to default. |
| `holesCreated` | 800 | 3,000 | **Increased Priority**. The Neural AI strictly penalizes holes. |
| `heightAdded` | 800 | 3,000 | **Increased Priority**. Stronger aversion to height growth. |

*   **Interpretation**: The Neural AI implementation prioritizes **Survival** (avoiding holes/height) significantly more than the Manual Baseline, which prioritizes **Scoring** (lines). This matches the comment in `neuralAI.ts`: *"drastically reduced to prevent suicide for lines"*. This is likely a correct design decision for a self-learning AI (which needs to survive to learn), but it means the AI's playstyle will differ fundamentally from the "Standard" heuristic.

---

## Recommendations

1.  **Fix Auto-Revert Versioning**:
    Modify `AutoRevertStrategy` to store the version alongside the network.
    ```typescript
    // In checkAndSaveBest
    const payload = {
        version: CURRENT_VERSION, // Import this
        network: network.toJSON()
    };
    localStorage.setItem(this.bestNetworkKey, JSON.stringify(payload));
    
    // In checkAndRevert
    const data = JSON.parse(stored);
    if (data.version !== CURRENT_VERSION) {
        console.warn('Cannot revert: Best snapshot is from an older version.');
        return; 
    }
    ```

2.  **Documentation Update**:
    Update `ai_heuristics.md` to explicitly mention that the Neural AI uses a "Survival-First" weight scaling profile that differs from the manual defaults.

3.  **Refine Hall of Fame**:
    Consider storing the *version* in Hall of Fame entries as well. Training on games played with a different neural architecture might be fine (since we only use Input/Output pairs), but if the *Features* (`boardFeatures`) implementation changes, the old examples becomes invalid.
