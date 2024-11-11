// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { RGBELoader } from 'three/examples/jsm/Addons.js';
//
// export default class Resources extends EventEmitter {
//     private readonly experience: Experience;
//
//     private readonly scene: THREE.Scene;
//
//     private readonly sources
//
//     private items: { [key: string]: any };
//
//     private readonly toLoad: number;
//
//     private loaded: number;
//
//     private loaders: {
//         gltfLoader: GLTFLoader;
//         textureLoader: THREE.TextureLoader;
//         cubeTextureLoader: THREE.CubeTextureLoader;
//         rgbeLoader: RGBELoader;
//     };
//
//     private loadingManagement: THREE.LoadingManager;
//
//     constructor(sources) {
//         super();
//
//         this.experience = new Experience();
//         this.scene = this.experience.scene;
//
//         this.sources = sources;
//
//         this.items = {};
//         this.toLoad = this.sources.length;
//         this.loaded = 0;
//
//         this.setLoaders();
//         this.startLoading();
//     }
//
//     private setLoaders() {
//         const loadingScreenElement = document.querySelector('.loadingScreen') as HTMLElement;
//         const loadingButtonElement = document.querySelector('.loadingButton') as HTMLElement;
//         const loadingBarElement = document.querySelector('.loadingBar') as HTMLElement;
//
//         this.loadingManagement = new THREE.LoadingManager(
//             // Loaded
//             () => {
//                 window.setTimeout(() => {
//                     loadingButtonElement.classList.add('ended');
//                     window.setTimeout(() => {
//                         loadingScreenElement.classList.add('ended');
//                     }, 1000);
//                     loadingBarElement.classList.add('ended');
//                     loadingBarElement.style.transform = '';
//                 }, 1000);
//             },
//
//             // Progress
//             (itemUrl, itemsLoaded, itemsTotal) => {
//                 const progressRatio = itemsLoaded / itemsTotal;
//                 loadingBarElement.style.transform = `scaleX(${progressRatio})`;
//             },
//         );
//
//         this.loaders = {
//             gltfLoader: new GLTFLoader(this.loadingManagement),
//             textureLoader: new THREE.TextureLoader(this.loadingManagement),
//             cubeTextureLoader: new THREE.CubeTextureLoader(this.loadingManagement),
//             rgbeLoader: new RGBELoader(this.loadingManagement),
//         };
//     }
//
//     private startLoading() {
//         // Load each source
//         for (const source of this.sources) {
//             if (source.type === 'gltfModel') {
//                 this.loaders.gltfLoader.load(source.path, (file) => {
//                     this.sourceLoaded(source, file);
//                 });
//             } else if (source.type === 'texture') {
//                 this.loaders.textureLoader.load(source.path, (file) => {
//                     this.sourceLoaded(source, file);
//                 });
//             } else if (source.type === 'cubeTexture') {
//                 this.loaders.cubeTextureLoader.load(source.path, (file) => {
//                     this.sourceLoaded(source, file);
//                 });
//             } else if (source.type === 'rgbe') {
//                 this.loaders.rgbeLoader.load(source.path, (file) => {
//                     this.sourceLoaded(source, file);
//                 });
//             }
//         }
//     }
//
//     private sourceLoaded(source: Source, file: any) {
//         this.items[source.name] = file;
//
//         this.loaded++;
//
//         if (this.loaded === this.toLoad) {
//             this.trigger('ready');
//         }
//     }
// }
