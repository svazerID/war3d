import * as THREE from 'three';
import { GameMode, BotDifficulty, RocketTypeId, PlayerProfile, KillFeedItem, MatchStats } from '../types/game';
import { PlayerVehicle } from './PlayerController';
import { BotVehicle } from './BotAI';
import { RocketSystem, ObstacleBox, DamageableEntity } from './RocketSystem';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../sound/audioManager';

export interface PickupItem {
  id: string;
  type: 'health' | 'shield' | 'boost';
  position: THREE.Vector3;
  mesh: THREE.Group;
  active: boolean;
  respawnTimer: number;
}

export interface EngineCallbacks {
  onScoreUpdate: (score: number, kills: number, deaths: number) => void;
  onPlayerHpUpdate: (hp: number, maxHp: number, shield: number, maxShield: number) => void;
  onPlayer2HpUpdate?: (hp: number, maxHp: number, shield: number, maxShield: number) => void;
  onKillFeed: (item: KillFeedItem) => void;
  onGameOver: (stats: MatchStats) => void;
  onWaveComplete?: (wave: number) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  public particleSystem: ParticleSystem;
  public rocketSystem: RocketSystem;

  public player1!: PlayerVehicle;
  public player2?: PlayerVehicle;
  public bots: BotVehicle[] = [];
  public obstacles: ObstacleBox[] = [];
  public pickups: PickupItem[] = [];
  public lockOnReticle!: THREE.Group;

  private mode: GameMode;
  public profile: PlayerProfile;
  private callbacks: EngineCallbacks;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;

  // Stats
  public p1Kills: number = 0;
  public p1Deaths: number = 0;
  public p1Score: number = 0;
  public p1DamageDealt: number = 0;
  public p1RocketsFired: number = 0;
  public p1RocketsHit: number = 0;
  public currentWave: number = 1;
  public matchDuration: number = 0;

  // Screen shake
  private screenShakeIntensity: number = 0;

  // Input states
  public p1Input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0 };
  public p2Input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0 };

  constructor(
    container: HTMLElement,
    mode: GameMode,
    difficulty: BotDifficulty,
    profile: PlayerProfile,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.mode = mode;
    this.profile = profile;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.012);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.5, 200);

    // 2. Renderer (Mobile Optimized)
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    // 3. Subsystems
    this.particleSystem = new ParticleSystem(this.scene);
    this.rocketSystem = new RocketSystem(this.scene, this.particleSystem);

    // 4. Build Environment & Entities
    this.initLighting();
    this.initArena();
    this.initPickups();
    this.initEntities(difficulty);
    this.initLockOnReticle();

    // 5. Resize listener
    window.addEventListener('resize', this.handleResize);

    this.isRunning = true;
    this.loop();
  }

  private handleResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initLighting() {
    const ambient = new THREE.AmbientLight(0x475569, 1.2);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
    dirLight.position.set(25, 45, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 140;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    this.scene.add(dirLight);

    // Soft colored atmosphere lights
    const bluePoint = new THREE.PointLight(0x0284c7, 3, 60);
    bluePoint.position.set(-35, 12, -35);
    this.scene.add(bluePoint);

    const orangePoint = new THREE.PointLight(0xea580c, 3, 60);
    orangePoint.position.set(35, 12, 35);
    this.scene.add(orangePoint);
  }

  private initArena() {
    // Ground Grid with Sci-Fi textures
    const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid lines on top of ground
    const gridHelper = new THREE.GridHelper(100, 25, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.05;
    this.scene.add(gridHelper);

    // Perimeter Forcefield Walls
    const wallHeight = 4.5;
    const wallThick = 2.0;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.7,
    });
    const neonWallMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    const createWall = (x: number, z: number, w: number, d: number) => {
      const geo = new THREE.BoxGeometry(w, wallHeight, d);
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(x, wallHeight / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.scene.add(wall);

      // Neon rim
      const rimGeo = new THREE.BoxGeometry(w + 0.2, 0.3, d + 0.2);
      const rim = new THREE.Mesh(rimGeo, neonWallMat);
      rim.position.set(x, wallHeight + 0.15, z);
      this.scene.add(rim);

      // Register collision obstacle
      this.obstacles.push({
        id: `wall_${x}_${z}`,
        min: new THREE.Vector3(x - w / 2, 0, z - d / 2),
        max: new THREE.Vector3(x + w / 2, wallHeight, z + d / 2),
      });
    };

    createWall(0, -50, 100, wallThick); // North
    createWall(0, 50, 100, wallThick);  // South
    createWall(-50, 0, wallThick, 100); // West
    createWall(50, 0, wallThick, 100);  // East

    // Tactical Obstacles Inside Arena
    const bunkerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.3 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.5 });
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });

    const addBunker = (bx: number, bz: number, bw: number, bd: number, bh: number) => {
      const bGeo = new THREE.BoxGeometry(bw, bh, bd);
      const bMesh = new THREE.Mesh(bGeo, bunkerMat);
      bMesh.position.set(bx, bh / 2, bz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.scene.add(bMesh);

      // Glowing hazard strip
      const stripGeo = new THREE.BoxGeometry(bw + 0.1, 0.4, bd + 0.1);
      const stripMesh = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
      stripMesh.position.set(bx, bh * 0.75, bz);
      this.scene.add(stripMesh);

      this.obstacles.push({
        id: `bunker_${bx}_${bz}`,
        min: new THREE.Vector3(bx - bw / 2, 0, bz - bd / 2),
        max: new THREE.Vector3(bx + bw / 2, bh, bz + bd / 2),
      });
    };

    // 4 Corner Fortress Bastions
    addBunker(-22, -22, 10, 8, 4.0);
    addBunker(22, -22, 10, 8, 4.0);
    addBunker(-22, 22, 10, 8, 4.0);
    addBunker(22, 22, 10, 8, 4.0);

    // Center Hexagonal Power Obelisk
    const centerGeo = new THREE.CylinderGeometry(3.5, 4.5, 5.0, 6);
    const centerObelisk = new THREE.Mesh(centerGeo, bunkerMat);
    centerObelisk.position.set(0, 2.5, 0);
    centerObelisk.castShadow = true;
    this.scene.add(centerObelisk);

    const centerGlowGeo = new THREE.CylinderGeometry(1.5, 1.5, 5.5, 6);
    const centerGlow = new THREE.Mesh(centerGlowGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
    centerGlow.position.set(0, 2.5, 0);
    this.scene.add(centerGlow);

    this.obstacles.push({
      id: 'center_obelisk',
      min: new THREE.Vector3(-4, 0, -4),
      max: new THREE.Vector3(4, 5.5, 4),
    });

    // Outer Cover Blocks / Containers
    const containerLayout = [
      { x: 0, z: -25, w: 12, d: 3, h: 3 },
      { x: 0, z: 25, w: 12, d: 3, h: 3 },
      { x: -30, z: 0, w: 3, d: 12, h: 3 },
      { x: 30, z: 0, w: 3, d: 12, h: 3 },
    ];
    containerLayout.forEach((c) => {
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(c.w, c.h, c.d), crateMat);
      cMesh.position.set(c.x, c.h / 2, c.z);
      cMesh.castShadow = true;
      this.scene.add(cMesh);

      this.obstacles.push({
        id: `crate_${c.x}_${c.z}`,
        min: new THREE.Vector3(c.x - c.w / 2, 0, c.z - c.d / 2),
        max: new THREE.Vector3(c.x + c.w / 2, c.h, c.z + c.d / 2),
      });
    });
  }

  private initPickups() {
    const pickupLocations: { x: number; z: number; type: 'health' | 'shield' | 'boost' }[] = [
      { x: 0, z: -14, type: 'shield' },
      { x: 0, z: 14, type: 'health' },
      { x: -14, z: 0, type: 'boost' },
      { x: 14, z: 0, type: 'boost' },
      { x: -32, z: -32, type: 'health' },
      { x: 32, z: 32, type: 'shield' },
    ];

    pickupLocations.forEach((loc, idx) => {
      const grp = new THREE.Group();
      grp.position.set(loc.x, 1.2, loc.z);

      let hex = 0x22c55e;
      let innerGeo: THREE.BufferGeometry = new THREE.OctahedronGeometry(0.8, 0);

      if (loc.type === 'shield') {
        hex = 0x06b6d4;
        innerGeo = new THREE.IcosahedronGeometry(0.8, 0);
      } else if (loc.type === 'boost') {
        hex = 0xf59e0b;
        innerGeo = new THREE.TetrahedronGeometry(0.85, 0);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: hex,
        emissive: hex,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(innerGeo, mat);
      grp.add(mesh);

      // Light glow
      const pl = new THREE.PointLight(hex, 1.5, 6);
      grp.add(pl);

      // Ground pedestal circle
      const baseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.2, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -1.1;
      grp.add(baseMesh);

      this.scene.add(grp);

      this.pickups.push({
        id: `p_${idx}`,
        type: loc.type,
        position: new THREE.Vector3(loc.x, 1.2, loc.z),
        mesh: grp,
        active: true,
        respawnTimer: 0,
      });
    });
  }

  private initEntities(difficulty: BotDifficulty) {
    // Player 1
    const p1Spawn = new THREE.Vector3(0, 0.7, -35);
    this.player1 = new PlayerVehicle('player1', this.profile.name, 1, p1Spawn, this.profile, this.scene, this.particleSystem);

    // Player 2 (Co-op or Duel mode)
    if (this.mode === 'coop_survival' || this.mode === 'duel_pvp') {
      const p2Spawn = this.mode === 'duel_pvp' ? new THREE.Vector3(0, 0.7, 35) : new THREE.Vector3(8, 0.7, -35);
      this.player2 = new PlayerVehicle('player2', 'Pilot-2', 2, p2Spawn, this.profile, this.scene, this.particleSystem);
    }

    // AI Bots
    const botCount = this.mode === 'duel_pvp' ? 0 : this.mode === 'coop_survival' ? 5 : 4;
    const botSpawns = [
      new THREE.Vector3(-25, 0.7, 25),
      new THREE.Vector3(25, 0.7, 25),
      new THREE.Vector3(0, 0.7, 35),
      new THREE.Vector3(-30, 0.7, -5),
      new THREE.Vector3(30, 0.7, -5),
      new THREE.Vector3(-15, 0.7, 10),
    ];

    const botNames = ['Titan-09', 'Apex-Sentinel', 'Viper-X', 'Phantom-01', 'Neon-Fury', 'Ghost-Unit'];

    for (let i = 0; i < botCount; i++) {
      const spawn = botSpawns[i % botSpawns.length].clone();
      const bot = new BotVehicle(
        `bot_${i}`,
        botNames[i % botNames.length],
        difficulty,
        spawn,
        this.scene,
        this.particleSystem
      );
      this.bots.push(bot);
    }
  }

  private initLockOnReticle() {
    const grp = new THREE.Group();
    grp.position.set(0, 0.25, 0);

    // Glowing red targeting circle
    const ringGeo = new THREE.RingGeometry(2.1, 2.3, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    grp.add(ring);

    // 4 Corner Brackets
    const bracketGeo = new THREE.BoxGeometry(0.25, 0.04, 0.7);
    const bracketMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((angle) => {
      const b = new THREE.Mesh(bracketGeo, bracketMat);
      b.position.set(Math.cos(angle) * 2.2, 0.02, Math.sin(angle) * 2.2);
      b.rotation.y = angle;
      grp.add(b);
    });

    grp.visible = false;
    this.scene.add(grp);
    this.lockOnReticle = grp;
  }

  public triggerP1Dash() {
    this.player1.dash();
  }

  public triggerP2Dash() {
    if (this.player2) {
      this.player2.dash();
    }
  }

  public switchP1Weapon(w: RocketTypeId) {
    this.player1.switchWeapon(w);
  }

  public switchP2Weapon(w: RocketTypeId) {
    if (this.player2) {
      this.player2.switchWeapon(w);
    }
  }

  public fireP1(manualAimDir?: { x: number; y: number }) {
    const fired = this.player1.fire(this.rocketSystem, manualAimDir);
    if (fired) {
      this.p1RocketsFired++;
    }
  }

  public fireP2() {
    if (this.player2) {
      this.player2.fire(this.rocketSystem);
    }
  }

  private getAllDamageableEntities(): DamageableEntity[] {
    const list: DamageableEntity[] = [this.player1];
    if (this.player2) list.push(this.player2);
    for (const b of this.bots) list.push(b);
    return list;
  }

  private loop = () => {
    if (!this.isRunning) return;

    this.animFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    const dt = Math.min(this.clock.getDelta(), 0.1);
    this.matchDuration += dt;

    const camMode = this.profile.cameraMode || 'tactical';

    // 1. Update Player 1
    this.player1.update(dt, this.p1Input, this.obstacles, this.camera, camMode);
    this.callbacks.onPlayerHpUpdate(this.player1.hp, this.player1.maxHp, this.player1.shield, this.player1.maxShield);

    // 2. Update Player 2 if present
    if (this.player2) {
      this.player2.update(dt, this.p2Input, this.obstacles, this.camera, camMode);
      if (this.callbacks.onPlayer2HpUpdate) {
        this.callbacks.onPlayer2HpUpdate(this.player2.hp, this.player2.maxHp, this.player2.shield, this.player2.maxShield);
      }
    }

    // 3. Update Bots
    const entities = this.getAllDamageableEntities();
    const pickupPoss = this.pickups.map((p) => ({ position: p.position, active: p.active }));

    for (const bot of this.bots) {
      bot.update(dt, entities, this.obstacles, pickupPoss, this.rocketSystem, this.camera);
    }

    // Update Player 1 Auto-Aim Lock-On Target
    const enemies = entities.filter((e) => {
      if (e.id === this.player1.id || e.isDead) return false;
      if (this.mode === 'coop_survival' && e.id === 'player2') return false; // don't lock coop partner
      return true;
    });
    this.player1.updateTargeting(enemies);

    if (this.player1.lockedTarget && !this.player1.lockedTarget.isDead) {
      this.lockOnReticle.visible = true;
      this.lockOnReticle.position.set(
        this.player1.lockedTarget.position.x,
        0.25,
        this.player1.lockedTarget.position.z
      );
      this.lockOnReticle.rotation.y += dt * 3.5;

      // Auto-Fire option: automatically shoot when enemy is in range
      if (this.profile.autoFireEnabled && !this.player1.isDead) {
        const dist = this.player1.position.distanceTo(this.player1.lockedTarget.position);
        if (dist < 34 && this.player1.fireCooldowns[this.player1.equippedWeapon] <= 0) {
          this.fireP1();
        }
      }
    } else {
      this.lockOnReticle.visible = false;
    }

    // 4. Update Rockets
    this.rocketSystem.update(dt, entities, this.obstacles, (killerId, victimId, weapon) => {
      this.handleEntityKill(killerId, victimId, weapon);
    });

    // Check entity deaths
    for (const ent of entities) {
      if (ent.isDead && (ent as BotVehicle | PlayerVehicle).respawnTimer > 0) {
        // Handled internally in vehicle
      }
    }

    // 5. Update Pickups
    for (const p of this.pickups) {
      if (!p.active) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.active = true;
          p.mesh.visible = true;
          this.particleSystem.createSparks(p.position, 0x38bdf8, 8);
        }
      } else {
        // Floating spin animation
        p.mesh.rotation.y += dt * 2.0;
        p.mesh.position.y = p.position.y + Math.sin(Date.now() * 0.003) * 0.15;

        // Collect check with Player 1
        if (!this.player1.isDead && this.player1.position.distanceTo(p.position) < 2.5) {
          this.consumePickup(p, this.player1);
        } else if (this.player2 && !this.player2.isDead && this.player2.position.distanceTo(p.position) < 2.5) {
          this.consumePickup(p, this.player2);
        }
      }
    }

    // 6. Update Particle System
    this.particleSystem.update(dt);

    // 7. Camera Follow Logic
    this.updateCamera(dt);

    // 8. Render
    this.renderer.render(this.scene, this.camera);
  };

  private consumePickup(p: PickupItem, player: PlayerVehicle) {
    p.active = false;
    p.mesh.visible = false;
    p.respawnTimer = 12.0; // 12s pickup respawn
    audioManager.playPickup();

    if (p.type === 'health') {
      player.hp = Math.min(player.maxHp, player.hp + 45);
      this.particleSystem.createSparks(player.position, 0x22c55e, 14);
    } else if (p.type === 'shield') {
      player.shield = Math.min(player.maxShield, player.shield + 60);
      this.particleSystem.createSparks(player.position, 0x06b6d4, 14);
    } else {
      // Boost: reset all cooldowns
      player.dashCooldown = 0;
      (Object.keys(player.fireCooldowns) as RocketTypeId[]).forEach((w) => {
        player.fireCooldowns[w] = 0;
      });
      this.particleSystem.createSparks(player.position, 0xf59e0b, 16);
    }
  }

  private handleEntityKill(killerId: string, victimId: string, weapon: RocketTypeId) {
    const allEntities = this.getAllDamageableEntities();
    const killer = allEntities.find((e) => e.id === killerId);
    const victim = allEntities.find((e) => e.id === victimId);

    const killerName = killer ? killer.name : 'Hazard';
    const victimName = victim ? victim.name : 'Target';
    const isPlayer = killerId === 'player1' || killerId === 'player2';

    if (killerId === 'player1') {
      this.p1Kills++;
      this.p1Score += 150;
      this.p1RocketsHit++;
      this.callbacks.onScoreUpdate(this.p1Score, this.p1Kills, this.p1Deaths);
      audioManager.playVictory();

      // Check win condition
      if (this.mode === 'solo_bots' && this.p1Kills >= 10) {
        this.triggerEndMatch(true);
      }
    }

    if (victimId === 'player1') {
      this.p1Deaths++;
      this.callbacks.onScoreUpdate(this.p1Score, this.p1Kills, this.p1Deaths);

      if (this.mode === 'duel_pvp' && this.player2 && this.player2.kills >= 5) {
        this.triggerEndMatch(false);
      }
    }

    if (this.mode === 'duel_pvp' && killerId === 'player2') {
      if (this.player2) {
        this.player2.kills++;
        if (this.player2.kills >= 5) {
          this.triggerEndMatch(false);
        }
      }
    }

    if (this.mode === 'duel_pvp' && killerId === 'player1' && this.p1Kills >= 5) {
      this.triggerEndMatch(true);
    }

    // Co-op Survival wave progression
    if (this.mode === 'coop_survival') {
      const activeBots = this.bots.filter((b) => !b.isDead);
      if (activeBots.length <= 1) {
        this.currentWave++;
        if (this.callbacks.onWaveComplete) {
          this.callbacks.onWaveComplete(this.currentWave);
        }
        // Spawn more aggressive wave
        for (const b of this.bots) {
          b.maxHp += 15;
          b.maxShield += 15;
          b.respawn(new THREE.Vector3((Math.random() - 0.5) * 50, 0.7, (Math.random() - 0.5) * 50));
        }
        if (this.currentWave >= 4) {
          this.triggerEndMatch(true);
        }
      }
    }

    this.callbacks.onKillFeed({
      id: 'kf_' + Math.random().toString(36).substring(2, 7),
      killer: killerName,
      victim: victimName,
      weapon,
      isPlayer,
      timestamp: Date.now(),
    });
  }

  private updateCamera(dt: number) {
    if (!this.player1) return;

    let targetCamPos: THREE.Vector3;
    let lookTarget: THREE.Vector3;
    const camMode = this.profile.cameraMode || 'tactical';

    if (this.mode === 'coop_survival' && this.player2 && !this.player2.isDead) {
      // Dynamic framing for 2 players
      const mid = this.player1.position.clone().add(this.player2.position).multiplyScalar(0.5);
      const dist = this.player1.position.distanceTo(this.player2.position);
      const camHeight = Math.max(26, 18 + dist * 0.45);
      const camDistBack = Math.max(20, 15 + dist * 0.45);

      targetCamPos = new THREE.Vector3(mid.x, camHeight, mid.z - camDistBack);
      lookTarget = new THREE.Vector3(mid.x, 1.2, mid.z);
    } else if (camMode === 'tactical') {
      // Tactical Overhead Combat View (58-degree angle, crystal-clear orientation)
      targetCamPos = new THREE.Vector3(
        this.player1.position.x,
        25.0,
        this.player1.position.z - 16.5
      );
      lookTarget = new THREE.Vector3(
        this.player1.position.x,
        1.0,
        this.player1.position.z + 2.0
      );
    } else {
      // 3rd-person follow behind Player 1 with smooth damping
      const p1 = this.player1;
      const camOffset = new THREE.Vector3(
        -Math.sin(p1.rotationY) * 12,
        7.5,
        -Math.cos(p1.rotationY) * 12
      );
      targetCamPos = p1.position.clone().add(camOffset);
      lookTarget = p1.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    }

    // Damped camera lerp for silky smooth motion
    this.camera.position.lerp(targetCamPos, Math.min(1, dt * 7.5));

    // Screen Shake application
    if (this.screenShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShakeIntensity;
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - dt * 3.5);
    }

    this.camera.lookAt(lookTarget);
  }

  public triggerScreenShake(amount: number = 0.8) {
    this.screenShakeIntensity = Math.min(2.5, this.screenShakeIntensity + amount);
  }

  public triggerEndMatch(won: boolean) {
    this.isRunning = false;
    const accuracy = this.p1RocketsFired > 0 ? Math.round((this.p1RocketsHit / this.p1RocketsFired) * 100) : 0;
    this.callbacks.onGameOver({
      kills: this.p1Kills,
      deaths: this.p1Deaths,
      score: this.p1Score,
      damageDealt: this.p1DamageDealt,
      rocketsFired: this.p1RocketsFired,
      rocketsHit: this.p1RocketsHit,
      accuracy,
      durationSeconds: Math.floor(this.matchDuration),
      won,
      mode: this.mode,
    });
  }

  public setPaused(p: boolean) {
    this.isPaused = p;
  }

  public dispose() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    this.particleSystem.dispose();
    this.rocketSystem.clearAll();

    this.player1.dispose(this.scene);
    if (this.player2) this.player2.dispose(this.scene);
    for (const b of this.bots) b.dispose(this.scene);

    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
