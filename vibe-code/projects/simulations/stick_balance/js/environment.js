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
     * Now implements curriculum learning for smoother progression
     */
    reset() {
        // Update episode count for curriculum learning
        this.episodeCount++;
        
        // Make first 300 episodes much easier (was 100)
        let windScale = this.episodeCount < 20 ? 0.1 : Math.min(1.0, (this.episodeCount-20) / 200 + 0.1);
        let angleScale = this.episodeCount < 20 ? 0.5 : Math.min(1.0, (this.episodeCount-20) / 100 + 0.5);
        let effectiveWindStrength = this.maxWindStrength * windScale;
        let effectiveAngleVariation = Math.min(
            this.initialAngleVariation,
            1.0 + (this.initialAngleVariation - 1.0) * angleScale
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
        // Higher rewards for keeping the stick upright
        const normalizedAngle = Math.abs(this.state.stickAngle) / (Math.PI / 2);
        // Make angle penalty less steep and less harsh
        const anglePenalty = Math.pow(normalizedAngle, 1.1) * 3.0;
        // Penalty for excessive velocity
        const velocityPenalty = Math.min(1, Math.pow(Math.abs(this.state.platformVel) / 3, 2) * 0.15);
        // Increase base reward and add small positive per-timestep reward
        let reward = 2.5 + 0.1;
        // Progress reward
        const angleDifference = Math.abs(this.lastAngle) - Math.abs(this.state.stickAngle);
        const progressReward = angleDifference * this.progressRewardWeight * 2.0;
        // Stable position reward
        const positionPenalty = Math.min(1, Math.pow(Math.abs(this.state.platformPos) / 2.5, 2));
        const stablePositionReward = (1 - positionPenalty) * this.stablePositionRewardWeight;
        // Bonus for very upright stick
        const uprightBonus = (Math.abs(this.state.stickAngle) < (Math.PI/36)) ? 1.0 : 0.0; // <5 deg
        // Penalty for large change in platform velocity (jerk)
        if (typeof this._lastPlatformVel === 'undefined') this._lastPlatformVel = this.state.platformVel;
        const platformAccel = Math.abs(this.state.platformVel - this._lastPlatformVel);
        const accelPenalty = Math.min(0.5, platformAccel * 0.1);
        this._lastPlatformVel = this.state.platformVel;
        // Apply penalties and additional rewards
        reward -= anglePenalty;
        reward -= velocityPenalty;
        reward -= accelPenalty;
        reward += progressReward;
        reward += stablePositionReward;
        reward += uprightBonus;
        // Small penalty for using extreme actions
        const actionPenalty = Math.pow(Math.abs(this.lastAction), 1.5) * 0.10;
        reward -= actionPenalty;
        this.lastAngle = this.state.stickAngle;
        if (this.physics.hasStickFallen(this.state)) {
            reward = -6.0;
        }
        // Reward normalization (optional, only here)
        if (this.rewardNormalization) {
            this.rewardStats.count++;
            const delta = reward - this.rewardStats.mean;
            this.rewardStats.mean += delta / this.rewardStats.count;
            if (this.rewardStats.count > 1) {
                const delta2 = reward - this.rewardStats.mean;
                this.rewardStats.std = Math.sqrt(((this.rewardStats.count - 2) * Math.pow(this.rewardStats.std, 2) + delta * delta2) / (this.rewardStats.count - 1));
            }
            if (this.rewardStats.std > 1e-6) {
                reward = (reward - this.rewardStats.mean) / this.rewardStats.std;
            }
        }
        // Debug logging (more details for early episodes)
        if ((this.debug && this.stepCount % 10 === 0) || this.episodeCount < 5) {
            console.log(`[Env] Ep${this.episodeCount} Step${this.stepCount} | Reward: ${reward.toFixed(2)} | AnglePenalty: ${anglePenalty.toFixed(2)} | VelPenalty: ${velocityPenalty.toFixed(2)} | AccelPenalty: ${accelPenalty.toFixed(2)} | Progress: ${progressReward.toFixed(2)} | Stable: ${stablePositionReward.toFixed(2)} | UprightBonus: ${uprightBonus.toFixed(2)} | ActionPenalty: ${actionPenalty.toFixed(2)}`);
        }
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