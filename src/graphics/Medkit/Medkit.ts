import { Object3D, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Hero } from '../Hero/Hero';
import { SECTOR_SIZE, SectorProps } from '../Terrain/Terrain';

interface MedkitItem {
    mesh: Object3D;
    collected: boolean;
}

export class Medkit {
    private readonly scene: Scene;

    private readonly medkits: MedkitItem[] = [];

    private readonly hero: Hero;

    private medkitGeometry: Object3D;

    public constructor(scene: Scene, hero: Hero) {
        this.scene = scene;
        this.hero = hero;
        this.medkitGeometry = new Object3D();

        const loader = new GLTFLoader();
        loader.load(
            'src/models/health_kit.glb',
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

        const [minLimit, maxLimit] = [2, 10]; // Пример лимитов для генерации аптечек
        const amount = minLimit + Math.random() * (maxLimit - minLimit);

        for (let i = 0; i < amount; i++) {
            const x = sector.x + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;
            const y = sector.y + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;
            const mesh = this.medkitGeometry.clone();
            mesh.scale.setScalar(0.55);
            mesh.position.set(x, 0, y);
            this.scene.add(mesh);
            this.medkits.push({ mesh, collected: false });
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
        if (Hero.stats.hp === Hero.stats.maxHp) {
            return;
        }
        this.hero.addHp(20);
        this.scene.remove(this.medkits[idx].mesh);
        this.medkits[idx].collected = true;
    }

    public checkPickUp(pos: Vector3) {
        for (const [idx, medkit] of this.medkits.entries()) {
            if (!medkit.collected && medkit.mesh.position.distanceTo(pos) < 1) {
                this.pickMedkit(idx);
            }
        }
    }

    public dispose() {
        for (const medkit of this.medkits) {
            this.scene.remove(medkit.mesh);
        }

        this.medkits.length = 0;
    }
}
