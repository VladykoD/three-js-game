import { AnimationAction, AnimationMixer, Mesh, Object3D, PointLight, Scene, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Weapon, WeaponType } from './Weapons/Weapon.ts';
import { Controls } from './Controls/Controls.ts';

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
    private mixer: AnimationMixer | null = null;

    private readonly animationsMap: Map<string, AnimationAction> = new Map();

    private activeAction: AnimationAction | null = null;

    private readonly heroGroup: Mesh = new Mesh();

    private heroModel: Object3D | null = null;

    private controls: Controls | null = null;

    private readonly weapons: Weapon[] = [];

    public pos: Vector3 = new Vector3();

    public stats: HeroStats = InitialStats;

    public constructor(scene: Scene) {
        this.loadModel(scene);
    }

    public loadModel(scene: Scene) {
        const loader = new GLTFLoader();
        loader.load('src/models/Soldier.glb', (gltf) => {
            const model = gltf.scene;
            model.traverse((object: any) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });
            model.scale.setScalar(2);
            this.heroModel = model;
            const light = new PointLight('#e4de27', 100);
            light.position.set(0, 5, 0);
            this.heroGroup.add(light);
            this.mixer = new AnimationMixer(this.heroModel);
            gltf.animations.forEach((clip) => {
                const action = this.mixer!.clipAction(clip);
                this.animationsMap.set(clip.name, action);
                if (clip.name === 'Idle') {
                    this.activeAction = action;
                    this.activeAction.play();
                }
            });

            if (this.heroModel) {
                this.heroGroup.add(this.heroModel);
                scene.add(this.heroGroup);
                this.controls = new Controls(this);
                this.initializeWeapons();
            }
        });
    }

    public addHp(hp: number) {
        this.stats.hp += hp;
        if (this.stats.hp > this.stats.maxHp) {
            this.stats.hp = this.stats.maxHp;
        }
    }

    public addExp(val: number) {
        this.stats.exp += val;
    }

    public getDamage(dmg: number) {
        this.stats.hp -= dmg;
    }

    private initializeWeapons() {
        this.handleWeapon(WeaponType.ElectricZone);
        // this.handleWeapon(WeaponType.FireZone);
    }

    private handleWeapon(type: WeaponType) {
        const existingWeapon = this.weapons.find((weapon) => weapon.type === type);

        if (!existingWeapon) {
            const weapon = new Weapon(type, this.heroGroup);
            this.weapons.push(weapon);
            weapon.setActive();
        }
    }

    public setRotation(angle: number) {
        if (this.heroModel) {
            this.heroModel.rotation.y = angle;
        }
    }

    public moveX(value: number) {
        if (this.heroGroup) {
            this.heroGroup.position.x += value;
            this.pos.copy(this.heroGroup.position);
        }
    }

    public moveZ(value: number) {
        if (this.heroGroup) {
            this.heroGroup.position.z += value;
            this.pos.copy(this.heroGroup.position);
        }
    }

    public getX(): number {
        return this.heroGroup.position.x;
    }

    public getZ(): number {
        return this.heroGroup.position.z;
    }

    public stopWalkAnimation() {
        if (this.activeAction && this.activeAction.getClip().name === 'Walk') {
            this.setMotionAnimation('Idle');
        }
    }

    public playWalkAnimation() {
        if (this.activeAction?.getClip().name !== 'Walk') {
            this.setMotionAnimation('Walk');
        }
    }

    public die() {
        if (this.heroModel) {
            this.heroModel.traverse((object: any) => {
                if (object.isMesh) {
                    const { material } = object;
                    material.transparent = true;
                    material.opacity = 0.5;
                    material.color.setRGB(1, 0, 0);
                }
            });
        }
    }

    public reset() {
        if (this.heroModel) {
            this.heroModel.traverse((object: any) => {
                if (object.isMesh) {
                    const { material } = object;
                    material.transparent = false;
                    material.opacity = 1;
                    material.color.setRGB(1, 1, 1);
                }
            });
        }
        this.setMotionAnimation('Idle');
        this.stats = { ...InitialStats };
        this.stats.hp = this.stats.maxHp;
    }

    public getPosition() {
        return this.heroGroup.position;
    }

    private setMotionAnimation(name: string) {
        const newAction = this.animationsMap.get(name);
        if (newAction && this.activeAction !== newAction) {
            this.activeAction?.fadeOut(0.2);
            newAction.reset().fadeIn(0.2).play();
            this.activeAction = newAction;
        }
    }

    public update(delta: number) {
        if (this.controls) {
            this.controls.update(delta);
            this.pos.copy(this.heroGroup.position);
        }

        const isMoving = this.controls?.isMoving();

        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (isMoving && this.activeAction?.getClip().name !== 'Walk') {
            this.setMotionAnimation('Walk');
        } else if (!isMoving && this.activeAction?.getClip().name !== 'Idle') {
            this.setMotionAnimation('Idle');
        }

        for (const weapon of this.weapons) {
            weapon.updateWeapon(delta);
        }
        if (this.stats.hp <= 0) {
            this.die();
        }
    }

    public dispose() {
        this.controls?.dispose();
    }
}
