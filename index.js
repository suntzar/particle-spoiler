/**
 * ============================================================================
 * 🌫️ PARTICLE SPOILER WEB COMPONENT
 * ============================================================================
 * A zero-dependency, vanilla JavaScript Web Component that obscures content
 * using a custom particle physics engine rendered via HTML5 Canvas.
 * * Basic usage in HTML:
 * <particle-spoiler><img src="..." alt="Hidden content" /></particle-spoiler>
 * * @version 1.0.0
 * @author Built from scratch / Open Source Community
 * ============================================================================
 */

// ⚙️ GLOBAL CONFIGURATION
// Kept within the module scope to avoid polluting the global window object.
const CONFIG = {
    density: 1500,               // Total number of floating particles
    baseVelocity: 0.15,          // Maximum movement speed on X and Y axes
    minSize: 0.1,                // Minimum particle radius (px)
    maxSize: 1.0,                // Maximum particle radius (px)
    particleColorRGB: '200, 210, 220', // Dust hue (R, G, B)
    baseOpacity: 0.1,            // Base opacity for subtlety
    variableOpacity: 0.2,        // Dynamic opacity variance
    blurPixels: 25,              // Backdrop-filter blur strength
    revealTimeMs: 600            // Fade-out duration in milliseconds
};

/**
 * 🧠 PARTICLE CLASS (Internal Physics Engine)
 * Represents a single speck of dust. Hidden from the global scope.
 */
class Particle {
    /**
     * @param {number} width - Current canvas width
     * @param {number} height - Current canvas height
     */
    constructor(width, height) {
        this.init(width, height, true);
    }

    /**
     * Resets the particle's vectors and position.
     * @param {number} width - Container width
     * @param {number} height - Container height
     * @param {boolean} scatterInitial - If true, spawns randomly across the entire area
     */
    init(width, height, scatterInitial = false) {
        if (scatterInitial) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        } else {
            // When respawning, start at the edges for an organic flow
            if (Math.random() > 0.5) {
                this.x = Math.random() > 0.5 ? 0 : width;
                this.y = Math.random() * height;
            } else {
                this.x = Math.random() * width;
                this.y = Math.random() > 0.5 ? 0 : height;
            }
        }
        
        // Independent velocity vectors
        this.vx = (Math.random() - 0.5) * CONFIG.baseVelocity;
        this.vy = (Math.random() - 0.5) * CONFIG.baseVelocity;
        
        // Unique visual characteristics
        this.radius = Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize;
        this.alpha = Math.random() * CONFIG.variableOpacity + CONFIG.baseOpacity;
    }

    /**
     * Calculates the new position based on the geometric velocity.
     * @param {number} width - Container width
     * @param {number} height - Container height
     */
    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap-around effect: if it exits one side, it enters from the opposite side
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    /**
     * Renders the particle on the 2D context.
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${CONFIG.particleColorRGB}, ${this.alpha})`;
        ctx.fill();
    }
}

/**
 * 📦 WEB COMPONENT: <particle-spoiler>
 */
class ParticleSpoilerElement extends HTMLElement {
    
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Internal State
        this._isRevealed = false;
        this._animationId = null;
        this._timeoutId = null;
        this._particles = [];
        
        // Method bindings to maintain the correct 'this' context
        this.animate = this.animate.bind(this);
        this._adjustSize = this._adjustSize.bind(this);
        this._handleClick = this._handleClick.bind(this);

        // Shadow DOM Construction
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    border-radius: 16px;
                    overflow: hidden;
                    cursor: pointer;
                    line-height: 0;
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                    transition: transform 0.2s ease;
                    background-color: #18222d;
                }
                
                :host([locked]) { cursor: not-allowed; }
                :host(:hover:not(.revealed):not([locked])) { transform: scale(1.02); }
                
                ::slotted(*) { 
                    width: 100%; height: 100%; 
                    object-fit: cover; display: block; 
                }

                .blur-layer {
                    position: absolute; inset: 0; z-index: 1;
                    backdrop-filter: blur(${CONFIG.blurPixels}px);
                    -webkit-backdrop-filter: blur(${CONFIG.blurPixels}px);
                    background-color: rgba(10, 15, 22, 0.5);
                    transition: opacity ${CONFIG.revealTimeMs / 1000}s ease;
                    pointer-events: none;
                }

                canvas {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    z-index: 2; pointer-events: none;
                    transition: opacity ${(CONFIG.revealTimeMs + 200) / 1000}s ease;
                }

                /* Active state triggered via JS */
                :host(.revealed) .blur-layer, :host(.revealed) canvas { 
                    opacity: 0; 
                }
            </style>
            
            <slot></slot>
            <div class="blur-layer"></div>
            <canvas></canvas>
        `;
    }

    // ==========================================
    // PUBLIC API (Properties & Methods)
    // ==========================================

    /**
     * Gets or sets the locked state of the component.
     * @type {boolean}
     */
    get locked() { return this.hasAttribute('locked'); }
    set locked(val) {
        if (val) this.setAttribute('locked', '');
        else this.removeAttribute('locked');
    }

    /**
     * Returns true if the content is currently revealed.
     * @type {boolean}
     */
    get isRevealed() { return this._isRevealed; }

    /**
     * Programmatically reveals the image and shuts down the rendering engine.
     */
    reveal() {
        if (this._isRevealed) return;
        
        this._isRevealed = true;
        this.classList.add('revealed');
        this.style.cursor = 'default';
        
        this.dispatchEvent(new CustomEvent('reveal', { bubbles: true, composed: true }));

        // Optimization: Halt the canvas physics loop after the CSS transition ends
        this._timeoutId = setTimeout(() => {
            cancelAnimationFrame(this._animationId);
        }, CONFIG.revealTimeMs + 200);
    }

    /**
     * Obscures the image again and restarts the particle engine.
     */
    reset() {
        if (!this._isRevealed) return;
        
        this._isRevealed = false;
        this.classList.remove('revealed');
        this.style.cursor = this.locked ? 'not-allowed' : 'pointer';
        
        this.dispatchEvent(new CustomEvent('reset', { bubbles: true, composed: true }));

        clearTimeout(this._timeoutId);
        this.animate(); // Restart the physics engine
    }

    // ==========================================
    // COMPONENT LIFECYCLE
    // ==========================================

    /**
     * Invoked when the custom element is appended into a document-connected element.
     */
    connectedCallback() {
        this._canvas = this.shadowRoot.querySelector('canvas');
        this._ctx = this._canvas.getContext('2d');
        
        // Observer to redraw the canvas if the screen/container resizes
        this._resizeObserver = new ResizeObserver(this._adjustSize);
        this._resizeObserver.observe(this);
        
        this.addEventListener('click', this._handleClick);

        // Trigger the first animation frame
        if (!this._isRevealed) {
            this.animate();
        }
    }

    /**
     * Invoked when the custom element is disconnected from the document's DOM.
     * Prevents Memory Leaks.
     */
    disconnectedCallback() {
        cancelAnimationFrame(this._animationId);
        clearTimeout(this._timeoutId);
        this.removeEventListener('click', this._handleClick);
        
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        
        this._particles = []; // Clear particles array from memory
    }

    // ==========================================
    // INTERNAL LOGIC
    // ==========================================

    /**
     * Main rendering and physics loop (Ticker).
     * @private
     */
    animate() {
        if (this._isRevealed) return; // Safety lock
        
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
        
        for (let i = 0; i < this._particles.length; i++) {
            const p = this._particles[i];
            p.update(this._canvas.width, this._canvas.height);
            p.draw(this._ctx);
        }
        
        this._animationId = requestAnimationFrame(this.animate);
    }

    /**
     * Resizes the canvas and recalculates particles to cover the new area.
     * @private
     */
    _adjustSize() {
        if (this.offsetWidth === 0) return;
        
        this._canvas.width = this.offsetWidth;
        this._canvas.height = this.offsetHeight;
        
        // Recreate particles based on the new size
        this._particles = Array.from({ length: CONFIG.density }, () => 
            new Particle(this._canvas.width, this._canvas.height)
        );
    }

    /**
     * Handles the user's click event.
     * @private
     */
    _handleClick() {
        if (this.locked) {
            this.dispatchEvent(new CustomEvent('lockedclick', { bubbles: true, composed: true }));
            return;
        }
        this.reveal();
    }
}

// Register the custom tag natively in the browser
if (!customElements.get('particle-spoiler')) {
    customElements.define('particle-spoiler', ParticleSpoilerElement);
}
