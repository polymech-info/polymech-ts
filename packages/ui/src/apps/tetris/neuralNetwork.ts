// Neural Network for Tetris AI
// Uses a simple feedforward network with backpropagation

export interface NeuralNetworkConfig {
    inputSize: number;
    hiddenLayers: number[];
    outputSize: number;
    learningRate: number;
}

export interface TrainingExample {
    input: number[];
    expectedOutput: number[];
    reward: number;
}

class Matrix {
    rows: number;
    cols: number;
    data: number[][];

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array(rows).fill(0).map(() => Array(cols).fill(0));
    }

    static fromArray(arr: number[]): Matrix {
        const m = new Matrix(arr.length, 1);
        for (let i = 0; i < arr.length; i++) {
            m.data[i][0] = arr[i];
        }
        return m;
    }

    toArray(): number[] {
        const arr: number[] = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                arr.push(this.data[i][j]);
            }
        }
        return arr;
    }

    randomize(): void {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] = Math.random() * 2 - 1; // -1 to 1
            }
        }
    }

    static multiply(a: Matrix, b: Matrix): Matrix {
        if (a.cols !== b.rows) {
            throw new Error('Matrix dimensions do not match for multiplication');
        }
        const result = new Matrix(a.rows, b.cols);
        for (let i = 0; i < result.rows; i++) {
            for (let j = 0; j < result.cols; j++) {
                let sum = 0;
                for (let k = 0; k < a.cols; k++) {
                    sum += a.data[i][k] * b.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        return result;
    }

    add(n: Matrix | number): void {
        if (n instanceof Matrix) {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n.data[i][j];
                }
            }
        } else {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.data[i][j] += n;
                }
            }
        }
    }

    static subtract(a: Matrix, b: Matrix): Matrix {
        const result = new Matrix(a.rows, a.cols);
        for (let i = 0; i < a.rows; i++) {
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j] - b.data[i][j];
            }
        }
        return result;
    }

    static transpose(m: Matrix): Matrix {
        const result = new Matrix(m.cols, m.rows);
        for (let i = 0; i < m.rows; i++) {
            for (let j = 0; j < m.cols; j++) {
                result.data[j][i] = m.data[i][j];
            }
        }
        return result;
    }

    map(func: (val: number) => number): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.data[i][j] = func(this.data[i][j]);
            }
        }
        return result;
    }

    static hadamard(a: Matrix, b: Matrix): Matrix {
        const result = new Matrix(a.rows, a.cols);
        for (let i = 0; i < a.rows; i++) {
            for (let j = 0; j < a.cols; j++) {
                result.data[i][j] = a.data[i][j] * b.data[i][j];
            }
        }
        return result;
    }

    scale(n: number): void {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.data[i][j] *= n;
            }
        }
    }

    copy(): Matrix {
        const result = new Matrix(this.rows, this.cols);
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                result.data[i][j] = this.data[i][j];
            }
        }
        return result;
    }
}

// Activation functions
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
const sigmoidDerivative = (y: number): number => y * (1 - y);
const relu = (x: number): number => Math.max(0, x);
const reluDerivative = (y: number): number => y > 0 ? 1 : 0;

export class NeuralNetwork {
    config: NeuralNetworkConfig;
    weights: Matrix[];
    biases: Matrix[];

    constructor(config: NeuralNetworkConfig) {
        this.config = config;
        this.weights = [];
        this.biases = [];

        // Initialize weights and biases for each layer
        const layerSizes = [config.inputSize, ...config.hiddenLayers, config.outputSize];

        for (let i = 0; i < layerSizes.length - 1; i++) {
            const w = new Matrix(layerSizes[i + 1], layerSizes[i]);
            w.randomize();
            this.weights.push(w);

            const b = new Matrix(layerSizes[i + 1], 1);
            b.randomize();
            this.biases.push(b);
        }
    }

    // Forward propagation
    predict(inputArray: number[]): number[] {
        let current = Matrix.fromArray(inputArray);

        for (let i = 0; i < this.weights.length; i++) {
            current = Matrix.multiply(this.weights[i], current);
            current.add(this.biases[i]);

            // Use ReLU for hidden layers, sigmoid for output
            if (i < this.weights.length - 1) {
                current = current.map(relu);
            } else {
                current = current.map(sigmoid);
            }
        }

        return current.toArray();
    }

    // Backpropagation training
    train(examples: TrainingExample[]): void {
        for (const example of examples) {
            // Forward pass - store all activations
            const activations: Matrix[] = [Matrix.fromArray(example.input)];
            const zValues: Matrix[] = [];

            for (let i = 0; i < this.weights.length; i++) {
                const z = Matrix.multiply(this.weights[i], activations[activations.length - 1]);
                z.add(this.biases[i]);
                zValues.push(z);

                let a: Matrix;
                if (i < this.weights.length - 1) {
                    a = z.map(relu);
                } else {
                    a = z.map(sigmoid);
                }
                activations.push(a);
            }

            // Backward pass
            const target = Matrix.fromArray(example.expectedOutput);
            const weightGradients: Matrix[] = [];
            const biasGradients: Matrix[] = [];

            // Output layer error (scaled by reward)
            let delta = Matrix.subtract(activations[activations.length - 1], target);
            delta.scale(example.reward); // Reward modulation

            const outputDerivative = activations[activations.length - 1].map(sigmoidDerivative);
            delta = Matrix.hadamard(delta, outputDerivative);

            // Calculate gradients for each layer (backwards)
            for (let i = this.weights.length - 1; i >= 0; i--) {
                const weightGrad = Matrix.multiply(delta, Matrix.transpose(activations[i]));
                weightGradients.unshift(weightGrad);
                biasGradients.unshift(delta.copy());

                if (i > 0) {
                    // Propagate error to previous layer
                    delta = Matrix.multiply(Matrix.transpose(this.weights[i]), delta);
                    const derivative = zValues[i - 1].map(reluDerivative);
                    delta = Matrix.hadamard(delta, derivative);
                }
            }

            // Update weights and biases
            for (let i = 0; i < this.weights.length; i++) {
                weightGradients[i].scale(this.config.learningRate);
                this.weights[i].add(weightGradients[i].map(x => -x));

                biasGradients[i].scale(this.config.learningRate);
                this.biases[i].add(biasGradients[i].map(x => -x));
            }
        }
    }

    // Serialize to JSON for storage
    toJSON(): string {
        return JSON.stringify({
            config: this.config,
            weights: this.weights.map(w => w.data),
            biases: this.biases.map(b => b.data),
        });
    }

    // Deserialize from JSON
    static fromJSON(json: string): NeuralNetwork {
        const data = JSON.parse(json);
        const nn = new NeuralNetwork(data.config);

        nn.weights = data.weights.map((w: number[][]) => {
            const matrix = new Matrix(w.length, w[0].length);
            matrix.data = w;
            return matrix;
        });

        nn.biases = data.biases.map((b: number[][]) => {
            const matrix = new Matrix(b.length, b[0].length);
            matrix.data = b;
            return matrix;
        });

        return nn;
    }
}
