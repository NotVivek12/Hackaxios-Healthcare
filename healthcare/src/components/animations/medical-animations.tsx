"use client"

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/framer-motion';

interface MedicalAnimationProps {
    className?: string;
    size?: number;
    color?: string;
}

interface MedicalAnimationsProps {
    activePanel: 'video' | 'notes' | 'vitals' | 'tools';
}

export const MedicalAnimations: React.FC<MedicalAnimationsProps> = ({ activePanel }) => {
    const FloatingParticle = ({ delay = 0, x = 0, y = 0, size = 4 }) => (
        <motion.div
            className="absolute bg-blue-300 rounded-full opacity-20"
            style={{ width: size, height: size }}
            initial={{ x, y, opacity: 0 }}
            animate={{
                x: [x, x + 20, x - 10, x],
                y: [y, y - 30, y + 10, y],
                opacity: [0, 0.3, 0.1, 0],
            }}
            transition={{
                duration: 4,
                delay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
        />
    );

    const PulseRing = ({ size = 40, delay = 0 }) => (
        <motion.div
            className="absolute border-2 border-green-400 rounded-full opacity-30"
            style={{ width: size, height: size }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: [0, 1.5, 2],
                opacity: [0, 0.5, 0],
            }}
            transition={{
                duration: 3,
                delay,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeOut',
            }}
        />
    );

    const HeartbeatLine = () => (
        <motion.svg
            className="absolute opacity-10"
            width="200"
            height="60"
            viewBox="0 0 200 60"
        >
            <motion.path
                d="M0,30 L40,30 L50,10 L60,50 L70,20 L80,40 L90,30 L200,30"
                stroke="red"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                    ease: 'easeInOut',
                }}
            />
        </motion.svg>
    );

    const renderAnimationsByPanel = () => {
        switch (activePanel) {
            case 'video':
                return (
                    <>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <FloatingParticle
                                key={i}
                                delay={i * 0.5}
                                x={Math.random() * 200}
                                y={Math.random() * 200}
                                size={Math.random() * 6 + 2}
                            />
                        ))}
                        <div className="absolute top-1/4 left-1/4">
                            <PulseRing size={60} delay={0} />
                            <PulseRing size={80} delay={1} />
                        </div>
                    </>
                );
            case 'vitals':
                return (
                    <>
                        <div className="absolute top-1/3 left-10">
                            <HeartbeatLine />
                        </div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <PulseRing size={100} delay={0} />
                            <PulseRing size={120} delay={0.5} />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {renderAnimationsByPanel()}
        </div>
    );
};

interface MedicalAnimationProps {
    className?: string;
    size?: number;
    color?: string;
}

export const HeartbeatAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 50,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const lineElement = svgRef.current.querySelector('#heartbeat-line');

        // Create animation
        const timeline = gsap.timeline({
            repeat: -1,
            repeatDelay: 0.7,
        });

        timeline.fromTo(
            lineElement,
            { strokeDashoffset: 500 },
            {
                strokeDashoffset: 0,
                duration: 1.5,
                ease: "power2.out"
            }
        );

        return () => {
            timeline.kill();
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size / 2}
            viewBox="0 0 200 100"
            className={`overflow-visible ${className}`}
        >
            <path
                id="heartbeat-line"
                d="M0,50 L30,50 L45,20 L60,80 L75,35 L90,65 L105,50 L120,50 L140,10 L160,90 L180,50 L200,50"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeDasharray="500"
                strokeDashoffset="500"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const DNAAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 100,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const dots1 = svgRef.current.querySelectorAll('.dna-dot-1');
        const dots2 = svgRef.current.querySelectorAll('.dna-dot-2');
        const lines = svgRef.current.querySelectorAll('.dna-line');

        // Create animations
        gsap.to(dots1, {
            y: (i) => (i % 2 === 0 ? "+=10" : "-=10"),
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

        gsap.to(dots2, {
            y: (i) => (i % 2 === 0 ? "-=10" : "+=10"),
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

        gsap.to(lines, {
            attr: { x2: (i) => (i % 2 === 0 ? "+=5" : "-=5") },
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: 0.1
        });

    }, []);

    // Generate DNA structure
    const numRung = 8;
    const elements = [];

    for (let i = 0; i < numRung; i++) {
        const y = 10 + i * (size - 20) / (numRung - 1);
        const offsetX = Math.sin((i / (numRung - 1)) * Math.PI) * 10;

        // Left dot
        elements.push(
            <circle
                key={`dot1-${i}`}
                className="dna-dot-1"
                cx={size / 4 - offsetX}
                cy={y}
                r="4"
                fill={color}
                opacity="0.8"
            />
        );

        // Right dot
        elements.push(
            <circle
                key={`dot2-${i}`}
                className="dna-dot-2"
                cx={3 * size / 4 + offsetX}
                cy={y}
                r="4"
                fill={color}
                opacity="0.8"
            />
        );

        // Connecting line
        elements.push(
            <line
                key={`line-${i}`}
                className="dna-line"
                x1={size / 4 - offsetX + 4}
                y1={y}
                x2={3 * size / 4 + offsetX - 4}
                y2={y}
                stroke={color}
                opacity="0.6"
                strokeWidth="2"
            />
        );
    }

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            {elements}
        </svg>
    );
};

export const PulseRingsAnimation: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 100,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const rings = svgRef.current.querySelectorAll('.pulse-ring');

        rings.forEach((ring, i) => {
            gsap.set(ring, {
                attr: { r: 0 },
                opacity: 0.8
            });

            gsap.to(ring, {
                attr: { r: size / 2 },
                opacity: 0,
                duration: 2,
                repeat: -1,
                delay: i * 0.6,
                ease: "power2.out"
            });
        });

    }, [size]);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 10}
                fill={color}
                opacity="0.8"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
            <circle
                className="pulse-ring"
                cx={size / 2}
                cy={size / 2}
                r="0"
                fill="none"
                stroke={color}
                strokeWidth="2"
            />
        </svg>
    );
};

export const LoadingSpinner: React.FC<MedicalAnimationProps> = ({
    className = '',
    size = 40,
    color = '#3b82f6'
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const dots = svgRef.current.querySelectorAll('.spinner-dot');

        gsap.to(dots, {
            scale: 0.5,
            opacity: 0.3,
            stagger: {
                each: 0.1,
                repeat: -1,
                yoyo: true
            },
            duration: 0.3
        });

    }, []);

    // Generate dots
    const numDots = 8;
    const radius = size / 2 - 5;
    const dots = [];

    for (let i = 0; i < numDots; i++) {
        const angle = (i / numDots) * Math.PI * 2;
        const x = size / 2 + radius * Math.cos(angle);
        const y = size / 2 + radius * Math.sin(angle);

        dots.push(
            <circle
                key={`dot-${i}`}
                className="spinner-dot"
                cx={x}
                cy={y}
                r="4"
                fill={color}
            />
        );
    }

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={className}
        >
            {dots}
        </svg>
    );
};

interface MedicalIconProps {
    className?: string;
    size?: number;
    color?: string;
    animate?: boolean;
}

export const StethoscopeIcon: React.FC<MedicalIconProps> = ({
    className = '',
    size = 40,
    color = '#3b82f6',
    animate = true
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!animate || !svgRef.current) return;

        const headpiece = svgRef.current.querySelector('#stethoscope-head');
        const tube = svgRef.current.querySelector('#stethoscope-tube');

        gsap.to(headpiece, {
            rotate: 5,
            transformOrigin: 'center',
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        gsap.to(tube, {
            attr: { d: 'M25,45 C35,55 45,35 65,40' },
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

    }, [animate]);

    return (
        <svg
            ref={svgRef}
            width={size}
            height={size}
            viewBox="0 0 80 80"
            className={className}
        >
            <circle
                id="stethoscope-head"
                cx="65"
                cy="50"
                r="10"
                fill={color}
                opacity="0.9"
            />
            <path
                id="stethoscope-tube"
                d="M25,45 C35,45 45,35 65,40"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M15,25 L35,25 C40,25 45,30 45,35 L45,45"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M15,5 L15,25"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M35,5 L35,25"
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
            />
        </svg>
    );
};
