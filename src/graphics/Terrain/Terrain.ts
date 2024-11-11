import {
    Material,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PlaneGeometry,
    Scene,
    TextureLoader,
    Vector2,
    Vector3,
} from 'three';
import { Consumable } from './Consumable/Consumable.ts';
import { Hero } from '../Hero/Hero';
import { Medkit } from './Medkit/Medkit.ts';
import { Tree } from './Threes/Tree.ts';

export interface SectorProps {
    x: number;
    y: number;
}

export const SECTOR_SIZE: number = 30.0;
export const PICKUP_RADIUS: number = 2.0;

export class Terrain {
    private readonly scene: Scene;

    private readonly sectors: Set<string> = new Set();

    private readonly curSector: Vector2 = new Vector2(0, 0);

    private readonly sectorMeshes: Map<string, Mesh[]> = new Map();

    private readonly consumable: Consumable;

    private readonly medkit: Medkit;

    private readonly tree: Tree;

    private ambienceSound: HTMLAudioElement | null = null;

    private userInteracted: boolean = false;

    public constructor(scene: Scene, hero: Hero) {
        this.scene = scene;
        this.consumable = new Consumable(scene, hero);
        this.medkit = new Medkit(scene, hero);
        this.tree = new Tree(scene);
        this.generateSector(0, 0);
        this.loadTreeModel();
        this.setAmbienceSound();
    }

    private getSectorKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    private updateCurrentSector(hero: Hero) {
        const { x, z } = hero.getPosition();
        const secX = Math.round(x / SECTOR_SIZE) * SECTOR_SIZE;
        const secY = Math.round(z / SECTOR_SIZE) * SECTOR_SIZE;
        this.curSector.set(secX, secY);
    }

    private generateNearSectors(hero: Hero) {
        this.updateCurrentSector(hero);
        const { x, y } = this.curSector;
        const nearCoords: SectorProps[] = [
            { x: x + SECTOR_SIZE, y },
            { x, y: y + SECTOR_SIZE },
            { x: x + SECTOR_SIZE, y: y + SECTOR_SIZE },
            { x: x + SECTOR_SIZE, y: y - SECTOR_SIZE },
            { x: x - SECTOR_SIZE, y },
            { x, y: y - SECTOR_SIZE },
            { x: x - SECTOR_SIZE, y: y - SECTOR_SIZE },
            { x: x - SECTOR_SIZE, y: y + SECTOR_SIZE },
        ];

        nearCoords.forEach(({ x: nearX, y: nearY }) => {
            this.generateNearSector(nearX, nearY);
        });
    }

    private generateNearSector(x: number, y: number) {
        const key = this.getSectorKey(x, y);
        if (!this.sectors.has(key)) {
            this.generateSector(x, y);
        }
    }

    private generateSector(x: number, y: number) {
        const key = this.getSectorKey(x, y);
        const sector = new Mesh(
            new PlaneGeometry(SECTOR_SIZE, SECTOR_SIZE),
            new MeshBasicMaterial({
                color: 0x000000,
                depthWrite: false,
                transparent: true,
                opacity: 0,
            }),
        );
        const sectorShadow = new Mesh(
            new PlaneGeometry(SECTOR_SIZE, SECTOR_SIZE),
            new MeshStandardMaterial({
                map: new TextureLoader().load('../../../static/textures/color.jpg'),
                normalMap: new TextureLoader().load('../../../static/textures/normal.jpg'),
                // depthWrite: false,
            }),
        );
        sector.receiveShadow = true;
        sectorShadow.receiveShadow = true;
        sector.position.set(x, 0, y);
        sector.rotation.x = -Math.PI * 0.5;
        sectorShadow.position.copy(sector.position).add(new Vector3(0, 0.1, 0));
        sectorShadow.rotation.copy(sector.rotation);

        this.scene.add(sector, sectorShadow);
        this.sectors.add(key);

        this.consumable.generateExperience({ x, y });
        this.medkit.generateMedkits({ x, y });
        this.tree.generateTrees({ x, y });
        this.consumable.removeExpSpheresInSector({ x, y });
    }

    private disposeSector(key: string) {
        const meshes = this.sectorMeshes.get(key);
        if (meshes) {
            meshes.forEach((mesh) => {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                if (mesh.material instanceof Material) {
                    mesh.material.dispose();
                }
            });
            this.sectorMeshes.delete(key);
        }
        this.sectors.delete(key);

        // Удаление деревьев для данного сектора
        const [x, y] = key.split(',').map(Number);
        this.tree.removeTreesInSector({ x, y });
        this.medkit.removeMedkitsInSector({ x, y });
    }

    public update(_delta: number, hero: Hero) {
        this.generateNearSectors(hero);
        this.consumable.checkPickUp(hero.getPosition(), PICKUP_RADIUS);
        this.medkit.checkPickUp(hero.getPosition());
    }

    public dispose() {
        for (const key of this.sectors) {
            this.disposeSector(key);
        }

        this.consumable.dispose();
        this.tree.dispose();
        this.medkit.dispose();
    }

    public setAmbienceSound() {
        this.ambienceSound = new Audio('../../../static/sounds/ambient-sound.mp3');
        this.ambienceSound.volume = 0.2;
        this.ambienceSound.loop = true;

        this.userInteracted = false;

        const playAmbienceSound = () => {
            if (!this.userInteracted) {
                this.userInteracted = true;
                this.ambienceSound!.play();
            }
        };

        document.addEventListener('click', playAmbienceSound, { once: true });
        document.addEventListener('keydown', playAmbienceSound, { once: true });
    }
}
