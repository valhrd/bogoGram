import React, { useState } from 'react';

function GameButton({ name, desc, className, onClick, disabled }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <span>
            <button
                className={`gameButton ${className}`}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={disabled}
            >
                {name}
            </button>
            <div className={`${desc ? "description" : ""} ${isHovered ? "show" : ""}`}>{desc}</div>
        </span>
    );
}

export default GameButton;