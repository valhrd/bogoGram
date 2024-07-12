import React, { useState } from 'react';
import './TicTacToe.css';
import GameButton from '../BogoGram/GameButton';
import Tile from '../BogoGram/Tile';

const TicTacToe = () => {
    const [count, setCount] = useState(0);
    const [endGame, setEndGame] = useState(true);
    const [letterChosen, setLetterChosen] = useState(null);
    const [oppLetter, setOppLetter] = useState(null);
    const [selected, setSelected] = useState(null);
    const [board, setBoard] = useState([
        ["", "", ""],
        ["", "", ""],
        ["", "", ""]
    ]);
    const [title, setTitle] = useState("Select your letter");

    const toggle = (row, col) => {
        if (endGame || board[row][col]) {
            return;
        }
        const newBoard = board.map((r, i) =>
            r.map((cell, j) => {
                if (i === row && j === col) {
                    return count % 2 === 0 ? letterChosen : oppLetter;
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
            setTitle("Draw!");
        }
    };

    const won = (winner) => {
        setEndGame(true);
        setTitle(`Congratulations: ${winner} Wins`);
    };

    const handleStartGame = (letter) => {
        if (!letter) {
            setTitle(`Please select a letter!`);
            return;
        }
        setTitle(`Playing as ${letter}`);
        setLetterChosen(letter);
        
        const newOppLetter = (letter === "X") ? "O" : "X"
        setOppLetter(newOppLetter);

        setEndGame(false);
        setBoard([
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]);
        setCount(0);
    };

    const handleReset = () => {
        setEndGame(true);
        setLetterChosen(null);
        setOppLetter(null);
        setSelected(null);
        setBoard([
            ["", "", ""],
            ["X", "Confirm", "O"],
            ["", "", ""]
        ]);
        setTitle("Select your letter");
        setCount(0);
    };

    const handleTileSelect = (letter) => {
        setSelected(letter === selected ? null : letter);
        setTitle(`Play as ${letter}?`);
    };

    return (
        <div className='container'>
            <h1 className='title'>{title}</h1>
            <div className='board'>
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className={`row${rowIndex + 1}`}>
                        {row.map((box, colIndex) => {
                            if (!letterChosen && rowIndex === 1) {
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
                                    onClick={() => toggle(rowIndex, colIndex)}
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
            </div>
        </div>
    );
};

export default TicTacToe;
