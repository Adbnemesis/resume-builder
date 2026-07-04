/* 3D Voxel Interactive Resume Game (3rd Person Explorer) */
(function() {
  // Game state variables
  let scene, camera, renderer;
  let animationFrameId = null;
  let isGameActive = false;
  
  // Voxel Minimap Canvas
  let minimapCanvas = null;
  let minimapCtx = null;
  
  // Controls state
  const keys = { w: false, a: false, s: false, d: false, Shift: false, Space: false };
  const cameraRotation = { yaw: 0, pitch: -0.2 }; // Orbit pitch/yaw
  let cameraDistance = 5.0; // Distance behind player
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  
  // Player state
  const player = {
    position: { x: 0, y: 0, z: 8 },
    velocity: { x: 0, y: 0, z: 0 },
    speed: 0.08,
    runSpeed: 0.16,
    jumpForce: 0.2,
    isGrounded: true,
    yaw: 0,
    width: 0.6,
    height: 1.9
  };
  
  // Gravity
  const GRAVITY = 0.01;
  
  // Boundary constraints (Gallery room walls)
  const roomBounds = {
    minX: -14, maxX: 14,
    minZ: -14, maxZ: 14
  };
  
  // Limbs groups for player animations
  let playerGroup = null;
  let leftArmGroup, rightArmGroup;
  let leftLegGroup, rightLegGroup;
  let headMesh;
  
  // Interactive entities
  let doorPortals = [];
  let centerPedestalGroup = null;
  let floatingSkillsGroup = null;
  let voxelClouds = [];
  
  // Voxel Parkour Challenge
  const parkourBlocks = [];
  let parkourStartPlatform = null;
  let goldenChestMesh = null;
  let parkourActive = false;
  
  // Voxel Arrow Target Shooting
  const arrows = [];
  const targets = [];
  let score = 0;
  let shootsLeft = 20;
  
  // Bowling Alley state
  const bowling = {
    active: false,
    laneX: -24,
    startZ: 4.5,
    endZ: -19,
    ballRadius: 0.25,
    pinRadius: 0.15,
    ball: null,
    pins: [],
    physicsActive: false,
    throwCount: 0,
    pinsDown: 0,
    score: 0,
    ballVelocity: { x: 0, z: 0 },
    state: "ready", // ready, rolling, reset
  };
  
  // Active section track
  let activeSectionId = null;

  // Initialize function
  window.start3DResumeGame = function() {
    if (isGameActive) return;
    isGameActive = true;
    
    // Show dialog
    const dialog = document.getElementById("game3d-dialog");
    dialog.showModal();
    
    // Trigger loader screen
    const loader = document.getElementById("game-loader");
    loader.style.opacity = "1";
    loader.style.display = "flex";
    
    setTimeout(() => {
      try {
        // Initialize Three.js scene
        initScene();
        console.log('[Voxel Game] Scene initialized.');
        
        // Build 3D world based on active resumeData
        try {
          buildWorld();
          console.log('[Voxel Game] Voxel World built.');
        } catch (worldErr) {
          console.error('[Voxel Game] buildWorld() error:', worldErr);
        }
        
        // Setup event listeners
        setupListeners();
        
        // Start loop
        animate();
        
        // Force correct canvas size after dialog layout completes
        handleResize();
        
        // Hide loader
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
        }, 500);
        
        showTicker("Use WASD to Walk. L-Shift to Sprint. Space to Jump. Left-Click/F to shoot arrows!");
      } catch (err) {
        console.error('[Voxel Game] Fatal init error:', err);
      }
    }, 200);
  };

  // Close & Clean up function
  window.close3DResumeGame = function() {
    if (!isGameActive) return;
    isGameActive = false;
    
    // Stop loop
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    
    // Remove listeners
    removeListeners();
    
    // Dispose resources
    disposeScene();
    
    // Close dialog
    const dialog = document.getElementById("game3d-dialog");
    dialog.close();
    
    // Clear active section
    activeSectionId = null;
    document.getElementById("hud-details").classList.remove("active");
    document.getElementById("hud-bowling").classList.remove("active");
  };

  function initScene() {
    const container = document.getElementById("game-container");
    const canvas = document.getElementById("game3d-canvas");
    minimapCanvas = document.getElementById("game3d-minimap");
    if (minimapCanvas) {
      minimapCtx = minimapCanvas.getContext("2d");
    }
    
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    
    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ac1eb); // Sky blue color
    scene.fog = new THREE.FogExp2(0x7ac1eb, 0.02);
    
    // Reset player position for new spawn
    player.position.x = 0;
    player.position.y = 0;
    player.position.z = 8;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.velocity.z = 0;
    player.isGrounded = true;
    
    // 2. Renderer
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 3. Camera (orbiting 3rd person)
    camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    updateCameraOrbit();
    
    // 4. Lighting
    // Ambient - clean sky light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Sunlight (directional sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 80;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
    
    // Accent point light
    const pointLight = new THREE.PointLight(0xffff88, 1.2, 15);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);
  }

  /* Construct blocky voxel player model (Steve/Alex style) */
  function createPlayerModel() {
    playerGroup = new THREE.Group();
    
    // Color materials (Minecraft theme)
    const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac }); // Peach/Skin
    const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x5a3825 }); // Brown hair
    const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0x008080 }); // Teal shirt
    const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff }); // Blue pants
    const shoeMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a }); // Grey shoes
    
    // 1. Torso (0.5w x 0.8h x 0.25d)
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.25), shirtMaterial);
    torsoMesh.position.y = 1.1; // Center height
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    playerGroup.add(torsoMesh);
    
    // 2. Head (0.4w x 0.4h x 0.4d)
    headMesh = new THREE.Group();
    headMesh.position.y = 1.7; // Pivot height
    
    const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), skinMaterial);
    headBase.castShadow = true;
    headMesh.add(headBase);
    
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.42), hairMaterial);
    hair.position.y = 0.16;
    headMesh.add(hair);
    
    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
    eyeL.position.set(-0.1, 0.02, 0.201);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.1;
    headMesh.add(eyeL);
    headMesh.add(eyeR);
    
    playerGroup.add(headMesh);
    
    // 3. Left Arm Group (Pivot at shoulder height 1.4)
    leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.35, 1.4, 0);
    const leftArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), shirtMaterial);
    leftArmMesh.position.y = -0.35; // Offset down so pivot is at top
    leftArmMesh.castShadow = true;
    leftArmGroup.add(leftArmMesh);
    playerGroup.add(leftArmGroup);
    
    // 4. Right Arm Group
    rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.35, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.18), shirtMaterial);
    rightArmMesh.position.y = -0.35;
    rightArmMesh.castShadow = true;
    rightArmGroup.add(rightArmMesh);
    playerGroup.add(rightArmGroup);
    
    // 5. Left Leg Group (Pivot at hip height 0.7)
    leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.14, 0.7, 0);
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), pantsMaterial);
    leftLegMesh.position.y = -0.35;
    leftLegMesh.castShadow = true;
    leftLegGroup.add(leftLegMesh);
    
    // Shoe
    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), shoeMaterial);
    leftShoe.position.y = -0.68;
    leftLegGroup.add(leftShoe);
    playerGroup.add(leftLegGroup);
    
    // 6. Right Leg Group
    rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.14, 0.7, 0);
    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), pantsMaterial);
    rightLegMesh.position.y = -0.35;
    rightLegMesh.castShadow = true;
    rightLegGroup.add(rightLegMesh);
    
    const rightShoe = leftShoe.clone();
    rightLegGroup.add(rightShoe);
    playerGroup.add(rightLegGroup);
    
    scene.add(playerGroup);
  }

  function buildWorld() {
    // 1. VOXEL TERRAIN / GROUND (Green voxel checkers)
    const terrainGroup = new THREE.Group();
    
    const grassLight = new THREE.MeshLambertMaterial({ color: 0x5b8731 });
    const grassDark = new THREE.MeshLambertMaterial({ color: 0x4d7229 });
    
    const tileSize = 2;
    const tilesCount = 30; // 60m x 60m bounds
    
    for (let x = -tilesCount/2; x < tilesCount/2; x++) {
      for (let z = -tilesCount/2; z < tilesCount/2; z++) {
        // Create checkered grass terrain block
        const useDark = (Math.abs(x + z) % 2 === 0);
        const geo = new THREE.BoxGeometry(tileSize, 0.4, tileSize);
        const tile = new THREE.Mesh(geo, useDark ? grassDark : grassLight);
        tile.position.set(x * tileSize + tileSize/2, -0.2, z * tileSize + tileSize/2);
        tile.receiveShadow = true;
        terrainGroup.add(tile);
      }
    }
    scene.add(terrainGroup);
    
    // 2. BOUNDARY WALLS (Stone voxel bricks stacked)
    const wallBrickMat = new THREE.MeshLambertMaterial({ color: 0x6e6f73 }); // Stone grey
    
    // Create voxel boundary fences
    const wallGeo = new THREE.BoxGeometry(32, 2.0, 1.0);
    
    // North wall
    const wallN = new THREE.Mesh(wallGeo, wallBrickMat);
    wallN.position.set(0, 1.0, -15.5);
    scene.add(wallN);
    
    // South wall
    const wallS = new THREE.Mesh(wallGeo, wallBrickMat);
    wallS.position.set(0, 1.0, 15.5);
    scene.add(wallS);
    
    // East wall
    const wallE = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 32), wallBrickMat);
    wallE.position.set(15.5, 1.0, 0);
    scene.add(wallE);
    
    // West wall (leave gap for bowling lane)
    const wallW1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 12), wallBrickMat);
    wallW1.position.set(-15.5, 1.0, -9.5);
    scene.add(wallW1);
    
    const wallW2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 12), wallBrickMat);
    wallW2.position.set(-15.5, 1.0, 9.5);
    scene.add(wallW2);
    
    // 3. SKY VOXEL CLOUDS
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 8; i++) {
      const cloudGroup = new THREE.Group();
      const numBlocks = 3 + Math.floor(Math.random() * 4);
      for (let j = 0; j < numBlocks; j++) {
        const cloudBlock = new THREE.Mesh(new THREE.BoxGeometry(1.5 + Math.random(), 0.8, 1.5 + Math.random()), cloudMat);
        cloudBlock.position.set(j * 1.0 - (numBlocks/2), 0, Math.random() * 0.5);
        cloudGroup.add(cloudBlock);
      }
      cloudGroup.position.set(
        -20 + Math.random() * 40,
        15 + Math.random() * 5,
        -20 + Math.random() * 40
      );
      scene.add(cloudGroup);
      voxelClouds.push(cloudGroup);
    }
    
    // 4. VOXEL TREES
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 }); // Brown trunk
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e6f40 }); // Leaf green
    
    const treePositions = [
      { x: -11, z: -11 }, { x: 11, z: -11 }, { x: 11, z: 11 }, { x: -11, z: 11 },
      { x: -13, z: -5 }, { x: 13, z: 5 }, { x: -5, z: 13 }
    ];
    
    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      // Trunk (block stacked)
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.5, 0.4), woodMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      tree.add(trunk);
      
      // Leaves (blocky shape)
      const leaves1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.6), leafMat);
      leaves1.position.y = 2.5;
      leaves1.castShadow = true;
      tree.add(leaves1);
      
      const leaves2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), leafMat);
      leaves2.position.y = 3.2;
      leaves2.castShadow = true;
      tree.add(leaves2);
      
      tree.position.set(pos.x, 0, pos.z);
      scene.add(tree);
    });
    
    // 5. CENTER LOBBY PEDESTAL
    centerPedestalGroup = new THREE.Group();
    centerPedestalGroup.position.set(0, 0, 0);
    
    const pedBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x3e3f48 })
    );
    pedBase.position.y = 0.3;
    pedBase.receiveShadow = true;
    pedBase.castShadow = true;
    centerPedestalGroup.add(pedBase);
    
    // Rotating Voxel Crystal
    const crystalMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x00557f });
    const crystalGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.6;
    crystal.rotation.set(0.5, 0.5, 0.5);
    crystal.name = "crystal";
    centerPedestalGroup.add(crystal);
    
    // Name Billboard
    const nameStr = window.resumeData?.personal?.name || "PORTFOLIO";
    const namePlateTexture = createTextTexture(nameStr.toUpperCase(), 36, "#ffaa00", "transparent", "center");
    const namePlateMat = new THREE.MeshBasicMaterial({ map: namePlateTexture, transparent: true, side: THREE.DoubleSide });
    const namePlate = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.6), namePlateMat);
    namePlate.position.set(0, 0.9, 0);
    namePlate.name = "nameplate";
    centerPedestalGroup.add(namePlate);
    
    scene.add(centerPedestalGroup);
    
    // 6. PORTAL PAVILIONS / DOORS
    const dataSections = window.resumeData?.sections || [];
    const doorSlots = [
      { x: -9, z: -14, rotation: 0, labelPos: { x: -9, y: 3.2, z: -13.5 } },      // North Left
      { x: 0, z: -14, rotation: 0, labelPos: { x: 0, y: 3.2, z: -13.5 } },        // North Center
      { x: 9, z: -14, rotation: 0, labelPos: { x: 9, y: 3.2, z: -13.5 } },        // North Right
      { x: 9, z: 14, rotation: Math.PI, labelPos: { x: 9, y: 3.2, z: 13.5 } },   // South Right
      { x: 0, z: 14, rotation: Math.PI, labelPos: { x: 0, y: 3.2, z: 13.5 } },    // South Center
      { x: -9, z: 14, rotation: Math.PI, labelPos: { x: -9, y: 3.2, z: 13.5 } },  // South Left
      { x: 14, z: -5, rotation: -Math.PI/2, labelPos: { x: 13.5, y: 3.2, z: -5 } },// East North
      { x: 14, z: 5, rotation: -Math.PI/2, labelPos: { x: 13.5, y: 3.2, z: 5 } }   // East South
    ];
    
    dataSections.forEach((sec, idx) => {
      if (idx >= doorSlots.length) return;
      const slot = doorSlots[idx];
      createDoorPortal(sec.id, sec.name, slot.x, slot.z, slot.rotation, slot.labelPos);
    });
    
    // 7. BOWLING MINIGAME ZONE
    createBowlingLane();
    
    // 8. VOXEL ARCHERY / TARGET SHOOTING
    createArcheryRange();
    
    // 9. VOXEL PARKOUR CHALLENGE
    createParkourChallenge();
    
    // Build actual player character meshes
    createPlayerModel();
  }

  function createDoorPortal(sectionId, sectionName, x, z, rotation, labelPos) {
    const portal = new THREE.Group();
    portal.position.set(x, 0, z);
    portal.rotation.y = rotation;
    
    // Voxel stone archway
    const archMat = new THREE.MeshLambertMaterial({ color: 0x42434f }); // Smooth stone
    
    // Left post
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.4), archMat);
    leftPost.position.set(-1.6, 1.6, 0);
    leftPost.castShadow = true;
    portal.add(leftPost);
    
    // Right post
    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.2, 0.4), archMat);
    rightPost.position.set(1.6, 1.6, 0);
    rightPost.castShadow = true;
    portal.add(rightPost);
    
    // Header
    const archHeader = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.4), archMat);
    archHeader.position.set(0, 3.2, 0);
    archHeader.castShadow = true;
    portal.add(archHeader);
    
    // Sliding door slabs (wooden textures look)
    const woodSlabMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // Wood brown
    
    const slabL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.0, 0.1), woodSlabMat);
    slabL.position.set(-0.7, 1.5, -0.05);
    portal.add(slabL);
    
    const slabR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.0, 0.1), woodSlabMat);
    slabR.position.set(0.7, 1.5, -0.05);
    portal.add(slabR);
    
    // Floating Monogram above door
    const charCode = sectionName.charAt(0).toUpperCase();
    const txtTexture = createTextTexture(charCode, 48, "#ffff55", "transparent", "center");
    const txtMat = new THREE.MeshBasicMaterial({ map: txtTexture, transparent: true, side: THREE.DoubleSide });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), txtMat);
    logoMesh.position.set(0, 3.9, 0);
    portal.add(logoMesh);
    
    scene.add(portal);
    
    // Floating text label
    const labelTexture = createTextTexture(sectionName.toUpperCase(), 24, "#ffaa00", "transparent", "center");
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true, side: THREE.DoubleSide });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), labelMat);
    labelMesh.position.set(labelPos.x, labelPos.y, labelPos.z);
    labelMesh.rotation.y = rotation;
    scene.add(labelMesh);
    
    doorPortals.push({
      id: sectionId,
      name: sectionName,
      x: x,
      z: z,
      rotation: rotation,
      leftSlab: slabL,
      rightSlab: slabR,
      logo: logoMesh,
      openProgress: 0,
      isOpen: false
    });
  }

  function createTextTexture(text, fontSize, color, bgColor, align) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, 256, 64);
    if (bgColor !== "transparent") {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 256, 64);
    }
    
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px 'VT323', monospace`;
    ctx.textBaseline = "middle";
    
    if (align === "center") {
      ctx.textAlign = "center";
      ctx.fillText(text, 128, 32);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(text, 16, 32);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter; // Sharp retro pixels!
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  /* BOWLING MINIGAME SETUP */
  function createBowlingLane() {
    const laneGroup = new THREE.Group();
    laneGroup.position.set(bowling.laneX, 0.05, 0); // Lane sits on the West side
    
    // Polished wood lane boards
    const woodMat = new THREE.MeshLambertMaterial({ color: 0xcd853f }); // Wood boards
    const laneMesh = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 24), woodMat);
    laneMesh.position.set(0, 0, -6.5);
    laneMesh.receiveShadow = true;
    laneGroup.add(laneMesh);
    
    // Gutters
    const gutterMat = new THREE.MeshLambertMaterial({ color: 0x1a1a24 });
    const gutL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 24), gutterMat);
    gutL.position.set(-3.4, -0.01, -6.5);
    laneGroup.add(gutL);
    
    const gutR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 24), gutterMat);
    gutR.position.set(3.4, -0.01, -6.5);
    laneGroup.add(gutR);
    
    // Bowling Ball (Solid Voxel Sphere Red)
    const ballGeo = new THREE.SphereGeometry(bowling.ballRadius, 8, 8);
    const ballMat = new THREE.MeshLambertMaterial({ color: 0xff2222 });
    bowling.ball = new THREE.Mesh(ballGeo, ballMat);
    bowling.ball.position.set(bowling.laneX, bowling.ballRadius + 0.1, bowling.startZ);
    bowling.ball.castShadow = true;
    scene.add(bowling.ball);
    
    // Voxel Pins (Cylindrical blocks stacked)
    const pinGeo = new THREE.CylinderGeometry(bowling.pinRadius, bowling.pinRadius * 1.2, 0.6, 6);
    const pinMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    
    // 10 pins triangle layout
    const pinOffsetZ = -14.0;
    const spacing = 0.6;
    const pinPositions = [
      { dx: 0, dz: 0 },
      { dx: -spacing/2, dz: -spacing }, { dx: spacing/2, dz: -spacing },
      { dx: -spacing, dz: -spacing*2 }, { dx: 0, dz: -spacing*2 }, { dx: spacing, dz: -spacing*2 },
      { dx: -spacing*1.5, dz: -spacing*3 }, { dx: -spacing/2, dz: -spacing*3 }, { dx: spacing/2, dz: -spacing*3 }, { dx: spacing*1.5, dz: -spacing*3 }
    ];
    
    pinPositions.forEach((pos, idx) => {
      const pinPivot = new THREE.Group();
      pinPivot.position.set(bowling.laneX + pos.dx, 0.1, pinOffsetZ + pos.dz);
      
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.y = 0.3; // Pivot at bottom
      pinMesh.castShadow = true;
      pinPivot.add(pinMesh);
      
      // Red collar stripe on pin
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(bowling.pinRadius * 1.05, bowling.pinRadius * 1.05, 0.08, 6), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      stripe.position.y = 0.45;
      pinPivot.add(stripe);
      
      scene.add(pinPivot);
      bowling.pins.push({
        pivot: pinPivot,
        origX: pinPivot.position.x,
        origZ: pinPivot.position.z,
        toppled: false,
        velocity: { x: 0, y: 0, z: 0 },
        rot: { x: 0, z: 0 }
      });
    });
    
    scene.add(laneGroup);
  }

  function resetPins() {
    bowling.pins.forEach(pin => {
      pin.pivot.position.set(pin.origX, 0.1, pin.origZ);
      pin.pivot.rotation.set(0, 0, 0);
      pin.toppled = false;
      pin.velocity = { x: 0, y: 0, z: 0 };
      pin.rot = { x: 0, z: 0 };
    });
    
    bowling.ball.position.set(bowling.laneX, bowling.ballRadius + 0.1, bowling.startZ);
    bowling.ballVelocity = { x: 0, z: 0 };
    bowling.physicsActive = false;
    bowling.throwCount = 0;
    bowling.pinsDown = 0;
    bowling.score = 0;
    bowling.state = "ready";
    
    document.getElementById("stat-throws").innerText = "0";
    document.getElementById("stat-score").innerText = "0";
    showTicker("Bowling game reset! Walk up to the ball to roll it.");
  }

  /* ARCHERY / TARGET SHOOTING ZONE */
  function createArcheryRange() {
    // We position the Archery boards on the East Wall (x = 15)
    const targetMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const bullseyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    const targetZPositions = [-10, -5, 5, 10];
    
    targetZPositions.forEach((z, idx) => {
      const stand = new THREE.Group();
      stand.position.set(13.8, 0, z);
      
      // Wooden support post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.0, 0.2), new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
      post.position.y = 1.0;
      stand.add(post);
      
      // Target board
      const boardGroup = new THREE.Group();
      boardGroup.position.y = 2.0;
      
      const whiteOuter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 1.2), targetMat);
      whiteOuter.castShadow = true;
      boardGroup.add(whiteOuter);
      
      const redCenter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.4), bullseyeMat);
      redCenter.position.x = 0.01;
      boardGroup.add(redCenter);
      
      stand.add(boardGroup);
      scene.add(stand);
      
      targets.push({
        group: stand,
        board: boardGroup,
        z: z,
        spinSpeed: 0,
        origY: boardGroup.position.y
      });
    });
  }

  function fireArrow() {
    if (!isGameActive || bowling.active || shootsLeft <= 0) return;
    
    shootsLeft--;
    showTicker(`Arrows: ${shootsLeft} | Score: ${score}`);
    
    // Shoot blocky arrow in looking direction
    const arrow = new THREE.Group();
    
    // Shaft (Yellow voxel)
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: 0xffff55 }));
    shaft.castShadow = true;
    arrow.add(shaft);
    
    // Tip (red box)
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tip.position.x = 0.35;
    arrow.add(tip);
    
    // Positioning at player's head level
    arrow.position.set(player.position.x, player.position.y + 1.6, player.position.z);
    
    // Calculate direction from camera target orientation
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraRotation.pitch);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.yaw);
    dir.normalize();
    
    // Rotate arrow to align with trajectory direction
    const arrowYaw = Math.atan2(-dir.z, dir.x);
    const arrowPitch = Math.asin(dir.y);
    arrow.rotation.y = arrowYaw;
    arrow.rotation.z = arrowPitch;
    
    scene.add(arrow);
    
    const arrowVel = dir.clone().multiplyScalar(0.4); // speed factor
    
    arrows.push({
      mesh: arrow,
      vel: { x: arrowVel.x, y: arrowVel.y, z: arrowVel.z },
      life: 180, // frames to live
      active: true
    });
  }

  /* VOXEL PARKOUR CHALLENGE SETUP */
  function createParkourChallenge() {
    const platformMat = new THREE.MeshLambertMaterial({ color: 0x8b5cf6 }); // Glowing purple stone
    
    // Landing start platform at Z = 5.0, X = 8.0
    parkourStartPlatform = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.5), platformMat);
    parkourStartPlatform.position.set(6, 0.2, 5);
    parkourStartPlatform.receiveShadow = true;
    scene.add(parkourStartPlatform);
    
    // Floating voxel blocks ascending in height
    // Step positions [x, y, z]
    const steps = [
      { x: 6, y: 1.0, z: 1.5 },
      { x: 9.2, y: 1.8, z: 1.0 },
      { x: 12.0, y: 2.6, z: -1.5 },
      { x: 9.0, y: 3.4, z: -4.0 },
      { x: 6.0, y: 4.2, z: -5.0 } // Top Platform with golden projects chest
    ];
    
    const stepMat = new THREE.MeshLambertMaterial({ color: 0xffff55 }); // Gold-yellow platforms
    steps.forEach((step, idx) => {
      const geo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
      const stepMesh = new THREE.Mesh(geo, stepMat);
      stepMesh.position.set(step.x, step.y, step.z);
      stepMesh.castShadow = true;
      stepMesh.receiveShadow = true;
      scene.add(stepMesh);
      
      parkourBlocks.push({
        mesh: stepMesh,
        x: step.x,
        y: step.y,
        z: step.z,
        size: 0.6 // half width bounds
      });
    });
    
    // Voxel Golden Chest on top platform (replaces project room door details)
    const chestGroup = new THREE.Group();
    chestGroup.position.set(6, 4.4, -5.0);
    
    // Base chest block
    const chestBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), new THREE.MeshLambertMaterial({ color: 0xcd7f32 })); // Bronze
    chestBase.castShadow = true;
    chestGroup.add(chestBase);
    
    // Gold bands
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.64, 0.1), new THREE.MeshLambertMaterial({ color: 0xffd700 }));
    band.position.set(0, 0, -0.15);
    chestGroup.add(band);
    
    const band2 = band.clone();
    band2.position.z = 0.15;
    chestGroup.add(band2);
    
    goldenChestMesh = chestGroup;
    scene.add(goldenChestMesh);
  }

  function setupListeners() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    const canvas = document.getElementById("game3d-canvas");
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    // Trigger Arrow Shooting on left click of canvas
    canvas.addEventListener("click", handleCanvasClick);
    
    window.addEventListener("resize", handleResize);
    document.getElementById("btn-bowling-reset").addEventListener("click", resetPins);
  }

  function removeListeners() {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    
    const canvas = document.getElementById("game3d-canvas");
    if (canvas) {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("click", handleCanvasClick);
    }
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("resize", handleResize);
    
    const btnReset = document.getElementById("btn-bowling-reset");
    if (btnReset) btnReset.removeEventListener("click", resetPins);
  }

  function handleKeyDown(e) {
    if (!isGameActive) return;
    
    const key = e.key.toLowerCase();
    
    if (key === "w" || e.key === "ArrowUp") { keys.w = true; activateKeyVisualizer("w", true); }
    if (key === "a" || e.key === "ArrowLeft") { keys.a = true; activateKeyVisualizer("a", true); }
    if (key === "s" || e.key === "ArrowDown") { keys.s = true; activateKeyVisualizer("s", true); }
    if (key === "d" || e.key === "ArrowRight") { keys.d = true; activateKeyVisualizer("d", true); }
    if (e.key === "Shift") { keys.Shift = true; }
    
    if (e.key === " " || key === "spacebar") {
      keys.Space = true;
      activateKeyVisualizer("space", true);
      e.preventDefault(); // prevent browser page scrolling
      
      // Trigger player jump
      if (player.isGrounded) {
        player.velocity.y = player.jumpForce;
        player.isGrounded = false;
      }
    }
    
    // Shoot arrow using 'F' key
    if (key === "f") {
      fireArrow();
    }
    
    if (e.key === "Escape") {
      close3DResumeGame();
    }
  }

  function handleKeyUp(e) {
    if (!isGameActive) return;
    
    const key = e.key.toLowerCase();
    if (key === "w" || e.key === "ArrowUp") { keys.w = false; activateKeyVisualizer("w", false); }
    if (key === "a" || e.key === "ArrowLeft") { keys.a = false; activateKeyVisualizer("a", false); }
    if (key === "s" || e.key === "ArrowDown") { keys.s = false; activateKeyVisualizer("s", false); }
    if (key === "d" || e.key === "ArrowRight") { keys.d = false; activateKeyVisualizer("d", false); }
    if (e.key === "Shift") { keys.Shift = false; }
    if (e.key === " ") { keys.Space = false; activateKeyVisualizer("space", false); }
  }

  function activateKeyVisualizer(keyId, active) {
    const el = document.getElementById("key-" + keyId);
    if (!el) return;
    if (active) el.classList.add("active");
    else el.classList.remove("active");
  }

  function handleMouseDown(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  function handleMouseMove(e) {
    if (!isDragging || !isGameActive) return;
    
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    // Orbit camera yaw & pitch around the player
    cameraRotation.yaw -= deltaX * 0.005;
    cameraRotation.pitch -= deltaY * 0.005;
    
    // Clamp pitch angles to avoid flipping camera upside down
    cameraRotation.pitch = Math.max(-Math.PI / 3, Math.min(-0.02, cameraRotation.pitch));
    
    previousMousePosition = { x: e.clientX, y: e.clientY };
  }

  function handleMouseUp() {
    isDragging = false;
  }
  
  function handleCanvasClick(e) {
    // Click fires arrow
    fireArrow();
  }

  function handleResize() {
    const container = document.getElementById("game-container");
    if (!container) return;
    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Position camera correctly orbiting the player character
  function updateCameraOrbit() {
    if (!playerGroup) return;
    
    // Calculate offsets based on pitch and yaw angles
    const offset = new THREE.Vector3(0, 0, cameraDistance);
    
    // Apply pitch (around X-axis) and yaw (around Y-axis) rotation
    offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), cameraRotation.pitch);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.yaw);
    
    // Position target (focus slightly above feet contact point)
    const target = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z);
    const desiredCameraPosition = target.clone().add(offset);
    
    // Smooth follow interpolation (lerp)
    camera.position.lerp(desiredCameraPosition, 0.15);
    camera.lookAt(target);
  }

  // Game loop tick
  function animate() {
    if (!isGameActive) return;
    animationFrameId = requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    // 1. Update Physics & Mechanics
    updatePlayerPhysics();
    updateLimbAnimations(time);
    updateCloudsMovement();
    updateArrowProjectiles();
    updateTargetRotations(time);
    updateBowlingMechanics();
    updatePortalDoorsAnimation();
    
    // 2. Camera follow update
    updateCameraOrbit();
    
    // 3. Render 3D Scene
    renderer.render(scene, camera);
    
    // 4. Update 2D Minimap HUD
    renderMinimap();
  }

  function updatePlayerPhysics() {
    // 1. Movement vector relative to camera direction
    const camDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.yaw).normalize();
    const camRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRotation.yaw).normalize();
    
    const moveDirection = new THREE.Vector3(0, 0, 0);
    
    if (keys.w) moveDirection.add(camDir);
    if (keys.s) moveDirection.add(camDir.clone().negate());
    if (keys.a) moveDirection.add(camRight.clone().negate());
    if (keys.d) moveDirection.add(camRight);
    
    let isMoving = false;
    let speed = keys.Shift ? player.runSpeed : player.speed;
    
    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      
      // Update velocity on XZ plane
      player.velocity.x = moveDirection.x * speed;
      player.velocity.z = moveDirection.z * speed;
      isMoving = true;
      
      // Make player face the direction they are walking
      player.yaw = Math.atan2(moveDirection.x, moveDirection.z);
      playerGroup.rotation.y = player.yaw;
    } else {
      player.velocity.x = 0;
      player.velocity.z = 0;
    }
    
    // 2. Vertical Jump physics (gravity)
    if (!player.isGrounded) {
      player.velocity.y -= GRAVITY;
    }
    
    // Propose next position coordinates
    let nextX = player.position.x + player.velocity.x;
    let nextY = player.position.y + player.velocity.y;
    let nextZ = player.position.z + player.velocity.z;
    
    // 3. Environment collision testing
    
    // Ground level floor bounds checking
    if (nextY <= 0) {
      nextY = 0;
      player.velocity.y = 0;
      player.isGrounded = true;
    }
    
    // Parkour floating blocks check
    // Only check collision if we are falling (vertical velocity is negative or zero)
    if (player.velocity.y <= 0) {
      let landedOnBlock = false;
      for (let i = 0; i < parkourBlocks.length; i++) {
        const b = parkourBlocks[i];
        
        // Horizontal distance bounds
        const dx = Math.abs(nextX - b.x);
        const dz = Math.abs(nextZ - b.z);
        
        // If player feet overlap block top y-surface
        if (dx < b.size + 0.25 && dz < b.size + 0.25) {
          const blockTopY = b.y + 0.15; // Platform top boundary
          // Check if player's current y is slightly above the block top and falling past it
          if (player.position.y >= blockTopY - 0.2 && nextY <= blockTopY) {
            nextY = blockTopY;
            player.velocity.y = 0;
            player.isGrounded = true;
            landedOnBlock = true;
            break;
          }
        }
      }
    }
    
    // 4. Boundary walls constraint check
    if (nextX < roomBounds.minX) nextX = roomBounds.minX;
    if (nextX > roomBounds.maxX) nextX = roomBounds.maxX;
    if (nextZ < roomBounds.minZ) nextZ = roomBounds.minZ;
    if (nextZ > roomBounds.maxZ) nextZ = roomBounds.maxZ;
    
    // Center monolith pedestal column collision (radius 1.5)
    const distToCenter = Math.sqrt(nextX*nextX + nextZ*nextZ);
    if (distToCenter < 1.5) {
      const angle = Math.atan2(nextZ, nextX);
      nextX = Math.cos(angle) * 1.5;
      nextZ = Math.sin(angle) * 1.5;
    }
    
    // Update player coordinates
    player.position.x = nextX;
    player.position.y = nextY;
    player.position.z = nextZ;
    
    // Set 3D model group position
    if (playerGroup) {
      playerGroup.position.set(player.position.x, player.position.y, player.position.z);
    }
  }

  /* Swings limbs dynamically when player moves */
  function updateLimbAnimations(time) {
    if (!playerGroup) return;
    
    const speed2D = Math.sqrt(player.velocity.x*player.velocity.x + player.velocity.z*player.velocity.z);
    const swingSpeed = keys.Shift ? 18.0 : 12.0;
    const maxSwing = keys.Shift ? 0.8 : 0.5;
    
    if (speed2D > 0.01 && player.isGrounded) {
      // Swing legs
      leftLegGroup.rotation.x = Math.sin(time * swingSpeed) * maxSwing;
      rightLegGroup.rotation.x = -Math.sin(time * swingSpeed) * maxSwing;
      
      // Swing arms in opposition to legs
      leftArmGroup.rotation.x = -Math.sin(time * swingSpeed) * maxSwing;
      rightArmGroup.rotation.x = Math.sin(time * swingSpeed) * maxSwing;
      
      // Gentle head bobbing
      headMesh.position.y = 1.7 + Math.sin(time * swingSpeed * 2) * 0.02;
    } else {
      // Idle pose reset
      leftLegGroup.rotation.x = 0;
      rightLegGroup.rotation.x = 0;
      leftArmGroup.rotation.x = 0;
      rightArmGroup.rotation.x = 0;
      headMesh.position.y = 1.7;
    }
    
    // Jump pose adjustment
    if (!player.isGrounded) {
      leftLegGroup.rotation.x = -0.3;
      rightLegGroup.rotation.x = 0.2;
      leftArmGroup.rotation.x = 0.4;
      rightArmGroup.rotation.x = -0.4;
    }
  }

  function updateCloudsMovement() {
    voxelClouds.forEach(cloud => {
      cloud.position.x += 0.01;
      // Loop around if clouds fly off map
      if (cloud.position.x > 30) {
        cloud.position.x = -30;
      }
    });
  }

  /* UPDATE FIRED ARROW TRAJECTORY & TARGET HIT CHECKS */
  function updateArrowProjectiles() {
    for (let i = arrows.length - 1; i >= 0; i--) {
      const a = arrows[i];
      if (!a.active) continue;
      
      a.mesh.position.x += a.vel.x;
      a.mesh.position.y += a.vel.y;
      a.mesh.position.z += a.vel.z;
      
      // Gravity pulling arrow down
      a.vel.y -= 0.005;
      
      // Rotate arrow tip down along arc
      const angle = Math.atan2(a.vel.y, Math.sqrt(a.vel.x*a.vel.x + a.vel.z*a.vel.z));
      a.mesh.rotation.z = angle;
      
      a.life--;
      
      // Hit target check (East Wall z range bounds)
      let hit = false;
      for (let j = 0; j < targets.length; j++) {
        const t = targets[j];
        const dx = Math.abs(a.mesh.position.x - t.group.position.x);
        const dy = Math.abs(a.mesh.position.y - (t.group.position.y + 2.0));
        const dz = Math.abs(a.mesh.position.z - t.group.position.z);
        
        // Target block sizes are 1.2x1.2
        if (dx < 0.4 && dy < 0.6 && dz < 0.6) {
          // Play target spin animation
          t.spinSpeed = 0.2;
          hit = true;
          
          // Calculate score based on center proximity
          const radiusOffset = Math.sqrt(dy*dy + dz*dz);
          let points = 10;
          if (radiusOffset < 0.2) {
            points = 50; // Bullseye!
            showTicker("BULLSEYE! +50 Points");
          } else {
            showTicker("Target Hit! +10 Points");
          }
          score += points;
          break;
        }
      }
      
      // Collision with floor or bounds limits
      if (hit || a.mesh.position.y <= 0.1 || a.life <= 0 || Math.abs(a.mesh.position.x) > 16 || Math.abs(a.mesh.position.z) > 16) {
        scene.remove(a.mesh);
        arrows.splice(i, 1);
      }
    }
  }

  function updateTargetRotations(time) {
    targets.forEach(t => {
      // Spin target when hit
      if (t.spinSpeed > 0.01) {
        t.board.rotation.y += t.spinSpeed;
        t.spinSpeed *= 0.95; // dampening friction
      } else {
        t.board.rotation.y = 0;
      }
      
      // Gentle idle vertical bobbing
      t.board.position.y = t.origY + Math.sin(time * 2.0 + t.z) * 0.1;
    });
  }

  /* VOXEL BOWLING MINIGAME PHYSICS MECHANICAL HOOK */
  function updateBowlingMechanics() {
    const ball = bowling.ball;
    if (!ball) return;
    
    // Track distance between player feet and bowling ball
    const dx = ball.position.x - player.position.x;
    const dz = ball.position.z - player.position.z;
    const distToBall = Math.sqrt(dx*dx + dz*dz);
    
    // Kick trigger: if player runs into the ball, push it forward
    if (distToBall < player.width + bowling.ballRadius && !bowling.physicsActive) {
      const angle = Math.atan2(dz, dx);
      // Push ball in direction player was heading, else directly away from player
      const pushForce = keys.Shift ? 0.35 : 0.22;
      bowling.ballVelocity.x = Math.sin(player.yaw) * pushForce;
      bowling.ballVelocity.z = -Math.cos(player.yaw) * pushForce;
      
      // Limit trajectory to rolling down the lane (-Z)
      if (bowling.ballVelocity.z > -0.05) {
        bowling.ballVelocity.z = -pushForce; // force forward push
      }
      
      bowling.physicsActive = true;
      bowling.throwCount++;
      document.getElementById("stat-throws").innerText = bowling.throwCount;
      document.getElementById("hud-bowling").classList.add("active");
      
      showTicker("Ball rolled! Keep watching...");
    }
    
    // Roll physics
    if (bowling.physicsActive) {
      ball.position.x += bowling.ballVelocity.x;
      ball.position.z += bowling.ballVelocity.z;
      
      // Roll ball rotation mesh
      ball.rotation.x -= bowling.ballVelocity.z / bowling.ballRadius;
      ball.rotation.z += bowling.ballVelocity.x / bowling.ballRadius;
      
      // Apply friction slowing down ball horizontal drift
      bowling.ballVelocity.x *= 0.98;
      
      // Gutter detection (edges of wood lane at X = -24)
      const relativeX = ball.position.x - bowling.laneX;
      if (Math.abs(relativeX) > 3.0) {
        // Gutter ball!
        bowling.ballVelocity.x = 0;
        ball.position.x = bowling.laneX + (relativeX > 0 ? 3.2 : -3.2); // Snap to gutter channel
      }
      
      // Hit pin detection (Z range around -14.0)
      bowling.pins.forEach(pin => {
        if (pin.toppled) return;
        
        const pinDx = pin.pivot.position.x - ball.position.x;
        const pinDz = pin.pivot.position.z - ball.position.z;
        const dist = Math.sqrt(pinDx*pinDx + pinDz*pinDz);
        
        if (dist < bowling.ballRadius + bowling.pinRadius) {
          // Collision! Topple pin
          pin.toppled = true;
          bowling.pinsDown++;
          bowling.score += 10;
          
          // Transfer momentum speed
          pin.velocity.x = (pin.pivot.position.x - ball.position.x) * 0.4 + bowling.ballVelocity.x * 0.3;
          pin.velocity.z = bowling.ballVelocity.z * 0.4;
          
          // Redraw score card
          document.getElementById("stat-score").innerText = bowling.score;
        }
      });
      
      // Chain reactions: Pin to Pin collision
      for (let i = 0; i < bowling.pins.length; i++) {
        const pinA = bowling.pins[i];
        if (!pinA.toppled) continue;
        
        for (let j = 0; j < bowling.pins.length; j++) {
          if (i === j) continue;
          const pinB = bowling.pins[j];
          if (pinB.toppled) continue;
          
          const pdx = pinB.pivot.position.x - pinA.pivot.position.x;
          const pdz = pinB.pivot.position.z - pinA.pivot.position.z;
          const pdist = Math.sqrt(pdx*pdx + pdz*pdz);
          
          if (pdist < bowling.pinRadius * 2.5) {
            pinB.toppled = true;
            bowling.pinsDown++;
            bowling.score += 10;
            
            pinB.velocity.x = pdx * 0.3 + pinA.velocity.x * 0.4;
            pinB.velocity.z = pdz * 0.3 + pinA.velocity.z * 0.4;
            
            document.getElementById("stat-score").innerText = bowling.score;
          }
        }
      }
      
      // Check boundaries / Reset ball
      if (ball.position.z < bowling.endZ || ball.position.y < -2.0) {
        bowling.physicsActive = false;
        
        // Check for strike!
        let standing = bowling.pins.filter(p => !p.toppled).length;
        if (standing === 0) {
          triggerStrikeNotification();
        }
        
        // Auto Reset ball in 2 seconds
        setTimeout(() => {
          ball.position.set(bowling.laneX, bowling.ballRadius + 0.1, bowling.startZ);
          bowling.ballVelocity = { x: 0, z: 0 };
        }, 2000);
      }
    }
    
    // Animate toppling pins
    bowling.pins.forEach(pin => {
      if (pin.toppled) {
        // Integrate toppling velocity
        pin.pivot.position.x += pin.velocity.x;
        pin.pivot.position.z += pin.velocity.z;
        
        // Apply friction
        pin.velocity.x *= 0.95;
        pin.velocity.z *= 0.95;
        
        // Rotate down flat
        if (pin.rot.x < Math.PI / 2) {
          pin.rot.x += 0.08;
          pin.pivot.rotation.x = pin.rot.x;
        }
      }
    });
  }

  function triggerStrikeNotification() {
    const overlay = document.getElementById("strike-overlay");
    overlay.classList.add("show");
    setTimeout(() => {
      overlay.classList.remove("show");
    }, 2200);
  }

  /* UPDATE PROXIMITY PORTALS DOORS ANIMATIONS */
  function updatePortalDoorsAnimation() {
    let activeDoorId = null;
    let closestDist = 999;
    
    doorPortals.forEach(door => {
      // Distance check XZ plane
      const dx = door.x - player.position.x;
      const dz = door.z - player.position.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      
      const inRange = (dist < 3.2);
      
      if (inRange && dist < closestDist) {
        closestDist = dist;
        activeDoorId = door.id;
      }
      
      // Animate slabs slide
      if (inRange) {
        door.openProgress = Math.min(1.0, door.openProgress + 0.08);
      } else {
        door.openProgress = Math.max(0.0, door.openProgress - 0.08);
      }
      
      // Separate slabs on X axis
      const slide = door.openProgress * 1.2;
      door.leftSlab.position.x = -0.7 - slide;
      door.rightSlab.position.x = 0.7 + slide;
      
      // Spin indicators
      door.logo.rotation.y += 0.015;
    });
    
    // Proximity to golden projects chest (parkour reward)
    const chestDx = goldenChestMesh.position.x - player.position.x;
    const chestDz = goldenChestMesh.position.z - player.position.z;
    const chestDist = Math.sqrt(chestDx*chestDx + chestDz*chestDz);
    const inChestRange = (chestDist < 2.5 && player.position.y > 3.8); // Top platform height
    
    if (inChestRange) {
      activeDoorId = "projects";
    }
    
    // Proximity to center pedestal (Personal info)
    const distToPedestal = Math.sqrt(player.position.x*player.position.x + player.position.z*player.position.z);
    if (distToPedestal < 2.5 && activeDoorId === null) {
      activeDoorId = "personal";
    }
    
    // Handle HUD info panel display
    if (activeDoorId !== activeSectionId) {
      activeSectionId = activeDoorId;
      if (activeSectionId !== null) {
        displaySectionHUD(activeSectionId);
      } else {
        document.getElementById("hud-details").classList.remove("active");
      }
    }
    
    // Spin center crystal
    if (centerPedestalGroup) {
      const crystal = centerPedestalGroup.getObjectByName("crystal");
      if (crystal) {
        crystal.rotation.x += 0.01;
        crystal.rotation.y += 0.015;
        crystal.position.y = 1.6 + Math.sin(Date.now() * 0.002) * 0.12;
      }
      
      const nameplate = centerPedestalGroup.getObjectByName("nameplate");
      if (nameplate) {
        // Face the camera direction
        nameplate.lookAt(camera.position);
      }
    }
  }

  function displaySectionHUD(secId) {
    const detailsPanel = document.getElementById("hud-details");
    const titleEl = document.getElementById("hud-title");
    const contentEl = document.getElementById("hud-content");
    
    let html = "";
    
    if (secId === "personal") {
      const p = window.resumeData?.personal || {};
      titleEl.innerText = p.name || "PERSONAL INFO";
      html = `
        <div class="detail-card">
          <h4>${p.title || 'Explorer'}</h4>
          <div class="detail-meta">${p.email || ''}</div>
          <div class="detail-meta">${p.phone || ''}</div>
          <div class="detail-meta">${p.location || ''}</div>
          <div class="detail-meta">${p.website || ''}</div>
        </div>
      `;
    } else {
      // Find matches in dynamic sections list
      const dataSections = window.resumeData?.sections || [];
      const sec = dataSections.find(s => s.id === secId);
      if (!sec) {
        titleEl.innerText = secId.toUpperCase();
        contentEl.innerHTML = "<div class='detail-card'>No content available.</div>";
        return;
      }
      
      titleEl.innerText = sec.name.toUpperCase();
      
      if (sec.id === "skills") {
        html = "";
        if (sec.categories) {
          sec.categories.forEach(cat => {
            html += `
              <div class="detail-card">
                <h4>${cat.name}</h4>
                <div class="skills-badge-list">
                  ${(cat.tags || []).map(t => `<span class="skill-tag-badge">${t}</span>`).join('')}
                </div>
              </div>
            `;
          });
        }
      } else {
        // General text block lists (Experience, Projects, Education)
        (sec.items || []).forEach(item => {
          html += `
            <div class="detail-card">
              <h4>${item.title || item.degree || item.name}</h4>
              <div class="detail-meta">${item.company || item.institution || ''} ${item.period || item.year || ''}</div>
              ${item.description ? `<p>${item.description}</p>` : ''}
              ${item.bullets ? `
                <ul class="detail-bullets">
                  ${item.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
        });
      }
    }
    
    contentEl.innerHTML = html;
    detailsPanel.classList.add("active");
  }

  /* RENDER RETRO 2D MINIMAP HUD CANVAS */
  function renderMinimap() {
    if (!minimapCtx) return;
    
    const w = minimapCanvas.width;
    const h = minimapCanvas.height;
    
    // Clear canvas
    minimapCtx.fillStyle = "#1e1f26";
    minimapCtx.fillRect(0, 0, w, h);
    
    // Draw boundary border
    minimapCtx.strokeStyle = "#ffaa00";
    minimapCtx.lineWidth = 4;
    minimapCtx.strokeRect(0, 0, w, h);
    
    // Center is (w/2, h/2) representing (0,0) in world coordinates. Scale factor
    // World bounds are [-15, 15] x [-15, 15]
    const centerX = w / 2;
    const centerZ = h / 2;
    const scale = w / 34; // scale multiplier
    
    // 1. Draw Portal markers (pavilions)
    minimapCtx.fillStyle = "#8b5cf6"; // Purple portal dots
    doorPortals.forEach(door => {
      const mx = centerX + door.x * scale;
      const mz = centerZ + door.z * scale;
      
      minimapCtx.beginPath();
      minimapCtx.arc(mx, mz, 5, 0, Math.PI * 2);
      minimapCtx.fill();
      
      // Draw first char code of sections above dot
      minimapCtx.fillStyle = "#ffffff";
      minimapCtx.font = "bold 9px monospace";
      minimapCtx.textAlign = "center";
      minimapCtx.fillText(door.name.charAt(0).toUpperCase(), mx, mz + 3);
      minimapCtx.fillStyle = "#8b5cf6";
    });
    
    // 2. Draw Bowling Alley zone
    minimapCtx.fillStyle = "#ff5555";
    const bowlX = centerX + bowling.laneX * scale;
    minimapCtx.fillRect(bowlX - 4, centerZ - 20, 8, 40);
    
    // 3. Draw Parkour platforms
    minimapCtx.fillStyle = "#ffff55";
    parkourBlocks.forEach(b => {
      const bx = centerX + b.x * scale;
      const bz = centerZ + b.z * scale;
      minimapCtx.fillRect(bx - 3, bz - 3, 6, 6);
    });
    
    // 4. Center Pedestal (personal info)
    minimapCtx.fillStyle = "#00ffff";
    minimapCtx.beginPath();
    minimapCtx.arc(centerX, centerZ, 6, 0, Math.PI * 2);
    minimapCtx.fill();
    
    // 5. Draw Player pointer
    const px = centerX + player.position.x * scale;
    const pz = centerZ + player.position.z * scale;
    
    minimapCtx.save();
    minimapCtx.translate(px, pz);
    minimapCtx.rotate(player.yaw); // Rotation facing direction
    
    // Draw triangle player arrow pointer
    minimapCtx.fillStyle = "#55ff55"; // Green arrow
    minimapCtx.beginPath();
    minimapCtx.moveTo(0, -6);
    minimapCtx.lineTo(-4, 4);
    minimapCtx.lineTo(4, 4);
    minimapCtx.closePath();
    minimapCtx.fill();
    
    minimapCtx.restore();
  }

  function showTicker(text) {
    const el = document.getElementById("ticker-text");
    if (el) el.innerText = text;
  }

  /* DEALLOCATE WEBGL SCENE GEOMETRIES/MATERIALS TO PREVENT MEMORY LEAKS */
  function disposeScene() {
    if (!scene) return;
    
    scene.traverse(node => {
      if (node.isMesh) {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(disposeMaterial);
          } else {
            disposeMaterial(node.material);
          }
        }
      }
    });
    
    if (renderer) renderer.dispose();
    
    // Clear references
    scene = null;
    camera = null;
    renderer = null;
     playerGroup = null;
     doorPortals = [];
     targets.length = 0;
     arrows.length = 0;
     parkourBlocks.length = 0;
     bowling.ball = null;
     bowling.pins = [];
  }
  
  function disposeMaterial(mat) {
    if (mat.map) mat.map.dispose();
    if (mat.lightMap) mat.lightMap.dispose();
    if (mat.bumpMap) mat.bumpMap.dispose();
    if (mat.normalMap) mat.normalMap.dispose();
    if (mat.specularMap) mat.specularMap.dispose();
    if (mat.envMap) mat.envMap.dispose();
    mat.dispose();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btnPlay = document.getElementById("btnPlay3D");
    if (btnPlay) btnPlay.addEventListener("click", window.start3DResumeGame);
    
    const btnPlayToolbar = document.getElementById("btnPlay3DToolbar");
    if (btnPlayToolbar) btnPlayToolbar.addEventListener("click", window.start3DResumeGame);
  });
})();
