import { AnimationAction, AxesHelper, Mesh, Object3D, Vector2 } from 'three';
import { clamp, damp, euclideanModulo } from '../../helpers/MathUtils';
import { Hero } from '../Hero/Hero';

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
    private readonly walkAction: AnimationAction | null = null;

    /**
     * Меш главного персонажа
     * @private
     */
    private readonly hero: Object3D;

    /**
     * Группа персонаж + оружие
     * @private
     */
    private readonly group: Mesh;

    /**
     * Нажатые в данный момент клавиши
     * @private
     */
    private keys: string[] = [];

    /**
     * Направление движения персонажа
     * @private
     */
    private direction: Direction | null = null;

    /**
     * Нажата ли какая-либо клавиша
     * @private
     */
    private pressed: boolean = false;

    /**
     * Текущий поворот персонажа
     * @private
     */
    private rotation: number = 0;

    /**
     * Значение к которому стремится поворот
     * @private
     */
    private angle: number = 0;

    /**
     * Ускорение персонажа
     * @private
     */
    private tilda: number = 0;

    private readonly DEBUG_DIRECTION: boolean = true;

    public constructor(hero: Object3D, group: Mesh, walkAction: AnimationAction | null) {
        this.hero = hero;
        this.group = group;
        this.walkAction = walkAction;

        if (this.DEBUG_DIRECTION) {
            const axesHelper = new AxesHelper();
            this.hero.add(axesHelper);
        }

        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        window.addEventListener('keydown', this.handleKeyPress);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Удаление нажатой клавиши
     * @param key
     * @private
     */
    private deleteKey(key: string) {
        const idx = this.keys.indexOf(key);

        if (idx !== -1) {
            this.keys.splice(idx, 1);
        }
    }

    /**
     * Добавлнение клавиши
     * @param key
     * @private
     */
    private addKey(key: string) {
        const idx = this.keys.indexOf(key);

        if (idx === -1 || this.keys.length === 0) {
            this.keys.push(key);
        }
    }

    public isMoving(): boolean {
        return this.pressed && this.keys.length > 0;
    }

    /**
     * Проверка клавиши на нажатие
     * @param firstKey
     * @param secondKey
     * @private
     */
    private checkKeyPressed(firstKey: string, secondKey?: string) {
        const isFirst = this.keys.indexOf(firstKey);
        if (!secondKey) {
            return isFirst !== -1;
        }

        const isSecond = this.keys.indexOf(secondKey);

        return isFirst !== -1 && isSecond !== -1;
    }

    /**
     * Обработчик отпускания клавиши
     * @param e
     * @private
     */
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
            if (this.walkAction) {
                this.walkAction.stop();
            } // Останавливаем анимацию, если персонаж стоит
        } else {
            this.setDirection();
        }
    }

    /**
     * Обработчик нажатия клавиши
     * @param e
     * @private
     */
    private handleKeyPress(e: KeyboardEvent) {
        this.pressed = true;
        if (this.walkAction && !this.walkAction.isRunning()) {
            this.walkAction.play(); // Включаем анимацию при движении
        }
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

    /**
     * Установка направления движения
     * @private
     */
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

    /**
     * Обновление поворота персонажа
     * @param delta
     * @private
     */
    private updateRotation(delta: number) {
        this.rotation = damp(this.rotation, (Math.PI / 180) * this.angle, 0.1, delta);
        this.hero.rotation.y = this.rotation;
    }

    /**
     * Установка угла к которому нужно повернуться
     * @param angle
     * @private
     */
    private setAngle(angle: number) {
        let sub = euclideanModulo(angle - this.angle, 360);
        if (sub > 180) {
            sub -= 360;
        }
        this.angle += sub;
    }

    /**
     * Обработчик передвижения
     * @private
     */
    private updateMovement() {
        const speed = 0.1;

        switch (this.direction) {
            case Direction.Top:
                this.group.position.z -= this.tilda * speed;
                this.setAngle(0);
                break;
            case Direction.Down:
                this.group.position.z += this.tilda * speed;
                this.setAngle(180);
                break;
            case Direction.Right:
                this.group.position.x += this.tilda * speed;
                this.setAngle(-90);
                break;
            case Direction.Left:
                this.group.position.x -= this.tilda * speed;
                this.setAngle(90);
                break;
            case Direction.TopLeft:
                this.group.position.z -= this.tilda * speed;
                this.group.position.x -= this.tilda * speed;
                this.setAngle(45);
                break;
            case Direction.TopRight:
                this.group.position.z -= this.tilda * speed;
                this.group.position.x += this.tilda * speed;
                this.setAngle(-45);
                break;
            case Direction.DownRight:
                this.group.position.z += this.tilda * speed;
                this.group.position.x += this.tilda * speed;
                this.setAngle(-135);
                break;
            case Direction.DownLeft:
                this.group.position.z += this.tilda * speed;
                this.group.position.x -= this.tilda * speed;
                this.setAngle(-225);
                break;
            default:
                break;
        }
        Hero.pos.copy(this.group.position);
    }

    /**
     * Отрисовка изменений
     * @param delta
     */
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

    /**
     * Получение координат персонажа
     */
    public getPosition() {
        return new Vector2(this.group.position.x, this.group.position.z);
    }

    /**
     * Сброс ресурсов
     */
    public dispose() {
        this.keys = [];
        window.removeEventListener('keydown', this.handleKeyPress);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}
