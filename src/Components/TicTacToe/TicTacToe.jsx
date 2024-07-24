import React, { useState, useEffect } from 'react';
import './TicTacToe.css';
import GameButton from '../BogoGram/GameButton';
import Tile from '../BogoGram/Tile';

const TicTacToe = ({ signOut }) => {
    const [startGame, setStartGame] = useState(false);
    const [endGame, setEndGame] = useState(false);
    const [playerChosen, setPlayerChosen] = useState(0);
    const [currPlayer, setCurrPlayer] = useState(0);
    const [selected, setSelected] = useState(null);

    const [board, setBoard] = useState([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ]);
    const [title, setTitle] = useState("Select your letter");

    const [bitBoard, setBitBoard] = useState(0);
    const [available, setAvailable] = useState(0)

    const winMasks = [
        0b00000000000000000000000000101010,
        0b00000000000000000000101010000000,
        0b00000000000000101010000000000000,
        0b00000000000000000010000010000010,
        0b00000000000000001000001000001000,
        0b00000000000000100000100000100000,
        0b00000000000000100000001000000010,
        0b00000000000000000010001000100000,
    ]

    const evaluateBoard = (grid) => {
        let fillMask = 0b00000000000000101010101010101010;
        let squaresFilled = (fillMask & grid) === fillMask;

        for (let mask of winMasks) {
            let newMask = (mask | (mask >> 1));
            let res = (grid & newMask);
            if (res === newMask) {
                return [true, -1];
            } else if (res === mask) {
                return [true, 1];
            }
        }

        return [squaresFilled, 0];
    }

    const makeMove = (bitBoard, available, row, col, player) => {
        if (!startGame || board[row][col]) {
            return;
        }
        const mask = player === -1 ? 3 : 2;
        const newBitBoard = (bitBoard ^ (mask << 2 * (3 * row + col)));
        const newAvailable = (available ^ (mask << 2 * (3 * row + col)));
        setBitBoard(newBitBoard);
        setAvailable(newAvailable);
        convertBitBoard(newBitBoard);
        setCurrPlayer(-currPlayer);

        const [newEndGame, evaluation] = evaluateBoard(newBitBoard);
        setEndGame(newEndGame);



        if (newEndGame) {
            if (evaluation === 0) {
                setTitle("Draw!");
            } else {
                won((evaluation === -1) ? "X" : "O");
            }
        }
    }

    const convertBitBoard = (bitBoard) => {
        let newBoard = [[], [], []]
        for (let i = 0; i < 9; i++) {
            newBoard[Math.floor(i / 3)].push((bitBoard & 3) === 3 ? 'X' : ((bitBoard & 3) === 2 ? 'O' : ''));
            bitBoard >>= 2;
        }
        setBoard(newBoard);
    }

    const handleStartGame = (letter) => {
        if (!letter) {
            setTitle(`Please select a letter!`);
            return;
        }
        setTitle(`Playing as ${letter}`);
        setPlayerChosen(letter === 'X' ? -1 : 1);
        setCurrPlayer(letter === 'X' ? -1 : 1);

        setStartGame(true);
        setBoard([
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]);
    };

    const handleReset = () => {
        setStartGame(false);
        setEndGame(false);
        setPlayerChosen(0);
        setCurrPlayer(0);
        setAvailable(0);
        setBitBoard(0);
        setSelected(null);
        setBoard([
            ["", "", ""],
            ["X", "Confirm", "O"],
            ["", "", ""]
        ]);
        setTitle("Select your letter");
    };

    const handleTileSelect = (letter) => {
        setSelected(letter);
        setTitle(`Play as ${letter}?`);
    };

    const ticTacToeBot = (grid, available, advPlayer) => {

        let moves = [];
        const miniMax = (grid, available, alpha, beta, maximise, depth, currDepth) => {
            let [endGame, currEval] = evaluateBoard(grid);

            if (endGame) {
                return currEval;
            }
            
            let mask = (maximise === -1) ? 3 : 2;
            let resEval = (maximise === -1) ? 1 : -1;

            for (let i = 0; i < 9; i++) {
                if ((available & (3 << (2 * i))) === 0) {
                    available ^= (3 << (2 * i));
                    grid ^= (mask << (2 * i));
                    let tempEval = miniMax(grid, available, alpha, beta, -maximise, depth, currDepth - 1);
                    available ^= (3 << (2 * i));
                    grid ^= (mask << (2 * i));

                    if (maximise === -1) {
                        resEval = Math.min(resEval, tempEval);
                        beta = Math.min(beta, tempEval);
                    } else {
                        resEval = Math.max(resEval, tempEval);
                        alpha = Math.max(alpha, tempEval);
                    }
                    if (depth === currDepth) {
                        moves.push([tempEval, Math.floor(i / 3), i % 3])
                    }
                    if (alpha >= beta) {
                        break;
                    }
                }
            }

            return resEval
        }
        
        miniMax(grid, available, -10, 10, advPlayer, freeSpace(available), freeSpace(available));
        moves.sort((x, y) => (advPlayer === -1) ? x[0] - y[0] : y[0] - x[0]);
        if (moves.length > 0) {
            makeMove(grid, available, moves[0][1], moves[0][2], advPlayer);
        }
    }

    const freeSpace = (available) => {
        available &= 0b00000000000000101010101010101010;
        let res = 0;
        for (let i = 0; i < 9; i++) {
            if ((available & (3 << (2 * i))) === 0) {
                res++;
            }
        }
        return res;
    }

    const won = (winner) => {
        setEndGame(true);
        setTitle(`Congratulations: ${winner} Wins`);
    };

    useEffect(() => {
        if (currPlayer !== 0 && currPlayer !== playerChosen) {
            ticTacToeBot(bitBoard, available, -playerChosen);
        }
    }, [currPlayer, bitBoard, available, playerChosen])

    return (
        <div className='container'>
            <h1 className='title'>{title}</h1>
            <div className='board'>
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className={`row${rowIndex + 1}`}>
                        {row.map((box, colIndex) => {
                            if (!playerChosen && rowIndex === 1) {
                                let letter;
                                if (colIndex === 0) {
                                    letter = 'X';
                                } else if (colIndex === 2) {
                                    letter = 'O';
                                }
                                if (colIndex !== 1) {
                                    return (
                                        <div
                                            key={colIndex}
                                            className="boxes"
                                            onClick={() => handleTileSelect(letter)}
                                        >
                                            <Tile
                                                letter={letter}
                                                className={`tictactoe-tile ${letter === selected ? "selected" : ""}`}
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div
                                            key={colIndex}
                                            className="boxes"
                                            onClick={() => handleStartGame(selected)}
                                        >
                                            <Tile
                                                letter={`Confirm`}
                                                className={`confirmation tictactoe-tile`}
                                            />
                                        </div>
                                    );
                                }
                            }
                            return (
                                <div
                                    key={colIndex}
                                    className="boxes"
                                    onClick={() => makeMove(bitBoard, available, rowIndex, colIndex, playerChosen)}
                                >
                                    {box && <Tile letter={box} className="tictactoe-tile" />}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div>
                <GameButton
                    name="Reset"
                    className="reset"
                    onClick={handleReset}
                />
                <GameButton
                    name="Return to menu"
                    className="tictactoe-exit"
                    onClick={signOut}
                />
            </div>
        </div>
    );
};

export default TicTacToe;
