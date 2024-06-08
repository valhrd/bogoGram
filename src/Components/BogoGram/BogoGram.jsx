import React, { useState, useEffect } from 'react';
import { database } from './firebaseConfig'; // Adjust the path if necessary
import { getFunctions, httpsCallable} from 'firebase/functions'; //line 3 
import { initializeApp } from 'firebase/app'; 
import { getAuth, signInWithPopup, GoogleAuthProvider, connectAuthEmulator, verifyPasswordResetCode } from 'firebase/auth';
import { collection, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';


import { ref, onValue, set } from 'firebase/database';
import './BogoGram.css';

// Create dictionary
import dictionary from './populateTrie';

// Testing Cell class
import Cell from './Cell';


// Grid formation plus tilebag
const gridSize = 35;
const initialGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));


// Temporary testing
// const letters = 'AAABBBCCCDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ';
const letters = 'HAPPYBOOMVISTA';
let lettersArray;


console.log(lettersArray);
/* const auth= firebase.auth(); //new from here
const firestore = firebase.firestore(); //until here
*/



const firebaseConfig = {
  apiKey: "AIzaSyDYKPbLTod93i-NeBcMigeZQB_N_7BshPU",
  authDomain: "bogogram-64426.firebaseapp.com",
  projectId: "bogogram-64426",
  storageBucket: "bogogram-64426.appspot.com",
  messagingSenderId: "658335481901",
  appId: "1:658335481901:web:dea96b1c35493ad23178a4",
  measurementId: "G-3VQ842V6NJ"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);



function BogoGram() {
  const [grid, setGrid] = useState(initialGrid);
  const [currentWord, setCurrentWord] = useState('');
  
  // For word connectivity
  const [mustConnect, setMustConnect] = useState(false);
  const [wordConnect, setWordConnect] = useState(true);

  // Meant to keep track of previous values of startRow and startCol for direction toggling
  const [prevRow, setPrevRow] = useState(null);
  const [prevCol, setPrevCol] = useState(null);
  const [startRow, setStartRow] = useState(null);
  const [startCol, setStartCol] = useState(null);

  // for server side things
  const gameDataRef = collection(firestore, 'gameData'); //new on 3 Jun
  const [gameName, setGameName] = useState(null); // this is for debugging, 8 Jun
  const [gameNumber, setGameNumber] = useState(null);  // Changed to use useState
  const queryConstraints = query(gameDataRef, orderBy('createdAt'), limit(5)); // is this necessary? 
  const [gameStates] = useCollectionData(queryConstraints, { idField: 'gameID' }); // or this
  
  // this is to lock the distribute and peel buttons when necessary
  const [tilesDistributed, setTilesDistributed] = useState(false);
  const [tilesInBag, setTilesInBag] = useState(true);
  
  // const [direction, setDirection] = useState('horizontal'); // Unneeded as of now
  
  // For toggling direction of play
  const [horizontal, setHorizontal] = useState(1);

  const [playerLetters, setPlayerLetters] = useState([]);
  
  // Keeps track of all words played by this player;
  const wordsPlayed = [];
  
  const [user] = useAuthState(auth); 
  const signIn = async () => { 
    const provider = new GoogleAuthProvider(); 
    try {
        await signInWithPopup(auth, provider); 
    } catch (error) {
        console.error('SignIn Error:', error);
    }
  };



  const signOut = async () => {
    try {
        await auth.signOut(); // Sign out the user
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
  };



  useEffect(() => {
    const gridRef = ref(database, 'grid');
    onValue(gridRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGrid(data);
    });

    const lettersRef = ref(database, 'playerLetters');
    onValue(lettersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setPlayerLetters(data);
    });
  }, []);



  const handleCellClick = (row, col) => {
    setStartRow(row);
    setStartCol(col);
    setHorizontal(!horizontal); // Change: keeps track of number of clicks
  };



  const handleWordChange = (e) => {
    setCurrentWord(e.target.value.toUpperCase());
  };


  /*
  const handleDirectionChange = (e) => {
    setDirection(e.target.value);
  };
  */


  // TODO: Might have to redo this whole game logic (Accomodate parallel play, extension of words (e.g. ING is invalid but KEEPING is valid), remember to push them to wordsPlayed array)
  const placeWord = () => {
    if (!currentWord || startRow === null || startCol === null) {
      return;
    }

    const endRow = startRow + (!horizontal ? currentWord.length - 1 : 0);
    const endCol = startCol + (horizontal ? currentWord.length - 1 : 0);

    // Check for connectivity between words
    if (mustConnect) {
      let temp = "";

      // Check cell to the left and right (for horizontal) or above and below (for vertical)
      if (horizontal) {
        if (startCol > 0) temp += grid[startRow][startCol - 1]; // Left of the start position
        if (endCol < gridSize - 1) temp += grid[startRow][endCol + 1]; // Right of the end position
      } else {
        if (startRow > 0) temp += grid[startRow - 1][startCol]; // Above the start position
        if (endRow < gridSize - 1) temp += grid[endRow + 1][startCol]; // Below the end position
      }

      // Check cells adjacent to each letter in the current word
      for (let i = 0; i < currentWord.length; i++) {
        const row = startRow + (horizontal ? 0 : i);
        const col = startCol + (horizontal ? i : 0);

        if (horizontal) {
          if (row > 0) temp += grid[row - 1][col]; // Above the current cell
          if (row < gridSize - 1) temp += grid[row + 1][col]; // Below the current cell
        } else {
          if (col > 0) temp += grid[row][col - 1]; // Left of the current cell
          if (col < gridSize - 1) temp += grid[row][col + 1]; // Right of the current cell
        }
      }

      if (!temp) {
        alert("Words must connect!");
        return;
      }
    }


    // New way to help check words
    let i = 1;
    let extendedWord = "";
    if (horizontal) {
      while (startCol - i >= 0 && grid[startRow][startCol - i]) {
        extendedWord = grid[startRow][startCol - i] + extendedWord;
        i++;
      }
    } else {
      while (startRow - i >= 0 && grid[startRow - i][startCol]) {
        extendedWord = grid[startRow - i][startCol] + extendedWord;
        i++;
      }
    }

    const newGrid = grid.map(row => row.slice());
    const newPlayerLetters = [...playerLetters];

    // TODO: add icon to signify direction word is being played and complete dictionary check in case there are letters pass the word
    for (let i = 0; i < currentWord.length; i++) {
      const row = startRow + (!horizontal ? i : 0); // Changed to taking away need for option menu to select horizontal or vertical play
      const col = startCol + (horizontal ? i : 0); //

      if (row >= gridSize || col >= gridSize || newGrid[row][col] !== '') {
        alert('Word cannot be placed here');
        return;
      }

      if (!newPlayerLetters.includes(currentWord[i])) {
        alert('You do not have the required letters');
        return;
      }

      let indexOne = 1;
      let indexTwo = 1;
      let newWord = "";
      // Allow parallel play
      if (horizontal) {
        while (row - indexOne >= 0 && grid[row - indexOne][col]) {
          newWord = grid[row - indexOne][col] + newWord;
          indexOne++;
        }
        newWord += currentWord[i];
        while (row + indexTwo < grid.length && grid[row + indexTwo][col]) {
          newWord += grid[row + indexTwo][col];
          indexTwo++;
        }
      } else {
        while (col - indexOne >= 0 && grid[row][col - indexOne]) {
          newWord = grid[row][col - indexOne] + newWord;
          indexOne++;
        }
        newWord += currentWord[i];
        while (col + indexTwo < grid.length && grid[row][col + indexTwo]) {
          newWord += grid[row][col + indexTwo];
          indexTwo++;
        }
      }

      if (newWord.length > 1 && !dictionary.search(newWord)) {
        alert("Invalid word: " + newWord);
        return;
      }
      // For debugging purposes
      console.log(newWord);

      // This part's bugged probably (ask GPT)
      newPlayerLetters.splice(newPlayerLetters.indexOf(currentWord[i]), 1);
      newGrid[row][col] = currentWord[i];
    
      // Append to extendedWord
      extendedWord += currentWord[i];

      if (i === currentWord.length - 1) {
        if (!dictionary.search(extendedWord)) {
          alert("Invalid word: " + extendedWord);
          return;
        }
        // For debugging purposes
        console.log(extendedWord);
      }

    }

    /*
    set(ref(database, 'grid'), newGrid)
      .then(() => setGrid(newGrid))
      .catch(error => console.error('Error updating the database grid:', error));

    set(ref(database, 'playerLetters'), newPlayerLetters)
      .then(() => setPlayerLetters(newPlayerLetters))
      .catch(error => console.error('Error updating the database playerLetters:', error));
    */

    // Testing Promise.all for parallel efficiency
    Promise.all([
      set(ref(database, 'grid'), newGrid),
      set(ref(database, 'playerLetters'), newPlayerLetters)
    ])
    .then(() => {
      setGrid(newGrid);
      setPlayerLetters(newPlayerLetters);
    })
    .catch(error => console.error('Error updating the database:', error));

    setCurrentWord('');
    setStartRow(null);
    setStartCol(null);

    // After a word is played all subsequent words must connect to it
    setMustConnect(true);
  };



  // Dev start/restart game function
  const startGame = () => {
    // Randomised array to represent tilebag
    // lettersArray = letters.split('').sort((firstLetter, secondLetter) => 0.5 - Math.random());
    clearBoard();
    setPlayerLetters([]);
    const functions  = getFunctions(app);
    const createGame = httpsCallable(functions, 'createGame');
    createGame().then((result) => {
      console.log('New Game Created with ID: ', result.data.gameID);
      setGameNumber(result.data.gameID);
      setGameName("Game " + result.data.gameID); // for debugging purposes
    }).catch(error => {
      console.error('Error in creating new game', error);
    });
  }



  const clearBoard = () => {
    const clearedGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));

    set(ref(database, 'grid'), clearedGrid)
    .then(() => {
      setGrid(clearedGrid);
    })
    .catch(error => {
      console.error('Error clearing the board:', error);
    });

    setMustConnect(false);
  };

  // Distribute letters to players
  const distributeLetters = () => {
    const functions = getFunctions(app);
    const distributeTiles = httpsCallable(functions, 'distributeTiles');
    distributeTiles({ gameID: gameNumber }).then((result) => {
      setPlayerLetters(result.data.tiles);
      console.log('Tiles distributed for game:', gameNumber);
      setTilesDistributed(true);
    }).catch(error => {
      console.error('Error distributing tiles:', error);
    });
  };

  // Peel: provides a singular new letter to the player
  const peel = () => {
    const functions = getFunctions(app);
    const peel = httpsCallable(functions, 'peel');
    peel({gameID: gameNumber}).then((result) => {
      const peeledTile = result.data.tile;
      if (peeledTile === "*") {
        setTilesInBag(false);
        alert("No more tiles in the bag!");
      } else {
        setPlayerLetters(prevLetters => [...prevLetters, peeledTile]); // Append new tile to existing tiles
        console.log('Peel for game:', gameNumber, 'Tile:', peeledTile);
      }
    }).catch(error => {
      console.error('Error distributing tiles:', error);
    });
  }

  // Shuffle player rack
  const shuffleLetters = () => {
    const newLetters = playerLetters;
    newLetters.sort((firstLetter, secondLetter) => 0.5 - Math.random());
    set(ref(database, 'playerLetters'), newLetters)
      .then(() => {
        setPlayerLetters(newLetters);
      })
      .catch(error => {
        console.error('Error distributing letters:', error);
      });
  }

  const rebuildGrid = () => {
    grid.map((row, rowIndex) => (
      row.map((cell, colIndex) => {
        if (cell !== "") {
          playerLetters.push(cell);
        }
      }
    )));
    clearBoard();
  }

  // Testing drag and drop functions (from player tile rack to board)
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleRackDragStart = (event, letter, index) => {
    event.dataTransfer.setData("text/plain", letter);
    event.dataTransfer.setData("index", index);
  };

  const handleRackToBoardDrop = (row, col) => (event) => {
    handleDragOver(event);

    if (!event.dataTransfer.types.includes("text/plain") || !event.dataTransfer.types.includes("index")) {
      return; // Abort if the expected types are not present
    }

    const letter = event.dataTransfer.getData("text/plain");
    const index = event.dataTransfer.getData("index");

    const newGrid = grid.map(row => row.slice());
    const newPlayerLetters = [...playerLetters];
    
    if (newGrid[row][col]) {
      newPlayerLetters.push(newGrid[row][col]);
    }
    newGrid[row][col] = letter;
    setGrid(newGrid);

    newPlayerLetters.splice(index, 1);
    setPlayerLetters(newPlayerLetters);

    set(ref(database, 'grid'), newGrid);
    set(ref(database, 'playerLetters'), newPlayerLetters);

    // Testing Promise.all for parallel efficiency
    Promise.all([
      set(ref(database, 'grid'), newGrid),
      set(ref(database, 'playerLetters'), newPlayerLetters)
    ])
    .then(() => {
      setGrid(newGrid);
      setPlayerLetters(newPlayerLetters);
    })
    .catch(error => console.error('Error updating the database:', error));
  }

  // Testing drag and drop functions (from board to player tile rack) (this feature does not work as of now)
  const handleCellDragStart = (event, letter, row, col) => {
    event.dataTransfer.setData("text/plain", letter);
    event.dataTransfer.setData("row", row);
    event.dataTransfer.setData("col", col);
  };

  const handleBoardToRackDrop = (event) => {
    handleDragOver(event);

    const letter = event.dataTransfer.getData("text/plain");
    const rowIndex = event.dataTransfer.getData("row");
    const colIndex = event.dataTransfer.getData("col");

    console.log(rowIndex, colIndex);

    const newGrid = grid.map(row => row.slice());
    
    setGrid(newGrid);
  
    const newPlayerLetters = [...playerLetters];
    newPlayerLetters.push(letter);
    setPlayerLetters(newPlayerLetters);

    Promise.all([
      set(ref(database, 'grid'), newGrid),
      set(ref(database, 'playerLetters'), newPlayerLetters)
    ])
    .catch(error => console.error('Error updating the database:', error));
  };

  /*
  // Live typing on grid attempt
  const handleCellChange = (event, rowIndex, colIndex) => {
    const { value } = event.target;
    const newGrid = grid.map((row, rowIdx) =>
      row.map((cell, colIdx) =>
        rowIdx === rowIndex && colIdx === colIndex ? value : cell
      )
    );
    setGrid(newGrid);
    set(ref(database, 'grid'), newGrid)
      .catch(error => {
        console.error('Error updating the database grid:', error);
      });
  };

  const handleCellKeyDown = (event, rowIndex, colIndex) => {
    const { key } = event;
    const nextRowIndex = horizontal ? rowIndex : (key === 'ArrowDown' ? rowIndex + 1 : rowIndex);
    const nextColIndex = horizontal ? (key === 'ArrowRight' ? colIndex + 1 : colIndex) : colIndex;

    if (nextRowIndex >= 0 && nextRowIndex < gridSize && nextColIndex >= 0 && nextColIndex < gridSize) {
      const nextCellInput = document.getElementById(`cell-${nextRowIndex}-${nextColIndex}`);
      if (nextCellInput) {
        nextCellInput.focus();
      }
    }
  }
    */

  if (!user) {
    return (
      <div className="App">
        <h1 className="game-title">B O G O G R A M</h1>
        <button onClick={signIn}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1 className="game-title">B O G O G R A M</h1>
      {/* Conditional rendering to show the sign-out button only when the user is signed in */}
      {user && (
        <button onClick={signOut}>Sign Out</button>
      )}
      <div>
        <button onClick={startGame}>Start game</button>
        <button onClick={() => distributeLetters()} disabled={tilesDistributed}>Distribute</button>
        <p className="game-name-display">{gameName ? `Current Game: ${gameName}` : "No game started"}</p>
        <button onClick={shuffleLetters}>Shuffle</button>
        <button onClick={rebuildGrid}>Rebuild</button>
        <button onClick={peel} disabled={!(tilesDistributed && !playerLetters.length) || !tilesInBag}>PEEL</button>
      </div>
      <div>
        <h2 className="player-letters">Player Letters:</h2>
        <div
          className="player-letters"

          // Drag and drop from board to player rack
          onDrop={handleBoardToRackDrop}
          onDragOver={handleDragOver}
        >
          {/* Testing drag and drop feature */}
          {playerLetters.map((letter, index) => (
            <span
              key={index}
              className="player-letter"

              // Additional code for drag and drop feature
              draggable
              onDragStart={(event) => handleRackDragStart(event, letter, index)}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
      <div>
        <input
          type="text"
          value={currentWord}
          onChange={handleWordChange}
          placeholder="Enter word"
        />
        {/*<select value={direction} onChange={handleDirectionChange}>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>*/}
        <button onClick={placeWord}>Place Word</button>
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell ${startRow === rowIndex && startCol === colIndex ? 'selected' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}

                // Testing drag and drop functionality
                onDragOver={handleDragOver}
                onDrop={handleRackToBoardDrop(rowIndex, colIndex)}
              >
                <span
                  // Drag from board to rack
                  draggable={cell !== ''}
                  onDragStart={(event) => handleCellDragStart(event, cell, rowIndex, colIndex)}
                />
                {cell}
                {/* <input // Testing live-editing feature (typing word on board)
                  id={`cell-${rowIndex}-${colIndex}`}
                  type="cell"
                  value={cell}
                  onChange = {(event) => handleCellChange(event, rowIndex, colIndex)}
                  onKeyDown = {(event) => handleCellKeyDown(event, rowIndex, colIndex)}
                /> */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BogoGram;
