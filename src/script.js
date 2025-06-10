import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const instructions = document.createElement('div')
instructions.classList.add('instructions-text')
instructions.innerText = "Scroll to spin around the dragon, press space to change scene"
document.body.appendChild(instructions)

const cloudGroup = new THREE.Group()
scene.add(cloudGroup)

const backgroundImages = [
    { name: 'Denial', path: '/skytexture/Denial.png', dialog: 'Woe to a being you miss but can’t quite understand why.', tint: 0xA4B9FF },
    { name: 'Anger', path: '/skytexture/Anger.png', dialog: 'Why to miss someone you’ve never met, only their bones laid where life took place.', tint: 0xFF4E4E },
    { name: 'Bargaining', path: '/skytexture/Bargaining.png', dialog: 'Maybe they did care. Maybe their pain brought you here.', tint: 0xFFE985 },
    { name: 'Depression', path: '/skytexture/Depression.png', dialog: 'Oh endless blue. Receive me with open arms, for it’s the only comfort I’d get.', tint: 0x6E7DA3 },
    { name: 'Acceptance', path: '/skytexture/Acceptance.png', dialog: 'Peaceful sky, I see you, soul who cared for me even when I doubted you.', tint: 0xA1FFC2 }
]

let currentBackgroundIndex = 0
const loader = new THREE.TextureLoader()
const textureLoader = new THREE.TextureLoader()

const stageLabel = document.createElement('div')
stageLabel.classList.add('stage-label')
document.body.appendChild(stageLabel)

const dialogBox = document.createElement('div')
dialogBox.classList.add('dialog-box')
document.body.appendChild(dialogBox)

const fadeOverlay = document.createElement('div')
fadeOverlay.className = 'fade-overlay'
document.body.appendChild(fadeOverlay)

const music = document.getElementById('bg-music');
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');

startButton.addEventListener('click', () => {
    fadeOverlay.style.opacity = 1;
    setTimeout(() => {
        startScreen.style.display = 'none';
        music.play().then(() => console.log('Música iniciada'))
            .catch(e => console.error('Error al reproducir música:', e));
        startStory();
        fadeOverlay.style.opacity = 0;
    }, 2000);
});

function startStory() {
    currentBackgroundIndex = 0;
    setBackground(currentBackgroundIndex);
    dialogBox.style.display = 'none';
}

let currentCloudColor = new THREE.Color(0xffffff)

function smoothTintClouds(targetColorHex, duration = 2) {
    const startTime = performance.now()
    const targetColor = new THREE.Color(targetColorHex)

    const allClouds = cloudGroup.children
    const initialColor = currentCloudColor.clone()

    function animate() {
        const elapsed = (performance.now() - startTime) / 1000
        const progress = Math.min(elapsed / duration, 1)

        const interpolated = initialColor.clone().lerp(targetColor, progress)
        allClouds.forEach(cloud => {
            cloud.material.color.copy(interpolated)
        })

        if (progress < 1) {
            requestAnimationFrame(animate)
        } else {
            currentCloudColor.copy(targetColor)
        }
    }

    animate()
}

function setBackground(index) {
    loader.load(backgroundImages[index].path, (texture) => {
        scene.background = texture
        stageLabel.innerText = `Stage: ${backgroundImages[index].name}`
        dialogBox.innerText = backgroundImages[index].dialog
        smoothTintClouds(backgroundImages[index].tint)
    })
}

const cloudCount = 18
const cloudTextures = [
    '/skytexture/_Clouds1.png',
    '/skytexture/_Clouds2.png',
    '/skytexture/_Clouds3.png',
    '/skytexture/_Clouds4.png',
    '/skytexture/_Clouds5.png'
]

const cloudMaterialArray = cloudTextures.map(path => {
    const texture = textureLoader.load(path)
    return new THREE.SpriteMaterial({ map: texture, transparent: true })
})

const clouds = []
for (let i = 0; i < cloudCount; i++) {
    const sprite = new THREE.Sprite(cloudMaterialArray[i % cloudMaterialArray.length].clone())
    positionCloud(sprite)
    cloudGroup.add(sprite)
    clouds.push(sprite)
}

function positionCloud(cloud) {
    const angle = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 3
    const height = Math.random() * 8 - 4
    cloud.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
    cloud.scale.set(4, 3, 1)
}

// --- Aquí está la función corregida ---
function animateCloudCover(onComplete) {
    const extraClouds = []
    const previousColor = currentCloudColor.clone()
    const nextIndex = (currentBackgroundIndex + 1) % backgroundImages.length
    const nextColor = new THREE.Color(backgroundImages[nextIndex].tint)

    for (let i = 0; i < 50; i++) {
        const sprite = new THREE.Sprite(cloudMaterialArray[i % cloudMaterialArray.length].clone())
        sprite.material.color.copy(previousColor)
        sprite.position.set((Math.random() - 0.5) * 10, 10 + Math.random() * 5, (Math.random() - 0.5) * 10)
        sprite.scale.set(4 + Math.random() * 4, 3 + Math.random() * 2, 1)
        cloudGroup.add(sprite)
        extraClouds.push(sprite)
    }

    const duration = 8
    const startTime = performance.now()

    function animate() {
        const elapsed = (performance.now() - startTime) / 1000
        const progress = Math.min(elapsed / duration, 8)

        const interpolated = previousColor.clone().lerp(nextColor, progress)

        for (const cloud of extraClouds) {
            cloud.position.y = 9 - progress * 12
            cloud.material.color.copy(interpolated)
        }

        if (progress < 1) {
            requestAnimationFrame(animate)
        } else {
            onComplete()
        }
    }

    animate()
}
// --- fin función corregida ---

function resetClouds() {
    while (cloudGroup.children.length > cloudCount) {
        cloudGroup.remove(cloudGroup.children[cloudGroup.children.length - 1])
    }
    for (let i = 0; i < cloudCount; i++) {
        positionCloud(cloudGroup.children[i])
    }
}

let isTransitioning = false

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && !isTransitioning) {
        isTransitioning = true
        dialogBox.innerText = backgroundImages[currentBackgroundIndex].dialog
        dialogBox.style.display = 'block'

        setTimeout(() => {
            animateCloudCover(() => {
                currentBackgroundIndex++
                if (currentBackgroundIndex >= backgroundImages.length) {
                    fadeOverlay.style.opacity = 1
                    setTimeout(() => {
                        currentBackgroundIndex = 0
                        setBackground(currentBackgroundIndex)
                        resetClouds()
                        dialogBox.style.display = 'none'
                        startScreen.style.display = 'flex'
                        fadeOverlay.style.opacity = 0
                        isTransitioning = false
                    }, 2000)
                } else {
                    setBackground(currentBackgroundIndex)
                    resetClouds()
                    dialogBox.style.display = 'none'
                    isTransitioning = false
                }
            })
        }, 3000)
    }
})

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
let angle = 0
const radius = 3

gltfLoader.load('/models/dragon_flying/dragon.gltf', (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.rotation.x = -Math.PI / 2
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = new THREE.Vector3()
    box.getCenter(center)
    gltf.scene.position.sub(center).add(new THREE.Vector3(0, -2.5, 9.5))
    scene.add(gltf.scene)

    if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[0])
        action.setLoop(THREE.LoopRepeat)
        action.play()
    }
})

window.addEventListener('wheel', (event) => {
    angle += event.deltaY * 0.0015
    angle %= Math.PI * 2
})

const ambientLight = new THREE.AmbientLight(0xA865B5, 2.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xA865B5, 1.8)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 17
directionalLight.shadow.camera.left = -7
directionalLight.shadow.camera.top = 5
directionalLight.shadow.camera.right = 4
directionalLight.shadow.camera.bottom = -7
directionalLight.position.set(1, 5, 3)
scene.add(directionalLight)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(radius, 1.25, 0)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.target.set(0, -0.15, 0)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if (mixer) mixer.update(deltaTime)

    clouds.forEach(cloud => {
        cloud.position.y -= deltaTime * 0.5
        if (cloud.position.y < -5) {
            cloud.position.y = 4 + Math.random() * 3
        }
    })

    camera.position.x = radius * Math.cos(angle)
    camera.position.z = radius * Math.sin(angle)
    camera.position.y = 1.5
    camera.lookAt(0, 0, 0)

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()
