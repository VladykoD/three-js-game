import {
    AmbientLight,
    DirectionalLight,
    FogExp2,
    PCFShadowMap,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from 'three';
import { FrameHandler } from '../helpers/FrameHandler';
import { damp } from '../helpers/MathUtils';
import { Terrain } from './Terrain/Terrain';
import { Hero } from './Hero/Hero';
import { Timer } from './Timer/Timer';
import { Enemies } from './Enemies/Enemies';
import { Consumable } from './Consumable/Consumable';
import { Medkit } from './Medkit/Medkit.ts';
import { Preloader } from './UI/Preloader.ts';

// import sources from '../sources.ts';
// import Resources from './Utils/Resources.ts';

const CAMERA_POSITION = new Vector3(0, 15, 0);
const LIGHT_POSITION = new Vector3(50, 50, 50);
const CAMERA_FOLLOW_OFFSET = new Vector3(0, 16, 8);
const CAMERA_DAMPING = 0.2;

export class Main {
    private readonly canvas: HTMLCanvasElement;

    private readonly resizeObserver: ResizeObserver;

    private readonly renderer: WebGLRenderer;

    private readonly camera: PerspectiveCamera;

    private readonly scene: Scene;

    private readonly frameHandler: FrameHandler;

    private readonly hero: Hero;

    private readonly dirLight: DirectionalLight;

    private readonly ambLight: AmbientLight;

    private readonly cameraPos: Vector3 = new Vector3();

    private terrain: Terrain;

    private readonly medkit: Medkit;

    private readonly consumable: Consumable;

    private paused: boolean = false;

    private readonly timer: Timer;

    private readonly hpCallback: (hp: number) => void;

    private readonly preloader: Preloader;

    // private readonly resources: Resources;

    public constructor(
        canvas: HTMLCanvasElement,
        timeEl: HTMLDivElement,
        hpCallback: (hp: number) => void,
    ) {
        this.canvas = canvas;
        this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.shadowMap.type = PCFShadowMap;
        this.renderer.shadowMap.enabled = true;
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100);
        this.camera.position.copy(CAMERA_POSITION);
        this.scene = new Scene();

        this.dirLight = new DirectionalLight('rgba(10,133,147,0.58)', 2);
        this.dirLight.position.copy(LIGHT_POSITION);
        this.dirLight.castShadow = true;
        this.scene.fog = new FogExp2('#04343f', 0.04);

        this.ambLight = new AmbientLight('#596987', 10);
        // this.resources = new Resources(sources);
        this.preloader = new Preloader();
        this.preloader.setOnProgress((progress: number) => {
            const progressElement = document.getElementById('progressPercentage');
            if (progressElement) {
                progressElement.textContent = `${progress}`;
            }
        });

        this.hero = new Hero(this.scene, this.preloader.getLoadingManager());
        this.terrain = new Terrain(this.scene, this.hero);

        this.consumable = new Consumable(this.scene, this.hero);

        this.medkit = new Medkit(this.scene, this.hero);

        this.scene.add(this.camera, this.dirLight, this.ambLight);

        this.update = this.update.bind(this);
        this.resize = this.resize.bind(this);

        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(this.canvas);

        this.frameHandler = new FrameHandler(this.update);

        this.timer = new Timer(timeEl);
        this.initializeEnemies();

        this.resize();
        this.frameHandler.start();
        this.hpCallback = hpCallback;
    }

    private update(_delta: number) {
        this.timer.update();
        this.hero.update(_delta);
        this.terrain.update(_delta, this.hero);
        Enemies.update(_delta);
        this.consumable.checkPickUp(this.hero.getPosition());
        this.medkit.checkPickUp(this.hero.getPosition());
        if (this.hpCallback) {
            this.hpCallback(Hero.stats.hp);
        }

        this.updateCamera(_delta);
        this.render();
    }

    private updateCamera(delta: number) {
        const heroPos = this.hero.getPosition();
        this.cameraPos.copy(heroPos).add(CAMERA_FOLLOW_OFFSET);
        this.camera.position.set(
            damp(this.camera.position.x, this.cameraPos.x, CAMERA_DAMPING, delta),
            damp(this.camera.position.y, this.cameraPos.y, CAMERA_DAMPING, delta),
            damp(this.camera.position.z, this.cameraPos.z, CAMERA_DAMPING, delta),
        );
        this.camera.lookAt(heroPos);
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    private resize() {
        const { width, height } = this.canvas.getBoundingClientRect();
        const dpi = window.devicePixelRatio;
        const w = width * dpi;
        const h = height * dpi;
        this.canvas.width = w;
        this.canvas.height = h;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
    }

    private initializeEnemies() {
        Enemies.init(this.scene, this.hero, this.consumable, this.medkit);
        Enemies.setSpawnRate(1000);
    }

    public togglePause() {
        this.paused = !this.paused;

        if (this.paused) {
            Enemies.setSpawnRate(0);
            this.frameHandler.stop();
        } else {
            this.timer.updateTimeStart();
            Enemies.setSpawnRate(1000);
            this.frameHandler.start();
        }
    }

    public isPaused(): boolean {
        return this.paused;
    }

    public restartGame() {
        Enemies.dispose();
        if (this.consumable) {
            this.consumable.dispose();
        }

        this.terrain.dispose();
        this.timer.clear();

        this.render();

        this.initializeEnemies();
        Hero.stats.hp = Hero.stats.maxHp;
        // Hero.stats.exp = 0;

        this.terrain = new Terrain(this.scene, this.hero);
    }

    public dispose() {
        this.resizeObserver.disconnect();
        this.frameHandler.stop();
        this.terrain.dispose();
        this.hero.dispose();
    }
}
