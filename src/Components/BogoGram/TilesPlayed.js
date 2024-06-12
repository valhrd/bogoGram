export default class TilesPlayed {
  constructor() {
    this.tileCoordinates = new Set();
    this.numberOfTilesPlayed = 0;
    this.grid = null;
  }

  // Method to add a tile
  addTile(row, col) {
    this.tileCoordinates.add(`${row},${col}`);
    this.numberOfTilesPlayed++;
    console.log(this.tileCoordinates);
    console.log(this.numberOfTilesPlayed);
  }

  // Method to remove a tile
  removeTile(row, col) {
    this.tileCoordinates.delete(`${row},${col}`);
    this.numberOfTilesPlayed--;
    console.log(this.tileCoordinates);
    console.log(this.numberOfTilesPlayed);
  }

  // Clear set
  clear() {
    this.tileCoordinates.clear();
    this.numberOfTilesPlayed = 0;
  }

  // Method to check if all tiles are connected
  areAllTilesConnected() {
    if (this.tileCoordinates.size === 0) {
      return true;
    }

    const visited = new Set();
    const directions = [0, 1, 0, -1, 0];

    const tiles = Array.from(this.tileCoordinates).map(coordinate => coordinate.split(',').map(Number));
    const queue = [tiles[0]];

    while (queue.length > 0) {
      const [row, col] = queue.shift();
      const key = `${row},${col}`;

      if (!visited.has(key)) {
        visited.add(key);

        for (let i = 0; i < 4; i++) {
          const newRow = row + directions[i];
          const newCol = col + directions[i + 1];
          const newKey = `${newRow},${newCol}`;
          if (this.tileCoordinates.has(newKey) && !visited.has(newKey)) {
            queue.push([newRow, newCol]);
          }
        }
      }
    }
    return visited.size === this.tileCoordinates.size;
  }
}