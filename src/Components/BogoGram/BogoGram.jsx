import React, { useState, useEffect } from 'react';
import { database } from './firebaseConfig'; // Adjust the path if necessary
import { getFunctions, httpsCallable} from 'firebase/functions'; //line 3 
import { initializeApp } from 'firebase/app'; 
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, signInWithPopup, GoogleAuthProvider, connectAuthEmulator, verifyPasswordResetCode } from 'firebase/auth';
import { collection, getFirestore, query, orderBy, limit, doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
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
const gridSize = 25;
const initialGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));


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
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LcUDAQqAAAAANVkU_mDYaTL-lTppYAcU2GEYemd'),

  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  isTokenAutoRefreshEnabled: true
});


function BogoGram() {
  const [grid, setGrid] = useState(initialGrid);
  const [currentWord, setCurrentWord] = useState('');
  
  // For word connectivity
  const [mustConnect, setMustConnect] = useState(false);


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


  //for dictionary checking (11 Jun)
  const [dictionary, setDictionary] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');  //this is to change a state after checking if all the words are valid
  

  // For toggling direction of play
  const [horizontal, setHorizontal] = useState(1);


  // Player tile rack
  const [playerLetters, setPlayerLetters] = useState([]);


  // Dump rack
  const [dumpRack, setDumpRack] = useState([]);

  // Word validity 
  const [allValid, setAllValid] = useState(false);

  // game over management
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState('');


  
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
      setAllValid(false);
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
      setAllValid(false);
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

  // Handle reading firestore docs for tile distribution
  useEffect(() => {
    if (!gameNumber || !user) return;

    const gameRef = doc(firestore, 'gameData', gameNumber);
    const unsubscribe = onSnapshot(gameRef, (docSnapshot) => {
      if (!docSnapshot.exists()) {
        console.error("Document does not exist");
        return;
      }
      const data = docSnapshot.data();
      const updatesRef = doc(firestore, 'gameData', gameNumber);
      if (data.tileDistribution && data.tileDistribution[user.uid]) {
        if (!arraysEqual(data.tileDistribution[user.uid], playerLetters) && !tilesDistributed) {
          setPlayerLetters(data.tileDistribution[user.uid]);
          
          updateDoc(updatesRef, {['tileDistribution.' + user.uid]: []});
          setTilesDistributed(true);
        }
        
        if (data.tileUpdates && data.tileUpdates[user.uid]) {
          setPlayerLetters(prevLetters => [...prevLetters, ...data.tileUpdates[user.uid]]);
          
          updateDoc(updatesRef, {['tileUpdates.' + user.uid]: []});
        }
        if (!data.tilesInBag) {
          setTilesInBag(false);
          
        }
        if (data.gameOver) {
          setGameOver(true);
          setGameWinner(data.gameWinner);
          alert(data.gameWinner === user.uid ? "By some lottery, you have won the game!" : "Game over! Boo hoo.");
        }
      }

    }, error => {
      console.error("Error listening to the game data:", error);
    });

    return () => unsubscribe();  // Cleanup subscription on component unmount
  }, [gameNumber, user, firestore]);

  // helper function for array equality, reduces numbger of updates
  function arraysEqual(a,b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i< a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Distribute letters to players
  /* const distributeLetters = () => {
    const functions = getFunctions(app);
    const distributeTiles = httpsCallable(functions, 'distributeTiles');
    distributeTiles({ gameID: gameNumber }).then((result) => {
      setPlayerLetters(result.data.tiles);
      console.log('Tiles distributed for game:', gameNumber);
      setTilesDistributed(true);
    }).catch(error => {
      console.error('Error distributing tiles:', error);
    });
  }; */
  const distributeLetters = () => {
    const functions = getFunctions(app);
    const distributeTiles = httpsCallable(functions, 'distributeTiles');
    distributeTiles({ gameID: gameNumber }).catch(error => {
      console.error('Error distributing tiles:', error);
    });
  };
  

  // Peel: provides a singular new letter to the player
  /* const peel = () => {
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
  } */
  const peel = () => {
    if (!tilesInBag) {
      alert("Not enough tiles in the bag!");
      return
    }
    const functions = getFunctions(app);
    const peel = httpsCallable(functions, 'peel');
    peel({gameID: gameNumber}).catch(error => {
      console.error('Error requesting more tiles:', error);
    });
}



  // Dump: allows a player to return 1 letter to the bag and get back 3 randomly drawn ones
  // TODO: Please redo this for drag and drop functionality
  const dump = () => {
    if (!tilesInBag) {
      alert("Not enough tiles in the bag!");
      return
    }
    if (dumpRack.length !== 1) {
        alert("Please enter exactly one letter to dump.");
        return;
    }
    const functions = getFunctions(app);
    const dumpTile = httpsCallable(functions, 'dumpTile');
    dumpTile({ gameID: gameNumber, tile: dumpRack[0] }).then((result) => {
        const newTiles = result.data.tiles;
        if (newTiles.includes("*")) {
            setTilesInBag(false);
            alert("No more tiles in the bag!");
        } else {
            setDumpRack(prevDumpRack => {
                return [];
            });
            setPlayerLetters(prevLetters => {
                // Add the new tiles to the end
                return [
                    ...prevLetters,
                    ...newTiles
                ];
            });
            console.log('Dump and new tiles for game:', gameNumber, 'Tiles:', newTiles);
        }
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
      setAllValid(false);
      return;
    }
    if (dictionary && checkWordsInGrid(grid, dictionary)) {
      console.log('All words valid');
      setValidationMessage("All words are valid!");
      setAllValid(true);
    } else {
      console.log('Invalid word(s) found');
      setValidationMessage("You have invalid words!");
      setAllValid(true);
    }
  };

  const handleBananas = async () => {
    handleCheckWords(); // This sets `allValidWords`
  
    if (!gameNumber || !user) return;
    const gameRef = doc(firestore, 'gameData', gameNumber);
  
    if (allValid) {
      // Current player wins
      console.log("You win!")
      await updateDoc(gameRef, {
        gameOver: true,
        gameWinner: user.uid
      });
    } else {
      // Randomly choose a winner among the players
      console.log("You have invalid letters, somebody else will win :(");
      const docSnapshot = await getDoc(gameRef);
      const data = docSnapshot.data();
      const randomWinner = data.playerID[Math.floor(Math.random() * data.playerID.length)];
      console.log("Instead, the winner shall be: " + randomWinner);
      await updateDoc(gameRef, {
        gameOver: true,
        gameWinner: randomWinner
      });
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

  const handleDumpDragStart = (event, letter, index) => {
    handleDragStart(event, 'dump', letter, index);
  };

  // this is to update the tiles in the firestore document when they are dropped, so that when peel is used, the original 21 tiles don't get fetched. Added 23 Jun. May not use
  const updateTilesInFirestore = async (newPlayerLetters) => {
    const gameRef = doc(firestore, 'gameData', gameNumber);
    try{
      await updateDoc(gameRef, {
        ['tileDistribution.${user.uid}']: newPlayerLetters
      });
    } catch (error) {
      console.error("Error updating player tiles in Firestore:", error);
    }
  };

  const handleDrop = (targetType, targetRow = null, targetCol = null) => (event) => {
    event.preventDefault();
  
    const source = event.dataTransfer.getData("source");
    const letter = event.dataTransfer.getData("text/plain");

    const newGrid = grid.map(row => row.slice());
    const newPlayerLetters = [...playerLetters];
    const newDumpRack = [...dumpRack];

    let sourceRow, sourceCol;
  
    if (source === 'board') {

      // Changes made such that tiles are swapped on board instead of one tile being sent back to player rack
      sourceRow = event.dataTransfer.getData("row");
      sourceCol = event.dataTransfer.getData("col");
      newGrid[sourceRow][sourceCol] = '';

      // Tiles played changes
      tPlayed.removeTile(sourceRow, sourceCol);

    } else if (source === 'rack') {
      const sourceIndex = event.dataTransfer.getData("index");
      newPlayerLetters.splice(sourceIndex, 1);
    } else if (source === 'dump') {
      newDumpRack.pop();
    }
  
    // Fixed logic for drag and drop
    if (targetType === 'board') {
      if (newGrid[targetRow][targetCol]) {

        // Check if variables sourceRow and sourceCol are falsy
        if (sourceRow && sourceCol) {
          newGrid[sourceRow][sourceCol] = newGrid[targetRow][targetCol];
          tPlayed.addTile(sourceRow, sourceCol)
        } else {
          newPlayerLetters.push(newGrid[targetRow][targetCol]);
        }
        tPlayed.removeTile(targetRow, targetCol);
      }
      newGrid[targetRow][targetCol] = letter;

      // Tiles played changes
      tPlayed.addTile(targetRow, targetCol);

    } else if (targetType === 'rack') {
      newPlayerLetters.push(letter);
    } else if (targetType === 'dump') {
      if (newDumpRack.length === 1) {
        const tile = newDumpRack.pop();
        newPlayerLetters.push(tile);
      }
      newDumpRack.push(letter);
    }
  
    setGrid(newGrid);
    setPlayerLetters(newPlayerLetters);
    // updateTilesInFirestore(newPlayerLetters); //added 23 Jun
    setDumpRack(newDumpRack);
  
    Promise.all([
      set(ref(database, 'grid'), newGrid),
      set(ref(database, 'playerLetters'), newPlayerLetters),

      // new code
      set(ref(database, 'dumpRack'), newDumpRack)
    ])
    .catch(error => console.error('Error updating the database:', error));
  };

  // Just for convenience to make the game title
  const gameTitle = ['B','O','G','O','G','R','A','M'];

  if (!user) {
    return (
      <div className="Login">
        <h1 className="login-title">
          {gameTitle.map((letter) => (
            <span className="login-title-tile">
              <span>{letter}</span>
            </span>
          ))}
        </h1>
        <button id="button" className="sign-in" onClick={signIn}>Sign In</button>
      </div>
    );
  }

  return (
    <div className="Game">
      <h1 className="game-title">
        {gameTitle.map((letter) => (
          <span className="game-title-tile">
            <span>{letter}</span>
          </span>
        ))}
      </h1>
      {/* Conditional rendering to show the sign-out button only when the user is signed in */}
      {user && (
        <button id="button" onClick={signOut}>Sign Out</button>
      )}
      <div>
        <button id="button" onClick={startGame}>Start game</button>
        <div>
        <input
          type="text"
          value={inputGameId}
          onChange={(e) => setInputGameId(e.target.value)}
          placeholder="Enter Game ID"
        />
        <button id="button" onClick={handleJoinGame}>Join Game</button>
      </div>
        <button id="button" onClick={() => distributeLetters()} disabled={tilesDistributed}>Distribute</button>
        <p className="game-name-display">{gameName ? `Current Game: ${gameName}` : "No game started"}</p>
        <button id="button" onClick={shuffleLetters}>Shuffle</button>
        <button id="button" onClick={rebuildGrid}>Rebuild</button>
        <button id="button" onClick={peel} disabled={!(tilesDistributed && !playerLetters.length) || !tilesInBag || !tPlayed.areAllTilesConnected() || dumpRack.length}>PEEL</button>
      </div>
      <div>
        <h2 className="player-letters">Player Letters</h2>
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
                onDragStart={(event) => handleRackDragStart(event, letter, index)}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <div
          className="dump-rack"

          // Drag and drop from board to player rack
          onDrop={handleDrop('dump')}
          onDragOver={handleDragOver}
        >
          {/* Testing drag and drop feature */}
          <div>
            {dumpRack.map((letter, index) => (
              <Tile
                letter={letter}
                key={index}
                className="dump-letter"
                
                // Additional code for drag and drop feature
                onDragStart={(event) => handleDumpDragStart(event, letter, 0)}
              />
            ))}
          </div>
        </div> 
        <button id="button" onClick={dump} disabled={dumpRack.length !== 1} className="dump-button">DUMP!</button>
      </div>
      <div>
        <button id="button" onClick={handleBananas} disabled={!(tilesDistributed && !playerLetters.length) || tilesInBag}>
          BANANAS!
        </button> 
        {validationMessage && <p className="check-words-display">{validationMessage}</p>}
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                className="cell"

                // Shifted drag and drop from Tile to div
                onDragOver={handleDragOver}
                onDrop={handleDrop('board', rowIndex, colIndex)}
              >
                <Tile
                  letter={cell}
                  key={colIndex}
                  className={`${cell ? 'board-tile' : ''} ${startRow === rowIndex && startCol === colIndex ? 'selected' : ''}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}

                  // Testing drag and drop functionality
                  onDragStart={(event) => handleCellDragStart(event, cell, rowIndex, colIndex)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BogoGram;
