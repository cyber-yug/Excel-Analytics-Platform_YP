import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
    const [animationStage, setAnimationStage] = useState(0);
    const [particles, setParticles] = useState([]);

    // Generate floating particles
    useEffect(() => {
        const generateParticles = () => {
            const newParticles = [];
            for (let i = 0; i < 15; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 4 + 2,
                    delay: Math.random() * 2,
                    duration: Math.random() * 3 + 2
                });
            }
            setParticles(newParticles);
        };
        generateParticles();
    }, []);

    useEffect(() => {
        const animationSequence = [
            { stage: 0, delay: 0 },      // Initial state
            { stage: 1, delay: 300 },    // Background particles
            { stage: 2, delay: 600 },    // Logo fade in
            { stage: 3, delay: 1200 },   // Logo scale + glow
            { stage: 4, delay: 2000 },   // Text appear + pulse
            { stage: 5, delay: 2800 },   // Chart animations
            { stage: 6, delay: 3400 },   // Final effects
            { stage: 7, delay: 4200 }    // Fade out and complete
        ];

        animationSequence.forEach(({ stage, delay }) => {
            setTimeout(() => {
                setAnimationStage(stage);
                if (stage === 7) {
                    // Complete splash screen after fade out
                    setTimeout(() => {
                        onComplete();
                    }, 800);
                }
            }, delay);
        });
    }, [onComplete]);

    return (
        <div style={styles.splashContainer}>
            {/* Animated Background Grid */}
            <div 
                style={{
                    ...styles.backgroundGrid,
                    ...(animationStage >= 1 && styles.gridVisible)
                }}
            >
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        style={{
                            ...styles.gridLine,
                            animationDelay: `${i * 0.1}s`
                        }}
                    />
                ))}
            </div>

            {/* Floating Particles */}
            {particles.map(particle => (
                <div
                    key={particle.id}
                    style={{
                        ...styles.particle,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                        opacity: animationStage >= 1 ? 1 : 0
                    }}
                />
            ))}

            {/* Logo Container */}
            <div 
                style={{
                    ...styles.logoContainer,
                    ...(animationStage >= 2 && styles.logoFadeIn),
                    ...(animationStage >= 3 && styles.logoScale),
                    ...(animationStage >= 4 && styles.logoPulse),
                    ...(animationStage >= 7 && styles.fadeOut)
                }}
            >
                {/* Logo Glow Effect */}
                <div 
                    style={{
                        ...styles.logoGlow,
                        ...(animationStage >= 3 && styles.glowActive)
                    }}
                />
                
                {/* Excel Analytics Logo Image */}
                <div style={styles.logoWrapper}>
                    <img 
                        src="/excel_logo.png" 
                        alt="Excel Analytics" 
                        style={styles.logoImage}
                        onError={(e) => {
                            console.error('Logo image failed to load from /excel_logo.png');
                            // Show fallback text
                            e.target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.style.cssText = `
                                font-size: 48px;
                                font-weight: 800;
                                color: white;
                                text-align: center;
                                text-shadow: 0 4px 8px rgba(0,0,0,0.3);
                                font-family: 'Poppins', sans-serif;
                            `;
                            fallback.innerHTML = 'EXCEL<br/>ANALYTICS';
                            e.target.parentNode.appendChild(fallback);
                        }}
                    />
                </div>
            </div>

            {/* Text Container */}
            <div 
                style={{
                    ...styles.textContainer,
                    ...(animationStage >= 4 && styles.textFadeIn),
                    ...(animationStage >= 5 && styles.textPulse),
                    ...(animationStage >= 7 && styles.fadeOut)
                }}
            >
                <div style={styles.tagline}>Powerful Data Insights</div>
                <div style={styles.subtitle}>Transform • Analyze • Visualize</div>
            </div>

            {/* Animated Chart Elements */}
            <div 
                style={{
                    ...styles.chartContainer,
                    ...(animationStage >= 5 && styles.chartsVisible)
                }}
            >
                <div style={styles.chartWrapper}>
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.chartBar,
                                height: `${20 + Math.random() * 60}%`,
                                animationDelay: `${i * 0.2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Loading Animation */}
            <div 
                style={{
                    ...styles.loadingContainer,
                    ...(animationStage >= 2 && styles.loadingVisible)
                }}
            >
                <div style={styles.loadingBar}>
                    <div 
                        style={{
                            ...styles.loadingProgress,
                            ...(animationStage >= 3 && styles.loadingAnimate)
                        }}
                    ></div>
                </div>
                <div style={styles.loadingText}>
                    {animationStage < 3 ? 'Initializing...' : 
                     animationStage < 5 ? 'Loading Analytics...' : 
                     animationStage < 6 ? 'Preparing Dashboard...' : 'Ready!'}
                </div>
            </div>

            {/* Orbiting Elements */}
            <div 
                style={{
                    ...styles.orbitContainer,
                    ...(animationStage >= 4 && styles.orbitActive)
                }}
            >
                <div style={{...styles.orbitElement, ...styles.orbit1}} />
                <div style={{...styles.orbitElement, ...styles.orbit2}} />
                <div style={{...styles.orbitElement, ...styles.orbit3}} />
            </div>

            {/* CSS Animations */}
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap');
                
                @keyframes logoFadeIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                @keyframes logoScale {
                    0% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                    }
                }

                @keyframes logoPulse {
                    0%, 100% {
                        filter: drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6));
                    }
                    50% {
                        filter: drop-shadow(0 20px 60px rgba(33, 115, 70, 0.4));
                    }
                }

                @keyframes textFadeIn {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes textPulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                @keyframes fadeOut {
                    0% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                    }
                }

                @keyframes loadingProgress {
                    0% {
                        width: 0%;
                    }
                    100% {
                        width: 100%;
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                        opacity: 0.6;
                    }
                    50% {
                        transform: translateY(-20px) rotate(180deg);
                        opacity: 1;
                    }
                }

                @keyframes gridLine {
                    0% {
                        opacity: 0;
                        transform: scaleX(0);
                    }
                    50% {
                        opacity: 0.3;
                    }
                    100% {
                        opacity: 0.1;
                        transform: scaleX(1);
                    }
                }

                @keyframes glow {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.6;
                        transform: scale(1.2);
                    }
                }

                @keyframes chartGrow {
                    0% {
                        transform: scaleY(0);
                        opacity: 0;
                    }
                    100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }

                @keyframes orbit {
                    from {
                        transform: rotate(0deg) translateX(100px) rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg) translateX(100px) rotate(-360deg);
                    }
                }

                @keyframes orbit2 {
                    from {
                        transform: rotate(0deg) translateX(150px) rotate(0deg);
                    }
                    to {
                        transform: rotate(-360deg) translateX(150px) rotate(360deg);
                    }
                }

                @keyframes orbit3 {
                    from {
                        transform: rotate(0deg) translateX(80px) rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg) translateX(80px) rotate(-360deg);
                    }
                }

                @keyframes sparkle {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                `}
            </style>
        </div>
    );
};

const styles = {
    splashContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Poppins', sans-serif",
        overflow: 'hidden'
    },
    backgroundGrid: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        transition: 'opacity 1s ease-in-out'
    },
    gridVisible: {
        opacity: 1
    },
    gridLine: {
        position: 'absolute',
        background: 'linear-gradient(90deg, transparent, rgba(33, 115, 70, 0.3), transparent)',
        height: '1px',
        width: '100%',
        top: `${Math.random() * 100}%`,
        animation: 'gridLine 2s ease-out forwards',
        transformOrigin: 'left center'
    },
    particle: {
        position: 'absolute',
        background: 'radial-gradient(circle, rgba(33, 115, 70, 0.8), rgba(45, 143, 71, 0.4))',
        borderRadius: '50%',
        animation: 'float infinite ease-in-out',
        pointerEvents: 'none'
    },
    logoContainer: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px',
        marginBottom: '50px',
        opacity: 0
    },
    logoGlow: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(33, 115, 70, 0.3), transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0,
        animation: 'glow 2s ease-in-out infinite'
    },
    glowActive: {
        opacity: 1
    },
    logoWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
    },
    logoImage: {
        width: 'auto',
        height: '350px',
        maxWidth: '600px',
        objectFit: 'contain',
        filter: 'drop-shadow(0 15px 40px rgba(0, 0, 0, 0.6))',
        transition: 'all 0.3s ease'
    },
    logoFadeIn: {
        animation: 'logoFadeIn 1s ease-out forwards'
    },
    logoScale: {
        animation: 'logoFadeIn 1s ease-out forwards, logoScale 2s ease-in-out 1s forwards'
    },
    logoPulse: {
        animation: 'logoFadeIn 1s ease-out forwards, logoScale 2s ease-in-out 1s forwards, logoPulse 3s ease-in-out infinite'
    },
    textContainer: {
        textAlign: 'center',
        opacity: 0,
        color: 'white',
        marginTop: '20px'
    },
    textFadeIn: {
        animation: 'textFadeIn 1s ease-out forwards'
    },
    textPulse: {
        animation: 'textFadeIn 1s ease-out forwards, textPulse 2s ease-in-out infinite'
    },
    tagline: {
        fontSize: '20px',
        fontWeight: '300',
        color: '#ffffff',
        letterSpacing: '3px',
        textTransform: 'uppercase',
        textShadow: '0 4px 8px rgba(0,0,0,0.5)',
        marginBottom: '10px'
    },
    subtitle: {
        fontSize: '14px',
        fontWeight: '200',
        color: '#cccccc',
        letterSpacing: '2px',
        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
    },
    chartContainer: {
        position: 'absolute',
        right: '100px',
        bottom: '150px',
        opacity: 0,
        transition: 'opacity 1s ease-in-out'
    },
    chartsVisible: {
        opacity: 1
    },
    chartWrapper: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        height: '60px'
    },
    chartBar: {
        width: '12px',
        background: 'linear-gradient(to top, #217346, #2d8f47)',
        borderRadius: '2px',
        transformOrigin: 'bottom',
        animation: 'chartGrow 1s ease-out forwards'
    },
    loadingContainer: {
        position: 'absolute',
        bottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        width: '350px',
        opacity: 0
    },
    loadingVisible: {
        opacity: 1,
        transition: 'opacity 0.8s ease-in-out'
    },
    loadingBar: {
        width: '100%',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
    },
    loadingProgress: {
        height: '100%',
        background: 'linear-gradient(90deg, #217346, #2d8f47, #ffffff, #2d8f47, #217346)',
        borderRadius: '3px',
        width: '0%',
        boxShadow: '0 0 10px rgba(33, 115, 70, 0.5)'
    },
    loadingAnimate: {
        animation: 'loadingProgress 3s ease-out forwards'
    },
    loadingText: {
        fontSize: '12px',
        color: '#999',
        letterSpacing: '1px',
        fontWeight: '300'
    },
    orbitContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        opacity: 0,
        transition: 'opacity 1s ease-in-out'
    },
    orbitActive: {
        opacity: 1
    },
    orbitElement: {
        position: 'absolute',
        width: '8px',
        height: '8px',
        background: 'rgba(33, 115, 70, 0.6)',
        borderRadius: '50%',
        top: '50%',
        left: '50%',
        marginTop: '-4px',
        marginLeft: '-4px'
    },
    orbit1: {
        animation: 'orbit 8s linear infinite'
    },
    orbit2: {
        animation: 'orbit2 12s linear infinite'
    },
    orbit3: {
        animation: 'orbit3 6s linear infinite'
    },
    fadeOut: {
        animation: 'fadeOut 1s ease-out forwards'
    }
};

export default SplashScreen;
