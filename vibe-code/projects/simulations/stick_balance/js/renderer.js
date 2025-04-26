/**
 * Renderer class for the stick balancing simulation
 * Handles all visual elements including the platform, stick, wheels, and environment
 */
class Renderer {
    constructor(canvas, environment) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.environment = environment;
        
        // Get world size information
        const worldInfo = environment.getWorldInfo();
        this.worldWidth = worldInfo.width;
        this.stickLength = worldInfo.stickLength;
        this.platformWidth = worldInfo.platformWidth;
        this.wheelRadius = worldInfo.wheelRadius;
        
        // Pixel scaling
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Cloud properties
        this.clouds = [];
        this.initClouds();
        
        // Wind stream particles
        this.windStreams = [];
        this.initWindStreams();
        
        // Generate grass tufts for more visual detail
        this.grassTufts = this.generateGrassTufts();
    }
    
    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Calculate scale factor (pixels per meter)
        this.scale = this.canvas.width / (this.worldWidth * 1.2); // Add some padding
        
        // Make sure there's extra room at the bottom for the wheels
        const groundOffset = this.wheelRadius * 1.5 * this.scale;
        this.groundLevel = this.canvas.height - groundOffset;
    }
    
    /**
     * Initialize clouds
     */
    initClouds() {
        // Create 3-6 random clouds in each of three layers (foreground, middle, background)
        const layers = [
            { count: Math.floor(Math.random() * 2) + 2, depth: 0.8, scale: 1.2, opacity: 0.9 },   // Foreground
            { count: Math.floor(Math.random() * 3) + 3, depth: 0.5, scale: 1.0, opacity: 0.7 },   // Middle
            { count: Math.floor(Math.random() * 4) + 4, depth: 0.2, scale: 0.8, opacity: 0.5 }    // Background
        ];
        
        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                this.clouds.push({
                    x: Math.random() * this.worldWidth - this.worldWidth / 2,
                    y: Math.random() * (this.canvas.height * 0.4),
                    width: (Math.random() * 2 + 1) * layer.scale,  // Cloud width in meters, scaled by layer
                    height: (Math.random() * 0.8 + 0.2) * layer.scale, // Cloud height in meters, scaled by layer
                    speed: 0,  // Will be updated based on wind
                    segments: Math.floor(Math.random() * 3) + 2, // Number of cloud puffs
                    density: Math.random() * 0.2 + layer.opacity, // Cloud density/opacity
                    depth: layer.depth // Parallax depth factor (0-1)
                });
            }
        });
    }
    
    /**
     * Initialize wind stream particles
     */
    initWindStreams() {
        const numStreams = 50; // Increase the number of wind stream particles
        this.windStreams = [];
        
        for (let i = 0; i < numStreams; i++) {
            this.windStreams.push(this.createWindStreamParticle());
        }
    }
    
    /**
     * Create a single wind stream particle with random properties
     */
    createWindStreamParticle() {
        return {
            x: Math.random() * this.worldWidth - this.worldWidth / 2,
            y: Math.random() * 5, // Height between 0-5 meters
            length: Math.random() * 0.3 + 0.1, // Length between 0.1-0.4 meters
            alpha: Math.random() * 0.3 + 0.1, // Transparency between 0.1-0.4
            speed: 0, // Will be updated based on wind
            waveOffset: Math.random() * Math.PI * 2 // Add wave offset for wavy motion
        };
    }
    
    /**
     * Generate random grass tufts for more detailed ground
     */
    generateGrassTufts() {
        const tufts = [];
        const numTufts = Math.floor(this.canvas.width / 15); // Tuft every 15 pixels or so
        
        for (let i = 0; i < numTufts; i++) {
            tufts.push({
                x: Math.random() * this.worldWidth - this.worldWidth / 2,
                height: Math.random() * 0.2 + 0.05, // Random height between 0.05 and 0.25 meters
                width: Math.random() * 0.1 + 0.05, // Random width between 0.05 and 0.15 meters
                shade: Math.random() * 30 // Random shade of green
            });
        }
        
        return tufts;
    }
    
    /**
     * Convert world coordinates to screen coordinates
     * @param {number} x - World x coordinate
     * @param {number} y - World y coordinate
     * @returns {Object} - Screen coordinates
     */
    worldToScreen(x, y) {
        // Convert meters to pixels and flip y-axis
        const screenX = (x + this.worldWidth / 2) * this.scale;
        const screenY = this.groundLevel - y * this.scale;
        
        return { x: screenX, y: screenY };
    }
    
    /**
     * Draw the sky and ground
     */
    drawBackground() {
        const ctx = this.ctx;
        
        // Sky (light blue)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Ground base (darker green)
        const groundLevel = this.worldToScreen(0, 0).y;
        ctx.fillStyle = '#3A7D44';
        ctx.fillRect(0, groundLevel, this.canvas.width, this.canvas.height - groundLevel);
        
        // Draw grass tufts for more detail
        this.drawGrassTufts();
        
        // Draw a soil/dirt line
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundLevel);
        ctx.lineTo(this.canvas.width, groundLevel);
        ctx.stroke();
    }
    
    /**
     * Draw individual grass tufts for more detailed ground
     */
    drawGrassTufts() {
        const ctx = this.ctx;
        const groundLevel = this.worldToScreen(0, 0).y;
        
        this.grassTufts.forEach(tuft => {
            const { x: screenX } = this.worldToScreen(tuft.x, 0);
            const tuftWidth = tuft.width * this.scale;
            const tuftHeight = tuft.height * this.scale;
            
            // Draw a grass tuft (small triangle)
            ctx.fillStyle = `rgb(76, ${157 + tuft.shade}, 76)`;
            ctx.beginPath();
            ctx.moveTo(screenX - tuftWidth / 2, groundLevel);
            ctx.lineTo(screenX, groundLevel - tuftHeight);
            ctx.lineTo(screenX + tuftWidth / 2, groundLevel);
            ctx.closePath();
            ctx.fill();
        });
    }
    
    /**
     * Draw clouds that move with the wind
     * @param {number} windForce - Current wind force
     */
    drawClouds(windForce) {
        const ctx = this.ctx;
        
        // Sort clouds by depth to ensure proper layering
        const sortedClouds = [...this.clouds].sort((a, b) => a.depth - b.depth);
        
        // Update and draw each cloud
        sortedClouds.forEach(cloud => {
            // Update cloud position based on wind, with parallax effect
            const normalizedWind = windForce / this.environment.maxWindStrength;
            
            // Slowly adjust cloud speed (deeper clouds move slower - parallax)
            cloud.speed += (normalizedWind * 0.02 - cloud.speed) * 0.01;
            cloud.x += cloud.speed * cloud.depth; // Multiply by depth for parallax effect
            
            // Wrap clouds around the screen
            if (cloud.x > this.worldWidth / 2) {
                cloud.x = -this.worldWidth / 2;
            } else if (cloud.x < -this.worldWidth / 2) {
                cloud.x = this.worldWidth / 2;
            }
            
            // Draw cloud
            const { x: screenX, y: screenY } = this.worldToScreen(cloud.x, 3 + cloud.y / this.scale);
            
            // Draw cloud segments (puffy parts)
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.density})`;
            const segmentWidth = cloud.width * this.scale / cloud.segments;
            
            for (let i = 0; i < cloud.segments; i++) {
                const segmentX = screenX + i * segmentWidth * 0.8;
                const segmentY = screenY - (i % 2) * 10; // Vary height slightly
                const segmentRadius = segmentWidth * 0.8;
                
                // Draw a circle for each cloud segment
                ctx.beginPath();
                ctx.arc(segmentX, segmentY, segmentRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    /**
     * Draw wind stream indicators
     * @param {number} windForce - Current wind force
     */
    drawWindStreams(windForce) {
        const ctx = this.ctx;
        
        // Ensure there's always some visual representation of wind streams
        // Normalize wind but ensure a minimum visual effect
        const normalizedWind = windForce / this.environment.maxWindStrength;
        
        // Wind base properties that are always visible
        const minSpeed = 0.02;
        const minAlpha = 0.15;
        const minLength = 0.05;
        
        this.windStreams.forEach(stream => {
            // Calculate wind effect - ensure minimum visibility even with zero wind
            const effectiveWind = Math.sign(normalizedWind) * Math.max(Math.abs(normalizedWind), 0.1);
            
            // Update stream position
            stream.speed = (effectiveWind * 0.1) || minSpeed; // Ensure minimum speed
            stream.x += stream.speed;
            
            // Add wavy motion that's more pronounced with stronger wind
            const waveAmplitude = 0.02 + Math.abs(effectiveWind) * 0.08;
            stream.y += Math.sin(performance.now() / 500 + stream.waveOffset) * waveAmplitude;
            
            // Screen wrapping
            if (stream.x > this.worldWidth / 2) {
                stream.x = -this.worldWidth / 2;
            } else if (stream.x < -this.worldWidth / 2) {
                stream.x = this.worldWidth / 2;
            }
            
            // Calculate screen coordinates
            const { x: startX, y: startY } = this.worldToScreen(stream.x, stream.y);
            
            // Stream length increases with wind strength
            const streamLength = minLength + Math.abs(effectiveWind) * stream.length;
            const { x: endX } = this.worldToScreen(stream.x + streamLength, stream.y);
            
            // Alpha increases with wind strength but has a minimum value
            const alphaValue = minAlpha + stream.alpha * Math.abs(effectiveWind);
            
            ctx.strokeStyle = `rgba(93, 146, 177, ${alphaValue})`;
            ctx.lineWidth = 1 + Math.abs(effectiveWind);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, startY);
            ctx.stroke();
        });
    }
    
    /**
     * Draw the platform and wheels
     * @param {Object} state - Current physics state
     */
    drawPlatform(state) {
        const ctx = this.ctx;
        
        // Safety check for invalid platform position
        const safePos = isFinite(state.platformPos) ? state.platformPos : 0;
        
        // Ensure position is within world boundaries
        const boundedPos = Math.max(
            -this.worldWidth / 2, 
            Math.min(this.worldWidth / 2, safePos)
        );
        
        // Get platform position
        const { x: centerX, y: groundY } = this.worldToScreen(boundedPos, 0);
        
        // Platform dimensions in pixels
        const platformWidth = this.platformWidth * this.scale;
        const platformHeight = platformWidth * 0.3;
        
        // Draw wheels
        const wheelRadius = this.wheelRadius * this.scale;
        const leftWheelX = centerX - platformWidth * 0.4;
        const rightWheelX = centerX + platformWidth * 0.4;
        const wheelY = groundY;
        
        // Safe wheel rotation (to prevent NaN)
        const safeRotation = isFinite(state.wheelRotation) ? state.wheelRotation : 0;
        
        // Draw wheels with rotation
        this.drawWheel(leftWheelX, wheelY, wheelRadius, safeRotation);
        this.drawWheel(rightWheelX, wheelY, wheelRadius, safeRotation);
        
        // Draw platform body (rectangle) above the wheels
        ctx.fillStyle = '#8B4513'; // Brown color
        ctx.fillRect(centerX - platformWidth / 2, groundY - platformHeight - wheelRadius * 0.2, platformWidth, platformHeight);
    }
    
    /**
     * Draw a wheel with rotation
     * @param {number} x - Wheel center x coordinate
     * @param {number} y - Wheel center y coordinate
     * @param {number} radius - Wheel radius
     * @param {number} rotation - Wheel rotation angle
     */
    drawWheel(x, y, radius, rotation) {
        const ctx = this.ctx;
        
        // Wheel rim
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel hub
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel spokes to show rotation
        ctx.strokeStyle = '#AAA';
        ctx.lineWidth = radius * 0.1;
        
        // Draw 4 spokes
        for (let i = 0; i < 4; i++) {
            const angle = rotation + i * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * radius * 0.9,
                y + Math.sin(angle) * radius * 0.9
            );
            ctx.stroke();
        }
    }
    
    /**
     * Draw the balancing stick
     * @param {Object} state - Current physics state
     */
    drawStick(state) {
        const ctx = this.ctx;
        
        // Safety checks for invalid state values
        const safePos = isFinite(state.platformPos) ? state.platformPos : 0;
        const safeAngle = isFinite(state.stickAngle) ? state.stickAngle : 0;
        
        // Ensure position is within world boundaries
        const boundedPos = Math.max(
            -this.worldWidth / 2, 
            Math.min(this.worldWidth / 2, safePos)
        );
        
        // Get platform position
        const { x: centerX, y: groundY } = this.worldToScreen(boundedPos, 0);
        
        // Platform dimensions in pixels
        const platformWidth = this.platformWidth * this.scale;
        const platformHeight = platformWidth * 0.3;
        const wheelRadius = this.wheelRadius * this.scale;
        
        // Get stick base position (on top of platform)
        const baseX = centerX;
        const baseY = groundY - platformHeight - wheelRadius * 0.2;
        
        // Calculate stick end position using angle
        const stickLength = this.stickLength * this.scale;
        const endX = baseX + Math.sin(safeAngle) * stickLength;
        const endY = baseY - Math.cos(safeAngle) * stickLength;
        
        // Make sure all values are finite before drawing
        if (!isFinite(baseX) || !isFinite(baseY) || 
            !isFinite(endX) || !isFinite(endY)) {
            console.error("Non-finite stick coordinates:", {baseX, baseY, endX, endY});
            return; // Skip drawing rather than drawing with invalid values
        }
        
        // Draw stick
        ctx.strokeStyle = '#D2691E'; // Wooden color
        ctx.lineWidth = stickLength * 0.05;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    /**
     * Update the wind indicator arrow
     * @param {number} windForce - Current wind force
     */
    updateWindIndicator(windForce) {
        const arrow = document.getElementById('windArrow');
        if (!arrow) return;
        
        // Normalize wind to -1 to 1 range
        const normalizedWind = windForce / this.environment.maxWindStrength;
        
        // Calculate rotation and strength
        const rotation = normalizedWind < 0 ? 180 : 0; // Flip if negative
        const strength = Math.abs(normalizedWind);
        
        // Always show at least a minimal wind indication
        const minStrength = 0.3;
        const displayStrength = Math.max(minStrength, strength);
        
        // Update arrow style - always visible with smooth rotation
        arrow.style.transform = `rotate(${rotation}deg) scaleX(${displayStrength})`;
        arrow.style.opacity = 0.7 + strength * 0.3; // Always visible with min 0.7 opacity
    }
    
    /**
     * Render the entire scene
     * @param {Object} state - Current physics state
     * @param {number} windForce - Current wind force
     */
    render(state, windForce) {
        try {
            // Safety check for invalid state
            if (!state || typeof state !== 'object') {
                console.error("Invalid state object passed to renderer:", state);
                // Create a default state if none provided
                state = {
                    platformPos: 0,
                    platformVel: 0,
                    stickAngle: 0,
                    stickAngularVel: 0,
                    wheelRotation: 0
                };
            }
            
            // Sanitize windForce
            const safeWindForce = isFinite(windForce) ? windForce : 0;
            
            // Clear canvas
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Draw scene elements
            this.drawBackground();
            this.drawWindStreams(safeWindForce);
            this.drawClouds(safeWindForce);
            this.drawPlatform(state);
            this.drawStick(state);
            
            // Update wind indicator
            this.updateWindIndicator(safeWindForce);
        } catch (error) {
            console.error("Error in render method:", error);
            // If rendering fails, at least draw the background
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawBackground();
        }
    }
};