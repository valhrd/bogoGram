const extractWordsFromLine = (line) => {
    // Convert the array of characters into a string

    // Function now returns a word array instead of a string
    const words = [];
    let word = '';

    // If the current cell is not empty we append it to the string, once we meet an empty cell, depending on the
    // length of the word, we add it to the list of words found along that row/column
    for (let i = 0; i < line.length; i++) {
        if (line[i] !== '') {
            word += line[i];
        } else {
            if (word.length >= 2) {
                words.push(word);
            }
            word = '';
        }
    }

    // For the final word in case the word touches the right or bottom edges of the board
    if (word.length >= 2) {
        words.push(word);
    }

    return words;
};

const mapToBoardRow = (string) => {
    return string.split("").map((char) => (char === " ") ? "" : char)
}

const testcases = ["THE QUICK BROWN FOX JUMPED OVER THE LAZY DOG",
                   "BOGOGRAM IS THE NUMBER ONE GAME IN THE PLANET",
                   "LICKING DOORKNOBS IS ILLEGAL ON OTHER PLANETS",
                   "MY MUSCLES MIGHT BE HUGE BUT MY HEART IS HUGER",
                   "OH NO IT IS THE DIVE ROCKET LAUNCHER TAKE ACTION IMMEDIATELY",
                   "AA AB AD AE AG AH AI AL AM AN AR AS AT AW AX AY",
                   "JA JO QI XI XU ZA ZO",
                   "I WILL NOT BE APART OF THIS SENTENCE SINCE IT HAS ONLY ONE LETTER",
                   "",
                   "I",
                   "A E I O U AEIOU",
                ]

const answers = [['THE','QUICK','BROWN','FOX','JUMPED','OVER','THE','LAZY','DOG'],
                 ['BOGOGRAM','IS','THE','NUMBER','ONE','GAME','IN','THE','PLANET'],
                 ['LICKING','DOORKNOBS','IS','ILLEGAL','ON','OTHER','PLANETS'],
                 ['MY','MUSCLES','MIGHT','BE','HUGE','BUT','MY','HEART','IS','HUGER'],
                 ['OH','NO','IT','IS','THE','DIVE','ROCKET','LAUNCHER','TAKE','ACTION','IMMEDIATELY'],
                 ['AA','AB','AD','AE','AG','AH','AI','AL','AM','AN','AR','AS','AT','AW','AX','AY'],
                 ['JA','JO','QI','XI','XU','ZA','ZO'],
                 ['WILL','NOT','BE','APART','OF','THIS','SENTENCE','SINCE','IT','HAS','ONLY','ONE','LETTER'],
                 [],
                 [],
                 ['AEIOU'],
                ]

for (let i = 0; i < answers.length; i++) {
    if (JSON.stringify(extractWordsFromLine(mapToBoardRow(testcases[i]))) === JSON.stringify(answers[i])) {
        console.log(`Test Case ${i}: PASS`);
    } else {
        console.log(`Test Case ${i}: FAIL`);
    }
}

