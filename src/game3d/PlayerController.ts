import * as THREE from 'three';
import { RocketTypeId, PlayerProfile } from '../types/game';
import { createVehicleMesh, VehicleMeshBundle } from './VehicleModel';
import { DamageableEntity, ObstacleBox, RocketSystem } from './RocketSystem';
import { ROCKET_CONFIGS, getUpgradedRocketStats } from '../storage/gameStorage';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../sound/audioManager';

export class PlayerVehicle implements DamageableEntity {
  public id: string;
  public name: string;
  public isPlayer: boolean = true;
  public playerNumber: 1 | 2;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public bankingAngle: number = 0;
  public radius: number = 1.8;

  public hp: number = 100;
  public maxHp: number = 100;
  public shield: number = 100;
  public maxShield: number = 100;
  public isDead: boolean = false;
  public respawnTimer: number = 0;
  public kills: number = 0;
  public deaths: number = 0;
  public score: number = 0;

  public equippedWeapon: RocketTypeId = 'fast';
  public fireCooldowns: Record<RocketTypeId, number> = {
    fast: 0,
    explosive: 0,
    piercing: 0,
  };
  public dashCooldown: number = 0;

  // Auto-Aim Target
  public lockedTarget: DamageableEntity | null = null;

  public meshBundle: VehicleMeshBundle;
  private particleSystem: ParticleSystem;
  public profile: PlayerProfile;

  constructor(
    id: string,
    name: string,
    playerNumber: 1 | 2,
    startPos: THREE.Vector3,
    profile: PlayerProfile,
    scene: THREE.Scene,
    particleSystem: ParticleSystem
  ) {
    this.id = id;
    this.name = name;
    this.playerNumber = playerNumber;
    this.position = startPos.clone();
    this.profile = profile;
    this.particleSystem = particleSystem;

    // Player 1 = Neon Blue/Cyan; Player 2 = Emerald Green
    const primaryCol = playerNumber === 1 ? 0x0284c7 : 0x059669;
    const accentCol = playerNumber === 1 ? 0x38bdf8 : 0x34d399;
    this.meshBundle = createVehicleMesh(primaryCol, accentCol, false);
    this.meshBundle.root.position.copy(this.position);
    scene.add(this.meshBundle.root);
  }

  public takeDamage(amount: number, attackerId: string, weapon: RocketTypeId) {
    if (this.isDead) return;

    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        amount = 0;
      } else {
        amount -= this.shield;
        this.shield = 0;
      }
      (this.meshBundle.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      audioManager.playShieldHit();
    }

    if (amount > 0) {
      this.hp -= amount;
    }

    this.updateHpBars();

    if (this.hp <= 0) {
      this.hp = 0;
      this.die(attackerId, weapon);
    }
  }

  public applyKnockback(force: THREE.Vector3) {
    this.velocity.add(force.multiplyScalar(0.75));
  }

  private die(attackerId: string, weapon: RocketTypeId) {
    this.isDead = true;
    this.deaths++;
    this.respawnTimer = 3.0; // 3s respawn
    this.meshBundle.root.visible = false;
    this.particleSystem.createExplosion(this.position, 0xef4444, 2.5);
    audioManager.playDefeat();
  }

  public respawn(spawnPos: THREE.Vector3) {
    this.isDead = false;
    this.hp = this.maxHp;
    this.shield = this.maxShield;
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.meshBundle.root.position.copy(spawnPos);
    this.meshBundle.root.visible = true;
    this.updateHpBars();
    this.particleSystem.createSparks(spawnPos, 0x38bdf8, 20);
  }

  public dash() {
    if (this.isDead || this.dashCooldown > 0) return;
    this.dashCooldown = 2.8; // Snappier 2.8s dash

    // Dash forward or in movement direction
    let forward: THREE.Vector3;
    if (this.velocity.lengthSq() > 1) {
      forward = this.velocity.clone().normalize();
    } else {
      forward = new THREE.Vector3(Math.sin(this.rotationY), 0, Math.cos(this.rotationY));
    }

    this.velocity.copy(forward.multiplyScalar(32));
    this.particleSystem.createExplosion(this.position, 0x38bdf8, 0.8);
    audioManager.playShoot('fast');
  }

  public switchWeapon(type: RocketTypeId) {
    this.equippedWeapon = type;
  }

  public updateTargeting(entities: DamageableEntity[]) {
    if (this.isDead) {
      this.lockedTarget = null;
      return;
    }

    const autoAim = this.profile.autoAimEnabled !== false;
    if (!autoAim) {
      this.lockedTarget = null;
      return;
    }

    // Find closest enemy within 38 meters
    let closest: DamageableEntity | null = null;
    let minDist = 38.0;

    for (const ent of entities) {
      if (ent.id === this.id || ent.isDead) continue;
      // Don't target teammate in coop
      if (ent.isPlayer && this.id.startsWith('player') && ent.id.startsWith('player')) {
        // Only target if in duel mode
        // Will be filtered by caller
      }

      const dist = this.position.distanceTo(ent.position);
      if (dist < minDist) {
        minDist = dist;
        closest = ent;
      }
    }

    this.lockedTarget = closest;
  }

  public fire(rocketSystem: RocketSystem, manualAimDir?: { x: number; y: number }): boolean {
    if (this.isDead) return false;
    if (this.fireCooldowns[this.equippedWeapon] > 0) return false;

    const baseCfg = ROCKET_CONFIGS[this.equippedWeapon];
    const upgraded = getUpgradedRocketStats(baseCfg, this.profile.upgrades[this.equippedWeapon]);

    this.fireCooldowns[this.equippedWeapon] = upgraded.cooldown;

    let shootDir: THREE.Vector3;

    // 1. Manual aim if dragged
    if (manualAimDir && (Math.abs(manualAimDir.x) > 0.15 || Math.abs(manualAimDir.y) > 0.15)) {
      shootDir = new THREE.Vector3(manualAimDir.x, 0, -manualAimDir.y).normalize();
    }
    // 2. Auto-Aim at locked target
    else if (this.lockedTarget && !this.lockedTarget.isDead) {
      const toTarget = this.lockedTarget.position.clone().sub(this.position);
      toTarget.y = 0;
      shootDir = toTarget.normalize();
    }
    // 3. Fallback: Vehicle forward direction
    else {
      const turretAngle = this.meshBundle.turret.rotation.y;
      const globalAngle = this.rotationY + turretAngle;
      shootDir = new THREE.Vector3(Math.sin(globalAngle), 0, Math.cos(globalAngle)).normalize();
    }

    // Firing spawn point at turret tip
    const fireOffset = shootDir.clone().multiplyScalar(1.6);
    fireOffset.y = 1.35;
    const spawnPos = this.position.clone().add(fireOffset);

    rocketSystem.fireRocket(
      this.equippedWeapon,
      this.id,
      true,
      spawnPos,
      shootDir,
      upgraded.baseDamage,
      upgraded.speed,
      upgraded.radius
    );

    return true;
  }

  public update(
    dt: number,
    input: { moveX: number; moveY: number; aimX?: number; aimY?: number },
    obstacles: ObstacleBox[],
    camera: THREE.Camera,
    cameraMode: 'tactical' | 'follow' = 'tactical'
  ) {
    // Face HP billboard towards camera
    this.meshBundle.hpBillboard.quaternion.copy(camera.quaternion);

    // Cooldown decays
    (Object.keys(this.fireCooldowns) as RocketTypeId[]).forEach((w) => {
      if (this.fireCooldowns[w] > 0) {
        this.fireCooldowns[w] = Math.max(0, this.fireCooldowns[w] - dt);
      }
    });

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }

    // Shield passive regeneration
    if (!this.isDead && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + dt * 6.5);
      this.updateHpBars();
    }

    // Shield flash decay
    const shieldMat = this.meshBundle.shieldMesh.material as THREE.MeshBasicMaterial;
    if (shieldMat.opacity > 0) {
      shieldMat.opacity = Math.max(0, shieldMat.opacity - dt * 2.5);
    }

    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.respawn(new THREE.Vector3(this.playerNumber === 1 ? -15 : 15, 0.7, -10));
      }
      return;
    }

    // --- REFINED TIGHT VEHICLE MOVEMENT ---
    const sensitivity = this.profile.controlsSensitivity === 'normal' ? 1.0 : 1.25;
    const maxSpeed = 18.0 * sensitivity;
    const accel = 95.0 * sensitivity;
    const turnRate = (this.profile.controlsSensitivity === 'normal' ? 14.0 : 20.0);

    const inputMagSq = input.moveX * input.moveX + input.moveY * input.moveY;

    if (inputMagSq > 0.008) {
      let desiredWorldDir = new THREE.Vector3();

      if (cameraMode === 'tactical') {
        // Tactical view: Top is North (-Z), Bottom is South (+Z), Left is West (-X), Right is East (+X)
        desiredWorldDir.set(input.moveX, 0, input.moveY).normalize();
      } else {
        // Follow Cam view: Relative to camera horizontal heading
        const camForward = new THREE.Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new THREE.Vector3(-camForward.z, 0, camForward.x);
        desiredWorldDir.addScaledVector(camRight, input.moveX);
        desiredWorldDir.addScaledVector(camForward, -input.moveY);
        desiredWorldDir.normalize();
      }

      // Smooth, snappy rotation towards desired movement angle
      const targetAngle = Math.atan2(desiredWorldDir.x, desiredWorldDir.z);
      let angleDiff = targetAngle - this.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      this.rotationY += angleDiff * Math.min(1, dt * turnRate);

      // Banking roll effect
      const targetRoll = -angleDiff * 0.45;
      this.bankingAngle += (targetRoll - this.bankingAngle) * Math.min(1, dt * 12);

      const moveMagnitude = Math.min(1, Math.sqrt(inputMagSq));
      this.velocity.x += desiredWorldDir.x * accel * moveMagnitude * dt;
      this.velocity.z += desiredWorldDir.z * accel * moveMagnitude * dt;
    } else {
      this.bankingAngle *= Math.max(0, 1 - dt * 10);
      // Snappy brake drag when stick released
      this.velocity.x *= Math.max(0, 1 - dt * 8.5);
      this.velocity.z *= Math.max(0, 1 - dt * 8.5);
    }

    // Clamp max speed & general air drag
    const currentSpeed = this.velocity.length();
    if (currentSpeed > maxSpeed) {
      this.velocity.multiplyScalar(maxSpeed / currentSpeed);
    }
    this.velocity.x *= Math.max(0, 1 - dt * 3.2);
    this.velocity.z *= Math.max(0, 1 - dt * 3.2);

    // Apply movement
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // --- TURRET AIMING LOGIC ---
    if (input.aimX !== undefined && input.aimY !== undefined && (Math.abs(input.aimX) > 0.15 || Math.abs(input.aimY) > 0.15)) {
      // Manual aim override
      const aimGlobalAngle = Math.atan2(input.aimX, -input.aimY);
      let localTurretAngle = aimGlobalAngle - this.rotationY;
      while (localTurretAngle > Math.PI) localTurretAngle -= Math.PI * 2;
      while (localTurretAngle < -Math.PI) localTurretAngle += Math.PI * 2;
      this.meshBundle.turret.rotation.y = localTurretAngle;
    } else if (this.lockedTarget && !this.lockedTarget.isDead) {
      // Auto-Aim: Track locked enemy
      const worldAim = this.lockedTarget.position.clone().sub(this.position);
      const localAim = worldAim.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotationY);
      const targetTurretAngle = Math.atan2(localAim.x, localAim.z);

      let turretDiff = targetTurretAngle - this.meshBundle.turret.rotation.y;
      while (turretDiff > Math.PI) turretDiff -= Math.PI * 2;
      while (turretDiff < -Math.PI) turretDiff += Math.PI * 2;

      this.meshBundle.turret.rotation.y += turretDiff * Math.min(1, dt * 18);
    } else {
      // Return turret forward
      this.meshBundle.turret.rotation.y *= Math.max(0, 1 - dt * 6);
    }

    // Obstacle collision resolution
    for (const obs of obstacles) {
      if (
        this.position.x + this.radius > obs.min.x &&
        this.position.x - this.radius < obs.max.x &&
        this.position.z + this.radius > obs.min.z &&
        this.position.z - this.radius < obs.max.z
      ) {
        const distLeft = Math.abs(this.position.x - obs.min.x);
        const distRight = Math.abs(this.position.x - obs.max.x);
        const distFront = Math.abs(this.position.z - obs.min.z);
        const distBack = Math.abs(this.position.z - obs.max.z);

        const minDist = Math.min(distLeft, distRight, distFront, distBack);
        if (minDist === distLeft) this.position.x = obs.min.x - this.radius;
        else if (minDist === distRight) this.position.x = obs.max.x + this.radius;
        else if (minDist === distFront) this.position.z = obs.min.z - this.radius;
        else this.position.z = obs.max.z + this.radius;
      }
    }

    // Arena boundary limits
    const limit = 45;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));
    this.position.y = 0.7;

    // Apply to 3D mesh
    this.meshBundle.root.position.copy(this.position);
    this.meshBundle.root.rotation.set(0, this.rotationY, this.bankingAngle);

    // Thruster exhaust animation
    const speedFactor = Math.min(1.8, Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z) / 7 + 0.6);
    for (const thruster of this.meshBundle.thrusters) {
      thruster.scale.set(1, speedFactor, 1);
    }
  }

  private updateHpBars() {
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const shieldRatio = Math.max(0, this.shield / this.maxShield);

    this.meshBundle.hpBarFill.scale.set(hpRatio, 1, 1);
    this.meshBundle.shieldBarFill.scale.set(shieldRatio, 1, 1);

    const mat = this.meshBundle.hpBarFill.material as THREE.MeshBasicMaterial;
    if (hpRatio > 0.5) {
      mat.color.setHex(0x22c55e);
    } else if (hpRatio > 0.25) {
      mat.color.setHex(0xeab308);
    } else {
      mat.color.setHex(0xef4444);
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.meshBundle.root);
  }
}
