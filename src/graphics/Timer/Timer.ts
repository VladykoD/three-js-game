export class Timer {
    private gameTime: number = performance.now();

    private timeStart: Date = new Date();

    private readonly timeEl: HTMLDivElement;

    private readonly LEVELS_TIME: number[] = [0, 60, 180, 300];

    private level: number = 0;

    public constructor(el: HTMLDivElement) {
        this.timeEl = el;
    }

    public updateTimeStart() {
        this.timeStart = new Date();
    }

    public getLevel() {
        return this.level;
    }

    public update() {
        const now = new Date();
        const timeDif = this.timeStart.valueOf() - now.valueOf();
        this.timeStart = now;
        this.gameTime -= timeDif;

        const date = new Date(this.gameTime);
        const mins = date.getMinutes().toString().padStart(2, '0');
        const secs = date.getSeconds().toString().padStart(2, '0');
        const time = `${mins}:${secs}`;
        this.timeEl.innerText = time;

        for (let i = 0; i < this.LEVELS_TIME.length; i++) {
            const levelTime = this.LEVELS_TIME[i];

            if (this.gameTime / 1000 > levelTime) {
                this.level = i;
            } else {
                break;
            }
        }
    }

    public clear() {
        this.gameTime = 0;
        this.level = 0;
        this.timeEl.innerText = '00:00';
    }
}
