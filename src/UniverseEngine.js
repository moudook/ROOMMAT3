import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import GUI from 'lil-gui';
import './UniverseEngine.css';

const UniverseEngine = ({ 
  shape = 'Black Hole',
  initialCamX = 0,
  initialCamY = 0,
  defaultCamX = 0,
  defaultCamY = 2,
  defaultCamZ = 14,
  defaultZoom = 1,
  initialZoom = 1,
  cinematic = true,
  guiTitle = '>> UNIVERSE_ENGINE.EXE',
  isActive = true,
  isTransitioning = false,
  transitionProgress = 0,
  transitionDirection = 'out',
  particleCountOverride = null,
  spinSpeedOverride = null,
  colorInnerOverride = null,
  colorOuterOverride = null,
  disableGui = false
}) => {
  const containerRef = useRef(null);
  const guiRef = useRef(null);
  const materialRef = useRef(null);
  
  // Refs for props used in tick function to avoid stale closures
  const isTransitioningRef = useRef(isTransitioning);
  const transitionProgressRef = useRef(transitionProgress);
  const transitionDirectionRef = useRef(transitionDirection);
  const shapeRef = useRef(shape);

  // Update refs when props change
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
    transitionProgressRef.current = transitionProgress;
    transitionDirectionRef.current = transitionDirection;
    shapeRef.current = shape;
  }, [isTransitioning, transitionProgress, transitionDirection, shape]);

  useEffect(() => {
    // Handle seamless page transitions
    if (isTransitioning) {
      if (shape === 'Black Hole') {
        if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uChaos) {
          materialRef.current.uniforms.uChaos.value = transitionDirection === 'out' ? transitionProgress : 1 - transitionProgress;
        }
        if (transitionDirection === 'out' && containerRef.current) {
          containerRef.current.classList.remove('cinema');
        } else if (transitionDirection === 'in' && containerRef.current && cinematic) {
          containerRef.current.classList.add('cinema');
        }
      } else if (shape === 'Quantum Knot') {
        if (materialRef.current && materialRef.current.uniforms && materialRef.current.uniforms.uWarp) {
          materialRef.current.uniforms.uWarp.value = transitionDirection === 'in' ? 2.0 * (1 - transitionProgress) : 2.0 * transitionProgress;
        }
      }
    } else {
      // Reset to normal state
      if (materialRef.current && materialRef.current.uniforms) {
        if (materialRef.current.uniforms.uChaos) materialRef.current.uniforms.uChaos.value = 0.0;
        if (materialRef.current.uniforms.uWarp) materialRef.current.uniforms.uWarp.value = 0.0;
      }
    }

    return () => {};
  }, [isTransitioning, transitionProgress, transitionDirection, shape, cinematic]);

  // Track animation state across effects
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const isPausedRef = useRef(!isActive);
  const tickRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = !isActive;
    
    // If becoming active and we have a tick function, resume
    if (isActive && tickRef.current && animationRef.current === null) {
      lastTimeRef.current = performance.now();
      tickRef.current();
    }
  }, [isActive]);

  useEffect(() => {
    // --- MASTER CONFIG ---
    const CONFIG = {
      shape: shape,
      count: particleCountOverride || 50540,
      particleSize: 0.025,
      
      radius: 6,
      branches: 4,
      spin: 1.5,
      
      mode: 'Inferno',
      colorInner: colorInnerOverride || '#ff0000',
      colorOuter: colorOuterOverride || '#110000',
      
      timeScale: 0.150,
      gravity: 0,
      rippleStrength: 2.0,
      chaos: 0.0,
      pulseRate: 0,
      spinSpeed: spinSpeedOverride !== null ? spinSpeedOverride : 2,
      warp: 0.0,
      
      cinematic: cinematic,
      
      // Camera defaults
      defaultCamX: defaultCamX,
      defaultCamY: defaultCamY,
      defaultCamZ: defaultCamZ,
      defaultZoom: defaultZoom
    };

    const container = containerRef.current;
    
    if (!container) {
      console.error('UniverseEngine: Container ref is null');
      return;
    }
    
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    if (CONFIG.cinematic) container.classList.add('cinema');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    
    // Ensure container has dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ReinhardToneMapping;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    
    // Initial camera position (starting point for animation)
    camera.position.set(initialCamX, initialCamY, CONFIG.defaultCamZ);
    camera.zoom = initialZoom;
    camera.updateProjectionMatrix();

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.maxDistance = 40;
    controls.autoRotate = true;
    controls.autoRotateSpeed = CONFIG.spinSpeed;

    // --- TEXTURES ---
    const getTexture = () => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 64;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,'rgba(255,255,255,1)');
      g.addColorStop(0.2,'rgba(255,255,255,0.8)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(c);
    };
    const tex = getTexture();

    // --- GEOMETRY FACTORY ---
    let points = null;
    let geometry = null;
    let material = null;

    const buildUniverse = () => {
      if (points) {
        geometry.dispose();
        material.dispose();
        scene.remove(points);
      }

      geometry = new THREE.BufferGeometry();
      const pos = new Float32Array(CONFIG.count * 3);
      const cols = new Float32Array(CONFIG.count * 3);
      const randoms = new Float32Array(CONFIG.count * 3);

      const c1 = new THREE.Color(CONFIG.colorInner);
      const c2 = new THREE.Color(CONFIG.colorOuter);

      for (let i = 0; i < CONFIG.count; i++) {
        const i3 = i * 3;
        let x, y, z;
        let mixColor;

        if (CONFIG.shape === 'Galaxy') {
          const r = Math.random() * CONFIG.radius;
          const spin = r * CONFIG.spin;
          const branch = (i % CONFIG.branches) / CONFIG.branches * Math.PI * 2;
          const rx = Math.pow(Math.random(), 3) * (Math.random()<0.5?1:-1) * 0.5 * r;
          const ry = Math.pow(Math.random(), 3) * (Math.random()<0.5?1:-1) * 0.5 * r;
          const rz = Math.pow(Math.random(), 3) * (Math.random()<0.5?1:-1) * 0.5 * r;
          x = Math.cos(branch + spin) * r + rx;
          y = ry;
          z = Math.sin(branch + spin) * r + rz;
          mixColor = c1.clone().lerp(c2, r / CONFIG.radius);

        } else if (CONFIG.shape === 'Möbius') {
          const t = (i / CONFIG.count) * Math.PI * 2 * 2;
          const tubeR = 2 + (Math.random()-0.5); 
          const tubular = Math.random() * Math.PI * 2;
          const R = 5;
          x = (R + tubeR * Math.cos(tubular/2)) * Math.cos(t);
          z = (R + tubeR * Math.cos(tubular/2)) * Math.sin(t);
          y = tubeR * Math.sin(tubular/2);
          mixColor = c1.clone().lerp(c2, (Math.sin(t)+1)/2);

        } else if (CONFIG.shape === 'Sphere') {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = CONFIG.radius * (0.8 + Math.random() * 0.4);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
          const d = Math.sqrt(x*x + y*y + z*z);
          mixColor = c1.clone().lerp(c2, d/CONFIG.radius);

        } else if (CONFIG.shape === 'DNA') {
          const t = (i/CONFIG.count) * Math.PI * 10;
          const strand = (i%2)===0 ? 1 : -1; 
          const r = 2 + Math.random(); 
          const rotation = t;
          x = Math.cos(rotation) * r;
          z = Math.sin(rotation) * r;
          y = (i/CONFIG.count) * 20 - 10;
          if (Math.random() > 0.95) { x *= Math.random(); z *= Math.random(); }
          if(strand === -1) { x = Math.cos(rotation + Math.PI) * r; z = Math.sin(rotation + Math.PI) * r; }
          mixColor = c1.clone().lerp(c2, (y + 10) / 20);

        } else if (CONFIG.shape === 'Black Hole') {
          const eventHorizon = 1.5;
          const pType = Math.random();
          if(pType < 0.75) {
            const r = eventHorizon + 0.2 + Math.pow(Math.random(), 3) * 12;
            const angle = Math.random() * Math.PI * 2;
            x = Math.cos(angle) * r;
            z = Math.sin(angle) * r;
            y = (Math.random() - 0.5) * (r * 0.15); 
            const strength = 1 - ((r - eventHorizon) / 10);
            mixColor = c1.clone().lerp(c2, 1 - Math.max(0, strength));
          } else if (pType < 0.90) {
            const r = eventHorizon + 0.1 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            x = Math.cos(angle) * r;
            y = Math.sin(angle) * r * 1.1;
            z = (Math.random() - 0.5) * 0.5 - Math.abs(y) * 0.3;
            mixColor = c1.clone();
          } else {
            const h = 2 + Math.random() * 12;
            const side = Math.random() < 0.5 ? 1 : -1;
            y = h * side;
            x = (Math.random() - 0.5) * 0.4;
            z = (Math.random() - 0.5) * 0.4;
            mixColor = c1.clone().multiplyScalar(1 - (h/12));
          }

        } else if (CONFIG.shape === 'Klein Bottle') {
          const u = (i / CONFIG.count) * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const r = 4 - 2 * Math.cos(u);
          if (u < Math.PI) {
            x = 6 * Math.cos(u) * (1 + Math.sin(u)) + 4 * r * Math.cos(u) * Math.cos(v);
            z = 16 * Math.sin(u) + 4 * r * Math.sin(u) * Math.cos(v);
          } else {
            x = 6 * Math.cos(u) * (1 + Math.sin(u)) - 4 * r * Math.cos(v);
            z = 16 * Math.sin(u);
          }
          y = 4 * r * Math.sin(v);
          x *= 0.15; y *= 0.15; z *= 0.15;
          mixColor = c1.clone().lerp(c2, (Math.sin(u)+1)/2);

        } else if (CONFIG.shape === 'Tesseract') {
          const size = 5;
          x = (Math.random() - 0.5) * size * 2;
          y = (Math.random() - 0.5) * size * 2;
          z = (Math.random() - 0.5) * size * 2;
          const snap = Math.random();
          if(snap < 0.33) x = Math.round(x/size)*size;
          else if(snap < 0.66) y = Math.round(y/size)*size;
          else z = Math.round(z/size)*size;
          x += (Math.random()-0.5)*0.2; y += (Math.random()-0.5)*0.2; z += (Math.random()-0.5)*0.2;
          mixColor = c1.clone().lerp(c2, Math.abs(x+y+z)/10);

        } else if (CONFIG.shape === 'Nebula') {
          const r = Math.random() * 10;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
          x += Math.sin(y)*2;
          mixColor = c1.clone().lerp(c2, Math.random());

        } else if (CONFIG.shape === 'Wormhole') {
          const t = (i / CONFIG.count);
          const yBase = (t - 0.5) * 30; 
          const r = 1.0 + Math.pow(Math.abs(yBase) * 0.25, 2.5); 
          const angle = Math.random() * Math.PI * 2 + (yBase * 0.2); 
          x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.5;
          z = Math.sin(angle) * r + (Math.random() - 0.5) * 0.5;
          y = yBase;
          mixColor = c1.clone().lerp(c2, Math.abs(yBase)/15);

        } else if (CONFIG.shape === 'Pulsar') {
          const pType = Math.random();
          if (pType < 0.15) { 
            const r = Math.cbrt(Math.random()) * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            mixColor = c1.clone(); 
          } else {
            const side = Math.random() < 0.5 ? 1 : -1;
            y = Math.pow(Math.random(), 3) * 25 * side; 
            const r = 0.2 + Math.abs(y) * 0.08 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2 + (y * 0.5); 
            x = Math.cos(angle) * r;
            z = Math.sin(angle) * r;
            mixColor = c1.clone().lerp(c2, Math.abs(y)/25);
          }

        } else if (CONFIG.shape === 'Supernova') {
          const pType = Math.random();
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          
          if (pType < 0.7) { 
            const r = 7 + (Math.random() * 3); 
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            x += Math.sin(y * 2) * 1.5;
            z += Math.cos(x * 2) * 1.5;
            mixColor = c2.clone().lerp(c1, Math.random());
          } else { 
            const r = Math.pow(Math.random(), 2) * 3;
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            mixColor = c1.clone();
          }

        } else if (CONFIG.shape === 'Cosmic Web') {
          const t = (i / CONFIG.count) * Math.PI * 150;
          const strand = Math.floor(Math.random() * 6); 
          const a = 2 + strand * 0.15;
          const b = 3 + strand * 0.25;
          const c = 4 + strand * 0.1;
          const R = 9;
          
          x = R * Math.sin(a * t) * Math.cos(t * 0.05);
          y = R * Math.sin(b * t);
          z = R * Math.cos(c * t) * Math.sin(t * 0.05);
          
          const noise = Math.pow(Math.random(), 2) * 1.5;
          x += (Math.random() - 0.5) * noise;
          y += (Math.random() - 0.5) * noise;
          z += (Math.random() - 0.5) * noise;
          mixColor = c1.clone().lerp(c2, Math.abs(x*y*z)/(R*R*R));

        } else if (CONFIG.shape === 'Quantum Knot') {
          const t = (i / CONFIG.count) * Math.PI * 2;
          const p = 3; const q = 5;
          const R = 5; const rad = 2;
          
          const bx = (R + rad * Math.cos(q * t)) * Math.cos(p * t);
          const bz = (R + rad * Math.cos(q * t)) * Math.sin(p * t);
          const by = rad * Math.sin(q * t);
          
          const noiseMag = Math.pow(Math.random(), 2) * 0.8;
          x = bx + (Math.random() - 0.5) * noiseMag;
          y = by + (Math.random() - 0.5) * noiseMag;
          z = bz + (Math.random() - 0.5) * noiseMag;
          
          mixColor = c1.clone().lerp(c2, (Math.sin(t * 10) + 1) / 2);

        } else if (CONFIG.shape === 'Atom Orbitals') {
          const pType = Math.random();
          if(pType < 0.15) {
            const r = Math.pow(Math.random(), 3) * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            mixColor = c1.clone();
          } else {
            const orbital = i % 3;
            const angle = Math.random() * Math.PI * 2;
            const r = 8 + (Math.random() - 0.5) * 0.5;
            
            let ox = Math.cos(angle) * r;
            let oy = (Math.random() - 0.5) * 0.2;
            let oz = Math.sin(angle) * r;

            if(orbital === 0) { 
              x = ox; y = oy; z = oz; 
            } else if(orbital === 1) { 
              x = ox * 0.5 - oz * 0.866; y = oz * 0.5 + ox * 0.866; z = oy; 
            } else { 
              x = ox * 0.5 + oz * 0.866; y = -oz * 0.5 + ox * 0.866; z = oy; 
            }
            mixColor = c2.clone().lerp(c1, Math.random() * 0.5 + 0.5);
          }

        } else if (CONFIG.shape === 'Infinity Loop') {
          const t = (i / CONFIG.count) * Math.PI * 2;
          const scale = 12;
          const den = 1 + Math.pow(Math.sin(t), 2);
          
          const bx = (scale * Math.cos(t)) / den;
          const bz = (scale * Math.sin(t) * Math.cos(t)) / den;
          const by = Math.sin(t * 2) * 2;
          
          const thickness = Math.pow(Math.random(), 2) * 1.5;
          const noiseAngle = Math.random() * Math.PI * 2;
          
          x = bx + Math.cos(noiseAngle) * thickness;
          z = bz + Math.sin(noiseAngle) * thickness;
          y = by + (Math.random() - 0.5) * thickness;
          
          mixColor = c1.clone().lerp(c2, Math.abs(Math.sin(t)));

        } else if (CONFIG.shape === 'Quantum Lattice') {
          const S = Math.floor(Math.cbrt(CONFIG.count));
          let idx = i;
          if(idx >= S * S * S) idx = Math.floor(Math.random() * (S * S * S));
          
          const spacing = 1.2;
          const offset = (S * spacing) / 2;
          
          let bx = (idx % S) * spacing - offset;
          let by = (Math.floor(idx / S) % S) * spacing - offset;
          let bz = Math.floor(idx / (S * S)) * spacing - offset;
          
          if (Math.random() > 0.95) { 
            bx += (Math.random() - 0.5) * 4; 
            by += (Math.random() - 0.5) * 4; 
          }
          
          x = bx + (Math.random() - 0.5) * 0.1;
          y = by + (Math.random() - 0.5) * 0.1;
          z = bz + (Math.random() - 0.5) * 0.1;
          
          mixColor = c1.clone().lerp(c2, Math.abs(x + y + z) / (offset * 3));

        } else if (CONFIG.shape === 'Quasar') {
          const pType = Math.random();
          if(pType < 0.05) {
            const r = Math.random() * 0.8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            mixColor = new THREE.Color(1, 1, 1);
          } else if (pType < 0.4) {
            const side = Math.random() < 0.5 ? 1 : -1;
            y = side * (Math.pow(Math.random(), 3) * 30);
            const r = Math.random() * 0.5 + Math.abs(y) * 0.02;
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * r; z = Math.sin(a) * r;
            mixColor = c1.clone().lerp(c2, Math.abs(y) / 30);
          } else {
            const r = 1.5 + Math.pow(Math.random(), 2) * 16;
            const a = Math.random() * Math.PI * 2;
            x = Math.cos(a) * r;
            z = Math.sin(a) * r;
            y = (Math.random() - 0.5) * (1.5 / (r * 0.5));
            mixColor = c2.clone().lerp(c1, 1 - (r / 17.5));
          }
        }

        pos[i3] = x; pos[i3+1] = y; pos[i3+2] = z;
        cols[i3] = mixColor.r; cols[i3+1] = mixColor.g; cols[i3+2] = mixColor.b;
        randoms[i3] = Math.random(); randoms[i3+1] = Math.random(); randoms[i3+2] = Math.random();
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));

      material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: CONFIG.particleSize * 1000 },
          uOpacity: { value: 1.0 },
          uTexture: { value: tex },
          uMouse: { value: new THREE.Vector3(0,0,0) },
          uGravity: { value: 0 },
          uClick: { value: new THREE.Vector3(0,0,0) },
          uClickTime: { value: -100 },
          uChaos: { value: CONFIG.chaos },
          uPulse: { value: CONFIG.pulseRate },
          uWarp: { value: CONFIG.warp }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSize;
          uniform vec3 uMouse;
          uniform float uGravity;
          uniform vec3 uClick;
          uniform float uClickTime;

          uniform float uChaos;
          uniform float uPulse;
          uniform float uWarp;

          attribute vec3 aRandom;
          varying vec3 vColor;

          void main() {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            
            modelPosition.x += (aRandom.x - 0.5) * uChaos * 5.0;
            modelPosition.y += (aRandom.y - 0.5) * uChaos * 5.0;
            modelPosition.z += (aRandom.z - 0.5) * uChaos * 5.0;

            float t = uTime * 0.5;
            modelPosition.x += sin(t + aRandom.y * 10.0) * 0.1;
            modelPosition.y += cos(t + aRandom.x * 10.0) * 0.1;
            modelPosition.z += sin(t + aRandom.z * 10.0) * 0.1;

            float beat = 1.0 + sin(uTime * 3.0 * uPulse) * (0.05 * uPulse);
            modelPosition.xyz *= beat;

            float d = distance(modelPosition.xyz, uMouse);
            if (uGravity > 0.0) {
              vec3 dir = normalize(uMouse - modelPosition.xyz);
              float force = (5.0 / (d + 0.1)) * uGravity;
              modelPosition.xyz += dir * force;
            }

            float timeSinceClick = uTime - uClickTime;
            float waveDist = distance(modelPosition.xyz, uClick);
            float waveRadius = timeSinceClick * 15.0;
            float waveWidth = 3.0;
            if (timeSinceClick > 0.0 && abs(waveDist - waveRadius) < waveWidth) {
              vec3 pushDir = normalize(modelPosition.xyz - uClick);
              float power = (1.0 - abs(waveDist - waveRadius)/waveWidth);
              modelPosition.xyz += pushDir * power * 2.0; 
            }

            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;

            float warpFactor = 1.0 + (uWarp * aRandom.x * 10.0);
            
            gl_PointSize = uSize * (1.0 / max(0.1, -viewPosition.z));
            gl_PointSize *= (0.6 + 0.4 * sin(uTime * 4.0 + aRandom.x * 100.0));
            gl_PointSize *= warpFactor;

            vColor = color;
            if(uGravity > 0.0 && d < 4.0) vColor += vec3(0.5);
            if(timeSinceClick > 0.0 && abs(waveDist - waveRadius) < waveWidth) vColor += vec3(1.0);
            if (uPulse > 0.1) vColor += vec3(0.2 * sin(uTime * 3.0) * uPulse);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uOpacity;
          varying vec3 vColor;
          void main() {
            vec4 t = texture2D(uTexture, gl_PointCoord);
            gl_FragColor = vec4(vColor, uOpacity) * t;
          }
        `,
        transparent: true
      });

      materialRef.current = material;
      points = new THREE.Points(geometry, material);
      scene.add(points);
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function getInteractionTarget() {
      const target = new THREE.Vector3();
      const planeNormal = new THREE.Vector3();
      camera.getWorldDirection(planeNormal);
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, new THREE.Vector3(0, 0, 0));
      if (!raycaster.ray.intersectPlane(plane, target)) {
        raycaster.ray.at(10, target); 
      }
      return target;
    }

    canvas.addEventListener('pointerdown', (e) => {
      mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
      mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const target = getInteractionTarget();

      if(e.button === 2) { 
        CONFIG.gravity = 1; 
        if(material) material.uniforms.uGravity.value = 1;
      }
      if(e.button === 0) { 
        if(material) {
          material.uniforms.uClick.value.copy(target);
          material.uniforms.uClickTime.value = material.uniforms.uTime.value;
        }
      }
    });
    
    window.addEventListener('pointerup', () => {
      CONFIG.gravity = 0;
      if(material) material.uniforms.uGravity.value = 0;
    });

    window.addEventListener('contextmenu', e => {
      if (e.target === canvas) e.preventDefault();
    });

    canvas.addEventListener('pointermove', e => {
      mouse.x = (e.clientX / container.clientWidth) * 2 - 1;
      mouse.y = -(e.clientY / container.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      if(material) material.uniforms.uMouse.value.copy(getInteractionTarget());
    });

    // --- GUI (only when enabled) ---
    let updateCameraControls = () => {};

    if (!disableGui) {
      const gui = new GUI({ title: guiTitle, container: container });
      guiRef.current = gui;

      gui.add(CONFIG, 'shape', [
        'Atom Orbitals', 'Black Hole', 'Cosmic Web', 'DNA', 'Galaxy', 
        'Infinity Loop', 'Klein Bottle', 'Möbius', 'Nebula', 'Pulsar', 
        'Quantum Knot', 'Quantum Lattice', 'Quasar', 'Sphere', 'Supernova', 'Tesseract', 'Wormhole' 
      ]).name('GEO_TYPE').onFinishChange(buildUniverse);

      const themes = {
        Void:    () => { CONFIG.colorInner='#ffffff'; CONFIG.colorOuter='#333333'; buildUniverse(); },
        Natural: () => { CONFIG.colorInner='#ff9933'; CONFIG.colorOuter='#1144ff'; buildUniverse(); },
        Cyber:   () => { CONFIG.colorInner='#00ffcc'; CONFIG.colorOuter='#aa00ff'; buildUniverse(); },
        Inferno: () => { CONFIG.colorInner='#ff0000'; CONFIG.colorOuter='#110000'; buildUniverse(); }
      };
      gui.add(CONFIG, 'mode', ['Void', 'Natural', 'Cyber', 'Inferno']).name('VISUAL_MODE').onChange(v => themes[v]());

      const f1 = gui.addFolder('>> PHYSICS_KERNEL');
      f1.add(CONFIG, 'timeScale', -2, 3).name('T_DILATION');
      f1.add(CONFIG, 'count', 10000, 200000).name('PARTICLE_CNT').onFinishChange(buildUniverse);
      f1.add(CONFIG, 'cinematic').name('CINEMA_VIEW').onChange(v => container.classList.toggle('cinema', v));
      f1.add(CONFIG, 'chaos', 0, 1).name('CHAOS_LEVEL').onChange(v => { if(material) material.uniforms.uChaos.value = v; });
      f1.add(CONFIG, 'pulseRate', 0, 5).name('PULSE_RATE').onChange(v => { if(material) material.uniforms.uPulse.value = v; });
      f1.add(CONFIG, 'spinSpeed', -2, 2).name('SPIN_VELOCITY').onChange(v => controls.autoRotateSpeed = v);
      f1.add(CONFIG, 'warp', 0, 2).name('WARP_FACTOR').onChange(v => { if(material) material.uniforms.uWarp.value = v; });
      f1.open();

      const f2 = gui.addFolder('>> CAMERA_SYSTEM');
      const cameraControls = { posX: camera.position.x, posY: camera.position.y, posZ: camera.position.z, zoom: camera.zoom, autoRotate: true };
      f2.add(cameraControls, 'posX', -50, 50).name('CAM_X').onChange(v => camera.position.x = v);
      f2.add(cameraControls, 'posY', -50, 50).name('CAM_Y').onChange(v => camera.position.y = v);
      f2.add(cameraControls, 'posZ', 1, 100).name('CAM_Z').onChange(v => camera.position.z = v);
      f2.add(cameraControls, 'zoom', 0.1, 5).name('ZOOM').onChange(v => { camera.zoom = v; camera.updateProjectionMatrix(); });
      f2.add(cameraControls, 'autoRotate').name('AUTO_ROTATE').onChange(v => controls.autoRotate = v);
      f2.open();

      const f3 = gui.addFolder('>> DEFAULT_CAM');
      f3.add(CONFIG, 'defaultCamX', -50, 50).name('DEF_X');
      f3.add(CONFIG, 'defaultCamY', -50, 50).name('DEF_Y');
      f3.add(CONFIG, 'defaultCamZ', 1, 100).name('DEF_Z');
      f3.add(CONFIG, 'defaultZoom', 0.1, 5).name('DEF_ZOOM');
      f3.add({ reset: () => {
        camera.position.set(CONFIG.defaultCamX, CONFIG.defaultCamY, CONFIG.defaultCamZ);
        camera.zoom = CONFIG.defaultZoom;
        camera.updateProjectionMatrix();
        controls.reset();
      }}, 'reset').name('RESET_TO_DEFAULT');
      f3.close();

      updateCameraControls = () => {
        cameraControls.posX = camera.position.x;
        cameraControls.posY = camera.position.y;
        cameraControls.posZ = camera.position.z;
        cameraControls.zoom = camera.zoom;
      };
    }

    buildUniverse();

    // Half-res bloom for performance
    const bloomW = Math.floor(width / 2);
    const bloomH = Math.floor(height / 2);
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(bloomW, bloomH), 1.5, 0.4, 0.0);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const clock = new THREE.Clock();
    
    let accumulatedTime = 0;
    
    // Camera animation state
    const cameraAnimation = {
      startX: initialCamX,
      startY: initialCamY,
      startZoom: initialZoom,
      endX: CONFIG.defaultCamX,
      endY: CONFIG.defaultCamY,
      endZoom: CONFIG.defaultZoom,
      duration: 5.0, // seconds
      elapsed: 0,
      active: true
    };

     const tick = () => {
       const dt = clock.getDelta();
       accumulatedTime += dt * CONFIG.timeScale;

       if (material && material.uniforms && material.uniforms.uTime) {
         material.uniforms.uTime.value = accumulatedTime;
        
         // Scale down particle size during transition
         let sizeScale = 1.0;
         if (isTransitioningRef.current) {
           if (shapeRef.current === 'Black Hole') {
             sizeScale = transitionDirectionRef.current === 'out' ? 1.0 - transitionProgressRef.current : transitionProgressRef.current;
           } else if (shapeRef.current === 'Quantum Knot') {
             sizeScale = transitionDirectionRef.current === 'in' ? transitionProgressRef.current : 1.0 - transitionProgressRef.current;
           }
         }
         
         if (material.uniforms.uSize) {
           material.uniforms.uSize.value = (CONFIG.particleSize * 1000 * Math.min(window.devicePixelRatio, 2)) * sizeScale;
         }
         if(material.uniforms.uOpacity) {
             material.uniforms.uOpacity.value = sizeScale;
         }
      }
      
      if(CONFIG.gravity > 0 && material) {
        material.uniforms.uGravity.value = THREE.MathUtils.lerp(material.uniforms.uGravity.value, 1.0, 0.1);
      } else if (material) {
        material.uniforms.uGravity.value = THREE.MathUtils.lerp(material.uniforms.uGravity.value, 0.0, 0.1);
      }

      // Camera animation
      if (cameraAnimation.active) {
        cameraAnimation.elapsed += dt;
        const progress = Math.min(cameraAnimation.elapsed / cameraAnimation.duration, 1.0);
        
        // Ease out cubic
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        
        camera.position.x = THREE.MathUtils.lerp(cameraAnimation.startX, cameraAnimation.endX, easedProgress);
        camera.position.y = THREE.MathUtils.lerp(cameraAnimation.startY, cameraAnimation.endY, easedProgress);
        camera.zoom = THREE.MathUtils.lerp(cameraAnimation.startZoom, cameraAnimation.endZoom, easedProgress);
        camera.updateProjectionMatrix();
        
        // Disable OrbitControls during animation to prevent override
        controls.enabled = false;
        
        if (progress >= 1.0) {
          cameraAnimation.active = false;
          controls.enabled = true;
        }
      }

      // Transition camera zoom - universal for ALL shapes
      if (isTransitioningRef.current) {
        if (transitionDirectionRef.current === 'out') {
          camera.zoom = THREE.MathUtils.lerp(CONFIG.defaultZoom, CONFIG.defaultZoom * 0.15, transitionProgressRef.current);
        } else {
          camera.zoom = THREE.MathUtils.lerp(CONFIG.defaultZoom * 0.15, CONFIG.defaultZoom, transitionProgressRef.current);
        }
        camera.updateProjectionMatrix();
      }

      controls.update();
      
      // Update camera control sliders to reflect actual camera position
      updateCameraControls();
      
      // Update camera position display
      const cameraInfo = container.querySelector('.camera-info');
      if (cameraInfo) {
        cameraInfo.textContent = `CAM_POS: X: ${camera.position.x.toFixed(2)} Y: ${camera.position.y.toFixed(2)} Z: ${camera.position.z.toFixed(2)} | ZOOM: ${camera.zoom.toFixed(2)}`;
      }
      
      // Safety check before rendering
      if (composer && renderer && scene && camera) {
        composer.render();
      }
      
      // Only continue if not paused
      if (!isPausedRef.current) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animationRef.current = null;
      }
    };
    
    // Store tick reference for external access
    tickRef.current = tick;
    
    // Start only if active
    if (isActive) {
      lastTimeRef.current = performance.now();
      tick();
    }

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      composer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Cancel any pending animations
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      
      if (guiRef.current) {
        guiRef.current.destroy();
      }
      if (points) {
        geometry.dispose();
        material.dispose();
        scene.remove(points);
      }
      renderer.dispose();
      composer.dispose();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="universe-container">
      <div className="cinematic-bar top"></div>
      <div className="cinematic-bar bottom"></div>
      <div className="camera-info">CAM_POS: X: 0.00 Y: 0.00 Z: 0.00 | ZOOM: 1.00</div>
    </div>
  );
};

export default UniverseEngine;
