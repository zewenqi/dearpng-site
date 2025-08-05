import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, PresentationControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Color palette - 28 colors organized by category
const COLORS = [
    // Green series
    { name: 'Lime', hex: '#32CD32' },
    { name: 'Shamrock', hex: '#009E60' },
    { name: 'Green', hex: '#008000' },

    // Blue-green series
    { name: 'Jade', hex: '#00A86B' },
    { name: 'Teal', hex: '#008080' },

    // Blue series
    { name: 'Light Blue', hex: '#87CEEB' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Navy', hex: '#000080' },

    // Purple series
    { name: 'Purple', hex: '#800080' },
    { name: 'Lilac', hex: '#C8A2C8' },

    // Dark series
    { name: 'Burgundy', hex: '#800020' },

    // Red series
    { name: 'Red', hex: '#FF0000' },
    { name: 'Fire Red', hex: '#DC143C' },

    // Pink series
    { name: 'Rose', hex: '#FF66CC' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Bubblegum', hex: '#FF69B4' },

    // Orange series
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Dark Orange', hex: '#FF8C00' },
    { name: 'Orange', hex: '#FFA500' },

    // Yellow series
    { name: 'Yellow', hex: '#FFFF00' },

    // Neutral series
    { name: 'Black', hex: '#000000' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Bronze', hex: '#CD7F32' },
    { name: 'Gold Rush', hex: '#D4AF37' },
    { name: 'Tooth Color', hex: '#F5F5DC' },
    { name: 'Pearl', hex: '#F8F6F0' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Silver', hex: '#C0C0C0' }
];

// Braces mesh names
const BRACES_MESHES = [
    ...Array.from({ length: 16 }, (_, i) => `BezierCircle005_Material005_${String(i + 1).padStart(4, '0')}`),
    ...Array.from({ length: 16 }, (_, i) => `BezierCircle006_Material005_${String(i + 1).padStart(4, '0')}`)
];

// 3D Model Component
function BracesModel({ selectedColor, colorMode, onMeshClick }) {
    const { scene } = useGLTF('/bracescolorstooth.glb');
    const [meshColors, setMeshColors] = useState({});
    const { camera, gl } = useThree();
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());

    // Handle mesh click
    const handleMeshClick = (meshName) => {
        if (colorMode === 'single' && selectedColor) {
            setMeshColors(prev => ({
                ...prev,
                [meshName]: selectedColor
            }));
        }
    };

    // Apply colors to meshes
    React.useEffect(() => {
        if (colorMode === 'all' && selectedColor) {
            const newColors = {};
            BRACES_MESHES.forEach(meshName => {
                newColors[meshName] = selectedColor;
            });
            setMeshColors(newColors);
        }
    }, [selectedColor, colorMode]);

    // Handle click events
    const handleCanvasClick = (event) => {
        if (colorMode !== 'single') return;

        // Calculate mouse position in normalized device coordinates
        const rect = gl.domElement.getBoundingClientRect();
        mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.current.setFromCamera(mouse.current, camera);

        // Calculate objects intersecting the picking ray
        const intersects = raycaster.current.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            if (BRACES_MESHES.includes(clickedObject.name)) {
                handleMeshClick(clickedObject.name);
            }
        }
    };

    // Add click event listener
    React.useEffect(() => {
        gl.domElement.addEventListener('click', handleCanvasClick);
        return () => {
            gl.domElement.removeEventListener('click', handleCanvasClick);
        };
    }, [colorMode, selectedColor, gl.domElement, camera, scene]);

    // Update mesh materials
    React.useEffect(() => {
        scene.traverse((child) => {
            if (child.isMesh && BRACES_MESHES.includes(child.name)) {
                const color = meshColors[child.name] || '#0000FF'; // Default blue

                child.material = new THREE.MeshStandardMaterial({
                    color: color,
                    metalness: 0.8,
                    roughness: 0.2,
                    envMapIntensity: 1.5,
                });
            } else if (child.isMesh) {
                // Enhance other mesh materials for better HDRI reflection
                if (child.material) {
                    child.material.envMapIntensity = child.material.envMapIntensity || 1.0;
                    if (child.material.metalness !== undefined) {
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
    }, [meshColors, scene]);

    return (
        <primitive
            object={scene}
            scale={0.8}
            position={[0, 0.3, 0]}
            rotation={[-0.3, 0, 0]}
        />
    );
}

// Main Component
export default function BracesColorPicker() {
    const [selectedColor, setSelectedColor] = useState('#0000FF'); // Default to blue
    const [colorMode, setColorMode] = useState('all'); // 'all' or 'single'
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="w-full">
            {/* 3D Model Viewer - Now on Top */}
            <div className="relative model-viewer-dark rounded-xl p-4 mb-1 canvas-container" style={{ height: '420px' }}>
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white rounded-lg shadow-md p-2">
                        <p className="text-sm text-gray-600 mb-2">Color Mode:</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setColorMode('all')}
                                className={`px-3 py-1 text-sm rounded transition-colors ${colorMode === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setColorMode('single')}
                                className={`px-3 py-1 text-sm rounded transition-colors ${colorMode === 'single'
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Single
                            </button>
                        </div>
                    </div>
                </div>

                <Canvas
                    camera={{ position: [0, 1, 5], fov: 45 }}
                    onCreated={() => setIsLoading(false)}
                >
                    {/* Environment HDR Lighting */}
                    <Environment
                        files={isMobile ? '/studio_1k.hdr' : '/studio_2k.hdr'}
                        background={false}
                    />

                    {/* Additional lighting for better visibility */}
                    <ambientLight intensity={0.2} />
                    <directionalLight
                        position={[5, 5, 5]}
                        intensity={0.8}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                    <directionalLight
                        position={[-5, -5, -5]}
                        intensity={0.3}
                    />

                    <Suspense fallback={null}>
                        <BracesModel
                            selectedColor={selectedColor}
                            colorMode={colorMode}
                        />
                    </Suspense>

                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        minDistance={3}
                        maxDistance={6}
                        autoRotate={false}
                        enableDamping={true}
                        dampingFactor={0.05}
                    />
                </Canvas>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center model-viewer-dark rounded-xl">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-white">Loading 3D model...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Color Selection Panel - Now Below */}
            <div className="bg-white rounded-xl p-4 shadow-lg">
                <h2 className="text-xl font-bold mb-1">Choose Your Color</h2>
                <p className="text-gray-600 mb-4">
                    {colorMode === 'all'
                        ? 'Select a color to apply to all braces'
                        : 'Select a color, then click on individual braces to change their color'
                    }
                </p>

                {/* Loading Indicator for Model */}
                {isLoading && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-700">Loading 3D model... (4MB)</span>
                        </div>
                    </div>
                )}

                {/* Color grid with 28 colors - consistent height cards */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
                    {COLORS.map((color) => (
                        <div
                            key={color.name}
                            onClick={() => setSelectedColor(color.hex)}
                            className={`color-card text-center cursor-pointer p-1.5 h-16 flex flex-col justify-between ${selectedColor === color.hex ? 'active' : ''
                                }`}
                        >
                            <div
                                className="w-full h-6 rounded-md border border-gray-200 flex-shrink-0"
                                style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-xs font-medium text-gray-700 leading-tight mt-1 overflow-hidden" style={{ fontSize: '10px', lineHeight: '1.1' }}>
                                {color.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="p-3 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-1">How to use:</h3>
                    <ol className="text-sm text-blue-800 space-y-0.5">
                        <li>1. Choose a color mode (All or Single)</li>
                        <li>2. Select a color from the palette below</li>
                        <li>3. The selected color will be applied to all braces or just one, depending on the mode you choose</li>
                        <li>4. Rotate the model by dragging to see all angles</li>
                        <li>5. Use mouse wheel or pinch to zoom in/out</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}