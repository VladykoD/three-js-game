import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Hero } from '../Hero/Hero';
import { Consumable } from '../Terrain/Consumable/Consumable.ts';

export interface Enemy {
    mesh: Object3D;
    model: Object3D | null;
    speed: number;
    damage: number;
    hp: number;
    maxHp: number;
    isDying?: boolean;
    deathAnimation?: {
        startTime: number;
        duration: number;
    };
    instanceId?: number;
}

const DEATH_ANIMATION_DURATION = 200;
const ENEMY_POOL_SIZE = 50;

const ENEMY_STATS = [
    { speed: 0.06, hp: 100, damage: 1, maxHp: 100, isDying: false },
    { speed: 0.08, hp: 150, damage: 2, maxHp: 150, isDying: false },
    { speed: 0.1, hp: 200, damage: 3, maxHp: 200, isDying: false },
];

export class Enemies {
    private static readonly enemies: Enemy[] = [];

    // Пул врагов для инстансинга
    private static readonly enemyPool: Enemy[] = [];

    private static nextInstanceId = 0;

    private static genInt: number = 0;

    private static scene: Scene;

    private static hero: Hero;

    private static consumable: Consumable;

    private static enemyModel: Object3D | null = null;

    public static init(scene: Scene, hero: Hero, consumable: Consumable) {
        if (!scene || !hero || !consumable) {
            throw new Error('Scene, Hero, and Consumable are required to initialize Enemies.');
        }
        this.scene = scene;
        this.hero = hero;
        this.consumable = consumable;

        this.initPool();
        this.loadModel();
    }

    // Предварительное создание врагов для быстрого инстансинга
    public static initPool() {
        for (let i = 0; i < ENEMY_POOL_SIZE; i++) {
            const collisionMesh = new Mesh(
                new BoxGeometry(0.5, 0.5, 0.5),
                new MeshBasicMaterial({ visible: false }),
            );

            this.enemyPool.push({
                mesh: collisionMesh,
                model: null,
                speed: 0.06,
                hp: 100,
                damage: 10,
                maxHp: 100,
                instanceId: this.nextInstanceId++,
            });
        }
    }

    // получение врага из пула
    private static getEnemyFromPool(): Enemy | null {
        const enemy = this.enemyPool.find((e) => !e.model);

        if (enemy) {
            const newEnemy = {
                ...enemy,
                ...ENEMY_STATS[0],
                mesh: enemy.mesh.clone(),
                deathAnimation: undefined,
                isDying: false,
            };

            if (newEnemy.model) {
                newEnemy.model.traverse((object: any) => {
                    if (object.isMesh && object.userData.originalMaterial) {
                        object.material = object.userData.originalMaterial;
                        delete object.userData.originalMaterial;
                    }
                });
            }

            this.enemies.push(newEnemy);

            return newEnemy;
        }

        return null;
    }

    public static loadModel() {
        const loader = new GLTFLoader();
        loader.load('src/models/alien_flying_min.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            model.scale.setScalar(10);
            this.enemyModel = model;
        });
    }

    private static generateEnemy() {
        const enemy = this.getEnemyFromPool();
        if (!enemy) {
            return;
        }

        const dist = 9 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;

        let heroPos: Vector3;
        try {
            heroPos = this.hero.getPosition ? this.hero.getPosition() : new Vector3(0, 0, 0);
        } catch (error) {
            console.error('Error getting hero position:', error);
            heroPos = new Vector3(0, 0, 0);
        }

        const x = Math.sin(angle) * dist + heroPos.x;
        const z = Math.cos(angle) * dist + heroPos.z;

        enemy.mesh.position.set(x, 0, z);

        if (this.enemyModel) {
            enemy.model = this.enemyModel.clone();
            enemy.model.position.copy(enemy.mesh.position);
            this.scene.add(enemy.model);
        }

        this.scene.add(enemy.mesh);
    }

    private static startDeathAnimation(enemy: Enemy) {
        enemy.isDying = true;
        enemy.deathAnimation = {
            startTime: Date.now(),
            duration: DEATH_ANIMATION_DURATION,
        };

        if (enemy.model) {
            enemy.model.traverse((object: any) => {
                if (object.isMesh) {
                    const originalMaterial = object.material;
                    const deathMaterial = originalMaterial.clone();
                    deathMaterial.transparent = true;
                    deathMaterial.opacity = 0.5;
                    deathMaterial.color.setRGB(1, 0, 0);

                    object.userData.originalMaterial = originalMaterial;
                    object.material = deathMaterial;
                }
            });
        }
    }

    private static updateDeathAnimation(enemy: Enemy) {
        if (!enemy.deathAnimation) {
            return false;
        }

        const elapsedTime = Date.now() - enemy.deathAnimation.startTime;
        const progress = elapsedTime / enemy.deathAnimation.duration;

        if (progress >= 1) {
            return true;
        }

        if (enemy.model) {
            enemy.model.position.y = 0.3 - progress;
        }
        enemy.mesh.position.y = -progress;

        return false;
    }

    private static killEnemy(idx: number) {
        const enemy = this.enemies[idx];
        if (enemy) {
            if (!enemy.isDying) {
                this.consumable.dropExpSphere(enemy.mesh.position);
                this.startDeathAnimation(enemy);
            } else {
                this.scene.remove(enemy.mesh);
                if (enemy.model) {
                    this.scene.remove(enemy.model);
                }
                this.enemies.splice(idx, 1);
            }
        }
    }

    public static update(delta: number) {
        const heroPos = this.hero.getPosition();
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const { mesh, model, hp, speed, damage, isDying } = enemy;

            if (isDying) {
                if (this.updateDeathAnimation(enemy)) {
                    this.killEnemy(i);
                }
                continue;
            }

            mesh.lookAt(heroPos);
            mesh.position.addScaledVector(
                heroPos.clone().sub(mesh.position).normalize(),
                speed * delta,
            );

            if (model) {
                model.position.copy(mesh.position);
                model.position.y = 0.2;
                model.lookAt(heroPos);
            }

            if (hp < 0) {
                this.killEnemy(i);
            } else if (mesh.position.distanceTo(heroPos) < 0.5) {
                this.hero.getDamage(damage);
            }
        }
    }

    public static dispose() {
        clearInterval(this.genInt);
        this.enemies.forEach((enemy) => {
            this.scene.remove(enemy.mesh);
            if (enemy.model) {
                this.scene.remove(enemy.model);
            }
        });
        this.enemies.length = 0;
        this.enemyPool.length = 0;
        this.enemyModel = null;
        this.nextInstanceId = 0;
    }

    public static setSpawnRate(spawnRate: number) {
        if (this.genInt) {
            clearInterval(this.genInt);
            this.genInt = 0;
        }

        if (spawnRate > 0) {
            this.genInt = setInterval(() => {
                this.generateEnemy();
            }, spawnRate);
        }
    }

    public static getEnemies(): Enemy[] {
        return this.enemies;
    }
}
