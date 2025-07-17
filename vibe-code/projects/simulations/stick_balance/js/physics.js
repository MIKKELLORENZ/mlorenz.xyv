/**
 * Physics engine for the stick balancing simulation
 */
class Physics {
    constructor() {
        // Physics constants
        this.gravity = 9.8;    // Gravity in m/s^2
        this.timestep = 0.016;  // Shorter timestep for better stability (60 FPS)
        this.friction = 0.1;   // Reduced friction for more responsiveness
        
        // Stick properties
        this.stickLength = 2.0;      // Length of the stick in meters
        this.stickMass = 0.5;        // Lighter stick for easier balancing
        
        // Platform properties
        this.platformWidth = 1.0;    // Width of the platform in meters
        this.platformMass = 3.0;     // Lighter platform for better responsiveness
        this.wheelRadius = 0.2;      // Radius of the wheels in meters
        this.maxForce = 20.0;        // Increased max force for better control
        
        // Boundaries
        this.worldWidth = 10.0;      // Width of the world in meters
        
        // Add angular damping to make balancing more feasible
        this.angularDamping = 0.02;  // Reduced damping for more natural movement
    }
    
    /**
     * Update the physics state
     * @param {Object} state - Current state object
     * @param {number} action - Force to apply (-1 to 1)
     * @param {number} windForce - Current wind force
     * @returns {Object} - New state after physics update
     */
    update(state, action, windForce) {
        // Safety check for invalid input values
        if (!isFinite(action)) action = 0;
        if (!isFinite(windForce)) windForce = 0;
        
        // Ensure state values are valid, revert to safe defaults if necessary
        const safeState = {
            platformPos: isFinite(state.platformPos) ? state.platformPos : 0,
            platformVel: isFinite(state.platformVel) ? state.platformVel : 0,
            stickAngle: isFinite(state.stickAngle) ? state.stickAngle : 0,
            stickAngularVel: isFinite(state.stickAngularVel) ? state.stickAngularVel : 0,
            wheelRotation: isFinite(state.wheelRotation) ? state.wheelRotation : 0
        };
        
        // Scale the action to actual force
        const force = action * this.maxForce;
        
        // Create a copy of the state
        const newState = { ...safeState };
        
        // Calculate forces and accelerations
        
        // Platform motion
        // Apply force and friction
        const platformAcc = (force - this.friction * Math.sign(newState.platformVel)) / this.platformMass;
        newState.platformVel += platformAcc * this.timestep;
        newState.platformPos += newState.platformVel * this.timestep;
        
        // Update wheel rotation based on platform velocity
        newState.wheelRotation += (newState.platformVel / this.wheelRadius) * this.timestep;
        // Keep wheel rotation between 0 and 2π
        newState.wheelRotation = newState.wheelRotation % (2 * Math.PI);
        
        // Enforce boundaries for the platform
        if (newState.platformPos < -this.worldWidth / 2) {
            newState.platformPos = -this.worldWidth / 2;
            newState.platformVel = 0;
        } else if (newState.platformPos > this.worldWidth / 2) {
            newState.platformPos = this.worldWidth / 2;
            newState.platformVel = 0;
        }
        
        // Stick physics
        // Calculate torque on the stick from gravity
        const gravityTorque = this.stickMass * this.gravity * (this.stickLength / 2) * Math.sin(newState.stickAngle);
        
        // Add the torque from horizontal acceleration of the platform
        const accelerationTorque = -this.stickMass * platformAcc * (this.stickLength / 2) * Math.cos(newState.stickAngle);
        
        // Add the torque from wind force
        const windTorque = windForce * (this.stickLength / 2) * Math.cos(newState.stickAngle);
        
        // Total torque
        const totalTorque = gravityTorque + accelerationTorque + windTorque;
        
        // Moment of inertia for a rod rotating around one end
        const momentOfInertia = (this.stickMass * Math.pow(this.stickLength, 2)) / 3;
        
        // Calculate angular acceleration
        const angularAcc = totalTorque / momentOfInertia;
        
        // Update angular velocity with damping for more stable learning
        newState.stickAngularVel += angularAcc * this.timestep;
        newState.stickAngularVel *= (1 - this.angularDamping);  // Apply damping
        
        // Update angle
        newState.stickAngle += newState.stickAngularVel * this.timestep;
        
        // Normalize the angle to be within -π and π
        while (newState.stickAngle > Math.PI) {
            newState.stickAngle -= 2 * Math.PI;
        }
        while (newState.stickAngle < -Math.PI) {
            newState.stickAngle += 2 * Math.PI;
        }
        
        // Final safety check to ensure all values are finite
        // If any value becomes NaN or Infinite, the simulation would break
        if (!Object.values(newState).every(isFinite)) {
            console.error("Non-finite value detected in physics state:", newState, "Input state:", state, "Action:", action, "Wind:", windForce);
            // Return a safe state instead
            return this.createInitialState(5); // Reset with a small angle variation
        }
        
        return newState;
    }
    
    /**
     * Check if the simulation has failed (stick has fallen)
     * @param {Object} state - Current physics state
     * @returns {boolean} - True if the stick has fallen
     */
    hasStickFallen(state) {
        // Consider the stick fallen if it's tilted more than 30 degrees (more forgiving for learning)
        return Math.abs(state.stickAngle) > Math.PI / 6; // 30 degrees
    }
    
    /**
     * Initialize a new physics state with a slight random angle
     * @param {number} initialAngleVariation - Maximum angle variation in degrees
     * @returns {Object} - New state object
     */
    createInitialState(initialAngleVariation) {
        // Convert degrees to radians
        const maxAngleRad = (initialAngleVariation * Math.PI) / 180;
        
        // Random angle between -maxAngleRad and maxAngleRad
        const randomAngle = (Math.random() * 2 - 1) * maxAngleRad;
        
        return {
            platformPos: 0,                // Platform position in the middle
            platformVel: 0,                // Initial platform velocity
            stickAngle: randomAngle,       // Slight random angle
            stickAngularVel: 0,            // Initial angular velocity
            wheelRotation: 0               // Initial wheel rotation
        };
    }
};