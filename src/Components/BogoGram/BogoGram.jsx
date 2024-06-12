import React, { useState, useEffect } from 'react';
import { database } from './firebaseConfig'; // Adjust the path if necessary
import { getFunctions, httpsCallable} from 'firebase/functions'; //line 3 
import { initializeApp } from 'firebase/app'; 
import { getAuth, signInWithPopup, GoogleAuthProvider, connectAuthEmulator, verifyPasswordResetCode } from 'firebase/auth';
import { collection, getFirestore, query, orderBy, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import Trie from './Trie'; //new 11 Jun
// import dictionaryData from './dictionary.json';

import { ref, onValue, set } from 'firebase/database';
import './BogoGram.css';

// Tiles
import Tile from './Tile';
import TilesPlayed from './TilesPlayed';


// Grid formation plus tilebag
const gridSize = 35;
const initialGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));


// Temporary testing
// const letters = 'AAABBBCCCDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ';
const letters = 'HAPPYBOOMVISTA';
let lettersArray;

// Tiles played changes
const tPlayed = new TilesPlayed();


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
  const [startRow, setStartRow] = useState(null);
  const [startCol, setStartCol] = useState(null);

  // for server side things
  const gameDataRef = collection(firestore, 'gameData'); //new on 3 Jun
  const [gameName, setGameName] = useState(null); // this is for debugging, 8 Jun
  const [gameNumber, setGameNumber] = useState(null);  // Changed to use useState
  const queryConstraints = query(gameDataRef, orderBy('createdAt'), limit(5)); // is this necessary? 
  const [gameStates] = useCollectionData(queryConstraints, { idField: 'gameID' }); // or this
  
  // For other players to join the game
  const [inputGameId, setInputGameId] = useState('');


  // this is to lock the distribute and peel buttons when necessary
  const [tilesDistributed, setTilesDistributed] = useState(false);
  const [tilesInBag, setTilesInBag] = useState(true);

  // this is for selection of 1 letter to dump
  const [currDump, setCurrDump] = useState('');
  
  //for dictionary checking (11 Jun)
  const [dictionary, setDictionary] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');  //this is to change a state after checking if all the words are valid
  
  // For toggling direction of play
  const [horizontal, setHorizontal] = useState(1);

  const [playerLetters, setPlayerLetters] = useState([]);

  
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
    if (!dictionary) { //new on 11 jun
      fetch('/dictionary.json')  // Assuming your app is served from the root
        .then(response => response.json())
        .then(data => {
          const loadedDictionary = Trie.deserialize(JSON.stringify(data));
          setDictionary(loadedDictionary);
        })
        .catch(error => console.error('Failed to load dictionary:', error));
    }

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
  }, [dictionary]); //new 11 Jun



  const handleCellClick = (row, col) => {
    setStartRow(row);
    setStartCol(col);
    setHorizontal(!horizontal); // Change: keeps track of number of clicks
  };



  const handleWordChange = (e) => {
    setCurrentWord(e.target.value.toUpperCase());
  };



  const handleLetterChange = (e) => {
    setCurrDump(e.target.value.toUpperCase());
  }




  // ------Potentially useless------

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

  // ------Potentially useless------




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

  // Join game function for other players
  const handleJoinGame = () => {
    if (!inputGameId.trim()) {
      alert("Please enter a valid game ID to join a game.");
      return;
    }
    // Assuming you have initialized Firebase and have access to `getFunctions`
    const functions = getFunctions(); // getFunctions needs to be initialized appropriately
    const joinGame = httpsCallable(functions, 'joinGame');
    joinGame({ gameID: inputGameId.trim() }).then(result => {
      console.log(result.data.message);
      let res = inputGameId.trim()
      setGameNumber(res); // Set the current game ID to the one joined
      setGameName("Game " + res); // for debugging purposes
      alert("Successfully joined the game!");
      setInputGameId(''); // Clear the input field
    }).catch(error => {
      console.error('Error joining game:', error);
      alert("Failed to join game: " + error.message);
    });
  };


  const clearBoard = () => {
    const clearedGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));

    set(ref(database, 'grid'), clearedGrid)
    .then(() => {
      setGrid(clearedGrid);
    })
    .catch(error => {
      console.error('Error clearing the board:', error);
    });

    // Tiles played changes
    tPlayed.clear();

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



  // Dump: allows a player to return 1 letter to the bag and get back 3 randomly drawn ones
  const dump = () => {
    if (currDump.length !== 1) {
        alert("Please enter exactly one letter to dump.");
        return;
    }
    const functions = getFunctions(app);
    const dumpTile = httpsCallable(functions, 'dumpTile');
    dumpTile({ gameID: gameNumber, tile: currDump }).then((result) => {
        const newTiles = result.data.tiles;
        if (newTiles.includes("*")) {
            setTilesInBag(false);
            alert("No more tiles in the bag!");
        } else {
            setPlayerLetters(prevLetters => {
                // Filter out the dumped tile from the current letters only once
                const indexToRemove = prevLetters.indexOf(currDump);
                return [
                    ...prevLetters.slice(0, indexToRemove),
                    ...prevLetters.slice(indexToRemove + 1),
                    ...newTiles
                ];
            });
            console.log('Dump and new tiles for game:', gameNumber, 'Tiles:', newTiles);
        }
        setCurrDump(''); // Clear the input field after dumping
    }).catch(error => {
        console.error('Error during dump operation:', error);
    });
  }


  
  // word checker: for end of game, to check if all words are valid (local/react instead of server for latency and operational cost)
  const checkWordsInGrid = (grid, dictionary) => {
    const gridSize = grid.length;
    let wordsToCheck = [];
  
    // Extract horizontal words and log them
    for (let row = 0; row < gridSize; row++) {
      const horizontalWords = extractWordsFromLine(grid[row]);
      // console.log(`Horizontal words in row ${row}:`, horizontalWords);
      wordsToCheck = wordsToCheck.concat(horizontalWords);
    }
  
    // Extract vertical words and log them
    for (let col = 0; col < gridSize; col++) {
      let columnArray = [];
      for (let row = 0; row < gridSize; row++) {
        columnArray.push(grid[row][col]);
      }
      const verticalWords = extractWordsFromLine(columnArray);
      // console.log(`Vertical words in column ${col}:`, verticalWords);
      wordsToCheck = wordsToCheck.concat(verticalWords);
    }
  
    // Logging all words found
    console.log(wordsToCheck)

    // Check all words using the Trie and log each check
    return wordsToCheck.every(word => {
      const isValid = dictionary.search(word);
      console.log(`Checking word '${word}':`, isValid ? 'Valid' : 'Invalid');
      return isValid;
    });
  };
  
  // Helper function to extract words from a line (array of letters)
  
  const extractWordsFromLine = (line) => {
    // Convert the array of characters into a string
  
    // Function now returns a word array instead of a string
    const words = [];
    let word = '';

    // If the current cell is not empty we append it to the string, once we meet an empty cell, depending on the
    // length of the word, we add it to the list of words found along that row/column
    for (let i = 0; i < gridSize; i++) {
      if (line[i] !== '') {
        word += line[i];
      } else {
        if (word.length >= 2) {
          words.push(word);
        }
        word = '';
      }
    }

    return words;
  };
  
  
  const handleCheckWords = () => {
    if (!tPlayed.areAllTilesConnected()) {
      setValidationMessage("You have unconnected tiles!");
      return;
    }
    if (dictionary && checkWordsInGrid(grid, dictionary)) {
      console.log('All words valid');
      setValidationMessage("All words are valid!");
    } else {
      console.log('Invalid word(s) found');
      setValidationMessage("You have invalid words!");
    }
  };



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

  // New functions for drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragStart = (event, source, letter, index, row = null, col = null) => {
    event.dataTransfer.setData("text/plain", letter);
    event.dataTransfer.setData("source", source);
    
    if (row !== null && col !== null) {
      // If row and col are provided, set them as well
      event.dataTransfer.setData("row", row);
      event.dataTransfer.setData("col", col);
    } else {
      // Otherwise, set the index
      event.dataTransfer.setData("index", index);
    }
  };
  
  const handleCellDragStart = (event, letter, row, col) => {
    handleDragStart(event, 'board', letter, null, row, col);
  };

  const handleRackDragStart = (event, letter, index) => {
    handleDragStart(event, 'rack', letter, index);
  };

  const handleDrop = (targetType, targetRow = null, targetCol = null) => (event) => {
    event.preventDefault();
  
    const source = event.dataTransfer.getData("source");
    const letter = event.dataTransfer.getData("text/plain");

    const newGrid = grid.map(row => row.slice());
    const newPlayerLetters = [...playerLetters];
  
    if (source === 'board') {
      const sourceRow = event.dataTransfer.getData("row");
      const sourceCol = event.dataTransfer.getData("col");
      newGrid[sourceRow][sourceCol] = '';

      // Tiles played changes
      tPlayed.removeTile(sourceRow, sourceCol);

    } else if (source === 'rack') {
      const sourceIndex = event.dataTransfer.getData("index");
      newPlayerLetters.splice(sourceIndex, 1);
    }
  
    if (targetType === 'board') {
      if (newGrid[targetRow][targetCol]) {
        newPlayerLetters.push(newGrid[targetRow][targetCol]);
        
        // Tiles played changes
        tPlayed.removeTile(targetRow, targetCol);
      }
      newGrid[targetRow][targetCol] = letter;

      // Tiles played changes
      tPlayed.addTile(targetRow, targetCol);

    } else if (targetType === 'rack') {
      newPlayerLetters.push(letter);
    }
  
    setGrid(newGrid);
    setPlayerLetters(newPlayerLetters);
  
    Promise.all([
      set(ref(database, 'grid'), newGrid),
      set(ref(database, 'playerLetters'), newPlayerLetters)
    ])
    .catch(error => console.error('Error updating the database:', error));
  };

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
        <div>
        <input
          type="text"
          value={inputGameId}
          onChange={(e) => setInputGameId(e.target.value)}
          placeholder="Enter Game ID"
        />
        <button onClick={handleJoinGame}>Join Game</button>
      </div>
        <button onClick={() => distributeLetters()} disabled={tilesDistributed}>Distribute</button>
        <p className="game-name-display">{gameName ? `Current Game: ${gameName}` : "No game started"}</p>
        <button onClick={shuffleLetters}>Shuffle</button>
        <button onClick={rebuildGrid}>Rebuild</button>
        <button onClick={peel} disabled={!(tilesDistributed && !playerLetters.length) || !tilesInBag || !tPlayed.areAllTilesConnected()}>PEEL</button>
      </div>
      <div>
        <h2 className="player-letters">Player Letters:</h2>
        <div
          className="player-tilerack"

          // Drag and drop from board to player rack
          onDrop={handleDrop('rack')}
          onDragOver={handleDragOver}
        >
          {/* Testing drag and drop feature */}
          <div>
            {playerLetters.map((letter, index) => (
              <Tile
                letter={letter}
                key={index}
                className="player-letter"
                
                // Additional code for drag and drop feature
                draggable={true}
                onDragStart={(event) => handleRackDragStart(event, letter, index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <input
            type="text"
            value={currDump}
            onChange={handleLetterChange}
            placeholder="Enter letter to dump"
            maxLength="1"
            className="dump-input"  // Apply custom class for styling
        />
        <button onClick={dump} disabled={currDump.length !== 1} className="dump-button">DUMP!</button>
      </div>
      <div>
        <button onClick={handleCheckWords} disabled={!(tilesDistributed && !playerLetters.length) /*|| tilesInBag*/}>
          Check Words
        </button> 
        {validationMessage && <p className="check-words-display">{validationMessage}</p>}
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <Tile
                letter={cell}
                key={colIndex}
                className={`cell ${startRow === rowIndex && startCol === colIndex ? 'selected' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}

                // Testing drag and drop functionality
                onDragOver={handleDragOver}
                onDrop={handleDrop('board', rowIndex, colIndex)}

                onDragStart={(event) => handleCellDragStart(event, cell, rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BogoGram;
