import { DoubleSide, Mesh, ShaderMaterial, TorusGeometry } from 'three';

import fireVertShader from './FireZone/mat.vert.glsl?raw';
import fireFragShader from './FireZone/mat.frag.glsl?raw';

import electricVertShader from './ElectricZone/mat.vert.glsl?raw';
import electricFragShader from './ElectricZone/mat.frag.glsl?raw';

export enum WeaponType {
    FireZone,
    ElectricZone,
    // IseZone
    // WindZone
}

interface WeaponStats {
    damage: number;
    radius: number;
    timeScale: number;
}

export class Weapon {
    public readonly type: WeaponType;

    private readonly hero: Mesh;

    private readonly mesh: Mesh;

    private readonly material: ShaderMaterial;

    private time: number = 0;

    // private readonly level: number = 0;

    private readonly stats: WeaponStats;

    public constructor(type: WeaponType, hero: Mesh) {
        this.type = type;
        this.hero = hero;

        const isFireZone = type === WeaponType.FireZone;

        this.stats = {
            damage: 2,
            radius: 3,
            timeScale: isFireZone ? 0.01 : 0.5,
        };

        this.material = new ShaderMaterial({
            fragmentShader: isFireZone ? fireFragShader : electricFragShader,
            vertexShader: isFireZone ? fireVertShader : electricVertShader,
            uniforms: {
                time: { value: 0 },
            },
            transparent: true,
            side: DoubleSide,
        });

        const geo = new TorusGeometry(this.stats.radius, 1, 8);
        this.mesh = new Mesh(geo, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -0.5;
    }

    public setActive() {
        if (this.mesh) {
            this.hero.add(this.mesh);
        } else {
            console.warn('[Zone] Mesh is not defined');
        }
    }

    public updateWeapon(delta: number) {
        this.time += delta * this.stats.timeScale;
        this.material.uniforms.time.value = this.time;
    }

    /*
    private updateStats() {
        this.stats = {
            damage: 2 * (1 + this.level * 0.2),
            radius: 3 * (1 + this.level * 0.1),
            timeScale: this.type === WeaponType.FireZone ? 0.01 : 0.5,
        };
    }
*/
    public getLevel(): number {
        // return this.level;

        return 1;
    }

    public getStats(): WeaponStats {
        return { ...this.stats };
    }
}
