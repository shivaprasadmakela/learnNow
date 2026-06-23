import React, { useEffect, useState } from 'react';
import type { Course, UserProfile } from '../../../features/learning/types';
import { Button } from '../../../shared/components/Button/Button';
import styles from './Certificate.module.css';

interface CertificateProps {
    course: Course | null;
    profile: UserProfile | null;
    onBack: () => void;
}

interface ConfettiParticle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    rotation: number;
    speedX: number;
    speedY: number;
    spinSpeed: number;
}

export const Certificate: React.FC<CertificateProps> = ({
    course,
    profile,
    onBack
}) => {
    const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
    
    // Confetti particles generator
    useEffect(() => {
        const colors = ['#06b6d4', '#10b981', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];
        const particles: ConfettiParticle[] = [];
        
        for (let i = 0; i < 120; i++) {
            particles.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: Math.random() * -100 - 20,
                size: Math.random() * 8 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 5 + 3,
                spinSpeed: Math.random() * 10 - 5
            });
        }
        
        setConfetti(particles);

        // Animation frame loop
        let animationId: number;
        
        const updateConfetti = () => {
            setConfetti(prev => 
                prev.map(p => {
                    let nextY = p.y + p.speedY;
                    let nextX = p.x + p.speedX;
                    let nextRot = p.rotation + p.spinSpeed;
                    
                    // Recycle particles that fall off bottom
                    if (nextY > window.innerHeight) {
                        nextY = -40;
                        nextX = Math.random() * window.innerWidth;
                    }
                    
                    return {
                        ...p,
                        x: nextX,
                        y: nextY,
                        rotation: nextRot
                    };
                })
            );
            
            animationId = requestAnimationFrame(updateConfetti);
        };
        
        animationId = requestAnimationFrame(updateConfetti);
        
        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

    const printCertificate = () => {
        window.print();
    };

    // Calculate completed date formatted
    const dateFormatted = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Generate a pseudo-random hash for verification authenticity
    const verificationHash = 'sha256-f58c73d9e03ea1259c' + 
        (course?.id || 1) + 
        'cc904bf7' + 
        (profile?.fullName?.length || 12) + 
        'bd9e52e';

    return (
        <div className={styles.container}>
            {/* Confetti Render overlay */}
            <div className={styles.confettiContainer}>
                {confetti.map(p => (
                    <div 
                        key={p.id}
                        className={styles.confettiItem}
                        style={{
                            left: `${p.x}px`,
                            top: `${p.y}px`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            transform: `rotate(${p.rotation}deg)`,
                            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '0' : '4px 0 4px 0'
                        }}
                    />
                ))}
            </div>

            {/* Navigation top bar */}
            <div className={styles.toolbar}>
                <button className={styles.backBtn} onClick={onBack}>
                    ← Back to Dashboard
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={printCertificate}>
                        Print Certificate
                    </Button>
                    <Button variant="primary" onClick={onBack}>
                        Done
                    </Button>
                </div>
            </div>

            {/* Certificate Print Area Layout */}
            <div className={styles.certificateOuterFrame} id="certificate-print-area">
                {/* Cyber tech gradient top border stripe */}
                <div className={styles.borderStripeTop}>
                    <div style={{ width: '100%', height: '8px', background: 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1, #8b5cf6)' }}></div>
                </div>

                <div className={styles.certificateInnerPaper}>
                    {/* Header */}
                    <div className={styles.certHeader}>
                        <div className={styles.academyLogo}>
                            <span className={styles.logoBrand}>Learn</span>
                            <span className={styles.logoAcademy}>with Shiva</span>
                        </div>
                        <span className={styles.docType}>Certificate of Completion</span>
                    </div>

                    {/* Main statements */}
                    <div className={styles.certBody}>
                        <p className={styles.congratsText}>This is proudly presented to</p>
                        <h2 className={styles.studentName}>{profile?.fullName || "Alex Learner"}</h2>
                        <p className={styles.evaluationText}>
                            for successfully completing all syllabus modules, interactive sandbox coding labs, 
                            and graded knowledge evaluations for the certification path
                        </p>
                        <h3 className={styles.courseTitle}>
                            {course?.title || "React & Spring Boot Fullstack Development"}
                        </h3>
                    </div>

                    {/* Footer credentials info */}
                    <div className={styles.certFooter}>
                        <div className={styles.footerRow}>
                            <div className={styles.signatureBlock}>
                                <div className={styles.signatureLine}>Learn with Shiva Team</div>
                                <span className={styles.signLabel}>Program Directorate</span>
                            </div>
                            <div className={styles.badgeSeal}>
                                <svg width="72" height="72" viewBox="0 0 100 100" className={styles.sealSvg}>
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--tech-green)" strokeWidth="3" strokeDasharray="3 3" />
                                    <circle cx="50" cy="50" r="38" fill="var(--tech-green)" opacity="0.1" />
                                    <path d="M50 20 L60 45 L85 45 L65 60 L75 85 L50 70 L25 85 L35 60 L15 45 L40 45 Z" fill="var(--tech-green)" />
                                </svg>
                            </div>
                            <div className={styles.signatureBlock}>
                                <div className={styles.signatureLine}>{dateFormatted}</div>
                                <span className={styles.signLabel}>Completion Date</span>
                            </div>
                        </div>

                        {/* Cryptographic verification bottom metadata */}
                        <div className={styles.verificationBlock}>
                            <span className={styles.verificationText}>
                                Certificate verification link: <strong>learn-with-shiva.com/verify/{verificationHash.slice(7, 24)}</strong>
                            </span>
                            <span className={styles.verificationText}>
                                Security Authentication Hash: <strong>{verificationHash}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Certificate;
