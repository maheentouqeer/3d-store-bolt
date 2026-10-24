import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STORE, resolveCollision } from '../lib/constants'
import { useStore } from '../lib/store'

const PLAYER_RADIUS = 0.35
const MOVE_SPEED = 4.5
const SPRINT_SPEED = 7.0
const JOYSTICK_MAX = 60

type Keys = { [k: string]: boolean }

export function FirstPersonControls() {
  const { camera, gl } = useThree()
  const keys = useRef<Keys>({})
  const isPointerLocked = useRef(false)
  const yaw = useRef(0)
  const pitch = useRef(0)
  const velocity = useRef(new THREE.Vector3())
  const joystick = useRef({ x: 0, y: 0 })
  const joystickActive = useRef(false)
  const bobPhase = useRef(0)

  const mode = useStore((s) => s.mode)
  const cameraTarget = useStore((s) => s.cameraTarget)
  const clearCameraTarget = useStore((s) => s.clearCameraTarget)
  const setPlayerPos = useStore((s) => s.setPlayerPos)
  const flyProgress = useRef(0)

  // Init camera position
  useEffect(() => {
    camera.position.set(0, STORE.eyeHeight, 14)
    yaw.current = Math.PI
    pitch.current = 0
    updateCameraRotation()
  }, [camera])

  // Keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (e.code === 'Escape') {
        document.exitPointerLock?.()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Mouse look (pointer lock on desktop)
  useEffect(() => {
    const canvas = gl.domElement

    const onClick = () => {
      if (!isPointerLocked.current && !('ontouchstart' in window)) {
        canvas.requestPointerLock?.()
      }
    }

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return
      yaw.current -= e.movementX * 0.002
      pitch.current -= e.movementY * 0.002
      pitch.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch.current))
      updateCameraRotation()
    }

    canvas.addEventListener('click', onClick)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    document.addEventListener('mousemove', onMouseMove)
    return () => {
      canvas.removeEventListener('click', onClick)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [gl])

  // Touch joystick for mobile
  useEffect(() => {
    const canvas = gl.domElement
    let touchId: number | null = null
    let startX = 0
    let startY = 0
    let lookTouchId: number | null = null
    let lastLookX = 0
    let lastLookY = 0

    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.clientX < window.innerWidth * 0.5 && touchId === null) {
          touchId = t.identifier
          startX = t.clientX
          startY = t.clientY
          joystickActive.current = true
        } else if (t.clientX >= window.innerWidth * 0.5 && lookTouchId === null) {
          lookTouchId = t.identifier
          lastLookX = t.clientX
          lastLookY = t.clientY
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchId) {
          let dx = t.clientX - startX
          let dy = t.clientY - startY
          dx = Math.max(-JOYSTICK_MAX, Math.min(JOYSTICK_MAX, dx))
          dy = Math.max(-JOYSTICK_MAX, Math.min(JOYSTICK_MAX, dy))
          joystick.current.x = dx / JOYSTICK_MAX
          joystick.current.y = dy / JOYSTICK_MAX
        } else if (t.identifier === lookTouchId) {
          const dx = t.clientX - lastLookX
          const dy = t.clientY - lastLookY
          yaw.current -= dx * 0.005
          pitch.current -= dy * 0.005
          pitch.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch.current))
          updateCameraRotation()
          lastLookX = t.clientX
          lastLookY = t.clientY
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchId) {
          touchId = null
          joystick.current.x = 0
          joystick.current.y = 0
          joystickActive.current = false
        } else if (t.identifier === lookTouchId) {
          lookTouchId = null
        }
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl])

  function updateCameraRotation() {
    camera.rotation.order = 'YXZ'
    camera.rotation.y = yaw.current
    camera.rotation.x = pitch.current
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = cameraTarget

    if (target) {
      flyProgress.current += dt * 1.5
      const t = Math.min(flyProgress.current, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const destX = target.x
      const destZ = target.z + 2
      const startX = camera.position.x
      const startZ = camera.position.z
      const newX = startX + (destX - startX) * ease * 0.1
      const newZ = startZ + (destZ - startZ) * ease * 0.1
      const resolved = resolveCollision(new THREE.Vector3(newX, STORE.eyeHeight, newZ), PLAYER_RADIUS)
      camera.position.x = resolved.x
      camera.position.z = resolved.z

      // Look toward the shelf
      const lookAngle = Math.atan2(destX - camera.position.x, destZ - camera.position.z)
      yaw.current += (lookAngle - yaw.current) * 0.05
      updateCameraRotation()

      if (t >= 1 && Math.abs(camera.position.x - destX) < 0.5 && Math.abs(camera.position.z - destZ) < 0.5) {
        clearCameraTarget()
        flyProgress.current = 0
      }
      setPlayerPos(camera.position.x, camera.position.z)
      return
    }

    flyProgress.current = 0

    // Movement
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0))

    let mx = 0
    let mz = 0
    const k = keys.current
    if (k['KeyW'] || k['ArrowUp']) mz += 1
    if (k['KeyS'] || k['ArrowDown']) mz -= 1
    if (k['KeyA'] || k['ArrowLeft']) mx -= 1
    if (k['KeyD'] || k['ArrowRight']) mx += 1
    if (joystickActive.current) {
      mx += joystick.current.x
      mz -= joystick.current.y
    }

    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 0) {
      mx /= len
      mz /= len
    }

    const speed = (k['ShiftLeft'] || k['ShiftRight']) ? SPRINT_SPEED : MOVE_SPEED
    const dir = new THREE.Vector3()
    dir.addScaledVector(forward, mz)
    dir.addScaledVector(right, mx)
    if (dir.lengthSq() > 0) dir.normalize()

    // Damped velocity
    velocity.current.x += (dir.x * speed - velocity.current.x) * 0.15
    velocity.current.z += (dir.z * speed - velocity.current.z) * 0.15

    const newPos = camera.position.clone()
    newPos.x += velocity.current.x * dt
    newPos.z += velocity.current.z * dt

    const resolved = resolveCollision(new THREE.Vector3(newPos.x, STORE.eyeHeight, newPos.z), PLAYER_RADIUS)
    camera.position.x = resolved.x
    camera.position.z = resolved.z

    // Walking bob
    if (velocity.current.lengthSq() > 0.5) {
      bobPhase.current += dt * 8
      camera.position.y = STORE.eyeHeight + Math.sin(bobPhase.current) * 0.03
    } else {
      camera.position.y += (STORE.eyeHeight - camera.position.y) * 0.1
    }

    setPlayerPos(camera.position.x, camera.position.z)
  })

  return null
}
