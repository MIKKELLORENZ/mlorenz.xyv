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
        this.maxBrews = 30;
        this.brewsRemaining = 30;
        
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
        this.brewsRemainingDisplay = document.getElementById('brews-remaining');
        this.counterFill = document.getElementById('counter-fill');
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
        
        // Add event listeners for acquisition function radio buttons
        const acquisitionRadios = document.querySelectorAll('input[name="acquisition"]');
        acquisitionRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.optimizer.observations.length > 0) {
                    this.getRecommendation(); // Refresh recommendation with new acquisition function
                }
            });
        });
        
        // Initialize currentParams from slider values on startup
        this.syncParamsFromSliders();
    }
    
    // Sync currentParams from slider positions (used on initialization)
    syncParamsFromSliders() {
        if (this.pressureSlider) this.currentParams[0] = parseFloat(this.pressureSlider.value);
        if (this.grindSlider) this.currentParams[1] = parseFloat(this.grindSlider.value);
        if (this.temperatureSlider) this.currentParams[2] = parseFloat(this.temperatureSlider.value);
        if (this.coffeeAmountSlider) this.currentParams[3] = parseFloat(this.coffeeAmountSlider.value);
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
        
  
        
        // Ensure realistic score distribution (perfect 10 is extremely rare)
        finalScore = Math.max(0, Math.min(9.85, finalScore));
        
        return finalScore;
    }

    getCurrentScore() {
        return this.trueCoffeeFunction(...this.currentParams);
    }

    updateDisplay() {
        // Update the displayed values
        if (this.pressureValue) this.pressureValue.textContent = this.currentParams[0].toFixed(1);
        if (this.grindValue) this.grindValue.textContent = this.currentParams[1].toFixed(1);
        if (this.temperatureValue) this.temperatureValue.textContent = this.currentParams[2].toFixed(1);
        if (this.coffeeAmountValue) this.coffeeAmountValue.textContent = this.currentParams[3].toFixed(1);
        
        // Only update slider positions if we're explicitly applying a suggestion
        // Otherwise, sliders should only move when user drags them
        if (this.isApplyingSuggestion) {
            if (this.pressureSlider) this.pressureSlider.value = this.currentParams[0];
            if (this.grindSlider) this.grindSlider.value = this.currentParams[1];
            if (this.temperatureSlider) this.temperatureSlider.value = this.currentParams[2];
            if (this.coffeeAmountSlider) this.coffeeAmountSlider.value = this.currentParams[3];
        }
        
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
        this.updateBrewCounter();
        this.updateAcquisitionRecommendation();
    }

    getRecommendation() {
        if (this.optimizer.observations.length === 0) {
            if (this.suggestionDisplay) {
                this.suggestionDisplay.innerHTML = '<p>Brew some coffee first to get recommendations!</p>';
            }
            return;
        }

        // Get selected acquisition function
        const selectedAcquisition = document.querySelector('input[name="acquisition"]:checked');
        const acquisitionFunction = selectedAcquisition ? selectedAcquisition.value : 'EI';

        // Ensure the optimizer supports the acquisition function parameter
        const suggestions = this.optimizer.suggest ? 
            this.optimizer.suggest(this.bounds, 1, acquisitionFunction) : 
            this.getSuggestionWithAcquisition(acquisitionFunction);
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

    // Fallback method to generate suggestions with different acquisition functions
    getSuggestionWithAcquisition(acquisitionFunction) {
        if (this.optimizer.observations.length === 0) {
            return [];
        }

        // Generate a grid of candidate points
        const numCandidates = 100;
        const candidates = [];
        
        for (let i = 0; i < numCandidates; i++) {
            const candidate = [];
            for (let j = 0; j < this.bounds.length; j++) {
                const min = this.bounds[j].min;
                const max = this.bounds[j].max;
                candidate.push(Math.random() * (max - min) + min);
            }
            candidates.push(candidate);
        }

        // Calculate acquisition function values for each candidate
        const acquisitionValues = candidates.map(candidate => {
            return this.calculateAcquisitionValue(candidate, acquisitionFunction);
        });

        // Find the candidate with the highest acquisition value
        let bestIndex = 0;
        let bestValue = acquisitionValues[0];
        
        for (let i = 1; i < acquisitionValues.length; i++) {
            if (acquisitionValues[i] > bestValue) {
                bestValue = acquisitionValues[i];
                bestIndex = i;
            }
        }

        return [candidates[bestIndex]];
    }

    // Calculate acquisition function value for a given candidate point
    calculateAcquisitionValue(candidate, acquisitionFunction) {
        const observations = this.optimizer.observations;
        
        // Simple Gaussian Process prediction (simplified for demo)
        const { mean, variance } = this.predictGaussianProcess(candidate);
        const sigma = Math.sqrt(variance);
        
        // Current best observed value
        const fStar = Math.max(...observations.map(obs => obs.value));
        
        switch (acquisitionFunction) {
            case 'EI': // Expected Improvement
                if (sigma === 0) return 0;
                const z = (mean - fStar) / sigma;
                const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); // PDF of standard normal
                const Phi = 0.5 * (1 + this.erf(z / Math.sqrt(2))); // CDF of standard normal
                return (mean - fStar) * Phi + sigma * phi;
                
            case 'UCB': // Upper Confidence Bound
                const beta = 2.0; // Exploration parameter
                return mean + beta * sigma;
                
            case 'PI': // Probability of Improvement
                if (sigma === 0) return 0;
                const zPI = (mean - fStar) / sigma;
                return 0.5 * (1 + this.erf(zPI / Math.sqrt(2)));
                
            default:
                return mean + 2 * sigma; // Default to UCB-like behavior
        }
    }

    // Simplified Gaussian Process prediction
    predictGaussianProcess(candidate) {
        const observations = this.optimizer.observations;
        
        if (observations.length === 0) {
            return { mean: 5.0, variance: 1.0 };
        }

        // Simple weighted average based on distance (simplified GP)
        let weightedSum = 0;
        let totalWeight = 0;
        let weightedVarianceSum = 0;

        observations.forEach(obs => {
            // Calculate squared distance
            let distance = 0;
            for (let i = 0; i < candidate.length; i++) {
                const diff = candidate[i] - obs.params[i];
                const range = this.bounds[i].max - this.bounds[i].min;
                distance += Math.pow(diff / range, 2);
            }
            
            // RBF kernel with length scale
            const lengthScale = 0.5;
            const weight = Math.exp(-distance / (2 * lengthScale * lengthScale));
            
            weightedSum += weight * obs.value;
            totalWeight += weight;
            
            // Simple variance estimate (higher for points far from observations)
            weightedVarianceSum += weight * (1.0 / (1.0 + distance));
        });

        const mean = totalWeight > 0 ? weightedSum / totalWeight : 5.0;
        const variance = totalWeight > 0 ? 
            Math.max(0.1, 1.0 - (weightedVarianceSum / totalWeight)) : 1.0;

        return { mean, variance };
    }

    // Error function approximation for normal CDF calculation
    erf(x) {
        // Abramowitz and Stegun approximation
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    updateBrewCounter() {
        if (this.brewsRemainingDisplay) {
            this.brewsRemainingDisplay.textContent = this.brewsRemaining;
        }
        
        if (this.counterFill) {
            const percentage = ((this.maxBrews - this.brewsRemaining) / this.maxBrews) * 100;
            this.counterFill.style.width = `${percentage}%`;
            
            // Change color based on remaining brews
            if (this.brewsRemaining <= 5) {
                this.counterFill.style.background = '#f44336'; // Red
            } else if (this.brewsRemaining <= 10) {
                this.counterFill.style.background = '#FF9800'; // Orange
            } else {
                this.counterFill.style.background = '#4CAF50'; // Green
            }
        }
        
        // Disable brewing if no brews left
        if (this.brewsRemaining <= 0 && this.brewCoffeeBtn) {
            this.brewCoffeeBtn.disabled = true;
            this.brewCoffeeBtn.querySelector('.btn-text').textContent = 'Game Over!';
        }
    }

    updateAcquisitionRecommendation() {
        // Clear all indicators first
        const indicators = ['ei-indicator', 'ucb-indicator', 'pi-indicator'];
        indicators.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('recommended');
                element.textContent = '';
            }
        });

        if (this.history.length === 0) return;

        let recommendedFunction = this.getRecommendedAcquisitionFunction();
        const indicator = document.getElementById(`${recommendedFunction.toLowerCase()}-indicator`);
        
        if (indicator) {
            indicator.classList.add('recommended');
            indicator.textContent = '★ Recommended';
        }
    }

    getRecommendedAcquisitionFunction() {
        const numObservations = this.history.length;
        const brewsUsed = this.maxBrews - this.brewsRemaining;
        const progress = brewsUsed / this.maxBrews;
        
        // Calculate score improvement rate
        let scoreImprovement = 0;
        if (this.history.length > 1) {
            const recentScores = this.history.slice(-Math.min(5, this.history.length));
            const avgRecent = recentScores.reduce((sum, brew) => sum + brew.score, 0) / recentScores.length;
            const bestSoFar = Math.max(...this.history.map(h => h.score));
            scoreImprovement = (bestSoFar - avgRecent) / bestSoFar;
        }

        // Early stage (0-40% of brews used): Prefer UCB for exploration
        if (progress < 0.4) {
            return 'UCB';
        }
        // Late stage (80%+ of brews used): Prefer PI for exploitation
        else if (progress > 0.8) {
            return 'PI';
        }
        // Middle stage or when making good progress: Use EI
        else {
            return 'EI';
        }
    }

    applySuggestion(suggestion) {
        // This method is only called when user explicitly clicks "Apply Recommendation" button
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
            this.isApplyingSuggestion = true; // Temporarily set this flag
            this.currentParams = [...this.bestBrew.params];
            this.updateDisplay(); // This will now update sliders because isApplyingSuggestion is true
            this.isApplyingSuggestion = false; // Reset the flag
        }
    }

    brewCoffee() {
        // Debug: Log current parameters to console
        console.log('Brewing with parameters:', this.currentParams);
        
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
            console.log('Score for parameters', this.currentParams, ':', score);
            
            this.optimizer.addObservation(this.currentParams, score);
            this.history.push({ params: [...this.currentParams], score, timestamp: new Date() });
            
            // Decrement brews remaining
            this.brewsRemaining--;
            
            // Stop brewing animation
            this.stopBrewingAnimation();
            
            // Re-enable button and hide spinner
            this.brewCoffeeBtn.disabled = false;
            spinner.classList.remove('active');
            btnText.textContent = 'Brew Coffee';
            
            this.updateBestBrew();
            // Generate recommendation but do NOT auto-apply it
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
            
            // Create detailed tooltip with all parameters
            const tooltip = `Brew ${index + 1}: Score ${brew.score.toFixed(2)}
Pressure: ${brew.params[0].toFixed(1)} PSI
Grind: ${brew.params[1].toFixed(1)}
Temperature: ${brew.params[2].toFixed(1)}°C
Amount: ${brew.params[3].toFixed(1)}g`;
            
            scatterHTML += `
                <div class="history-point" 
                     style="left: ${x}%; top: ${y}%; background: ${color}; z-index: 10;"
                     title="${tooltip}">
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