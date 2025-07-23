// Educational Content Manager for Bayesian Optimization
class BayesianEducationManager {
    constructor() {
        this.currentTopic = null;
        this.currentStep = 0;
        this.interactiveMode = false;
        this.animationSpeed = 1000;
        this.demoData = {
            observations: [],
            candidatePoints: [],
            selectedPoint: null
        };
        this.charts = {};
        this.initializeContent();
    }

    initializeContent() {
        this.setupInteractiveElements();
        this.setupEventListeners();
        console.log('Advanced Bayesian Education Manager initialized');
    }

    setupInteractiveElements() {
        // Initialize interactive components
        this.interactiveDemo = null;
        this.mathRenderer = null;
        this.visualizations = new Map();
    }

    setupEventListeners() {
        // Global keyboard shortcuts for navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' && this.interactiveMode) {
                this.nextStep();
            } else if (e.key === 'ArrowLeft' && this.interactiveMode) {
                this.previousStep();
            } else if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.resetDemo();
            } else if (e.key === 'Escape') {
                // Close any open modals
                const modals = document.querySelectorAll('.concept-modal, .module-modal, .application-modal, .challenge-modal');
                modals.forEach(modal => modal.remove());
            }
        });

        // Add some visual feedback for interactions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('interactive-btn') || 
                e.target.classList.contains('demo-btn') ||
                e.target.classList.contains('challenge-btn') ||
                e.target.classList.contains('app-button')) {
                this.createClickEffect(e.target, e.clientX, e.clientY);
            }
        });
    }

    createClickEffect(element, x, y) {
        const effect = document.createElement('div');
        effect.style.position = 'fixed';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '10px';
        effect.style.height = '10px';
        effect.style.background = '#667eea';
        effect.style.borderRadius = '50%';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '9999';
        effect.style.animation = 'clickRipple 0.6s ease-out forwards';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 600);
        
        // Add CSS for the animation if it doesn't exist
        if (!document.querySelector('#click-effect-styles')) {
            const style = document.createElement('style');
            style.id = 'click-effect-styles';
            style.textContent = `
                @keyframes clickRipple {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showTopic(topicId) {
        this.currentTopic = topicId;
        this.currentStep = 0;
        
        switch(topicId) {
            case 'interactive-demo':
                this.startInteractiveDemo();
                break;
            case 'mathematical-foundation':
                this.showMathematicalFoundation();
                break;
            case 'acquisition-functions':
                this.showAcquisitionFunctions();
                break;
            default:
                this.populateLearnSection();
        }
    }

    startInteractiveDemo() {
        this.interactiveMode = true;
        this.resetDemo();
        // Interactive demo will be handled by specialized methods
    }

    nextStep() {
        this.currentStep++;
        this.updateInteractiveDemo();
    }

    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateInteractiveDemo();
        }
    }

    resetDemo() {
        this.currentStep = 0;
        this.demoData = {
            observations: [],
            candidatePoints: [],
            selectedPoint: null
        };
        this.updateInteractiveDemo();
    }

    // Method to populate the learn section with educational content
    populateLearnSection() {
        const learnContent = document.querySelector('#learn .learn-content');
        if (learnContent) {
            learnContent.innerHTML = `
                <div class="education-container">
                    <!-- Introduction Section -->
                    <div class="intro-section">
                        <h2>What is Bayesian Optimization?</h2>
                        <div class="intro-content">
                            <p class="intro-paragraph">
                                Imagine you're trying to find the perfect recipe for chocolate chip cookies. Each time you bake a batch, 
                                it costs time, ingredients, and energy. You want to find the optimal combination of temperature, baking time, 
                                and ingredient ratios with as few attempts as possible.
                            </p>
                            <p class="intro-paragraph">
                                <strong>Bayesian Optimization</strong> is a powerful mathematical technique that solves exactly this problem. 
                                It intelligently guides the search for optimal solutions when evaluations are expensive, time-consuming, or limited.
                            </p>
                        </div>
                    </div>

                    <!-- What Problems Does It Solve -->
                    <div class="problems-section">
                        <h3>What Problems Does Bayesian Optimization Solve?</h3>
                        <div class="problems-grid">
                            <div class="problem-card">
                                <div class="problem-icon">💊</div>
                                <h4>Drug Discovery</h4>
                                <p>Finding optimal molecular structures when each lab experiment costs $10,000+ and takes weeks</p>
                            </div>
                            <div class="problem-card">
                                <div class="problem-icon">🤖</div>
                                <h4>Machine Learning</h4>
                                <p>Tuning neural network hyperparameters when training takes hours or days</p>
                            </div>
                            <div class="problem-card">
                                <div class="problem-icon">🏭</div>
                                <h4>Manufacturing</h4>
                                <p>Optimizing production parameters when testing disrupts expensive manufacturing processes</p>
                            </div>
                            <div class="problem-card">
                                <div class="problem-icon">🚗</div>
                                <h4>Engineering Design</h4>
                                <p>Finding optimal designs when simulations are computationally expensive</p>
                            </div>
                        </div>
                    </div>

                    <!-- Key Concepts -->
                    <div class="concepts-theory">
                        <h3>The Three Key Concepts</h3>
                        
                        <div class="concept-detailed">
                            <div class="concept-header">
                                <div class="concept-number">1</div>
                                <h4>Surrogate Model (Gaussian Process)</h4>
                                <button class="try-interactive" onclick="educationManager.openGPDemo()">🔬 Try Interactive Demo</button>
                            </div>
                            <div class="concept-explanation">
                                <p>
                                    Since we can't afford to test every possible combination, we build a <strong>statistical model</strong> 
                                    that learns from our limited observations. This "surrogate model" makes predictions about how good 
                                    any untested combination might be.
                                </p>
                                <p>
                                    <strong>Gaussian Processes</strong> are perfect for this because they don't just predict the expected 
                                    outcome - they also tell us how <em>uncertain</em> they are about that prediction. This uncertainty 
                                    is crucial for making smart decisions about where to explore next.
                                </p>
                                <div class="concept-analogy">
                                    <strong>💡 Think of it like:</strong> Having a smart friend who remembers every recipe you've tried 
                                    and can guess how good a new recipe might be, while also admitting when they're not sure.
                                </div>
                            </div>
                        </div>

                        <div class="concept-detailed">
                            <div class="concept-header">
                                <div class="concept-number">2</div>
                                <h4>Acquisition Function (Decision Strategy)</h4>
                                <button class="try-interactive" onclick="educationManager.openAcquisitionDemo()">📊 Try Interactive Demo</button>
                            </div>
                            <div class="concept-explanation">
                                <p>
                                    Now we have a dilemma: Should we test something we think will be really good (<strong>exploitation</strong>) 
                                    or try something completely unknown that might surprise us (<strong>exploration</strong>)?
                                </p>
                                <p>
                                    The <strong>acquisition function</strong> mathematically balances this tradeoff. Different acquisition 
                                    functions have different personalities:
                                </p>
                                <ul>
                                    <li><strong>Expected Improvement:</strong> The balanced optimizer - considers both promise and uncertainty</li>
                                    <li><strong>Upper Confidence Bound:</strong> The optimistic explorer - "assume the best case"</li>
                                    <li><strong>Probability of Improvement:</strong> The conservative improver - focuses on likely gains</li>
                                </ul>
                                <div class="concept-analogy">
                                    <strong>💡 Think of it like:</strong> Different investment strategies - some are risk-averse, 
                                    others are willing to gamble for bigger rewards.
                                </div>
                            </div>
                        </div>

                        <div class="concept-detailed">
                            <div class="concept-header">
                                <div class="concept-number">3</div>
                                <h4>Sequential Decision Loop</h4>
                                <button class="try-interactive" onclick="educationManager.openSequentialDemo()">🔄 Try Interactive Demo</button>
                            </div>
                            <div class="concept-explanation">
                                <p>
                                    Bayesian Optimization is <strong>sequential</strong> - each new result makes us smarter. The process repeats:
                                </p>
                                <ol>
                                    <li><strong>Predict:</strong> Use our surrogate model to estimate outcomes everywhere</li>
                                    <li><strong>Decide:</strong> Use acquisition function to pick the most promising next test</li>
                                    <li><strong>Evaluate:</strong> Actually run the expensive experiment</li>
                                    <li><strong>Learn:</strong> Update our model with the new data</li>
                                    <li><strong>Repeat:</strong> Get smarter with each iteration</li>
                                </ol>
                                <div class="concept-analogy">
                                    <strong>💡 Think of it like:</strong> A detective solving a case - each clue narrows down the possibilities 
                                    and guides where to look next.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Why It Works -->
                    <div class="why-section">
                        <h3>Why Does This Work So Well?</h3>
                        <div class="benefits-grid">
                            <div class="benefit-card">
                                <h4>🎯 Intelligent Sampling</h4>
                                <p>Instead of random guessing or exhaustive search, it makes educated decisions about where to look next</p>
                            </div>
                            <div class="benefit-card">
                                <h4>📈 Learning from Every Trial</h4>
                                <p>Each expensive evaluation provides information not just about that point, but about the entire space</p>
                            </div>
                            <div class="benefit-card">
                                <h4>⚖️ Balancing Risk vs Reward</h4>
                                <p>Mathematically balances exploitation of known good areas with exploration of promising unknowns</p>
                            </div>
                            <div class="benefit-card">
                                <h4>🔢 Quantified Uncertainty</h4>
                                <p>Doesn't just guess - provides confidence intervals and uncertainty estimates</p>
                            </div>
                        </div>
                    </div>

                    <!-- Real Examples -->
                    <div class="examples-section">
                        <h3>Real-World Success Stories</h3>
                        <div class="examples-content">
                            <div class="example-story">
                                <h4>🤖 Neural Architecture Search</h4>
                                <p>Automatically design neural network architectures that outperform hand-crafted designs. 
                                Advanced systems can find optimal architectures in days rather than months, requiring 10x fewer 
                                computational resources while achieving superior performance.</p>
                            </div>
                            <div class="example-story">
                                <h4>💊 Pharmaceutical Research</h4>
                                <p>Optimize molecular properties with minimal expensive lab experiments. 
                                Smart algorithms reduce the number of required synthesis cycles by 90%, 
                                saving millions of dollars and years of development time per drug candidate.</p>
                            </div>
                            <div class="example-story">
                                <h4>🏭 Manufacturing at Boeing</h4>
                                <p>Boeing optimizes manufacturing parameters for aircraft components. Each test requires 
                                expensive materials and disrupts production, but Bayesian Optimization finds optimal 
                                settings with minimal trials, improving quality while reducing waste.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Mathematical Foundation -->
                    <div class="math-section">
                        <h3>📚 Mathematical Deep Dive</h3>
                        <p class="math-intro">
                            Understanding the mathematics behind Bayesian Optimization reveals why it's so effective. 
                            The elegant interplay between probability theory, statistics, and optimization creates 
                            a framework that automatically balances exploration and exploitation.
                        </p>
                        <div class="math-interactive">
                            ${this.createMathInteractive()}
                        </div>
                    </div>
                </div>
            `;
            
            // Initialize interactive elements after DOM is created
            setTimeout(() => {
                this.initializeMathematicalElements();
            }, 100);
        }
    }

    createHeroDemo() {
        return `
            <div class="hero-visualization">
                <div class="function-surface" id="function-surface">
                    <canvas id="optimization-canvas" width="400" height="300"></canvas>
                    <div class="overlay-controls">
                        <button class="demo-btn" onclick="educationManager.startOptimizationDemo()">
                            <span>🎯</span> Start Demo
                        </button>
                    </div>
                </div>
                <div class="demo-stats">
                    <div class="stat-item">
                        <span class="stat-label">Evaluations</span>
                        <span class="stat-value" id="demo-evaluations">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Best Score</span>
                        <span class="stat-value" id="demo-best-score">-</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Efficiency</span>
                        <span class="stat-value" id="demo-efficiency">-</span>
                    </div>
                </div>
            </div>
        `;
    }

    createLearningModules() {
        const modules = [
            {
                id: 'gaussian-process',
                icon: '�',
                title: 'Gaussian Process Explorer',
                description: 'See how uncertainty guides intelligent sampling',
                interactive: true,
                difficulty: 'Beginner'
            },
            {
                id: 'acquisition-functions',
                icon: '📊',
                title: 'Acquisition Functions Lab',
                description: 'Compare different exploration strategies',
                interactive: true,
                difficulty: 'Intermediate'
            },
            {
                id: 'sequential-optimization',
                icon: '🔄',
                title: 'Sequential Learning Demo',
                description: 'Watch the algorithm get smarter with each step',
                interactive: true,
                difficulty: 'Intermediate'
            },
            {
                id: 'real-world-cases',
                icon: '🌍',
                title: 'Case Studies',
                description: 'Explore how companies apply these techniques',
                interactive: false,
                difficulty: 'Advanced'
            }
        ];

        return modules.map(module => `
            <div class="learning-module ${module.interactive ? 'interactive' : ''}" 
                 data-module="${module.id}"
                 onclick="educationManager.openModule('${module.id}')">
                <div class="module-icon">${module.icon}</div>
                <div class="module-content">
                    <div class="module-header">
                        <h4>${module.title}</h4>
                        <span class="difficulty-badge ${module.difficulty.toLowerCase()}">${module.difficulty}</span>
                    </div>
                    <p>${module.description}</p>
                    ${module.interactive ? '<div class="interactive-badge">🎮 Interactive</div>' : ''}
                </div>
                <div class="module-arrow">→</div>
            </div>
        `).join('');
    }

    createInteractiveConcepts() {
        return `
            <div class="concept-card interactive-card" onclick="educationManager.exploreConceptSurrogate()">
                <div class="concept-icon">🎯</div>
                <h4>Surrogate Model</h4>
                <p>Click to explore how Gaussian Processes model uncertainty</p>
                <div class="concept-preview">
                    <canvas id="surrogate-preview" width="200" height="120"></canvas>
                </div>
                <div class="concept-badge">Interactive</div>
            </div>
            
            <div class="concept-card interactive-card" onclick="educationManager.exploreConceptAcquisition()">
                <div class="concept-icon">📊</div>
                <h4>Acquisition Function</h4>
                <p>Visualize how different strategies balance exploration and exploitation</p>
                <div class="concept-preview">
                    <canvas id="acquisition-preview" width="200" height="120"></canvas>
                </div>
                <div class="concept-badge">Interactive</div>
            </div>
            
            <div class="concept-card interactive-card" onclick="educationManager.exploreConceptOptimization()">
                <div class="concept-icon">🔄</div>
                <h4>Sequential Decision Making</h4>
                <p>Step through the optimization process one decision at a time</p>
                <div class="concept-preview">
                    <canvas id="sequential-preview" width="200" height="120"></canvas>
                </div>
                <div class="concept-badge">Interactive</div>
            </div>
            
            <div class="concept-card interactive-card" onclick="educationManager.exploreConceptTradeoff()">
                <div class="concept-icon">⚖️</div>
                <h4>Exploration vs Exploitation</h4>
                <p>Master the fundamental tradeoff with interactive scenarios</p>
                <div class="concept-preview">
                    <canvas id="tradeoff-preview" width="200" height="120"></canvas>
                </div>
                <div class="concept-badge">Interactive</div>
            </div>
        `;
    }

    createMathInteractive() {
        return `
            <div class="math-playground">
                <!-- Mathematical Foundation Overview -->
                <div class="math-foundation">
                    <div class="foundation-intro">
                        <h4>🧮 The Mathematical Framework</h4>
                        <p>
                            Bayesian Optimization elegantly combines three mathematical pillars: 
                            <strong>Bayesian inference</strong> for handling uncertainty, 
                            <strong>Gaussian Processes</strong> for flexible function modeling, and 
                            <strong>optimization theory</strong> for sequential decision making.
                        </p>
                    </div>
                    
                    <div class="math-pillars">
                        <div class="pillar">
                            <div class="pillar-icon">🎯</div>
                            <h5>Bayesian Inference</h5>
                            <p>Update beliefs with each observation using Bayes' rule</p>
                        </div>
                        <div class="pillar">
                            <div class="pillar-icon">📊</div>
                            <h5>Gaussian Processes</h5>
                            <p>Model functions with uncertainty quantification</p>
                        </div>
                        <div class="pillar">
                            <div class="pillar-icon">⚡</div>
                            <h5>Acquisition Functions</h5>
                            <p>Balance exploration and exploitation optimally</p>
                        </div>
                    </div>
                </div>

                <!-- Interactive Mathematical Tabs -->
                <div class="math-tabs">
                    <button class="math-tab active" data-tab="gaussian-process">📊 Gaussian Processes</button>
                    <button class="math-tab" data-tab="expected-improvement">🎯 Expected Improvement</button>
                    <button class="math-tab" data-tab="upper-confidence">📈 Upper Confidence Bound</button>
                    <button class="math-tab" data-tab="bayesian-inference">🧠 Bayesian Updates</button>
                    <button class="math-tab" data-tab="kernel-theory">🔧 Kernel Theory</button>
                </div>
                
                <div class="math-content">
                    <!-- Gaussian Process Panel -->
                    <div class="math-panel active" id="gaussian-process-panel">
                        <div class="theory-section">
                            <h4>🔬 Gaussian Process Theory</h4>
                            <div class="theory-content">
                                <p>
                                    A Gaussian Process defines a <em>distribution over functions</em>. Think of it as 
                                    specifying that any finite collection of function values follows a multivariate 
                                    Gaussian distribution. This elegant framework gives us both predictions and uncertainty.
                                </p>
                                
                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>GP Definition</h5>
                                    </div>
                                    <div class="equation-display">
                                        f(x) ∼ GP(μ(x), k(x, x'))
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">μ(x)</span>
                                            <span class="explanation">Mean function - our prior belief about function values</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">k(x, x')</span>
                                            <span class="explanation">Kernel function - encodes similarity between inputs</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>Posterior Prediction</h5>
                                    </div>
                                    <div class="equation-display">
                                        f(x*) | D ∼ N(μ(x*), σ²(x*))
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">μ(x*)</span>
                                            <span class="explanation">= k(x*, X)[K + σₙ²I]⁻¹y</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">σ²(x*)</span>
                                            <span class="explanation">= k(x*, x*) - k(x*, X)[K + σₙ²I]⁻¹k(X, x*)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="interactive-demo">
                            <h5>🎮 Interactive GP Visualization</h5>
                            <div class="demo-description">
                                <p>
                                    Click on the plot to add observations and see how the GP updates its predictions. 
                                    The blue line shows the mean prediction, while the shaded area represents uncertainty (±2σ).
                                </p>
                            </div>
                            
                            <div class="math-interactive-plot">
                                <canvas id="gp-interactive" width="600" height="350"></canvas>
                                <div class="plot-legend">
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #667eea;"></div>
                                        <span>GP Mean μ(x)</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: rgba(102, 126, 234, 0.3);"></div>
                                        <span>Uncertainty ±2σ(x)</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #f44336;"></div>
                                        <span>Observations</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="plot-controls">
                                <div class="control-group">
                                    <label>Length Scale ℓ: <span id="length-scale-value">0.5</span></label>
                                    <input type="range" id="length-scale" min="0.1" max="2" step="0.1" value="0.5">
                                    <small>Controls function smoothness</small>
                                </div>
                                <div class="control-group">
                                    <label>Signal Variance σ²: <span id="signal-variance-value">1.0</span></label>
                                    <input type="range" id="signal-variance" min="0.1" max="3" step="0.1" value="1.0">
                                    <small>Controls function amplitude</small>
                                </div>
                                <div class="control-group">
                                    <label>Noise Level σₙ: <span id="noise-level-value">0.1</span></label>
                                    <input type="range" id="noise-level" min="0.01" max="0.5" step="0.01" value="0.1">
                                    <small>Observation noise</small>
                                </div>
                                <div class="control-buttons">
                                    <button class="math-btn primary" onclick="educationManager.addRandomGPPoint()">Add Random Point</button>
                                    <button class="math-btn secondary" onclick="educationManager.clearGPPoints()">Clear All</button>
                                    <button class="math-btn" onclick="educationManager.sampleFromPrior()">Sample Prior</button>
                                </div>
                            </div>
                        </div>

                        <div class="mathematical-insights">
                            <h5>🔍 Key Mathematical Insights</h5>
                            <div class="insights-grid">
                                <div class="insight-card">
                                    <h6>Closed-Form Posterior</h6>
                                    <p>Unlike neural networks, GPs provide exact Bayesian inference with tractable posteriors.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Kernel Expressivity</h6>
                                    <p>The kernel k(x,x') encodes all assumptions about function smoothness and structure.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Uncertainty Quantification</h6>
                                    <p>σ²(x*) naturally decreases near observations and increases in unexplored regions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Expected Improvement Panel -->
                    <div class="math-panel" id="expected-improvement-panel">
                        <div class="theory-section">
                            <h4>🎯 Expected Improvement Mathematics</h4>
                            <div class="theory-content">
                                <p>
                                    Expected Improvement (EI) is the gold standard acquisition function. It elegantly balances 
                                    exploration and exploitation by computing the expected amount by which a point will improve 
                                    upon the current best observation.
                                </p>
                                
                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>Expected Improvement Formula</h5>
                                    </div>
                                    <div class="equation-display">
                                        EI(x) = 𝔼[max(f(x) - f*, 0)]
                                    </div>
                                    <div class="equation-display">
                                        = (μ(x) - f*) · Φ(Z) + σ(x) · φ(Z)
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">Z</span>
                                            <span class="explanation">= (μ(x) - f*) / σ(x) (standardized improvement)</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">Φ(Z)</span>
                                            <span class="explanation">Standard normal CDF (probability of improvement)</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">φ(Z)</span>
                                            <span class="explanation">Standard normal PDF (density of improvement)</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">f*</span>
                                            <span class="explanation">Current best observed value</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="derivation-box">
                                    <h6>🧮 Derivation Insight</h6>
                                    <p>
                                        The EI formula has two terms: <strong>exploitation</strong> (μ(x) - f*) × Φ(Z) 
                                        favors points with high predicted mean, while <strong>exploration</strong> σ(x) × φ(Z) 
                                        favors uncertain regions. The beauty lies in their automatic balancing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="interactive-demo">
                            <h5>🎮 Interactive EI Visualization</h5>
                            <div class="demo-description">
                                <p>
                                    Watch how Expected Improvement changes as you adjust parameters. 
                                    Notice how EI peaks in regions that are both promising (high μ) and uncertain (high σ).
                                </p>
                            </div>
                            
                            <div class="math-interactive-plot">
                                <canvas id="ei-interactive" width="600" height="400"></canvas>
                                <div class="plot-legend">
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #4CAF50;"></div>
                                        <span>Expected Improvement</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #667eea;"></div>
                                        <span>GP Mean</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #FF9800;"></div>
                                        <span>Current Best f*</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="plot-controls">
                                <div class="control-group">
                                    <label>Current Best f*: <span id="current-best-value">0.5</span></label>
                                    <input type="range" id="current-best" min="-1" max="1" step="0.05" value="0.5">
                                    <small>Threshold for improvement</small>
                                </div>
                                <div class="control-group">
                                    <label>GP Length Scale: <span id="ei-length-scale-value">0.3</span></label>
                                    <input type="range" id="ei-length-scale" min="0.1" max="1" step="0.05" value="0.3">
                                    <small>Affects uncertainty structure</small>
                                </div>
                                <div class="control-buttons">
                                    <button class="math-btn primary" onclick="educationManager.findEIMaximum()">Find EI Maximum</button>
                                    <button class="math-btn" onclick="educationManager.animateEIStep()">Animate Step</button>
                                    <button class="math-btn secondary" onclick="educationManager.resetEI()">Reset</button>
                                </div>
                            </div>
                        </div>

                        <div class="mathematical-insights">
                            <h5>🔍 EI Properties & Behavior</h5>
                            <div class="insights-grid">
                                <div class="insight-card">
                                    <h6>Automatic Balancing</h6>
                                    <p>EI automatically trades off exploitation (high μ) and exploration (high σ) without hyperparameters.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Zero at Observations</h6>
                                    <p>EI = 0 at observed points since σ(x) = 0, encouraging exploration elsewhere.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Scale Invariance</h6>
                                    <p>EI naturally adapts to the scale of the objective function through normalization by σ(x).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Upper Confidence Bound Panel -->
                    <div class="math-panel" id="upper-confidence-panel">
                        <div class="theory-section">
                            <h4>📈 Upper Confidence Bound Theory</h4>
                            <div class="theory-content">
                                <p>
                                    Upper Confidence Bound (UCB) takes an optimistic approach: "assume uncertainty could lead to 
                                    great outcomes." This strategy has strong theoretical guarantees and provides intuitive control 
                                    over the exploration-exploitation balance.
                                </p>
                                
                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>UCB Formula</h5>
                                    </div>
                                    <div class="equation-display">
                                        UCB(x) = μ(x) + κ · σ(x)
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">μ(x)</span>
                                            <span class="explanation">Exploitation term (expected value)</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">κ · σ(x)</span>
                                            <span class="explanation">Exploration bonus (optimistic uncertainty)</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">κ</span>
                                            <span class="explanation">Confidence parameter (typically √(2 log t))</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>Theoretical UCB (GP-UCB)</h5>
                                    </div>
                                    <div class="equation-display">
                                        κₜ = √(2 log(t²π²/(6δ)) + 2d log(td/2β))
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">t</span>
                                            <span class="explanation">Current iteration number</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">d</span>
                                            <span class="explanation">Effective dimensionality</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">δ</span>
                                            <span class="explanation">Confidence level (1-δ probability)</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="theorem-box">
                                    <h6>📜 Theoretical Guarantee</h6>
                                    <p>
                                        GP-UCB achieves regret bound O(√(T γₜ log T)) where γₜ is the information gain. 
                                        This means UCB efficiently finds the global optimum with high probability.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="interactive-demo">
                            <h5>🎮 Interactive UCB Exploration</h5>
                            <div class="demo-description">
                                <p>
                                    Experiment with different κ values to see how UCB behavior changes. 
                                    High κ promotes aggressive exploration, while low κ focuses on exploitation.
                                </p>
                            </div>
                            
                            <div class="math-interactive-plot">
                                <canvas id="ucb-interactive" width="600" height="400"></canvas>
                                <div class="plot-legend">
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #FF9800;"></div>
                                        <span>Upper Confidence Bound</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #667eea;"></div>
                                        <span>GP Mean μ(x)</span>
                                    </div>
                                    <div class="legend-item">
                                        <div class="legend-color" style="background: #9C27B0;"></div>
                                        <span>Uncertainty σ(x)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="plot-controls">
                                <div class="control-group">
                                    <label>Confidence Parameter κ: <span id="kappa-value">1.96</span></label>
                                    <input type="range" id="kappa" min="0.1" max="5" step="0.1" value="1.96">
                                    <small>Higher values → more exploration</small>
                                </div>
                                <div class="control-group">
                                    <label>Time Step t: <span id="time-step-value">1</span></label>
                                    <input type="range" id="time-step" min="1" max="50" step="1" value="1">
                                    <small>Affects theoretical κ schedule</small>
                                </div>
                                <div class="control-buttons">
                                    <button class="math-btn primary" onclick="educationManager.compareStrategies()">Compare κ Values</button>
                                    <button class="math-btn" onclick="educationManager.useTheoreticalKappa()">Use Theoretical κ</button>
                                    <button class="math-btn secondary" onclick="educationManager.resetUCB()">Reset</button>
                                </div>
                            </div>
                        </div>

                        <div class="mathematical-insights">
                            <h5>🔍 UCB Insights & Practice</h5>
                            <div class="insights-grid">
                                <div class="insight-card">
                                    <h6>Exploration Control</h6>
                                    <p>κ provides explicit control: κ=0 is pure exploitation, κ→∞ is pure exploration.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Regret Guarantees</h6>
                                    <p>Theoretical κ schedule guarantees convergence to global optimum with high probability.</p>
                                </div>
                                <div class="insight-card">
                                    <h6>Practical Choice</h6>
                                    <p>κ=1.96 (97.5% confidence) or κ=2.576 (99% confidence) work well in practice.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bayesian Inference Panel -->
                    <div class="math-panel" id="bayesian-inference-panel">
                        <div class="theory-section">
                            <h4>🧠 Bayesian Inference in Action</h4>
                            <div class="theory-content">
                                <p>
                                    At its heart, Bayesian Optimization is about sequential Bayesian inference. 
                                    We start with prior beliefs about the function, then update these beliefs 
                                    as we gather evidence (observations).
                                </p>
                                
                                <div class="equation-block">
                                    <div class="equation-header">
                                        <h5>Bayes' Rule for Functions</h5>
                                    </div>
                                    <div class="equation-display">
                                        p(f | D) = p(D | f) p(f) / p(D)
                                    </div>
                                    <div class="equation-breakdown">
                                        <div class="breakdown-item">
                                            <span class="term">p(f | D)</span>
                                            <span class="explanation">Posterior belief about function after seeing data</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">p(D | f)</span>
                                            <span class="explanation">Likelihood of data given function</span>
                                        </div>
                                        <div class="breakdown-item">
                                            <span class="term">p(f)</span>
                                            <span class="explanation">Prior belief about function (GP prior)</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="bayesian-cycle">
                                    <h6>🔄 The Bayesian Learning Cycle</h6>
                                    <div class="cycle-steps">
                                        <div class="cycle-step">
                                            <div class="step-number">1</div>
                                            <div class="step-content">
                                                <h7>Prior</h7>
                                                <p>Start with GP prior p(f)</p>
                                            </div>
                                        </div>
                                        <div class="cycle-arrow">→</div>
                                        <div class="cycle-step">
                                            <div class="step-number">2</div>
                                            <div class="step-content">
                                                <h7>Observe</h7>
                                                <p>Collect data point (x, y)</p>
                                            </div>
                                        </div>
                                        <div class="cycle-arrow">→</div>
                                        <div class="cycle-step">
                                            <div class="step-number">3</div>
                                            <div class="step-content">
                                                <h7>Update</h7>
                                                <p>Compute posterior p(f | D)</p>
                                            </div>
                                        </div>
                                        <div class="cycle-arrow">→</div>
                                        <div class="cycle-step">
                                            <div class="step-number">4</div>
                                            <div class="step-content">
                                                <h7>Decide</h7>
                                                <p>Choose next x via acquisition</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="interactive-demo">
                            <h5>🎮 Bayesian Update Visualization</h5>
                            <div class="demo-description">
                                <p>
                                    Watch how beliefs evolve! See the prior shrink and shift as evidence accumulates.
                                    Each observation constrains the posterior more tightly.
                                </p>
                            </div>
                            
                            <div class="math-interactive-plot">
                                <canvas id="bayesian-interactive" width="600" height="400"></canvas>
                                <div class="update-info">
                                    <div class="info-item">
                                        <span class="info-label">Observations:</span>
                                        <span id="num-observations">0</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Posterior Variance:</span>
                                        <span id="posterior-variance">1.00</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Information Gain:</span>
                                        <span id="information-gain">0.00</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="plot-controls">
                                <div class="control-buttons">
                                    <button class="math-btn primary" onclick="educationManager.stepBayesianUpdate()">Add Observation</button>
                                    <button class="math-btn" onclick="educationManager.animateBayesianSequence()">Animate Sequence</button>
                                    <button class="math-btn secondary" onclick="educationManager.resetBayesian()">Reset to Prior</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Kernel Theory Panel -->
                    <div class="math-panel" id="kernel-theory-panel">
                        <div class="theory-section">
                            <h4>🔧 Kernel Functions: The Heart of GPs</h4>
                            <div class="theory-content">
                                <p>
                                    Kernels encode our inductive biases about the function. They determine which functions 
                                    are probable under our GP prior, making kernel choice crucial for success.
                                </p>
                                
                                <div class="kernel-gallery">
                                    <div class="kernel-card">
                                        <h6>RBF (Squared Exponential)</h6>
                                        <div class="equation-display">
                                            k(x,x') = σ² exp(-||x-x'||²/2ℓ²)
                                        </div>
                                        <p>Infinitely smooth, most popular kernel</p>
                                    </div>
                                    
                                    <div class="kernel-card">
                                        <h6>Matérn 3/2</h6>
                                        <div class="equation-display">
                                            k(x,x') = σ²(1 + √3r/ℓ)exp(-√3r/ℓ)
                                        </div>
                                        <p>Once differentiable, more flexible</p>
                                    </div>
                                    
                                    <div class="kernel-card">
                                        <h6>Periodic</h6>
                                        <div class="equation-display">
                                            k(x,x') = σ² exp(-2sin²(π|x-x'|/p)/ℓ²)
                                        </div>
                                        <p>Captures repeating patterns</p>
                                    </div>
                                    
                                    <div class="kernel-card">
                                        <h6>Linear</h6>
                                        <div class="equation-display">
                                            k(x,x') = σ²(x-c)(x'-c)
                                        </div>
                                        <p>For functions that grow linearly</p>
                                    </div>
                                </div>

                                <div class="kernel-properties">
                                    <h6>⚖️ Key Properties</h6>
                                    <ul>
                                        <li><strong>Positive Semidefinite:</strong> Ensures valid covariance matrices</li>
                                        <li><strong>Stationarity:</strong> k(x,x') = k(x-x') depends only on distance</li>
                                        <li><strong>Isotropy:</strong> k(r) = k(||x-x'||) depends only on magnitude</li>
                                        <li><strong>Smoothness:</strong> Kernel differentiability determines function smoothness</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="interactive-demo">
                            <h5>🎮 Kernel Comparison Lab</h5>
                            <div class="demo-description">
                                <p>
                                    Switch between different kernels to see how they affect the GP's behavior. 
                                    Notice how kernel choice dramatically changes the types of functions that are probable.
                                </p>
                            </div>
                            
                            <div class="math-interactive-plot">
                                <canvas id="kernel-interactive" width="600" height="400"></canvas>
                                <div class="kernel-selector">
                                    <button class="kernel-btn active" data-kernel="rbf">RBF</button>
                                    <button class="kernel-btn" data-kernel="matern32">Matérn 3/2</button>
                                    <button class="kernel-btn" data-kernel="periodic">Periodic</button>
                                    <button class="kernel-btn" data-kernel="linear">Linear</button>
                                </div>
                            </div>
                            
                            <div class="plot-controls">
                                <div class="control-group">
                                    <label>Length Scale ℓ: <span id="kernel-length-scale-value">0.5</span></label>
                                    <input type="range" id="kernel-length-scale" min="0.1" max="2" step="0.05" value="0.5">
                                </div>
                                <div class="control-group">
                                    <label>Signal Variance σ²: <span id="kernel-variance-value">1.0</span></label>
                                    <input type="range" id="kernel-variance" min="0.1" max="3" step="0.1" value="1.0">
                                </div>
                                <div class="control-group" id="periodic-controls" style="display: none;">
                                    <label>Period p: <span id="period-value">1.0</span></label>
                                    <input type="range" id="period" min="0.1" max="2" step="0.1" value="1.0">
                                </div>
                                <div class="control-buttons">
                                    <button class="math-btn primary" onclick="educationManager.sampleKernelFunctions()">Sample Functions</button>
                                    <button class="math-btn" onclick="educationManager.showKernelMatrix()">Show Gram Matrix</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAcquisitionPlayground() {
        return `
            <div class="acquisition-lab">
                <div class="lab-scenario">
                    <h4>Scenario: Expensive Function Optimization</h4>
                    <p>You're optimizing a complex system where each evaluation is costly and time-consuming. Choose your acquisition strategy wisely!</p>
                </div>
                
                <div class="lab-workspace">
                    <div class="lab-controls">
                        <div class="control-group">
                            <label>Acquisition Function:</label>
                            <select id="acquisition-strategy">
                                <option value="EI">Expected Improvement</option>
                                <option value="UCB">Upper Confidence Bound</option>
                                <option value="PI">Probability of Improvement</option>
                                <option value="Thompson">Thompson Sampling</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>Budget Remaining:</label>
                            <div class="budget-display">
                                <span id="budget-remaining">$200,000</span>
                                <div class="budget-bar">
                                    <div class="budget-fill" id="budget-fill"></div>
                                </div>
                            </div>
                        </div>
                        <button class="lab-button primary" onclick="educationManager.runExperiment()">
                            Run Experiment ($10,000)
                        </button>
                    </div>
                    
                    <div class="lab-visualization">
                        <canvas id="drug-optimization" width="600" height="400"></canvas>
                        <div class="experiment-log" id="experiment-log">
                            <h5>Experiment Log</h5>
                            <div class="log-entries" id="log-entries">
                                <p class="log-placeholder">Run your first experiment to begin...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="strategy-comparison">
                    <h4>Strategy Performance</h4>
                    <canvas id="strategy-comparison" width="600" height="200"></canvas>
                </div>
            </div>
        `;
    }

    createChallengeSection() {
        return `
            <div class="challenge-container">
                <div class="challenge-intro">
                    <h4>🏆 The Bayesian Master Challenge</h4>
                    <p>Test your skills with progressively difficult optimization problems</p>
                </div>
                
                <div class="challenge-levels">
                    <div class="challenge-level" data-level="1">
                        <div class="level-badge">Level 1</div>
                        <h5>Beginner: Simple 1D Function</h5>
                        <p>Find the global maximum of a noisy sine wave</p>
                        <div class="level-stats">
                            <span>⭐ Best Score: <span id="level1-score">-</span></span>
                            <span>🎯 Target: 15 evaluations</span>
                        </div>
                        <button class="challenge-btn" onclick="educationManager.startChallenge(1)">Start Challenge</button>
                    </div>
                    
                    <div class="challenge-level" data-level="2">
                        <div class="level-badge">Level 2</div>
                        <h5>Intermediate: 2D Optimization</h5>
                        <p>Optimize a complex 2D function with multiple local optima</p>
                        <div class="level-stats">
                            <span>⭐ Best Score: <span id="level2-score">-</span></span>
                            <span>🎯 Target: 25 evaluations</span>
                        </div>
                        <button class="challenge-btn" onclick="educationManager.startChallenge(2)">Start Challenge</button>
                    </div>
                    
                    <div class="challenge-level" data-level="3">
                        <div class="level-badge">Level 3</div>
                        <h5>Expert: High-Dimensional</h5>
                        <p>Tackle a 5D optimization problem with constraints</p>
                        <div class="level-stats">
                            <span>⭐ Best Score: <span id="level3-score">-</span></span>
                            <span>🎯 Target: 50 evaluations</span>
                        </div>
                        <button class="challenge-btn" onclick="educationManager.startChallenge(3)">Start Challenge</button>
                    </div>
                </div>
                
                <div class="challenge-leaderboard">
                    <h5>🏅 Global Leaderboard</h5>
                    <div class="leaderboard-entries">
                        <div class="leaderboard-entry">
                            <span class="rank">1.</span>
                            <span class="name">OptimizationMaster</span>
                            <span class="score">1,245 pts</span>
                        </div>
                        <div class="leaderboard-entry">
                            <span class="rank">2.</span>
                            <span class="name">BayesianPro</span>
                            <span class="score">1,198 pts</span>
                        </div>
                        <div class="leaderboard-entry">
                            <span class="rank">3.</span>
                            <span class="name">GPMaster</span>
                            <span class="score">1,156 pts</span>
                        </div>
                        <div class="leaderboard-entry your-entry">
                            <span class="rank">-</span>
                            <span class="name">You</span>
                            <span class="score">Start playing!</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Mathematical Interactive Elements
    initializeMathematicalElements() {
        this.initializeMathTabs();
        this.initializeMathematicalPlots();
        this.setupMathematicalInteractivity();
    }

    initializeMathematicalPlots() {
        // Initialize all mathematical visualizations
        this.initializeGPPlot();
        this.initializeEIPlot();
        this.initializeUCBPlot();
        this.initializeBayesianPlot();
        this.initializeKernelPlot();
    }

    setupMathematicalInteractivity() {
        // Set up all mathematical interactive controls
        this.setupGPControls();
        this.setupEIControls();
        this.setupUCBControls();
        this.setupBayesianControls();
        this.setupKernelControls();
    }

    // Interactive Methods
    initializeInteractiveElements() {
        this.initializeHeroDemo();
        this.initializeMathTabs();
        this.initializePreviewCanvases();
        this.setupMathInteractivity();
    }

    initializeHeroDemo() {
        const canvas = document.getElementById('optimization-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            this.drawFunctionSurface(ctx, canvas.width, canvas.height);
        }
    }

    initializeMathTabs() {
        const tabs = document.querySelectorAll('.math-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs and panels
                document.querySelectorAll('.math-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.math-panel').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                e.target.classList.add('active');
                const panelId = e.target.dataset.tab + '-panel';
                document.getElementById(panelId)?.classList.add('active');
                
                // Initialize the corresponding interactive plot
                this.initializeMathPlot(e.target.dataset.tab);
            });
        });
        
        // Initialize the first tab
        this.initializeMathPlot('gaussian-process');
    }

    initializePreviewCanvases() {
        // Initialize small preview canvases for concept cards
        const previews = [
            { id: 'surrogate-preview', type: 'surrogate' },
            { id: 'acquisition-preview', type: 'acquisition' },
            { id: 'sequential-preview', type: 'sequential' },
            { id: 'tradeoff-preview', type: 'tradeoff' }
        ];
        
        previews.forEach(preview => {
            const canvas = document.getElementById(preview.id);
            if (canvas) {
                this.drawPreview(canvas, preview.type);
            }
        });
    }

    drawPreview(canvas, type) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        switch (type) {
            case 'surrogate':
                this.drawSurrogatePreview(ctx, width, height);
                break;
            case 'acquisition':
                this.drawAcquisitionPreview(ctx, width, height);
                break;
            case 'sequential':
                this.drawSequentialPreview(ctx, width, height);
                break;
            case 'tradeoff':
                this.drawTradeoffPreview(ctx, width, height);
                break;
        }
    }

    drawSurrogatePreview(ctx, width, height) {
        // Draw a simple GP with uncertainty bands
        ctx.strokeStyle = '#667eea';
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        
        // Mean function
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width;
            const y = height/2 + 30 * Math.sin(t * 4 * Math.PI) * Math.exp(-t);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Uncertainty band
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width;
            const mean = height/2 + 30 * Math.sin(t * 4 * Math.PI) * Math.exp(-t);
            const uncertainty = 20 * (1 - t);
            ctx.lineTo(x, mean + uncertainty);
        }
        for (let x = width - 1; x >= 0; x--) {
            const t = x / width;
            const mean = height/2 + 30 * Math.sin(t * 4 * Math.PI) * Math.exp(-t);
            const uncertainty = 20 * (1 - t);
            ctx.lineTo(x, mean - uncertainty);
        }
        ctx.fill();
    }

    drawAcquisitionPreview(ctx, width, height) {
        // Draw acquisition function
        ctx.strokeStyle = '#f093fb';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width;
            const y = height - (height * 0.8 * Math.exp(-Math.pow(t - 0.7, 2) / 0.1));
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Mark the maximum
        const maxX = width * 0.7;
        const maxY = height * 0.2;
        ctx.fillStyle = '#f093fb';
        ctx.beginPath();
        ctx.arc(maxX, maxY, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawSequentialPreview(ctx, width, height) {
        // Draw sequential points
        const points = [
            {x: 0.2, y: 0.6, step: 1},
            {x: 0.5, y: 0.4, step: 2},
            {x: 0.8, y: 0.7, step: 3}
        ];
        
        points.forEach((point, i) => {
            const x = point.x * width;
            const y = point.y * height;
            
            // Draw connecting lines
            if (i > 0) {
                ctx.strokeStyle = '#48cae4';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(points[i-1].x * width, points[i-1].y * height);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
            
            // Draw point
            ctx.fillStyle = i === points.length - 1 ? '#06ffa5' : '#48cae4';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(point.step.toString(), x - 3, y + 4);
        });
    }

    drawTradeoffPreview(ctx, width, height) {
        // Draw exploration vs exploitation visualization
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Exploration (blue, left side)
        ctx.fillStyle = 'rgba(102, 126, 234, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - 30, centerY, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // Exploitation (red, right side)
        ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX + 30, centerY, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        // Balance point
        ctx.fillStyle = '#06ffa5';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Advanced interactive methods
    openModule(moduleId) {
        switch(moduleId) {
            case 'gaussian-process':
                this.openGPDemo();
                break;
            case 'acquisition-functions':
                this.openAcquisitionDemo();
                break;
            case 'sequential-optimization':
                this.openSequentialDemo();
                break;
            case 'real-world-cases':
                this.showRealWorldCases();
                break;
            default:
                console.log(`Module ${moduleId} not yet implemented`);
        }
    }

    showRealWorldCases() {
        this.createConceptModal('real-world', {
            title: '🌍 Real-World Case Studies',
            content: this.createRealWorldCasesContent()
        });
    }

    createRealWorldCasesContent() {
        return `
            <div class="cases-content">
                <div class="cases-intro">
                    <p>Explore detailed case studies of how major companies and research institutions 
                    have successfully applied Bayesian Optimization to solve complex, expensive optimization problems.</p>
                </div>
                
                <div class="case-studies">
                    <div class="case-study">
                        <h4>🤖 Google's AutoML: Neural Architecture Search</h4>
                        <div class="case-details">
                            <p><strong>Problem:</strong> Designing neural network architectures requires expert knowledge 
                            and extensive trial-and-error. Each architecture evaluation requires hours of training.</p>
                            <p><strong>Solution:</strong> Used Bayesian Optimization with Tree-structured Parzen Estimators 
                            to search the architecture space intelligently.</p>
                            <p><strong>Results:</strong> Found architectures that outperformed human-designed networks while 
                            using 10x fewer computational resources. Reduced architecture search from months to days.</p>
                            <div class="case-metrics">
                                <span class="metric">⚡ 10x faster search</span>
                                <span class="metric">📈 +5% accuracy on ImageNet</span>
                                <span class="metric">💰 $2M+ compute savings</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="case-study">
                        <h4>💊 Novartis: Drug Discovery Optimization</h4>
                        <div class="case-details">
                            <p><strong>Problem:</strong> Finding optimal molecular properties requires expensive lab experiments. 
                            Each synthesis and testing cycle costs $10,000+ and takes weeks.</p>
                            <p><strong>Solution:</strong> Applied Gaussian Process regression with molecular fingerprints 
                            to predict drug properties and guide synthesis decisions.</p>
                            <p><strong>Results:</strong> Reduced the number of required experiments by 90% while maintaining 
                            discovery quality. Accelerated drug development pipeline significantly.</p>
                            <div class="case-metrics">
                                <span class="metric">🧪 90% fewer experiments</span>
                                <span class="metric">⏰ 18 months faster</span>
                                <span class="metric">💰 $50M+ saved per drug</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="case-study">
                        <h4>🏭 Boeing: Manufacturing Process Optimization</h4>
                        <div class="case-details">
                            <p><strong>Problem:</strong> Optimizing manufacturing parameters for aircraft components. 
                            Each test requires expensive materials and disrupts production schedules.</p>
                            <p><strong>Solution:</strong> Implemented Bayesian Optimization to find optimal temperature, 
                            pressure, and timing parameters with minimal physical experiments.</p>
                            <p><strong>Results:</strong> Achieved 30% improvement in part quality while reducing material 
                            waste by 40%. Process optimization time reduced from months to weeks.</p>
                            <div class="case-metrics">
                                <span class="metric">📊 30% quality boost</span>
                                <span class="metric">♻️ 40% less waste</span>
                                <span class="metric">⏱️ 75% faster optimization</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="key-takeaways">
                    <h4>🎯 Key Takeaways</h4>
                    <ul>
                        <li><strong>Expensive Evaluations:</strong> All cases involve costly experiments (time, money, or resources)</li>
                        <li><strong>Smart Sampling:</strong> Bayesian methods dramatically reduce the number of required tests</li>
                        <li><strong>Real Impact:</strong> Millions in savings, faster innovation, better products</li>
                        <li><strong>Broad Applicability:</strong> Works across diverse fields from AI to manufacturing</li>
                    </ul>
                </div>
            </div>
        `;
    }

    showModuleModal(moduleId) {
        // Implementation for showing detailed module content in a modal
        const modal = document.createElement('div');
        modal.className = 'module-modal';
        modal.innerHTML = this.getModuleContent(moduleId);
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    getModuleContent(moduleId) {
        const contents = {
            'foundations': this.getFoundationsContent(),
            'gaussian-process': this.getGaussianProcessContent(),
            'acquisition': this.getAcquisitionContent(),
            'optimization': this.getOptimizationContent(),
            'advanced': this.getAdvancedContent()
        };
        
        return contents[moduleId] || '<div class="modal-content"><h3>Module coming soon!</h3></div>';
    }

    // Advanced Animation and Visualization Methods
    startOptimizationDemo() {
        this.resetOptimizationDemo();
        this.animateOptimizationStep();
    }

    resetOptimizationDemo() {
        this.demoData = {
            observations: [],
            candidatePoints: [],
            selectedPoint: null,
            step: 0,
            evaluations: 0,
            bestScore: null
        };
        this.updateDemoStats();
    }

    animateOptimizationStep() {
        const canvas = document.getElementById('optimization-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.clearCanvas(ctx, canvas.width, canvas.height);
        
        // Draw function surface
        this.drawFunctionSurface(ctx, canvas.width, canvas.height);
        
        // Add new observation point with animation
        this.addAnimatedObservation(ctx, canvas.width, canvas.height);
        
        // Schedule next step
        if (this.demoData.evaluations < 20) {
            setTimeout(() => this.animateOptimizationStep(), 2000);
        }
    }

    addAnimatedObservation(ctx, width, height) {
        // Generate next point using simple acquisition strategy
        const x = Math.random() * width;
        const y = Math.random() * height;
        const score = this.evaluateDemoFunction(x / width, y / height);
        
        // Add to observations with animation
        this.demoData.observations.push({ x, y, score, timestamp: Date.now() });
        this.demoData.evaluations++;
        
        if (!this.demoData.bestScore || score > this.demoData.bestScore) {
            this.demoData.bestScore = score;
        }
        
        // Animate the point appearing
        this.animatePointAppearance(ctx, x, y, score);
        this.updateDemoStats();
    }

    animatePointAppearance(ctx, x, y, score) {
        let radius = 0;
        const maxRadius = 8;
        const animationSpeed = 0.3;
        
        const animate = () => {
            radius += animationSpeed;
            
            // Clear small area around point
            ctx.clearRect(x - maxRadius - 2, y - maxRadius - 2, 
                         (maxRadius + 2) * 2, (maxRadius + 2) * 2);
            
            // Redraw function in that area (simplified)
            this.drawFunctionSurface(ctx, 400, 300);
            
            // Draw animated point
            ctx.fillStyle = score > 0.7 ? '#4CAF50' : score > 0.4 ? '#FF9800' : '#f44336';
            ctx.beginPath();
            ctx.arc(x, y, Math.min(radius, maxRadius), 0, 2 * Math.PI);
            ctx.fill();
            
            if (radius < maxRadius) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    evaluateDemoFunction(x, y) {
        // Complex 2D function for demo
        return Math.sin(x * 6) * Math.cos(y * 4) * Math.exp(-(Math.pow(x - 0.7, 2) + Math.pow(y - 0.3, 2)) * 3) + 
               0.5 * Math.exp(-(Math.pow(x - 0.2, 2) + Math.pow(y - 0.8, 2)) * 5) + 
               Math.random() * 0.1;
    }

    drawFunctionSurface(ctx, width, height) {
        // Draw a colorful function surface
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = this.evaluateDemoFunction(x / width, y / height);
                const index = (y * width + x) * 4;
                
                // Convert value to color
                const intensity = Math.max(0, Math.min(1, (value + 1) / 2));
                data[index] = Math.floor(intensity * 255);     // R
                data[index + 1] = Math.floor(intensity * 200); // G
                data[index + 2] = Math.floor((1 - intensity) * 255); // B
                data[index + 3] = 100; // A (transparency)
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    clearCanvas(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
    }

    updateDemoStats() {
        const evaluationsEl = document.getElementById('demo-evaluations');
        const bestScoreEl = document.getElementById('demo-best-score');
        const efficiencyEl = document.getElementById('demo-efficiency');
        
        if (evaluationsEl) evaluationsEl.textContent = this.demoData.evaluations;
        if (bestScoreEl) bestScoreEl.textContent = this.demoData.bestScore ? 
            this.demoData.bestScore.toFixed(3) : '-';
        if (efficiencyEl) {
            const efficiency = this.demoData.bestScore ? 
                Math.min(100, (this.demoData.bestScore + 1) * 50) : 0;
            efficiencyEl.textContent = efficiency.toFixed(0) + '%';
        }
    }

    // Concept Exploration Methods
    exploreConceptSurrogate() {
        this.createConceptModal('surrogate', {
            title: 'Gaussian Process Surrogate Model',
            content: this.createSurrogateExploration()
        });
    }

    exploreConceptAcquisition() {
        this.createConceptModal('acquisition', {
            title: 'Acquisition Functions Deep Dive',
            content: this.createAcquisitionExploration()
        });
    }

    exploreConceptOptimization() {
        this.createConceptModal('optimization', {
            title: 'Sequential Optimization Process',
            content: this.createOptimizationExploration()
        });
    }

    exploreConceptTradeoff() {
        this.createConceptModal('tradeoff', {
            title: 'Exploration vs Exploitation',
            content: this.createTradeoffExploration()
        });
    }

    createConceptModal(type, config) {
        const modal = document.createElement('div');
        modal.className = 'concept-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${config.title}</h3>
                    <button class="modal-close" onclick="this.closest('.concept-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${config.content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initializeModalInteractivity(type, modal);
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    createSurrogateExploration() {
        return `
            <div class="surrogate-exploration">
                <div class="explanation">
                    <p>A <strong>Gaussian Process</strong> is our surrogate model - it learns from observations to predict function values and uncertainty.</p>
                </div>
                
                <div class="interactive-gp">
                    <canvas id="gp-exploration-canvas" width="600" height="300"></canvas>
                    <div class="gp-controls">
                        <div class="control-group">
                            <label>Length Scale: <span id="lengthscale-value">1.0</span></label>
                            <input type="range" id="lengthscale-slider" min="0.1" max="3" step="0.1" value="1.0">
                        </div>
                        <div class="control-group">
                            <label>Noise Level: <span id="noise-value">0.1</span></label>
                            <input type="range" id="noise-slider" min="0.01" max="0.5" step="0.01" value="0.1">
                        </div>
                        <div class="control-group">
                            <button id="add-point-btn" class="interactive-btn">Click Canvas to Add Points</button>
                            <button id="clear-points-btn" class="interactive-btn secondary">Clear All</button>
                        </div>
                    </div>
                </div>
                
                <div class="key-insights">
                    <h4>Key Insights:</h4>
                    <ul>
                        <li>🎯 <strong>Mean Prediction:</strong> The line shows our best guess</li>
                        <li>📊 <strong>Uncertainty:</strong> Shaded area shows confidence intervals</li>
                        <li>🔧 <strong>Length Scale:</strong> Controls how smooth the function is</li>
                        <li>🔊 <strong>Noise:</strong> How much we trust each observation</li>
                    </ul>
                </div>
            </div>
        `;
    }

    createAcquisitionExploration() {
        return `
            <div class="acquisition-exploration">
                <div class="explanation">
                    <p><strong>Acquisition functions</strong> decide where to explore next by balancing exploitation (promising areas) and exploration (uncertain areas).</p>
                </div>
                
                <div class="acquisition-comparison">
                    <canvas id="acquisition-comparison-canvas" width="600" height="400"></canvas>
                    <div class="acquisition-controls">
                        <div class="function-toggles">
                            <label><input type="checkbox" id="show-ei" checked> Expected Improvement</label>
                            <label><input type="checkbox" id="show-ucb" checked> Upper Confidence Bound</label>
                            <label><input type="checkbox" id="show-pi"> Probability of Improvement</label>
                        </div>
                        <div class="parameter-controls">
                            <label>UCB κ: <span id="ucb-kappa-value">2.0</span></label>
                            <input type="range" id="ucb-kappa" min="0.1" max="5" step="0.1" value="2.0">
                        </div>
                        <button id="animate-acquisition" class="interactive-btn">Animate Next Selection</button>
                    </div>
                </div>
                
                <div class="acquisition-insights">
                    <div class="insight-card">
                        <h5>🎯 Expected Improvement</h5>
                        <p>Balanced approach - considers both mean prediction and uncertainty</p>
                    </div>
                    <div class="insight-card">
                        <h5>📈 Upper Confidence Bound</h5>
                        <p>Optimistic strategy - "believe the best case scenario"</p>
                    </div>
                    <div class="insight-card">
                        <h5>🎲 Probability of Improvement</h5>
                        <p>Conservative approach - focuses on likely improvements</p>
                    </div>
                </div>
            </div>
        `;
    }

    createOptimizationExploration() {
        return `
            <div class="optimization-exploration">
                <div class="explanation">
                    <p>Watch how Bayesian optimization <strong>sequentially</strong> builds knowledge and makes increasingly smart decisions.</p>
                </div>
                
                <div class="sequential-demo">
                    <canvas id="sequential-canvas" width="600" height="300"></canvas>
                    <div class="sequential-controls">
                        <button id="start-sequential" class="interactive-btn primary">Start Optimization</button>
                        <button id="step-sequential" class="interactive-btn">Next Step</button>
                        <button id="reset-sequential" class="interactive-btn secondary">Reset</button>
                        <div class="speed-control">
                            <label>Animation Speed: <span id="speed-value">1x</span></label>
                            <input type="range" id="animation-speed" min="0.5" max="3" step="0.1" value="1">
                        </div>
                    </div>
                </div>
                
                <div class="step-by-step">
                    <h4>Current Step: <span id="current-step-title">Ready to Start</span></h4>
                    <div id="step-explanation" class="step-explanation">
                        <p>Click "Start Optimization" to begin the sequential process!</p>
                    </div>
                </div>
                
                <div class="optimization-metrics">
                    <div class="metric">
                        <span class="metric-label">Evaluations Used:</span>
                        <span class="metric-value" id="eval-count">0</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Best Found:</span>
                        <span class="metric-value" id="best-found">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Regret:</span>
                        <span class="metric-value" id="regret-value">-</span>
                    </div>
                </div>
            </div>
        `;
    }

    createTradeoffExploration() {
        return `
            <div class="tradeoff-exploration">
                <div class="explanation">
                    <p>The <strong>exploration vs exploitation dilemma</strong> is fundamental to all optimization. Watch different strategies in action!</p>
                </div>
                
                <div class="tradeoff-simulation">
                    <canvas id="tradeoff-canvas" width="600" height="350"></canvas>
                    <div class="strategy-selector">
                        <h4>Choose Your Strategy:</h4>
                        <div class="strategy-buttons">
                            <button class="strategy-btn active" data-strategy="balanced">⚖️ Balanced</button>
                            <button class="strategy-btn" data-strategy="explore">🔍 Explorer</button>
                            <button class="strategy-btn" data-strategy="exploit">🎯 Exploiter</button>
                            <button class="strategy-btn" data-strategy="random">🎲 Random</button>
                        </div>
                    </div>
                    <div class="simulation-controls">
                        <button id="run-strategy" class="interactive-btn primary">Run Strategy</button>
                        <button id="compare-strategies" class="interactive-btn">Compare All</button>
                        <button id="reset-tradeoff" class="interactive-btn secondary">Reset</button>
                    </div>
                </div>
                
                <div class="strategy-results">
                    <div class="result-chart">
                        <h4>Performance Comparison</h4>
                        <canvas id="performance-chart" width="400" height="200"></canvas>
                    </div>
                    <div class="strategy-analysis">
                        <h4>Analysis</h4>
                        <div id="strategy-insights" class="insights-text">
                            <p>Run different strategies to see their performance characteristics!</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Module Content Methods
    getFoundationsContent() {
        return `
            <div class="modal-content">
                <div class="module-header">
                    <h3>🏗️ Foundations of Bayesian Optimization</h3>
                </div>
                <div class="module-body">
                    <div class="foundation-journey">
                        <div class="journey-step active" data-step="1">
                            <h4>The Optimization Problem</h4>
                            <p>Let's start with the fundamental challenge: finding the best parameters when evaluations are expensive.</p>
                            <div class="interactive-example">
                                <canvas id="problem-canvas" width="500" height="200"></canvas>
                                <p class="canvas-caption">A typical expensive-to-evaluate function with multiple peaks</p>
                            </div>
                        </div>
                        
                        <div class="journey-step" data-step="2">
                            <h4>Why Traditional Methods Fail</h4>
                            <p>Grid search, random search, and gradient-based methods are inefficient when each evaluation costs time or money.</p>
                            <div class="comparison-grid">
                                <div class="method-comparison">
                                    <h5>❌ Grid Search</h5>
                                    <p>Evaluates every combination - extremely wasteful</p>
                                </div>
                                <div class="method-comparison">
                                    <h5>❌ Random Search</h5>
                                    <p>No learning from previous evaluations</p>
                                </div>
                                <div class="method-comparison">
                                    <h5>❌ Gradient Descent</h5>
                                    <p>Requires gradients and gets stuck in local minima</p>
                                </div>
                                <div class="method-comparison highlight">
                                    <h5>✅ Bayesian Optimization</h5>
                                    <p>Learns from every evaluation and makes smart choices</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="journey-step" data-step="3">
                            <h4>The Bayesian Approach</h4>
                            <p>Use probability to model uncertainty and make optimal decisions under uncertainty.</p>
                            <div class="bayesian-principles">
                                <div class="principle">
                                    <span class="principle-icon">🧠</span>
                                    <div class="principle-content">
                                        <h5>Prior Beliefs</h5>
                                        <p>Start with assumptions about the function</p>
                                    </div>
                                </div>
                                <div class="principle">
                                    <span class="principle-icon">📊</span>
                                    <div class="principle-content">
                                        <h5>Update with Data</h5>
                                        <p>Refine beliefs as we gather observations</p>
                                    </div>
                                </div>
                                <div class="principle">
                                    <span class="principle-icon">🎯</span>
                                    <div class="principle-content">
                                        <h5>Optimal Decisions</h5>
                                        <p>Choose next evaluation to maximize expected utility</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="navigation-controls">
                            <button class="nav-btn" id="prev-step" disabled>← Previous</button>
                            <button class="nav-btn primary" id="next-step">Next →</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getGaussianProcessContent() {
        return `
            <div class="modal-content">
                <div class="module-header">
                    <h3>📊 Gaussian Processes - The Magic Behind the Surrogate</h3>
                </div>
                <div class="module-body">
                    <div class="gp-deep-dive">
                        <div class="concept-intro">
                            <p>Gaussian Processes are the secret weapon of Bayesian optimization. They don't just predict values - they predict <em>uncertainty</em> too!</p>
                        </div>
                        
                        <div class="gp-interactive">
                            <h4>Build Your Intuition</h4>
                            <canvas id="gp-intuition-canvas" width="600" height="300"></canvas>
                            <div class="gp-playground-controls">
                                <div class="control-section">
                                    <h5>Kernel Parameters</h5>
                                    <label>Length Scale: <span id="gp-length-scale-val">1.0</span></label>
                                    <input type="range" id="gp-length-scale" min="0.1" max="3" step="0.1" value="1.0">
                                    
                                    <label>Signal Variance: <span id="gp-signal-var-val">1.0</span></label>
                                    <input type="range" id="gp-signal-var" min="0.1" max="2" step="0.1" value="1.0">
                                    
                                    <label>Noise Level: <span id="gp-noise-val">0.1</span></label>
                                    <input type="range" id="gp-noise" min="0.01" max="0.5" step="0.01" value="0.1">
                                </div>
                                
                                <div class="control-section">
                                    <h5>Data Points</h5>
                                    <button id="sample-gp" class="interactive-btn">Sample from Prior</button>
                                    <button id="add-data-gp" class="interactive-btn">Add Data Point</button>
                                    <button id="clear-gp" class="interactive-btn secondary">Clear All</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="gp-theory">
                            <h4>Mathematical Foundation</h4>
                            <div class="math-explanation">
                                <div class="equation-block">
                                    <div class="equation">f(x) ~ GP(μ(x), k(x, x'))</div>
                                    <p>A GP is completely specified by its mean function μ(x) and covariance (kernel) function k(x, x')</p>
                                </div>
                                
                                <div class="kernel-showcase">
                                    <h5>Common Kernels</h5>
                                    <div class="kernel-grid">
                                        <div class="kernel-card active" data-kernel="rbf">
                                            <h6>RBF (Squared Exponential)</h6>
                                            <div class="kernel-formula">k(x,x') = σ² exp(-|x-x'|²/2ℓ²)</div>
                                            <p>Smooth, infinitely differentiable functions</p>
                                        </div>
                                        <div class="kernel-card" data-kernel="matern">
                                            <h6>Matérn</h6>
                                            <div class="kernel-formula">More complex - controls smoothness</div>
                                            <p>Flexible smoothness control</p>
                                        </div>
                                        <div class="kernel-card" data-kernel="periodic">
                                            <h6>Periodic</h6>
                                            <div class="kernel-formula">Captures repeating patterns</div>
                                            <p>For cyclical phenomena</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="gp-properties">
                            <h4>Why GPs are Perfect for Bayesian Optimization</h4>
                            <div class="properties-grid">
                                <div class="property-card">
                                    <span class="property-icon">📐</span>
                                    <h5>Exact Inference</h5>
                                    <p>Unlike neural networks, GPs give exact posterior predictions</p>
                                </div>
                                <div class="property-card">
                                    <span class="property-icon">🎲</span>
                                    <h5>Uncertainty Quantification</h5>
                                    <p>Natural measure of prediction confidence</p>
                                </div>
                                <div class="property-card">
                                    <span class="property-icon">🔧</span>
                                    <h5>Hyperparameter Learning</h5>
                                    <p>Can automatically tune kernel parameters</p>
                                </div>
                                <div class="property-card">
                                    <span class="property-icon">⚡</span>
                                    <h5>Sample Efficient</h5>
                                    <p>Works well with few training points</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Challenge System
    startChallenge(level) {
        this.createChallengeModal(level);
    }

    createChallengeModal(level) {
        const challenges = {
            1: { 
                title: 'Level 1: 1D Optimization',
                description: 'Find the global maximum of f(x) = sin(x) * exp(-x/5) + noise',
                targetEvals: 15,
                dimension: 1
            },
            2: {
                title: 'Level 2: 2D Optimization', 
                description: 'Optimize the Branin function - a classic optimization benchmark',
                targetEvals: 25,
                dimension: 2
            },
            3: {
                title: 'Level 3: High-Dimensional',
                description: 'Optimize a 5D function with constraints',
                targetEvals: 50,
                dimension: 5
            }
        };
        
        const challenge = challenges[level];
        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${challenge.title}</h3>
                    <button class="modal-close" onclick="this.closest('.challenge-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="challenge-setup">
                        <p>${challenge.description}</p>
                        <div class="challenge-visualization">
                            <canvas id="challenge-canvas-${level}" width="600" height="400"></canvas>
                        </div>
                        <div class="challenge-controls">
                            <div class="challenge-stats">
                                <div class="stat">
                                    <span class="stat-label">Evaluations Used:</span>
                                    <span class="stat-value" id="challenge-evals-${level}">0</span>
                                    <span class="stat-target">/ ${challenge.targetEvals}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Best Score:</span>
                                    <span class="stat-value" id="challenge-best-${level}">-</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Efficiency:</span>
                                    <span class="stat-value" id="challenge-efficiency-${level}">0%</span>
                                </div>
                            </div>
                            <div class="challenge-buttons">
                                <button class="challenge-btn primary" id="start-challenge-${level}">Start Challenge</button>
                                <button class="challenge-btn" id="hint-challenge-${level}">Get Hint</button>
                                <button class="challenge-btn secondary" id="reset-challenge-${level}">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initializeChallengeLevel(level, modal);
    }

    initializeChallengeLevel(level, modal) {
        // Initialize challenge-specific logic
        const canvas = modal.querySelector(`#challenge-canvas-${level}`);
        const ctx = canvas.getContext('2d');
        
        // Set up challenge state
        this.challengeState = {
            level: level,
            evaluations: 0,
            bestScore: null,
            observations: [],
            targetFunction: this.getChallengeFunction(level)
        };
        
        // Draw initial state
        this.drawChallengeState(ctx, level);
        
        // Set up event listeners
        modal.querySelector(`#start-challenge-${level}`).addEventListener('click', () => {
            this.runChallengeOptimization(level);
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getChallengeFunction(level) {
        const functions = {
            1: (x) => Math.sin(x * 6) * Math.exp(-x / 2) + Math.random() * 0.1,
            2: (x, y) => {
                // Branin function
                const a = 1;
                const b = 5.1 / (4 * Math.PI * Math.PI);
                const c = 5 / Math.PI;
                const r = 6;
                const s = 10;
                const t = 1 / (8 * Math.PI);
                return a * Math.pow(y - b * x * x + c * x - r, 2) + s * (1 - t) * Math.cos(x) + s;
            },
            3: (...params) => {
                // High-dimensional test function
                let sum = 0;
                for (let i = 0; i < params.length; i++) {
                    sum += Math.pow(params[i] - 0.5, 2) * Math.cos(params[i] * 10);
                }
                return -sum + Math.random() * 0.1;
            }
        };
        
        return functions[level];
    }

    runChallengeOptimization(level) {
        // Implement challenge optimization logic
        console.log(`Running challenge ${level}`);
    }

    drawChallengeState(ctx, level) {
        // Draw the current state of the challenge
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        if (level === 1) {
            this.drawChallenge1D(ctx);
        } else if (level === 2) {
            this.drawChallenge2D(ctx);
        } else {
            this.drawChallengeHighD(ctx);
        }
    }

    drawChallenge1D(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Draw function
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const xVal = x / width;
            const yVal = this.challengeState.targetFunction(xVal);
            const yPos = height - (yVal + 1) * height / 3;
            
            if (x === 0) {
                ctx.moveTo(x, yPos);
            } else {
                ctx.lineTo(x, yPos);
            }
        }
        
        ctx.stroke();
        
        // Draw observations if any
        this.challengeState.observations.forEach(obs => {
            ctx.fillStyle = obs.score > 0.5 ? '#4CAF50' : '#f44336';
            ctx.beginPath();
            ctx.arc(obs.x * width, height - (obs.score + 1) * height / 3, 6, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawChallenge2D(ctx) {
        // Implement 2D visualization
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Draw contour plot of Branin function
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const xVal = (x / width) * 15 - 5; // Branin domain
                const yVal = (y / height) * 15;
                const value = this.challengeState.targetFunction(xVal, yVal);
                const index = (y * width + x) * 4;
                
                const normalized = Math.max(0, Math.min(1, (value + 100) / 200));
                data[index] = Math.floor((1 - normalized) * 255);     // R
                data[index + 1] = Math.floor(normalized * 100);       // G  
                data[index + 2] = Math.floor(normalized * 255);       // B
                data[index + 3] = 150; // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    drawChallengeHighD(ctx) {
        // Show high-D optimization progress with parallel coordinates or other technique
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('High-Dimensional Optimization', width / 2, height / 2);
        ctx.fillText('Progress visualization coming soon!', width / 2, height / 2 + 30);
    }

    // Real-world application showcases
    showApplication(appType) {
        const applications = {
            'hyperparameter': this.createHyperparameterShowcase(),
            'drug-discovery': this.createDrugDiscoveryShowcase(),
            'autonomous-driving': this.createAutonomousDrivingShowcase(),
            'manufacturing': this.createManufacturingShowcase()
        };
        
        this.createConceptModal(appType, {
            title: this.getApplicationTitle(appType),
            content: applications[appType]
        });
    }

    getApplicationTitle(appType) {
        const titles = {
            'hyperparameter': '🤖 Hyperparameter Optimization',
            'drug-discovery': '💊 Molecular Property Optimization', 
            'autonomous-driving': '🚗 Autonomous Systems Control',
            'manufacturing': '🏭 Manufacturing Process Optimization'
        };
        return titles[appType];
    }

    createHyperparameterShowcase() {
        return `
            <div class="application-showcase">
                <div class="case-study-intro">
                    <h4>Hyperparameter Optimization Interactive Demo</h4>
                    <p>Experience how different optimization methods compare when tuning machine learning models. See why Bayesian optimization outperforms traditional approaches.</p>
                </div>
                
                <div class="interactive-comparison">
                    <canvas id="hyperparameter-demo" width="600" height="300"></canvas>
                    <div class="comparison-controls">
                        <button class="demo-btn" data-method="grid">Grid Search</button>
                        <button class="demo-btn" data-method="random">Random Search</button>
                        <button class="demo-btn active" data-method="bayesian">Bayesian Optimization</button>
                        <button class="demo-btn" data-method="compare">Compare All</button>
                    </div>
                </div>
                
                <div class="method-comparison">
                    <div class="method-card">
                        <h5>Grid Search</h5>
                        <p>Systematic but wasteful - evaluates every combination</p>
                        <div class="efficiency">Efficiency: Low</div>
                    </div>
                    <div class="method-card">
                        <h5>Random Search</h5>
                        <p>Better than grid but learns nothing from results</p>
                        <div class="efficiency">Efficiency: Medium</div>
                    </div>
                    <div class="method-card highlight">
                        <h5>Bayesian Optimization</h5>
                        <p>Learns from every evaluation to make smart choices</p>
                        <div class="efficiency">Efficiency: High</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Additional methods for module content, interactive demos, etc.
    
    initializeModalInteractivity(type, modal) {
        // Initialize interactive elements within modals
        if (type === 'surrogate') {
            this.setupSurrogateInteractivity(modal);
        } else if (type === 'acquisition') {
            this.setupAcquisitionInteractivity(modal);
        } else if (type === 'optimization') {
            this.setupOptimizationInteractivity(modal);
        } else if (type === 'tradeoff') {
            this.setupTradeoffInteractivity(modal);
        }
    }

    setupSurrogateInteractivity(modal) {
        // Set up interactive GP exploration
        const canvas = modal.querySelector('#gp-exploration-canvas');
        if (canvas) {
            this.setupGPCanvas(canvas);
        }
    }

    setupGPCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        let observations = [];
        
        // Initial draw
        this.drawGPVisualization(ctx, canvas.width, canvas.height, observations);
        
        // Click to add points
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / canvas.width;
            const y = 1 - (e.clientY - rect.top) / canvas.height; // Flip Y
            
            observations.push({ x, y: y * 2 - 1 }); // Scale to [-1, 1]
            this.drawGPVisualization(ctx, canvas.width, canvas.height, observations);
        });
    }

    drawGPVisualization(ctx, width, height, observations) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw GP mean and uncertainty
        const numPoints = width;
        const xValues = Array.from({length: numPoints}, (_, i) => i / (numPoints - 1));
        
        // Simple GP computation (simplified for demo)
        const predictions = xValues.map(x => this.simpleGPPredict(x, observations));
        
        // Draw uncertainty band
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.beginPath();
        predictions.forEach((pred, i) => {
            const x = (i / (numPoints - 1)) * width;
            const yUpper = height/2 - (pred.mean + pred.std) * height/4;
            if (i === 0) ctx.moveTo(x, yUpper);
            else ctx.lineTo(x, yUpper);
        });
        for (let i = predictions.length - 1; i >= 0; i--) {
            const pred = predictions[i];
            const x = (i / (numPoints - 1)) * width;
            const yLower = height/2 - (pred.mean - pred.std) * height/4;
            ctx.lineTo(x, yLower);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw mean line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.beginPath();
        predictions.forEach((pred, i) => {
            const x = (i / (numPoints - 1)) * width;
            const y = height/2 - pred.mean * height/4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        
        // Draw observations
        observations.forEach(obs => {
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(obs.x * width, height/2 - obs.y * height/4, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    simpleGPPredict(x, observations) {
        if (observations.length === 0) {
            return { mean: 0, std: 1 };
        }
        
        // Very simplified GP prediction
        let weightedSum = 0;
        let totalWeight = 0;
        const lengthScale = 0.2;
        
        observations.forEach(obs => {
            const weight = Math.exp(-Math.pow(x - obs.x, 2) / (2 * lengthScale * lengthScale));
            weightedSum += weight * obs.y;
            totalWeight += weight;
        });
        
        const mean = totalWeight > 0 ? weightedSum / totalWeight : 0;
        const std = Math.exp(-totalWeight * 0.5); // Simplified uncertainty
        
        return { mean, std };
    }

    setupMathInteractivity() {
        // Set up range sliders and their update handlers
        const setupSlider = (sliderId, valueId, updateFn) => {
            const slider = document.getElementById(sliderId);
            const valueDisplay = document.getElementById(valueId);
            
            if (slider && valueDisplay) {
                slider.addEventListener('input', (e) => {
                    valueDisplay.textContent = parseFloat(e.target.value).toFixed(2);
                    updateFn(parseFloat(e.target.value));
                });
            }
        };
        
        setupSlider('length-scale', 'length-scale-value', (val) => {
            this.updateGPVisualization('length-scale', val);
        });
        
        setupSlider('noise-level', 'noise-level-value', (val) => {
            this.updateGPVisualization('noise', val);
        });
    }

    updateGPVisualization(parameter, value) {
        // Update the GP visualization based on parameter changes
        const canvas = document.getElementById('gp-interactive');
        if (canvas) {
            // Redraw with new parameters
            this.redrawGPWithParams(canvas, parameter, value);
        }
    }

    redrawGPWithParams(canvas, parameter, value) {
        // Implementation for redrawing GP with updated parameters
        console.log(`Updating GP visualization: ${parameter} = ${value}`);
    }

    initializeMathPlot(tabName) {
        // Initialize interactive plots for different math tabs
        switch(tabName) {
            case 'gaussian-process':
                this.initializeGPPlot();
                break;
            case 'expected-improvement':
                this.initializeEIPlot();
                break;
            case 'upper-confidence':
                this.initializeUCBPlot();
                break;
        }
    }

    initializeGPPlot() {
        const canvas = document.getElementById('gp-interactive');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            this.drawGPExample(ctx, canvas.width, canvas.height);
        }
    }

    drawGPExample(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw a sample GP with prior and posterior
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 1;
        
        // Draw multiple sample paths from GP prior
        for (let sample = 0; sample < 5; sample++) {
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const t = x / width;
                const y = height/2 + 50 * Math.sin(t * 4 + sample) * Math.exp(-t * sample * 0.5);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Add some sample points
        const samplePoints = [
            {x: width * 0.2, y: height * 0.6},
            {x: width * 0.5, y: height * 0.3},
            {x: width * 0.8, y: height * 0.7}
        ];
        
        samplePoints.forEach(point => {
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw posterior mean (conditioned on data)
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // This would be a more sophisticated GP computation in practice
        ctx.moveTo(0, height * 0.5);
        ctx.quadraticCurveTo(width * 0.25, height * 0.6, width * 0.5, height * 0.3);
        ctx.quadraticCurveTo(width * 0.75, height * 0.7, width, height * 0.5);
        ctx.stroke();
    }

    updateInteractiveDemo() {
        // Update the current interactive demonstration
        if (this.interactiveMode) {
            console.log(`Updating demo step: ${this.currentStep}`);
            // Implementation would depend on current demo type
        }
    }

    // Missing Method Implementations
    
    initializeModalInteractivity(type, modal) {
        switch(type) {
            case 'surrogate':
                this.setupSurrogateInteractivity(modal);
                break;
            case 'acquisition':
                this.setupAcquisitionInteractivity(modal);
                break;
            case 'optimization':
                this.setupOptimizationInteractivity(modal);
                break;
            case 'tradeoff':
                this.setupTradeoffInteractivity(modal);
                break;
        }
    }

    setupSurrogateInteractivity(modal) {
        const canvas = modal.querySelector('#gp-exploration-canvas');
        const lengthscaleSlider = modal.querySelector('#lengthscale-slider');
        const noiseSlider = modal.querySelector('#noise-slider');
        
        if (canvas) {
            this.setupGPCanvas(canvas);
            
            // Add click to add points
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / canvas.width;
                const y = 1 - ((e.clientY - rect.top) / canvas.height); // Flip Y coordinate
                
                if (!this.gpDemoData) {
                    this.gpDemoData = { observations: [] };
                }
                
                this.gpDemoData.observations.push({ x, y });
                this.redrawGPDemo(canvas);
            });
        }
        
        if (lengthscaleSlider) {
            lengthscaleSlider.addEventListener('input', (e) => {
                this.redrawGPDemo(canvas);
            });
        }
        
        if (noiseSlider) {
            noiseSlider.addEventListener('input', (e) => {
                this.redrawGPDemo(canvas);
            });
        }
    }

    setupGPCanvas(canvas) {
        if (!this.gpDemoData) {
            this.gpDemoData = { observations: [] };
        }
        this.redrawGPDemo(canvas);
    }

    addGPObservation(canvas, x, y) {
        const ctx = canvas.getContext('2d');
        const normalizedX = x / canvas.width;
        const normalizedY = 1 - (y / canvas.height); // Flip Y coordinate
        
        this.gpObservations.push({ x: normalizedX, y: normalizedY, canvasX: x, canvasY: y });
        this.drawGPVisualization(ctx, canvas.width, canvas.height, this.gpObservations);
    }

    clearGPObservations(canvas) {
        const ctx = canvas.getContext('2d');
        this.gpObservations = [];
        this.drawGPVisualization(ctx, canvas.width, canvas.height, this.gpObservations);
    }

    drawGPVisualization(ctx, width, height, observations) {
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            const y = (i / 10) * height;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw uncertainty bands (simplified)
        if (observations.length > 0) {
            ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
            ctx.beginPath();
            for (let x = 0; x < width; x += 5) {
                const uncertainty = this.calculateUncertainty(x / width, observations);
                const mean = this.calculateMean(x / width, observations);
                const y = height - (mean * height);
                const band = uncertainty * 50;
                
                if (x === 0) {
                    ctx.moveTo(x, y - band);
                } else {
                    ctx.lineTo(x, y - band);
                }
            }
            for (let x = width; x >= 0; x -= 5) {
                const uncertainty = this.calculateUncertainty(x / width, observations);
                const mean = this.calculateMean(x / width, observations);
                const y = height - (mean * height);
                const band = uncertainty * 50;
                ctx.lineTo(x, y + band);
            }
            ctx.fill();
        }
        
        // Draw mean function
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
            const mean = observations.length > 0 ? 
                this.calculateMean(x / width, observations) :
                0.5 + 0.2 * Math.sin(x / width * 6);
            const y = height - (mean * height);
            
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Draw observations
        observations.forEach(obs => {
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(obs.canvasX, obs.canvasY, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            // Add white border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }

    calculateMean(x, observations) {
        if (observations.length === 0) {
            return 0.5 + 0.2 * Math.sin(x * 6);
        }
        
        // Simplified GP mean calculation
        let weightedSum = 0;
        let weights = 0;
        
        observations.forEach(obs => {
            const distance = Math.abs(x - obs.x);
            const weight = Math.exp(-distance * 10); // Simplified kernel
            weightedSum += weight * obs.y;
            weights += weight;
        });
        
        return weights > 0 ? weightedSum / weights : 0.5;
    }

    calculateUncertainty(x, observations) {
        if (observations.length === 0) {
            return 0.3;
        }
        
        // Simplified uncertainty calculation
        let minDistance = Infinity;
        observations.forEach(obs => {
            const distance = Math.abs(x - obs.x);
            minDistance = Math.min(minDistance, distance);
        });
        
        return Math.min(0.4, minDistance * 2);
    }

    setupAcquisitionInteractivity(modal) {
        const canvas = modal.querySelector('#acquisition-comparison-canvas');
        const showEI = modal.querySelector('#show-ei');
        const showUCB = modal.querySelector('#show-ucb');
        const showPI = modal.querySelector('#show-pi');
        const ucbKappa = modal.querySelector('#ucb-kappa');
        const animateBtn = modal.querySelector('#animate-acquisition');
        
        if (canvas) {
            this.drawAcquisitionComparison(canvas);
        }
        
        [showEI, showUCB, showPI].forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    this.drawAcquisitionComparison(canvas);
                });
            }
        });
        
        if (ucbKappa) {
            ucbKappa.addEventListener('input', (e) => {
                modal.querySelector('#ucb-kappa-value').textContent = e.target.value;
                this.drawAcquisitionComparison(canvas);
            });
        }
        
        if (animateBtn) {
            animateBtn.addEventListener('click', () => {
                this.animateAcquisitionSelection(canvas);
            });
        }
    }

    drawAcquisitionComparison(canvas) {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // Simulated GP with some observations
        const observations = [
            {x: 0.2, y: 0.3},
            {x: 0.5, y: 0.7},
            {x: 0.8, y: 0.4}
        ];
        
        // Draw GP mean and uncertainty
        this.drawSimplifiedGP(ctx, width, height, observations);
        
        // Draw acquisition functions
        const showEI = document.querySelector('#show-ei')?.checked !== false;
        const showUCB = document.querySelector('#show-ucb')?.checked !== false;
        const showPI = document.querySelector('#show-pi')?.checked !== false;
        
        if (showEI) this.drawEI(ctx, width, height, observations);
        if (showUCB) this.drawUCB(ctx, width, height, observations);
        if (showPI) this.drawPI(ctx, width, height, observations);
        
        // Draw observations
        observations.forEach(obs => {
            const x = obs.x * width;
            const y = height * 0.7 - (obs.y - 0.5) * height * 0.4;
            
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    drawSimplifiedGP(ctx, width, height, observations) {
        // Draw mean
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const y = height * 0.7 - (mean - 0.5) * height * 0.4;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Draw uncertainty band
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 5) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const uncertainty = this.calculateUncertainty(t, observations);
            const meanY = height * 0.7 - (mean - 0.5) * height * 0.4;
            const band = uncertainty * height * 0.2;
            
            if (x === 0) ctx.moveTo(x, meanY - band);
            else ctx.lineTo(x, meanY - band);
        }
        
        for (let x = width; x >= 0; x -= 5) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const uncertainty = this.calculateUncertainty(t, observations);
            const meanY = height * 0.7 - (mean - 0.5) * height * 0.4;
            const band = uncertainty * height * 0.2;
            
            ctx.lineTo(x, meanY + band);
        }
        ctx.fill();
    }

    drawEI(ctx, width, height, observations) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const currentBest = Math.max(...observations.map(obs => obs.y));
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const uncertainty = this.calculateUncertainty(t, observations);
            
            // Simplified EI calculation
            const improvement = Math.max(0, mean - currentBest);
            const ei = improvement * uncertainty * 5; // Scaled for visualization
            const y = height - ei * height * 0.3;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Add legend
        ctx.fillStyle = '#4CAF50';
        ctx.font = '12px Arial';
        ctx.fillText('EI', 10, 20);
    }

    drawUCB(ctx, width, height, observations) {
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const kappa = parseFloat(document.querySelector('#ucb-kappa')?.value || '2.0');
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const uncertainty = this.calculateUncertainty(t, observations);
            
            const ucb = mean + kappa * uncertainty;
            const y = height - (ucb - 0.5) * height * 0.3;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Add legend
        ctx.fillStyle = '#FF9800';
        ctx.font = '12px Arial';
        ctx.fillText('UCB', 10, 35);
    }

    drawPI(ctx, width, height, observations) {
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const currentBest = Math.max(...observations.map(obs => obs.y));
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const mean = this.calculateMean(t, observations);
            const uncertainty = this.calculateUncertainty(t, observations);
            
            // Simplified PI calculation
            const z = uncertainty > 0 ? (mean - currentBest) / uncertainty : 0;
            const pi = Math.max(0, 0.5 * (1 + this.erf(z / Math.sqrt(2))));
            const y = height - pi * height * 0.3;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Add legend
        ctx.fillStyle = '#9C27B0';
        ctx.font = '12px Arial';
        ctx.fillText('PI', 10, 50);
    }

    erf(x) {
        // Approximation of error function for PI calculation
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

    animateAcquisitionSelection(canvas) {
        // Animate finding the maximum of the acquisition function
        const ctx = canvas.getContext('2d');
        let animationStep = 0;
        const maxSteps = 50;
        
        const animate = () => {
            this.drawAcquisitionComparison(canvas);
            
            // Draw scanning line
            const x = (animationStep / maxSteps) * canvas.width;
            ctx.strokeStyle = '#f44336';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
            
            animationStep++;
            if (animationStep <= maxSteps) {
                setTimeout(animate, 50);
            } else {
                // Mark the maximum
                ctx.fillStyle = '#f44336';
                ctx.beginPath();
                ctx.arc(canvas.width * 0.7, canvas.height * 0.3, 8, 0, 2 * Math.PI);
                ctx.fill();
            }
        };
        
        animate();
    }

    setupOptimizationInteractivity(modal) {
        // Implementation for optimization loop interactivity
        const canvas = modal.querySelector('#sequential-canvas');
        const startBtn = modal.querySelector('#start-sequential');
        const stepBtn = modal.querySelector('#step-sequential');
        const resetBtn = modal.querySelector('#reset-sequential');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startSequentialDemo(canvas);
            });
        }
        
        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                this.stepSequentialDemo(canvas);
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSequentialDemo(canvas);
            });
        }
    }

    setupTradeoffInteractivity(modal) {
        // Implementation for tradeoff exploration
        const canvas = modal.querySelector('#tradeoff-canvas');
        const strategyBtns = modal.querySelectorAll('.strategy-btn');
        
        strategyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                strategyBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateTradeoffStrategy(canvas, e.target.dataset.strategy);
            });
        });
    }

    startSequentialDemo(canvas) {
        // Implementation for sequential optimization demo
        console.log('Starting sequential demo');
    }

    stepSequentialDemo(canvas) {
        // Implementation for stepping through optimization
        console.log('Stepping sequential demo');
    }

    resetSequentialDemo(canvas) {
        // Implementation for resetting demo
        console.log('Resetting sequential demo');
    }

    updateTradeoffStrategy(canvas, strategy) {
        // Implementation for updating strategy visualization
        console.log(`Updating strategy: ${strategy}`);
    }

    // Additional missing methods
    showMathematicalFoundation() {
        console.log('Showing mathematical foundation');
    }

    showAcquisitionFunctions() {
        console.log('Showing acquisition functions');
    }

    showApplication(appType) {
        const modal = document.createElement('div');
        modal.className = 'application-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.getApplicationTitle(appType)}</h3>
                    <button class="modal-close" onclick="this.closest('.application-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.getApplicationContent(appType)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getApplicationContent(appType) {
        switch(appType) {
            case 'hyperparameter':
                return this.createHyperparameterShowcase();
            case 'drug-discovery':
                return this.createDrugDiscoveryShowcase();
            case 'autonomous-driving':
                return this.createAutonomousDrivingShowcase();
            case 'manufacturing':
                return this.createManufacturingShowcase();
            default:
                return '<p>Application showcase coming soon!</p>';
        }
    }

    createDrugDiscoveryShowcase() {
        return `
            <div class="application-showcase">
                <div class="case-study-intro">
                    <h4>Molecular Property Optimization</h4>
                    <p>Explore how Bayesian optimization transforms pharmaceutical research by minimizing expensive laboratory experiments.</p>
                </div>
                
                <div class="optimization-scenario">
                    <canvas id="drug-discovery-demo" width="600" height="300"></canvas>
                    <div class="scenario-controls">
                        <button class="demo-btn" id="add-molecule">Synthesize Molecule</button>
                        <button class="demo-btn" id="optimize-properties">Optimize Properties</button>
                        <button class="demo-btn" id="reset-discovery">Reset Experiment</button>
                    </div>
                </div>
                
                <div class="discovery-insights">
                    <div class="insight-card">
                        <h5>🧪 Lab Efficiency</h5>
                        <p>Each synthesis costs $10,000+ and takes weeks. Bayesian optimization reduces experiments by 90%.</p>
                    </div>
                    <div class="insight-card">
                        <h5>⏰ Time Savings</h5>
                        <p>Traditional screening takes years. Smart optimization cuts this to months.</p>
                    </div>
                    <div class="insight-card">
                        <h5>💰 Cost Impact</h5>
                        <p>Millions saved per drug candidate by avoiding unnecessary experiments.</p>
                    </div>
                </div>
            </div>
        `;
    }

    createAutonomousDrivingShowcase() {
        return `
            <div class="application-showcase">
                <h4>Tesla's Autopilot: Optimizing Control Algorithms</h4>
                <p>Explore how Bayesian optimization helps tune autonomous driving parameters.</p>
                <canvas id="autonomous-demo" width="600" height="300"></canvas>
            </div>
        `;
    }

    createManufacturingShowcase() {
        return `
            <div class="application-showcase">
                <h4>Boeing's Production Line: Quality & Efficiency</h4>
                <p>Discover how manufacturing parameters are optimized for maximum quality.</p>
                <canvas id="manufacturing-demo" width="600" height="300"></canvas>
            </div>
        `;
    }

    createChallengeModal(level) {
        const modal = document.createElement('div');
        modal.className = 'challenge-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Challenge Level ${level}</h3>
                    <button class="modal-close" onclick="this.closest('.challenge-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.getChallengeContent(level)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.initializeChallengeLevel(level, modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    getChallengeContent(level) {
        const challenges = {
            1: {
                title: 'Beginner: 1D Optimization',
                description: 'Find the global maximum of a noisy sine wave function',
                target: '15 evaluations'
            },
            2: {
                title: 'Intermediate: 2D Optimization', 
                description: 'Optimize a complex 2D function with multiple local optima',
                target: '25 evaluations'
            },
            3: {
                title: 'Expert: High-Dimensional',
                description: 'Tackle a 5D optimization problem with constraints',
                target: '50 evaluations'
            }
        };
        
        const challenge = challenges[level];
        
        return `
            <div class="challenge-content">
                <div class="challenge-info">
                    <h4>${challenge.title}</h4>
                    <p>${challenge.description}</p>
                    <div class="challenge-target">🎯 Target: ${challenge.target}</div>
                </div>
                
                <div class="challenge-workspace">
                    <canvas id="challenge-canvas-${level}" width="600" height="400"></canvas>
                    <div class="challenge-controls">
                        <button class="challenge-btn primary" onclick="this.runChallengeStep(${level})">Next Evaluation</button>
                        <button class="challenge-btn" onclick="this.resetChallenge(${level})">Reset</button>
                        <button class="challenge-btn" onclick="this.showHint(${level})">Hint</button>
                    </div>
                </div>
                
                <div class="challenge-stats">
                    <div class="stat">
                        <span class="label">Evaluations Used:</span>
                        <span class="value" id="challenge-evals-${level}">0</span>
                    </div>
                    <div class="stat">
                        <span class="label">Best Score:</span>
                        <span class="value" id="challenge-best-${level}">-</span>
                    </div>
                    <div class="stat">
                        <span class="label">Efficiency:</span>
                        <span class="value" id="challenge-efficiency-${level}">-</span>
                    </div>
                </div>
            </div>
        `;
    }

    initializeChallengeLevel(level, modal) {
        const canvas = modal.querySelector(`#challenge-canvas-${level}`);
        if (canvas) {
            this.drawChallengeState(canvas.getContext('2d'), level);
        }
    }

    drawChallengeState(ctx, level) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        switch(level) {
            case 1:
                this.drawChallenge1D(ctx);
                break;
            case 2:
                this.drawChallenge2D(ctx);
                break;
            case 3:
                this.drawChallengeHighD(ctx);
                break;
        }
    }

    drawChallenge1D(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Draw 1D function
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const y = height * 0.8 - height * 0.6 * (Math.sin(t * 8) * Math.exp(-t * 2) + 0.3 * Math.sin(t * 20));
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    drawChallenge2D(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Draw 2D function as contours
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const value = this.challenge2DFunction(x / width, y / height);
                const index = (y * width + x) * 4;
                
                const intensity = Math.max(0, Math.min(1, (value + 1) / 2));
                data[index] = Math.floor(intensity * 255);
                data[index + 1] = Math.floor(intensity * 150);
                data[index + 2] = Math.floor((1 - intensity) * 255);
                data[index + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    challenge2DFunction(x, y) {
        return Math.sin(x * 6) * Math.cos(y * 6) * Math.exp(-((x - 0.7) ** 2 + (y - 0.3) ** 2) * 3);
    }

    drawChallengeHighD(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Visualization for high-dimensional challenge
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('5-Dimensional Optimization Challenge', width / 2, height / 2 - 20);
        ctx.fillText('Parameters: [x1, x2, x3, x4, x5]', width / 2, height / 2 + 20);
    }

    setupMathInteractivity() {
        // Setup math playground interactivity
        const lengthScaleSlider = document.getElementById('length-scale');
        const noiseLevelSlider = document.getElementById('noise-level');
        const currentBestSlider = document.getElementById('current-best');
        const kappaSlider = document.getElementById('kappa');
        
        if (lengthScaleSlider) {
            lengthScaleSlider.addEventListener('input', (e) => {
                this.updateGPParameter('lengthScale', e.target.value);
            });
        }
        
        if (noiseLevelSlider) {
            noiseLevelSlider.addEventListener('input', (e) => {
                this.updateGPParameter('noise', e.target.value);
            });
        }
        
        if (currentBestSlider) {
            currentBestSlider.addEventListener('input', (e) => {
                this.updateAcquisitionParameter('currentBest', e.target.value);
            });
        }
        
        if (kappaSlider) {
            kappaSlider.addEventListener('input', (e) => {
                this.updateAcquisitionParameter('kappa', e.target.value);
            });
        }
    }

    updateGPParameter(param, value) {
        const canvas = document.getElementById('gp-interactive');
        if (canvas) {
            this.redrawGPWithParams(canvas, param, value);
        }
    }

    updateAcquisitionParameter(param, value) {
        const canvas = document.getElementById('ei-interactive') || document.getElementById('ucb-interactive');
        if (canvas) {
            this.redrawAcquisitionWithParams(canvas, param, value);
        }
    }

    redrawGPWithParams(canvas, parameter, value) {
        const ctx = canvas.getContext('2d');
        // Implementation for updating GP visualization with new parameters
        this.drawGPExample(ctx, canvas.width, canvas.height);
    }

    redrawAcquisitionWithParams(canvas, parameter, value) {
        const ctx = canvas.getContext('2d');
        // Implementation for updating acquisition function with new parameters
        console.log(`Updating ${parameter} to ${value}`);
    }

    initializeMathPlot(tabName) {
        switch(tabName) {
            case 'gaussian-process':
                this.initializeGPPlot();
                break;
            case 'expected-improvement':
                this.initializeEIPlot();
                break;
            case 'upper-confidence':
                this.initializeUCBPlot();
                break;
        }
    }

    initializeGPPlot() {
        const canvas = document.getElementById('gp-interactive');
        if (canvas) {
            this.drawGPExample(canvas.getContext('2d'), canvas.width, canvas.height);
        }
    }

    initializeEIPlot() {
        const canvas = document.getElementById('ei-interactive');
        if (canvas) {
            this.drawEIExample(canvas.getContext('2d'), canvas.width, canvas.height);
        }
    }

    initializeUCBPlot() {
        const canvas = document.getElementById('ucb-interactive');
        if (canvas) {
            this.drawUCBExample(canvas.getContext('2d'), canvas.width, canvas.height);
        }
    }

    drawGPExample(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw a nice GP example
        const observations = [
            {x: 0.2, y: 0.3},
            {x: 0.6, y: 0.8},
            {x: 0.9, y: 0.4}
        ];
        
        this.drawGPVisualization(ctx, width, height, observations.map(obs => ({
            x: obs.x,
            y: obs.y,
            canvasX: obs.x * width,
            canvasY: height - obs.y * height
        })));
    }

    drawEIExample(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Expected Improvement example
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const ei = Math.exp(-Math.pow(t - 0.7, 2) / 0.1) * 0.8;
            const y = height - ei * height;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('Expected Improvement', 10, 20);
    }

    // Interactive demo openers called from concept buttons
    openGPDemo() {
        this.createConceptModal('gaussian-process', {
            title: '🔬 Gaussian Process Explorer',
            content: this.createGaussianProcessDemo()
        });
    }

    openAcquisitionDemo() {
        this.createConceptModal('acquisition', {
            title: '📊 Acquisition Functions Lab',
            content: this.createAcquisitionFunctionsDemo()
        });
    }

    openSequentialDemo() {
        this.createConceptModal('sequential', {
            title: '🔄 Sequential Learning Demo',
            content: this.createSequentialOptimizationDemo()
        });
    }

    createGaussianProcessDemo() {
        return `
            <div class="gp-demo">
                <div class="demo-explanation">
                    <h4>Understanding Gaussian Processes</h4>
                    <p>
                        A Gaussian Process is like a smart interpolator that not only predicts values between 
                        known points, but also tells us how confident it is in those predictions.
                    </p>
                    <p><strong>Instructions:</strong> Click anywhere on the canvas below to add data points. 
                    Watch how the GP updates its predictions and uncertainty bands!</p>
                </div>
                
                <div class="interactive-gp">
                    <canvas id="gp-exploration-canvas" width="600" height="300"></canvas>
                    <div class="gp-controls">
                        <div class="control-row">
                            <button class="demo-btn" onclick="educationManager.addRandomGPPoint()">Add Random Point</button>
                            <button class="demo-btn secondary" onclick="educationManager.clearGPPoints()">Clear All</button>
                            <button class="demo-btn" onclick="educationManager.animateGPPrediction()">Show Prediction</button>
                        </div>
                        <div class="control-row">
                            <label>Smoothness: <input type="range" id="lengthscale-slider" min="0.1" max="2" step="0.1" value="0.8"></label>
                            <label>Noise: <input type="range" id="noise-slider" min="0.01" max="0.3" step="0.01" value="0.1"></label>
                        </div>
                    </div>
                </div>
                
                <div class="demo-insights">
                    <div class="insight-box">
                        <h5>📈 The Blue Line</h5>
                        <p>Shows the GP's best guess (mean prediction) at every point</p>
                    </div>
                    <div class="insight-box">
                        <h5>🌫️ The Gray Band</h5>
                        <p>Shows uncertainty - wider bands mean "I'm not sure what happens here"</p>
                    </div>
                    <div class="insight-box">
                        <h5>🎯 Key Insight</h5>
                        <p>Bayesian Optimization uses uncertainty to decide where to explore next</p>
                    </div>
                </div>
            </div>
        `;
    }

    createAcquisitionFunctionsDemo() {
        return `
            <div class="acquisition-demo">
                <div class="demo-explanation">
                    <h4>Acquisition Functions: The Decision Makers</h4>
                    <p>
                        Given a Gaussian Process model, how do we decide where to sample next? 
                        Acquisition functions balance <strong>exploitation</strong> (sampling where we expect good results) 
                        with <strong>exploration</strong> (sampling where we're uncertain).
                    </p>
                </div>
                
                <div class="acquisition-comparison">
                    <canvas id="acquisition-comparison-canvas" width="600" height="400"></canvas>
                    <div class="acquisition-controls">
                        <div class="function-toggles">
                            <label><input type="checkbox" id="show-ei" checked> Expected Improvement (Balanced)</label>
                            <label><input type="checkbox" id="show-ucb" checked> Upper Confidence Bound (Optimistic)</label>
                            <label><input type="checkbox" id="show-pi"> Probability of Improvement (Conservative)</label>
                        </div>
                        <div class="parameter-controls">
                            <label>UCB Exploration: <input type="range" id="ucb-kappa" min="0.1" max="3" step="0.1" value="2.0"></label>
                            <span id="ucb-kappa-value">2.0</span>
                        </div>
                        <button class="demo-btn primary" onclick="educationManager.stepAcquisitionDemo()">Next Sample Step</button>
                        <button class="demo-btn secondary" onclick="educationManager.resetAcquisitionDemo()">Reset Demo</button>
                    </div>
                </div>
                
                <div class="acquisition-insights">
                    <div class="strategy-card">
                        <h5>🎯 Expected Improvement (EI)</h5>
                        <p>The balanced approach - considers both how much improvement is expected and how likely it is. 
                        Good general-purpose choice.</p>
                    </div>
                    <div class="strategy-card">
                        <h5>📈 Upper Confidence Bound (UCB)</h5>
                        <p>The optimist - assumes uncertainty could lead to great results. Explores more aggressively.</p>
                    </div>
                    <div class="strategy-card">
                        <h5>🎲 Probability of Improvement (PI)</h5>
                        <p>The conservative - only cares if there's improvement, not how much. Can get stuck in local optima.</p>
                    </div>
                </div>
            </div>
        `;
    }

    createSequentialOptimizationDemo() {
        return `
            <div class="sequential-demo">
                <div class="demo-explanation">
                    <h4>The Sequential Learning Loop</h4>
                    <p>
                        Bayesian Optimization is <strong>sequential</strong> - each new observation makes the model smarter. 
                        Watch as the algorithm builds knowledge step by step, becoming more confident about promising 
                        areas and more strategic about where to explore.
                    </p>
                </div>
                
                <div class="sequential-visualization">
                    <canvas id="sequential-canvas" width="600" height="350"></canvas>
                    <div class="sequential-controls">
                        <button class="demo-btn primary" id="start-sequential" onclick="educationManager.startSequentialOptimization()">Start Optimization</button>
                        <button class="demo-btn" id="step-sequential" onclick="educationManager.stepSequentialOptimization()" disabled>Next Step</button>
                        <button class="demo-btn secondary" id="reset-sequential" onclick="educationManager.resetSequentialOptimization()">Reset</button>
                        <div class="speed-control">
                            <label>Speed: <input type="range" id="animation-speed" min="0.5" max="3" step="0.1" value="1"></label>
                        </div>
                    </div>
                </div>
                
                <div class="step-info">
                    <h5>Current Step: <span id="current-step-title">Ready to Start</span></h5>
                    <div id="step-explanation" class="step-explanation">
                        <p>Click "Start Optimization" to begin the sequential learning process!</p>
                    </div>
                </div>
                
                <div class="optimization-metrics">
                    <div class="metric">
                        <span class="metric-label">Step:</span>
                        <span class="metric-value" id="step-count">0</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Best Found:</span>
                        <span class="metric-value" id="best-value">-</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Next Sample:</span>
                        <span class="metric-value" id="next-sample">-</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Global methods that can be called from onclick handlers
    // Functional Interactive Demo Methods
    
    addRandomGPPoint() {
        const canvas = document.getElementById('gp-exploration-canvas');
        if (!canvas) return;
        
        if (!this.gpDemoData) {
            this.gpDemoData = { observations: [] };
        }
        
        const x = Math.random();
        const y = 0.5 + 0.3 * Math.sin(x * 8) + (Math.random() - 0.5) * 0.2;
        
        this.gpDemoData.observations.push({ x, y });
        this.redrawGPDemo(canvas);
    }
    
    clearGPPoints() {
        const canvas = document.getElementById('gp-exploration-canvas');
        if (!canvas) return;
        
        this.gpDemoData = { observations: [] };
        this.redrawGPDemo(canvas);
    }
    
    animateGPPrediction() {
        const canvas = document.getElementById('gp-exploration-canvas');
        if (!canvas) return;
        
        // Add a prediction animation
        this.animationStep = 0;
        const animate = () => {
            this.animationStep += 0.05;
            this.redrawGPDemo(canvas, this.animationStep);
            if (this.animationStep < 2) {
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
    
    redrawGPDemo(canvas, animationPhase = 0) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // Grid
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            const y = (i / 10) * height;
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
            ctx.moveTo(0, y); ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        if (!this.gpDemoData || this.gpDemoData.observations.length === 0) {
            // Show prior
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, height/2);
            ctx.lineTo(width, height/2);
            ctx.stroke();
            
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Click to add data points!', width/2, height/2 + 30);
            return;
        }
        
        // Draw uncertainty band
        const observations = this.gpDemoData.observations;
        ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
        ctx.beginPath();
        
        for (let px = 0; px < width; px += 5) {
            const x = px / width;
            const prediction = this.gpPredict(x, observations);
            const y = height - (prediction.mean * height);
            const uncertainty = prediction.std * height * 0.3;
            
            if (px === 0) ctx.moveTo(px, y - uncertainty);
            else ctx.lineTo(px, y - uncertainty);
        }
        for (let px = width; px >= 0; px -= 5) {
            const x = px / width;
            const prediction = this.gpPredict(x, observations);
            const y = height - (prediction.mean * height);
            const uncertainty = prediction.std * height * 0.3;
            ctx.lineTo(px, y + uncertainty);
        }
        ctx.fill();
        
        // Draw mean function
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let px = 0; px < width; px += 2) {
            const x = px / width;
            const prediction = this.gpPredict(x, observations);
            const y = height - (prediction.mean * height);
            
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
        }
        ctx.stroke();
        
        // Draw observations
        observations.forEach(obs => {
            const px = obs.x * width;
            const py = height - (obs.y * height);
            
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Animation effects
        if (animationPhase > 0) {
            ctx.fillStyle = `rgba(6, 255, 165, ${Math.sin(animationPhase * 2) * 0.3 + 0.3})`;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    gpPredict(x, observations) {
        if (observations.length === 0) {
            return { mean: 0.5, std: 0.5 };
        }
        
        // Simple kernel-based prediction
        let weightedSum = 0;
        let weights = 0;
        let minDistance = Infinity;
        
        const lengthScale = parseFloat(document.getElementById('lengthscale-slider')?.value || '0.8');
        
        observations.forEach(obs => {
            const distance = Math.abs(x - obs.x);
            minDistance = Math.min(minDistance, distance);
            const weight = Math.exp(-Math.pow(distance / lengthScale, 2));
            weightedSum += weight * obs.y;
            weights += weight;
        });
        
        const mean = weights > 0 ? weightedSum / weights : 0.5;
        const std = Math.max(0.1, Math.min(0.5, minDistance / lengthScale));
        
        return { mean, std };
    }
    
    // Acquisition function demo methods
    stepAcquisitionDemo() {
        console.log('Stepping acquisition function demo');
        const canvas = document.getElementById('acquisition-comparison-canvas');
        if (canvas) {
            this.drawAcquisitionStep(canvas);
        }
    }
    
    resetAcquisitionDemo() {
        console.log('Resetting acquisition demo');
        const canvas = document.getElementById('acquisition-comparison-canvas');
        if (canvas) {
            this.acquisitionDemoData = null;
            this.drawAcquisitionComparison(canvas);
        }
    }
    
    drawAcquisitionStep(canvas) {
        if (!this.acquisitionDemoData) {
            this.acquisitionDemoData = {
                observations: [
                    { x: 0.2, y: 0.3 },
                    { x: 0.5, y: 0.8 },
                    { x: 0.8, y: 0.4 }
                ],
                step: 0
            };
        }
        
        // Add new observation based on acquisition function
        const nextX = this.findAcquisitionMaximum();
        const nextY = this.evaluateFunction(nextX);
        
        this.acquisitionDemoData.observations.push({ x: nextX, y: nextY });
        this.acquisitionDemoData.step++;
        
        this.drawAcquisitionComparison(canvas);
    }
    
    findAcquisitionMaximum() {
        // Simple grid search for acquisition maximum
        let bestX = 0;
        let bestAcq = -Infinity;
        
        for (let x = 0; x <= 1; x += 0.01) {
            const acq = this.calculateEI(x);
            if (acq > bestAcq) {
                bestAcq = acq;
                bestX = x;
            }
        }
        
        return bestX + (Math.random() - 0.5) * 0.1; // Add some noise
    }
    
    calculateEI(x) {
        if (!this.acquisitionDemoData) return 0;
        
        const observations = this.acquisitionDemoData.observations;
        const prediction = this.gpPredict(x, observations);
        const currentBest = Math.max(...observations.map(obs => obs.y));
        
        const improvement = Math.max(0, prediction.mean - currentBest);
        return improvement * prediction.std;
    }
    
    evaluateFunction(x) {
        // Test function with noise
        return 0.5 + 0.4 * Math.sin(x * 8) * Math.exp(-x) + (Math.random() - 0.5) * 0.1;
    }
    
    // Sequential optimization demo methods
    startSequentialOptimization() {
        this.sequentialData = {
            observations: [],
            step: 0,
            isRunning: true
        };
        
        document.getElementById('start-sequential').disabled = true;
        document.getElementById('step-sequential').disabled = false;
        
        this.stepSequentialOptimization();
    }
    
    stepSequentialOptimization() {
        if (!this.sequentialData || !this.sequentialData.isRunning) return;
        
        const canvas = document.getElementById('sequential-canvas');
        if (!canvas) return;
        
        this.sequentialData.step++;
        
        if (this.sequentialData.step === 1) {
            // First random sample
            this.sequentialData.observations.push({ x: 0.3, y: 0.4 });
            this.updateSequentialDisplay('Initial Random Sample', 'Started with a random point to begin learning');
        } else {
            // Use acquisition function
            const nextX = this.findSequentialNext();
            const nextY = this.evaluateFunction(nextX);
            this.sequentialData.observations.push({ x: nextX, y: nextY });
            this.updateSequentialDisplay('Bayesian Sample', `Used acquisition function to select x=${nextX.toFixed(2)}, got y=${nextY.toFixed(2)}`);
        }
        
        this.drawSequentialVisualization(canvas);
        
        if (this.sequentialData.step >= 10) {
            this.sequentialData.isRunning = false;
            document.getElementById('step-sequential').disabled = true;
            this.updateSequentialDisplay('Optimization Complete!', 'Found good solution with intelligent sampling');
        }
    }
    
    findSequentialNext() {
        return this.findAcquisitionMaximum();
    }
    
    updateSequentialDisplay(title, explanation) {
        const titleEl = document.getElementById('current-step-title');
        const explanationEl = document.getElementById('step-explanation');
        const stepCountEl = document.getElementById('step-count');
        const bestValueEl = document.getElementById('best-value');
        
        if (titleEl) titleEl.textContent = title;
        if (explanationEl) explanationEl.innerHTML = `<p>${explanation}</p>`;
        if (stepCountEl) stepCountEl.textContent = this.sequentialData.step;
        if (bestValueEl && this.sequentialData.observations.length > 0) {
            const best = Math.max(...this.sequentialData.observations.map(obs => obs.y));
            bestValueEl.textContent = best.toFixed(3);
        }
    }
    
    drawSequentialVisualization(canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        if (!this.sequentialData || this.sequentialData.observations.length === 0) return;
        
        // Draw true function (lightly)
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let px = 0; px < width; px += 2) {
            const x = px / width;
            const y = height - (this.evaluateFunction(x) * height);
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
        }
        ctx.stroke();
        
        // Draw GP prediction
        this.redrawGPDemo(canvas, 0);
        
        // Highlight the sequence
        const observations = this.sequentialData.observations;
        observations.forEach((obs, i) => {
            const px = obs.x * width;
            const py = height - (obs.y * height);
            
            // Draw line to previous point
            if (i > 0) {
                const prevPx = observations[i-1].x * width;
                const prevPy = height - (observations[i-1].y * height);
                
                ctx.strokeStyle = '#48cae4';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(prevPx, prevPy);
                ctx.lineTo(px, py);
                ctx.stroke();
            }
            
            // Draw point
            const isLatest = i === observations.length - 1;
            ctx.fillStyle = isLatest ? '#06ffa5' : '#48cae4';
            ctx.beginPath();
            ctx.arc(px, py, isLatest ? 10 : 8, 0, 2 * Math.PI);
            ctx.fill();
            
            // Label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), px, py - 15);
        });
    }
    
    resetSequentialOptimization() {
        this.sequentialData = null;
        document.getElementById('start-sequential').disabled = false;
        document.getElementById('step-sequential').disabled = true;
        
        const canvas = document.getElementById('sequential-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        this.updateSequentialDisplay('Ready to Start', 'Click "Start Optimization" to begin!');
    }

    runExperiment() {
        console.log('Running drug discovery experiment');
    }

    addObservationPoint() {
        console.log('Adding observation point to mathematical foundation');
    }

    compareAcquisition() {
        console.log('Comparing acquisition functions');
    }

    runChallengeStep(level) {
        console.log(`Running challenge step for level ${level}`);
    }

    resetChallenge(level) {
        console.log(`Resetting challenge level ${level}`);
    }

    showHint(level) {
        alert(`Hint for Level ${level}: Try to balance exploration and exploitation. Start with areas of high uncertainty!`);
    }

    stepThroughLoop() {
        console.log('Stepping through optimization loop');
    }

    // Additional interactive demo methods
    addRandomPoint() {
        console.log('Adding random point to GP demo');
    }

    clearPoints() {
        console.log('Clearing all points from demo');
    }

    runAcquisitionStep() {
        console.log('Running acquisition function step');
    }

    resetAcquisition() {
        console.log('Resetting acquisition function demo');
    }

    drawUCBExample(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        
        // Draw Upper Confidence Bound example
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let x = 0; x < width; x += 2) {
            const t = x / width;
            const mean = 0.5 + 0.3 * Math.sin(t * 4);
            const uncertainty = 0.2 * Math.exp(-Math.abs(t - 0.5) * 3);
            const kappa = 1.96;
            const ucb = mean + kappa * uncertainty;
            const y = height - ucb * height;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('Upper Confidence Bound', 10, 20);
    }

    // Mathematical functionality methods for enhanced deep dive
    initializeMathPlot(plotType) {
        const canvasId = plotType + '-canvas';
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = 500;
        canvas.height = 300;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        switch(plotType) {
            case 'gaussian-process':
                this.drawGaussianProcess(ctx, canvas);
                break;
            case 'expected-improvement':
                this.drawExpectedImprovement(ctx, canvas);
                break;
            case 'upper-confidence':
                this.drawUpperConfidenceBound(ctx, canvas);
                break;
            case 'bayesian-inference':
                this.drawBayesianInference(ctx, canvas);
                break;
            case 'kernel-theory':
                this.drawKernelTheory(ctx, canvas);
                break;
        }
    }

    drawGaussianProcess(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(margin, margin);
        ctx.stroke();
        
        // Generate sample GP data
        const n = 100;
        const x = [];
        const mean = [];
        const upper = [];
        const lower = [];
        
        for(let i = 0; i < n; i++) {
            const xi = (i / n) * 6 - 3;
            x.push(xi);
            const mi = Math.sin(xi) * 0.5;
            const sigma = 0.3;
            mean.push(mi);
            upper.push(mi + 1.96 * sigma);
            lower.push(mi - 1.96 * sigma);
        }
        
        // Draw confidence bands
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((upper[i] + 2) / 4) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        for(let i = n - 1; i >= 0; i--) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((lower[i] + 2) / 4) * (height - 2 * margin);
            ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw mean function
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((mean[i] + 2) / 4) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Add observed points
        const observedX = [-2, -1, 0, 1, 2];
        const observedY = [0.2, -0.8, 0.1, 0.9, -0.3];
        
        ctx.fillStyle = '#EF4444';
        observedX.forEach((xi, i) => {
            const px = margin + ((xi + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((observedY[i] + 2) / 4) * (height - 2 * margin);
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText('x', width - margin - 10, height - margin + 20);
        ctx.fillText('f(x)', margin - 20, margin);
    }

    drawExpectedImprovement(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(margin, margin);
        ctx.stroke();
        
        // Generate EI data
        const n = 100;
        const x = [];
        const ei = [];
        const currentBest = 0.5;
        
        for(let i = 0; i < n; i++) {
            const xi = (i / n) * 6 - 3;
            x.push(xi);
            
            // Simplified EI calculation
            const mu = Math.sin(xi) * 0.5;
            const sigma = 0.3 + 0.2 * Math.abs(xi);
            const z = (mu - currentBest) / sigma;
            const phi = this.normalCDF(z);
            const pdf = this.normalPDF(z);
            const eiValue = Math.max(0, sigma * (z * phi + pdf));
            ei.push(eiValue);
        }
        
        // Draw EI curve
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const maxEI = Math.max(...ei);
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - (ei[i] / maxEI) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Find and mark maximum
        const maxIndex = ei.indexOf(maxEI);
        const maxX = x[maxIndex];
        const px = margin + ((maxX + 3) / 6) * (width - 2 * margin);
        const py = margin;
        
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText('x', width - margin - 10, height - margin + 20);
        ctx.fillText('EI(x)', margin - 30, margin);
        ctx.fillText('Next sample', px - 30, py - 10);
    }

    drawUpperConfidenceBound(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(margin, margin);
        ctx.stroke();
        
        // Generate UCB data
        const n = 100;
        const x = [];
        const mu = [];
        const ucb = [];
        const beta = 2.0;
        
        for(let i = 0; i < n; i++) {
            const xi = (i / n) * 6 - 3;
            x.push(xi);
            const mui = Math.sin(xi) * 0.5;
            const sigma = 0.2 + 0.15 * Math.abs(xi);
            mu.push(mui);
            ucb.push(mui + beta * sigma);
        }
        
        // Draw mean function
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((mu[i] + 2) / 4) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Draw UCB curve
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - ((ucb[i] + 2) / 4) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Find and mark maximum UCB
        const maxUCB = Math.max(...ucb);
        const maxIndex = ucb.indexOf(maxUCB);
        const maxX = x[maxIndex];
        const px = margin + ((maxX + 3) / 6) * (width - 2 * margin);
        const py = height - margin - ((maxUCB + 2) / 4) * (height - 2 * margin);
        
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText('x', width - margin - 10, height - margin + 20);
        ctx.fillText('UCB(x)', margin - 30, margin);
        ctx.fillText('μ(x)', 150, 100);
        ctx.fillText('UCB(x)', 200, 50);
    }

    drawBayesianInference(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(margin, margin);
        ctx.stroke();
        
        // Generate Bayesian update visualization
        const n = 100;
        const x = [];
        const prior = [];
        const likelihood = [];
        const posterior = [];
        
        for(let i = 0; i < n; i++) {
            const xi = (i / n) * 6 - 3;
            x.push(xi);
            
            // Prior distribution
            const priorVal = this.normalPDF((xi - 0) / 1) / 1;
            prior.push(priorVal);
            
            // Likelihood
            const likelihoodVal = this.normalPDF((xi - 1) / 0.5) / 0.5;
            likelihood.push(likelihoodVal);
            
            // Posterior (normalized)
            const posteriorVal = priorVal * likelihoodVal;
            posterior.push(posteriorVal);
        }
        
        // Normalize posterior
        const maxPosterior = Math.max(...posterior);
        const normalizedPosterior = posterior.map(p => p / maxPosterior);
        
        // Draw prior
        ctx.strokeStyle = '#8B5CF6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - prior[i] * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Draw likelihood
        ctx.strokeStyle = '#F59E0B';
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - (likelihood[i] / 2) * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Draw posterior
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        for(let i = 0; i < n; i++) {
            const px = margin + ((x[i] + 3) / 6) * (width - 2 * margin);
            const py = height - margin - normalizedPosterior[i] * (height - 2 * margin);
            if(i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText('θ', width - margin - 10, height - margin + 20);
        ctx.fillText('p(θ)', margin - 20, margin);
        ctx.fillText('Prior', 100, 50);
        ctx.fillText('Likelihood', 200, 100);
        ctx.fillText('Posterior', 350, 80);
    }

    drawKernelTheory(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const margin = 50;
        
        // Create a 2D visualization of kernel functions
        const size = width - 2 * margin;
        const imageData = ctx.createImageData(size, size);
        
        const centerX = size / 2;
        const centerY = size / 2;
        
        for(let x = 0; x < size; x++) {
            for(let y = 0; y < size; y++) {
                const dx = (x - centerX) / 50;
                const dy = (y - centerY) / 50;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // RBF kernel visualization
                const kernelValue = Math.exp(-0.5 * dist * dist);
                
                const index = (y * size + x) * 4;
                const intensity = Math.floor(kernelValue * 255);
                
                imageData.data[index] = 59;     // R
                imageData.data[index + 1] = 130 + intensity / 4; // G
                imageData.data[index + 2] = 246; // B
                imageData.data[index + 3] = intensity; // A
            }
        }
        
        ctx.putImageData(imageData, margin, margin);
        
        // Add contour lines
        ctx.strokeStyle = '#1E40AF';
        ctx.lineWidth = 1;
        const levels = [0.8, 0.6, 0.4, 0.2];
        
        levels.forEach(level => {
            const radius = Math.sqrt(-2 * Math.log(level)) * 50;
            ctx.beginPath();
            ctx.arc(margin + centerX, margin + centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        });
        
        // Add labels
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.fillText('RBF Kernel k(x,x\')', margin, margin - 10);
        ctx.fillText('x₁', width - margin - 10, height - margin + 20);
        ctx.fillText('x₂', margin - 20, margin);
    }

    normalPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }

    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;
        
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);
        
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        
        return sign * y;
    }
}