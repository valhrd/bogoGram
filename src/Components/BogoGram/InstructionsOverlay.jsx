import React from 'react';
import GameButton from './GameButton';

const InstructionsOverlay = ({ onClose }) => {
  return (
    <div className="overlay">
      <div className="overlay-content">
        {/* <button className="close-btn" onClick={onClose}>&times;</button> */}
        <h2>How to Play</h2>
        <p>Here are the instructions on how to play the game:</p>
        <ul>
          <li>Start the game by signing in.</li>
          <li>Choose your game mode: Normal or Beast Mode, by clicking on the letter "B" in the "Bogogram" header. Choose Beast Mode for a faster, more exciting game, or Bogogram mode for the classic game</li>
          <li>Press "Create Game" to create a new game</li>
          <li>If you want to play with friends, tell them what the gameID is! If someone's given you the gameID, paste it on the box and press "Join Game"</li>
          <li>Press start game to distribute tiles. All players will get the same number of tiles</li>
          <li>Form valid words in a grid in horizontal and vertical directions by dragging tiles from your tile rack and dropping them on the grid</li>
          <li>Finished all the tiles on your rack? Press "PEEL" and everyone gets a new tile!</li>
          <li>Can't find a way to play a tile? No problem! Just drag it over to the DUMP rack and press on "DUMP!" You may get a few tiles back in return though...</li>
          <li>Still stuck? Use "Hint" to get a hint for what to do with your tiles. Use the hints carefully though, beacuse you only have 10</li>
          <li>Need other ideas? Use "Shuffle" to shuffle the tiles on your tile rack. Maybe you'll get another idea</li>
          <li>Want to tear down and rebuild your grid? Use "Rebuild" to recall all tiles from the grid to your rack</li>
          <li>Press 'Bananas' when you finish to check if you win.</li>
        </ul>
        <GameButton
          name="Got it!"
          className="close-btn"
          onClick={onClose}
        />
      </div>
    </div>
  );
};

export default InstructionsOverlay;
