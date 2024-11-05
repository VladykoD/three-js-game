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
import { Preloader } from './UI/Preloader.ts';
import { Levels } from './Levels/Levels.ts';

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

    private readonly dirLight: DirectionalLight;

    private readonly ambLight: AmbientLight;

    private readonly levels: Levels;

    private readonly preloader: Preloader;

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

        this.preloader = new Preloader();
        this.preloader.setOnProgress((progress: number) => {
            const progressElement = document.getElementById('progressPercentage');
            if (progressElement) {
                progressElement.textContent = `${progress}`;
            }
        });

        this.scene.add(this.camera, this.dirLight, this.ambLight);

        this.update = this.update.bind(this);
        this.resize = this.resize.bind(this);

        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(this.canvas);

        this.frameHandler = new FrameHandler(this.update);

        const updateCamera = (position: Vector3, delta: number) => {
            const cameraPos = new Vector3().copy(position).add(CAMERA_FOLLOW_OFFSET);

            this.camera.position.set(
                damp(this.camera.position.x, cameraPos.x, CAMERA_DAMPING, delta),
                damp(this.camera.position.y, cameraPos.y, CAMERA_DAMPING, delta),
                damp(this.camera.position.z, cameraPos.z, CAMERA_DAMPING, delta),
            );
            this.camera.lookAt(position);
        };

        this.levels = new Levels(this.scene, timeEl, hpCallback, updateCamera);

        this.resize();
        this.frameHandler.start();
    }

    private update(delta: number) {
        this.levels.update(delta);
        this.render();
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

    public togglePause(): void {
        this.levels.togglePause();
    }

    public isPaused(): boolean {
        return this.levels.isPaused();
    }

    public restartGame(): void {
        this.levels.restartGame();
    }

    public dispose() {
        this.resizeObserver.disconnect();
        this.frameHandler.stop();
        this.levels.dispose();
    }
}
