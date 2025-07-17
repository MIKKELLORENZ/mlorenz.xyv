/**
 * Simple but effective DQN agent for stick balancing
 */
class Agent {
    constructor(params) {
        // Learning parameters - More aggressive for faster learning
        this.learningRate = params.learningRate || 0.01; // Increased significantly
        this.discountFactor = params.discountFactor || 0.99;
        this.explorationRate = params.explorationRate || 1.0;
        this.minExplorationRate = params.minExplorationRate || 0.05; // Lower minimum for more exploitation
        this.explorationDecay = params.explorationDecay || 0.998; // Faster decay
        
        // Network parameters
        this.inputSize = 4; // platformPos, platformVel, stickAngle, stickAngularVel
        this.hiddenSize = 128; // Increased capacity
        this.outputSize = 21; // More actions for finer control
        
        // Experience replay
        this.replayBuffer = [];
        this.replayBufferSize = 5000; // Smaller buffer for faster learning
        this.batchSize = 64; // Larger batches
        this.minReplaySize = 100; // Wait a bit longer before learning
        
        // Target network
        this.targetUpdateFrequency = 100; // More frequent updates
        this.stepCount = 0;
        
        // Initialize networks
        this.mainNetwork = this.createNetwork();
        this.targetNetwork = this.createNetwork();
        this.updateTargetNetwork();
        
        // Stats
        this.episodeCount = 0;
        this.episodeDurations = [];
        this.episodeRewards = [];
        this.weightChanges = [];
        this.lastWeightChange = 0;
        this.bestDuration = 0;
        this.lastReward = 0;
        
        // Store initial weights
        this.initialWeights = this.copyWeights(this.mainNetwork);
    }
    
    createNetwork() {
        return {
            w1: this.initializeWeights(this.inputSize, this.hiddenSize),
            b1: new Array(this.hiddenSize).fill(0),
            w2: this.initializeWeights(this.hiddenSize, this.outputSize),
            b2: new Array(this.outputSize).fill(0)
        };
    }
    
    initializeWeights(inputSize, outputSize) {
        const weights = [];
        const scale = Math.sqrt(2.0 / inputSize); // He initialization
        
        for (let i = 0; i < inputSize * outputSize; i++) {
            weights.push((Math.random() * 2 - 1) * scale);
        }
        
        return weights;
    }
    
    copyWeights(network) {
        return {
            w1: [...network.w1],
            b1: [...network.b1],
            w2: [...network.w2],
            b2: [...network.b2]
        };
    }
    
    // ReLU activation
    relu(x) {
        return Math.max(0, x);
    }
    
    // Forward pass through network
    forwardPass(network, state) {
        // Normalize inputs
        const input = [
            Math.tanh(state.platformPos / 5.0),
            Math.tanh(state.platformVel / 10.0),
            state.stickAngle / Math.PI,
            Math.tanh(state.stickAngularVel / 10.0)
        ];
        
        // Hidden layer
        const hidden = new Array(this.hiddenSize);
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = network.b1[i];
            for (let j = 0; j < this.inputSize; j++) {
                sum += input[j] * network.w1[j * this.hiddenSize + i];
            }
            hidden[i] = this.relu(sum);
        }
        
        // Output layer
        const output = new Array(this.outputSize);
        for (let i = 0; i < this.outputSize; i++) {
            let sum = network.b2[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += hidden[j] * network.w2[j * this.outputSize + i];
            }
            output[i] = sum;
        }
        
        return { input, hidden, output };
    }
    
    // Convert continuous action to discrete index
    actionToIndex(action) {
        const normalized = (action + 1) / 2; // Convert from [-1,1] to [0,1]
        const index = Math.floor(normalized * this.outputSize);
        return Math.min(this.outputSize - 1, Math.max(0, index));
    }
    
    // Convert discrete index to continuous action
    indexToAction(index) {
        return -1 + (2 * (index + 0.5)) / this.outputSize;
    }
    
    // Select action using epsilon-greedy policy
    selectAction(state) {
        if (Math.random() < this.explorationRate) {
            // Random discrete action index
            const randomIndex = Math.floor(Math.random() * this.outputSize);
            return this.indexToAction(randomIndex);
        }
        
        // Greedy action
        const { output } = this.forwardPass(this.mainNetwork, state);
        const bestIndex = output.indexOf(Math.max(...output));
        return this.indexToAction(bestIndex);
    }
    
    // Add experience to replay buffer
    addExperience(state, action, reward, nextState, done) {
        const experience = {
            state: {...state},
            action,
            reward,
            nextState: {...nextState},
            done
        };
        
        this.replayBuffer.push(experience);
        
        if (this.replayBuffer.length > this.replayBufferSize) {
            this.replayBuffer.shift();
        }
    }
    
    // Sample batch from replay buffer
    sampleBatch() {
        if (this.replayBuffer.length < this.minReplaySize) {
            return null;
        }
        
        const batch = [];
        for (let i = 0; i < this.batchSize; i++) {
            const index = Math.floor(Math.random() * this.replayBuffer.length);
            batch.push(this.replayBuffer[index]);
        }
        
        return batch;
    }
    
    // Train the network on a batch
    trainOnBatch(batch) {
        if (!batch) return 0;
        
        let totalLoss = 0;
        
        // Compute targets for the batch
        const targets = [];
        for (const experience of batch) {
            const { output: currentQ } = this.forwardPass(this.mainNetwork, experience.state);
            const { output: nextQ } = this.forwardPass(this.targetNetwork, experience.nextState);
            
            const actionIndex = this.actionToIndex(experience.action);
            
            // Don't clip rewards - let the full signal through
            let target = experience.reward;
            if (!experience.done) {
                target += this.discountFactor * Math.max(...nextQ);
            }
            
            const targetVector = [...currentQ];
            targetVector[actionIndex] = target;
            targets.push({ input: experience.state, target: targetVector });
            
            // Calculate loss
            const loss = Math.pow(target - currentQ[actionIndex], 2);
            totalLoss += loss;
        }
        
        // Backpropagation
        this.backpropagate(targets);
        
        return totalLoss / batch.length;
    }
    
    // Simplified backpropagation
    backpropagate(targets) {
        const lr = this.learningRate;
        
        // Accumulate gradients
        const gradW1 = new Array(this.mainNetwork.w1.length).fill(0);
        const gradB1 = new Array(this.mainNetwork.b1.length).fill(0);
        const gradW2 = new Array(this.mainNetwork.w2.length).fill(0);
        const gradB2 = new Array(this.mainNetwork.b2.length).fill(0);
        
        for (const { input: state, target } of targets) {
            const { input, hidden, output } = this.forwardPass(this.mainNetwork, state);
            
            // Output layer gradients
            const outputError = new Array(this.outputSize);
            for (let i = 0; i < this.outputSize; i++) {
                outputError[i] = 2 * (output[i] - target[i]);
                gradB2[i] += outputError[i];
                
                for (let j = 0; j < this.hiddenSize; j++) {
                    gradW2[j * this.outputSize + i] += outputError[i] * hidden[j];
                }
            }
            
            // Hidden layer gradients
            const hiddenError = new Array(this.hiddenSize);
            for (let i = 0; i < this.hiddenSize; i++) {
                let error = 0;
                for (let j = 0; j < this.outputSize; j++) {
                    // Fixed indexing: was using i * this.outputSize + j, should be i * this.outputSize + j
                    error += outputError[j] * this.mainNetwork.w2[i * this.outputSize + j];
                }
                hiddenError[i] = error * (hidden[i] > 0 ? 1 : 0); // ReLU derivative
                gradB1[i] += hiddenError[i];
                
                for (let j = 0; j < this.inputSize; j++) {
                    gradW1[j * this.hiddenSize + i] += hiddenError[i] * input[j];
                }
            }
        }
        
        // Apply gradients
        const batchSize = targets.length;
        for (let i = 0; i < this.mainNetwork.w1.length; i++) {
            this.mainNetwork.w1[i] -= lr * gradW1[i] / batchSize;
        }
        for (let i = 0; i < this.mainNetwork.b1.length; i++) {
            this.mainNetwork.b1[i] -= lr * gradB1[i] / batchSize;
        }
        for (let i = 0; i < this.mainNetwork.w2.length; i++) {
            this.mainNetwork.w2[i] -= lr * gradW2[i] / batchSize;
        }
        for (let i = 0; i < this.mainNetwork.b2.length; i++) {
            this.mainNetwork.b2[i] -= lr * gradB2[i] / batchSize;
        }
    }
    
    // Update target network
    updateTargetNetwork() {
        this.targetNetwork = this.copyWeights(this.mainNetwork);
    }
    
    // Main learning function
    learn(state, action, reward, nextState, done) {
        this.addExperience(state, action, reward, nextState, done);
        
        // Train on batch every step once we have enough data
        if (this.replayBuffer.length >= this.minReplaySize) {
            const batch = this.sampleBatch();
            const loss = this.trainOnBatch(batch);
            
            // Log learning progress early on
            if (this.stepCount < 1000 && this.stepCount % 100 === 0) {
                console.log(`Step ${this.stepCount}: Loss = ${loss ? loss.toFixed(4) : 'N/A'}, Buffer size = ${this.replayBuffer.length}, Exploration = ${this.explorationRate.toFixed(3)}`);
            }
        }
        
        // Update target network
        this.stepCount++;
        if (this.stepCount % this.targetUpdateFrequency === 0) {
            this.updateTargetNetwork();
            console.log(`Target network updated at step ${this.stepCount}`);
        }
    }
    
    // Calculate weight change from initial weights
    calculateWeightChange() {
        let totalChange = 0;
        let count = 0;
        
        // Compare all weights
        for (let i = 0; i < this.mainNetwork.w1.length; i++) {
            const diff = this.mainNetwork.w1[i] - this.initialWeights.w1[i];
            totalChange += diff * diff;
            count++;
        }
        
        for (let i = 0; i < this.mainNetwork.w2.length; i++) {
            const diff = this.mainNetwork.w2[i] - this.initialWeights.w2[i];
            totalChange += diff * diff;
            count++;
        }
        
        return Math.sqrt(totalChange / count);
    }
    
    // End episode
    endEpisode(duration, reward) {
        this.episodeCount++;
        this.episodeDurations.push(duration);
        this.episodeRewards.push(reward);
        this.lastReward = reward;
        
        if (duration > this.bestDuration) {
            this.bestDuration = duration;
            console.log(`🎉 New best duration: ${duration} steps in episode ${this.episodeCount}!`);
        }
        
        this.lastWeightChange = this.calculateWeightChange();
        this.weightChanges.push(this.lastWeightChange);
        
        // More detailed progress logging
        if (this.episodeCount % 10 === 0 || this.episodeCount < 20) {
            const avgDuration = this.episodeDurations.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, this.episodeDurations.length);
            const avgReward = this.episodeRewards.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, this.episodeRewards.length);
            console.log(`Episode ${this.episodeCount}: Duration=${duration}, Reward=${reward.toFixed(2)}, Exploration=${this.explorationRate.toFixed(3)}, Avg10=${avgDuration.toFixed(1)}, AvgReward10=${avgReward.toFixed(1)}, WeightChange=${this.lastWeightChange.toFixed(4)}`);
        }
    }
    
    // Decay exploration rate
    decayExploration() {
        this.explorationRate = Math.max(
            this.minExplorationRate,
            this.explorationRate * this.explorationDecay
        );
    }
    
    // Get stats
    getStats() {
        return {
            episodeCount: this.episodeCount,
            bestDuration: this.bestDuration,
            lastReward: this.lastReward,
            lastWeightChange: this.lastWeightChange,
            episodeDurations: this.episodeDurations,
            episodeRewards: this.episodeRewards,
            weightChanges: this.weightChanges
        };
    }
    
    // Memory management
    manageMemoryUsage() {
        // Keep recent history only
        if (this.episodeDurations.length > 1000) {
            this.episodeDurations = this.episodeDurations.slice(-500);
            this.episodeRewards = this.episodeRewards.slice(-500);
            this.weightChanges = this.weightChanges.slice(-500);
        }
    }
    
    // Debug method to check if network is learning
    checkNetworkResponse(state) {
        const { output } = this.forwardPass(this.mainNetwork, state);
        return {
            qValues: output,
            maxQ: Math.max(...output),
            selectedAction: this.indexToAction(output.indexOf(Math.max(...output))),
            explorationRate: this.explorationRate
        };
    }
    
    // Debug method to verify gradients are flowing
    verifyLearning() {
        const sumW1 = this.mainNetwork.w1.reduce((a, b) => a + Math.abs(b), 0);
        const sumW2 = this.mainNetwork.w2.reduce((a, b) => a + Math.abs(b), 0);
        return {
            sumW1,
            sumW2,
            totalSteps: this.stepCount,
            bufferSize: this.replayBuffer.length,
            weightChange: this.lastWeightChange
        };
    }
}

