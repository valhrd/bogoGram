import React from 'react';
import './ModalRelated.css'

const OptionsModal = ({ isOpen, onYes, onNo , content }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {content}
        <div className="choiceButtons" style={{display: "flex", justifyContent: "center"}}>
            <button
                className="yesButton"
                onClick={onYes}
            >
                Yes
            </button>
            <button
                className="noButton"
                onClick={onNo}
            >
                No
            </button>
        </div>
      </div>
    </div>
  );
}

export default OptionsModal;