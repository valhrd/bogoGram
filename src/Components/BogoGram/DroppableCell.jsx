import { useDrop } from 'react-dnd';

const DroppableCell = ({ row, col, cell, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'LETTER',
    drop: (item) => onDrop(item, row, col),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        backgroundColor: isOver ? 'white' : 'transparent',
        border: '1px solid white',
        minHeight: '30px',
        minWidth: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {cell}
    </div>
  );
};

export default DroppableCell;
