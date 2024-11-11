import { Mesh, MeshBasicMaterial, OctahedronGeometry } from 'three';
import { Weapon, WeaponType } from '../Weapon';

export class BackShot extends Weapon {
    protected mesh: Mesh;

    public type: WeaponType = WeaponType.BackShot;

    protected level: number = 0;

    public rad: number = 3.33;

    public constructor(hero: Mesh) {
        super(hero);

        const geo = new OctahedronGeometry();
        const mat = new MeshBasicMaterial();
        this.mesh = new Mesh(geo, mat);
    }

    public updateWeapon(_delta: number): void {}
}
