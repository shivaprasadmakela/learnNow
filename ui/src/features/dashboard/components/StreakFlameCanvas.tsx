import { useEffect, useRef, useId } from 'react';

interface StreakFlameCanvasProps {
    width?: number;
    height?: number;
    className?: string;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    alpha: number;
    life: number;
    maxLife: number;
}

const BASE_SIZE = 82; // the size the original magic numbers were tuned for

const drawFlamePath = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
    wobble1: number,
    wobble2: number,
    wobble3: number
) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + h * 0.45);

    ctx.bezierCurveTo(
        cx - w * 0.55, cy + h * 0.45,
        cx - w * 0.6 + wobble1, cy - h * 0.1,
        cx - w * 0.25 + wobble2, cy - h * 0.4
    );

    ctx.bezierCurveTo(
        cx - w * 0.15, cy - h * 0.55 + wobble3,
        cx - w * 0.05 + wobble1, cy - h * 0.65 + wobble2,
        cx, cy - h * 0.7 + wobble3
    );

    ctx.bezierCurveTo(
        cx + w * 0.2 + wobble2, cy - h * 0.5 + wobble1,
        cx + w * 0.65 + wobble3, cy - h * 0.05,
        cx + w * 0.55, cy + h * 0.45
    );

    ctx.bezierCurveTo(
        cx + w * 0.45, cy + h * 0.5,
        cx - w * 0.35, cy + h * 0.45,
        cx, cy + h * 0.45
    );

    ctx.closePath();
};

export function StreakFlameCanvas({
    width = 82,
    height = 82,
    className
}: StreakFlameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const reactId = useId();
    const canvasId = `streak-flame-canvas-${reactId}`;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale factor lets the flame's proportions stay correct at any size,
        // instead of only looking right at the original 82x82 the numbers were tuned for.
        const scale = Math.min(width, height) / BASE_SIZE;

        // DPR-aware backing store so the flame stays crisp on retina/high-DPI screens.
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        let animationFrameId: number;
        let lastTimestamp: number | null = null;
        let time = 0;

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let prefersReducedMotion = motionQuery.matches;
        const handleMotionChange = (e: MediaQueryListEvent) => {
            prefersReducedMotion = e.matches;
        };
        motionQuery.addEventListener('change', handleMotionChange);

        const particles: Particle[] = [];
        const maxParticles = 12;

        const createParticle = (): Particle => {
            const centerX = width / 2;
            const centerY = height * 0.75;
            return {
                x: centerX + (Math.random() - 0.5) * 20 * scale,
                y: centerY + (Math.random() - 0.5) * 10 * scale,
                size: (Math.random() * 2.5 + 1.2) * scale,
                speedY: Math.random() * 1.2 + 0.8,
                speedX: (Math.random() - 0.5) * 0.8,
                alpha: 1,
                life: 0,
                maxLife: Math.random() * 30 + 20
            };
        };

        const render = (timestamp: number) => {
            if (lastTimestamp === null) lastTimestamp = timestamp;
            // Normalize to a 60fps-equivalent step so speed is consistent across refresh rates.
            // Clamped to avoid a huge jump/teleport if the tab was backgrounded and rAF paused.
            const rawDeltaFrames = (timestamp - lastTimestamp) / (1000 / 60);
            const deltaFrames = Math.min(rawDeltaFrames, 4);
            lastTimestamp = timestamp;
            time += 0.06 * deltaFrames;

            ctx.clearRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2 + 4 * scale;

            const wobble1 = prefersReducedMotion ? 0 : Math.sin(time * 2.2) * 2.5 * scale;
            const wobble2 = prefersReducedMotion ? 0 : Math.cos(time * 3.1) * 2.0 * scale;
            const wobble3 = prefersReducedMotion ? 0 : Math.sin(time * 1.7) * 3.0 * scale;

            // Outer flame glow
            ctx.save();
            ctx.shadowColor = 'rgba(255, 100, 0, 0.6)';
            ctx.shadowBlur = 14 * scale;

            const outerGrad = ctx.createLinearGradient(cx, cy - height * 0.6, cx, cy + height * 0.4);
            outerGrad.addColorStop(0, '#FF4500');
            outerGrad.addColorStop(0.5, '#FF6A00');
            outerGrad.addColorStop(1, '#E63900');

            drawFlamePath(ctx, cx, cy, 34 * scale, 46 * scale, wobble1, wobble2, wobble3);
            ctx.fillStyle = outerGrad;
            ctx.fill();
            ctx.restore();

            // Inner core flame
            ctx.save();
            const innerGrad = ctx.createLinearGradient(cx, cy - height * 0.4, cx, cy + height * 0.3);
            innerGrad.addColorStop(0, '#FFF566');
            innerGrad.addColorStop(0.6, '#FFC700');
            innerGrad.addColorStop(1, '#FF9900');

            const innerWobble1 = prefersReducedMotion ? 0 : Math.sin(time * 3.5) * 1.5 * scale;
            const innerWobble2 = prefersReducedMotion ? 0 : Math.cos(time * 2.8) * 1.2 * scale;

            drawFlamePath(ctx, cx, cy + 4 * scale, 20 * scale, 28 * scale, innerWobble1, innerWobble2, -innerWobble1);
            ctx.fillStyle = innerGrad;
            ctx.fill();
            ctx.restore();

            // White inner glow highlight
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(
                cx - 1 * scale,
                cy + 8 * scale,
                5 * scale,
                (8 + (prefersReducedMotion ? 0 : Math.sin(time * 4))) * scale,
                0, 0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(255, 255, 240, 0.85)';
            ctx.fill();
            ctx.restore();

            // Floating spark embers
            if (!prefersReducedMotion) {
                if (particles.length < maxParticles && Math.random() < 0.3 * deltaFrames) {
                    particles.push(createParticle());
                }

                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.life += deltaFrames;
                    p.y -= p.speedY * scale * deltaFrames;
                    p.x += (p.speedX + Math.sin(p.life * 0.2) * 0.4) * scale * deltaFrames;
                    p.alpha = 1 - p.life / p.maxLife;

                    if (p.life >= p.maxLife || p.y < 0) {
                        particles.splice(i, 1);
                        continue;
                    }

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, Math.max(0.1, p.size * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 220, 100, ${p.alpha})`;
                    ctx.shadowColor = '#FF8800';
                    ctx.shadowBlur = 4 * scale;
                    ctx.fill();
                    ctx.restore();
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, [width, height]);

    return (
        <canvas
            ref={canvasRef}
            id={canvasId}
            className={className}
            width={width}
            height={height}
            role="presentation"
            aria-hidden="true"
            style={{ display: 'block', width, height }}
        />
    );
}

export default StreakFlameCanvas;