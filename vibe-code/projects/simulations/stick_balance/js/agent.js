/**
 * Revised Dueling Double DQN agent with real backprop, 
 * optional layer norm, prioritized replay, parameter noise, etc.
 */
class Agent {
    constructor(params) {
        // Learning parameters
        this.learningRate = params.learningRate || 0.1; // High initial learning rate
        this.initialLearningRate = this.learningRate;
        this.learningRateDecayEpisodes = 200;
        this.discountFactor = params.discountFactor || 0.99;
        this.explorationRate = params.explorationRate || 1.0;
        this.minExplorationRate = params.minExplorationRate || 0.01;
        this.explorationDecay = params.explorationDecay || 0.002;
        
        // Neural network parameters
        this.hiddenLayerSize = 24; // Smaller hidden layer
        this.recurrentSize = 8;    // Smaller recurrent layer
        this.batchSize = 8;       // Lowered for earlier learning
        this.updateFrequency = 10; // More frequent updates
        this.targetUpdateFrequency = 100;
        this.minReplaySize = 16; // Lowered for earlier learning
        
        // Network optimization
        this.optimizer = {
            learningRate: this.learningRate,
            momentum: 0.0,           // Not used in RMSProp
            decay: 0.0,             // Typically not used in RMSProp
            rmspropDecay: 0.95,
            epsilon: 1e-6
        };

        // Prioritized replay
        this.replayBuffer = [];
        this.replayBufferSize = 100000;
        this.priorityAlpha = 0.6;
        this.priorityBeta = 0.4;
        this.minPriority = 0.01;
        this.maxBufferSize = 100000;

        // Exploration strategy
        this.useNoiseExploration = true;
        this.noiseDecay = 0.997;
        this.noiseScale = 0.4;
        this.paramNoiseStddev = 0.1; // parameter-space noise
        this.useParamNoise = true;

        // Action space
        this.numActions = 15;

        // Recurrent + temporal info
        this.stepsCounter = 0;
        this.lastActions = new Array(6).fill(0);
        this.lastStates = new Array(6);

        // Initialize main/target networks
        this.mainNetwork = this.createNetwork();
        this.targetNetwork = this.createNetwork();
        this.updateTargetNetwork();

        // Exploration network for parameter noise
        this.explorationNetwork = this.createNetwork();
        this.applyParameterNoise();

        // Keep initial weights for measuring changes
        this.initialWeights = this.copyNetworkWeights(this.mainNetwork);

        // Stats
        this.episodeCount = 0;
        this.episodeDurations = [];
        this.episodeRewards = [];
        this.weightChanges = [];
        this.lastWeightChange = 0;
        this.trainingLosses = [];

        // Adaptive features
        this.successiveFailures = 0;
        this.adaptiveLearningEnabled = true;
        this.adaptiveExplorationEnabled = true;

        // Force some balanced initial exploration
        this.forceBalancedInitialActions = true;
        
        // Track numerical stability issues
        this.hadNaNIssue = false;
    }

    /**
     * Create network structure. We keep some optional layer-norm arrays,
     * but you can decide whether to learn them or keep them fixed.
     */
    createNetwork() {
        const network = {
            // Input layer size depends on how we craft "prepareNetworkInput".
            inputLayer: {
                size: 6 // Updated to match the minimal robust input (6 features)
            },

            // Shared hidden layer
            sharedHiddenLayer: {
                size: this.hiddenLayerSize,
                weights: new Array(6 * this.hiddenLayerSize), // Updated from 17
                biases: new Array(this.hiddenLayerSize),
                normScales: new Array(this.hiddenLayerSize).fill(1),
                normBiases: new Array(this.hiddenLayerSize).fill(0),
                activation: x => Math.max(0, x) // ReLU
            },

            // Second hidden layer
            secondHiddenLayer: {
                size: 64,
                weights: new Array(this.hiddenLayerSize * 64),
                biases: new Array(64),
                normScales: new Array(64).fill(1),
                normBiases: new Array(64).fill(0),
                activation: x => Math.max(0, x) // ReLU
            },

            // Recurrent layer
            recurrentLayer: {
                size: this.recurrentSize,
                weights: new Array(64 * this.recurrentSize),
                recurrentWeights: new Array(this.recurrentSize * this.recurrentSize),
                biases: new Array(this.recurrentSize),
                state: new Array(this.recurrentSize).fill(0),
                activation: x => Math.tanh(x)
            },

            // Value stream
            valueStream: {
                hiddenSize: 64,
                hiddenWeights: new Array( (64 + this.recurrentSize) * 64 ),
                hiddenBiases: new Array(64),
                outputWeights: new Array(64),
                outputBias: 0,
                activation: x => Math.max(0, x) // ReLU
            },

            // Advantage stream
            advantageStream: {
                hiddenSize: 96,
                hiddenWeights: new Array( (64 + this.recurrentSize) * 96 ),
                hiddenBiases: new Array(96),
                outputWeights: new Array(96 * this.numActions),
                outputBiases: new Array(this.numActions),
                activation: x => Math.max(0, x) // ReLU
            }
        };

        // Initialize weights with Xavier or He initialization
        const randf = () => Math.random() * 2 - 1;

        // 1) Shared hidden layer
        {
            const scale = Math.sqrt(2 / (network.inputLayer.size + network.sharedHiddenLayer.size));
            for (let i = 0; i < network.sharedHiddenLayer.weights.length; i++) {
                network.sharedHiddenLayer.weights[i] = randf() * scale;
            }
            network.sharedHiddenLayer.biases.fill(0);
        }
        // 2) Second hidden layer
        {
            const scale = Math.sqrt(2 / (this.hiddenLayerSize + network.secondHiddenLayer.size));
            for (let i = 0; i < network.secondHiddenLayer.weights.length; i++) {
                network.secondHiddenLayer.weights[i] = randf() * scale;
            }
            network.secondHiddenLayer.biases.fill(0);
        }
        // 3) Recurrent layer
        {
            const inputScale = Math.sqrt(2 / (network.secondHiddenLayer.size + this.recurrentSize));
            for (let i = 0; i < network.recurrentLayer.weights.length; i++) {
                network.recurrentLayer.weights[i] = randf() * inputScale;
            }
            // Recurrent weights smaller
            const recScale = Math.sqrt(1 / this.recurrentSize);
            for (let i = 0; i < network.recurrentLayer.recurrentWeights.length; i++) {
                network.recurrentLayer.recurrentWeights[i] = randf() * recScale * 0.3;
            }
            network.recurrentLayer.biases.fill(0);
        }
        // 4) Value stream
        {
            const combinedSize = 64 + this.recurrentSize;
            const hiddenScale = Math.sqrt(2 / (combinedSize + network.valueStream.hiddenSize));
            for (let i = 0; i < network.valueStream.hiddenWeights.length; i++) {
                network.valueStream.hiddenWeights[i] = randf() * hiddenScale;
            }
            network.valueStream.hiddenBiases.fill(0);
            const outputScale = Math.sqrt(2 / network.valueStream.hiddenSize);
            for (let i = 0; i < network.valueStream.outputWeights.length; i++) {
                network.valueStream.outputWeights[i] = randf() * outputScale;
            }
            network.valueStream.outputBias = 0;
        }
        // 5) Advantage stream
        {
            const combinedSize = 64 + this.recurrentSize;
            const hiddenScale = Math.sqrt(2 / (combinedSize + network.advantageStream.hiddenSize));
            for (let i = 0; i < network.advantageStream.hiddenWeights.length; i++) {
                network.advantageStream.hiddenWeights[i] = randf() * hiddenScale;
            }
            network.advantageStream.hiddenBiases.fill(0);

            const outScale = Math.sqrt(2 / network.advantageStream.hiddenSize);
            for (let i = 0; i < network.advantageStream.outputWeights.length; i++) {
                network.advantageStream.outputWeights[i] = randf() * outScale;
            }

            // Randomize output biases for all actions
            for (let i = 0; i < network.advantageStream.outputBiases.length; i++) {
                network.advantageStream.outputBiases[i] = (Math.random() * 2 - 1) * 0.1; // random in [-0.1, 0.1]
            }
        }

        return network;
    }

    /**
     * Produce a deep copy of the network's trainable parameters
     */
    copyNetworkWeights(net) {
        return JSON.parse(JSON.stringify(net));
    }

    /**
     * Soft-update target network from main network
     */
    updateTargetNetwork() {
        const tau = 0.005;
        const main = this.mainNetwork;
        const target = this.targetNetwork;

        function softUpdateArray(targetArr, sourceArr) {
            for (let i = 0; i < targetArr.length; i++) {
                targetArr[i] = (1 - tau) * targetArr[i] + tau * sourceArr[i];
            }
        }

        // Shared hidden
        softUpdateArray(target.sharedHiddenLayer.weights, main.sharedHiddenLayer.weights);
        softUpdateArray(target.sharedHiddenLayer.biases,  main.sharedHiddenLayer.biases);
        // optional layer-norm
        softUpdateArray(target.sharedHiddenLayer.normScales, main.sharedHiddenLayer.normScales);
        softUpdateArray(target.sharedHiddenLayer.normBiases, main.sharedHiddenLayer.normBiases);

        // Second hidden
        softUpdateArray(target.secondHiddenLayer.weights, main.secondHiddenLayer.weights);
        softUpdateArray(target.secondHiddenLayer.biases,  main.secondHiddenLayer.biases);
        softUpdateArray(target.secondHiddenLayer.normScales, main.secondHiddenLayer.normScales);
        softUpdateArray(target.secondHiddenLayer.normBiases, main.secondHiddenLayer.normBiases);

        // Recurrent
        softUpdateArray(target.recurrentLayer.weights, main.recurrentLayer.weights);
        softUpdateArray(target.recurrentLayer.recurrentWeights, main.recurrentLayer.recurrentWeights);
        softUpdateArray(target.recurrentLayer.biases, main.recurrentLayer.biases);
        // we typically do not copy over the "state" from main -> target

        // Value stream
        softUpdateArray(target.valueStream.hiddenWeights, main.valueStream.hiddenWeights);
        softUpdateArray(target.valueStream.hiddenBiases,  main.valueStream.hiddenBiases);
        softUpdateArray(target.valueStream.outputWeights, main.valueStream.outputWeights);
        target.valueStream.outputBias = (1 - tau)*target.valueStream.outputBias + tau*main.valueStream.outputBias;

        // Advantage stream
        softUpdateArray(target.advantageStream.hiddenWeights, main.advantageStream.hiddenWeights);
        softUpdateArray(target.advantageStream.hiddenBiases,  main.advantageStream.hiddenBiases);
        softUpdateArray(target.advantageStream.outputWeights, main.advantageStream.outputWeights);
        softUpdateArray(target.advantageStream.outputBiases,  main.advantageStream.outputBiases);
    }

    /**
     * Apply parameter noise to explorationNetwork from mainNetwork
     */
    applyParameterNoise() {
        if (!this.useParamNoise) return;

        const stddev = this.paramNoiseStddev;
        function addNoise(targetArr, sourceArr) {
            for (let i = 0; i < targetArr.length; i++) {
                // Simple Gaussian noise
                let u = 0, v = 0;
                while (u === 0) u = Math.random();
                while (v === 0) v = Math.random();
                const noise = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stddev;

                targetArr[i] = sourceArr[i] + noise;
            }
        }

        const src = this.mainNetwork;
        const dst = this.explorationNetwork;

        // shared hidden
        addNoise(dst.sharedHiddenLayer.weights, src.sharedHiddenLayer.weights);
        addNoise(dst.sharedHiddenLayer.biases,  src.sharedHiddenLayer.biases);

        addNoise(dst.secondHiddenLayer.weights, src.secondHiddenLayer.weights);
        addNoise(dst.secondHiddenLayer.biases,  src.secondHiddenLayer.biases);

        addNoise(dst.recurrentLayer.weights, src.recurrentLayer.weights);
        addNoise(dst.recurrentLayer.recurrentWeights, src.recurrentLayer.recurrentWeights);
        addNoise(dst.recurrentLayer.biases, src.recurrentLayer.biases);

        addNoise(dst.valueStream.hiddenWeights, src.valueStream.hiddenWeights);
        addNoise(dst.valueStream.hiddenBiases,  src.valueStream.hiddenBiases);
        addNoise(dst.valueStream.outputWeights, src.valueStream.outputWeights);
        // single scalar
        {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const noise = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stddev;
            dst.valueStream.outputBias = src.valueStream.outputBias + noise;
        }

        addNoise(dst.advantageStream.hiddenWeights, src.advantageStream.hiddenWeights);
        addNoise(dst.advantageStream.hiddenBiases,  src.advantageStream.hiddenBiases);
        addNoise(dst.advantageStream.outputWeights, src.advantageStream.outputWeights);
        addNoise(dst.advantageStream.outputBiases,  src.advantageStream.outputBiases);
    }

    /**
     * Min-max normalize state for stable inputs
     */
    normalizeState(state) {
        const norm = (val, minv, maxv) => {
            const clipped = Math.max(minv, Math.min(maxv, val));
            return 2 * (clipped - minv) / (maxv - minv) - 1;
        };
        // example bounds
        return [
            norm(state.platformPos, -5, 5),
            norm(state.platformVel, -5, 5),
            norm(state.stickAngle, -Math.PI, Math.PI),
            norm(state.stickAngularVel, -5, 5)
        ];
    }

    /**
     * Augmented input: concat last 3 states and last 3 actions
     */
    prepareNetworkInput(state) {
        // Always keep at least 3 states and 3 actions in history
        while (this.lastStates.length < 3) this.lastStates.unshift({...state});
        while (this.lastActions.length < 3) this.lastActions.unshift(0);
        // Normalize each state
        const normStates = this.lastStates.slice(0, 3).map(s => this.normalizeState(s));
        // Last 3 actions
        const lastActs = this.lastActions.slice(0, 3);
        // Flatten states
        const flatStates = normStates.flat();
        // Only use the first 6 features (platformPos, platformVel, stickAngle, stickAngularVel, lastAction1, lastAction2)
        // to match inputLayer.size = 6
        return [
            flatStates[0], // platformPos
            flatStates[1], // platformVel
            flatStates[2], // stickAngle
            flatStates[3], // stickAngularVel
            lastActs[0],   // last action 1
            lastActs[1]    // last action 2
        ];
    }

    /**
     * Basic layer normalization (optional). 
     * Returns an array of normalized values.
     */
    layerNormalize(values, scales, biases) {
        const eps = 1e-5;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        let variance = 0;
        for (const v of values) {
            variance += (v - mean) * (v - mean);
        }
        variance /= values.length;
        const std = Math.sqrt(variance + eps);

        const out = new Array(values.length);
        for (let i = 0; i < values.length; i++) {
            const normed = (values[i] - mean) / std;
            out[i] = normed * scales[i] + biases[i];
        }
        return out;
    }

    /**
     * Forward pass that returns both Q-values and a "cache"
     * containing intermediate activations for backprop.
     *
     * For training, we typically pass `includeRecurrentUpdate = false`
     * until we finalize the gradient pass. Then we can update state
     * if we're doing single-step RNN training (somewhat limited).
     */
    forwardPass(network, state, includeRecurrentUpdate = false) {
        // Prepare input
        const input = this.prepareNetworkInput(state);

        const cache = {}; // will store intermediate values for backprop

        // Shared hidden
        let sharedPre = new Array(network.sharedHiddenLayer.size).fill(0);
        for (let i = 0; i < network.sharedHiddenLayer.size; i++) {
            for (let j = 0; j < input.length; j++) {
                sharedPre[i] += input[j] * network.sharedHiddenLayer.weights[j*network.sharedHiddenLayer.size + i];
            }
            sharedPre[i] += network.sharedHiddenLayer.biases[i];
        }
        // optional layer norm
        sharedPre = this.layerNormalize(
            sharedPre,
            network.sharedHiddenLayer.normScales,
            network.sharedHiddenLayer.normBiases
        );
        const sharedOut = sharedPre.map(network.sharedHiddenLayer.activation);

        // Second hidden
        let secondPre = new Array(network.secondHiddenLayer.size).fill(0);
        for (let i = 0; i < network.secondHiddenLayer.size; i++) {
            for (let j = 0; j < sharedOut.length; j++) {
                secondPre[i] += sharedOut[j] * network.secondHiddenLayer.weights[j*network.secondHiddenLayer.size + i];
            }
            secondPre[i] += network.secondHiddenLayer.biases[i];
        }
        secondPre = this.layerNormalize(
            secondPre,
            network.secondHiddenLayer.normScales,
            network.secondHiddenLayer.normBiases
        );
        const secondOut = secondPre.map(network.secondHiddenLayer.activation);

        // Recurrent step
        let recPre = new Array(network.recurrentLayer.size).fill(0);
        for (let i = 0; i < network.recurrentLayer.size; i++) {
            // input from secondOut
            for (let j = 0; j < secondOut.length; j++) {
                recPre[i] += secondOut[j] * network.recurrentLayer.weights[j*network.recurrentLayer.size + i];
            }
            // recurrent connections
            for (let j = 0; j < network.recurrentLayer.size; j++) {
                recPre[i] += network.recurrentLayer.state[j] *
                             network.recurrentLayer.recurrentWeights[j*network.recurrentLayer.size + i];
            }
            recPre[i] += network.recurrentLayer.biases[i];
        }
        const recOut = recPre.map(network.recurrentLayer.activation);

        // Update recurrent state if needed
        if (includeRecurrentUpdate) {
            network.recurrentLayer.state = [...recOut];
        }

        // Combine secondOut + recOut
        const combined = [...secondOut, ...recOut];

        // Value stream
        let valHiddenPre = new Array(network.valueStream.hiddenSize).fill(0);
        for (let i = 0; i < network.valueStream.hiddenSize; i++) {
            for (let j = 0; j < combined.length; j++) {
                valHiddenPre[i] += combined[j] * network.valueStream.hiddenWeights[j*network.valueStream.hiddenSize + i];
            }
            valHiddenPre[i] += network.valueStream.hiddenBiases[i];
        }
        const valHiddenOut = valHiddenPre.map(network.valueStream.activation);

        let value = 0;
        for (let i = 0; i < valHiddenOut.length; i++) {
            value += valHiddenOut[i] * network.valueStream.outputWeights[i];
        }
        value += network.valueStream.outputBias;

        // Advantage stream
        let advHiddenPre = new Array(network.advantageStream.hiddenSize).fill(0);
        for (let i = 0; i < network.advantageStream.hiddenSize; i++) {
            for (let j = 0; j < combined.length; j++) {
                advHiddenPre[i] += combined[j] * network.advantageStream.hiddenWeights[j*network.advantageStream.hiddenSize + i];
            }
            advHiddenPre[i] += network.advantageStream.hiddenBiases[i];
        }
        const advHiddenOut = advHiddenPre.map(network.advantageStream.activation);

        const advantages = new Array(this.numActions).fill(0);
        for (let a = 0; a < this.numActions; a++) {
            for (let h = 0; h < network.advantageStream.hiddenSize; h++) {
                advantages[a] += advHiddenOut[h] * network.advantageStream.outputWeights[h*this.numActions + a];
            }
            advantages[a] += network.advantageStream.outputBiases[a];
        }

        // Dueling combine
        const meanAdv = advantages.reduce((s,v) => s+v, 0) / this.numActions;
        const qValues = advantages.map(a => value + (a - meanAdv));

        // Save cache for backprop
        cache.input = input;
        cache.sharedPre = sharedPre;
        cache.sharedOut = sharedOut;
        cache.secondPre = secondPre;
        cache.secondOut = secondOut;
        cache.recPre = recPre;
        cache.recOut = recOut;
        cache.combined = combined; // secondOut + recOut

        cache.valHiddenPre = valHiddenPre;
        cache.valHiddenOut = valHiddenOut;
        cache.value = value;

        cache.advHiddenPre = advHiddenPre;
        cache.advHiddenOut = advHiddenOut;
        cache.advantages = advantages;
        cache.meanAdv = meanAdv;
        cache.qValues = qValues;

        return { qValues, cache };
    }

    /**
     * Compute partial derivatives for a single sample via backprop,
     * given the forward-pass cache and the chosen action/TD-error.
     *
     * This is a "vanilla" backprop ignoring real recurrent unrolling.
     * We only do single-step gradient for the recurrent layer.
     */
    computeGradients(network, cache, actionIndex, tdError) {
        // We’ll store gradients in an object that mirrors the network’s structure.
        // For simplicity, we do not do a “matrix” approach, but array-of-arrays.

        const grads = {
            // Shared hidden
            sharedHiddenLayer: {
                weights: new Array(network.sharedHiddenLayer.weights.length).fill(0),
                biases:  new Array(network.sharedHiddenLayer.biases.length).fill(0),
                // layer-norm scales/biases if you want to learn them:
                normScales: new Array(network.sharedHiddenLayer.normScales.length).fill(0),
                normBiases: new Array(network.sharedHiddenLayer.normBiases.length).fill(0)
            },
            // Second hidden
            secondHiddenLayer: {
                weights: new Array(network.secondHiddenLayer.weights.length).fill(0),
                biases:  new Array(network.secondHiddenLayer.biases.length).fill(0),
                normScales: new Array(network.secondHiddenLayer.normScales.length).fill(0),
                normBiases: new Array(network.secondHiddenLayer.normBiases.length).fill(0)
            },
            // Recurrent
            recurrentLayer: {
                weights: new Array(network.recurrentLayer.weights.length).fill(0),
                recurrentWeights: new Array(network.recurrentLayer.recurrentWeights.length).fill(0),
                biases:  new Array(network.recurrentLayer.biases.length).fill(0)
            },
            // Value
            valueStream: {
                hiddenWeights: new Array(network.valueStream.hiddenWeights.length).fill(0),
                hiddenBiases:  new Array(network.valueStream.hiddenBiases.length).fill(0),
                outputWeights: new Array(network.valueStream.outputWeights.length).fill(0),
                outputBias: 0
            },
            // Advantage
            advantageStream: {
                hiddenWeights: new Array(network.advantageStream.hiddenWeights.length).fill(0),
                hiddenBiases:  new Array(network.advantageStream.hiddenBiases.length).fill(0),
                outputWeights: new Array(network.advantageStream.outputWeights.length).fill(0),
                outputBiases:  new Array(network.advantageStream.outputBiases.length).fill(0)
            }
        };

        // We'll do partial derivatives from Q-values -> ... -> parameters

        // Q-values: Q[a] = value + (advantages[a] - meanAdv)
        // For the chosen actionIndex, dLoss/dQ[a] = (Q[a] - target)^1 (MSE) => tdError
        // But let's do dLoss/dQ[a_chosen] = tdError, dLoss/dQ[others] = 0
        // Actually we store "dQ" array for each action.
        const dQ = new Array(this.numActions).fill(0);
        dQ[actionIndex] = tdError;

        // Then each Q[a] = value + (advantages[a] - meanAdv).
        // => dValue = sum of dQ[a] (since Q[a] depends on 'value') but also note Q depends on "advantages[a]" minus the average advantage.

        // dValue = sum(dQ[a]) for all a, because each Q[a] includes +value.
        // But effectively we only have tdError for a_chosen, so:
        // dValue = tdError
        const dValue = dQ.reduce((s,v) => s+v, 0); // in standard DQN with 1-hot target, that’s just tdError.

        // advantage for action a: A[a] => Q[a] = value + A[a] - meanAdv
        // => partial wrt A[a] is dQ[a], partial wrt A[x != a] is 0, except for the mean. 
        // meanAdv = sum(A[a]) / numActions => derivative of A[x] wrt A[a] is 1/numActions if x==a, else 0. 
        // So for each advantage a: dA[a] = dQ[a] * (1 - 1/numActions) - sum_{x != a}( dQ[x]*1/numActions ) 
        // In simpler terms, if we only have dQ for the chosen action,
        //   dA[a_chosen] = tdError * (1 - 1/numActions)
        //   dA[others] = - tdError*(1/numActions) for each other action
        // But if only one action is “active,” we can do it directly:

        const dA = new Array(this.numActions).fill(0);
        const sumDQ = dQ.reduce((sum,x) => sum+x, 0);
        for (let a = 0; a < this.numActions; a++) {
            // dA[a] = dQ[a] - (sumDQ / numActions)
            dA[a] = dQ[a] - (sumDQ / this.numActions);
        }

        // 1) Backprop to value stream
        // value = sum_i( valHiddenOut[i] * W[i] ) + bias
        // partial wrt W[i] = dValue * valHiddenOut[i]
        // partial wrt valHiddenOut[i] = dValue * W[i]
        // partial wrt bias = dValue
        const dvHiddenOut = new Array(network.valueStream.hiddenSize).fill(0);
        for (let i = 0; i < network.valueStream.hiddenSize; i++) {
            // gradient wrt outputWeights[i]
            grads.valueStream.outputWeights[i] += dValue * cache.valHiddenOut[i];
            // partial wrt valHiddenOut[i]
            dvHiddenOut[i] = dValue * network.valueStream.outputWeights[i];
        }
        grads.valueStream.outputBias += dValue;

        // valueHiddenOut[i] = ReLU(valHiddenPre[i])
        // => dvHiddenPre[i] = dvHiddenOut[i] * (valHiddenPre[i] > 0 ? 1 : 0)
        const dvHiddenPre = new Array(network.valueStream.hiddenSize).fill(0);
        for (let i = 0; i < dvHiddenOut.length; i++) {
            const gate = (cache.valHiddenPre[i] > 0) ? 1 : 0;
            dvHiddenPre[i] = dvHiddenOut[i] * gate;
        }

        // Each valHiddenPre[i] = sum_j( combined[j]*W[j,i] ) + bias[i]
        // => partial wrt W[j,i] = dvHiddenPre[i] * combined[j]
        // => partial wrt bias[i] = dvHiddenPre[i]
        const combinedLen = cache.combined.length; 
        for (let i = 0; i < network.valueStream.hiddenSize; i++) {
            grads.valueStream.hiddenBiases[i] += dvHiddenPre[i];
            for (let j = 0; j < combinedLen; j++) {
                const idx = j*network.valueStream.hiddenSize + i;
                grads.valueStream.hiddenWeights[idx] += dvHiddenPre[i] * cache.combined[j];
            }
        }

        // 2) Backprop to advantage stream
        // advantages[a] = sum_h( advHiddenOut[h]*W[h,a] ) + outputBiases[a]
        // dLoss/dW[h,a] = dA[a]*advHiddenOut[h]
        // dLoss/dadvHiddenOut[h] = sum_a( dA[a]*W[h,a] )
        const dAdvHiddenOut = new Array(network.advantageStream.hiddenSize).fill(0);
        for (let a = 0; a < this.numActions; a++) {
            grads.advantageStream.outputBiases[a] += dA[a];
            for (let h = 0; h < network.advantageStream.hiddenSize; h++) {
                const idx = h*this.numActions + a;
                grads.advantageStream.outputWeights[idx] += dA[a] * cache.advHiddenOut[h];
                dAdvHiddenOut[h] += dA[a] * network.advantageStream.outputWeights[idx];
            }
        }

        // advHiddenOut[h] = ReLU(advHiddenPre[h])
        const dAdvHiddenPre = new Array(network.advantageStream.hiddenSize).fill(0);
        for (let h = 0; h < dAdvHiddenOut.length; h++) {
            const gate = (cache.advHiddenPre[h] > 0) ? 1 : 0;
            dAdvHiddenPre[h] = dAdvHiddenOut[h] * gate;
        }

        // advHiddenPre[h] = sum_j( combined[j]*hiddenWeights[j,h] ) + hiddenBiases[h]
        for (let h = 0; h < network.advantageStream.hiddenSize; h++) {
            grads.advantageStream.hiddenBiases[h] += dAdvHiddenPre[h];
            for (let j = 0; j < combinedLen; j++) {
                const idx = j*network.advantageStream.hiddenSize + h;
                grads.advantageStream.hiddenWeights[idx] += dAdvHiddenPre[h] * cache.combined[j];
            }
        }

        // 3) Combine gradient wrt combined = secondOut + recOut
        // from value stream + advantage stream
        const dCombined = new Array(combinedLen).fill(0);
        // For value stream
        for (let i = 0; i < network.valueStream.hiddenSize; i++) {
            const di = dvHiddenPre[i];
            for (let j = 0; j < combinedLen; j++) {
                const idx = j*network.valueStream.hiddenSize + i;
                // partial wrt combined[j] contributed by dvHiddenPre[i]
                // but we’ve already stored that in grads; now we want dCombined
                dCombined[j] += di * network.valueStream.hiddenWeights[idx];
            }
        }
        // For advantage stream
        for (let h = 0; h < network.advantageStream.hiddenSize; h++) {
            const dh = dAdvHiddenPre[h];
            for (let j = 0; j < combinedLen; j++) {
                const idx = j*network.advantageStream.hiddenSize + h;
                dCombined[j] += dh * network.advantageStream.hiddenWeights[idx];
            }
        }

        // 4) Split dCombined => dSecondOut, dRecOut
        const secondLen = cache.secondOut.length;
        const dSecondOut = dCombined.slice(0, secondLen);
        const dRecOut = dCombined.slice(secondLen);

        // 4a) Recurrent backprop for recOut
        // recOut[i] = tanh(recPre[i])
        // => dRecPre[i] = dRecOut[i] * (1 - recOut[i]^2)
        const dRecPre = new Array(this.recurrentSize).fill(0);
        for (let i = 0; i < this.recurrentSize; i++) {
            const x = cache.recOut[i];
            dRecPre[i] = dRecOut[i] * (1 - x*x);
        }

        // recPre[i] = sum_j( secondOut[j]*w[j,i] ) + sum_j( state[j]*recWeights[j,i] ) + bias[i]
        // so partial wrt w[j,i] = dRecPre[i]*secondOut[j], etc.
        for (let i = 0; i < this.recurrentSize; i++) {
            grads.recurrentLayer.biases[i] += dRecPre[i];
            // input from secondOut
            for (let j = 0; j < secondLen; j++) {
                const idx = j*this.recurrentSize + i;
                grads.recurrentLayer.weights[idx] += dRecPre[i] * cache.secondOut[j];
            }
            // recurrent from recState
            // (We do not have the prev state stored in the forward cache for gradient, 
            //   we used network.recurrentLayer.state at forward time. 
            //   This is partial. True BPTT needs the older state. 
            //   We'll approximate it with the same state we used.)
            for (let j = 0; j < this.recurrentSize; j++) {
                const idx = j*this.recurrentSize + i;
                grads.recurrentLayer.recurrentWeights[idx] += dRecPre[i] * network.recurrentLayer.state[j];
            }
        }

        // we also need gradient wrt the "previous rec state", 
        // but for true BPTT you'd accumulate that over timesteps. 
        // Here, we skip that or do single-step approximation.

        // 4b) Backprop to secondOut
        // secondOut[i] = ReLU(secondPre[i])
        const dSecondPre = new Array(secondLen).fill(0);
        for (let i = 0; i < secondLen; i++) {
            const gate = (cache.secondPre[i] > 0) ? 1 : 0;
            dSecondPre[i] = dSecondOut[i]*gate + dRecPre.reduce((sum, drec, reci) => {
                // But we must see how recPre depends on secondOut: 
                // recPre[reci] includes secondOut[i] * w[i, reci] 
                // => partial wrt secondOut[i] = w[i, reci] * dRecPre[reci]
                // we do that outside the loop, let's do it carefully:
                return sum; 
            }, 0);
        }
        // Actually, we must do it more explicitly:
        // dRecPre[i] = partial wrt recPre[i],
        // recPre[i] got a sum of secondOut[j]*weights[j,i]
        // => partial wrt secondOut[j] = dRecPre[i]*weights[j,i]
        // We'll do a second pass:
        const dSecondFromRec = new Array(secondLen).fill(0);
        for (let i = 0; i < this.recurrentSize; i++) {
            for (let j = 0; j < secondLen; j++) {
                const idx = j*this.recurrentSize + i;
                dSecondFromRec[j] += dRecPre[i]*network.recurrentLayer.weights[idx];
            }
        }
        for (let i = 0; i < secondLen; i++) {
            const gate = (cache.secondPre[i] > 0) ? 1 : 0;
            dSecondPre[i] = dSecondOut[i] + dSecondFromRec[i];
            dSecondPre[i] *= gate;
        }

        // secondPre[i] = sum_j(sharedOut[j]*W[j,i]) + bias[i]
        for (let i = 0; i < secondLen; i++) {
            grads.secondHiddenLayer.biases[i] += dSecondPre[i];
            for (let j = 0; j < cache.sharedOut.length; j++) {
                const idx = j*secondLen + i;
                grads.secondHiddenLayer.weights[idx] += dSecondPre[i] * cache.sharedOut[j];
            }
        }

        // 5) backprop to sharedOut
        const dSharedOut = new Array(cache.sharedOut.length).fill(0);
        for (let i = 0; i < secondLen; i++) {
            for (let j = 0; j < cache.sharedOut.length; j++) {
                const idx = j*secondLen + i;
                dSharedOut[j] += dSecondPre[i] * network.secondHiddenLayer.weights[idx];
            }
        }

        // sharedOut[i] = ReLU(sharedPre[i])
        const dSharedPre = new Array(cache.sharedOut.length).fill(0);
        for (let i = 0; i < dSharedOut.length; i++) {
            const gate = (cache.sharedPre[i] > 0) ? 1 : 0;
            dSharedPre[i] = dSharedOut[i]*gate;
        }

        // sharedPre[i] = sum_j(input[j]*W[j,i]) + bias[i]
        // => partial wrt W[j,i] = dSharedPre[i]*input[j]
        for (let i = 0; i < cache.sharedPre.length; i++) {
            grads.sharedHiddenLayer.biases[i] += dSharedPre[i];
            for (let j = 0; j < cache.input.length; j++) {
                const idx = j*cache.sharedPre.length + i;
                grads.sharedHiddenLayer.weights[idx] += dSharedPre[i] * cache.input[j];
            }
        }

        // *If you want to learn layer-norm scales/biases*, you must also do partial derivatives
        // wrt normScales, normBiases. That is more involved. Typically a framework does it for you.

        return grads;
    }

    /**
     * Simple RMSProp update for all parameters.
     */
    applyGradients(network, grads, stepSize, rmsPropCache) {
        const decay = this.optimizer.rmspropDecay;
        const eps = this.optimizer.epsilon;
        
        // Set a gradient clipping threshold to prevent exploding gradients
        const clipThreshold = 1.0;

        function clipGradient(grad) {
            return Math.max(-clipThreshold, Math.min(clipThreshold, grad));
        }

        function updateParam(param, grad, cacheVal) {
            // Clip gradient to prevent exploding gradients
            const clippedGrad = clipGradient(grad);
            
            const newCache = decay*cacheVal + (1-decay)*clippedGrad*clippedGrad;
            const delta = stepSize * clippedGrad / (Math.sqrt(newCache) + eps);
            
            // Limit update size as additional safety
            const clippedDelta = Math.max(-0.1, Math.min(0.1, delta));
            
            // Update param
            const newParam = param - clippedDelta;
            return { newParam, newCache };
        }

        // For brevity, define a helper to loop arrays
        function loopUpdate(arrayParam, arrayGrad, arrayCache) {
            for (let i = 0; i < arrayParam.length; i++) {
                const { newParam, newCache } = updateParam(arrayParam[i], arrayGrad[i], arrayCache[i]);
                arrayParam[i] = newParam;
                arrayCache[i] = newCache;
            }
        }

        // sharedHidden
        loopUpdate(network.sharedHiddenLayer.weights, grads.sharedHiddenLayer.weights, rmsPropCache.sharedHiddenLayer.weights);
        loopUpdate(network.sharedHiddenLayer.biases,  grads.sharedHiddenLayer.biases,  rmsPropCache.sharedHiddenLayer.biases);

        // secondHidden
        loopUpdate(network.secondHiddenLayer.weights, grads.secondHiddenLayer.weights, rmsPropCache.secondHiddenLayer.weights);
        loopUpdate(network.secondHiddenLayer.biases,  grads.secondHiddenLayer.biases,  rmsPropCache.secondHiddenLayer.biases);

        // RNN
        loopUpdate(network.recurrentLayer.weights, grads.recurrentLayer.weights, rmsPropCache.recurrentLayer.weights);
        loopUpdate(network.recurrentLayer.recurrentWeights, grads.recurrentLayer.recurrentWeights, rmsPropCache.recurrentLayer.recurrentWeights);
        loopUpdate(network.recurrentLayer.biases, grads.recurrentLayer.biases, rmsPropCache.recurrentLayer.biases);

        // valueStream
        loopUpdate(network.valueStream.hiddenWeights, grads.valueStream.hiddenWeights, rmsPropCache.valueStream.hiddenWeights);
        loopUpdate(network.valueStream.hiddenBiases, grads.valueStream.hiddenBiases, rmsPropCache.valueStream.hiddenBiases);
        loopUpdate(network.valueStream.outputWeights, grads.valueStream.outputWeights, rmsPropCache.valueStream.outputWeights);
        {
            // single scalar
            const { newParam, newCache } = updateParam(
                network.valueStream.outputBias,
                grads.valueStream.outputBias,
                rmsPropCache.valueStream.outputBias
            );
            network.valueStream.outputBias = newParam;
            rmsPropCache.valueStream.outputBias = newCache;
        }

        // advantageStream
        loopUpdate(network.advantageStream.hiddenWeights, grads.advantageStream.hiddenWeights, rmsPropCache.advantageStream.hiddenWeights);
        loopUpdate(network.advantageStream.hiddenBiases, grads.advantageStream.hiddenBiases, rmsPropCache.advantageStream.hiddenBiases);
        loopUpdate(network.advantageStream.outputWeights, grads.advantageStream.outputWeights, rmsPropCache.advantageStream.outputWeights);
        loopUpdate(network.advantageStream.outputBiases, grads.advantageStream.outputBiases, rmsPropCache.advantageStream.outputBiases);
    }

    /**
     * Convert continuous action in [-1,1] to discrete index [0, numActions-1]
     */
    actionToIndex(action) {
        const normalized = (action + 1)/2;
        const idx = Math.min(
            this.numActions-1,
            Math.floor(normalized * this.numActions)
        );
        return idx;
    }

    /**
     * Convert discrete index to continuous action
     */
    indexToAction(idx) {
        return -1 + (idx + 0.5)*(2/this.numActions);
    }

    /**
     * Add experience with prioritized replay
     */
    addExperience(state, action, reward, nextState, done) {
        if (this.replayBuffer.length >= this.replayBufferSize) {
            const excess = this.replayBuffer.length - this.replayBufferSize + 1;
            this.replayBuffer.splice(0, excess);
        }

        // quick TD error for priority
        const { qValues } = this.forwardPass(this.mainNetwork, state, false);
        const aIdx = this.actionToIndex(action);
        const currentQ = qValues[aIdx];

        let targetQ = reward;
        if (!done) {
            const nextQmain = this.forwardPass(this.mainNetwork, nextState, false).qValues;
            const bestNext = nextQmain.indexOf(Math.max(...nextQmain));
            const nextQtarget = this.forwardPass(this.targetNetwork, nextState, false).qValues;
            targetQ += this.discountFactor * nextQtarget[bestNext];
        }
        const tdErr = Math.abs(targetQ - currentQ);
        const priority = Math.pow(tdErr + this.minPriority, this.priorityAlpha);

        const experience = {
            state: {...state},
            action,
            reward,
            nextState: {...nextState},
            done,
            priority
        };
        this.replayBuffer.push(experience);

        // update consecutive failures
        if (done && this.stepsCounter < 500) {
            this.successiveFailures++;
        } else if (!done) {
            this.successiveFailures = Math.max(0, this.successiveFailures-0.5);
        }
    }

    /**
     * Sample a batch using priorities
     */
    sampleBatch() {
        if (this.replayBuffer.length < this.minReplaySize) return [];

        const totalPriority = this.replayBuffer.reduce((sum, e) => sum + e.priority, 0);
        const batch = [];
        const indexes = [];
        const weights = [];

        this.priorityBeta = Math.min(1.0, this.priorityBeta + 0.0005);

        for (let i = 0; i < this.batchSize; i++) {
            if (i >= this.replayBuffer.length) break;
            const target = Math.random() * totalPriority;
            let sum = 0;
            let selected = null;
            let idx = -1;
            for (let j = 0; j < this.replayBuffer.length; j++) {
                sum += this.replayBuffer[j].priority;
                if (sum >= target) {
                    selected = this.replayBuffer[j];
                    idx = j;
                    break;
                }
            }
            if (!selected) {
                idx = Math.floor(Math.random()*this.replayBuffer.length);
                selected = this.replayBuffer[idx];
            }

            const pSample = selected.priority / totalPriority;
            const w = Math.pow(this.replayBuffer.length * pSample, -this.priorityBeta);

            batch.push(selected);
            indexes.push(idx);
            weights.push(w);
        }
        // normalize weights
        const maxW = Math.max(...weights);
        for (let i = 0; i < weights.length; i++) {
            weights[i] /= maxW;
        }

        return {
            experiences: batch,
            indexes,
            weights
        };
    }

    /**
     * Full backprop training on a batch
     */
    trainOnBatch(batchData) {
        if (!batchData || !batchData.experiences || batchData.experiences.length === 0) return 0;
        const batch = batchData.experiences;
        const indexes = batchData.indexes;
        const weights = batchData.weights;

        // We’ll keep an RMSProp cache that persists across steps
        if (!this.rmsPropCache) {
            this.initRMSPropCache();
        }

        let totalLoss = 0;

        // We accumulate gradients across the batch
        const accumGrads = this.initZeroGrads();

        // Turn off the RNN state for batch training (or reset it):
        const oldState = [...this.mainNetwork.recurrentLayer.state];
        this.mainNetwork.recurrentLayer.state.fill(0);

        // For each experience
        for (let i = 0; i < batch.length; i++) {
            const exp = batch[i];
            const w = weights[i];
            // forward on current state
            const { qValues, cache } = this.forwardPass(this.mainNetwork, exp.state, false);

            // Safely check qValues for NaN before proceeding
            if (!qValues || qValues.some(v => !isFinite(v))) {
                console.warn('NaN detected in Q-values, skipping this batch item');
                continue;
            }

            // compute target with Double DQN
            const aIdx = this.actionToIndex(exp.action);
            const currentQ = qValues[aIdx];
            
            // Check if currentQ is valid
            if (!isFinite(currentQ)) {
                console.warn('NaN detected in currentQ, skipping this batch item');
                continue;
            }
            
            let targetQ = exp.reward;

            if (!exp.done) {
                // Add safety checks for next state calculations
                try {
                    const nextMain = this.forwardPass(this.mainNetwork, exp.nextState, false).qValues;
                    
                    if (!nextMain || nextMain.some(v => !isFinite(v))) {
                        console.warn('NaN detected in next state Q-values, using fallback');
                        targetQ = exp.reward; // Fallback to just using the reward
                    } else {
                        const bestNext = nextMain.indexOf(Math.max(...nextMain));
                        const nextTar = this.forwardPass(this.targetNetwork, exp.nextState, false).qValues;
                        
                        if (!nextTar || nextTar.some(v => !isFinite(v))) {
                            console.warn('NaN detected in target network Q-values, using fallback');
                            targetQ = exp.reward; // Fallback
                        } else {
                            // Calculate bootstrap target safely
                            const nextQValue = nextTar[bestNext];
                            if (isFinite(nextQValue)) {
                                targetQ += this.discountFactor * nextQValue;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in target Q calculation:', error);
                    // Just use reward as fallback
                    targetQ = exp.reward;
                }
            }
            
            // Ensure targetQ is finite
            if (!isFinite(targetQ)) {
                console.warn('Non-finite targetQ detected, using reward only');
                targetQ = isFinite(exp.reward) ? exp.reward : 0;
            }
            
            let tdErr = targetQ - currentQ;
            // More aggressive clipping to prevent extreme values
            tdErr = Math.max(-5, Math.min(5, tdErr)); 
            
            // Ensure weight is finite
            const safeWeight = isFinite(w) ? w : 1.0;
            const loss = 0.5 * tdErr * tdErr * safeWeight; // weighted MSE
            
            if (isFinite(loss)) {
                totalLoss += loss;
            }

            // update priority (safely)
            if (indexes[i] !== undefined && isFinite(tdErr) && this.replayBuffer[indexes[i]]) {
                const safePriority = Math.max(0.01, Math.pow(Math.abs(tdErr) + this.minPriority, this.priorityAlpha));
                this.replayBuffer[indexes[i]].priority = isFinite(safePriority) ? safePriority : this.minPriority;
            }

            // backprop only if tdErr is valid
            if (isFinite(tdErr)) {
                // Compute gradients with the clipped TD error
                const grads = this.computeGradients(this.mainNetwork, cache, aIdx, tdErr * safeWeight);
                
                // Safety check for gradients before accumulating
                if (this.areGradientsValid(grads)) {
                    this.accumulateGrads(accumGrads, grads);
                } else {
                    console.warn('Invalid gradients detected, skipping gradient accumulation');
                }
            }
        }

        // Before applying, check if we have valid data to learn from
        const validBatchSize = batch.filter((_, i) => isFinite(weights[i])).length;
        if (validBatchSize > 0) {
            // Now we average the gradients by the valid batch size
            this.scaleGrads(accumGrads, 1.0 / validBatchSize);
            
            // Apply gradients only if they are valid
            if (this.areGradientsValid(accumGrads)) {
                // Apply RMSProp with a gentler learning rate if we've had NaN issues
                const effectiveLR = this.hadNaNIssue ? this.optimizer.learningRate * 0.5 : this.optimizer.learningRate;
                this.applyGradients(this.mainNetwork, accumGrads, effectiveLR, this.rmsPropCache);
                this.hadNaNIssue = false; // Reset the flag if successful
            } else {
                console.warn('Invalid accumulated gradients, skipping weight update');
                this.hadNaNIssue = true; // Set flag to reduce learning rate next time
            }
        } else {
            console.warn('No valid examples in batch, skipping update');
        }

        // restore old recurrent state
        this.mainNetwork.recurrentLayer.state = oldState;

        // return average loss (safely)
        return validBatchSize > 0 ? (totalLoss / validBatchSize) : 0;
    }
    
    /**
     * Check if gradients contain any invalid values (NaN or Infinity)
     */
    areGradientsValid(grads) {
        // Helper function to check an array for invalid values
        const isArrayValid = (arr) => {
            if (!arr) return false;
            return arr.every(val => isFinite(val));
        };
        
        // Check shared hidden layer
        if (!isArrayValid(grads.sharedHiddenLayer.weights) || 
            !isArrayValid(grads.sharedHiddenLayer.biases)) {
            return false;
        }
        
        // Check second hidden layer
        if (!isArrayValid(grads.secondHiddenLayer.weights) || 
            !isArrayValid(grads.secondHiddenLayer.biases)) {
            return false;
        }
        
        // Check recurrent layer
        if (!isArrayValid(grads.recurrentLayer.weights) || 
            !isArrayValid(grads.recurrentLayer.recurrentWeights) || 
            !isArrayValid(grads.recurrentLayer.biases)) {
            return false;
        }
        
        // Check value stream
        if (!isArrayValid(grads.valueStream.hiddenWeights) || 
            !isArrayValid(grads.valueStream.hiddenBiases) || 
            !isArrayValid(grads.valueStream.outputWeights) || 
            !isFinite(grads.valueStream.outputBias)) {
            return false;
        }
        
        // Check advantage stream
        if (!isArrayValid(grads.advantageStream.hiddenWeights) || 
            !isArrayValid(grads.advantageStream.hiddenBiases) || 
            !isArrayValid(grads.advantageStream.outputWeights) || 
            !isArrayValid(grads.advantageStream.outputBiases)) {
            return false;
        }
        
        return true;
    }

    /**
     * Initialize an object with same shape as network for RMSProp cache
     */
    initRMSPropCache() {
        function arr(len) { return new Array(len).fill(0); }
        this.rmsPropCache = {
            sharedHiddenLayer: {
                weights: arr(this.mainNetwork.sharedHiddenLayer.weights.length),
                biases:  arr(this.mainNetwork.sharedHiddenLayer.biases.length),
                // normScales: arr(...), normBiases: arr(...), if used
            },
            secondHiddenLayer: {
                weights: arr(this.mainNetwork.secondHiddenLayer.weights.length),
                biases:  arr(this.mainNetwork.secondHiddenLayer.biases.length),
                // normScales: arr(...), normBiases: arr(...),
            },
            recurrentLayer: {
                weights: arr(this.mainNetwork.recurrentLayer.weights.length),
                recurrentWeights: arr(this.mainNetwork.recurrentLayer.recurrentWeights.length),
                biases: arr(this.mainNetwork.recurrentLayer.biases.length)
            },
            valueStream: {
                hiddenWeights: arr(this.mainNetwork.valueStream.hiddenWeights.length),
                hiddenBiases:  arr(this.mainNetwork.valueStream.hiddenBiases.length),
                outputWeights: arr(this.mainNetwork.valueStream.outputWeights.length),
                outputBias: 0
            },
            advantageStream: {
                hiddenWeights: arr(this.mainNetwork.advantageStream.hiddenWeights.length),
                hiddenBiases:  arr(this.mainNetwork.advantageStream.hiddenBiases.length),
                outputWeights: arr(this.mainNetwork.advantageStream.outputWeights.length),
                outputBiases:  arr(this.mainNetwork.advantageStream.outputBiases.length)
            }
        };
    }

    initZeroGrads() {
        // returns a zero-initialized gradients object, same shape as network
        function arr(len) { return new Array(len).fill(0); }
        return {
            sharedHiddenLayer: {
                weights: arr(this.mainNetwork.sharedHiddenLayer.weights.length),
                biases:  arr(this.mainNetwork.sharedHiddenLayer.biases.length),
                normScales: arr(this.mainNetwork.sharedHiddenLayer.normScales.length),
                normBiases: arr(this.mainNetwork.sharedHiddenLayer.normBiases.length)
            },
            secondHiddenLayer: {
                weights: arr(this.mainNetwork.secondHiddenLayer.weights.length),
                biases:  arr(this.mainNetwork.secondHiddenLayer.biases.length),
                normScales: arr(this.mainNetwork.secondHiddenLayer.normScales.length),
                normBiases: arr(this.mainNetwork.secondHiddenLayer.normBiases.length)
            },
            recurrentLayer: {
                weights: arr(this.mainNetwork.recurrentLayer.weights.length),
                recurrentWeights: arr(this.mainNetwork.recurrentLayer.recurrentWeights.length),
                biases: arr(this.mainNetwork.recurrentLayer.biases.length)
            },
            valueStream: {
                hiddenWeights: arr(this.mainNetwork.valueStream.hiddenWeights.length),
                hiddenBiases:  arr(this.mainNetwork.valueStream.hiddenBiases.length),
                outputWeights: arr(this.mainNetwork.valueStream.outputWeights.length),
                outputBias: 0
            },
            advantageStream: {
                hiddenWeights: arr(this.mainNetwork.advantageStream.hiddenWeights.length),
                hiddenBiases:  arr(this.mainNetwork.advantageStream.hiddenBiases.length),
                outputWeights: arr(this.mainNetwork.advantageStream.outputWeights.length),
                outputBiases:  arr(this.mainNetwork.advantageStream.outputBiases.length)
            }
        };
    }

    accumulateGrads(base, incr) {
        // Add incr into base
        function addArr(b, inc) {
            for (let i = 0; i < b.length; i++) {
                b[i] += inc[i];
            }
        }

        const A = base, B = incr;

        // shared
        addArr(A.sharedHiddenLayer.weights, B.sharedHiddenLayer.weights);
        addArr(A.sharedHiddenLayer.biases,  B.sharedHiddenLayer.biases);
        addArr(A.sharedHiddenLayer.normScales, B.sharedHiddenLayer.normScales);
        addArr(A.sharedHiddenLayer.normBiases, B.sharedHiddenLayer.normBiases);

        // second
        addArr(A.secondHiddenLayer.weights, B.secondHiddenLayer.weights);
        addArr(A.secondHiddenLayer.biases,  B.secondHiddenLayer.biases);
        addArr(A.secondHiddenLayer.normScales, B.secondHiddenLayer.normScales);
        addArr(A.secondHiddenLayer.normBiases, B.secondHiddenLayer.normBiases);

        // recurrent
        addArr(A.recurrentLayer.weights, B.recurrentLayer.weights);
        addArr(A.recurrentLayer.recurrentWeights, B.recurrentLayer.recurrentWeights);
        addArr(A.recurrentLayer.biases, B.recurrentLayer.biases);

        // value
        addArr(A.valueStream.hiddenWeights, B.valueStream.hiddenWeights);
        addArr(A.valueStream.hiddenBiases,  B.valueStream.hiddenBiases);
        addArr(A.valueStream.outputWeights, B.valueStream.outputWeights);
        A.valueStream.outputBias += B.valueStream.outputBias;

        // advantage
        addArr(A.advantageStream.hiddenWeights, B.advantageStream.hiddenWeights);
        addArr(A.advantageStream.hiddenBiases,  B.advantageStream.hiddenBiases);
        addArr(A.advantageStream.outputWeights, B.advantageStream.outputWeights);
        addArr(A.advantageStream.outputBiases,  B.advantageStream.outputBiases);
    }

    scaleGrads(gradObj, factor) {
        function scaleArr(arr) {
            for (let i = 0; i < arr.length; i++) {
                arr[i] *= factor;
            }
        }
        // shared
        scaleArr(gradObj.sharedHiddenLayer.weights);
        scaleArr(gradObj.sharedHiddenLayer.biases);
        scaleArr(gradObj.sharedHiddenLayer.normScales);
        scaleArr(gradObj.sharedHiddenLayer.normBiases);

        // second
        scaleArr(gradObj.secondHiddenLayer.weights);
        scaleArr(gradObj.secondHiddenLayer.biases);
        scaleArr(gradObj.secondHiddenLayer.normScales);
        scaleArr(gradObj.secondHiddenLayer.normBiases);

        // recurrent
        scaleArr(gradObj.recurrentLayer.weights);
        scaleArr(gradObj.recurrentLayer.recurrentWeights);
        scaleArr(gradObj.recurrentLayer.biases);

        // value
        scaleArr(gradObj.valueStream.hiddenWeights);
        scaleArr(gradObj.valueStream.hiddenBiases);
        scaleArr(gradObj.valueStream.outputWeights);
        gradObj.valueStream.outputBias *= factor;

        // adv
        scaleArr(gradObj.advantageStream.hiddenWeights);
        scaleArr(gradObj.advantageStream.hiddenBiases);
        scaleArr(gradObj.advantageStream.outputWeights);
        scaleArr(gradObj.advantageStream.outputBiases);
    }

    /**
     * Choose an action given the current policy
     */
    selectAction(state) {
        this.stepsCounter++;

        // track for temporal features
        this.lastStates.unshift({...state});
        if (this.lastStates.length > 6) {
            this.lastStates.pop();
        }

        // Force truly random exploration for first ~20 episodes
        if (this.forceBalancedInitialActions && this.episodeCount < 20) {
            const act = Math.random() * 2 - 1;
            this.lastActions.unshift(act);
            if (this.lastActions.length > 6) this.lastActions.pop();
            // Debug: log random actions in early episodes
            if (this.episodeCount < 5 && this.stepsCounter % 10 === 0) {
                console.log(`[Agent] Ep${this.episodeCount} Step${this.stepsCounter}: Random action = ${act.toFixed(2)}`);
            }
            return act;
        }

        // epsilon exploration
        if (Math.random() < this.explorationRate) {
            if (this.useNoiseExploration && this.useParamNoise) {
                // param noise
                const { qValues } = this.forwardPass(this.explorationNetwork, state, false);
                const aIdx = qValues.indexOf(Math.max(...qValues));
                const act = this.indexToAction(aIdx);
                this.lastActions.unshift(act);
                if (this.lastActions.length > 6) this.lastActions.pop();
                if (this.episodeCount < 5 && this.stepsCounter % 10 === 0) {
                    console.log(`[Agent] Ep${this.episodeCount} Step${this.stepsCounter}: Param-noise action = ${act.toFixed(2)}, Qs=`, qValues.map(q=>q.toFixed(2)));
                }
                return act;
            } else if (this.useNoiseExploration) {
                // action-space noise
                const { qValues } = this.forwardPass(this.mainNetwork, state, false);
                const noisy = qValues.map(q => q + (Math.random()*2-1)*this.noiseScale);
                const best = noisy.indexOf(Math.max(...noisy));
                const act = this.indexToAction(best);
                this.lastActions.unshift(act);
                if (this.lastActions.length > 6) this.lastActions.pop();
                if (this.episodeCount < 5 && this.stepsCounter % 10 === 0) {
                    console.log(`[Agent] Ep${this.episodeCount} Step${this.stepsCounter}: Noisy action = ${act.toFixed(2)}, Qs=`, qValues.map(q=>q.toFixed(2)));
                }
                return act;
            } else {
                // uniform random
                const act = Math.random()*2 - 1;
                this.lastActions.unshift(act);
                if (this.lastActions.length > 6) this.lastActions.pop();
                if (this.episodeCount < 5 && this.stepsCounter % 10 === 0) {
                    console.log(`[Agent] Ep${this.episodeCount} Step${this.stepsCounter}: Uniform random action = ${act.toFixed(2)}`);
                }
                return act;
            }
        }

        // exploit
        const { qValues } = this.forwardPass(this.mainNetwork, state, false);
        const bestIdx = qValues.indexOf(Math.max(...qValues));
        const action = this.indexToAction(bestIdx);
        this.lastActions.unshift(action);
        if (this.lastActions.length>6) this.lastActions.pop();
        if (this.episodeCount < 5 && this.stepsCounter % 10 === 0) {
            console.log(`[Agent] Ep${this.episodeCount} Step${this.stepsCounter}: Exploit action = ${action.toFixed(2)}, Qs=`, qValues.map(q=>q.toFixed(2)));
        }
        return action;
    }

    /**
     * Learn from a single (s,a,r,s') in an online manner
     */
    learn(state, action, reward, nextState, done=false) {
        this.addExperience(state, action, reward, nextState, done);

        // store last states/actions
        this.lastStates.unshift({...state});
        if (this.lastStates.length>6) this.lastStates.pop();

        const aIdx = this.actionToIndex(action);
        const normAct = this.indexToAction(aIdx);
        this.lastActions.unshift(normAct);
        if (this.lastActions.length>6) this.lastActions.pop();

        if (this.replayBuffer.length >= this.minReplaySize) {
            if (this.stepsCounter % this.updateFrequency === 0) {
                const batchData = this.sampleBatch();
                const loss = this.trainOnBatch(batchData);
                this.lastWeightChange = this.calculateWeightChange();
                this.trainingLosses.push(loss);
                // Debug: log weight change and loss
                if (isNaN(this.lastWeightChange) || isNaN(loss)) {
                    console.warn('NaN detected in weight change or loss', this.lastWeightChange, loss);
                }
            }
            if (this.stepsCounter % this.targetUpdateFrequency === 0) {
                this.updateTargetNetwork();
            }
        }

        // increment step
        this.stepsCounter++;

        // Removed per-step exploration and learning rate decay here
        // These are now handled per-episode only

        // param noise update
        if (this.useParamNoise && this.stepsCounter % 50===0) {
            this.applyParameterNoise();
        }

        // memory usage
        if (this.stepsCounter % 100===0) {
            this.manageMemoryUsage();
        }
    }

    /**
     * Manage memory usage
     */
    manageMemoryUsage() {
        const maxHist = 500;
        if (this.episodeRewards.length>maxHist) {
            this.episodeRewards = this.episodeRewards.slice(-maxHist);
        }
        if (this.episodeDurations.length>maxHist) {
            this.episodeDurations = this.episodeDurations.slice(-maxHist);
        }
        if (this.weightChanges.length>maxHist) {
            this.weightChanges = this.weightChanges.slice(-maxHist);
        }
        if (this.trainingLosses.length>maxHist) {
            this.trainingLosses = this.trainingLosses.slice(-maxHist);
        }
        if (this.replayBuffer.length>this.maxBufferSize) {
            this.replayBuffer = this.replayBuffer.slice(-this.maxBufferSize);
        }
    }

    /**
     * Calculate weight change from initial weights
     */
    calculateWeightChange() {
        let sumSq = 0, count = 0;
        function diffArr(a1, a2) {
            let s=0,c=0;
            for (let i = 0; i < a1.length; i++) {
                const d = a1[i] - a2[i];
                s += d*d;
                c++;
            }
            return {sum:s, count:c};
        }
        const init = this.initialWeights;
        const curr = this.mainNetwork;

        // Shared
        {
            const d1 = diffArr(curr.sharedHiddenLayer.weights, init.sharedHiddenLayer.weights);
            sumSq += d1.sum; count += d1.count;
            const d2 = diffArr(curr.sharedHiddenLayer.biases, init.sharedHiddenLayer.biases);
            sumSq += d2.sum; count += d2.count;
        }
        // second
        {
            const d1 = diffArr(curr.secondHiddenLayer.weights, init.secondHiddenLayer.weights);
            sumSq += d1.sum; count += d1.count;
            const d2 = diffArr(curr.secondHiddenLayer.biases, init.secondHiddenLayer.biases);
            sumSq += d2.sum; count += d2.count;
        }
        // rec
        {
            const d1 = diffArr(curr.recurrentLayer.weights, init.recurrentLayer.weights);
            sumSq += d1.sum; count += d1.count;
            const d2 = diffArr(curr.recurrentLayer.recurrentWeights, init.recurrentLayer.recurrentWeights);
            sumSq += d2.sum; count += d2.count;
            const d3 = diffArr(curr.recurrentLayer.biases, init.recurrentLayer.biases);
            sumSq += d3.sum; count += d3.count;
        }
        // value
        {
            const d1 = diffArr(curr.valueStream.hiddenWeights, init.valueStream.hiddenWeights);
            sumSq += d1.sum; count += d1.count;
            const d2 = diffArr(curr.valueStream.hiddenBiases, init.valueStream.hiddenBiases);
            sumSq += d2.sum; count += d2.count;
            const d3 = diffArr(curr.valueStream.outputWeights, init.valueStream.outputWeights);
            sumSq += d3.sum; count += d3.count;
            const db = curr.valueStream.outputBias - init.valueStream.outputBias;
            sumSq += db*db; count++;
        }
        // advantage
        {
            const d1 = diffArr(curr.advantageStream.hiddenWeights, init.advantageStream.hiddenWeights);
            sumSq += d1.sum; count += d1.count;
            const d2 = diffArr(curr.advantageStream.hiddenBiases, init.advantageStream.hiddenBiases);
            sumSq += d2.sum; count += d2.count;
            const d3 = diffArr(curr.advantageStream.outputWeights, init.advantageStream.outputWeights);
            sumSq += d3.sum; count += d3.count;
            const d4 = diffArr(curr.advantageStream.outputBiases, init.advantageStream.outputBiases);
            sumSq += d4.sum; count += d4.count;
        }
        return Math.sqrt(sumSq/count);
    }

    /**
     * End episode
     */
    endEpisode(episodeDuration, episodeReward) {
        this.episodeCount++;
        this.episodeDurations.push(episodeDuration);
        this.episodeRewards.push(episodeReward);
        this.lastWeightChange = this.calculateWeightChange();
        this.weightChanges.push(this.lastWeightChange);

        // reset RNN state
        this.mainNetwork.recurrentLayer.state.fill(0);
        this.targetNetwork.recurrentLayer.state.fill(0);

        this.stepsCounter = 0;
        this.lastActions = new Array(6).fill(0);
        this.lastStates = new Array(6);

        // Per-episode learning rate decay
        if (this.episodeCount > 0 && this.episodeCount <= this.learningRateDecayEpisodes) {
            const decay = 1 - (this.episodeCount / this.learningRateDecayEpisodes);
            this.optimizer.learningRate = this.initialLearningRate * (0.2 + 0.8 * decay); // decay to 20% of initial
        }

        // Modified exploration decay strategy with a floor to maintain exploration
        // Keep minimum exploration rate higher
        const minExploreRate = Math.max(this.minExplorationRate, 0.05);
        
        // Slower decay to maintain exploration longer
        // Instead of linear decay, use an exponential decay that tapers more gradually
        this.explorationRate = Math.max(
            minExploreRate,
            0.9 * Math.exp(-this.episodeCount / 400) + 0.1
        );
        
        // Force periodic exploration bursts to prevent getting stuck in local optima
        if (this.episodeCount % 50 === 0) {
            this.explorationRate = Math.min(0.3, this.explorationRate * 2); // Exploration boost every 50 episodes
            console.log(`Exploration boost at episode ${this.episodeCount}: rate=${this.explorationRate.toFixed(4)}`);
        }

        return {
            episode: this.episodeCount,
            duration: episodeDuration,
            reward: episodeReward,
            weightChange: this.lastWeightChange
        };
    }

    /**
     * Return stats
     */
    getStats() {
        return {
            episodeCount: this.episodeCount,
            lastDuration: this.episodeDurations[this.episodeDurations.length-1] || 0,
            lastReward:   this.episodeRewards[this.episodeRewards.length-1] || 0,
            lastWeightChange: this.lastWeightChange,
            episodeDurations: this.episodeDurations,
            episodeRewards:   this.episodeRewards,
            weightChanges:    this.weightChanges,
            explorationRate:  this.explorationRate,
            learningRate:     this.optimizer.learningRate
        };
    }

    /**
     * An optional method that decays exploration more slowly
     */
    decayExploration() {
        this.explorationRate = Math.max(
            this.minExplorationRate,
            this.explorationRate*(1 - this.explorationDecay*0.5)
        );
        if (this.episodeCount%10===0) {
            console.log(`Episode ${this.episodeCount}: explorationRate=${this.explorationRate.toFixed(4)}`);
        }
    }
}

