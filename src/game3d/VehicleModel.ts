import * as THREE from 'three';

export interface VehicleMeshBundle {
  root: THREE.Group;
  turret: THREE.Group;
  thrusters: THREE.Mesh[];
  shieldMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  shieldBarFill: THREE.Mesh;
  hpBillboard: THREE.Group;
}

export function createVehicleMesh(
  primaryColor: number = 0x0284c7,
  accentColor: number = 0x38bdf8,
  isBot: boolean = false
): VehicleMeshBundle {
  const root = new THREE.Group();

  // Hull / Main Chassis
  const hullGeo = new THREE.BoxGeometry(2.4, 0.7, 3.2);
  const hullMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness: 0.4,
    roughness: 0.35,
  });
  const bodyMesh = new THREE.Mesh(hullGeo, hullMat);
  bodyMesh.position.y = 0.65;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  root.add(bodyMesh);

  // Front wedge / armored nose
  const noseGeo = new THREE.CylinderGeometry(0.2, 1.2, 1.4, 4);
  const noseMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.5,
    roughness: 0.3,
  });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.rotation.y = Math.PI / 4;
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.6, 2.0);
  root.add(nose);

  // Side armored tracks / hover pods
  const podGeo = new THREE.BoxGeometry(0.6, 0.5, 3.4);
  const podMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.7,
    roughness: 0.4,
  });

  const leftPod = new THREE.Mesh(podGeo, podMat);
  leftPod.position.set(-1.4, 0.45, 0);
  root.add(leftPod);

  const rightPod = new THREE.Mesh(podGeo, podMat);
  rightPod.position.set(1.4, 0.45, 0);
  root.add(rightPod);

  // Turret Mount
  const turret = new THREE.Group();
  turret.position.set(0, 1.05, 0);

  const turretBaseGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.4, 8);
  const turretBaseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.2,
  });
  const turretBase = new THREE.Mesh(turretBaseGeo, turretBaseMat);
  turret.add(turretBase);

  // Dual Rocket Launch Tubes
  const tubeGeo = new THREE.CylinderGeometry(0.2, 0.22, 1.6, 8);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.6,
    roughness: 0.25,
  });

  const tubeLeft = new THREE.Mesh(tubeGeo, tubeMat);
  tubeLeft.rotation.x = Math.PI / 2;
  tubeLeft.position.set(-0.45, 0.3, 0.6);
  turret.add(tubeLeft);

  const tubeRight = new THREE.Mesh(tubeGeo, tubeMat);
  tubeRight.rotation.x = Math.PI / 2;
  tubeRight.position.set(0.45, 0.3, 0.6);
  turret.add(tubeRight);

  // Center targeting radar antenna
  const radarGeo = new THREE.BoxGeometry(0.25, 0.4, 0.1);
  const radarMat = new THREE.MeshBasicMaterial({ color: isBot ? 0xef4444 : 0x10b981 });
  const radar = new THREE.Mesh(radarGeo, radarMat);
  radar.position.set(0, 0.45, -0.4);
  turret.add(radar);

  root.add(turret);

  // Hover thrusters exhaust glow
  const thrusters: THREE.Mesh[] = [];
  const exhaustGeo = new THREE.ConeGeometry(0.25, 0.7, 6);
  const exhaustMat = new THREE.MeshBasicMaterial({
    color: isBot ? 0xff4422 : 0x00f0ff,
    transparent: true,
    opacity: 0.85,
  });

  const leftExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  leftExhaust.rotation.x = -Math.PI / 2;
  leftExhaust.position.set(-1.4, 0.45, -1.8);
  root.add(leftExhaust);
  thrusters.push(leftExhaust);

  const rightExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
  rightExhaust.rotation.x = -Math.PI / 2;
  rightExhaust.position.set(1.4, 0.45, -1.8);
  root.add(rightExhaust);
  thrusters.push(rightExhaust);

  // Shield Bubble
  const shieldGeo = new THREE.SphereGeometry(2.5, 12, 8);
  const shieldMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0,
  });
  const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
  shieldMesh.position.y = 0.8;
  root.add(shieldMesh);

  // 3D HP/Shield Billboard floating above vehicle
  const hpBillboard = new THREE.Group();
  hpBillboard.position.set(0, 2.7, 0);

  // Background black plate
  const barBgGeo = new THREE.PlaneGeometry(2.4, 0.38);
  const barBgMat = new THREE.MeshBasicMaterial({ color: 0x020617, side: THREE.DoubleSide, opacity: 0.8, transparent: true });
  const barBg = new THREE.Mesh(barBgGeo, barBgMat);
  hpBillboard.add(barBg);

  // HP Bar fill (green to red)
  const hpFillGeo = new THREE.PlaneGeometry(2.2, 0.14);
  hpFillGeo.translate(1.1, 0, 0); // Origin at left edge
  const hpFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
  const hpBarFill = new THREE.Mesh(hpFillGeo, hpFillMat);
  hpBarFill.position.set(-1.1, -0.06, 0.01);
  hpBillboard.add(hpBarFill);

  // Shield Bar fill (cyan)
  const shieldFillGeo = new THREE.PlaneGeometry(2.2, 0.1);
  shieldFillGeo.translate(1.1, 0, 0);
  const shieldFillMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide });
  const shieldBarFill = new THREE.Mesh(shieldFillGeo, shieldFillMat);
  shieldBarFill.position.set(-1.1, 0.08, 0.01);
  hpBillboard.add(shieldBarFill);

  root.add(hpBillboard);

  return {
    root,
    turret,
    thrusters,
    shieldMesh,
    bodyMesh,
    hpBarFill,
    shieldBarFill,
    hpBillboard,
  };
}
