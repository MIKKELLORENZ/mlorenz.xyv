/**
 * Environment for the stick balance simulation
 * Manages wind, rewards, and episode state
 */
class Environment {
    constructor(params) {
        this.physics = new Physics();
        
        // Wind parameters
        this.maxWindStrength = params.windStrength || 5.0;
        this.currentWind = 0;
        this.windChangeSpeed = 0.05; // How quickly the wind changes
        this.targetWind = 0;
        this.windUpdateInterval = 100; // Update target wind every 100 steps
        this.stepCount = 0;
        
        // Episode parameters
        this.initialAngleVariation = params.initialAngleVariation || 5; // Degrees
        this.maxSteps = 10000; // Maximum steps per episode
        
        // Reward shaping parameters
        this.lastAngle = 0; // Track previous angle for progress rewards
        this.progressRewardWeight = 2.0; // Weight for progress rewards
        this.stablePositionRewardWeight = 1.0; // Reward for keeping the platform centered
        
        // Curriculum learning
        this.episodeCount = 0;
        
        // Debug and reward normalization
        this.debug = params.debug || false;
        this.rewardNormalization = params.rewardNormalization || false;
        this.rewardStats = { mean: 0, std: 1, count: 0 };
        
        // Initialize state
        this.reset();
    }
    
    /**
     * Reset the environment to start a new episode
     * Simplified curriculum learning for faster learning
     */
    reset() {
        // Update episode count for curriculum learning
        this.episodeCount++;
        
        // Much more aggressive curriculum progression
        let windScale = this.episodeCount < 50 ? 0.0 : Math.min(1.0, (this.episodeCount-50) / 200);
        let angleScale = this.episodeCount < 20 ? 0.1 : Math.min(1.0, (this.episodeCount-20) / 100);
        
        let effectiveWindStrength = this.maxWindStrength * windScale;
        let effectiveAngleVariation = Math.min(
            this.initialAngleVariation,
            0.5 + (this.initialAngleVariation - 0.5) * angleScale
        );
        
        // Initialize physics state with progressive difficulty
        this.state = this.physics.createInitialState(effectiveAngleVariation);
        
        // Store maximum wind strength but set current to 0
        this.maxEffectiveWindStrength = effectiveWindStrength;
        this.currentWind = 0;
        this.targetWind = 0;
        
        this.stepCount = 0;
        this.episodeOver = false;
        this.totalReward = 0;
        this.lastAngle = this.state.stickAngle;
        
        // Log curriculum progress occasionally
        if (this.episodeCount % 20 === 0 && this.episodeCount < 200) {
            console.log(`Curriculum: Episode ${this.episodeCount}, Wind scale: ${windScale.toFixed(3)}, Angle scale: ${angleScale.toFixed(3)}, Max angle: ${effectiveAngleVariation.toFixed(2)}°`);
        }
        
        return this.state;
    }
    
    /**
     * Update wind forces
     */
    updateWind() {
        this.stepCount++;
        
        // Periodically change target wind
        if (this.stepCount % this.windUpdateInterval === 0) {
            this.targetWind = (Math.random() * 2 - 1) * this.maxEffectiveWindStrength;
        }
        
        // Smoothly transition current wind towards target
        this.currentWind += (this.targetWind - this.currentWind) * this.windChangeSpeed;
        
        return this.currentWind;
    }
    
    /**
     * Calculate reward based on current state
     */
    calculateReward() {
        const stickAngle = this.state.stickAngle;
        const platformVel = this.state.platformVel;
        const platformPos = this.state.platformPos;
        
        // If stick has fallen, give large negative reward
        if (this.physics.hasStickFallen(this.state)) {
            return -50.0; // Strong negative signal for failure
        }
        
        // Base reward for staying upright (every step)
        let reward = 2.0; // Increased base reward
        
        // Strong bonus for being very upright (within 1 degree)
        if (Math.abs(stickAngle) < Math.PI/180) {
            reward += 5.0;
        }
        // Good bonus for being reasonably upright (within 5 degrees)
        else if (Math.abs(stickAngle) < Math.PI/36) {
            reward += 3.0;
        }
        // Moderate bonus for being somewhat upright (within 10 degrees)
        else if (Math.abs(stickAngle) < Math.PI/18) {
            reward += 1.0;
        }
        
        // Angle penalty - quadratic to encourage staying very upright
        const normalizedAngle = Math.abs(stickAngle) / (Math.PI / 4);
        const anglePenalty = normalizedAngle * normalizedAngle * 3.0;
        
        // Small penalty for platform velocity to encourage smooth control
        const velocityPenalty = Math.min(2.0, Math.abs(platformVel) * 0.2);
        
        // Small penalty for being far from center
        const positionPenalty = Math.min(1.0, Math.abs(platformPos) * 0.2);
        
        // Combined reward
        reward -= anglePenalty;
        reward -= velocityPenalty;
        reward -= positionPenalty;
        
        // Store current angle for next time
        this.lastAngle = stickAngle;
        
        return reward;
    }
    
    /**
     * Take an action in the environment
     * @param {number} action - Action to take (-1 to 1)
     * @returns {Object} - Object containing next state, reward, and whether episode is done
     */
    step(action) {
        this.lastAction = action;
        
        // Update wind
        const windForce = this.updateWind();
        
        // Update physics
        this.state = this.physics.update(this.state, action, windForce);
        
        // Calculate reward
        const reward = this.calculateReward();
        this.totalReward += reward;
        
        // Check if episode is over
        const done = this.physics.hasStickFallen(this.state) || this.stepCount >= this.maxSteps;
        this.episodeOver = done;
        
        return {
            state: this.state,
            reward: reward,
            done: done,
            wind: this.currentWind,
            totalReward: this.totalReward,
            steps: this.stepCount
        };
    }
    
    /**
     * Get whether the episode is completed
     */
    isDone() {
        return this.episodeOver;
    }
    
    /**
     * Get world size information (for rendering)
     */
    getWorldInfo() {
        return {
            width: this.physics.worldWidth,
            stickLength: this.physics.stickLength,
            platformWidth: this.physics.platformWidth,
            wheelRadius: this.physics.wheelRadius
        };
    }
    
    /**
     * Get normalized wind strength (-1 to 1)
     */
    getNormalizedWind() {
        return this.currentWind / this.maxWindStrength;
    }
    
    /**
     * Toggle debug mode
     * @param {boolean} enabled - Enable or disable debug mode
     */
    setDebugMode(enabled) {
        this.debug = !!enabled;
    }
};