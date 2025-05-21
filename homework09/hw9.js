import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Create cameras
const perspectiveCamera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const orthographicCamera = new THREE.OrthographicCamera(
  window.innerWidth / -50,
  window.innerWidth / 50,
  window.innerHeight / 50,
  window.innerHeight / -50,
  0.1,
  1000
);

let activeCamera = perspectiveCamera;
activeCamera.position.set(0, 100, 150);
activeCamera.lookAt(0, 0, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Add stats
const stats = new Stats();
document.body.appendChild(stats.dom);

// Add orbit controls
const orbitControls = new OrbitControls(activeCamera, renderer.domElement);
orbitControls.enableDamping = true;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 200);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Create sun
const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Texture loader
const textureLoader = new THREE.TextureLoader();
const loadTexture = (path) => {
  return new Promise((resolve) => {
    textureLoader.load(
      path,
      (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
};

// Planet data with exact speeds from problem specs (but max speed now 0.1)
const planetData = [
  {
    name: "Mercury",
    radius: 1.5,
    distance: 20,
    color: 0xa6a6a6,
    rotationSpeed: 0.02,
    orbitSpeed: 0.02,
    texture: "Mercury.jpg",
  },
  {
    name: "Venus",
    radius: 3,
    distance: 35,
    color: 0xe39e1c,
    rotationSpeed: 0.015,
    orbitSpeed: 0.015,
    texture: "Venus.jpg",
  },
  {
    name: "Earth",
    radius: 3.5,
    distance: 50,
    color: 0x3498db,
    rotationSpeed: 0.01,
    orbitSpeed: 0.01,
    texture: "Earth.jpg",
  },
  {
    name: "Mars",
    radius: 2.5,
    distance: 65,
    color: 0xc0392b,
    rotationSpeed: 0.008,
    orbitSpeed: 0.008,
    texture: "Mars.jpg",
  },
];

// Create planets
const planets = [];
async function createPlanets() {
  for (const data of planetData) {
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    let material;

    try {
      const texture = await loadTexture(data.texture);
      material = new THREE.MeshStandardMaterial({
        map: texture || null,
        color: texture ? 0xffffff : data.color,
        roughness: 0.8,
        metalness: 0.2,
      });
    } catch {
      material = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.8,
        metalness: 0.2,
      });
    }

    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = data.distance;

    planet.userData = {
      rotationSpeed: data.rotationSpeed,
      orbitSpeed: data.orbitSpeed,
      distance: data.distance,
      angle: Math.random() * Math.PI * 2,
    };

    scene.add(planet);
    planets.push(planet);
  }

  setupGUI();
  animate();
}

// Camera switching logic
function switchCamera() {
  if (activeCamera === perspectiveCamera) {
    activeCamera = orthographicCamera;
    // Match orthographic camera position to perspective
    orthographicCamera.position.copy(perspectiveCamera.position);
    orthographicCamera.rotation.copy(perspectiveCamera.rotation);
  } else {
    activeCamera = perspectiveCamera;
  }
  orbitControls.object = activeCamera;
  orbitControls.update();
}

// GUI setup with max speed increased to 0.1
function setupGUI() {
  const gui = new GUI();

  const cameraControls = {
    switchCamera: switchCamera,
    currentCamera: "Perspective",
  };

  gui.add(cameraControls, "switchCamera").name("Switch Camera Type");
  const cameraType = gui
    .add(cameraControls, "currentCamera")
    .name("Current Camera");
  cameraType.listen();

  // Update camera type display
  setInterval(() => {
    cameraControls.currentCamera =
      activeCamera === perspectiveCamera ? "Perspective" : "Orthographic";
  }, 100);

  // Planet controls with max speed now 0.1
  planets.forEach((planet, index) => {
    const folder = gui.addFolder(planetData[index].name);
    folder
      .add(planet.userData, "rotationSpeed", 0, 0.1)
      .name("Rotation Speed")
      .step(0.001);
    folder
      .add(planet.userData, "orbitSpeed", 0, 0.1)
      .name("Orbit Speed")
      .step(0.001);
    folder.open();
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  orbitControls.update();
  stats.update();

  planets.forEach((planet) => {
    planet.rotation.y += planet.userData.rotationSpeed;
    planet.userData.angle += planet.userData.orbitSpeed;
    planet.position.x =
      Math.cos(planet.userData.angle) * planet.userData.distance;
    planet.position.z =
      Math.sin(planet.userData.angle) * planet.userData.distance;
  });

  renderer.render(scene, activeCamera);
}

// Handle window resize
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  perspectiveCamera.aspect = width / height;
  perspectiveCamera.updateProjectionMatrix();

  orthographicCamera.left = width / -50;
  orthographicCamera.right = width / 50;
  orthographicCamera.top = height / 50;
  orthographicCamera.bottom = height / -50;
  orthographicCamera.updateProjectionMatrix();

  renderer.setSize(width, height);
});

// Initialize
createPlanets();
