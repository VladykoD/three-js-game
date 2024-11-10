import { DodecahedronGeometry, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { SECTOR_SIZE, SectorProps } from '../Terrain.ts';
import { Hero } from '../../Hero/Hero.ts';

export enum ConsumableItems {
    AidKit,
    Magnet,
}

export enum Exp {
    Level1 = 20,
    Level2 = 40,
    Level3 = 100,
}

interface ExpSphere {
    mesh: Mesh;
    collected: boolean;
    sector: SectorProps;
}

const CONSUMABLE_SIZE = 0.3;
const DEFAULT_HEIGHT = 1.5;

export class Consumable {
    private readonly scene: Scene;

    private readonly expLimitBySector: [number, number] = [1, 3];

    private expSpheres: ExpSphere[] = [];

    private readonly hero: Hero;

    private readonly expGeometry: DodecahedronGeometry;

    private readonly expMaterial: MeshStandardMaterial;

    public constructor(scene: Scene, hero: Hero) {
        this.scene = scene;
        this.hero = hero;
        this.expGeometry = new DodecahedronGeometry();
        this.expMaterial = new MeshStandardMaterial({
            wireframe: false,
            color: '#5252d5',
            emissive: '#5252d5',
        });
    }

    private createExpSphere(position: Vector3, sector: SectorProps): ExpSphere {
        const mesh = new Mesh(this.expGeometry, this.expMaterial);
        mesh.scale.setScalar(CONSUMABLE_SIZE);
        mesh.position.copy(position);
        this.scene.add(mesh);

        return { mesh, collected: false, sector };
    }

    private getRandomSectorPosition(sector: SectorProps): Vector3 {
        const x = sector.x + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;
        const z = sector.y + Math.random() * SECTOR_SIZE - SECTOR_SIZE * 0.5;

        return new Vector3(x, DEFAULT_HEIGHT, z);
    }

    private getRandomAmount(): number {
        const [minLimit, maxLimit] = this.expLimitBySector;

        return minLimit + Math.random() * (maxLimit - minLimit);
    }

    public generateExperience(sector: SectorProps) {
        const amount = this.getRandomAmount();
        for (let i = 0; i < amount; i++) {
            const position = this.getRandomSectorPosition(sector);
            const expSphere = this.createExpSphere(position, sector);
            this.expSpheres.push(expSphere);
        }
    }

    public dropExpSphere(pos: Vector3) {
        const sector: SectorProps = {
            x: Math.floor(pos.x / SECTOR_SIZE) * SECTOR_SIZE,
            y: Math.floor(pos.z / SECTOR_SIZE) * SECTOR_SIZE,
        };
        const expSphere = this.createExpSphere(pos, sector);
        this.expSpheres.push(expSphere);
    }

    private pickExp(idx: number) {
        this.hero.addExp(Exp.Level1);
        this.scene.remove(this.expSpheres[idx].mesh);
        this.expSpheres[idx].collected = true;
    }

    public checkPickUp(pos: Vector3, radius: number = 2) {
        for (const [idx, expSphere] of this.expSpheres.entries()) {
            if (!expSphere.collected && expSphere.mesh.position.distanceTo(pos) < radius) {
                this.pickExp(idx);
            }
        }
    }

    public removeExpSpheresInSector(sector: SectorProps) {
        this.expSpheres = this.expSpheres.filter((expSphere) => {
            if (expSphere.sector.x === sector.x && expSphere.sector.y === sector.y) {
                this.scene.remove(expSphere.mesh);

                return false;
            }

            return true;
        });
    }

    public dispose() {
        for (const expSphere of this.expSpheres) {
            this.scene.remove(expSphere.mesh);
        }
        this.expSpheres.length = 0;
    }
}
