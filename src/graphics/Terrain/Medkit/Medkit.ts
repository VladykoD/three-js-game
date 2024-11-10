import { Object3D, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Hero } from '../../Hero/Hero.ts';
import { SECTOR_SIZE, SectorProps } from '../Terrain.ts';

interface MedkitItem {
    mesh: Object3D;
    collected: boolean;
}

export class Medkit {
    private readonly scene: Scene;

    private medkits: MedkitItem[] = [];

    private readonly medkitSectors: Map<string, SectorProps> = new Map();

    private readonly hero: Hero;

    private medkitGeometry: Object3D;

    public constructor(scene: Scene, hero: Hero) {
        this.scene = scene;
        this.hero = hero;
        this.medkitGeometry = new Object3D();

        const loader = new GLTFLoader();
        loader.load(
            'src/models/medkit_new.glb',
            (gltf) => {
                const model = gltf.scene;
                model.traverse((object: any) => {
                    if (object.isMesh) {
                        object.castShadow = true;
                        object.receiveShadow = true;
                        this.medkitGeometry = model;
                    }
                });
            },
            undefined,
            (error) => {
                console.error('An error happened while loading the model:', error);
            },
        );
    }

    public generateMedkits(sector: SectorProps) {
        if (!this.medkitGeometry) {
            console.warn('Medkit model is not loaded yet.');

            return;
        }

        const [minLimit, maxLimit] = [0, 2]; // Пример лимитов для генерации аптечек
        const amount = minLimit + Math.random() * (maxLimit - minLimit);

        for (let i = 0; i < amount; i++) {
            const x = sector.x + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;
            const y = sector.y + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;
            const mesh = this.medkitGeometry.clone();
            mesh.scale.setScalar(0.05);
            mesh.rotation.set(Math.PI / 2, 0, 0);
            mesh.position.set(x, 0.2, y);
            this.scene.add(mesh);
            const medkit = { mesh, collected: false };
            this.medkits.push(medkit);

            this.medkitSectors.set(medkit.mesh.uuid, sector);
        }
    }

    public dropMedkit(pos: Vector3) {
        if (!this.medkitGeometry) {
            console.warn('Medkit model is not loaded');

            return;
        }

        const mesh = this.medkitGeometry.clone();
        mesh.scale.setScalar(0.15);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.medkits.push({ mesh, collected: false });
    }

    private pickMedkit(idx: number) {
        if (this.hero.stats.hp === this.hero.stats.maxHp) {
            return;
        }
        this.hero.addHp(20);
        this.scene.remove(this.medkits[idx].mesh);
        this.medkits[idx].collected = true;
    }

    public checkPickUp(pos: Vector3) {
        for (const [idx, medkit] of this.medkits.entries()) {
            if (!medkit.collected && medkit.mesh.position.distanceTo(pos) < 2) {
                this.pickMedkit(idx);
            }
        }
    }

    public removeMedkitsInSector(sector: SectorProps) {
        this.medkits = this.medkits.filter((medkit) => {
            const medkitSector = this.medkitSectors.get(medkit.mesh.uuid);
            if (medkitSector && medkitSector.x === sector.x && medkitSector.y === sector.y) {
                this.scene.remove(medkit.mesh);
                this.medkitSectors.delete(medkit.mesh.uuid);

                return false;
            }

            return true;
        });
    }

    public dispose() {
        for (const medkit of this.medkits) {
            this.scene.remove(medkit.mesh);
        }

        this.medkits.length = 0;
    }
}
