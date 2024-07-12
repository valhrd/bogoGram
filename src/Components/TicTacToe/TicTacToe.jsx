import React, { useState, useRef } from 'react';
import './TicTacToe.css';
import GameButton from '../BogoGram/GameButton';
import Tile from '../BogoGram/Tile';

const TicTacToe = () => {
    const [count, setCount] = useState(0);
    const [endGame, setEndGame] = useState(true);
    const [letterChosen, setLetterChosen] = useState("");
    const [selected, setSelected] = useState(false);
    const [board, setBoard] = useState([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ]);
    const titleRef = useRef(null);
    

    const toggle = (row, col) => {
        if (endGame || board[row][col]) {
            return;
        }
        const newBoard = board.map((r, i) =>
            r.map((cell, j) => {
                if (i === row && j === col) {
                    return count % 2 === 0 ? "x" : "o";
                }
                return cell;
            })
        );
        setBoard(newBoard);
        setCount(count + 1);
        checkWin(newBoard);
    };

    const checkWin = (board) => {
        for (let i = 0; i < 3; i++) {
            // Check rows
            if (board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
                won(board[i][0]);
                return;
            }
            // Check columns
            if (board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
                won(board[0][i]);
                return;
            }
        }
        // Check diagonals
        if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            won(board[0][0]);
            return;
        }
        if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            won(board[0][2]);
            return;
        }
        // Check for draw
        if (board.flat().every(cell => cell)) {
            titleRef.current.innerHTML = `Draw!`;
        }
    };

    const won = (winner) => {
        setEndGame(true);
        if (winner === "x") {
            titleRef.current.innerHTML = `Congratulations: &times; Wins`;
        } else {
            titleRef.current.innerHTML = `Congratulations: O Wins`;
        }
    };

    const handleStartGame = () => {
        setEndGame(false);
    };

    const handleReset = () => {
        setEndGame(true);
        setBoard([
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]);
        titleRef.current.innerHTML = 'Select your letter';
        setCount(0);
    };

    return (
        <div className='container'>
            <h1 className='title' ref={titleRef}>Select your letter</h1>
            <div className='board'>
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className={`row${rowIndex + 1}`}>
                        {row.map((box, colIndex) => {
                            if (rowIndex === 1 && colIndex !== 1) {
                                if (!letterChosen) {
                                    return (
                                        <div
                                            key={colIndex}
                                            className="boxes"
                                            onClick={() => toggle(rowIndex, colIndex)}
                                        >
                                            <Tile
                                                letter={colIndex === 0 ? "X" : "O"}
                                                className={`tictactoe-tile ${selected ? "selected" : ""}`}
                                                onClick={() => setSelected(!selected)}
                                            />
                                        </div>
                                    )
                                }
                            }
                            return (
                                <div
                                    key={colIndex}
                                    className="boxes"
                                    onClick={() => toggle(rowIndex, colIndex)}
                                >
                                    {box && <Tile letter={box === "x" ? "X" : "O"} className="tictactoe-tile" />}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
            <div>
                <GameButton
                    name="Start"
                    className="start"
                    onClick={handleStartGame}
                    disabled={!endGame && letterChosen}
                />
                <GameButton
                    name="Reset"
                    className="reset"
                    onClick={handleReset}
                    disabled={endGame}
                />
            </div>
        </div>
    );
};

export default TicTacToe;
