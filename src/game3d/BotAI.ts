import * as THREE from 'three';
import { RocketTypeId, BotDifficulty } from '../types/game';
import { createVehicleMesh, VehicleMeshBundle } from './VehicleModel';
import { DamageableEntity, ObstacleBox, RocketSystem } from './RocketSystem';
import { ROCKET_CONFIGS } from '../storage/gameStorage';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../sound/audioManager';

const BOT_NAMES = [
  'Viper-X', 'Titan-09', 'Neon-Fury', 'Apex-Sentinel',
  'Ghost-Unit', 'Vortex-7', 'Striker-Z', 'Iron-Hydra',
  'Nova-Core', 'Omega-Drone', 'Phantom-01', 'Razor-Claw'
];

export class BotVehicle implements DamageableEntity {
  public id: string;
  public name: string;
  public isPlayer: boolean = false;
  public difficulty: BotDifficulty;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public radius: number = 1.8;

  public hp: number = 100;
  public maxHp: number = 100;
  public shield: number = 100;
  public maxShield: number = 100;
  public isDead: boolean = false;
  public respawnTimer: number = 0;
  public kills: number = 0;
  public deaths: number = 0;

  public meshBundle: VehicleMeshBundle;
  public currentWeapon: RocketTypeId = 'fast';
  private fireCooldownTimer: number = 0;
  private changeTargetTimer: number = 0;
  private strafeTimer: number = 0;
  private strafeDir: number = 1;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private particleSystem: ParticleSystem;

  constructor(
    id: string,
    name: string,
    difficulty: BotDifficulty,
    startPos: THREE.Vector3,
    scene: THREE.Scene,
    particleSystem: ParticleSystem
  ) {
    this.id = id;
    this.name = name;
    this.difficulty = difficulty;
    this.position = startPos.clone();
    this.particleSystem = particleSystem;

    // Red / Crimson colors for enemies
    const primaryCol = difficulty === 'apex' ? 0x991b1b : difficulty === 'veteran' ? 0xb91c1c : 0xc2410c;
    const accentCol = difficulty === 'apex' ? 0xf43f5e : 0xf97316;
    this.meshBundle = createVehicleMesh(primaryCol, accentCol, true);
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
      // Flash shield
      (this.meshBundle.shieldMesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
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
    this.velocity.add(force.multiplyScalar(0.7));
  }

  private die(attackerId: string, weapon: RocketTypeId) {
    this.isDead = true;
    this.deaths++;
    this.respawnTimer = 4.0; // 4s respawn
    this.meshBundle.root.visible = false;
    this.particleSystem.createExplosion(this.position, 0xef4444, 2.5);
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
    this.particleSystem.createSparks(spawnPos, 0xef4444, 15);
  }

  private updateHpBars() {
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const shieldRatio = Math.max(0, this.shield / this.maxShield);

    this.meshBundle.hpBarFill.scale.set(hpRatio, 1, 1);
    this.meshBundle.shieldBarFill.scale.set(shieldRatio, 1, 1);

    // Color gradient on HP bar
    const mat = this.meshBundle.hpBarFill.material as THREE.MeshBasicMaterial;
    if (hpRatio > 0.5) {
      mat.color.setHex(0x22c55e);
    } else if (hpRatio > 0.25) {
      mat.color.setHex(0xeab308);
    } else {
      mat.color.setHex(0xef4444);
    }
  }

  public update(
    dt: number,
    allEntities: DamageableEntity[],
    obstacles: ObstacleBox[],
    pickups: { position: THREE.Vector3; active: boolean }[],
    rocketSystem: RocketSystem,
    camera: THREE.Camera
  ) {
    // Make HP billboard face camera
    this.meshBundle.hpBillboard.quaternion.copy(camera.quaternion);

    // Decay shield flash
    const shieldMat = this.meshBundle.shieldMesh.material as THREE.MeshBasicMaterial;
    if (shieldMat.opacity > 0) {
      shieldMat.opacity = Math.max(0, shieldMat.opacity - dt * 2.5);
    }

    // Shield passive regeneration
    if (!this.isDead && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + dt * 4);
      this.updateHpBars();
    }

    if (this.isDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        // Find safe spawn away from center
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 25 + 15;
        this.respawn(new THREE.Vector3(Math.cos(angle) * dist, 0.7, Math.sin(angle) * dist));
      }
      return;
    }

    this.fireCooldownTimer -= dt;
    this.changeTargetTimer -= dt;
    this.strafeTimer -= dt;

    if (this.strafeTimer <= 0) {
      this.strafeTimer = Math.random() * 2 + 1;
      this.strafeDir = Math.random() > 0.5 ? 1 : -1;
    }

    // Target Selection: Prefer player or lowest HP opponent
    let bestTarget: DamageableEntity | null = null;
    let minDist = 9999;

    for (const ent of allEntities) {
      if (ent.id === this.id || ent.isDead) continue;
      const d = this.position.distanceTo(ent.position);
      // Prioritize player
      const weightedDist = ent.isPlayer ? d * 0.75 : d;
      if (weightedDist < minDist) {
        minDist = weightedDist;
        bestTarget = ent;
      }
    }

    // AI Movement Behavior
    const moveDir = new THREE.Vector3();
    const moveSpeed = this.difficulty === 'apex' ? 14 : this.difficulty === 'veteran' ? 12 : 9.5;

    // Low HP -> Seek pickup
    if (this.hp < 45) {
      let nearestPickup: THREE.Vector3 | null = null;
      let minPdist = 999;
      for (const p of pickups) {
        if (!p.active) continue;
        const pd = this.position.distanceTo(p.position);
        if (pd < minPdist) {
          minPdist = pd;
          nearestPickup = p.position;
        }
      }
      if (nearestPickup) {
        moveDir.subVectors(nearestPickup, this.position).normalize();
      }
    }

    if (bestTarget && moveDir.lengthSq() === 0) {
      const toTarget = new THREE.Vector3().subVectors(bestTarget.position, this.position);
      const dist = toTarget.length();

      // Desired distance from target ~ 15-20 meters
      if (dist > 22) {
        // Move closer
        moveDir.add(toTarget.clone().normalize());
      } else if (dist < 10) {
        // Back off slightly
        moveDir.sub(toTarget.clone().normalize().multiplyScalar(0.7));
      }

      // Add strafing movement
      const strafeVec = new THREE.Vector3(-toTarget.z, 0, toTarget.x).normalize();
      moveDir.add(strafeVec.multiplyScalar(this.strafeDir * 0.8));
    }

    // Obstacle Avoidance (Raycast / Proximity push)
    for (const obs of obstacles) {
      const obsCenter = obs.min.clone().add(obs.max).multiplyScalar(0.5);
      const distToObs = this.position.distanceTo(obsCenter);
      if (distToObs < 6.0) {
        const pushAway = this.position.clone().sub(obsCenter).normalize();
        moveDir.add(pushAway.multiplyScalar(1.5));
      }
    }

    // Arena Boundary Avoidance
    const boundaryLimit = 42;
    if (Math.abs(this.position.x) > boundaryLimit) {
      moveDir.x -= Math.sign(this.position.x) * 2;
    }
    if (Math.abs(this.position.z) > boundaryLimit) {
      moveDir.z -= Math.sign(this.position.z) * 2;
    }

    // Apply movement
    if (moveDir.lengthSq() > 0.01) {
      moveDir.y = 0;
      moveDir.normalize();

      // Turn towards movement direction smoothly
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      let angleDiff = targetAngle - this.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.rotationY += angleDiff * Math.min(1, dt * 6);

      // Accelerate
      this.velocity.x += moveDir.x * moveSpeed * 5 * dt;
      this.velocity.z += moveDir.z * moveSpeed * 5 * dt;
    }

    // Friction / drag
    this.velocity.x *= Math.max(0, 1 - dt * 4.5);
    this.velocity.z *= Math.max(0, 1 - dt * 4.5);

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Keep within arena
    this.position.x = Math.max(-46, Math.min(46, this.position.x));
    this.position.z = Math.max(-46, Math.min(46, this.position.z));
    this.position.y = 0.7; // Hover height

    // Update 3D Mesh
    this.meshBundle.root.position.copy(this.position);
    this.meshBundle.root.rotation.y = this.rotationY;

    // Hover thruster flicker
    const flicker = 0.8 + Math.sin(Date.now() * 0.015) * 0.3;
    for (const thruster of this.meshBundle.thrusters) {
      thruster.scale.set(1, flicker, 1);
    }

    // Aim Turret at Best Target with Prediction Lead
    if (bestTarget) {
      const aimDir = new THREE.Vector3().subVectors(bestTarget.position, this.position);
      const dist = aimDir.length();

      // Switch weapon strategically
      if (dist < 14) {
        this.currentWeapon = 'explosive';
      } else if (dist > 28) {
        this.currentWeapon = 'piercing';
      } else {
        this.currentWeapon = 'fast';
      }

      const cfg = ROCKET_CONFIGS[this.currentWeapon];
      const bulletSpeed = cfg.speed;
      const flightTime = dist / bulletSpeed;

      // Predicted position (veteran & apex only)
      let predictedPos = bestTarget.position.clone();
      if (this.difficulty !== 'cadet' && 'velocity' in bestTarget) {
        const vel = (bestTarget as { velocity: THREE.Vector3 }).velocity;
        if (vel) {
          const accuracy = this.difficulty === 'apex' ? 0.95 : 0.75;
          predictedPos.addScaledVector(vel, flightTime * accuracy);
        }
      }

      // Local turret aim
      const worldAim = predictedPos.clone().sub(this.position);
      const localAim = worldAim.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -this.rotationY);
      const turretAngle = Math.atan2(localAim.x, localAim.z);
      this.meshBundle.turret.rotation.y = turretAngle;

      // Firing Decision
      if (this.fireCooldownTimer <= 0 && dist < 45) {
        const cooldown = cfg.cooldown * (this.difficulty === 'apex' ? 1.0 : this.difficulty === 'veteran' ? 1.3 : 1.7);
        this.fireCooldownTimer = cooldown;

        // Firing nozzle position
        const fireOffset = new THREE.Vector3(0, 1.4, 1.5);
        fireOffset.applyEuler(new THREE.Euler(0, this.rotationY + turretAngle, 0));
        const spawnPos = this.position.clone().add(fireOffset);

        const shootDir = predictedPos.clone().sub(spawnPos).normalize();
        shootDir.y = 0; // Flat combat plane

        rocketSystem.fireRocket(
          this.currentWeapon,
          this.id,
          false,
          spawnPos,
          shootDir,
          cfg.baseDamage,
          cfg.speed,
          cfg.radius
        );
      }
    }
  }

  public dispose(scene: THREE.Scene) {
    scene.remove(this.meshBundle.root);
  }
}
