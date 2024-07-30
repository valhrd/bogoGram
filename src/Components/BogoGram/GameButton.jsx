import React, { useState } from 'react';

function GameButton({ name, desc, className, onClick, disabled, additionalStyle }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <span>
            <button
                className={`gameButton ${className}`}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={disabled}

                // Remove if it breaks too much shit
                style={additionalStyle}
            >
                {name}
            </button>
            <div className={`${desc ? "description" : ""} ${isHovered ? "show" : ""}`}>{desc}</div>
        </span>
    );
}

export default GameButton;