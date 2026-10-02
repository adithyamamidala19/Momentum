import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  createMedalFrontTexture,
  createMedalBackTexture,
  createMedalBumpTexture,
  createMedalEdgeTexture,
  getTierMaterialProps
} from './medalTextures.js';


/**
 * Feature detect WebGL support gracefully
 */
export function isWebGLAvailable() {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * 3D Coin Mesh Component with real PBR materials, bump/engraved relief, and animated flip
 */
function MedalMesh({
  tier = 'bronze',
  name = 'Milestone',
  nickname = 'Practitioner',
  date = '2026',
  verificationCode = null,
  isOtherUser = false,
  achieved = true,
  prefersReduced = false,
  isFlipped = false,
  autoSpin = true
}) {
  const meshRef = useRef();
  const entranceAnim = useRef(0);

  // 1. Generate Front, Back, Bump, and Reeded Edge Textures
  const { frontTexture, backTexture, frontBump, backBump, edgeBump } = useMemo(() => {
    const ft = createMedalFrontTexture(tier, name, achieved);
    const bt = createMedalBackTexture({
      tierKey: tier,
      medalName: name,
      nickname,
      date,
      verificationCode,
      isOtherUser,
      achieved
    });
    const fb = createMedalBumpTexture(tier, true, achieved);
    const bb = createMedalBumpTexture(tier, false, achieved);
    const eb = createMedalEdgeTexture(tier, achieved);
    return { frontTexture: ft, backTexture: bt, frontBump: fb, backBump: bb, edgeBump: eb };
  }, [tier, name, nickname, date, verificationCode, isOtherUser, achieved]);

  // Clean up textures on unmount
  useEffect(() => {
    return () => {
      if (frontTexture) frontTexture.dispose();
      if (backTexture) backTexture.dispose();
      if (frontBump) frontBump.dispose();
      if (backBump) backBump.dispose();
      if (edgeBump) edgeBump.dispose();
    };
  }, [frontTexture, backTexture, frontBump, backBump, edgeBump]);

  // 2. Base Disc / Coin Geometry: radius 2.3, height 0.28, 64 segments
  // Crucial: rotateX(PI/2) and rotateZ(PI/2) so front face (+Y) points towards camera (+Z) completely straight and upright
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(2.3, 2.3, 0.28, 64, 1);
    geo.rotateX(Math.PI / 2);
    geo.rotateZ(Math.PI / 2);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // 3. Authoritative PBR Materials for [0: Side Rim, 1: Top (Front Face), 2: Bottom (Back Face)]
  const pbr = useMemo(() => getTierMaterialProps(tier, achieved), [tier, achieved]);

  const materials = useMemo(() => {
    // 0: Rim / Edge Material (Reeded bullion coin edge with clearcoat reflections)
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: pbr.rimColor || pbr.color,
      metalness: achieved ? Math.min(1.0, pbr.metalness + 0.02) : 0.65,
      roughness: achieved ? Math.max(0.04, pbr.roughness - 0.08) : 0.55,
      bumpMap: edgeBump,
      bumpScale: achieved ? 0.025 : 0.015,
      clearcoat: achieved ? 0.95 : 0.25,
      clearcoatRoughness: 0.04,
      reflectivity: 0.95
    });


    // Materials generator for front and back faces with tier-calibrated physical luster
    const createFaceMat = (map, bump) => {
      const isPhysical = pbr.type === 'physical' || tier === 'platinum' || achieved;

      if (isPhysical) {
        return new THREE.MeshPhysicalMaterial({
          map,
          bumpMap: bump,
          bumpScale: pbr.bumpScale || 0.045,
          color: '#FFFFFF',
          metalness: pbr.metalness,
          roughness: pbr.roughness,
          clearcoat: pbr.clearcoat || 0.6,
          clearcoatRoughness: pbr.clearcoatRoughness || 0.1,
          iridescence: pbr.iridescence || 0,
          iridescenceIOR: pbr.iridescenceIOR || 1.3,
          reflectivity: 0.85
        });
      }

      return new THREE.MeshStandardMaterial({
        map,
        bumpMap: bump,
        bumpScale: pbr.bumpScale || 0.04,
        color: '#FFFFFF',
        metalness: pbr.metalness,
        roughness: pbr.roughness
      });
    };

    const frontMat = createFaceMat(frontTexture, frontBump);
    const backMat = createFaceMat(backTexture, backBump);

    return [rimMat, frontMat, backMat];
  }, [frontTexture, backTexture, frontBump, backBump, pbr, tier, achieved]);

  useEffect(() => {
    return () => {
      materials.forEach((mat) => mat.dispose());
    };
  }, [materials]);

  // Slow, graceful celebratory opening rotation and interactive flip transition
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // ── Graceful Slow Opening Animation (User Opens Modal) ──
    if (entranceAnim.current < 1) {
      // Smooth slow rate: completes in ~1.8s
      entranceAnim.current = Math.min(1, entranceAnim.current + delta * 0.58);
      const t = entranceAnim.current;
      // Silky smooth ease-out quartic curve: f(t) = 1 - (1 - t)^4
      const ease = 1 - Math.pow(1 - t, 4);

      // Scale up smoothly from 0.72 to 1.0
      const currentScale = 0.72 + 0.28 * ease;
      meshRef.current.scale.set(currentScale, currentScale, currentScale);

      // Subtle metallic edge tilt that gracefully levels out straight to 0
      meshRef.current.rotation.x = (1 - ease) * 0.26;

      // Slow elegant 1-revolution entrance (-360° to 0°) settling straight upright
      meshRef.current.rotation.y = (1 - ease) * -Math.PI * 2 + (isFlipped ? Math.PI : 0);

      if (t >= 1) {
        meshRef.current.scale.set(1, 1, 1);
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.y = isFlipped ? Math.PI : 0;
      }
      return;
    }

    // ── Interactive Flip State (Front = 0, Certificate Back = Math.PI) ──
    const targetY = isFlipped ? Math.PI : 0;
    if (Math.abs(meshRef.current.rotation.y - targetY) > 0.005) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetY,
        0.08
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Main Medal3D Canvas with Environment reflections, PresentationControls, and Float
 */
export default function Medal3D({
  tier = 'bronze',
  name = '7-Day Genesis',
  nickname = 'Practitioner',
  date = '2026',
  verificationCode = null,
  isOtherUser = false,
  achieved = true,
  isFlipped = false,
  autoSpin = true,
  className = ''
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isReduced, setIsReduced] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReduced(media.matches);
    const listener = (e) => setIsReduced(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // WebGL unavailable fallback: CSS 3D Realistic Medal Card
  if (!hasWebGL) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 select-none ${className}`}>
        <div
          className="w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-2xl relative"
          style={{
            background: achieved
              ? tier === 'gold'
                ? 'radial-gradient(circle, #F6C03D 0%, #A37010 100%)'
                : tier === 'silver'
                ? 'radial-gradient(circle, #E2E8F0 0%, #64748B 100%)'
                : tier === 'platinum'
                ? 'radial-gradient(circle, #E0F2FE 0%, #0369A1 100%)'
                : 'radial-gradient(circle, #B86B35 0%, #5A2E0C 100%)'
              : 'radial-gradient(circle, #4B4F56 0%, #1E2024 100%)',
            border: '8px solid rgba(255, 255, 255, 0.25)'
          }}
        >
          <span className="text-5xl">{achieved ? '🎖️' : '🔒'}</span>
          <span className="font-editorial text-lg text-white font-bold mt-2">{name}</span>
          <span className="text-xs uppercase tracking-widest text-white/80">{tier} Tier</span>
        </div>
        <p className="text-xs text-outline mt-4">Hardware 3D disabled · CSS specular presentation</p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true
        }}
        dpr={[1, Math.min(window.devicePixelRatio || 1, 2)]}
        className="cursor-grab active:cursor-grabbing w-full h-full"
      >
        {/* Soft Ambient Fill */}
        <ambientLight intensity={1.2} />

        {/* Primary Warm Studio Key Light */}
        <directionalLight position={[5, 7, 5]} intensity={2.8} color="#FFFBF0" />

        {/* Cool Rim Light from back-left for crisp coin edge and reeded bevels */}
        <directionalLight position={[-5, -4, -4]} intensity={2.0} color="#E0F2FE" />

        {/* Front-left Studio Softbox Fill */}
        <directionalLight position={[-4, 3, 4]} intensity={1.4} color="#F8FAFC" />

        {/* Focused Specular Glint Spotlight */}
        <spotLight position={[0, 4, 6]} angle={0.5} penumbra={0.8} intensity={2.4} color="#FFFFFF" />

        {/* Realistic Studio HDRI Reflections */}
        <Environment preset="city" />


        <PresentationControls
          global
          snap={false}
          speed={2.0}
          zoom={1}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Infinity, Infinity]}
          cursor={true}
        >
          <Float speed={isReduced ? 0 : 1.4} rotationIntensity={0.08} floatIntensity={0.18}>
            <MedalMesh
              tier={tier}
              name={name}
              nickname={nickname}
              date={date}
              verificationCode={verificationCode}
              isOtherUser={isOtherUser}
              achieved={achieved}
              prefersReduced={isReduced}
              isFlipped={isFlipped}
              autoSpin={autoSpin}
            />
          </Float>
        </PresentationControls>
      </Canvas>
    </div>
  );
}
