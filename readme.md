<div align="center">
  
  # Particle Spoiler Web Component
  
  **A zero-dependency vanilla JavaScript component for obfuscating content via a dynamic particle physics engine.**

  [![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow?style=for-the-badge&logo=javascript)](#)
  [![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen?style=for-the-badge)](#)
  [![Web Components](https://img.shields.io/badge/Web-Components-blue?style=for-the-badge&logo=webcomponents.org)](#)
  [![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](#)

</div>

<br>

## Overview

**Particle Spoiler** is a lightweight, high-performance Web Component (`<particle-spoiler>`) designed to obscure sensitive or spoiler content using a custom HTML5 Canvas particle physics engine. 

Instead of relying on static blurs or solid overlays, it generates a dynamic particle obfuscation effect. The component is optimized to run at 60fps and implements standard memory management protocols suitable for Single Page Applications (SPAs).

## Features

* **Zero Dependencies:** Written in pure, vanilla JavaScript.
* **Shadow DOM Encapsulation:** Prevents CSS scope leakage between the component and the host application.
* **High Performance:** Utilizes `requestAnimationFrame` and automatically pauses rendering when idle to reduce CPU and battery consumption.
* **Memory Safe:** Implements `ResizeObserver` lifecycle management and `disconnectedCallback` cleanup to prevent memory leaks.
* **Programmable API:** Provides JavaScript methods and property bindings for state control (lock, reveal, reset).
* **Framework Agnostic:** Compatible with React, Angular, Vue, Svelte, or standard static HTML environments.

---

## Installation

Import the module directly into your HTML document or build pipeline.

```html
<head>
  <script type="module" src="./path/to/particle-spoiler.js"></script>
</head>
```

---

## Basic Usage

Wrap the target content inside the `<particle-spoiler>` tag. The component automatically adjusts its internal canvas to fit the slotted content dimensions.

```html
<particle-spoiler>
  <img src="https://picsum.photos/600/400" alt="Obscured content" />
</particle-spoiler>
```

Control the outer dimensions of the component via standard CSS:

```css
particle-spoiler {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 16 / 9;
}
```

---

## JavaScript API Reference

The component exposes a public API for programmatic control, allowing integration with custom logic such as authentication gates or conditional rendering.

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `locked` | `boolean` | If `true`, the component ignores user click events. The cursor updates to `not-allowed`. |
| `isRevealed` | `boolean` | *(Read-only)* Returns `true` if the content is currently exposed. |

### Methods

| Method | Description |
| :--- | :--- |
| `reveal()` | Programmatically reveals the content and suspends the particle engine. |
| `reset()` | Re-obscures the content and initializes the particle engine. |

### Events

The component dispatches custom events that bubble up to the DOM.

| Event Name | Description |
| :--- | :--- |
| `reveal` | Dispatched when the spoiler is successfully opened. |
| `reset` | Dispatched when the spoiler is hidden via the `reset()` method. |
| `lockedclick` | Dispatched when a click event is intercepted while the `locked` attribute is set to `true`. |

### Implementation Example (Authorization Gate)

```html
<particle-spoiler id="premiumContent" locked>
  <img src="premium-image.jpg" alt="Premium Content" />
</particle-spoiler>

<script>
  const spoiler = document.getElementById('premiumContent');

  // Handle unauthorized interaction attempts
  spoiler.addEventListener('lockedclick', () => {
    console.warn("Interaction blocked: User lacks required permissions.");
    // Trigger authentication modal or redirect
  });

  // Example authorization callback
  function handleAuthorizationSuccess() {
    spoiler.locked = false;
    spoiler.reveal();
  }
</script>
```

---

## Configuration

Base parameters for the physics engine are centralized in the `CONFIG` object within the module scope of `particle-spoiler.js`. These can be modified prior to build/deployment to alter the visual behavior of the particles.

```javascript
const CONFIG = {
    density: 1500,               // Total particle count
    baseVelocity: 0.15,          // Maximum coordinate displacement per frame
    particleColorRGB: '200, 210, 220', // Rendering color (RGB)
    baseOpacity: 0.1,            // Minimum alpha channel value
    blurPixels: 25,              // Backdrop-filter intensity
    revealTimeMs: 600            // Transition duration
    // ...
};
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/component-enhancement`)
3. Commit your changes (`git commit -m 'feat: implement component enhancement'`)
4. Push to the branch (`git push origin feature/component-enhancement`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
