import { CircleGeometry, Mesh, ShaderMaterial } from 'three';
import fragShader from './mat.frag.glsl?raw';
import vertShader from './mat.vert.glsl?raw';
import { Weapon, WeaponType } from '../Weapon';
import { Enemies } from '../../Enemies/Enemies';

export class FireZone extends Weapon {
    public readonly type: WeaponType = WeaponType.FireZone;

    protected readonly mesh: Mesh = new Mesh();

    private readonly material: ShaderMaterial;

    private readonly rad: number = 3.33;

    private readonly damage: number = 2;

    protected readonly level: number = 0;

    private time: number = 0;

    public constructor(hero: Mesh) {
        super(hero);

        this.material = new ShaderMaterial({
            fragmentShader: fragShader,
            vertexShader: vertShader,
            uniforms: {
                time: { value: 0 },
            },
            transparent: true,
        });

        const geo = new CircleGeometry(this.rad, 64);
        this.mesh = new Mesh(geo, this.material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -0.5;
    }

    public setActive() {
        super.setActive();
    }

    public levelUp() {
        super.levelUp();
    }

    public updateWeapon(_delta: number) {
        this.time += _delta * 0.01;
        this.material.uniforms.time.value = this.time;

        const enemies = Enemies.getEnemies();

        for (const enemy of enemies) {
            const { mesh } = enemy;

            if (this.hero.position.distanceTo(mesh.position) < this.rad) {
                enemy.hp -= this.damage;
            }
        }
    }
}
