import React from 'react';
import './ModalRelated.css'

const Modal = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="noButton modalCloseButton">X</button>
        <div>
          {content}
        </div>
      </div>
    </div>
  );
}

export default Modal;
