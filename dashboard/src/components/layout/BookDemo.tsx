import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';

const PAGE_WIDTH = 6;
const PAGE_HEIGHT = 4.2;
const CORNER_RADIUS = 0.12;

interface SlideProps {
    texture: THREE.Texture;
    index: number;
    offset: number;
}

function Slide({ texture, index, offset }: SlideProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const positionRef = useRef(0);

    // Create rounded corner mask
    const roundedMask = useMemo(() => {
        const canvas = document.createElement('canvas');
        const size = 1024;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const r = (CORNER_RADIUS / PAGE_WIDTH) * size;
        
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, size, size);
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }, []);

    useFrame((_, delta) => {
        if (!meshRef.current) return;

        // Position based on continuous offset
        const targetX = index * PAGE_WIDTH - offset;

        const easing = 1 - Math.pow(1 - 0.12, delta * 60);
        positionRef.current += (targetX - positionRef.current) * easing;

        meshRef.current.position.x = positionRef.current;
    });

    const material = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            map: texture,
            alphaMap: roundedMask,
            transparent: true,
            side: THREE.DoubleSide,
        });
    }, [texture, roundedMask]);

    return (
        <mesh ref={meshRef} material={material}>
            <planeGeometry args={[PAGE_WIDTH, PAGE_HEIGHT]} />
        </mesh>
    );
}

interface SlideShowProps {
    offset: number;
    setTotalPages: (n: number) => void;
}

const SlideShow = ({ offset, setTotalPages }: SlideShowProps) => {
    // Load cover
    const coverTexture = useTexture('/book_cover.png');
    coverTexture.colorSpace = THREE.SRGBColorSpace;

    // Load all spread textures
    const spreadTextures = useTexture([
        '/book_spread_01.png',
        '/book_spread_02.png',
        '/book_spread_03.png',
        '/book_spread_04.png',
        '/book_spread_05.png',
        '/book_spread_06.png',
        '/book_spread_07.png',
        '/book_spread_08.png',
        '/book_spread_09.png',
        '/book_spread_10.png',
    ]);
    
    spreadTextures.forEach(tex => {
        tex.colorSpace = THREE.SRGBColorSpace;
    });

    // Load last page
    const lastTexture = useTexture('/book_last.png');
    lastTexture.colorSpace = THREE.SRGBColorSpace;

    // All textures in order
    const allTextures = useMemo(() => {
        return [coverTexture, ...spreadTextures, lastTexture];
    }, [coverTexture, spreadTextures, lastTexture]);

    useEffect(() => {
        setTotalPages(allTextures.length - 1);
    }, [allTextures.length, setTotalPages]);

    return (
        <group>
            {allTextures.map((texture, index) => (
                <Slide
                    key={index}
                    texture={texture}
                    index={index}
                    offset={offset}
                />
            ))}
        </group>
    );
};

export default function BookDemo({ onBack }: { onBack: () => void }) {
    const [totalPages, setTotalPages] = useState(0);
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, offset: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const currentPage = Math.round(offset / PAGE_WIDTH);

    // Clamp offset to valid range
    const clampOffset = (value: number) => {
        const maxOffset = totalPages * PAGE_WIDTH;
        return Math.max(0, Math.min(maxOffset, value));
    };

    // Snap to nearest page
    const snapToPage = () => {
        const nearestPage = Math.round(offset / PAGE_WIDTH);
        setOffset(clampOffset(nearestPage * PAGE_WIDTH));
    };

    // Mouse/Touch handlers
    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        dragStartRef.current = { x: clientX, offset };
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        const deltaX = dragStartRef.current.x - clientX;
        const sensitivity = 0.015; // Adjust drag sensitivity
        const newOffset = dragStartRef.current.offset + deltaX * sensitivity;
        setOffset(clampOffset(newOffset));
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        snapToPage();
    };

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        handleDragMove(e.clientX);
    };

    const handleMouseUp = () => {
        handleDragEnd();
    };

    const handleMouseLeave = () => {
        if (isDragging) handleDragEnd();
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        handleDragMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        handleDragEnd();
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setOffset(prev => clampOffset(prev + PAGE_WIDTH));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setOffset(prev => clampOffset(prev - PAGE_WIDTH));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalPages]);

    // Wheel scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const sensitivity = 0.01;
            setOffset(prev => clampOffset(prev + e.deltaX * sensitivity + e.deltaY * sensitivity));
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [totalPages]);

    return (
        <div 
            ref={containerRef}
            className="w-full h-screen relative overflow-hidden font-sans select-none"
            style={{ 
                background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e8f4fc 100%)',
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[30%] -left-[15%] w-[60%] h-[60%] bg-sky-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute top-[50%] -right-[15%] w-[50%] h-[70%] bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                <div className="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] bg-indigo-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
            </div>

            <button
                onClick={onBack}
                onMouseDown={e => e.stopPropagation()}
                className="absolute top-8 left-8 z-50 text-sky-700 hover:text-sky-900 transition-all duration-300 flex items-center gap-2 font-medium bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md hover:bg-white/80"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
            </button>

            {/* Page indicator */}
            <div 
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-white/80 backdrop-blur-lg px-6 py-3 rounded-full shadow-lg border border-white/50 transition-all duration-300"
                onMouseDown={e => e.stopPropagation()}
            >
                {new Array(totalPages + 1).fill(0).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setOffset(i * PAGE_WIDTH)}
                        className={`
                            rounded-full transition-all duration-300 
                            ${i === currentPage
                                ? 'w-3 h-3 bg-gradient-to-r from-sky-500 to-blue-600 shadow-md'
                                : 'w-2 h-2 bg-sky-300/70 hover:bg-sky-400 hover:scale-125'
                            }
                        `}
                    />
                ))}
            </div>

            <Canvas camera={{ position: [0, 0, 8], fov: 35 }} gl={{ toneMapping: THREE.NoToneMapping }}>
                <ambientLight intensity={1.0} color="#ffffff" />

                <Float
                    rotationIntensity={0.05}
                    floatIntensity={0.1}
                    speed={1.5}
                    floatingRange={[-0.015, 0.015]}
                >
                    <React.Suspense fallback={null}>
                        <SlideShow offset={offset} setTotalPages={setTotalPages} />
                    </React.Suspense>
                </Float>
            </Canvas>
        </div>
    );
}
