import { Group, Object3D, Object3DEventMap, Scene } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SECTOR_SIZE, SectorProps } from '../Terrain.ts';
import { clamp } from '../../../helpers/MathUtils.ts';

interface TreeItem {
    mesh: Object3D;
    sector: SectorProps;
    instanceId?: number;
}

const TREE_POOL_SIZE = 50;
const TREE_STATS = {
    minScale: 0.6,
    maxScale: 1.4,
};

export class Tree {
    private readonly scene: Scene;

    private treeModel: Group<Object3DEventMap> | null = null;

    private readonly trees: TreeItem[] = [];

    private readonly treePool: TreeItem[] = [];

    private pendingSectors: SectorProps[] = [];

    private nextInstanceId = 0;

    public constructor(scene: Scene) {
        this.scene = scene;
        this.initPool();
        this.loadTreeModel();
    }

    // Создание пустых объектов для быстрого последующего использования
    private initPool() {
        for (let i = 0; i < TREE_POOL_SIZE; i++) {
            const mesh = new Object3D();
            this.treePool.push({
                mesh,
                sector: { x: 0, y: 0 },
                instanceId: this.nextInstanceId++,
            });
        }
    }

    // Находит неиспользуемый объект в пуле и использует его
    private getTreeFromPool(): TreeItem | null {
        const tree = this.treePool.find((t) => !t.mesh.parent);
        if (tree) {
            const newTree = {
                ...tree,
                mesh: tree.mesh.clone(),
                instanceId: this.nextInstanceId++,
            };
            this.trees.push(newTree);

            return newTree;
        }

        return null;
    }

    private loadTreeModel() {
        const loader = new GLTFLoader();
        loader.load('src/models/mushroom_min.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object) => {
                if (object) {
                    object.castShadow = true;
                    object.receiveShadow = true;
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
            const tree = this.getTreeFromPool();
            if (!tree) {
                break;
            }

            const x = sector.x + (Math.random() - 0.5) * SECTOR_SIZE;
            const y = sector.y + (Math.random() - 0.5) * SECTOR_SIZE;

            const clonedModel = this.treeModel.clone();
            clonedModel.position.set(x, 0, y);
            this.scene.add(clonedModel);

            tree.mesh = clonedModel;
            tree.sector = sector;

            const randomHeight = clamp(
                Math.random() * TREE_STATS.maxScale + TREE_STATS.minScale,
                TREE_STATS.minScale,
                TREE_STATS.maxScale,
            );
            tree.mesh.scale.setScalar(randomHeight);
        }
    }

    public removeTreesInSector(sector: SectorProps) {
        this.trees.forEach((tree, index) => {
            if (tree.sector.x === sector.x && tree.sector.y === sector.y) {
                this.scene.remove(tree.mesh);
                // возвращаем дерево в пул для переиспользования
                this.treePool.push(tree);
                this.trees.splice(index, 1);
            }
        });
    }

    public dispose() {
        for (const tree of this.trees) {
            this.scene.remove(tree.mesh);
        }
        this.trees.length = 0;
        this.treePool.length = 0;
        this.pendingSectors = [];
        this.nextInstanceId = 0;
    }

    public getTrees(): TreeItem[] {
        return this.trees;
    }
}
