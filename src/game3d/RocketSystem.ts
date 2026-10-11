import * as THREE from 'three';
import { RocketTypeId } from '../types/game';
import { ParticleSystem } from './ParticleSystem';
import { audioManager } from '../sound/audioManager';

export interface ActiveRocket {
  id: string;
  type: RocketTypeId;
  ownerId: string;
  isPlayer: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Group;
  light?: THREE.PointLight;
  damage: number;
  radius: number;
  piercingCount: number;
  maxPierces: number;
  hitEntityIds: Set<string>;
  life: number;
  maxLife: number;
  trailTimer: number;
}

export interface ObstacleBox {
  id: string;
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface DamageableEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  position: THREE.Vector3;
  radius: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  isDead: boolean;
  takeDamage: (amount: number, attackerId: string, weapon: RocketTypeId) => void;
  applyKnockback: (force: THREE.Vector3) => void;
}

export class RocketSystem {
  private scene: THREE.Scene;
  private particleSystem: ParticleSystem;
  private rockets: ActiveRocket[] = [];

  // Reusable materials
  private fastMat: THREE.MeshBasicMaterial;
  private expMat: THREE.MeshBasicMaterial;
  private prcMat: THREE.MeshBasicMaterial;
  private trailSphereGeo: THREE.SphereGeometry;

  constructor(scene: THREE.Scene, particleSystem: ParticleSystem) {
    this.scene = scene;
    this.particleSystem = particleSystem;

    this.fastMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.expMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    this.prcMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    this.trailSphereGeo = new THREE.SphereGeometry(0.18, 4, 4);
  }

  public fireRocket(
    type: RocketTypeId,
    ownerId: string,
    isPlayer: boolean,
    startPos: THREE.Vector3,
    direction: THREE.Vector3,
    damage: number,
    speed: number,
    radius: number
  ) {
    const group = new THREE.Group();
    group.position.copy(startPos);

    // Orient rocket towards direction
    const targetLook = startPos.clone().add(direction);
    group.lookAt(targetLook);

    let hexColor = 0x38bdf8;

    if (type === 'fast') {
      hexColor = 0x06b6d4;
      // Slender needle cone
      const coneGeo = new THREE.ConeGeometry(0.18, 1.4, 6);
      coneGeo.rotateX(Math.PI / 2);
      const cone = new THREE.Mesh(coneGeo, this.fastMat);
      group.add(cone);

      const finGeo = new THREE.BoxGeometry(0.6, 0.05, 0.4);
      const fin = new THREE.Mesh(finGeo, this.fastMat);
      fin.position.z = -0.4;
      group.add(fin);
    } else if (type === 'explosive') {
      hexColor = 0xf97316;
      // Heavy warhead cylinder + cone
      const cylGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
      cylGeo.rotateX(Math.PI / 2);
      const cyl = new THREE.Mesh(cylGeo, this.expMat);
      group.add(cyl);

      const noseGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
      noseGeo.rotateX(Math.PI / 2);
      const nose = new THREE.Mesh(noseGeo, new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
      nose.position.z = 0.8;
      group.add(nose);
    } else {
      hexColor = 0xa855f7;
      // Plasma Torpedo
      const sphereGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const sphere = new THREE.Mesh(sphereGeo, this.prcMat);
      group.add(sphere);

      const ringGeo = new THREE.TorusGeometry(0.45, 0.08, 6, 12);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xe879f9 }));
      group.add(ring);
    }

    const light = new THREE.PointLight(hexColor, 2, 8);
    group.add(light);

    this.scene.add(group);

    const velocity = direction.clone().normalize().multiplyScalar(speed);

    this.rockets.push({
      id: 'rkt_' + Math.random().toString(36).substring(2, 7),
      type,
      ownerId,
      isPlayer,
      position: startPos.clone(),
      velocity,
      mesh: group,
      light,
      damage,
      radius,
      piercingCount: 0,
      maxPierces: type === 'piercing' ? 3 : 1,
      hitEntityIds: new Set<string>(),
      life: 0,
      maxLife: 3.5, // 3.5 seconds lifetime
      trailTimer: 0,
    });

    if (isPlayer) {
      audioManager.playShoot(type);
    }
  }

  public update(
    dt: number,
    entities: DamageableEntity[],
    obstacles: ObstacleBox[],
    onHitCallback?: (killerId: string, victimId: string, weapon: RocketTypeId) => void
  ) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.life += dt;
      r.trailTimer += dt;

      // Despawn on timeout
      if (r.life >= r.maxLife) {
        this.detonateRocket(r, entities, onHitCallback);
        this.removeRocketAt(i);
        continue;
      }

      // Move rocket
      const prevPos = r.position.clone();
      r.position.addScaledVector(r.velocity, dt);
      r.mesh.position.copy(r.position);

      // Spawn smoke / trail particles every 0.04s
      if (r.trailTimer >= 0.04) {
        r.trailTimer = 0;
        const trailColor = r.type === 'fast' ? 0x38bdf8 : r.type === 'explosive' ? 0xf97316 : 0xa855f7;
        this.particleSystem.createSparks(r.position, trailColor, 1);
      }

      // Check collision with obstacles (Bunkers, Pillars, Outer Boundary)
      let hitObstacle = false;
      const arenaHalfSize = 48; // Arena boundary +/- 48m
      if (
        Math.abs(r.position.x) > arenaHalfSize ||
        Math.abs(r.position.z) > arenaHalfSize ||
        r.position.y < 0.2
      ) {
        hitObstacle = true;
      } else {
        for (const obs of obstacles) {
          if (
            r.position.x >= obs.min.x &&
            r.position.x <= obs.max.x &&
            r.position.z >= obs.min.z &&
            r.position.z <= obs.max.z &&
            r.position.y <= obs.max.y
          ) {
            hitObstacle = true;
            break;
          }
        }
      }

      if (hitObstacle) {
        this.detonateRocket(r, entities, onHitCallback);
        this.removeRocketAt(i);
        continue;
      }

      // Check collision against Damageable Entities (Player, Bots, etc.)
      let shouldRemove = false;
      for (const entity of entities) {
        if (entity.isDead || entity.id === r.ownerId || r.hitEntityIds.has(entity.id)) {
          continue;
        }

        // Hitbox check
        const dist = r.position.distanceTo(entity.position);
        if (dist <= entity.radius + (r.type === 'explosive' ? 0.6 : 0.4)) {
          r.hitEntityIds.add(entity.id);
          r.piercingCount++;

          if (r.type === 'piercing') {
            // Direct piercing damage without immediate detonation
            entity.takeDamage(r.damage, r.ownerId, r.type);
            this.particleSystem.createSparks(r.position, 0xa855f7, 10);
            if (r.isPlayer) audioManager.playHitMarker();

            if (r.piercingCount >= r.maxPierces) {
              this.detonateRocket(r, entities, onHitCallback);
              shouldRemove = true;
              break;
            }
          } else {
            // Detonate on impact
            this.detonateRocket(r, entities, onHitCallback);
            shouldRemove = true;
            break;
          }
        }
      }

      if (shouldRemove) {
        this.removeRocketAt(i);
      }
    }
  }

  private detonateRocket(
    r: ActiveRocket,
    entities: DamageableEntity[],
    onHitCallback?: (killerId: string, victimId: string, weapon: RocketTypeId) => void
  ) {
    const explosionColor = r.type === 'fast' ? 0x06b6d4 : r.type === 'explosive' ? 0xf97316 : 0xa855f7;
    const explosionScale = r.type === 'explosive' ? 2.2 : r.type === 'fast' ? 1.0 : 1.3;

    this.particleSystem.createExplosion(r.position, explosionColor, explosionScale);
    audioManager.playExplosion(r.type === 'explosive' ? 'large' : 'medium');

    // Splash damage
    for (const entity of entities) {
      if (entity.isDead) continue;

      const dist = r.position.distanceTo(entity.position);
      if (dist <= r.radius) {
        // Linear damage falloff from center of blast
        const factor = Math.max(0.3, 1 - dist / r.radius);
        const actualDamage = Math.round(r.damage * factor);

        // Apply knockback
        const pushDir = entity.position.clone().sub(r.position).normalize();
        pushDir.y = 0.3; // Slight pop into the air
        const knockbackForce = pushDir.multiplyScalar((1 - dist / r.radius) * (r.type === 'explosive' ? 28 : 12));
        entity.applyKnockback(knockbackForce);

        entity.takeDamage(actualDamage, r.ownerId, r.type);

        if (r.isPlayer) {
          audioManager.playHitMarker();
        }
      }
    }
  }

  private removeRocketAt(index: number) {
    const r = this.rockets[index];
    this.scene.remove(r.mesh);
    r.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.rockets.splice(index, 1);
  }

  public clearAll() {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      this.removeRocketAt(i);
    }
  }
}
