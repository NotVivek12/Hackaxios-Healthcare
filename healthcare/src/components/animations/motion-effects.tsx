"use client"
import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from '@/lib/framer-motion';

interface FadeInProps {
    children: React.ReactNode;
    direction?: 'up' | 'down' | 'left' | 'right';
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}

export const FadeIn: React.FC<FadeInProps> = ({
    children,
    direction = 'up',
    delay = 0,
    duration = 0.5,
    className = '',
    once = true,
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once });

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        } else if (!once) {
            controls.start('hidden');
        }
    }, [isInView, controls, once]);

    const directionOffset = {
        up: { y: 40 },
        down: { y: -40 },
        left: { x: 40 },
        right: { x: -40 },
    };

    const initial = { opacity: 0, ...directionOffset[direction] };

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={{
                hidden: initial,
                visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    transition: {
                        duration,
                        delay,
                        ease: [0.25, 0.1, 0.25, 1.0],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface ScaleInProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
    children,
    delay = 0,
    duration = 0.5,
    className = '',
    once = true,
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once });

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        } else if (!once) {
            controls.start('hidden');
        }
    }, [isInView, controls, once]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                        duration,
                        delay,
                        ease: [0.25, 0.1, 0.25, 1.0],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface StaggerContainerProps {
    children: React.ReactNode;
    delay?: number;
    staggerChildren?: number;
    className?: string;
    once?: boolean;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
    children,
    delay = 0,
    staggerChildren = 0.1,
    className = '',
    once = true,
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount: 0.2 });

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        } else if (!once) {
            controls.start('hidden');
        }
    }, [isInView, controls, once]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren,
                        delayChildren: delay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = '',
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        ease: [0.25, 0.1, 0.25, 1.0],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface FloatingElementProps {
    children: React.ReactNode;
    amplitude?: number;
    duration?: number;
    className?: string;
}

export const FloatingElement: React.FC<FloatingElementProps> = ({
    children,
    amplitude = 10,
    duration = 4,
    className = '',
}) => {
    return (
        <motion.div
            animate={{
                y: [0, -amplitude, 0, amplitude, 0],
            }}
            transition={{
                duration,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface PulseElementProps {
    children: React.ReactNode;
    scale?: number;
    duration?: number;
    className?: string;
}

export const PulseElement: React.FC<PulseElementProps> = ({
    children,
    scale = 1.05,
    duration = 2,
    className = '',
}) => {
    return (
        <motion.div
            animate={{
                scale: [1, scale, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

interface GlowingTextProps {
    children: React.ReactNode;
    className?: string;
}

export const SlideInFromBottom: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    duration = 0.5,
    className = '',
    once = true,
}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once });

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        } else if (!once) {
            controls.start('hidden');
        }
    }, [isInView, controls, once]);

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={{
                hidden: { opacity: 0, y: 60 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration,
                        delay,
                        ease: [0.25, 0.1, 0.25, 1.0],
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export const GlowingText: React.FC<GlowingTextProps> = ({ children, className = '' }) => {
    return (
        <motion.span
            className={`inline-block animate-gradient-text ${className}`}
            initial={{ opacity: 0.8 }}
            animate={{
                opacity: [0.8, 1, 0.8],
                textShadow: [
                    '0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)',
                    '0 0 15px rgba(59, 130, 246, 0.6), 0 0 25px rgba(59, 130, 246, 0.4)',
                    '0 0 5px rgba(59, 130, 246, 0.3), 0 0 10px rgba(59, 130, 246, 0.2)',
                ],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'loop',
                ease: 'easeInOut',
            }}
        >
            {children}
        </motion.span>
    );
};
