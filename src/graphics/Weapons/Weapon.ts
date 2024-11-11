import { Mesh } from 'three';

export enum WeaponType {
    FireZone,
    ElectricZone,
}

export abstract class Weapon {
    /**
     * Меш персонажа
     * @protected
     */
    protected readonly hero: Mesh;

    /**
     * Тип оружия
     */
    public abstract type: WeaponType;

    /**
     * Получено ли оружие
     * @protected
     */
    protected active: boolean = false;

    /**
     * Уровень оружия
     * @protected
     */
    protected abstract level: number;

    /**
     * Меш для оружия
     * @protected
     */
    protected abstract mesh: Mesh;

    protected constructor(hero: Mesh) {
        this.hero = hero;
    }

    /**
     * Активация оружия
     */
    public setActive() {
        this.active = true;

        if (this.mesh) {
            this.hero.add(this.mesh);
        } else {
            console.warn('[Weapon] Mesh is not defined');
        }
    }

    /**
     *  Получение уровня оружия
     */
    public levelUp() {
        this.level += 1;
    }

    /**
     * Обнолвение для оружия
     * @param _delta
     */
    public abstract updateWeapon(_delta: number): void;
}
