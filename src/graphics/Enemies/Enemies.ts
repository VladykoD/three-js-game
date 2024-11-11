import { BoxGeometry, Mesh, MeshBasicMaterial, Object3D, Scene } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Hero } from '../Hero/Hero';
import { Consumable } from '../Consumable/Consumable.ts';
import { Medkit } from '../Medkit/Medkit.ts';

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
}

const DEATH_ANIMATION_DURATION = 200;

/*
const ENEMY_STATS = [
    { speed: 0.06, hp: 100, damage: 1, maxHp: 100 },
    { speed: 0.08, hp: 150, damage: 2, maxHp: 150 },
    { speed: 0.1, hp: 200, damage: 3, maxHp: 200 },
];

 */

export class Enemies {
    private static readonly enemies: Enemy[] = [];

    private static genInt: number = 0;

    private static scene: Scene;

    private static hero: Hero;

    private static consumable: Consumable;

    private static enemyModel: Object3D | null = null;

    // private static getEnemyStats(level: number): Omit<Enemy, 'mesh' | 'model'>

    public static init(scene: Scene, hero: Hero, consumable: Consumable, medkit: Medkit) {
        if (!scene || !hero || !consumable || !medkit) {
            throw new Error('Scene, Hero, and Consumable are required to initialize Enemies.');
        }
        this.scene = scene;
        this.hero = hero;
        this.consumable = consumable;

        const loader = new GLTFLoader();
        loader.load('src/models/alien.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            model.scale.setScalar(0.7);
            this.enemyModel = model;
        });
    }

    private static generateEnemy() {
        const dist = 9 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const heroPos = this.hero.getPosition();
        const x = Math.sin(angle) * dist + heroPos.x;
        const z = Math.cos(angle) * dist + heroPos.z;

        const collisionMesh = new Mesh(
            new BoxGeometry(0.5, 0.5, 0.5),
            new MeshBasicMaterial({ visible: false }),
        );

        let enemyModel: Object3D | null = null;
        if (this.enemyModel) {
            enemyModel = this.enemyModel.clone();
            enemyModel.traverse((object: any) => {
                if (object.isMesh) {
                    object.material = object.material.clone();
                    object.material.transparent = false;
                    object.material.opacity = 1;
                    object.material.color.setRGB(1, 1, 1);
                }
            });

            enemyModel.position.set(x, 0, z);
            enemyModel.position.y = 0.25;
            this.scene.add(enemyModel);
        }

        collisionMesh.position.set(x, 0, z);
        this.scene.add(collisionMesh);

        const stats: Omit<Enemy, 'mesh' | 'model'> = {
            speed: 0.06,
            hp: 100,
            damage: 1,
            maxHp: 100,
        };

        this.enemies.push({
            mesh: collisionMesh,
            model: enemyModel,
            ...stats,
        });
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
                    const { material } = object;
                    material.transparent = true;
                    material.opacity = 0.5;
                    material.color.setRGB(1, 0, 0);
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

        // Плавное опускание вниз
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
                Hero.getDamage(damage);
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
