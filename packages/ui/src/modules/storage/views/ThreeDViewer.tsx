import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Bounds, Center, useBounds, Edges } from '@react-three/drei';
import { Loader2, Cuboid, Grid3x3, BoxSelect, MousePointer2, Move, ZoomIn, Maximize, Minimize, ListTree, ChevronRight, ChevronDown, Eye, EyeOff, Sun, Lightbulb } from 'lucide-react';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
// @ts-ignore
// @ts-ignore
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import occtimportjs from 'occt-import-js';
// @ts-ignore
import wasmUrl from 'occt-import-js/dist/occt-import-js.wasm?url';
import { DxfViewer as NativeDxfViewer } from 'dxf-viewer';

export interface ThreeDViewerProps {
    isOpen: boolean;
    url: string;
    fileName?: string;
    onClose: () => void;
    inline?: boolean;
}

function useModelGeometry(url: string, extension: string) {
    const [geometry, setGeometry] = useState<THREE.BufferGeometry | THREE.Group | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        setGeometry(null);

        const load = async () => {
            try {
                // Determine format
                const ext = extension.toLowerCase();

                if (ext === 'stl') {
                    const loader = new STLLoader();
                    const geo = await loader.loadAsync(url);
                    if (!active) return;
                    geo.computeVertexNormals();
                    geo.computeBoundingBox();
                    geo.computeBoundingSphere();
                    if (active) setGeometry(geo);
                } else if (ext === 'obj') {
                    const loader = new OBJLoader();
                    const obj = await loader.loadAsync(url);
                    if (!active) return;
                    obj.traverse((child: any) => {
                        if (child.isMesh && child.geometry) {
                            child.geometry.computeVertexNormals();
                            child.geometry.computeBoundingBox();
                            child.geometry.computeBoundingSphere();
                        }
                    });
                    if (active) setGeometry(obj);
                } else if (ext === 'step' || ext === 'stp') {
                    // OpenCASCADE WASM parser for parametric boundary files
                    const response = await fetch(url, { signal: controller.signal });
                    const fileBuffer = await response.arrayBuffer();
                    if (!active) return;

                    const occt = await occtimportjs({
                        locateFile: () => wasmUrl
                    });

                    const result = occt.ReadStepFile(new Uint8Array(fileBuffer), null);

                    if (result && result.meshes) {
                        const group = new THREE.Group();
                        for (let resultMesh of result.meshes) {
                            const geometry = new THREE.BufferGeometry();
                            geometry.setAttribute('position', new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3));
                            if (resultMesh.attributes.normal) {
                                geometry.setAttribute('normal', new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3));
                            }
                            const index = Uint16Array.from(resultMesh.index.array);
                            geometry.setIndex(new THREE.BufferAttribute(index, 1));

                            geometry.computeBoundingBox();
                            geometry.computeBoundingSphere();

                            const matColor = resultMesh.color ? new THREE.Color(resultMesh.color[0], resultMesh.color[1], resultMesh.color[2]) : new THREE.Color('#cccccc');
                            group.add(new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
                                color: matColor
                            })));
                        }
                        if (active) setGeometry(group);
                    } else {
                        throw new Error("Empty step file / WASM conversion failed");
                    }
                } else {
                    if (active) setError(`Unsupported 3D format: ${ext}`);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("3D Load Error:", err);
                if (active) setError(err.message);
            } finally {
                if (active) setIsLoading(false);
            }
        };
        load();
        return () => {
            active = false;
            controller.abort();
        };
    }, [url, extension]);

    return { geometry, error, isLoading };
}

// -- Dynamic Headlight ------------------------------------
const Headlight: React.FC<{ enabled: boolean }> = ({ enabled }) => {
    const lightRef = useRef<THREE.SpotLight>(null);
    const { camera } = useThree();

    useFrame(() => {
        if (lightRef.current && enabled) {
            lightRef.current.position.copy(camera.position);
        }
    });

    if (!enabled) return null;

    return <spotLight ref={lightRef} intensity={2} angle={Math.PI / 4} penumbra={0.5} decay={1} distance={1000} castShadow />;
};

// -- Model Renderer ---------------------------------------
const ModelRenderer: React.FC<{ geometry: THREE.BufferGeometry | THREE.Group | null; error: string | null; renderMode: 'solid' | 'wireframe' | 'edges'; hiddenNodes: Set<string> }> = ({ geometry, error, renderMode, hiddenNodes }) => {
    const bounds = useBounds();
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
        if (geometry) {
            const timer = setTimeout(() => {
                bounds.refresh().clip().fit();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [geometry, bounds]);

    useEffect(() => {
        if (!geometry || !groupRef.current) return;

        // Clean up previously spawned edges
        const childrenToRemove: THREE.Object3D[] = [];
        groupRef.current.traverse((child) => {
            if (child.userData.isEdgeOverlay) {
                childrenToRemove.push(child);
            }
        });
        childrenToRemove.forEach(edgeObj => {
            if (edgeObj.parent) edgeObj.parent.remove(edgeObj);
        });

        // Apply materials and spawn new edges
        const rootObj = geometry instanceof THREE.BufferGeometry ? groupRef.current : geometry;

        rootObj.traverse((child: any) => {
            // Apply visibility from tree mapping
            if (hiddenNodes.has(child.uuid)) {
                child.visible = false;
            } else {
                child.visible = true;
            }

            if (child.isMesh && child.material) {
                child.material.wireframe = (renderMode === 'wireframe');
                child.material.needsUpdate = true;

                if (renderMode === 'edges') {
                    const edgesGeo = new THREE.EdgesGeometry(child.geometry, 30);
                    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
                    const edgeLines = new THREE.LineSegments(edgesGeo, edgesMaterial);
                    edgeLines.userData.isEdgeOverlay = true;
                    // match transform
                    edgeLines.position.copy(child.position);
                    edgeLines.rotation.copy(child.rotation);
                    edgeLines.scale.copy(child.scale);

                    if (child.parent) {
                        child.parent.add(edgeLines);
                    } else {
                        rootObj.add(edgeLines);
                    }
                }
            }
        });
    }, [geometry, renderMode]);

    if (error) {
        return (
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#ef4444" wireframe />
            </mesh>
        );
    }

    if (!geometry) {
        return null;
    }

    return (
        <group
            ref={groupRef}
            dispose={null}
            onPointerMissed={(e) => {
                if (e.button === 0) {
                    bounds.refresh().clip().fit();
                }
            }}
            onDoubleClick={(e) => {
                e.stopPropagation();
                // If they click on an edge overlay, zoom to its parent mesh instead
                const target = e.object.userData.isEdgeOverlay && e.object.parent ? e.object.parent : e.object;
                bounds.refresh(target).clip().fit();
            }}
        >
            {geometry instanceof THREE.BufferGeometry ? (
                <mesh geometry={geometry}>
                    <meshStandardMaterial
                        color="#888888"
                        roughness={0.5}
                        metalness={0.5}
                    />
                </mesh>
            ) : (
                <primitive object={geometry} />
            )}
        </group>
    );
};

// -- Model Tree ---------------------------------------
const ModelTreeNode: React.FC<{ node: THREE.Object3D; depth: number; hiddenNodes: Set<string>; toggleNode: (uuid: string) => void }> = ({ node, depth, hiddenNodes, toggleNode }) => {
    const [expanded, setExpanded] = useState(depth < 2);
    const isHidden = hiddenNodes.has(node.uuid);
    const hasChildren = node.children && node.children.length > 0 && !node.children.every(c => c.userData.isEdgeOverlay);

    if (node.userData.isEdgeOverlay) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>
            <div style={{
                display: 'flex', alignItems: 'center', padding: '4px 8px',
                paddingLeft: `${depth * 12 + 8}px`,
                background: 'var(--background)',
                borderBottom: '1px solid var(--border)',
                userSelect: 'none'
            }}>
                <div
                    onClick={() => setExpanded(!expanded)}
                    style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: hasChildren ? 'pointer' : 'default', opacity: hasChildren ? 1 : 0, marginRight: 4 }}
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: isHidden ? 0.5 : 1 }}>
                    {node.name || node.type}
                </div>
                <div
                    onClick={() => toggleNode(node.uuid)}
                    style={{ cursor: 'pointer', padding: 2, opacity: isHidden ? 0.5 : 1 }}
                >
                    {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </div>
            </div>
            {expanded && hasChildren && node.children.map(child => (
                <ModelTreeNode key={child.uuid} node={child} depth={depth + 1} hiddenNodes={hiddenNodes} toggleNode={toggleNode} />
            ))}
        </div>
    );
};

// -- DXF Native Layer ---------------------------------------
const DxfNativeLayer: React.FC<{ url: string }> = ({ url }) => {
    const dxfRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let viewer: NativeDxfViewer | null = null;
        let active = true;
        setIsLoading(true);

        if (dxfRef.current) {
            // Check if the HTML element has the 'dark' class applied
            const isDark = document.documentElement.classList.contains('dark');
            const clearColor = new THREE.Color(isDark ? '#020817' : '#ffffff');

            viewer = new NativeDxfViewer(dxfRef.current, {
                clearColor,
                clearAlpha: 0,
                canvasAlpha: true,
                autoResize: true,
                colorCorrection: true
            });
            viewer.Load({ url }).then(() => {
                if (active) setIsLoading(false);
            }).catch(e => {
                console.error("DXF Load Error", e);
                if (active) setIsLoading(false);
            });
        }

        const resizeObserver = new ResizeObserver(() => {
            if (viewer) {
                // @ts-ignore
                if (typeof viewer.Resize === 'function') viewer.Resize();
            }
        });

        if (dxfRef.current) {
            resizeObserver.observe(dxfRef.current);
        }

        return () => {
            active = false;
            resizeObserver.disconnect();
            if (viewer) {
                viewer.Destroy();
            }
        };
    }, [url]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: 'transparent' }}>
            {isLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 10 }}>
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span className="text-sm font-medium">Loading DXF...</span>
                </div>
            )}
            <div ref={dxfRef} style={{ width: '100%', height: '100%', opacity: isLoading ? 0 : 1 }}></div>
        </div>
    );
};

// -- Main Component ---------------------------------------
const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
    isOpen,
    url,
    onClose,
    fileName = '3D Model',
    inline = false
}) => {
    const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'edges'>('edges');
    const [navMode, setNavMode] = useState<'orbit' | 'pan' | 'zoom'>('orbit');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTree, setShowTree] = useState(false);
    const [extraLights, setExtraLights] = useState(true);
    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);

    const parts = fileName.split('.');
    const rawExt = parts.length > 1 ? parts[parts.length - 1] : '';
    const ext = rawExt.toLowerCase();
    const is3D = ['stl', 'obj', 'step', 'stp'].includes(ext);

    // Load geometry strictly in the parent space so the UI tree can bind to it
    const { geometry, error, isLoading } = useModelGeometry(url, ext);

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => console.error(`Error entering fullscreen: ${err.message}`));
        } else {
            document.exitFullscreen();
        }
    };

    if (!isOpen) return null;

    const toggleNode = (uuid: string) => {
        setHiddenNodes(prev => {
            const next = new Set(prev);
            if (next.has(uuid)) next.delete(uuid);
            else next.add(uuid);
            return next;
        });
    };

    return (
        <div ref={containerRef} style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%', background: 'transparent',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)', background: 'var(--muted)', zIndex: 10
            }}>
                <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileName}
                </span>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {is3D && (
                        <>
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--background)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                    onClick={() => setNavMode('orbit')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: navMode === 'orbit' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Orbit Camera"
                                ><MousePointer2 size={16} className={navMode === 'orbit' ? 'text-primary' : 'text-muted-foreground'} /></button>
                                <button
                                    onClick={() => setNavMode('pan')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: navMode === 'pan' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Pan Camera"
                                ><Move size={16} className={navMode === 'pan' ? 'text-primary' : 'text-muted-foreground'} /></button>
                                <button
                                    onClick={() => setNavMode('zoom')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: navMode === 'zoom' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Zoom Camera"
                                ><ZoomIn size={16} className={navMode === 'zoom' ? 'text-primary' : 'text-muted-foreground'} /></button>
                            </div>
                            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--background)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                    onClick={() => setRenderMode('solid')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: renderMode === 'solid' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Solid Mesh"
                                ><Cuboid size={16} className={renderMode === 'solid' ? 'text-primary' : 'text-muted-foreground'} /></button>
                                <button
                                    onClick={() => setRenderMode('edges')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: renderMode === 'edges' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Faces with Edges"
                                ><BoxSelect size={16} className={renderMode === 'edges' ? 'text-primary' : 'text-muted-foreground'} /></button>
                                <button
                                    onClick={() => setRenderMode('wireframe')}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: renderMode === 'wireframe' ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Wireframe"
                                ><Grid3x3 size={16} className={renderMode === 'wireframe' ? 'text-primary' : 'text-muted-foreground'} /></button>
                            </div>
                            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                            <div style={{ display: 'flex', gap: '4px', background: 'var(--background)', padding: '2px', borderRadius: '6px' }}>
                                <button
                                    onClick={() => setExtraLights(!extraLights)}
                                    style={{ padding: '4px 8px', borderRadius: '4px', background: extraLights ? 'var(--muted)' : 'transparent', border: 'none', cursor: 'pointer' }}
                                    title="Toggle Headlight (Follows Camera)"
                                ><Lightbulb size={16} className={extraLights ? 'text-primary' : 'text-muted-foreground'} /></button>
                            </div>
                            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                        </>
                    )}
                    <button
                        onClick={toggleFullscreen}
                        style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--background)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize size={16} className="text-muted-foreground" /> : <Maximize size={16} className="text-muted-foreground" />}
                    </button>
                    {is3D && (
                        <button
                            onClick={() => setShowTree(!showTree)}
                            style={{ padding: '4px 8px', borderRadius: '6px', background: showTree ? 'var(--muted)' : 'var(--background)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}
                            title="Toggle Model Tree"
                        >
                            <ListTree size={16} className={showTree ? "text-primary" : "text-muted-foreground"} />
                        </button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative', background: 'hsl(var(--background) / 0.5)', display: 'flex', minHeight: 0 }}>
                {ext === 'dxf' ? (
                    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                        <DxfNativeLayer url={url} />
                    </div>
                ) : (
                    <>
                        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                            {isLoading && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 10, background: 'rgba(0,0,0,0.05)' }}>
                                    <Loader2 size={24} className="animate-spin text-primary" />
                                    <span className="text-sm font-medium">Loading 3D Model...</span>
                                </div>
                            )}
                            <Suspense fallback={
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Loader2 size={16} className="animate-spin" /> Loading Engine...
                                </div>
                            }>
                                <Canvas
                                    shadows
                                    camera={{ position: [5, 5, 5], fov: 50 }}
                                >
                                    <ambientLight intensity={0.5} />
                                    <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
                                    <directionalLight position={[-10, -10, -10]} intensity={0.3} />
                                    <Headlight enabled={extraLights} />
                                    <Bounds fit clip observe margin={1.5}>
                                        <Center>
                                            <ModelRenderer geometry={geometry} error={error} renderMode={renderMode} hiddenNodes={hiddenNodes} />
                                        </Center>
                                    </Bounds>

                                    {navMode === 'orbit' && <OrbitControls makeDefault mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />}
                                    {navMode === 'pan' && <OrbitControls makeDefault mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }} />}
                                    {navMode === 'zoom' && <OrbitControls makeDefault mouseButtons={{ LEFT: THREE.MOUSE.DOLLY, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} />}
                                </Canvas>
                            </Suspense>
                        </div>

                        {showTree && geometry && (
                            <div style={{
                                width: 280,
                                borderLeft: '1px solid var(--border)',
                                background: 'var(--muted)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflowY: 'auto'
                            }}>
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                                    Structure
                                </div>
                                <ModelTreeNode node={geometry instanceof THREE.BufferGeometry ? new THREE.Mesh(geometry) : geometry} depth={0} hiddenNodes={hiddenNodes} toggleNode={toggleNode} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ThreeDViewer;
