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
      setTimeout(() => { scrolling = false; }, 1200); // Optimized cooldown
    };

    window.addEventListener('wheel', handleWheel);
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activePage, isTransitioning]);

  // Page camera configurations
  const pageConfigs = {
    1: { x: -10.2, y: 2.5, z: 10.186, zoom: 1.3867 },
    2: { x: 0, y: 5, z: 15, zoom: 1 },
    3: { x: 0, y: 0, z: 20, zoom: 1 },
    4: { x: 0, y: 0, z: 25, zoom: 1 }
  };

  useEffect(() => {
    if (activePage !== targetPage && !isTransitioning) {
      setIsTransitioning(true);
      setTransitionProgress(0);
      
      let progress = 0;
      let lastTime = performance.now();
      const duration = 1200; // 1.2 seconds transition (optimized)

      // Cubic easing function for smooth cinematic feel
      const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
    // Force visibility for page 0 on initial load
    if (pageNum === 0 && activePage === 0 && targetPage === 0) return 1;
    
    if (activePage === pageNum && targetPage === pageNum) return 1;
    if (activePage === pageNum && targetPage !== pageNum) return 1 - transitionProgress;
    if (targetPage === pageNum && activePage !== pageNum) return transitionProgress;
    return 0;
  };

  // Check if page is actively rendering
  const isPageActive = (pageNum) => {
    return activePage === pageNum || targetPage === pageNum;
  };

  // Universal Cinematic Controller - handles ALL page transitions
  useEffect(() => {
    // Get all cinematic bars across all pages
    const allBars = document.querySelectorAll('.cinematic-bar');
    
    if (isTransitioning) {
      // Hide bars smoothly during transitions
      allBars.forEach(bar => {
        bar.style.height = '0px';
      });
    } else if (activePage > 0) {
      // Show bars when page is settled
      allBars.forEach(bar => {
        bar.style.height = '200px';
      });
    } else {
      // Hide completely on start page
      allBars.forEach(bar => {
        bar.style.height = '0px';
      });
    }
  }, [isTransitioning, activePage]);

  return (
    <div className="container" ref={containerRef}>
      {/* Start Page */}
      <div 
        className={`page page-0 ${activePage === 0 || targetPage === 0 ? 'active' : ''}`}
        style={{ opacity: getOpacity(0) }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
          <UniverseEngine 
             shape="Wormhole"
             particleCountOverride={25000}
             disableGui={true}
             cinematic={false}
             isActive={activePage === 0 || targetPage === 0}
             defaultCamZ={22}
             spinSpeedOverride={0.1}
             colorInnerOverride="#ffffff"
             colorOuterOverride="#333333"
          />
        </div>
        <div className="start-screen" style={{ background: 'transparent' }}>
          <div className="cyber-terminal-header">A VIRTUAL EXPERIENCE</div>
          <h1 className="start-title">ROOMMAT3</h1>
          <button className="start-button cyber-glitch-btn" onClick={startExperience}>
            CLICK TO BEGIN
          </button>
          <p className="start-subtitle">SCROLL TO NAVIGATE</p>
        </div>
      </div>

      <div 
        className={`page page-1 ${(activePage === 1 || targetPage === 1) ? 'active' : ''}`}
        style={{ opacity: getOpacity(1) }}
      >
        <UniverseEngine 
          shape="Black Hole"
          initialCamX={-33.6}
          initialCamY={-30.7}
          defaultCamX={-10.2}
          defaultCamY={2.5}
          defaultCamZ={10.186}
          defaultZoom={1.3867}
          cinematic={false}
          guiTitle=">> UNIVERSE_ENGINE.EXE"
          isActive={isPageActive(1)}
          isTransitioning={isTransitioning && isPageActive(1)}
          transitionProgress={targetPage === 1 && activePage !== 1 ? 1 - transitionProgress : transitionProgress}
          transitionDirection={targetPage > activePage ? "out" : "in"}
        />
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="top-left" top="20%" left="10%" title="EVENT HORIZON" text="DETECTED: Infinite Gravity Well. Spacetime curvature mapping nominal." delay={0.2} />
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="bottom-right" bottom="25%" right="10%" title="PHOTON SPHERE" text="ORBITAL VELOCITY: 299,792 km/s. Photons captured." delay={0.6} />
        <CyberCallout show={isPageActive(1) && !isTransitioning} variant="bottom-left" bottom="20%" left="15%" title="SINGULARITY" text="MASS: SUPERMASSIVE. Core density algorithms failing." delay={1.0} />
      </div>
      <div 
        className={`page page-2 ${(activePage === 2 || targetPage === 2) ? 'active' : ''}`}
        style={{ opacity: getOpacity(2) }}
      >
        <UniverseEngine 
          shape="Quantum Knot"
          initialCamX={0}
          initialCamY={0}
          defaultCamX={0}
          defaultCamY={5}
          defaultCamZ={15}
          defaultZoom={1}
          cinematic={false}
          guiTitle=">> PAGE_2_ENGINE.EXE"
          isActive={activePage === 2 || targetPage === 2}
          isTransitioning={isTransitioning && (activePage === 2 || targetPage === 2)}
          transitionProgress={targetPage === 2 && activePage !== 2 ? transitionProgress : 1 - transitionProgress}
          transitionDirection={targetPage === 2 && activePage === 1 ? "in" : "out"}
        />
        <CyberCallout show={isPageActive(2) && !isTransitioning} variant="top-right" top="25%" right="10%" title="UNCERTAINTY PRINCIPLE" text="STATE: ENTANGLED. Multiple probabilities collapsing." delay={0.3} />
        <CyberCallout show={isPageActive(2) && !isTransitioning} variant="bottom-left" bottom="25%" left="12%" title="DIMENSIONAL WARP" text="CALDABI-YAU MANIFOLD FLUX. Spatial compression detected." delay={0.8} />
      </div>
      <div 
        className={`page page-3 ${(activePage === 3 || targetPage === 3) ? 'active' : ''}`}
        style={{ opacity: getOpacity(3) }}
      >
        <UniverseEngine 
          shape="Cosmic Web"
          initialCamX={0}
          initialCamY={0}
          defaultCamX={0}
          defaultCamY={0}
          defaultCamZ={20}
          defaultZoom={1}
          cinematic={false}
          guiTitle=">> PAGE_3_ENGINE.EXE"
          isActive={activePage === 3 || targetPage === 3}
        />
        <CyberCallout show={isPageActive(3) && !isTransitioning} variant="top-left" top="20%" left="15%" title="DARK MATTER FILAMENT" text="DENSITY: CRITICAL. Binding galactic superstructures." delay={0.2} />
        <CyberCallout show={isPageActive(3) && !isTransitioning} variant="bottom-right" bottom="25%" right="10%" title="GALACTIC CLUSTER" text="NODES: 42,000. Baryonic mapping actively streaming." delay={0.7} />
      </div>
      <div 
        className={`page page-4 ${(activePage === 4 || targetPage === 4) ? 'active' : ''}`}
        style={{ opacity: getOpacity(4) }}
      >
        <UniverseEngine 
          shape="Quasar"
          initialCamX={0}
          initialCamY={0}
          defaultCamX={0}
          defaultCamY={0}
          defaultCamZ={25}
          defaultZoom={1}
          cinematic={false}
          guiTitle=">> PAGE_4_ENGINE.EXE"
          isActive={activePage === 4 || targetPage === 4}
        />
        <CyberCallout show={isPageActive(4) && !isTransitioning} variant="top-right" top="22%" right="12%" title="ACCRETION DISK" text="TEMPERATURE: 10^7 K. Hyper-friction plasma generation active." delay={0.2} />
        <CyberCallout show={isPageActive(4) && !isTransitioning} variant="bottom-left" bottom="25%" left="15%" title="RELATIVISTIC JET" text="OUTPUT: 10^42 WATTS. Magnetic field acceleration beyond c-limit." delay={0.6} />
      </div>
      <div 
        className={`page page-5 ${(activePage === 5 || targetPage === 5) ? 'active' : ''}`}
        style={{ opacity: getOpacity(5) }}
      >
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
                    isActive={activePage === 5 || targetPage === 5}
                    defaultCamZ={15}
                    defaultZoom={s.zoom}
                    spinSpeedOverride={0.8}
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
      </div>
    </div>
  );
}

export default App;
