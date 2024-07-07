import { useState, useEffect } from 'react';

const useTimer = () => {
    const [timer, setTimer] = useState(0);
    const [timerOn, setTimerOn] = useState(false);

    useEffect(() => {
        let interval = null;
        if (timerOn) {
            interval = setInterval(() => {
                setTimer(prevTime => prevTime + 1); 
            }, 1000);
        } else {
            clearInterval(interval);
        }

        return () => clearInterval(interval);
    }, [timerOn]);

    const startTimer = () => setTimerOn(true);
    const stopTimer = () => {
        setTimerOn(false);
        return timer;  // Return the final timer value when stopped
    };
    const resetTimer = () => setTimer(0);

    return {
        timer,
        startTimer,
        stopTimer,
        resetTimer,
    };
};

export default useTimer;
