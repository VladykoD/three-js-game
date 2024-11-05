import { Vector2 } from 'three';
import { clamp, damp, euclideanModulo } from '../../../helpers/MathUtils.ts';
import { Hero } from '../Hero.ts';

enum Direction {
    Idle,
    Top,
    Down,
    Left,
    Right,
    TopRight,
    TopLeft,
    DownRight,
    DownLeft,
}

export class Controls {
    private readonly hero: Hero;

    private keys: string[] = [];

    private direction: Direction | null = null;

    private pressed: boolean = false;

    private heroAngle: number = 0;

    private angle: number = 0;

    private tilda: number = 0;

    public constructor(hero: Hero) {
        this.hero = hero;

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        window.addEventListener('keydown', this.handleKeyPress);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private deleteKey(key: string) {
        const idx = this.keys.indexOf(key);

        if (idx !== -1) {
            this.keys.splice(idx, 1);
        }
    }

    private addKey(key: string) {
        const idx = this.keys.indexOf(key);

        if (idx === -1 || this.keys.length === 0) {
            this.keys.push(key);
        }
    }

    public isMoving(): boolean {
        return this.pressed && this.keys.length > 0;
    }

    private checkKeyPressed(firstKey: string, secondKey?: string) {
        const isFirst = this.keys.indexOf(firstKey);
        if (!secondKey) {
            return isFirst !== -1;
        }

        const isSecond = this.keys.indexOf(secondKey);

        return isFirst !== -1 && isSecond !== -1;
    }

    private handleKeyUp(e: KeyboardEvent) {
        switch (e.code.toLowerCase()) {
            case 'keyw':
            case 'arrowup':
                this.deleteKey('top');
                break;
            case 'keyd':
            case 'arrowright':
                this.deleteKey('right');
                break;
            case 'keya':
            case 'arrowleft':
                this.deleteKey('left');
                break;
            case 'keys':
            case 'arrowdown':
                this.deleteKey('down');
                break;
            default:
                break;
        }

        if (this.keys.length === 0) {
            this.pressed = false;
            this.hero.stopWalkAnimation();
        } else {
            this.setDirection();
        }
    }

    private handleKeyPress(e: KeyboardEvent) {
        this.pressed = true;
        this.hero.playWalkAnimation();

        switch (e.code.toLowerCase()) {
            case 'keyw':
            case 'arrowup':
                this.addKey('top');
                break;
            case 'keyd':
            case 'arrowright':
                this.addKey('right');
                break;
            case 'keya':
            case 'arrowleft':
                this.addKey('left');
                break;
            case 'keys':
            case 'arrowdown':
                this.addKey('down');
                break;
            default:
                break;
        }

        this.setDirection();
        if (this.keys.length > 2) {
            this.keys.splice(0, 1);
        }
    }

    private setDirection() {
        if (this.keys.length === 1) {
            if (this.checkKeyPressed('top')) {
                this.direction = Direction.Top;
            } else if (this.checkKeyPressed('right')) {
                this.direction = Direction.Right;
            } else if (this.checkKeyPressed('left')) {
                this.direction = Direction.Left;
            } else if (this.checkKeyPressed('down')) {
                this.direction = Direction.Down;
            }
        }

        if (this.keys.length === 2) {
            if (this.checkKeyPressed('top', 'right')) {
                this.direction = Direction.TopRight;
            } else if (this.checkKeyPressed('top', 'left')) {
                this.direction = Direction.TopLeft;
            } else if (this.checkKeyPressed('down', 'left')) {
                this.direction = Direction.DownLeft;
            } else if (this.checkKeyPressed('down', 'right')) {
                this.direction = Direction.DownRight;
            }
        }
    }

    private updateRotation(delta: number) {
        this.heroAngle = damp(this.heroAngle, (Math.PI / 180) * this.angle, 0.1, delta);
        this.hero.setRotation(this.heroAngle);
    }

    private setAngle(angle: number) {
        let sub = euclideanModulo(angle - this.angle, 360);
        if (sub > 180) {
            sub -= 360;
        }
        this.angle += sub;
    }

    private updateMovement() {
        const speed = 0.065;

        switch (this.direction) {
            case Direction.Top:
                this.hero.moveZ(-this.tilda * speed);
                this.setAngle(0);
                break;
            case Direction.Down:
                this.hero.moveZ(this.tilda * speed);
                this.setAngle(180);
                break;
            case Direction.Right:
                this.hero.moveX(this.tilda * speed);
                this.setAngle(-90);
                break;
            case Direction.Left:
                this.hero.moveX(-this.tilda * speed);
                this.setAngle(90);
                break;
            case Direction.TopLeft:
                this.hero.moveZ(-this.tilda * speed);
                this.hero.moveX(-this.tilda * speed);
                this.setAngle(45);
                break;
            case Direction.TopRight:
                this.hero.moveZ(-this.tilda * speed);
                this.hero.moveX(this.tilda * speed);
                this.setAngle(-45);
                break;
            case Direction.DownRight:
                this.hero.moveZ(this.tilda * speed);
                this.hero.moveX(this.tilda * speed);
                this.setAngle(-135);
                break;
            case Direction.DownLeft:
                this.hero.moveZ(this.tilda * speed);
                this.hero.moveX(-this.tilda * speed);
                this.setAngle(-225);
                break;
            default:
                break;
        }
    }

    public update(delta: number) {
        const speed = 0.08;
        if (this.pressed && this.keys.length > 0) {
            this.tilda = clamp(this.tilda + delta * speed * 0.5, 0, 1);
        } else {
            this.tilda = clamp(this.tilda - delta * speed, 0, 1);
        }

        this.updateMovement();
        this.updateRotation(delta);
    }

    public getPosition() {
        return new Vector2(this.hero.getX(), this.hero.getZ());
    }

    public dispose() {
        this.keys = [];
        window.removeEventListener('keydown', this.handleKeyPress);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
