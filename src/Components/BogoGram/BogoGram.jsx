import React, { useState, useEffect } from 'react';
import { database } from './firebaseConfig';
import { getFunctions, httpsCallable} from 'firebase/functions'; // Line 3
import { initializeApp } from 'firebase/app'; 
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, signInWithPopup, GoogleAuthProvider, connectAuthEmulator, verifyPasswordResetCode } from 'firebase/auth';
import { collection, getFirestore, query, orderBy, limit, doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import Trie from './Trie';

import TicTacToe from '../TicTacToe/TicTacToe';

import { ref, onValue, set } from 'firebase/database';
import './Login.css';
import './BogoGram.css';

// Tiles
import Tile from './Tile';
import TilesPlayed from './TilesPlayed';

// Buttons
import GameButton from './GameButton';

// Timer
import useTimer from './useTimer';

// Modal objects
import InstructionsOverlay from './InstructionsOverlay';
import Modal from './Modal';
import OptionsModal from './OptionsModal';

// Grid formation plus tilebag
const gridSize = 35;
const initialGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));

// Tiles played changes
const tPlayed = new TilesPlayed();

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
const appCheck = initializeAppCheck(app, { // for recaptcha v3
  provider: new ReCaptchaV3Provider('6LcUDAQqAAAAANVkU_mDYaTL-lTppYAcU2GEYemd'),
  isTokenAutoRefreshEnabled: true
});


function BogoGram() {
  const [grid, setGrid] = useState(initialGrid);
  const [currentWord, setCurrentWord] = useState('');
  
  // For word connectivity
  const [mustConnect, setMustConnect] = useState(false);

  // for server side things
  const gameDataRef = collection(firestore, 'gameData'); 
  const [gameName, setGameName] = useState(null); // This is for debugging
  const [gameNumber, setGameNumber] = useState(null);  // Changed to use useState
  const queryConstraints = query(gameDataRef, orderBy('createdAt'), limit(5)); // is this necessary? 
  const [gameStates] = useCollectionData(queryConstraints, { idField: 'gameID' }); // or this
  

  // For other players to join the game
  const [inputGameId, setInputGameId] = useState('');

  // this is to lock the distribute and peel buttons when necessary
  const [tilesDistributed, setTilesDistributed] = useState(false);
  const [tilesInBag, setTilesInBag] = useState(true);

  // for dictionary checking (11 Jun)
  const [dictionary, setDictionary] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');  //this is to change a state after checking if all the words are valid

  // Just for convenience to make the game title
  const [loginTitle, setLoginTitle] = useState('BOGOGRAM'.split(''));
  const [gameTitle, setGameTitle] = useState('BOGOGRAM'.split(''));

  // Player tile rack
  const [playerLetters, setPlayerLetters] = useState([]);

  // Dump rack
  const [dumpRack, setDumpRack] = useState([]);

  // Word validity 
  const [allValid, setAllValid] = useState(false);

  // game over management
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState('');

  // beast mode
  const [beastMode, setBeastMode] = useState(false);

  // singleplayer + timer
  const [singlePlayer, setSinglePlayer] = useState(false);
  const {timer, timeTaken, startTimer, stopTimer, resetTimer} = useTimer();
  //leaderboard 
  const [leaderboardTimings, setLeaderboardTimings] = useState([]);
  const [playerRank, setPlayerRank] = useState(null);

  // for displaying player count
  const [playerCount, setPlayerCount] = useState(0);
  // for limiting number of hints
  const [numHints, setNumHints] = useState(0);

  // instructions
  const [showInstructions, setShowInstructions] = useState(false);

  // showing of modal
  const [isModalOpen, setModalOpen] = useState(false);
  const [isOptionsModalOpen, setOptionsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  // Additional booleans and delay time to disable buttons that should not be spammed
  // Buttons to disable: Start Game (may subject to change), Distribute, PEEL, DUMP, BANANAS!
  // Value of delay is also subject to change
  const [startGameDisabled, setStartGameDisabled] = useState(false);
  const [distributeButtonDisabled, setDistributeButtonDisabled] = useState(false);
  const [peelButtonDisabled, setPeelButtonDisabled] = useState(false);
  const [dumpButtonDisabled, setDumpButtonDisabled] = useState(false);
  const [bananasButtonDisabled, setBananasButtonDisabled] = useState(false);
  const cooldown = 7000;
  
  // Try to "abstract" since the structure is all the same
  const buttonTimeOut = (disablingFunction) => {
    setTimeout(disablingFunction, cooldown);
  }

  const handleStartGame = () => {
    startGame();
    setStartGameDisabled(true);
    buttonTimeOut(() => {
      setStartGameDisabled(false);
    });
  }

  const handleDistributeButton = () => {
    distributeLetters();
    setDistributeButtonDisabled(true);
    buttonTimeOut(() => {
      setDistributeButtonDisabled(false);
    });
  }

  const handlePeelButton = () => {
    peel();
    setPeelButtonDisabled(true);
    buttonTimeOut(() => {
      setPeelButtonDisabled(false);
    });
  }

  const handleDumpButton = () => {
    dump();
    setDumpButtonDisabled(true);
    buttonTimeOut(() => {
      setDumpButtonDisabled(false);
    });
  }

  const handleBananasButton = () => {
    handleBananas();
    setBananasButtonDisabled(true);
    buttonTimeOut(() => {
      setBananasButtonDisabled(false);
    });
  }

  // authentication via google account
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


  // state updates for dictionary checking using Trie
  useEffect(() => {
    if (!dictionary) { //new on 11 jun
      fetch('/dictionary.json')
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



  const startGame = () => {
    clearBoard();
    setPlayerLetters([]);
    const functions  = getFunctions(app);
    const createGame = httpsCallable(functions, 'createGame');
    createGame({beastMode: beastMode}).then((result) => {
      console.log('New Game Created with ID: ', result.data.gameID);
      setGameNumber(result.data.gameID);
      setGameName(result.data.gameID);
      setNumHints(10);
      setAllValid(false);
      setBeastMode(beastMode);
    }).catch(error => {
      console.error('Error in creating new game', error);
    });
  }

  // copy game name to clipboard
  const copyToClipboard = () => {
    if (gameName) {
      navigator.clipboard.writeText(gameName).then(() => {
        setValidationMessage("Successfully copied to clipboard!");
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
  };

  // Join game function for other players
  const handleJoinGame = () => {
    //fun
    const fun = inputGameId.trim().toLowerCase();
    if (fun === 'rick' || fun === 'video' || fun === 'music') {
      window.open('https://youtu.be/dQw4w9WgXcQ?si=okvQNghMp1mhPlwX', '_blank');
      setInputGameId('');
      return;
    } else if (fun === 'scrabble') {
      window.open('https://playscrabble.com/', '_blank')
      setInputGameId('');
      return;
    } else if (!gameName && (fun === 'beast' || fun === 'beastmode')) {
      toggleBeastMode();
      setInputGameId('');
      return;
    }
    if (!inputGameId.trim()) {
      const content = "Please enter a valid game ID to join a game.";
      setModalContent(content);
      setModalOpen(true);
      return;
    }
    const functions = getFunctions(); 
    const joinGame = httpsCallable(functions, 'joinGame');
    joinGame({ gameID: inputGameId.trim() }).then(result => {
      console.log(result.data.message);
      if (result.data.message === "Game has already started") {
        const content = "The game has already started. Please join another one";
        setModalContent(content);
        setModalOpen(true);
        return;
      } else if (result.data.message === "Game not found") {
        const content = "The game could not be found ";
        setModalContent(content);
        setModalOpen(true);
        return;
      }
      const res = inputGameId.trim();
      setGameNumber(res); // Set the current game ID to the one joined
      setGameName(result.data.beastMode ? "Beast Mode " + res : res); // Adjust the game name based on the mode
      setBeastMode(result.data.beastMode); // Set beast mode state
      const content = "Successfully joined the game!";
      setModalContent(content);
      setModalOpen(true);
      setInputGameId(''); // Clear the input field
      setAllValid(false);
    }).catch(error => {
      console.error('Error joining game:', error);
      const content = "Failed to join game: " + error.message;
      setModalContent(content);
      setModalOpen(true);
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
      // Check if it's a singleplayer game
      if (data.tilesDistributed) {
        if (data.playerID.length === 1){
          setSinglePlayer(true);
        }
        startTimer();
      }
      const updatesRef = doc(firestore, 'gameData', gameNumber);
      if (data.playerID) {
        setPlayerCount(data.playerID.length); // Update player count based on the array length
      }  
      if (data.tileDistribution && data.tileDistribution[user.uid]) {
        if (!arraysEqual(data.tileDistribution[user.uid], playerLetters) && !tilesDistributed) {
          startTimer();
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
        if (data.gameOver && singlePlayer) {
          setGameOver(true);
          setGameWinner(data.gameWinner);
          const content = 'You have beat the game!';
          setModalContent(content);
          setModalOpen(true);
        }
        if (data.gameOver && !singlePlayer) {
          stopTimer();
          setGameOver(true);
          setGameWinner(data.gameWinner);
          const content = data.gameWinner === user.uid ? "By some lottery, you have won the game!" : "Game over! Boo hoo.";
          setModalContent(content);
          setModalOpen(true);
        }
      }
    }, error => {
      console.error("Error listening to the game data:", error);
    });
    return () => { 
      unsubscribe();  
      stopTimer();
    }
  }, [gameNumber, user, firestore]);

  // Helper function for array equality, reduces number of updates
  function arraysEqual(a,b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  // Distribute letters to players
  const distributeLetters = () => {
    const functions = getFunctions(app);
    const distributeTiles = httpsCallable(functions, 'distributeTiles');
    startTimer();
    distributeTiles({ gameID: gameNumber }).catch(error => {
      console.error('Error distributing tiles:', error);
    });
  };
  
  // Peel: provides a singular new letter to the player
  const peel = () => {
    if (!tilesInBag) {
      const content = "Not enough tiles in the bag!";
      setModalContent(content);
      setModalOpen(true);
      return
    }
    const functions = getFunctions(app);
    const peel = httpsCallable(functions, 'peel');
    peel({gameID: gameNumber}).catch(error => {
      console.error('Error requesting more tiles:', error);
    });
  }


  // Dump: allows a player to return 1 letter to the bag and get back 3 randomly drawn ones
  const dump = () => {
    if (!tilesInBag) {
      const content = "Not enough tiles in the bag!";
      setModalContent(content);
      setModalOpen(true);
      return
    }
    if (dumpRack.length !== 1) {
        const content = "Please enter exactly one letter to dump.";
        setModalContent(content);
        setModalOpen(true);
        return;
    }
    const functions = getFunctions(app);
    const dumpTile = httpsCallable(functions, 'dumpTile');
    dumpTile({ gameID: gameNumber, tile: dumpRack[0] }).then((result) => {
        const newTiles = result.data.tiles;
        if (result.data.status === "Tile given to another player") {
          console.log('Your dumped tile was given to another player.');
          setValidationMessage('Your dumped tile was given to another player.');
          setDumpRack(prevDumpRack => {
            return [];
        });
        } else if (newTiles.includes("*")) {
            setTilesInBag(false);
            const content = "Not enough tiles in the bag!";
            setModalContent(content);
            setModalOpen(true);
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

  
  // Word checker: for end of game, to check if all words are valid (local/react instead of server for latency and operational cost)
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

    // For the final word in case the word touches the right or bottom edges of the board
    if (word.length >= 2) {
      words.push(word);
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
    const finalTime = stopTimer(); // Stop the timer (only really matters for Singleplayer)
    if (singlePlayer) {
      console.log(`You finished in ${finalTime} seconds!`);
      if (allValid) {
        const updateLeaderboard = httpsCallable(getFunctions(), 'updateLeaderboard');
        updateLeaderboard({ finalTime }).then((result) => {
            console.log(result.data.message); // Log the position returned by the function
            // Mark the game as over with the final time and winner
            updateDoc(gameRef, {
                gameOver: true,
                gameWinner: user.uid,
                finalTime: finalTime 
            });
            const content = result.data.message;
            setModalContent(content);
            setModalOpen(true);
        }).catch((error) => {
            console.error('Error updating leaderboard:', error);
            const content = "Failed to update leaderboard: " + error.message;
            setModalContent(content);
            setModalOpen(true);
        });
      } else {
        console.log("Invalid words detected. Please try again.");
        startTimer(); 
        }
    }
    else {
      stopTimer();
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
    }
  };

  // For hints
  const handleGetHint = () => {
    //const word = findValidWord(playerLetters, dictionary);
    const shuffled = shuffleTiles([...playerLetters]);
    const word = findWord(shuffled, dictionary.root);
    const newNum = numHints - 1;
    if (word) {
        setValidationMessage(`Hint: Try the word '${word}'!`);
        setNumHints(newNum);
    } else {
        setValidationMessage("Couldn't find a valid word. Try again or use DUMP! to change tiles.");
    }
  };

  const findWord = (letters, root) => {
    const words = [];
    const letterCount = {};
    letters.forEach((item) => {letterCount[item] = (letterCount[item] || 0) + 1});
    const depthSearch = (letterCount, path, curr, minLength = 2, depth = 6, maxWords = 50) => {
      if (words.length === maxWords) {
        return;
      }
      if (depth === 0) {
        if (curr.isEndOfWord) {
          words.push(path.join(''));
        }
        return;
      }
      if (curr.isEndOfWord && path.length >= minLength) {
        words.push(path.join(''));
      }
      for (const letter in letterCount) {
        if (letterCount[letter] > 0 && curr.children[letter]) {
          letterCount[letter]--;
          path.push(letter);
          depthSearch(letterCount, path, curr.children[letter], minLength, depth - 1);
          letterCount[letter]++;
          path.pop();
        } 
      }
    }
    depthSearch(letterCount, [], root);
    console.log(words);
    return words[Math.floor(Math.random() * words.length)];
  }
  
  // Shuffle player rack
  const shuffleTiles = (tiles) => {
    return tiles.sort(() => 0.5 - Math.random());
  }

  const shuffleLetters = () => {
    const newLetters = shuffleTiles([...playerLetters]);
    set(ref(database, 'playerLetters'), newLetters)
      .then(() => {
        setPlayerLetters(newLetters);
      })
      .catch(error => {
        console.error('Error distributing letters:', error);
      });
  }

  const handleRebuildGrid = () => {
    const content = "Do you really want to recall all tiles to the rack?";
    setModalContent(content);
    setOptionsModalOpen(true);
  }

  const rebuildGrid = () => {
    setOptionsModalOpen(false);
    grid.map((row, rowIndex) => (
      row.map((cell, colIndex) => {
        if (cell !== "") {
          playerLetters.push(cell);
        }
      }
    )));
    clearBoard();
  }

  // Drag and drop
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

  const toggleBeastMode = () => {
    const newBeastMode = !beastMode
    setBeastMode(newBeastMode);
    if (newBeastMode) {
      setGameTitle('BEASTGRAM'.split(''));
    } else {
      setGameTitle('BOGOGRAM'.split(''));
    }
  }

  const [ticTacToe, setTicTacToe] = useState(false)
  const handleTicTacToe = () => {
    setTicTacToe(!ticTacToe);
  }

  if (!user) {
    return (
      <div className="Login">
        <h1 className="login-title">
          {loginTitle.map((letter, index) => (
              <span className={`login-title-tile ${(index >= 1 && index <= 3 && ticTacToe) ? "special-tile" : ""}`}>
                <span onClick={(index === 2) ? handleTicTacToe : () => {}}>
                  {(index === 2 && ticTacToe) ? "X" : letter}
                </span>
              </span>
          ))}
        </h1>
        <GameButton
          name="Sign In"
          className={ticTacToe ? "special-mode" : ""}
          onClick={signIn}
        />
        <GameButton
          name="How to play"
          onClick={() => setShowInstructions(true)}
        />
        {showInstructions && <InstructionsOverlay onClose={() => setShowInstructions(false)} />}
      </div>
    );
  }

  if (user && ticTacToe) {
    return (
      <div className='TicTacToe'>
        <TicTacToe signOut={signOut} />
      </div>
    )
  }
  

  return (
    <div className={`Game`}>
      <h1 className="game-title">
        <button className={`beastModeToggle ${beastMode ? "beastMode" : ""}`} onClick={toggleBeastMode} disabled={startGameDisabled || gameName}>
          <span className="beastModeLetter">B</span>
        </button>
        {gameTitle.slice(1).map((letter) => (
          <span className={`game-title-tile ${beastMode ? "beastMode" : ""}`}>
            <span>{letter}</span>
          </span>
        ))}
      </h1>
      <div>
        <GameButton
          name="Sign Out"
          className="signOutButton"
          onClick={signOut}
        />
      </div>
      <div className="player-count-display">
        Players: {playerCount}
      </div>
      <div>
        <div className="gameID-container">
          <div></div>
          <p className="game-name-display">{gameName ? `Game ID: ${gameName}` : "No game started"}</p>
          {(gameName && !tilesDistributed) &&
            <button onClick={copyToClipboard} className="copy-button"> <img src = "/icon/copy-icon.webp" alt="Copy Icon"/> </button>
          }
        </div>
        <GameButton
          name={beastMode ? "Create A Beast Game" : "Create Game"}
          className={`${beastMode ? "beastModeGameButton" : ""}`}
          desc={beastMode ? "Beast Mode: More faster, more funner!" : "Generates a game ID and creates a game"}
          onClick={handleStartGame}
          disabled={startGameDisabled || gameName}
        />
        <div>
          <input
            type="text"
            value={inputGameId}
            onChange={(e) => setInputGameId(e.target.value)}
            placeholder="Enter Game ID"
          />
          <GameButton
            name="Join Game"
            desc="Joins a game using an existing game ID"
            onClick={handleJoinGame}
          />
        </div>
        <div>
          <GameButton
            name="Start Game"
            desc="This distributes the tiles"
            onClick={handleDistributeButton}
            disabled={!gameName || distributeButtonDisabled || tilesDistributed}
          />
          <Modal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            content={modalContent}
          />
          <OptionsModal
            isOpen={isOptionsModalOpen}
            onYes={rebuildGrid}
            onNo={() => setOptionsModalOpen(false)}
            content={<p>{modalContent}</p>}
          />
        </div>
      </div>
      <div className="tilerack-container">
        <h2 className="tilerack-title">Tile Rack</h2>
        <div
          className="player-tilerack"
          onDrop={handleDrop('rack')}
          onDragOver={handleDragOver}
        >
          <div>
            {playerLetters.map((letter, index) => (
              <Tile
                letter={letter}
                key={index}
                className="player-letter"
                draggable={true}
                onDragStart={(event) => handleRackDragStart(event, letter, index)}
              />
            ))}
          </div>
        </div>
        <div className="button-container">
          <div className="dump-container">
            <h2 className="dump-rack-title">
              Dump Rack
            </h2>
            <div
              className="dump-rack"
              onDrop={handleDrop('dump')}
              onDragOver={handleDragOver}
            >
              <div>
                {dumpRack.map((letter, index) => (
                  <Tile
                    letter={letter}
                    key={index}
                    className={`${dumpButtonDisabled ? "dump-cooldown" : ""} dump-letter`}
                    draggable={!dumpButtonDisabled}
                    onDragStart={(event) => handleDumpDragStart(event, letter, 0)}
                  />
                ))}
              </div>
            </div>
            <GameButton
              name="DUMP"
              desc={`${beastMode ? "Dump 1 tile for a chance of getting 5 back or giving it to another player" : "Dump 1 tile back into the bag and get 3 in return"}`}
              onClick={handleDumpButton}
              disabled={dumpButtonDisabled || dumpRack.length !== 1}
            />
          </div>
          <div>
            <GameButton
              name="HINT"
              desc={`Number of hints remaining: ${numHints}`}
              onClick={handleGetHint}
              disabled={!tilesDistributed || (playerLetters.length < 2) || gameOver || numHints < 1}
            />
            <GameButton
              name="SHUFFLE"
              desc="Mixes your player rack"
              onClick={shuffleLetters}
              disabled={playerLetters.length <= 1}
            />
            <GameButton
              name="REBUILD"
              desc="Recalls all your tiles back to the player rack"
              onClick={handleRebuildGrid}
              disabled={tPlayed.numberOfTilesPlayed === 0}
            />
            <GameButton
              name="PEEL"
              desc={beastMode ? "Draw 3 tiles from the bag for everyone in the game" : "Draw 1 tile from the bag for everyone in the game"}
              onClick={handlePeelButton}
              disabled={peelButtonDisabled || !(tilesDistributed && !playerLetters.length) || !tilesInBag || !tPlayed.areAllTilesConnected() || dumpRack.length}
            />
          </div>
          <div>
            <GameButton
              name="BANANAS!"
              desc="End the game right now"
              onClick={handleBananasButton}
              disabled={bananasButtonDisabled || !(tilesDistributed && !playerLetters.length) || tilesInBag || !tPlayed.areAllTilesConnected() || dumpRack.length}
            />
          </div>
        </div>
      </div>
      <div>
      </div>
      <div>
        {validationMessage && <p className="check-words-display">{validationMessage}</p>}
      </div>
      <div>
        {true && (
          <div className="timer-container">
            <div className="timer-heading">Timer</div>
            {timeTaken.split('').map((digit, index) => (
              <span className={`${index % 3 === 2 ? "timer-unit" : ""} timer-tile board-tile`}>{digit}</span>
            ))}
          </div>
        )}
      </div>
      <div className="grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                className="cell"
                onDragOver={handleDragOver}
                onDrop={handleDrop('board', rowIndex, colIndex)}
              >
                <Tile
                  letter={cell}
                  key={colIndex}
                  className={`${cell ? 'board-tile' : ''}`}
                  draggable={true}
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
