import { Scene, Vector3 } from 'three';
import { Enemies } from '../Enemies/Enemies.ts';
import { Terrain } from '../Terrain/Terrain.ts';
import { FrameHandler } from '../../helpers/FrameHandler.ts';
import { Timer } from './Timer/Timer.ts';
import { Consumable } from '../Terrain/Consumable/Consumable.ts';
import { Medkit } from '../Terrain/Medkit/Medkit.ts';
import { Hero } from '../Hero/Hero.ts';

export class Levels {
    private readonly scene: Scene;

    private readonly hero: Hero;

    private readonly consumable: Consumable;

    private readonly medkit: Medkit;

    private readonly timer: Timer;

    private readonly hpCallback: (hp: number) => void;

    private readonly frameHandler: FrameHandler;

    private terrain: Terrain;

    private paused: boolean = false;

    private readonly updateCameraCallback: (position: Vector3, delta: number) => void;

    public constructor(
        scene: Scene,
        timeEl: HTMLDivElement,
        hpCallback: (hp: number) => void,
        updateCameraCallback: (position: Vector3, delta: number) => void,
    ) {
        this.scene = scene;
        this.hero = new Hero(this.scene);
        this.consumable = new Consumable(this.scene, this.hero);
        this.medkit = new Medkit(this.scene, this.hero);
        this.timer = new Timer(timeEl);
        this.terrain = new Terrain(this.scene, this.hero);
        this.hpCallback = hpCallback;
        this.updateCameraCallback = updateCameraCallback;

        this.frameHandler = new FrameHandler(this.update.bind(this));

        this.initializeEnemies();
    }

    public update(delta: number) {
        if (!this.paused) {
            this.timer.update();
            this.hero.update(delta);
            this.terrain.update(delta, this.hero);
            Enemies.update(delta);

            this.consumable.checkPickUp(this.hero.getPosition());
            this.medkit.checkPickUp(this.hero.getPosition());

            if (this.hpCallback) {
                this.hpCallback(this.hero.stats.hp);
            }
            this.updateCameraCallback(this.hero.getPosition(), delta);
        }
    }

    private initializeEnemies() {
        Enemies.init(this.scene, this.hero, this.consumable, this.medkit);
        Enemies.setSpawnRate(1000);
    }

    public togglePause() {
        this.paused = !this.paused;

        if (this.paused) {
            Enemies.setSpawnRate(0);
        } else {
            this.timer.updateTimeStart();
            Enemies.setSpawnRate(1000);
        }
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public restartGame() {
        Enemies.dispose();
        this.consumable.dispose();
        this.terrain.dispose();
        this.timer.clear();

        this.initializeEnemies();
        this.hero.reset();

        this.terrain = new Terrain(this.scene, this.hero);
    }

    public dispose() {
        this.frameHandler.stop();
        this.terrain.dispose();
        this.hero.dispose();
        Enemies.dispose();
    }
}
