// Preloader.ts
import { LoadingManager } from 'three';

export class Preloader {
    private readonly loadingManager: LoadingManager;

    private onProgressCallback?: (progress: number) => void;

    public constructor() {
        this.loadingManager = new LoadingManager();
        this.setupLoadingEvents();
    }

    private setupLoadingEvents() {
        // this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
        //     // console.log(`Начата загрузка: ${url}. Загружено ${itemsLoaded} из ${itemsTotal}.`);
        // };

        this.loadingManager.onProgress = (itemsLoaded: any, itemsTotal: any) => {
            const progress = Math.round((itemsLoaded / itemsTotal) * 100);
            if (this.onProgressCallback) {
                this.onProgressCallback(progress);
            }
        };

        this.loadingManager.onLoad = () => {
            // console.log('Загрузка завершена.');
            if (this.onProgressCallback) {
                this.onProgressCallback(100);
            }
        };

        this.loadingManager.onError = (url) => {
            console.error(`Ошибка загрузки: ${url}`);
        };
    }

    public setOnProgress(callback: (progress: number) => void) {
        this.onProgressCallback = callback;
    }

    public getLoadingManager() {
        return this.loadingManager;
    }
}
