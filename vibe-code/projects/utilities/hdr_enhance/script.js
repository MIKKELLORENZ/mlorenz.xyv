class HDREnhancer {
    constructor() {
        this.originalImageData = null;
        this.hdrImageData = null;
        this.fullResImageData = null; // Store full resolution for download
        this.originalCanvas = document.getElementById('originalCanvas');
        this.resultCanvas = document.getElementById('resultCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.resultCtx = this.resultCanvas.getContext('2d');
        this.currentImage = null; // Store original image for full-res processing
        this.splitPosition = 50; // Initial split at 50%
        
        // Performance and background processing
        this.fullResProcessingTimeout = null;
        this.fullResProcessingDebounceDelay = 500; // 500ms delay
        this.isFullResProcessing = false;
        this.fullResNeedsUpdate = false;
        
        this.initializeEventListeners();
        this.initializeControls();
        this.initializeSplitView();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });
    }

    initializeControls() {
        const hdrSlider = document.getElementById('hdrBlend');
        const hdrValueDisplay = document.getElementById('hdrBlendValue');
        const exposureSlider = document.getElementById('exposure');
        const exposureValueDisplay = document.getElementById('exposureValue');
        const vibranceSlider = document.getElementById('vibrance');
        const vibranceValueDisplay = document.getElementById('vibranceValue');
        const transitionZoneSlider = document.getElementById('transitionZone');
        const transitionZoneValueDisplay = document.getElementById('transitionZoneValue');
        
        hdrSlider.addEventListener('input', () => {
            hdrValueDisplay.textContent = hdrSlider.value + '%';
            this.blendImages(); // Only blend, no processing needed
        });
        
        exposureSlider.addEventListener('input', () => {
            exposureValueDisplay.textContent = exposureSlider.value;
            this.generateAdvancedHDR(); // Fast preview processing
            this.blendImages();
            // Full-res processing only happens on download
        });
        
        vibranceSlider.addEventListener('input', () => {
            vibranceValueDisplay.textContent = vibranceSlider.value + '%';
            this.generateAdvancedHDR(); // Fast preview processing
            this.blendImages();
            // Full-res processing only happens on download
        });
        
        transitionZoneSlider.addEventListener('input', () => {
            transitionZoneValueDisplay.textContent = transitionZoneSlider.value + '%';
            this.generateAdvancedHDR(); // Fast preview processing
            this.blendImages();
            // Full-res processing only happens on download
        });
    }

    initializeSplitView() {
        const splitSlider = document.getElementById('splitSlider');
        const splitView = document.getElementById('splitView');
        let isDragging = false;

        const updateSplit = (clientX) => {
            const rect = splitView.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            this.splitPosition = percentage;
            
            // Update clip paths
            const leftClip = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
            const rightClip = `polygon(${percentage}% 0, 100% 0, 100% 100%, ${percentage}% 100%)`;
            
            this.originalCanvas.style.clipPath = leftClip;
            this.resultCanvas.style.clipPath = rightClip;
            
            // Update slider position
            splitSlider.style.left = `${percentage}%`;
        };

        splitSlider.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateSplit(e.clientX);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events for mobile
        splitSlider.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches[0]) {
                updateSplit(e.touches[0].clientX);
            }
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Click to position
        splitView.addEventListener('click', (e) => {
            if (e.target === splitView || e.target.classList.contains('split-canvas')) {
                updateSplit(e.clientX);
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPG, PNG, WebP)');
            return;
        }

        // Show upload progress indicator and disable upload button
        const uploadProgress = document.getElementById('uploadProgress');
        const uploadBtn = document.querySelector('.upload-btn');
        
        if (uploadProgress) {
            uploadProgress.classList.add('active');
        }
        if (uploadBtn) {
            uploadBtn.disabled = true;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Hide upload progress indicator and re-enable upload button once image is loaded
                if (uploadProgress) {
                    uploadProgress.classList.remove('active');
                }
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                }
                this.loadImage(img);
            };
            img.onerror = () => {
                // Hide upload progress indicator and re-enable upload button on error
                if (uploadProgress) {
                    uploadProgress.classList.remove('active');
                }
                if (uploadBtn) {
                    uploadBtn.disabled = false;
                }
                alert('Error loading image. Please try again.');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            // Hide upload progress indicator and re-enable upload button on file read error
            if (uploadProgress) {
                uploadProgress.classList.remove('active');
            }
            if (uploadBtn) {
                uploadBtn.disabled = false;
            }
            alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
    }

    loadImage(img) {
        // Store original image for full-res processing
        this.currentImage = img;
        
        const maxWidth = 500;
        const maxHeight = 400;
        let { width, height } = img;

        // Calculate display size (for performance)
        const displayRatio = Math.min(maxWidth / width, maxHeight / height);
        const displayWidth = width * displayRatio;
        const displayHeight = height * displayRatio;

        // Set canvas dimensions to display size (thumbnail scale)
        this.originalCanvas.width = displayWidth;
        this.originalCanvas.height = displayHeight;
        this.resultCanvas.width = displayWidth;
        this.resultCanvas.height = displayHeight;

        // Update split view container size
        const splitView = document.getElementById('splitView');
        splitView.style.height = `${displayHeight}px`;

        // Draw display-sized image for thumbnail preview
        this.originalCtx.drawImage(img, 0, 0, displayWidth, displayHeight);
        this.originalImageData = this.originalCtx.getImageData(0, 0, displayWidth, displayHeight);

        // Generate HDR effect for preview (fast thumbnail processing)
        this.generateAdvancedHDR();

        // Initial full-resolution HDR for download (immediate for first load)
        this.generateFullResolutionHDR();

        // Hide upload section and show the interface
        const uploadSection = document.querySelector('.upload-section');
        const mainContent = document.getElementById('mainContent');
        
        console.log('Hiding upload section and showing main content');
        uploadSection.style.display = 'none';
        mainContent.classList.remove('hidden');
        
        // Force CSS grid properties (backup)
        mainContent.style.display = 'grid';
        mainContent.style.gridTemplateColumns = '350px 1fr';
        mainContent.style.gap = '30px';

        // Apply initial blend
        this.blendImages();
    }

    // Background processing management
    scheduleFullResProcessing() {
        // Clear any existing timeout
        if (this.fullResProcessingTimeout) {
            clearTimeout(this.fullResProcessingTimeout);
        }
        
        // Mark that we need an update
        this.fullResNeedsUpdate = true;
        
        // Schedule background processing with debounce
        this.fullResProcessingTimeout = setTimeout(() => {
            this.processFullResolutionInBackground();
        }, this.fullResProcessingDebounceDelay);
    }
    
    async processFullResolutionInBackground() {
        if (this.isFullResProcessing) {
            // If already processing, mark that we need another update
            this.fullResNeedsUpdate = true;
            return;
        }
        
        this.isFullResProcessing = true;
        this.fullResNeedsUpdate = false;
        
        // Show processing indicator
        const indicator = document.getElementById('processingIndicator');
        if (indicator) {
            indicator.classList.add('active');
        }
        
        try {
            // Use requestIdleCallback for better performance if available
            if (window.requestIdleCallback) {
                await new Promise(resolve => {
                    window.requestIdleCallback(() => {
                        this.generateFullResolutionHDR();
                        resolve();
                    });
                });
            } else {
                // Fallback to setTimeout for browsers without requestIdleCallback
                await new Promise(resolve => {
                    setTimeout(() => {
                        this.generateFullResolutionHDR();
                        resolve();
                    }, 0);
                });
            }
        } catch (error) {
            console.error('Error during background full-res processing:', error);
        } finally {
            this.isFullResProcessing = false;
            
            // Hide processing indicator
            if (indicator) {
                indicator.classList.remove('active');
            }
            
            // If another update was requested while processing, schedule it
            if (this.fullResNeedsUpdate) {
                this.scheduleFullResProcessing();
            }
        }
    }

    generateAdvancedHDR() {
        if (!this.originalImageData) return;

        const imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );

        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Get control values
        const exposureValue = parseFloat(document.getElementById('exposure').value);
        const vibranceValue = parseFloat(document.getElementById('vibrance').value) / 100;
        const transitionZoneValue = parseFloat(document.getElementById('transitionZone').value) / 100;
        const exposureMultiplier = Math.pow(2, exposureValue);

        // Create luminance map for adaptive processing
        const luminanceMap = this.createLuminanceMap(data, width, height);
        
        // Apply multi-pass HDR processing
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            
            let r = data[i] / 255;
            let g = data[i + 1] / 255;
            let b = data[i + 2] / 255;

            // Apply exposure adjustment first
            r = r * exposureMultiplier;
            g = g * exposureMultiplier;
            b = b * exposureMultiplier;

            // Calculate original luminance
            const originalLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            
            // Get local luminance statistics
            const localStats = this.getLocalStatistics(luminanceMap, x, y, width, height);
            
            // Apply zone-based tone mapping with transition zone control
            const toneMappedRGB = this.applyZoneBasedToneMapping(r, g, b, originalLum, localStats, transitionZoneValue);
            r = toneMappedRGB[0];
            g = toneMappedRGB[1];
            b = toneMappedRGB[2];

            // Apply local contrast enhancement with edge preservation
            const contrastEnhancement = this.calculateLocalContrast(luminanceMap, x, y, width, height, originalLum);
            r = Math.max(0, Math.min(1, r + contrastEnhancement * 0.15));
            g = Math.max(0, Math.min(1, g + contrastEnhancement * 0.15));
            b = Math.max(0, Math.min(1, b + contrastEnhancement * 0.15));

            // Apply adaptive color enhancement with vibrance control
            const enhancedRGB = this.applyAdaptiveColorEnhancement(r, g, b, originalLum, localStats, vibranceValue);
            r = enhancedRGB[0];
            g = enhancedRGB[1];
            b = enhancedRGB[2];

            // Final tone curve for cinematic look
            r = this.applyCinematicCurve(r);
            g = this.applyCinematicCurve(g);
            b = this.applyCinematicCurve(b);

            // Gamma correction
            data[i] = Math.round(Math.pow(Math.max(0, Math.min(1, r)), 1/2.2) * 255);
            data[i + 1] = Math.round(Math.pow(Math.max(0, Math.min(1, g)), 1/2.2) * 255);
            data[i + 2] = Math.round(Math.pow(Math.max(0, Math.min(1, b)), 1/2.2) * 255);
        }

        this.hdrImageData = imageData;
    }

    createLuminanceMap(data, width, height) {
        const luminanceMap = new Float32Array(width * height);
        
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            luminanceMap[pixelIndex] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        
        return luminanceMap;
    }

    getLocalStatistics(luminanceMap, x, y, width, height) {
        const radius = 8;
        let sum = 0;
        let count = 0;
        let min = 1;
        let max = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = Math.max(0, Math.min(width - 1, x + dx));
                const ny = Math.max(0, Math.min(height - 1, y + dy));
                const lum = luminanceMap[ny * width + nx];
                
                sum += lum;
                count++;
                min = Math.min(min, lum);
                max = Math.max(max, lum);
            }
        }
        
        return {
            average: sum / count,
            range: max - min,
            min: min,
            max: max
        };
    }

    applyZoneBasedToneMapping(r, g, b, luminance, localStats, transitionZone = 0.5) {
        // Define luminance zones with adjustable transition widths
        const baseWidth = 0.25; // Base transition width
        const adjustedWidth = baseWidth * transitionZone; // Scale by transition zone control
        
        const shadowThreshold = 0.25;
        const highlightThreshold = 0.75;
        
        // Adjust transition boundaries based on transition zone setting
        const shadowTransitionStart = Math.max(0, shadowThreshold - adjustedWidth);
        const shadowTransitionEnd = Math.min(1, shadowThreshold + adjustedWidth);
        const highlightTransitionStart = Math.max(0, highlightThreshold - adjustedWidth);
        const highlightTransitionEnd = Math.min(1, highlightThreshold + adjustedWidth);
        
        let shadowFactor = 1.0;
        let highlightFactor = 1.0;
        let midtoneFactor = 1.0;

        // Shadow zone with adjustable transition
        if (luminance <= shadowTransitionEnd) {
            let shadowStrength;
            if (luminance <= shadowTransitionStart) {
                shadowStrength = 1.0; // Full shadow effect
            } else {
                // Smooth transition from shadow to normal
                const transitionProgress = (luminance - shadowTransitionStart) / (shadowTransitionEnd - shadowTransitionStart);
                shadowStrength = 1.0 - this.smoothstep(0, 1, transitionProgress);
            }
            shadowFactor = 1.0 + shadowStrength * 0.8 * (1.0 - localStats.average);
        }
        
        // Highlight zone with adjustable transition
        if (luminance >= highlightTransitionStart) {
            let highlightStrength;
            if (luminance >= highlightTransitionEnd) {
                highlightStrength = 1.0; // Full highlight effect
            } else {
                // Smooth transition from normal to highlight
                const transitionProgress = (luminance - highlightTransitionStart) / (highlightTransitionEnd - highlightTransitionStart);
                highlightStrength = this.smoothstep(0, 1, transitionProgress);
            }
            highlightFactor = 1.0 - highlightStrength * 0.4 * Math.pow(luminance, 2);
        }
        
        // Midtone enhancement with transition zone influence
        const midtoneDistance = Math.abs(luminance - 0.5) * 2;
        const midtoneStrength = (1.0 - midtoneDistance) * transitionZone;
        midtoneFactor = 1.0 + midtoneStrength * 0.2 * localStats.range;

        // Apply zone-based adjustments
        r = r * shadowFactor * highlightFactor * midtoneFactor;
        g = g * shadowFactor * highlightFactor * midtoneFactor;
        b = b * shadowFactor * highlightFactor * midtoneFactor;

        return [r, g, b];
    }

    calculateLocalContrast(luminanceMap, x, y, width, height, centerLum) {
        const radius = 4;
        let sum = 0;
        let count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > radius) continue;
                
                const nx = Math.max(0, Math.min(width - 1, x + dx));
                const ny = Math.max(0, Math.min(height - 1, y + dy));
                const weight = 1.0 - (distance / radius);
                
                sum += luminanceMap[ny * width + nx] * weight;
                count += weight;
            }
        }
        
        const averageLocal = sum / count;
        return (centerLum - averageLocal) * 2.0;
    }

    applyAdaptiveColorEnhancement(r, g, b, luminance, localStats, vibranceMultiplier = 1.0) {
        // Convert to HSV for better color manipulation
        const hsv = this.rgbToHsv(r, g, b);
        let h = hsv[0];
        let s = hsv[1];
        let v = hsv[2];

        // Adaptive saturation based on local contrast and vibrance control
        const baseSaturationBoost = 1.0 + localStats.range * 0.6;
        const vibranceBoost = this.calculateVibranceBoost(s, vibranceMultiplier);
        const saturationBoost = baseSaturationBoost * vibranceBoost;
        
        // Protect skin tones and extreme values
        const skinProtection = this.isSkinTone(h) ? 0.3 : 1.0;
        const extremeProtection = (luminance < 0.05 || luminance > 0.95) ? 0.2 : 1.0;
        
        s = Math.min(1.0, s * saturationBoost * skinProtection * extremeProtection);

        // Convert back to RGB
        return this.hsvToRgb(h, s, v);
    }

    calculateVibranceBoost(saturation, vibranceMultiplier) {
        // Vibrance affects less saturated colors more than highly saturated ones
        // This creates a more natural enhancement
        const saturationFactor = 1.0 - saturation;
        const vibranceEffect = (vibranceMultiplier - 1.0) * saturationFactor + 1.0;
        return Math.max(0.1, vibranceEffect);
    }

    applyCinematicCurve(value) {
        // S-curve for cinematic look
        const x = Math.max(0, Math.min(1, value));
        if (x < 0.5) {
            return 2 * x * x;
        } else {
            return 1 - 2 * (1 - x) * (1 - x);
        }
    }

    smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    isSkinTone(hue) {
        // Protect common skin tone hue ranges
        return (hue >= 0.02 && hue <= 0.12) || (hue >= 0.95 && hue <= 1.0);
    }

    blendImages() {
        if (!this.originalImageData || !this.hdrImageData) return;

        const blendValue = parseInt(document.getElementById('hdrBlend').value) / 100;
        
        const resultData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );

        const original = this.originalImageData.data;
        const hdr = this.hdrImageData.data;
        const result = resultData.data;

        for (let i = 0; i < original.length; i += 4) {
            result[i] = original[i] * (1 - blendValue) + hdr[i] * blendValue;
            result[i + 1] = original[i + 1] * (1 - blendValue) + hdr[i + 1] * blendValue;
            result[i + 2] = original[i + 2] * (1 - blendValue) + hdr[i + 2] * blendValue;
            result[i + 3] = original[i + 3];
        }

        this.resultCtx.putImageData(resultData, 0, 0);
    }

    rgbToHsv(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        
        let h = 0;
        const s = max === 0 ? 0 : delta / max;
        const v = max;

        if (delta !== 0) {
            switch (max) {
                case r: h = ((g - b) / delta) % 6; break;
                case g: h = (b - r) / delta + 2; break;
                case b: h = (r - g) / delta + 4; break;
            }
            h /= 6;
        }

        return [h, s, v];
    }

    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = v - c;

        let r, g, b;
        const hPrime = h * 6;

        if (hPrime < 1) {
            r = c; g = x; b = 0;
        } else if (hPrime < 2) {
            r = x; g = c; b = 0;
        } else if (hPrime < 3) {
            r = 0; g = c; b = x;
        } else if (hPrime < 4) {
            r = 0; g = x; b = c;
        } else if (hPrime < 5) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        return [r + m, g + m, b + m];
    }

    generateFullResolutionHDR() {
        if (!this.currentImage) return;

        // Create full-resolution canvas
        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');
        
        fullCanvas.width = this.currentImage.width;
        fullCanvas.height = this.currentImage.height;
        
        // Draw full-resolution image
        fullCtx.drawImage(this.currentImage, 0, 0);
        const fullImageData = fullCtx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);

        // Apply HDR processing to full resolution
        const processedData = this.processImageData(fullImageData);
        
        // Store for download
        this.fullResImageData = processedData;
    }

    processImageData(imageData) {
        const data = imageData.data.slice(); // Copy the data
        const width = imageData.width;
        const height = imageData.height;

        // Get control values
        const exposureValue = parseFloat(document.getElementById('exposure').value);
        const vibranceValue = parseFloat(document.getElementById('vibrance').value) / 100;
        const transitionZoneValue = parseFloat(document.getElementById('transitionZone').value) / 100;
        const exposureMultiplier = Math.pow(2, exposureValue);

        // Create luminance map for adaptive processing
        const luminanceMap = this.createLuminanceMap(data, width, height);
        
        // Apply multi-pass HDR processing
        for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4;
            const x = pixelIndex % width;
            const y = Math.floor(pixelIndex / width);
            
            let r = data[i] / 255;
            let g = data[i + 1] / 255;
            let b = data[i + 2] / 255;

            // Apply exposure adjustment first
            r = r * exposureMultiplier;
            g = g * exposureMultiplier;
            b = b * exposureMultiplier;

            // Calculate original luminance
            const originalLum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            
            // Get local luminance statistics
            const localStats = this.getLocalStatistics(luminanceMap, x, y, width, height);
            
            // Apply zone-based tone mapping with transition zone control
            const toneMappedRGB = this.applyZoneBasedToneMapping(r, g, b, originalLum, localStats, transitionZoneValue);
            r = toneMappedRGB[0];
            g = toneMappedRGB[1];
            b = toneMappedRGB[2];

            // Apply local contrast enhancement with edge preservation
            const contrastEnhancement = this.calculateLocalContrast(luminanceMap, x, y, width, height, originalLum);
            r = Math.max(0, Math.min(1, r + contrastEnhancement * 0.15));
            g = Math.max(0, Math.min(1, g + contrastEnhancement * 0.15));
            b = Math.max(0, Math.min(1, b + contrastEnhancement * 0.15));

            // Apply adaptive color enhancement with vibrance control
            const enhancedRGB = this.applyAdaptiveColorEnhancement(r, g, b, originalLum, localStats, vibranceValue);
            r = enhancedRGB[0];
            g = enhancedRGB[1];
            b = enhancedRGB[2];

            // Final tone curve for cinematic look
            r = this.applyCinematicCurve(r);
            g = this.applyCinematicCurve(g);
            b = this.applyCinematicCurve(b);

            // Gamma correction
            data[i] = Math.round(Math.pow(Math.max(0, Math.min(1, r)), 1/2.2) * 255);
            data[i + 1] = Math.round(Math.pow(Math.max(0, Math.min(1, g)), 1/2.2) * 255);
            data[i + 2] = Math.round(Math.pow(Math.max(0, Math.min(1, b)), 1/2.2) * 255);
        }

        return new ImageData(data, width, height);
    }
}

function resetFilters() {
    document.getElementById('hdrBlend').value = 50;
    document.getElementById('hdrBlendValue').textContent = '50%';
    document.getElementById('exposure').value = 0;
    document.getElementById('exposureValue').textContent = '0.0';
    document.getElementById('vibrance').value = 100;
    document.getElementById('vibranceValue').textContent = '100%';
    document.getElementById('transitionZone').value = 50;
    document.getElementById('transitionZoneValue').textContent = '50%';

    if (window.hdrEnhancer) {
        window.hdrEnhancer.generateAdvancedHDR(); // Fast preview processing
        window.hdrEnhancer.blendImages();
        // Full-res processing only happens on download
    }
}

function uploadNew() {
    // Reset file input and trigger file dialog directly
    const fileInput = document.getElementById('fileInput');
    fileInput.value = '';
    fileInput.click();
}

async function downloadImage(event) {
    if (!window.hdrEnhancer || !window.hdrEnhancer.currentImage) {
        alert('No image loaded');
        return;
    }

    const enhancer = window.hdrEnhancer;
    
    // Show loading indicators
    const originalText = event.target.textContent;
    const processingIndicator = document.getElementById('processingIndicator');
    
    event.target.textContent = 'Processing...';
    event.target.disabled = true;
    
    if (processingIndicator) {
        processingIndicator.classList.add('active');
        processingIndicator.querySelector('span').textContent = 'Generating full resolution image...';
    }
    
    try {
        // Add small delay to ensure UI updates
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Always generate fresh full-res data with current settings
        enhancer.generateFullResolutionHDR();
        
        if (!enhancer.fullResImageData) {
            alert('Full resolution processing failed');
            return;
        }

        if (processingIndicator) {
            processingIndicator.querySelector('span').textContent = 'Blending images...';
        }

        // Add small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get HDR blend value
        const blendValue = parseInt(document.getElementById('hdrBlend').value) / 100;
        
        // Create full-resolution canvas for download
        const downloadCanvas = document.createElement('canvas');
        const downloadCtx = downloadCanvas.getContext('2d');
        
        const img = enhancer.currentImage;
        downloadCanvas.width = img.width;
        downloadCanvas.height = img.height;

        // Create original full-res image data
        downloadCtx.drawImage(img, 0, 0);
        const originalFullRes = downloadCtx.getImageData(0, 0, img.width, img.height);
        
        // Blend original and HDR at full resolution
        const blendedData = new ImageData(
            new Uint8ClampedArray(originalFullRes.data),
            img.width,
            img.height
        );

        const original = originalFullRes.data;
        const hdr = enhancer.fullResImageData.data;
        const result = blendedData.data;

        for (let i = 0; i < original.length; i += 4) {
            result[i] = original[i] * (1 - blendValue) + hdr[i] * blendValue;
            result[i + 1] = original[i + 1] * (1 - blendValue) + hdr[i + 1] * blendValue;
            result[i + 2] = original[i + 2] * (1 - blendValue) + hdr[i + 2] * blendValue;
            result[i + 3] = original[i + 3];
        }

        if (processingIndicator) {
            processingIndicator.querySelector('span').textContent = 'Preparing download...';
        }

        // Add small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 50));

        // Put the blended result on canvas and download
        downloadCtx.putImageData(blendedData, 0, 0);
        
        const link = document.createElement('a');
        link.download = `hdr-enhanced-${img.width}x${img.height}.png`;
        link.href = downloadCanvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Download error:', error);
        alert('An error occurred during download. Please try again.');
    } finally {
        // Restore button and hide processing indicator
        event.target.textContent = originalText;
        event.target.disabled = false;
        
        if (processingIndicator) {
            processingIndicator.classList.remove('active');
            processingIndicator.querySelector('span').textContent = 'Processing full resolution...';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.hdrEnhancer = new HDREnhancer();
});