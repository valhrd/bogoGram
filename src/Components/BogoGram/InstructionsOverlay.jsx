import React from 'react';
import GameButton from './GameButton';

const InstructionsOverlay = ({ onClose }) => {
  return (
    <div className="overlay">
      <div className="overlay-content">
        <h2>How To Play</h2>
        <ul>
          <li>First <span className="button-name">Sign In</span></li>
          <li>Press <span className="button-name">Create Game</span> to create a new game</li>
          <li>If you want to play with friends, <span>tell them the gameID!</span> If someone's given you their gameID, paste it on the box and press <span className="button-name">Join Game</span></li>
          <li>Press <span className="button-name">Start Game</span> to distribute the tiles (All players will get the same number of tiles)</li>
          <li>Form valid words in a grid in horizontal and vertical directions by <span>dragging and dropping them</span>  from the rack to the grid</li>
          <li>Finished all the tiles on your rack? Press <span className="button-name">PEEL</span> and everyone gets a new tile!</li>
          <li>Can't find a way to play a tile? No problem! Just drag it over to the DUMP rack and press <span className="button-name">DUMP</span> (You may get a few tiles back in return though...)</li>
          <li>Still stuck? Use <span className="button-name">HINT</span> to get a hint for what to do with your tiles (Use the hints carefully though, because you only have 10)</li>
          <li>Need other ideas? Use <span className="button-name">SHUFFLE</span> to shuffle the tiles on your tile rack. Maybe you'll get another idea</li>
          <li>Want to tear down and rebuild your grid? Use <span className="button-name">REBUILD</span> to recall all tiles from the grid to your rack</li>
          <li>Press <span className="button-name">BANANAS!</span> when you finish to check if you win.</li>
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
