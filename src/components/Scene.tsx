import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StoreEnvironment } from './StoreEnvironment'
import { ProductMeshes } from './ProductMeshes'
import { FirstPersonControls } from './FirstPersonControls'
import { STORE, COLORS } from '../lib/constants'

export function Scene() {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ fov: 70, near: 0.1, far: 100, position: [0, STORE.eyeHeight, 14] }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog(COLORS.paper, 15, 45)
        scene.background = new THREE.Color(COLORS.paper)
      }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#FFFFFF', COLORS.floor, 0.4]} />
      <directionalLight
        position={[10, 8, 5]}
        intensity={0.6}
      />

      <StoreEnvironment />
      <ProductMeshes />
      <FirstPersonControls />
    </Canvas>
  )
}
