import {
    AnimationAction,
    AnimationMixer,
    LoadingManager,
    LoopOnce,
    Mesh,
    Object3D,
    PointLight,
    Scene,
    Vector3,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Weapon, WeaponType } from '../Weapons/Weapon';
import { FireZone } from '../Weapons/FireZone/FireZone';
import { Controls } from '../Controls/Controls.ts';
import { ElectricZone } from '../Weapons/ElectricZone/ElectricZone.ts';

export const LEVELS = [100, 200, 300, 500, 800, 1200, 2000, 4000, 6000, 10000];

export interface HeroStats {
    hp: number;
    maxHp: number;
    speed: number;
    defend: number;
    exp: number;
}

export const InitialStats: HeroStats = {
    hp: 100,
    maxHp: 100,
    speed: 1.5,
    defend: 0,
    exp: 0,
};

export class Hero {
    private readonly walkAction: AnimationAction | null = null;

    private mixer: AnimationMixer | null = null;

    private readonly animationsMap: Map<string, AnimationAction> = new Map();

    private activeAction: AnimationAction | null = null;

    /**
     * Основная группа для персонажа и оружий
     * @private
     */
    private readonly group: Mesh = new Mesh();

    /**
     * Меш персонажа
     * @private
     */
    private hero: Object3D | null = null;

    /**
     * Контролы
     * @private
     */
    private controls: Controls | null = null;

    /**
     * Активные оружия
     * @private
     */
    private readonly weapons: Weapon[] = [];

    public static pos: Vector3 = new Vector3();

    public static stats: HeroStats = InitialStats;

    public constructor(scene: Scene, loadingManager: LoadingManager) {
        const loader = new GLTFLoader(loadingManager);
        loader.load('src/models/Soldier.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            model.scale.setScalar(2);
            this.hero = model;
            const light = new PointLight('#e4de27', 100);
            light.position.set(0, 5, 0);
            this.group.add(light);
            this.mixer = new AnimationMixer(this.hero);
            gltf.animations.forEach((clip) => {
                const action = this.mixer!.clipAction(clip);
                this.animationsMap.set(clip.name, action);
                if (clip.name === 'Idle') {
                    this.activeAction = action;
                    this.activeAction.play();
                }
            });

            const fbxLoader = new FBXLoader(loadingManager);
            fbxLoader.load('src/models/DeathAnimation.fbx', (fbx) => {
                console.log('FBX file loaded:', fbx);
                fbx.animations.forEach((clip) => {
                    console.log('FBX animation:', clip.name);
                    if (clip.name === 'mixamo.com') {
                        const action = this.mixer!.clipAction(clip);
                        this.animationsMap.set(clip.name, action);
                        console.log('Death animation loaded:', clip.name);
                    }
                });
            });

            if (this.hero) {
                this.group.add(this.hero);
                scene.add(this.group);
                this.controls = new Controls(this.hero, this.group, this.walkAction);
                this.addWeapon(WeaponType.ElectricZone);
            }
        });
    }

    /**
     * Проверка на уникальность оружия
     * @param weapon
     * @private
     */
    private handleWeapon(weapon: Weapon) {
        const tw = this.weapons.findIndex((el) => el.type === weapon.type);

        if (tw === -1) {
            this.weapons.push(weapon);
            weapon.setActive();
        }
    }

    /**
     * Добавление нового оружия
     * @param type
     */
    public addWeapon(type: WeaponType) {
        switch (type) {
            case WeaponType.FireZone:
                {
                    const weapon = new FireZone(this.group);
                    this.handleWeapon(weapon);
                }
                break;
            case WeaponType.ElectricZone:
                {
                    const weapon = new ElectricZone(this.group);
                    this.handleWeapon(weapon);
                }
                break;
            default:
                break;
        }
    }

    /**
     * Добаление здоровья
     * @param hp
     */
    public addHp(hp: number) {
        Hero.stats.hp += hp;
        if (Hero.stats.hp > Hero.stats.maxHp) {
            Hero.stats.hp = Hero.stats.maxHp;
        }
    }

    /**
     * Добаление опыта опыта
     * @param val
     */
    public addExp(val: number) {
        Hero.stats.exp += val;
    }

    /**
     * Получить урон
     * @param dmg
     */
    public static getDamage(dmg: number) {
        this.stats.hp -= dmg;
    }

    public die() {
        console.log('Die method called');
        if (this.animationsMap.has('mixamo.com')) {
            const deathAction = this.animationsMap.get('mixamo.com');
            if (deathAction) {
                this.setAnimation('mixamo.com');
                deathAction.clampWhenFinished = true;
                deathAction.loop = LoopOnce;
            }
        } else {
            console.error('Death animation not found');
        }
    }

    /**
     * Получение позиции
     */
    public getPosition() {
        return this.group.position;
    }

    private setAnimation(name: string) {
        const newAction = this.animationsMap.get(name);
        if (newAction && this.activeAction !== newAction) {
            this.activeAction?.fadeOut(0.2);
            newAction.reset().fadeIn(0.2).play();
            this.activeAction = newAction;
        }
    }

    /**
     * Обновление персонажа и оружий
     * @param delta
     */
    public update(delta: number) {
        if (this.controls) {
            this.controls.update(delta);
        }

        // Метод в Controls для проверки движения
        const isMoving = this.controls?.isMoving();

        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (isMoving && this.activeAction?.getClip().name !== 'Walk') {
            this.setAnimation('Walk');
        } else if (!isMoving && this.activeAction?.getClip().name !== 'Idle') {
            this.setAnimation('Idle');
        }

        for (const weapon of this.weapons) {
            weapon.updateWeapon(delta);
        }
        if (Hero.stats.hp <= 0) {
            console.log('Умер');
            this.die();
        }
    }

    /**
     * Очищение ресурсов
     */
    public dispose() {
        this.controls?.dispose();
    }
}
