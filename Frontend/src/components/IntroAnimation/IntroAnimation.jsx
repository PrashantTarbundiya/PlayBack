import { useEffect, useState } from "react";
import PlayBackLogo from "../../assets/PlayBack.png";
import "./IntroAnimation.css";

const IntroAnimation = ({ onComplete }) => {
    // Sequence: "load" -> "eclipse" -> "flare" -> "illuminate" -> "exit" -> "done"
    const [stage, setStage] = useState("load");

    useEffect(() => {
        document.body.style.overflow = "hidden";

        // A highly sequenced, deliberate cinematic pacing
        const t1 = setTimeout(() => setStage("eclipse"), 500);     // The sharp rim-light begins sweeping
        const t2 = setTimeout(() => setStage("flare"), 3000);      // A beautiful optical lens flare hits the edge
        const t3 = setTimeout(() => setStage("illuminate"), 4000); // The logo fully lights up from within
        const t4 = setTimeout(() => setStage("exit"), 7000);       // Smooth fade/zoom into the main app (Extended time)
        const t5 = setTimeout(() => {
            setStage("done");
            document.body.style.overflow = "";
            onComplete?.();
        }, 8500); // Wait longer before completely removing component

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
            document.body.style.overflow = "";
        };
    }, [onComplete]);

    if (stage === "done") return null;

    return (
        <div className={`eclipse-intro-container ${stage}`}>

            {/* Ambient Background Glow */}
            <div className="eclipse-ambient-glow"></div>

            {/* ENHANCEMENT: Massive Deep-Space Starfield */}
            <div className="eclipse-starfield">
                {Array.from({ length: 150 }).map((_, i) => (
                    <div key={`star-${i}`} className="eclipse-star" style={{
                        '--sx': `${Math.random() * 100}vw`,
                        '--sy': `${Math.random() * 100}vh`,
                        '--ss': `${Math.random() * 2}px`,
                        '--sd': `${Math.random() * 5}s`,
                        '--so': `${0.1 + Math.random() * 0.5}`,
                        '--sc': Math.random() > 0.8 ? '#4ab4ff' : '#ffffff' // 20% chance of blue stars
                    }}></div>
                ))}
            </div>

            <div className="eclipse-center-stage">

                <div className="eclipse-logo-wrapper">

                    {/* Layer 1: the dark silhouette of the logo */}
                    <img className="eclipse-logo-silhouette" src={PlayBackLogo} alt="" />

                    {/* Layer 2: The sweeping primary rim-light mask (The Eclipse) */}
                    <div className="eclipse-light-sweep-container">
                        <img className="eclipse-logo-rimlight" src={PlayBackLogo} alt="" />
                    </div>

                    {/* Layer 3: The final fully illuminated logo */}
                    <img className="eclipse-logo-core" src={PlayBackLogo} alt="PlayBack" />

                    {/* ENHANCEMENT: Massive Anamorphic Light Rays from the core */}
                    <div className="eclipse-core-rays"></div>

                    {/* The optical lens flare that travels along the edge */}
                    <div className="eclipse-lens-flare"></div>

                </div>

                {/* Elegant, minimalist typography */}
                {/* ENHANCEMENT: Added a sophisticated tracking/blur animation to the text reveal */}
                <div className="eclipse-tagline-container">
                    <div className="eclipse-tagline">
                        {"YOUR STAGE · YOUR STORY".split("").map((char, index) => (
                            <span
                                key={index}
                                className={`eclipse-char ${char === '·' ? 'dot' : ''}`}
                                style={{ '--char-index': index }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        ))}
                    </div>
                </div>

            </div>

            {/* Subtle floating dust motes for premium cinematic depth */}
            <div className="eclipse-dust-particles">
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="eclipse-dust" style={{
                        '--dx': `${Math.random() * 100}vw`,
                        '--dy': `${Math.random() * 100}vh`,
                        '--dd': `${Math.random() * 2}s`,
                        '--ds': `${0.3 + Math.random() * 0.7}`
                    }}></div>
                ))}
            </div>

        </div>
    );
};

export default IntroAnimation;
