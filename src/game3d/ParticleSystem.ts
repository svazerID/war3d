import * as THREE from 'three';

export interface ExplosionParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  maxLife: number;
  life: number;
  mesh?: THREE.Mesh;
}

export interface Shockwave {
  mesh: THREE.Mesh;
  maxRadius: number;
  currentRadius: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: ExplosionParticle[] = [];
  private shockwaves: Shockwave[] = [];
  private particleGeo: THREE.SphereGeometry;
  private particleMatPool: Map<string, THREE.MeshBasicMaterial> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particleGeo = new THREE.SphereGeometry(0.3, 5, 4);
  }

  private getMaterial(hex: number): THREE.MeshBasicMaterial {
    const key = hex.toString();
    if (!this.particleMatPool.has(key)) {
      this.particleMatPool.set(
        key,
        new THREE.MeshBasicMaterial({
          color: hex,
          transparent: true,
          opacity: 0.9,
        })
      );
    }
    return this.particleMatPool.get(key)!.clone();
  }

  public createExplosion(pos: THREE.Vector3, colorHex: number = 0xf97316, scale: number = 1.0) {
    const count = Math.floor(18 * scale);
    const col = new THREE.Color(colorHex);

    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.2,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = (Math.random() * 12 + 6) * scale;
      const vel = dir.multiplyScalar(speed);

      const mat = this.getMaterial(colorHex);
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      const initialSize = (Math.random() * 0.4 + 0.2) * scale;
      mesh.scale.setScalar(initialSize);
      mesh.position.copy(pos);

      this.scene.add(mesh);

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: col,
        size: initialSize,
        maxLife: Math.random() * 0.4 + 0.35,
        life: 0,
        mesh,
      });
    }

    // Expanding shockwave ring
    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(pos.x, pos.y + 0.1, pos.z);
    this.scene.add(ringMesh);

    this.shockwaves.push({
      mesh: ringMesh,
      maxRadius: 4.5 * scale,
      currentRadius: 0.2,
      life: 0,
      maxLife: 0.4,
      color: col,
    });
  }

  public createSparks(pos: THREE.Vector3, colorHex: number = 0x38bdf8, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.2 + 0.3,
        (Math.random() - 0.5) * 2
      ).normalize();

      const speed = Math.random() * 8 + 4;
      const vel = dir.multiplyScalar(speed);

      const mat = this.getMaterial(colorHex);
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.scale.setScalar(0.15);
      mesh.position.copy(pos);

      this.scene.add(mesh);

      this.particles.push({
        position: pos.clone(),
        velocity: vel,
        color: new THREE.Color(colorHex),
        size: 0.15,
        maxLife: 0.25,
        life: 0,
        mesh,
      });
    }
  }

  public update(dt: number) {
    // Update debris particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        if (p.mesh) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (p.mesh.material instanceof THREE.Material) {
            p.mesh.material.dispose();
          }
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= 18 * dt; // gravity
      p.position.addScaledVector(p.velocity, dt);

      // Floor bounce
      if (p.position.y < 0.2) {
        p.position.y = 0.2;
        p.velocity.y = -p.velocity.y * 0.4;
      }

      if (p.mesh) {
        p.mesh.position.copy(p.position);
        const progress = p.life / p.maxLife;
        const scale = p.size * (1 - progress);
        p.mesh.scale.setScalar(Math.max(0.01, scale));

        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = 1 - progress;
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += dt;

      if (sw.life >= sw.maxLife) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        if (sw.mesh.material instanceof THREE.Material) {
          sw.mesh.material.dispose();
        }
        this.shockwaves.splice(i, 1);
        continue;
      }

      const progress = sw.life / sw.maxLife;
      const currentScale = 1 + progress * (sw.maxRadius * 2);
      sw.mesh.scale.set(currentScale, currentScale, 1);

      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.8;
    }
  }

  public dispose() {
    this.particles.forEach((p) => {
      if (p.mesh) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material instanceof THREE.Material) p.mesh.material.dispose();
      }
    });
    this.particles = [];

    this.shockwaves.forEach((sw) => {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      if (sw.mesh.material instanceof THREE.Material) sw.mesh.material.dispose();
    });
    this.shockwaves = [];
  }
}
