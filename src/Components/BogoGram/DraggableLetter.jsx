import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './Constants';

const DraggableLetter = ({ tile }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TILE,
    item: { tile },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="tile"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {tile.letter}
    </div>
  );
};

export default DraggableLetter;