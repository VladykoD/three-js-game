import { Group, Object3D, Object3DEventMap, Scene } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SECTOR_SIZE, SectorProps } from '../Terrain.ts';
import { clamp } from '../../../helpers/MathUtils.ts';

interface TreeItem {
    mesh: Object3D;
    sector: SectorProps;
}

export class Tree {
    private readonly scene: Scene;

    private treeModel: Group<Object3DEventMap> | null = null;

    private trees: TreeItem[] = [];

    private pendingSectors: SectorProps[] = [];

    public constructor(scene: Scene) {
        this.scene = scene;
        this.loadTreeModel();
    }

    private loadTreeModel() {
        const loader = new GLTFLoader();
        loader.load('src/models/mushroom_min.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object) => {
                if (object) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    object.scale.setScalar(1.2);
                }
            });
            this.treeModel = model;
            this.generatePendingTrees();
        });
    }

    private generatePendingTrees() {
        while (this.pendingSectors.length > 0) {
            const sector = this.pendingSectors.pop();
            if (sector) {
                this.generateTrees(sector);
            }
        }
    }

    public generateTrees(sector: SectorProps) {
        if (!this.treeModel) {
            this.pendingSectors.push(sector);

            return;
        }

        const numTrees = 6;

        for (let i = 0; i < numTrees; i++) {
            const x = sector.x + (Math.random() - 0.5) * SECTOR_SIZE;
            const y = sector.y + (Math.random() - 0.5) * SECTOR_SIZE;
            const mesh = this.treeModel.clone();
            mesh.position.set(x, 0, y);
            this.scene.add(mesh);

            const randomHeight = clamp(Math.random() * 0.5 + 0.7, 0.5, 1.2);
            mesh.scale.setScalar(randomHeight);
            this.trees.push({ mesh, sector });
        }
    }

    public removeTreesInSector(sector: SectorProps) {
        this.trees = this.trees.filter((tree) => {
            if (tree.sector.x === sector.x && tree.sector.y === sector.y) {
                this.scene.remove(tree.mesh);

                return false;
            }

            return true;
        });
    }

    public dispose() {
        for (const tree of this.trees) {
            this.scene.remove(tree.mesh);
        }
        this.trees = [];
        this.pendingSectors = [];
    }
}
