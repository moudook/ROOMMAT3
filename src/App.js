import './App.css';
import UniverseEngine from './UniverseEngine';
import CyberCallout from './CyberCallout';
import { useState, useEffect, useRef } from 'react';
import scifiAudio from './scifi.mp3';

function App() {
  const [activePage, setActivePage] = useState(0);
  const [targetPage, setTargetPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);
  // Track which pages have been visited (for lazy mounting)
  const [mountedPages, setMountedPages] = useState(new Set([0]));
  const audioRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize audio but don't autoplay
  useEffect(() => {
    audioRef.current = new Audio(scifiAudio);
    audioRef.current.loop = true;
    audioRef.current.volume = 0;
    audioRef.current.preload = 'auto';
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Start audio on user interaction - 100% reliable
  const startExperience = () => {
    if (!audioStarted && audioRef.current) {
      audioRef.current.play().then(() => {
        // Fade in smoothly
        let vol = 0;
        const fadeIn = setInterval(() => {
          vol += 0.015;
          audioRef.current.volume = Math.min(vol, 0.4);
          if (vol >= 0.4) clearInterval(fadeIn);
        }, 30);
        setAudioStarted(true);
      }).catch(() => {});
    }
    
    // Transition to first content page
    setTargetPage(1);
  };

  // Mount pages when they become targets
  useEffect(() => {
    setMountedPages(prev => {
      const next = new Set(prev);
      next.add(activePage);
      next.add(targetPage);
      return next;
    });
  }, [activePage, targetPage]);

  useEffect(() => {
    let scrolling = false;
    const handleWheel = (e) => {
      if (isTransitioning || scrolling || activePage === 0) return;

      if (e.deltaY > 30 && activePage < 5) {
        setTargetPage(activePage + 1);
        scrolling = true;
      } else if (e.deltaY < -30 && activePage > 1) {
        setTargetPage(activePage - 1);
        scrolling = true;
      }
      setTimeout(() => { scrolling = false; }, 1200);
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activePage, isTransitioning]);

  useEffect(() => {
    if (activePage !== targetPage && !isTransitioning) {
      setIsTransitioning(true);
      setTransitionProgress(0);
      
      let progress = 0;
      let lastTime = performance.now();
      const duration = 1200;

      const animateTransition = (time) => {
        const delta = time - lastTime;
        progress += delta / duration;
        
        if (progress < 1) {
          setTransitionProgress(progress);
          lastTime = time;
          requestAnimationFrame(animateTransition);
        } else {
          setTransitionProgress(1);
          setIsTransitioning(false);
          setActivePage(targetPage);
        }
      };
      requestAnimationFrame(animateTransition);
    }
  }, [activePage, targetPage, isTransitioning]);

  const getOpacity = (pageNum) => {
    if (pageNum === 0 && activePage === 0 && targetPage === 0) return 1;
    if (activePage === pageNum && targetPage === pageNum) return 1;
    if (activePage === pageNum && targetPage !== pageNum) return 1 - transitionProgress;
    if (targetPage === pageNum && activePage !== pageNum) return transitionProgress;
    return 0;
  };

  const getZIndex = (pageNum) => {
    if (pageNum === 0 && (activePage === 0 || targetPage === 0)) return 100;
    if (activePage === pageNum || targetPage === pageNum) return 10;
    return 1;
  };

  const isPageActive = (pageNum) => {
    return activePage === pageNum || targetPage === pageNum;
  };

  return (
    <div className="container" ref={containerRef}>
      {/* Page 0 - Start Screen */}
      <div 
        className={`page page-0 ${isPageActive(0) ? 'active' : ''}`}
        style={{ opacity: getOpacity(0), zIndex: getZIndex(0) }}
      >
        {mountedPages.has(0) && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
            <UniverseEngine 
               shape="Wormhole"
               particleCountOverride={25000}
               disableGui={true}
               cinematic={false}
               isActive={isPageActive(0)}
               defaultCamZ={22}
               spinSpeedOverride={0.1}
               colorInnerOverride="#ffffff"
               colorOuterOverride="#555555"
            />
          </div>
        )}
        <div className="start-screen">
          <div className="cyber-terminal-header">A VIRTUAL EXPERIENCE</div>
          <h1 className="start-title">ROOMMAT3</h1>
          <button className="start-button cyber-glitch-btn" onClick={startExperience}>
            CLICK TO BEGIN
          </button>
          <p className="start-subtitle">SCROLL TO NAVIGATE</p>
        </div>
      </div>

      {/* Page 1 - Black Hole */}
      <div 
        className={`page page-1 ${isPageActive(1) ? 'active' : ''}`}
        style={{ opacity: getOpacity(1), zIndex: getZIndex(1) }}
      >
        {mountedPages.has(1) && (
          <UniverseEngine 
            shape="Black Hole"
            initialCamX={-33.6}
            initialCamY={-30.7}
            defaultCamX={-10.2}
            defaultCamY={2.5}
            defaultCamZ={10.186}
            defaultZoom={1.3867}
            cinematic={false}
            guiTitle=">> BLACK_HOLE.EXE"
            isActive={isPageActive(1)}
            disableGui={false}
            isTransitioning={isTransitioning && isPageActive(1)}
            transitionProgress={transitionProgress}
            transitionDirection={targetPage > activePage ? "out" : "in"}
          />
        )}
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="top-left" top="20%" left="10%" title="EVENT HORIZON" text="DETECTED: Infinite Gravity Well. Spacetime curvature mapping nominal." delay={0.2} />
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="bottom-right" bottom="25%" right="10%" title="PHOTON SPHERE" text="ORBITAL VELOCITY: 299,792 km/s. Photons captured." delay={0.6} />
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="bottom-left" bottom="20%" left="15%" title="SINGULARITY" text="MASS: SUPERMASSIVE. Core density algorithms failing." delay={1.0} />
      </div>

      {/* Page 2 - Quantum Knot */}
      <div 
        className={`page page-2 ${isPageActive(2) ? 'active' : ''}`}
        style={{ opacity: getOpacity(2), zIndex: getZIndex(2) }}
      >
        {mountedPages.has(2) && (
          <UniverseEngine 
            shape="Quantum Knot"
            initialCamX={0}
            initialCamY={0}
            defaultCamX={0}
            defaultCamY={5}
            defaultCamZ={15}
            defaultZoom={1}
            cinematic={false}
            guiTitle=">> QUANTUM_KNOT.EXE"
            isActive={isPageActive(2)}
            disableGui={true}
            isTransitioning={isTransitioning && isPageActive(2)}
            transitionProgress={transitionProgress}
            transitionDirection={targetPage > activePage ? "in" : "out"}
          />
        )}
        <CyberCallout show={isPageActive(2) && !isTransitioning} variant="top-right" top="25%" right="10%" title="UNCERTAINTY PRINCIPLE" text="STATE: ENTANGLED. Multiple probabilities collapsing." delay={0.3} />
        <CyberCallout show={isPageActive(2) && !isTransitioning} variant="bottom-left" bottom="25%" left="12%" title="DIMENSIONAL WARP" text="CALDABI-YAU MANIFOLD FLUX. Spatial compression detected." delay={0.8} />
      </div>

      {/* Page 3 - Cosmic Web */}
      <div 
        className={`page page-3 ${isPageActive(3) ? 'active' : ''}`}
        style={{ opacity: getOpacity(3), zIndex: getZIndex(3) }}
      >
        {mountedPages.has(3) && (
          <UniverseEngine 
            shape="Cosmic Web"
            initialCamX={0}
            initialCamY={0}
            defaultCamX={0}
            defaultCamY={0}
            defaultCamZ={20}
            defaultZoom={1}
            cinematic={false}
            guiTitle=">> COSMIC_WEB.EXE"
            isActive={isPageActive(3)}
            disableGui={true}
          />
        )}
        <CyberCallout show={isPageActive(3) && !isTransitioning} variant="top-left" top="20%" left="15%" title="DARK MATTER FILAMENT" text="DENSITY: CRITICAL. Binding galactic superstructures." delay={0.2} />
        <CyberCallout show={isPageActive(3) && !isTransitioning} variant="bottom-right" bottom="25%" right="10%" title="GALACTIC CLUSTER" text="NODES: 42,000. Baryonic mapping actively streaming." delay={0.7} />
      </div>

      {/* Page 4 - Quasar */}
      <div 
        className={`page page-4 ${isPageActive(4) ? 'active' : ''}`}
        style={{ opacity: getOpacity(4), zIndex: getZIndex(4) }}
      >
        {mountedPages.has(4) && (
          <UniverseEngine 
            shape="Quasar"
            initialCamX={0}
            initialCamY={0}
            defaultCamX={0}
            defaultCamY={0}
            defaultCamZ={25}
            defaultZoom={1}
            cinematic={false}
            guiTitle=">> QUASAR.EXE"
            isActive={isPageActive(4)}
            disableGui={true}
          />
        )}
        <CyberCallout show={isPageActive(4) && !isTransitioning} variant="top-right" top="22%" right="12%" title="ACCRETION DISK" text="TEMPERATURE: 10^7 K. Hyper-friction plasma generation active." delay={0.2} />
        <CyberCallout show={isPageActive(4) && !isTransitioning} variant="bottom-left" bottom="25%" left="15%" title="RELATIVISTIC JET" text="OUTPUT: 10^42 WATTS. Magnetic field acceleration beyond c-limit." delay={0.6} />
      </div>

      {/* Page 5 - Footer */}
      <div 
        className={`page page-5 ${isPageActive(5) ? 'active' : ''}`}
        style={{ opacity: getOpacity(5), zIndex: getZIndex(5) }}
      >
        {mountedPages.has(5) && (
          <div className="footer-layout">
            <div className="footer-shapes-container">
              {[
                {shape: 'Black Hole', zoom: 1}, 
                {shape: 'Quantum Knot', zoom: 2}, 
                {shape: 'DNA', zoom: 1}, 
                {shape: 'Atom Orbitals', zoom: 1}, 
                {shape: 'Wormhole', zoom: 1.5}
              ].map((s, idx) => (
                <div className="footer-shape-column" key={idx}>
                  <div className="footer-shape-box">
                    <UniverseEngine 
                      shape={s.shape}
                      particleCountOverride={8000}
                      disableGui={true}
                      cinematic={false}
                      isActive={isPageActive(5)}
                      defaultCamZ={15}
                      defaultZoom={s.zoom}
                      spinSpeedOverride={0.8}
                      colorInnerOverride="#ffffff"
                      colorOuterOverride="#555555"
                    />
                  </div>
                  <p className="footer-shape-text">SYS.NODE // {s.shape.toUpperCase()}</p>
                  <p className="footer-shape-sub">STATUS: ONLINE</p>
                  <p className="footer-shape-sub">UPTIME: 99.9%</p>
                </div>
              ))}
            </div>
            <div className="footer-title-container">
              <h1 className="footer-title">ROOMMAT3</h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
