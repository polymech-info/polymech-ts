# Tetris Neural Network Learning System

## Overview

This document explains how the Tetris AI uses a **feedforward neural network** to learn optimal play strategies through **self-play and weight adaptation**. Despite having 9 different weights to balance, the system successfully improves over time through a combination of neural network learning and adaptive weight scaling.

---

## Architecture

### Neural Network Structure

```
Input Layer (9 neurons)
    ↓
Hidden Layer 1 (15 neurons)
    ↓
Hidden Layer 2 (10 neurons)
    ↓
Output Layer (9 neurons)
```

**Total Parameters:** ~300 trainable weights and biases

### Input Features (9)

The network receives normalized board state features (0-1 range):

1. **Lines Cleared** - Number of lines cleared this move (0-4)
2. **Contacts** - How many sides touch existing blocks (0-10)
3. **Holes Created** - New holes created by this move (0-5)
4. **Overhangs Created** - New overhangs created (0-5)
5. **Overhangs Filled** - Overhangs fixed by this move (0-5)
6. **Height Added** - Rows added to the stack (0-10)
7. **Well Depth** - Depth of vertical gaps (0-10)
8. **Bumpiness** - Surface unevenness (0-20)
9. **Average Height** - Mean column height (0-10)

### Output Weights (9)

The network outputs optimal weight values for the heuristic evaluation function:

1. **lineCleared** (0-20,000) - Bonus for clearing lines
2. **contact** (0-500) - Bonus for piece connectivity
3. **holesCreated** (0-2,000) - Penalty for creating holes
4. **overhangsCreated** (0-3,000) - Penalty for creating overhangs
5. **overhangsFilled** (0-1,000) - Bonus for filling overhangs
6. **heightAdded** (0-2,000) - Penalty for increasing height
7. **wellDepthSquared** (0-500) - Penalty for deep wells
8. **bumpiness** (0-200) - Penalty for uneven surface
9. **avgHeight** (0-100) - Penalty for overall height

---

## How Learning Works

### 1. **Self-Play Loop**

```
Game Start
    ↓
Neural Network predicts optimal weights
    ↓
AI plays using those weights
    ↓
Game ends with score/lines/level
    ↓
Network learns from performance
    ↓
Repeat
```

### 2. **Weight Prediction Process**

For each game:

1. **Extract board features** from current state
2. **Feed through neural network** (forward propagation)
3. **Get weight predictions** (9 output values)
4. **Scale to appropriate ranges** (e.g., lineCleared: 0-20k)
5. **Use weights for move evaluation** (brute-force search)

### 3. **Learning from Results**

After each game:

```typescript
// Calculate reward based on performance
reward = scoreReward * 0.6 + linesReward * 0.3 + levelReward * 0.1

// Train network with backpropagation
network.train({
    input: boardFeatures,
    expectedOutput: weightsUsed,
    reward: reward
});
```

**Key Insight:** The network learns which weight combinations lead to better scores, not just individual weight values.

---

## Why Multiple Weights Improve Learning

### Problem: Single-Objective Optimization

If we only had one weight (e.g., "maximize score"), the AI would:
- ❌ Get stuck in local optima
- ❌ Fail to learn nuanced strategies
- ❌ Struggle with different game phases

### Solution: Multi-Objective Optimization

With 9 weights, the AI can:
- ✅ **Balance competing goals** (score vs survival)
- ✅ **Adapt to game state** (early vs late game)
- ✅ **Learn complex strategies** (setup moves, defensive play)
- ✅ **Explore solution space** more effectively

### Example: Height Management

Instead of just "avoid height," the AI learns:
- `heightAdded` - Immediate penalty for this move
- `avgHeight` - Overall board state penalty
- `holesCreated` - Future consequences of height
- `bumpiness` - Surface quality at that height

This creates a **rich feedback signal** that guides learning toward sophisticated play.

---

## Adaptive Weight Scaling

### Height-Based Adaptation

The system uses **dynamic weight adjustment** based on board state:

```typescript
function getAdaptiveWeights(baseWeights: AIWeights, avgHeight: number): AIWeights {
    const heightRatio = Math.min(avgHeight / 15, 1.0);
    const crisisMode = heightRatio > 0.6;
    const crisisMultiplier = crisisMode ? 1.5 : 1.0;
    
    return {
        // Bonuses decrease in crisis
        lineCleared: baseWeights.lineCleared * (1 - heightRatio * 0.3),
        contact: baseWeights.contact * (1 - heightRatio * 0.7),
        
        // Critical penalties increase dramatically
        holesCreated: baseWeights.holesCreated * (1 + heightRatio * 2.0 * crisisMultiplier),
        heightAdded: baseWeights.heightAdded * (1 + heightRatio * 3.0 * crisisMultiplier),
        avgHeight: baseWeights.avgHeight * (1 + heightRatio * 2.5 * crisisMultiplier),
        
        // ... other weights
    };
}
```

### Game Phases

| Phase | Height | Strategy | Weight Adjustments |
|-------|--------|----------|-------------------|
| **Early** | 0-6 | Aggressive scoring | +Score bonuses, -Penalties |
| **Mid** | 6-9 | Balanced play | Standard weights |
| **Late** | 9-12 | Defensive | +Height penalties |
| **Crisis** | 12+ | Survival mode | ++Height penalties, --Bonuses |

This allows the **same neural network** to play optimally across all game phases.

---

## Training Process

### 1. **Initialization**

```typescript
// Start with reasonable defaults
const DEFAULT_WEIGHTS = {
    lineCleared: 10000,
    contact: 100,
    holesCreated: 800,
    // ... etc
};
```

### 2. **Exploration**

Early games use neural network predictions to explore different weight combinations:
- Some games prioritize line clearing
- Some focus on height management
- Some balance multiple objectives

### 3. **Exploitation**

As training progresses:
- Network learns which combinations work best
- Predictions converge toward optimal weights
- Performance becomes more consistent

### 4. **Continuous Improvement**

The network keeps learning because:
- **Stochastic piece sequence** (TGM3 randomizer)
- **Different board states** require different strategies
- **Reward function** encourages both score and survival

---

## Why This Works

### 1. **Dimensionality Reduction**

9 weights might seem like a lot, but the neural network:
- Learns **correlations** between weights
- Discovers **weight combinations** that work together
- Reduces effective search space through hidden layers

### 2. **Hierarchical Learning**

The two hidden layers create a hierarchy:
- **Layer 1** learns basic patterns (e.g., "holes are bad")
- **Layer 2** learns combinations (e.g., "holes + height = very bad")
- **Output** produces coherent weight sets

### 3. **Reward Shaping**

The reward function balances multiple objectives:

```typescript
reward = scoreReward * 0.6 + linesReward * 0.3 + levelReward * 0.1
```

This prevents the AI from:
- ❌ Only maximizing score (ignoring survival)
- ❌ Only surviving (ignoring score)
- ✅ Finding the optimal balance

### 4. **Implicit Curriculum**

The adaptive weight system creates an **implicit curriculum**:
1. Learn to play at low heights (easier)
2. Gradually handle higher heights (harder)
3. Master crisis management (hardest)

---

## Performance Metrics

### Tracking Improvement

The system tracks:
- **Score trend** - Moving average over last 5 games
- **Best score** - Peak performance achieved
- **Average level** - Consistency indicator
- **Weight changes** - Learning activity

### Expected Learning Curve

```
Games 1-10:   Exploration (high variance)
Games 10-50:  Rapid improvement (finding good strategies)
Games 50-100: Refinement (optimizing details)
Games 100+:   Mastery (consistent high performance)
```

---

## Key Insights

### Why 9 Weights Instead of 1?

**Single weight:**
```
Score = f(board_state)
```
- Simple but inflexible
- Can't adapt to different situations
- Limited learning capacity

**Multiple weights:**
```
Score = w₁·f₁(state) + w₂·f₂(state) + ... + w₉·f₉(state)
```
- Rich representation of strategy
- Adaptable to different game phases
- Higher learning capacity

### The Neural Network's Role

The network doesn't learn to play Tetris directly. Instead, it learns to:
1. **Recognize board patterns** (input features)
2. **Predict optimal weight combinations** (output)
3. **Adapt strategy** to current situation

This is more efficient than learning move-by-move because:
- ✅ Faster convergence (fewer parameters to learn)
- ✅ Better generalization (works on unseen boards)
- ✅ Interpretable (can see what weights it's using)

---

## Future Improvements

### Potential Enhancements

1. **Store board states** during gameplay for better training data
2. **Implement experience replay** to learn from past games
3. **Add piece preview features** (next piece, hold piece)
4. **Tune hyperparameters** (learning rate, network size)
5. **Implement TD-learning** for better credit assignment

### Advanced Techniques

- **Genetic algorithms** for weight evolution
- **Monte Carlo Tree Search** for move planning
- **Ensemble methods** combining multiple networks
- **Transfer learning** from human expert games

---

## Conclusion

The multi-weight neural network system works because it:

1. **Decomposes the problem** into manageable sub-objectives
2. **Learns correlations** between different aspects of play
3. **Adapts dynamically** to changing game conditions
4. **Balances exploration and exploitation** effectively

While 9 weights might seem complex, they provide the **expressiveness** needed for the neural network to discover sophisticated Tetris strategies through self-play.

The key is not the number of weights, but how they work together to create a rich, learnable representation of optimal play.
