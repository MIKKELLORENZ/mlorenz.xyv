// Bayesian Optimization Playground - Main JavaScript

class BayesianOptimizer {
    constructor() {
        this.observations = [];
        this.parameters = [];
        this.acquisitionFunction = 'ei'; // expected improvement
    }

    addObservation(params, value) {
        this.observations.push({ params: [...params], value });
    }

    // Simple Gaussian Process approximation
    predict(testParams) {
        if (this.observations.length === 0) {
            return { mean: 0, std: 1 };
        }

        // Simple distance-based prediction
        let weightedSum = 0;
        let totalWeight = 0;
        let variance = 0;

        for (const obs of this.observations) {
            const distance = this.euclideanDistance(testParams, obs.params);
            const weight = Math.exp(-distance * 2); // RBF kernel approximation
            weightedSum += weight * obs.value;
            totalWeight += weight;
        }

        const mean = totalWeight > 0 ? weightedSum / totalWeight : 0;
        
        // Calculate variance based on distance to nearest points
        const minDistance = Math.min(...this.observations.map(obs => 
            this.euclideanDistance(testParams, obs.params)
        ));
        const std = Math.exp(-minDistance) * 2;

        return { mean, std };
    }

    euclideanDistance(a, b) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
    }

    // Expected Improvement acquisition function
    expectedImprovement(params) {
        const prediction = this.predict(params);
        const bestValue = Math.max(...this.observations.map(obs => obs.value), 0);
        const improvement = prediction.mean - bestValue;
        
        if (prediction.std === 0) return 0;
        
        const z = improvement / prediction.std;
        const phi = this.normalCDF(z);
        const pdf = this.normalPDF(z);
        
        return improvement * phi + prediction.std * pdf;
    }

    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    normalPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }

    erf(x) {
        // Approximation of error function
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    suggest(bounds, numSuggestions = 1) {
        if (bounds.length === 0) return [];

        const suggestions = [];
        const numCandidates = 100;

        for (let i = 0; i < numSuggestions; i++) {
            let bestCandidate = null;
            let bestScore = -Infinity;

            for (let j = 0; j < numCandidates; j++) {
                const candidate = bounds.map(bound => 
                    Math.random() * (bound.max - bound.min) + bound.min
                );
                
                const score = this.expectedImprovement(candidate);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = candidate;
                }
            }

            suggestions.push(bestCandidate);
        }

        return suggestions;
    }
}

// Coffee Demo Implementation
class CoffeeDemo {
    constructor() {
        this.optimizer = new BayesianOptimizer();
        this.currentParams = [9, 5, 93, 18]; // pressure, grind, temperature, coffee_amount
        this.bounds = [
            { min: 6, max: 12 },   // pressure
            { min: 1, max: 10 },   // grind
            { min: 85, max: 100 }, // temperature
            { min: 14, max: 22 }   // coffee_amount
        ];
        this.paramNames = ['Pressure', 'Grind Size', 'Temperature', 'Coffee Amount'];
        this.paramUnits = ['PSI', '', '°C', 'g'];
        this.history = [];
        this.bestBrew = null;
        this.isApplyingSuggestion = false;
        
        // Preload audio for instant playback
        this.coffeeAudio = new Audio('coffee_maker.mp3');
        this.coffeeAudio.preload = 'auto';
        this.coffeeAudio.load();
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.updateUncertaintyChart();
    }

    initializeElements() {
        this.pressureSlider = document.getElementById('pressure');
        this.grindSlider = document.getElementById('grind');
        this.temperatureSlider = document.getElementById('temperature');
        this.coffeeAmountSlider = document.getElementById('coffee-amount');
        
        this.pressureValue = document.getElementById('pressure-value');
        this.grindValue = document.getElementById('grind-value');
        this.temperatureValue = document.getElementById('temperature-value');
        this.coffeeAmountValue = document.getElementById('coffee-amount-value');
        
        this.currentScoreDisplay = document.getElementById('current-score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.bestParamsDisplay = document.getElementById('best-params');
        this.suggestionDisplay = document.getElementById('suggestion-display');
        this.uncertaintyChart = document.getElementById('uncertainty-chart');
        this.parameterHeatmap = document.getElementById('parameter-heatmap');
        this.historyScatter = document.getElementById('history-scatter');
        
        this.brewCoffeeBtn = document.getElementById('brew-coffee');
        this.sliders = [this.pressureSlider, this.grindSlider, this.temperatureSlider, this.coffeeAmountSlider];
    }

    setupEventListeners() {
        this.sliders.forEach((slider, index) => {
            slider.addEventListener('input', (e) => {
                if (!this.isApplyingSuggestion) {
                    this.currentParams[index] = parseFloat(e.target.value);
                    this.updateDisplay();
                }
            });
        });

        this.brewCoffeeBtn.addEventListener('click', () => this.brewCoffee());
    }

    // True function we're trying to optimize (hidden from user)
    trueCoffeeFunction(pressure, grind, temperature, coffeeAmount) {
        // Realistic espresso scoring based on actual brewing science
        
        // PRESSURE (6-12 PSI): Sweet spot around 9-10 PSI
        let pressureScore;
        if (pressure < 8) {
            pressureScore = 0.3 + (pressure - 6) * 0.2; // Under-extraction
        } else if (pressure <= 10) {
            pressureScore = 0.7 + (pressure - 8) * 0.15; // Optimal range
        } else {
            pressureScore = 1.0 - (pressure - 10) * 0.1; // Over-extraction
        }
        
        // GRIND SIZE (1-10, where 1=very fine, 10=very coarse): Optimal around 4-6
        let grindScore;
        if (grind < 3) {
            grindScore = 0.2 + grind * 0.15; // Too fine = over-extraction, bitter
        } else if (grind <= 6) {
            grindScore = 0.65 + (grind - 3) * 0.1; // Sweet spot
        } else {
            grindScore = 0.95 - (grind - 6) * 0.12; // Too coarse = under-extraction, sour
        }
        
        // TEMPERATURE (85-100°C): Optimal around 90-95°C
        let tempScore;
        if (temperature < 88) {
            tempScore = 0.3 + (temperature - 85) * 0.1; // Too cold = under-extraction
        } else if (temperature <= 96) {
            tempScore = 0.6 + (temperature - 88) * 0.05; // Optimal range
        } else {
            tempScore = 1.0 - (temperature - 96) * 0.08; // Too hot = bitter compounds
        }
        
        // COFFEE AMOUNT (14-22g): Optimal around 18-20g for double shot
        let amountScore;
        if (coffeeAmount < 16) {
            amountScore = 0.4 + (coffeeAmount - 14) * 0.15; // Too little = weak, sour
        } else if (coffeeAmount <= 20) {
            amountScore = 0.7 + (coffeeAmount - 16) * 0.075; // Optimal range
        } else {
            amountScore = 1.0 - (coffeeAmount - 20) * 0.05; // Too much = over-extraction, bitter
        }
        
        // REALISTIC INTERACTIONS
        
        // Pressure-Grind interaction: Higher pressure needs coarser grind
        const pressureGrindInteraction = Math.max(0, 1 - Math.abs((pressure - 9) / 2 - (grind - 5) / 3) * 0.3);
        
        // Temperature-Grind interaction: Higher temp can work with coarser grind
        const tempGrindInteraction = Math.max(0, 1 - Math.abs((temperature - 92) / 4 - (grind - 5) / 2) * 0.2);
        
        // Amount-Pressure interaction: More coffee needs slightly higher pressure
        const amountPressureInteraction = Math.max(0, 1 - Math.abs((coffeeAmount - 18) / 3 - (pressure - 9.5) / 1.5) * 0.25);
        
        // Temperature-Amount interaction: More coffee can handle slightly higher temp
        const tempAmountInteraction = Math.max(0, 1 - Math.abs((temperature - 93) / 3 - (coffeeAmount - 18) / 2) * 0.15);
        
        // Combine base scores (70% weight) with interactions (30% weight)
        const baseScore = (pressureScore + grindScore + tempScore + amountScore) / 4;
        const interactionScore = (pressureGrindInteraction + tempGrindInteraction + 
                                amountPressureInteraction + tempAmountInteraction) / 4;
        
        let finalScore = baseScore * 0.7 + interactionScore * 0.3;
        
        // Convert to 0-10 scale
        finalScore = finalScore * 10;
        
        // Add realistic noise (coffee brewing has natural variation)
        const noise = (Math.random() - 0.5) * 0.4;
        finalScore += noise;
        
        // Ensure realistic score distribution (perfect 10 is extremely rare)
        finalScore = Math.max(0, Math.min(9.85, finalScore));
        
        return finalScore;
    }

    getCurrentScore() {
        return this.trueCoffeeFunction(...this.currentParams);
    }

    updateDisplay() {
        if (this.pressureValue) this.pressureValue.textContent = this.currentParams[0].toFixed(1);
        if (this.grindValue) this.grindValue.textContent = this.currentParams[1].toFixed(1);
        if (this.temperatureValue) this.temperatureValue.textContent = this.currentParams[2].toFixed(1);
        if (this.coffeeAmountValue) this.coffeeAmountValue.textContent = this.currentParams[3].toFixed(1);
        
        if (this.pressureSlider) this.pressureSlider.value = this.currentParams[0];
        if (this.grindSlider) this.grindSlider.value = this.currentParams[1];
        if (this.temperatureSlider) this.temperatureSlider.value = this.currentParams[2];
        if (this.coffeeAmountSlider) this.coffeeAmountSlider.value = this.currentParams[3];
        
        // Only show score if we've brewed coffee, otherwise show placeholder
        if (this.history.length === 0) {
            if (this.currentScoreDisplay) {
                this.currentScoreDisplay.textContent = '?';
                this.currentScoreDisplay.style.color = '#999';
            }
        } else {
            // Find if we have a brew that exactly matches current parameters
            const matchingBrew = this.history.find(brew => 
                this.currentParams.every((param, index) => 
                    Math.abs(param - brew.params[index]) < 0.1
                )
            );
            
            if (matchingBrew && this.currentScoreDisplay) {
                this.currentScoreDisplay.textContent = matchingBrew.score.toFixed(2);
                const scoreColor = matchingBrew.score > 8 ? '#4CAF50' : matchingBrew.score > 6 ? '#FF9800' : '#f44336';
                this.currentScoreDisplay.style.color = scoreColor;
            } else if (this.currentScoreDisplay) {
                this.currentScoreDisplay.textContent = '?';
                this.currentScoreDisplay.style.color = '#999';
            }
        }
        
        this.updateUncertaintyChart();
        this.updateParameterHeatmap();
        this.updateHistoryScatter();
    }

    getRecommendation() {
        if (this.optimizer.observations.length === 0) {
            if (this.suggestionDisplay) {
                this.suggestionDisplay.innerHTML = '<p>Brew some coffee first to get recommendations!</p>';
            }
            return;
        }

        const suggestions = this.optimizer.suggest(this.bounds, 1);
        if (suggestions.length > 0) {
            const suggestion = suggestions[0];
            
            // Store the suggestion for later use
            this.currentSuggestion = suggestion;
            
            if (this.suggestionDisplay) {
                // Clear existing content
                this.suggestionDisplay.innerHTML = '';
                
                // Create main container
                const suggestionDiv = document.createElement('div');
                suggestionDiv.className = 'suggestion';
                
                // Create title
                const title = document.createElement('p');
                title.innerHTML = '<strong>Recommended Settings:</strong>';
                suggestionDiv.appendChild(title);
                
                // Create parameters container
                const paramsDiv = document.createElement('div');
                paramsDiv.className = 'suggestion-params';
                
                // Add parameter values
                const paramNames = ['Pressure', 'Grind Size', 'Temperature', 'Coffee Amount'];
                const paramUnits = ['PSI', '', '°C', 'g'];
                
                suggestion.forEach((value, index) => {
                    const paramDiv = document.createElement('div');
                    paramDiv.className = 'suggestion-param';
                    paramDiv.textContent = `${paramNames[index]}: ${value.toFixed(1)}${paramUnits[index]}`;
                    paramsDiv.appendChild(paramDiv);
                });
                
                suggestionDiv.appendChild(paramsDiv);
                
                // Create buttons container
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'suggestion-buttons';
                
                // Create Apply button
                const applyBtn = document.createElement('button');
                applyBtn.className = 'suggestion-btn apply';
                applyBtn.textContent = 'Apply Recommendation';
                applyBtn.style.display = 'inline-block';
                applyBtn.style.visibility = 'visible';
                applyBtn.addEventListener('click', () => {
                    console.log('Apply button clicked!', this.currentSuggestion);
                    if (this.currentSuggestion) {
                        this.applySuggestion(this.currentSuggestion);
                    }
                });
                
                // Create Get New button
                const newBtn = document.createElement('button');
                newBtn.className = 'suggestion-btn';
                newBtn.textContent = 'Get New Suggestion';
                newBtn.addEventListener('click', () => {
                    this.getRecommendation();
                });
                
                buttonsDiv.appendChild(applyBtn);
                buttonsDiv.appendChild(newBtn);
                suggestionDiv.appendChild(buttonsDiv);
                
                // Add to display
                this.suggestionDisplay.appendChild(suggestionDiv);
                
                console.log('Buttons created and added:', { applyBtn, newBtn });
            }
            
            this.showSuggestedInUncertainty(suggestion);
        }
    }

    applySuggestion(suggestion) {
        this.isApplyingSuggestion = true;
        
        // Show spinner on brew button
        const spinner = document.getElementById('brew-spinner');
        const btnText = this.brewCoffeeBtn.querySelector('.btn-text');
        spinner.classList.add('active');
        btnText.textContent = 'Adjusting...';
        this.brewCoffeeBtn.disabled = true;
        
        // Animate sliders to new positions
        this.animateToSuggestion(suggestion, () => {
            // Re-enable controls after animation
            this.isApplyingSuggestion = false;
            spinner.classList.remove('active');
            btnText.textContent = 'Brew Coffee';
            this.brewCoffeeBtn.disabled = false;
        });
    }
    
    animateToSuggestion(suggestion, callback) {
        const startParams = [...this.currentParams];
        const targetParams = [...suggestion];
        const duration = 1000; // 1 second
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate between start and target
            for (let i = 0; i < 4; i++) {
                this.currentParams[i] = startParams[i] + (targetParams[i] - startParams[i]) * easeProgress;
            }
            
            this.updateDisplay();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.currentParams = [...targetParams];
                this.updateDisplay();
                callback();
            }
        };
        
        animate();
    }
    
    showSuggestedInUncertainty(suggestion) {
        // Show suggested values in uncertainty chart
        this.paramNames.forEach((name, index) => {
            const suggestedElement = document.querySelector(`#uncertainty-chart .uncertainty-param:nth-child(${index + 1}) .uncertainty-suggested`);
            if (suggestedElement) {
                const percentage = ((suggestion[index] - this.bounds[index].min) / (this.bounds[index].max - this.bounds[index].min)) * 100;
                suggestedElement.style.left = `${percentage}%`;
                suggestedElement.classList.add('visible');
            }
        });
    }
    
    updateUncertaintyChart() {
        if (this.optimizer.observations.length === 0) {
            if (this.uncertaintyChart) {
                this.uncertaintyChart.innerHTML = '<p>Brew coffee to see uncertainty bands</p>';
            }
            return;
        }
        
        let chartHTML = '';
        
        this.paramNames.forEach((name, index) => {
            const min = this.bounds[index].min;
            const max = this.bounds[index].max;
            const current = this.currentParams[index];
            
            // Calculate uncertainty band based on observations
            const { mean, std } = this.calculateParameterUncertainty(index);
            const uncertaintyStart = Math.max(0, ((mean - std - min) / (max - min)) * 100);
            const uncertaintyWidth = Math.min(100, ((2 * std) / (max - min)) * 100);
            const currentPos = ((current - min) / (max - min)) * 100;
            
            chartHTML += `
                <div class="uncertainty-param">
                    <div class="uncertainty-param-name">${name}</div>
                    <div class="uncertainty-bar">
                        <div class="uncertainty-band" style="left: ${uncertaintyStart}%; width: ${uncertaintyWidth}%;"></div>
                        <div class="uncertainty-current" style="left: ${currentPos}%;"></div>
                        <div class="uncertainty-suggested"></div>
                    </div>
                </div>
            `;
        });
        
        if (this.uncertaintyChart) {
            this.uncertaintyChart.innerHTML = chartHTML;
        }
    }
    
    calculateParameterUncertainty(paramIndex) {
        if (this.optimizer.observations.length === 0) {
            return { mean: this.currentParams[paramIndex], std: 1 };
        }
        
        // Calculate weighted average and standard deviation for this parameter
        let weightedSum = 0;
        let totalWeight = 0;
        let weightedSquareSum = 0;
        
        this.optimizer.observations.forEach(obs => {
            const weight = obs.value / 10; // Use score as weight
            weightedSum += weight * obs.params[paramIndex];
            weightedSquareSum += weight * Math.pow(obs.params[paramIndex], 2);
            totalWeight += weight;
        });
        
        const mean = totalWeight > 0 ? weightedSum / totalWeight : this.currentParams[paramIndex];
        const variance = totalWeight > 0 ? (weightedSquareSum / totalWeight) - Math.pow(mean, 2) : 1;
        const std = Math.sqrt(Math.max(0.1, variance));
        
        return { mean, std };
    }
    
    updateBestBrew() {
        if (this.history.length === 0) {
            this.bestScoreDisplay.textContent = 'No brews yet';
            this.bestParamsDisplay.innerHTML = '';
            return;
        }
        
        this.bestBrew = this.history.reduce((best, current) => 
            current.score > best.score ? current : best
        );
        
        this.bestScoreDisplay.textContent = this.bestBrew.score.toFixed(2);
        this.bestParamsDisplay.innerHTML = `
            <div>Pressure: ${this.bestBrew.params[0].toFixed(1)} PSI</div>
            <div>Grind: ${this.bestBrew.params[1].toFixed(1)}</div>
            <div>Temp: ${this.bestBrew.params[2].toFixed(1)}°C</div>
            <div>Amount: ${this.bestBrew.params[3].toFixed(1)}g</div>
        `;
    }
    
    applyBestSettings() {
        if (this.bestBrew) {
            this.currentParams = [...this.bestBrew.params];
            this.updateDisplay();
        }
    }

    brewCoffee() {
        // Play preloaded coffee maker sound immediately
        this.coffeeAudio.currentTime = 0; // Reset to beginning
        this.coffeeAudio.play().catch(e => console.log('Audio failed to play:', e));
        
        // Disable button and show spinner
        this.brewCoffeeBtn.disabled = true;
        const spinner = document.getElementById('brew-spinner');
        const btnText = this.brewCoffeeBtn.querySelector('.btn-text');
        
        spinner.classList.add('active');
        btnText.textContent = 'Brewing...';
        
        // Start brewing animation
        this.startBrewingAnimation();
        
        // Simulate brewing process with 2 second delay
        setTimeout(() => {
            const score = this.getCurrentScore();
            this.optimizer.addObservation(this.currentParams, score);
            this.history.push({ params: [...this.currentParams], score, timestamp: new Date() });
            
            // Stop brewing animation
            this.stopBrewingAnimation();
            
            // Re-enable button and hide spinner
            this.brewCoffeeBtn.disabled = false;
            spinner.classList.remove('active');
            btnText.textContent = 'Brew Coffee';
            
            this.updateBestBrew();
            this.getRecommendation();
            this.updateDisplay(); // Force display update to show the new score
        }, 2000);
    }
    
    startBrewingAnimation() {
        // Reset any previous states
        const coffeeInCup = document.getElementById('coffee-in-cup');
        const steam = document.getElementById('steam');
        const coffeeDrops = document.getElementById('coffee-drops');
        
        // Clear any existing classes
        if (coffeeInCup) {
            coffeeInCup.classList.remove('filling', 'filled');
        }
        if (steam) steam.classList.remove('active');
        if (coffeeDrops) coffeeDrops.classList.remove('active');
        
        // Animate water flow
        const waterFlow = document.getElementById('water-flow');
        const coffeeStream = document.getElementById('coffee-stream');
        const brewingLight = document.getElementById('brewing-light');
        
        // Start brewing light
        if (brewingLight) brewingLight.classList.add('active');
        
        // Start water flow after 200ms
        setTimeout(() => {
            if (waterFlow) waterFlow.classList.add('active');
        }, 200);
        
        // Start coffee stream after 400ms
        setTimeout(() => {
            if (coffeeStream) coffeeStream.classList.add('active');
        }, 400);
        
        // Fill cup after 600ms
        setTimeout(() => {
            if (coffeeInCup) {
                coffeeInCup.classList.add('filling');
            }
        }, 600);
        
        // Start steam from cup after 800ms
        setTimeout(() => {
            if (steam) steam.classList.add('active');
        }, 800);
        
        // Start coffee drops after 1200ms
        setTimeout(() => {
            if (coffeeDrops) coffeeDrops.classList.add('active');
        }, 1200);
    }
    
    stopBrewingAnimation() {
        const waterFlow = document.getElementById('water-flow');
        const coffeeStream = document.getElementById('coffee-stream');
        const coffeeInCup = document.getElementById('coffee-in-cup');
        const brewingLight = document.getElementById('brewing-light');
        const steam = document.getElementById('steam');
        const coffeeDrops = document.getElementById('coffee-drops');
        
        // Stop main brewing animations
        if (waterFlow) waterFlow.classList.remove('active');
        if (coffeeStream) coffeeStream.classList.remove('active');
        if (brewingLight) brewingLight.classList.remove('active');
        
        // Add filled class to keep coffee visible
        if (coffeeInCup) coffeeInCup.classList.add('filled');
        
        // Stop coffee drops after a brief moment
        setTimeout(() => {
            if (coffeeDrops) coffeeDrops.classList.remove('active');
        }, 500);
        
        // Keep steam going for a bit longer, then gradually fade
        setTimeout(() => {
            if (steam) steam.classList.remove('active');
        }, 1000);
        
        // Keep coffee in cup for 3 seconds, then remove it
        setTimeout(() => {
            if (coffeeInCup) {
                coffeeInCup.classList.remove('filling', 'filled');
            }
        }, 3000);
    }
    
    updateParameterHeatmap() {
        if (this.history.length < 3) {
            if (this.parameterHeatmap) {
                this.parameterHeatmap.innerHTML = '<p>Brew more coffee to see parameter combinations</p>';
            }
            return;
        }
        
        const paramNames = ['Pressure', 'Grind', 'Temperature', 'Amount'];
        const paramUnits = ['PSI', '', '°C', 'g'];
        const paramRanges = [
            [6, 12],   // Pressure
            [1, 10],   // Grind
            [85, 100], // Temperature
            [14, 22]   // Amount
        ];
        
        let html = '<div class="heatmap-combinations">';
        
        // Create all possible parameter pair combinations (6 total for 4 parameters)
        const pairs = [
            [0, 1], // Pressure vs Grind
            [0, 2], // Pressure vs Temperature
            [0, 3], // Pressure vs Amount
            [1, 2], // Grind vs Temperature
            [1, 3], // Grind vs Amount
            [2, 3]  // Temperature vs Amount
        ];
        
        pairs.forEach(([param1, param2]) => {
            html += `
                <div class="heatmap-pair">
                    <h4>${paramNames[param1]} vs ${paramNames[param2]}</h4>
                    <div class="heatmap-container">
                        <div class="heatmap-y-axis">
                            <div class="axis-label">${paramNames[param2]}</div>
                            <div class="axis-values">
                                <span>${paramRanges[param2][1]}${paramUnits[param2]}</span>
                                <span>${paramRanges[param2][0]}${paramUnits[param2]}</span>
                            </div>
                        </div>
                        <div class="heatmap-main">
                            <div class="heatmap-grid">
            `;
            
            // Create 8x8 grid for higher resolution
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    const p1Value = paramRanges[param1][0] + (j / 7) * (paramRanges[param1][1] - paramRanges[param1][0]);
                    const p2Value = paramRanges[param2][0] + ((7-i) / 7) * (paramRanges[param2][1] - paramRanges[param2][0]);
                    
                    // Find nearby brews
                    const nearbyBrews = this.history.filter(brew => {
                        const p1Diff = Math.abs(brew.params[param1] - p1Value);
                        const p2Diff = Math.abs(brew.params[param2] - p2Value);
                        return p1Diff < (paramRanges[param1][1] - paramRanges[param1][0]) / 10 && 
                               p2Diff < (paramRanges[param2][1] - paramRanges[param2][0]) / 10;
                    });
                    
                    let color = '#f0f0f0';
                    let title = 'No data';
                    
                    if (nearbyBrews.length > 0) {
                        const avgScore = nearbyBrews.reduce((sum, brew) => sum + brew.score, 0) / nearbyBrews.length;
                        const intensity = Math.min(1, avgScore / 10);
                        
                        if (avgScore > 7) {
                            color = `rgba(76, 175, 80, ${intensity})`;
                        } else if (avgScore > 5) {
                            color = `rgba(255, 152, 0, ${intensity})`;
                        } else {
                            color = `rgba(244, 67, 54, ${intensity})`;
                        }
                        
                        title = `${paramNames[param1]}: ${p1Value.toFixed(1)}${paramUnits[param1]}, ${paramNames[param2]}: ${p2Value.toFixed(1)}${paramUnits[param2]} - Avg: ${avgScore.toFixed(2)} (${nearbyBrews.length} brews)`;
                    }
                    
                    html += `
                        <div class="heatmap-cell" 
                             style="background: ${color};" 
                             title="${title}">
                        </div>
                    `;
                }
            }
            
            html += `
                            </div>
                            <div class="heatmap-x-axis">
                                <div class="axis-label">${paramNames[param1]}</div>
                                <div class="axis-values">
                                    <span>${paramRanges[param1][0]}${paramUnits[param1]}</span>
                                    <span>${paramRanges[param1][1]}${paramUnits[param1]}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (this.parameterHeatmap) {
            this.parameterHeatmap.innerHTML = html;
        }
    }
    
    updateHistoryScatter() {
        if (this.history.length === 0) {
            this.historyScatter.innerHTML = '<p>Brew coffee to see score history</p>';
            return;
        }
        
        const maxScore = Math.max(...this.history.map(h => h.score));
        const minScore = Math.min(...this.history.map(h => h.score));
        const scoreRange = maxScore - minScore || 1;
        
        let scatterHTML = `
            <div class="history-axes">
                <div class="history-axis-label x">Brew Number</div>
                <div class="history-axis-label y">Taste Score</div>
                <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
        `;
        
        // Draw lines between points
        for (let i = 0; i < this.history.length - 1; i++) {
            const x1 = (i / (this.history.length - 1 || 1)) * 90 + 5; // 5-95% of width
            const y1 = 90 - ((this.history[i].score - minScore) / scoreRange) * 80; // 10-90% of height, inverted
            const x2 = ((i + 1) / (this.history.length - 1 || 1)) * 90 + 5;
            const y2 = 90 - ((this.history[i + 1].score - minScore) / scoreRange) * 80;
            
            scatterHTML += `<line x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%" stroke="#667eea" stroke-width="2" opacity="0.6"/>`;
        }
        
        scatterHTML += `</svg>`;
        
        this.history.forEach((brew, index) => {
            const x = (index / (this.history.length - 1 || 1)) * 90 + 5; // 5-95% of width
            const y = 90 - ((brew.score - minScore) / scoreRange) * 80; // 10-90% of height, inverted
            
            const color = brew.score > 8 ? '#4CAF50' : brew.score > 6 ? '#FF9800' : '#f44336';
            
            scatterHTML += `
                <div class="history-point" 
                     style="left: ${x}%; top: ${y}%; background: ${color}; z-index: 10;"
                     title="Brew ${index + 1}: Score ${brew.score.toFixed(2)}">
                </div>
            `;
        });
        
        scatterHTML += '</div>';
        
        // Add summary stats
        const avgScore = this.history.reduce((sum, brew) => sum + brew.score, 0) / this.history.length;
        const bestScore = Math.max(...this.history.map(h => h.score));
        
        scatterHTML += `
            <div style="margin-top: 15px; text-align: center; font-size: 0.9em;">
                <strong>Average Score:</strong> ${avgScore.toFixed(2)} | 
                <strong>Best Score:</strong> ${bestScore.toFixed(2)} | 
                <strong>Total Brews:</strong> ${this.history.length}
            </div>
        `;
        
        this.historyScatter.innerHTML = scatterHTML;
    }
}

// Custom Problem Manager
class CustomProblemManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProject = null;
        this.optimizer = new BayesianOptimizer();
        this.initializeElements();
        this.setupEventListeners();
        this.updateProjectList();
    }

    initializeElements() {
        this.projectList = document.getElementById('project-list');
        this.projectName = document.getElementById('project-name');
        this.objectiveName = document.getElementById('objective-name');
        this.optimizationDirection = document.getElementById('optimization-direction');
        this.parametersList = document.getElementById('parameters-list');
        this.entryForm = document.getElementById('entry-form');
        this.optimizationResults = document.getElementById('optimization-results');
        this.dataVisualization = document.getElementById('data-visualization');
        
        this.projectSetup = document.getElementById('project-setup');
        this.dataEntry = document.getElementById('data-entry');
        this.resultsDisplay = document.getElementById('results-display');
    }

    setupEventListeners() {
        document.getElementById('new-project-btn').addEventListener('click', () => this.newProject());
        document.getElementById('load-project-btn').addEventListener('click', () => this.loadProject());
        document.getElementById('delete-project-btn').addEventListener('click', () => this.deleteProject());
        document.getElementById('save-project').addEventListener('click', () => this.saveProject());
        document.getElementById('add-parameter').addEventListener('click', () => this.addParameter());
        document.getElementById('add-data-point').addEventListener('click', () => this.addDataPoint());
        document.getElementById('get-optimization-suggestion').addEventListener('click', () => this.getOptimizationSuggestion());
    }

    loadProjects() {
        const saved = localStorage.getItem('bayesian_projects');
        return saved ? JSON.parse(saved) : {};
    }

    saveProjects() {
        localStorage.setItem('bayesian_projects', JSON.stringify(this.projects));
    }

    updateProjectList() {
        this.projectList.innerHTML = '<option value="">Create New Project</option>';
        Object.keys(this.projects).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            this.projectList.appendChild(option);
        });
    }

    newProject() {
        this.currentProject = {
            name: '',
            objective: '',
            direction: 'maximize',
            parameters: [],
            data: []
        };
        this.projectName.value = '';
        this.objectiveName.value = '';
        this.optimizationDirection.value = 'maximize';
        this.parametersList.innerHTML = '';
        this.projectSetup.style.display = 'block';
        this.dataEntry.style.display = 'none';
        this.updateEntryForm();
    }

    loadProject() {
        const projectName = this.projectList.value;
        if (projectName && this.projects[projectName]) {
            this.currentProject = { ...this.projects[projectName] };
            this.projectName.value = this.currentProject.name;
            this.objectiveName.value = this.currentProject.objective;
            this.optimizationDirection.value = this.currentProject.direction;
            this.updateParametersList();
            this.updateEntryForm();
            this.projectSetup.style.display = 'block';
            this.dataEntry.style.display = 'block';
            this.loadDataIntoOptimizer();
        }
    }

    deleteProject() {
        const projectName = this.projectList.value;
        if (projectName && confirm(`Delete project "${projectName}"?`)) {
            delete this.projects[projectName];
            this.saveProjects();
            this.updateProjectList();
            this.newProject();
        }
    }

    saveProject() {
        if (!this.projectName.value) {
            alert('Please enter a project name');
            return;
        }

        this.currentProject.name = this.projectName.value;
        this.currentProject.objective = this.objectiveName.value;
        this.currentProject.direction = this.optimizationDirection.value;
        
        this.projects[this.currentProject.name] = { ...this.currentProject };
        this.saveProjects();
        this.updateProjectList();
        this.projectList.value = this.currentProject.name;
        this.dataEntry.style.display = 'block';
        this.updateEntryForm();
    }

    addParameter() {
        const paramId = Date.now();
        const param = {
            id: paramId,
            name: '',
            type: 'numerical',
            min: 0,
            max: 100,
            categories: []
        };
        
        this.currentProject.parameters.push(param);
        this.updateParametersList();
        this.updateEntryForm();
    }

    updateParametersList() {
        this.parametersList.innerHTML = '';
        this.currentProject.parameters.forEach((param, index) => {
            const paramDiv = document.createElement('div');
            paramDiv.className = 'parameter-item';
            paramDiv.innerHTML = `
                <div class="parameter-controls">
                    <input type="text" placeholder="Parameter Name" value="${param.name}" 
                           onchange="customProblemManager.updateParameter(${index}, 'name', this.value)">
                    <select onchange="customProblemManager.updateParameter(${index}, 'type', this.value)">
                        <option value="numerical" ${param.type === 'numerical' ? 'selected' : ''}>Numerical</option>
                        <option value="categorical" ${param.type === 'categorical' ? 'selected' : ''}>Categorical</option>
                    </select>
                    ${param.type === 'numerical' ? `
                        <input type="number" placeholder="Min" value="${param.min}" 
                               onchange="customProblemManager.updateParameter(${index}, 'min', parseFloat(this.value))">
                        <input type="number" placeholder="Max" value="${param.max}" 
                               onchange="customProblemManager.updateParameter(${index}, 'max', parseFloat(this.value))">
                    ` : `
                        <input type="text" placeholder="Categories (comma-separated)" 
                               value="${param.categories.join(', ')}"
                               onchange="customProblemManager.updateParameter(${index}, 'categories', this.value.split(',').map(s => s.trim()))">
                    `}
                    <button onclick="customProblemManager.removeParameter(${index})">Remove</button>
                </div>
            `;
            this.parametersList.appendChild(paramDiv);
        });
    }

    updateParameter(index, field, value) {
        this.currentProject.parameters[index][field] = value;
        this.updateParametersList();
        this.updateEntryForm();
    }

    removeParameter(index) {
        this.currentProject.parameters.splice(index, 1);
        this.updateParametersList();
        this.updateEntryForm();
    }

    updateEntryForm() {
        this.entryForm.innerHTML = '';
        this.currentProject.parameters.forEach((param, index) => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            if (param.type === 'numerical') {
                formGroup.innerHTML = `
                    <label>${param.name}:</label>
                    <input type="number" id="param-${index}" min="${param.min}" max="${param.max}" step="0.1">
                `;
            } else {
                formGroup.innerHTML = `
                    <label>${param.name}:</label>
                    <select id="param-${index}">
                        ${param.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                `;
            }
            
            this.entryForm.appendChild(formGroup);
        });

        // Add objective value input
        const objectiveGroup = document.createElement('div');
        objectiveGroup.className = 'form-group';
        objectiveGroup.innerHTML = `
            <label>${this.currentProject.objective}:</label>
            <input type="number" id="objective-value" step="0.01">
        `;
        this.entryForm.appendChild(objectiveGroup);
    }

    addDataPoint() {
        const paramValues = [];
        this.currentProject.parameters.forEach((param, index) => {
            const input = document.getElementById(`param-${index}`);
            if (param.type === 'numerical') {
                paramValues.push(parseFloat(input.value));
            } else {
                paramValues.push(input.value);
            }
        });

        const objectiveValue = parseFloat(document.getElementById('objective-value').value);
        
        if (paramValues.some(val => isNaN(val) && typeof val !== 'string') || isNaN(objectiveValue)) {
            alert('Please fill in all values');
            return;
        }

        const dataPoint = {
            params: paramValues,
            objective: objectiveValue,
            timestamp: new Date()
        };

        this.currentProject.data.push(dataPoint);
        this.projects[this.currentProject.name] = { ...this.currentProject };
        this.saveProjects();
        
        // Clear form
        this.currentProject.parameters.forEach((param, index) => {
            document.getElementById(`param-${index}`).value = '';
        });
        document.getElementById('objective-value').value = '';
        
        this.loadDataIntoOptimizer();
        this.updateResults();
    }

    loadDataIntoOptimizer() {
        this.optimizer = new BayesianOptimizer();
        this.currentProject.data.forEach(point => {
            // Convert categorical variables to numerical for optimizer
            const numericParams = point.params.map((param, index) => {
                if (this.currentProject.parameters[index].type === 'categorical') {
                    return this.currentProject.parameters[index].categories.indexOf(param);
                }
                return param;
            });
            
            const objective = this.currentProject.direction === 'maximize' ? 
                              point.objective : -point.objective;
            
            this.optimizer.addObservation(numericParams, objective);
        });
    }

    getOptimizationSuggestion() {
        if (this.currentProject.data.length === 0) {
            alert('Add some data points first');
            return;
        }

        const bounds = this.currentProject.parameters.map(param => {
            if (param.type === 'numerical') {
                return { min: param.min, max: param.max };
            } else {
                return { min: 0, max: param.categories.length - 1 };
            }
        });

        const suggestions = this.optimizer.suggest(bounds, 1);
        if (suggestions.length > 0) {
            const suggestion = suggestions[0];
            let suggestionText = '<h4>Recommended Parameters:</h4><ul>';
            
            suggestion.forEach((value, index) => {
                const param = this.currentProject.parameters[index];
                if (param.type === 'numerical') {
                    suggestionText += `<li>${param.name}: ${value.toFixed(2)}</li>`;
                } else {
                    const categoryIndex = Math.round(value);
                    const category = param.categories[categoryIndex] || param.categories[0];
                    suggestionText += `<li>${param.name}: ${category}</li>`;
                }
            });
            
            suggestionText += '</ul>';
            this.optimizationResults.innerHTML = suggestionText;
        }
    }

    updateResults() {
        if (this.currentProject.data.length === 0) {
            this.optimizationResults.innerHTML = '<p>No data points yet</p>';
            return;
        }

        const bestPoint = this.currentProject.data.reduce((best, current) => {
            const bestValue = this.currentProject.direction === 'maximize' ? best.objective : -best.objective;
            const currentValue = this.currentProject.direction === 'maximize' ? current.objective : -current.objective;
            return currentValue > bestValue ? current : best;
        });

        this.optimizationResults.innerHTML = `
            <h4>Best Result So Far:</h4>
            <p><strong>${this.currentProject.objective}:</strong> ${bestPoint.objective}</p>
            <p><strong>Parameters:</strong></p>
            <ul>
                ${bestPoint.params.map((param, index) => 
                    `<li>${this.currentProject.parameters[index].name}: ${param}</li>`
                ).join('')}
            </ul>
            <p><strong>Total Data Points:</strong> ${this.currentProject.data.length}</p>
        `;

        // Simple visualization
        this.dataVisualization.innerHTML = `
            <div style="text-align: center;">
                <h4>Objective Values Over Time</h4>
                <div style="display: flex; justify-content: space-around; align-items: end; height: 200px;">
                    ${this.currentProject.data.map((point, index) => `
                        <div style="display: flex; flex-direction: column; align-items: center;">
                            <div style="height: ${Math.abs(point.objective) * 10}px; width: 20px; 
                                        background: #667eea; margin-bottom: 5px;"></div>
                            <small>${point.objective.toFixed(1)}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Main Application
class BayesianOptimizationApp {
    constructor() {
        this.coffeeDemo = null;
        this.customProblemManager = null;
        this.initializeNavigation();
        this.showSection('main-menu');
    }

    initializeNavigation() {
        // No nav buttons to initialize since we're using cards
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show back button for non-main sections
        const backBtn = document.getElementById('back-btn');
        if (sectionId === 'main-menu') {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'block';
        }
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Initialize section-specific functionality
        if (sectionId === 'coffee-demo' && !this.coffeeDemo) {
            this.coffeeDemo = new CoffeeDemo();
        } else if (sectionId === 'custom-problem' && !this.customProblemManager) {
            this.customProblemManager = new CustomProblemManager();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BayesianOptimizationApp();
    window.coffeeDemo = window.app.coffeeDemo;
    window.customProblemManager = window.app.customProblemManager;
});