import React from 'react';

function Tile({ letter, key, className, onClick, onDragOver, onDrop, onDragStart }) {
    const cursorStyle = letter ? 'grab' : 'auto';
    return (
        <div
            key={key}
            className={className}
            onClick={onClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            draggable={letter !== ""}
            style={{cursor : cursorStyle}}
        >
        {letter}
        </div>
    );
}

export default Tile;