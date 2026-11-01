import React, { useRef, useEffect } from 'react';
import { NeuralNetwork } from './neuralNetwork';

interface NeuralNetworkVisualizerProps {
    network: NeuralNetwork;
    currentInput?: number[];
    currentOutput?: number[];
}

export const NeuralNetworkVisualizer: React.FC<NeuralNetworkVisualizerProps> = ({
    network,
    currentInput,
    currentOutput,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNeuron, setHoveredNeuron] = React.useState<{
        layer: number;
        index: number;
        x: number;
        y: number;
        name: string;
        value: number;
    } | null>(null);

    // Neuron names for input and output layers (10 weights)
    const inputNames = [
        'Lines Cleared',
        'Contact',
        'Holes Created',
        'Overhangs Created',
        'Overhangs Filled',
        'Height Added',
        'Well Depth²',
        'Bumpiness',
        'Avg Height',
        'Row Transitions'
    ];

    const outputNames = [
        'lineCleared',
        'contact',
        'holesCreated',
        'overhangsCreated',
        'overhangsFilled',
        'heightAdded',
        'wellDepthSquared',
        'bumpiness',
        'avgHeight',
        'rowTransitions'
    ];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);

        // Get layer sizes
        const layerSizes = [
            network.config.inputSize,
            ...network.config.hiddenLayers,
            network.config.outputSize,
        ];

        const numLayers = layerSizes.length;
        const layerSpacing = width / (numLayers + 1);
        const maxNeurons = Math.max(...layerSizes);

        // Calculate neuron positions
        const neuronPositions: { x: number; y: number }[][] = [];
        layerSizes.forEach((size, layerIdx) => {
            const positions: { x: number; y: number }[] = [];
            const x = layerSpacing * (layerIdx + 1);
            const neuronSpacing = height / (size + 1);

            for (let i = 0; i < size; i++) {
                const y = neuronSpacing * (i + 1);
                positions.push({ x, y });
            }
            neuronPositions.push(positions);
        });

        // Draw connections (weights)
        for (let layer = 0; layer < numLayers - 1; layer++) {
            const fromLayer = neuronPositions[layer];
            const toLayer = neuronPositions[layer + 1];
            const weights = network.weights[layer];

            for (let i = 0; i < toLayer.length; i++) {
                for (let j = 0; j < fromLayer.length; j++) {
                    const weight = weights.data[i][j];
                    const from = fromLayer[j];
                    const to = toLayer[i];

                    // Color based on weight value (red = negative, blue = positive)
                    const absWeight = Math.abs(weight);
                    const alpha = Math.min(absWeight * 0.5, 0.8);
                    const color = weight > 0
                        ? `rgba(59, 130, 246, ${alpha})` // Blue for positive
                        : `rgba(239, 68, 68, ${alpha})`; // Red for negative

                    ctx.strokeStyle = color;
                    ctx.lineWidth = Math.min(absWeight * 2, 3);
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                }
            }
        }

        // Draw neurons
        layerSizes.forEach((size, layerIdx) => {
            const positions = neuronPositions[layerIdx];

            positions.forEach((pos, neuronIdx) => {
                // Get activation value if available
                let activation = 0.5; // Default neutral
                if (layerIdx === 0 && currentInput) {
                    activation = currentInput[neuronIdx] || 0;
                } else if (layerIdx === numLayers - 1 && currentOutput) {
                    activation = currentOutput[neuronIdx] || 0;
                }

                // Draw neuron circle
                const radius = 8;

                // Glow effect based on activation
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2);
                const glowColor = activation > 0.5
                    ? `rgba(34, 197, 94, ${activation})` // Green for high activation
                    : `rgba(148, 163, 184, ${activation * 0.5})`; // Gray for low activation

                gradient.addColorStop(0, glowColor);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius * 2, 0, Math.PI * 2);
                ctx.fill();

                // Draw neuron body
                ctx.fillStyle = activation > 0.5
                    ? `rgba(34, 197, 94, ${0.3 + activation * 0.7})`
                    : `rgba(100, 116, 139, ${0.3 + activation * 0.4})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw neuron border
                ctx.strokeStyle = activation > 0.5
                    ? '#22c55e'
                    : '#64748b';
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        });

        // Draw layer labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';

        const labels = ['Input', ...network.config.hiddenLayers.map((_, i) => `Hidden ${i + 1}`), 'Output'];
        labels.forEach((label, idx) => {
            const x = layerSpacing * (idx + 1);
            ctx.fillText(label, x, 20);
            ctx.fillText(`(${layerSizes[idx]})`, x, 35);
        });

        // Draw legend
        ctx.textAlign = 'left';
        ctx.font = '11px monospace';

        // Positive weights
        ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
        ctx.fillRect(10, height - 60, 15, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Positive weight', 30, height - 55);

        // Negative weights
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fillRect(10, height - 40, 15, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Negative weight', 30, height - 35);

        // Active neuron
        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.beginPath();
        ctx.arc(17, height - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Active neuron', 30, height - 15);

    }, [network, currentInput, currentOutput]);

    // Handle mouse move for hover detection
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        // Calculate neuron positions (same logic as drawing)
        const layerSizes = [
            network.config.inputSize,
            ...network.config.hiddenLayers,
            network.config.outputSize,
        ];
        const numLayers = layerSizes.length;
        const layerSpacing = canvas.width / (numLayers + 1);

        let found = false;
        layerSizes.forEach((size, layerIdx) => {
            const x = layerSpacing * (layerIdx + 1);
            const neuronSpacing = canvas.height / (size + 1);

            for (let i = 0; i < size; i++) {
                const y = neuronSpacing * (i + 1);
                const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);

                if (distance < 12) { // Hover radius
                    // Only show tooltips for input and output layers
                    if (layerIdx === 0 || layerIdx === numLayers - 1) {
                        const isInput = layerIdx === 0;
                        const name = isInput ? inputNames[i] : outputNames[i];
                        const value = isInput
                            ? (currentInput?.[i] ?? 0)
                            : (currentOutput?.[i] ?? 0);

                        setHoveredNeuron({
                            layer: layerIdx,
                            index: i,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                            name,
                            value,
                        });
                        found = true;
                    }
                }
            }
        });

        if (!found) {
            setHoveredNeuron(null);
        }
    };

    return (
        <div ref={containerRef} className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-purple-500/20 relative">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">Neural Network Visualization</h3>
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    className="w-full h-auto rounded-lg border border-gray-700 cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredNeuron(null)}
                />

                {/* Hover Tooltip */}
                {hoveredNeuron && (
                    <div
                        className="absolute bg-black/90 border border-cyan-400/50 rounded-lg px-3 py-2 pointer-events-none z-10"
                        style={{
                            left: `${hoveredNeuron.x + 15}px`,
                            top: `${hoveredNeuron.y - 10}px`,
                        }}
                    >
                        <div className="text-xs font-bold text-cyan-400">{hoveredNeuron.name}</div>
                        <div className="text-xs text-gray-300">
                            Value: <span className="text-green-400 font-semibold">{hoveredNeuron.value.toFixed(3)}</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p>• Network learns optimal weights from game performance</p>
                <p>• Brighter neurons = higher activation</p>
                <p>• Line thickness = weight strength</p>
                <p>• <span className="text-cyan-400">Hover over neurons</span> to see names and values</p>
            </div>
        </div>
    );
};
