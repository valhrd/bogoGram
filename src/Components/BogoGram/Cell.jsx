class Cell {
    constructor() {
        this.character= "";
    }

    setChar(char) {
        this.character = char;
    }

    getChar() {
        return this.character;
    }

    clear() {
        this.character = "";
    }
}

export default Cell;