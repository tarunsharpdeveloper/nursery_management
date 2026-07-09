"use client";

import React, { useState, useEffect } from 'react';
 
export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isLaunching, setIsLaunching] = useState(false);
 
    const radius = 20;
    const circumference = 2 * Math.PI * radius; // Approx 125.66
 
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
           
            // Toggle visibility (only when not launching)
            if (!isLaunching) {
                if (scrollTop > 300) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            }
 
            // Compute progress percentage
            const progress = docHeight > 0 ? (scrollTop / docHeight) : 0;
            setScrollProgress(progress);
        };
 
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
 
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isLaunching]);
 
    const scrollToTop = () => {
        const startY = window.scrollY;
        if (startY === 0 || isLaunching) return;
 
        setIsLaunching(true);
        const duration = 850; // ms (matches the rocket animation duration)
        let startTime: number | null = null;
 
        const animateScroll = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
 
            // Quintic Ease-In: t^5 (starts very slow, then accelerates rapidly)
            const easeInQuint = progress * progress * progress * progress * progress;
 
            const nextY = startY * (1 - easeInQuint);
            window.scrollTo(0, nextY);
 
            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                // Done launching, reset state
                setIsLaunching(false);
                setIsVisible(false);
            }
        };
 
        requestAnimationFrame(animateScroll);
    };
 
    const strokeDashoffset = circumference - scrollProgress * circumference;
 
    return (
        <button
            onClick={scrollToTop}
            className={`scroll-to-top-btn ${isVisible ? 'visible' : ''} ${isLaunching ? 'launching' : ''}`}
            aria-label="Scroll to top"
        >
            <svg className="progress-ring" width="48" height="48">
                {/* Background track circle */}
                <circle
                    className="progress-ring-bg"
                    cx="24"
                    cy="24"
                    r={radius}
                />
                {/* Active progress border path */}
                <circle
                    className="progress-ring-bar"
                    cx="24"
                    cy="24"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            {/* Thin arrow icon */}
            <span className="scroll-icon">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            </span>
        </button>
    );
}
