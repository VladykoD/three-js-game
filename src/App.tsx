import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import css from './App.module.scss';
import { Main } from './graphics/Main';

function App() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timeElRef = useRef<HTMLDivElement | null>(null);
    const scene = useRef<Main>();
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
    const [heroHp, setHeroHp] = useState<number>(100); // State for Hero's HP

    const handleEscapeKeyPress = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && scene.current) {
            togglePause();
        }
    }, []);

    const handleSpaceKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (event.code === 'Space' && !isGameStarted) {
                event.preventDefault(); // Prevent default space bar behavior
                handleStartGame();
            }
        },
        [isGameStarted],
    );

    const togglePause = () => {
        if (scene.current) {
            scene.current.togglePause();
            setIsPaused((prev) => !prev);
        }
    };

    const handleRestartGame = () => {
        if (scene.current) {
            scene.current.restartGame();
            setHeroHp(100);
            togglePause();
        }
    };

    useEffect(() => {
        if (heroHp < 0) {
            togglePause();
        }
    }, [heroHp]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const timeEL = timeElRef.current;

        if (canvas && timeEL) {
            scene.current = new Main(canvas, timeEL, setHeroHp);

            window.addEventListener('keydown', handleEscapeKeyPress);
            window.addEventListener('keydown', handleSpaceKeyPress);

            return () => {
                scene.current?.dispose();
                window.removeEventListener('keydown', handleEscapeKeyPress);
                window.removeEventListener('keydown', handleSpaceKeyPress);
            };
        }
    }, [handleEscapeKeyPress, handleSpaceKeyPress]);

    const handleStartGame = () => {
        setIsGameStarted(true);
        scene.current?.restartGame();
    };

    return (
        <div className={css.wrapper}>
            <div className={css.info}>
                {heroHp < 0 && (
                    <button className={css.pause} onClick={handleRestartGame}>
                        рестарт
                    </button>
                )}
                <div className={css.info__hp}>{heroHp > 0 ? `Здоровье: ${heroHp}` : 'Ты умер'}</div>
                <div className={css.info__time} ref={timeElRef}>
                    00:00
                </div>
                {isGameStarted && (
                    <button disabled={heroHp < 0} className={css.pause} onClick={togglePause}>
                        {isPaused ? 'Продолжить' : 'Остановить'}
                    </button>
                )}
            </div>
            <canvas ref={canvasRef} />
            <div className={clsx(css.overlay, isGameStarted ? css.hideOverlay : '')} />
            {!isGameStarted && (
                <div className={clsx(css.loading, isGameStarted ? css.hideLoading : '')}>
                    <h1>
                        Loading Experience... <span id="progressPercentage" />%
                    </h1>
                    <button className={css.start} onClick={handleStartGame}>
                        START
                    </button>
                </div>
            )}
        </div>
    );
}

export default App;
