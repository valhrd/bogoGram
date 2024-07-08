import { useState, useEffect } from 'react';

const useTimer = () => {
    const [timer, setTimer] = useState(0);
    const [timerOn, setTimerOn] = useState(false);
    const [timeTaken, setTimeTaken] = useState('00H00M00S');

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

    useEffect(() => {
        const convertTimer = () => {
            const hours = Math.floor(timer / 3600);
            const minutes = Math.floor((timer % 3600) / 60);
            const seconds = timer % 60;
            const time = [hours, minutes, seconds].map(unit => unit.toString().padStart(2, '0'));
            setTimeTaken(`${time[0]}H${time[1]}M${time[2]}S`);
        };

        convertTimer();
    }, [timer])

    const startTimer = () => setTimerOn(true);
    const stopTimer = () => {
        setTimerOn(false);
        return timer;  // Return the final timer value when stopped
    };
    const resetTimer = () => {
        setTimer(0);
        setTimeTaken('00H00M00S');
    }

    return {
        timer,
        timeTaken,
        startTimer,
        stopTimer,
        resetTimer,
    };
};

export default useTimer;
