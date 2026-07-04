# Voxel 3D Career Game Mode (3rd Person Explorer)

An interactive, Minecraft-inspired 3D WebGL Career Game that converts your resume content into a playable voxel adventure world. Control a blocky player character, jump across floating parkour blocks to find project chests, shoot arrows at target boards, and kick a voxel bowling ball to knock down blocky pins!

---

## 🎮 How to Play

### 1. Character Controls
* **Move Around**: Use the **`W`, `A`, `S`, `D`** keys (or **Arrow Keys**).
* **Sprint**: Hold down the **`Left Shift`** key while walking.
* **Jump**: Press the **`Spacebar`** to jump. You can jump onto the ground or up floating parkour blocks!
* **Shoot Targets**: Left-click the screen or press the **`F`** key to shoot blocky arrows in the direction you are looking.
* **Orbit Camera**: Click and drag your mouse/trackpad anywhere on the screen to rotate the camera around your character. The player character automatically turns to face the direction of movement.

### 2. Gallery Exploration & Pavilions
* **Lobby Pedestal**: The center of the gallery has a cylinder pedestal with a floating nameplate displaying your name and a rotating cyan crystal.
* **Resume Pavilions**: Labeled rooms (Experience, Skills, Education) sit around the perimeter. Walk up to the sliding wooden doors; they will automatically slide open, and a retro parchment-style details panel will display the resume data.
* **Minimap HUD**: A dynamic pixelated minimap is rendered in the bottom-left corner showing the player (green arrow) and room markers.

### 3. Voxel Mini-Games
* **Target Shooting**: On the East Wall, there are rotating targets. Face them and left-click/press `F` to fire blocky arrows. Bullseyes yield +50 points!
* **Parkour Challenge**: Climb the floating yellow/purple steps to reach the high platform. Open the golden chest at the top to display your Projects section.
* **Bowling Minigame**: Head to the West side lane. Simply walk or run into the red bowling ball to kick it down the lane and topple the blocky white pins! Click **Reset Game** on the bottom HUD to rack them up again.

---

## 🛠️ Technical Design & Architecture

### 1. Voxel Player & World Geometry
To achieve rapid loading (<50ms) and eliminate local server CORS bugs, all meshes (limbs, trees, grass tiles, pins) are built procedurally using Three.js `BoxGeometry` and dynamic canvas-generated textures. The character limbs swing dynamically in relation to player velocity using trigonometric curves.

### 2. 3rd-Person Orbital Follow Camera
The camera is set to orbit behind the player at a fixed distance. Dragging the mouse alters the target pitch and yaw angles, and the camera position is updated using smooth interpolation (`Vector3.lerp`) toward the calculated offset relative to the player's position.

### 3. Collision & Physics
* **XZ Plane Bounds**: Limits character movements to the main museum area.
* **Pedestal Column**: Sliding circular collision boundaries at the center.
* **Parkour Platforms**: Detects overlap between player feet and platform bounding boxes, allowing the player to land and stand on floating blocks.
* **Newtonian Mechanics**: Updates bowling ball positions, gutters, and pin collisions using Euler integration and momemtum transfer.

### 4. Memory Management & Teardown
When closing the game (clicking the top-right exit button or pressing `Escape`):
* The animation frame loop is cancelled.
* All window event listeners are removed.
* Geometries, materials, and textures are explicitly `.dispose()`ed to free WebGL GPU memory.

---

## 🚀 Run locally

Run a local Python server:
```bash
python3 -m http.server 8080 --directory editable_resume/
```
Then navigate to `http://localhost:8080` in your web browser. Bumping the resource versions (e.g. `?v=15`) in `index.html` prevents stale caches.
ost:8080`.
