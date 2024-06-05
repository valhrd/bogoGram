import React, { useState, useEffect } from 'react';
import { database } from './firebaseConfig'; // Adjust the path if necessary
// import firebase from 'firebase/app';
/* import 'firebase/firestore'; //new from here
import 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore'; //until here
*/

import { initializeApp } from 'firebase/app'; 
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

import { ref, onValue, set } from 'firebase/database';
import './BogoGram.css';


// Create dictionary
import dictionary from './populateTrie';


// Grid formation plus tilebag
const gridSize = 35;
const initialGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
const letters = 'AAABBBCCCDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSTTTTTTTTTUUUUUUVVVWWWXXYYYZZ';
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
  const [startRow, setStartRow] = useState(null);
  const [startCol, setStartCol] = useState(null);
  const [direction, setDirection] = useState('horizontal');
  const [playerLetters, setPlayerLetters] = useState([]);
  const [user] = useAuthState(auth); //new

  const signIn = async () => { //new function
    const provider = new GoogleAuthProvider(); // Create a Google Auth provider
    try {
        await signInWithPopup(auth, provider); // Sign in with a popup window
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
  };



  const handleWordChange = (e) => {
    setCurrentWord(e.target.value.toUpperCase());
  };



  const handleDirectionChange = (e) => {
    setDirection(e.target.value);
  };



  const placeWord = () => {
    if (!currentWord || startRow === null || startCol === null) return;

    // Check validity
    if (!dictionary.search(currentWord)) {
      alert("Invalid word");
      return;
    }

    const newGrid = grid.map(row => row.slice());
    const newPlayerLetters = [...playerLetters];

    for (let i = 0; i < currentWord.length; i++) {
      const row = startRow + (direction === 'vertical' ? i : 0);
      const col = startCol + (direction === 'horizontal' ? i : 0);

      if (row >= gridSize || col >= gridSize || newGrid[row][col] !== '') {
        alert('Word cannot be placed here');
        return;
      }

      if (!newPlayerLetters.includes(currentWord[i])) {
        alert('You do not have the required letters');
        return;
      }

      newPlayerLetters.splice(newPlayerLetters.indexOf(currentWord[i]), 1);
      newGrid[row][col] = currentWord[i];
    }

    set(ref(database, 'grid'), newGrid)
      .then(() => setGrid(newGrid))
      .catch(error => console.error('Error updating the database grid:', error));

    set(ref(database, 'playerLetters'), newPlayerLetters)
      .then(() => setPlayerLetters(newPlayerLetters))
      .catch(error => console.error('Error updating the database playerLetters:', error));

    setCurrentWord('');
    setStartRow(null);
    setStartCol(null);
  };



  // Dev start/restart game function
  const startGame = () => {
    // Randomised array to represent tilebag
    lettersArray = letters.split('').sort((firstLetter, secondLetter) => 0.5 - Math.random());
    clearBoard();
    setPlayerLetters([]);
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
  };



  // Distribute letters to players
  const distributeLetters = () => {
    const newLetters = [];
    for (let i = 0; i < 7; i++) {
      // newLetters.push(letters[Math.floor(Math.random() * letters.length)]);
      if (lettersArray === undefined || lettersArray.length === 0) {
        break;
      }
      newLetters.push(lettersArray.pop());
    }

    set(ref(database, 'playerLetters'), newLetters)
      .then(() => {
        setPlayerLetters(newLetters);
      })
      .catch(error => {
        console.error('Error distributing letters:', error);
      });
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
        <button onClick={distributeLetters}>Distribute</button>
      </div>
      <div>
        <h2 className="player-letters">Player Letters:</h2>
        <div className="player-letters">
          {playerLetters.map((letter, index) => (
            <span key={index} className="player-letter">
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
        <select value={direction} onChange={handleDirectionChange}>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
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
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BogoGram;
