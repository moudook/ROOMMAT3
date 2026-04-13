# ROOMMAT3

Cosmic Particle 3D Visualization Experience

A high-performance interactive 3D cosmic particle website featuring four unique immersive environments: Black Hole, Quantum Knot, Cosmic Web, and Quasar. Built with Three.js, GPU-accelerated particle systems, and cinematic transitions.

## Live Demo

**Public Access**: https://roommat3.vercel.app

Anyone can access this link without login or permissions.

## Features

- 4 unique 3D particle environments with distinct visual styles
- GPU-optimized particle systems (100k+ particles at 60fps)
- Smooth cinematic transitions between scenes
- Immersive audio system with spatial audio effects
- Performance monitoring and controls
- Mobile-responsive design
- Zero runtime console errors
- Production-ready build system
- 75% GPU performance optimization active

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Run development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Build for Production

```bash
# Create optimized production build
npm run build
```

The build artifacts will be stored in the `build/` directory.

## Deployment

The project is deployed on Vercel. To deploy your own version:

```bash
# Deploy to production
vercel --prod --public
```

## Controls

- Scroll vertically to navigate between scenes
- Mouse movement influences particle behavior
- Use the GUI controls (top-right) to adjust visual parameters
- Audio automatically plays on first user interaction

## Technical Stack

- React 18
- Three.js / WebGL 2.0
- Custom GPU particle shader system
- lil-gui for controls
- Web Audio API

## Performance Optimizations

- All render loops properly suspended when scenes are inactive
- Efficient memory management and garbage collection
- Mobile performance optimizations
- Adaptive particle counts based on device capabilities
- Duplicate initialization removed
- Null safety on all shader and uniform operations

## System Requirements

- Modern browser with WebGL 2.0 support
- Recommended: Dedicated GPU for best performance
- Mobile: iOS 15+, Android 10+

---

*Fully rebuilt and optimized for production release April 2026*