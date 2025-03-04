/*
TODOS:
    - ✅ Logic for revealing empty cells when cliked one of it.
    - ✅ Empty cell generation logic, that is, a cell can be empty only if it's moore neighbour is a hint number or an empty cell.
    - ✅ Hint numbers are not accurate.
    - ✅ User getLegalMooreNeighbours method.
    - ✅ Game end and won logic.
    - Modal instead of alert for showing game won or lost.
    - Coloring each number.
    - Timer when starting.
    - Smily face for game restart.
    - Step recorder (Optional)
*/



const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Game states
let boardArray = [];
let hintNumbersCount = 0;
let revealedHintsNumbers = 0;
let playing = true;

// Configurations
const BOMB_PROBABILITY = .3;
const EMPTY_CELL_PROBABILITY = .5;

const CELL_COUNT = 8;
const CELL_SIZE = canvas.width / CELL_COUNT; // height & width of a cell

// cells states
const EMPTY = 0;
const BOMB = -1;

const TEXT_COLOR = "white";
const RECT_COLOR = "#4c545c";
const RECT_COLOR_SHOW = "#83898f";
const RECT_STROKE_COLOR = "black";

// Shadow
const SHADOW_COLOR = "lightblue";
const SHADOW_OFFSET_X = -10;
const SHADOW_OFFSET_Y = -10;

class Cell {
    value = null;
    flagged = false;
    show = false;
    constructor(value) {
        this.value = value;
    }

}


let boardArray = [];

const isLegalCoord = (x, y) => {
    return x >= 0 && y >= 0 && x < CELL_COUNT && y < CELL_COUNT
}

const getLegalMooreNeighbours = (i, j) => {
    // Returns moore neighbours' coordinats
    let neighbours = [];
    for (let m = -1; m <= 1; m++) {
        for (let n = -1; n <= 1; n++) {
            let [x, y] = [i + m, j + n];
            if ((x === i && y === j) || !isLegalCoord(x, y)) continue;
            neighbours.push([x, y]);
        }
    }
    return neighbours;
}

// Generating bomb
for (let i = 0; i < CELL_COUNT; i++) {
    let inner = [];
    for (let j = 0; j < CELL_COUNT; j++) {
        let cellValue = Math.random() < BOMB_PROBABILITY ? BOMB : EMPTY;
        let cell = new Cell(cellValue);
        inner.push(cell);
    }
    boardArray.push(inner);
}


// populating hint numbers and empty cells
for (let i = 0; i < CELL_COUNT; i++) {
    for (let j = 0; j < CELL_COUNT; j++) {
        // Getting moore neighbours only if rand num is < .5
        if (Math.random() < EMPTY_CELL_PROBABILITY || boardArray[i][j].value == BOMB) {

            const mooreNeighs = getLegalMooreNeighbours(i, j);
            const isLegalEmtpyLegal = mooreNeighs.every(([x, y]) => boardArray[x][y].value !== BOMB);
            if (isLegalEmtpyLegal) continue;

        }

        let neighBombCount = 0;
        for (let m = -1; m <= 1; m++) {
            for (let n = -1; n <= 1; n++) {
                let x = i + m, y = j + n;
                if ((x >= 0 && y >= 0) && (x < CELL_COUNT && y < CELL_COUNT)) {
                    neighBombCount += boardArray[x][y].value == BOMB ? 1 : 0;
                }
            }
        }
        boardArray[i][j].value = neighBombCount;
    }
}

const revealEmptyCells = (x, y) => {
    // Using dfs for cells
    boardArray[x][y].show = true;
    let q = [[x, y]];
    while (q.length > 0) {
        let [x, y] = q.pop();

        const neighs = getLegalMooreNeighbours(x, y);

        for (let [currX, currY] of neighs) {
            let cell = boardArray[currX][currY];
            if (cell.value >= EMPTY && !cell.show && !cell.flagged) {
                boardArray[currX][currY].show = true;
                if (cell.value === EMPTY)
                    q.push([currX, currY]);
            }
        }

    }
}

const handleClickEvents = (e) => {
    e.preventDefault();
    let clickedX = e.offsetX;
    let clickedY = e.offsetY;

    let cellY = Math.floor((clickedX / CELL_SIZE) % CELL_COUNT);
    let cellX = Math.floor((clickedY / CELL_SIZE) % CELL_COUNT);

    let cell = boardArray[cellX][cellY];

    if (cell.show) return;
    if (e.type === "click") {
        if (cell.flagged) return;
        if (cell.value > 0) {
            boardArray[cellX][cellY].show = true;
        }
        // Player lost here
        else if (cell.value === BOMB) {
            playing = false;
        } else if (cell.value === EMPTY) {
            revealEmptyCells(cellX, cellY);
        }
        renderBoard();
    }
    else if (e.type === "contextmenu") {
        boardArray[cellX][cellY].flagged = !boardArray[cellX][cellY].flagged;
        renderBoard();
    }

}

canvas.addEventListener("contextmenu", handleClickEvents);
canvas.addEventListener("click", handleClickEvents);


// Images
const mineImg = document.getElementById("img-mine");
const flagImg = document.getElementById("img-flag");

ctx.strokeStyle = RECT_STROKE_COLOR;
ctx.font = "25px arial";

let renderBoard = () => {

    let x = 0;
    let y = 0;

    for (let i = 0; i < CELL_COUNT; i++) {
        x = 0;
        for (let j = 0; j < CELL_COUNT; j++) {

            ctx.fillStyle = RECT_COLOR;

            let x1 = x, y1 = y, x2 = x + CELL_SIZE, y2 = y + CELL_SIZE;

            ctx.strokeRect(x1, y1, x2, y2);
            ctx.fillRect(x1, y1, x2, y2);

            let cell = boardArray[i][j];
            if (!playing) {
                if (cell.value === BOMB)
                    cell.show = true;
            }
            if (cell.flagged) {
                ctx.drawImage(flagImg, x, y, CELL_SIZE * .9, CELL_SIZE * .9);
            } else if (cell.show && cell.value === EMPTY) {
                ctx.fillStyle = RECT_COLOR_SHOW;
                ctx.fillRect(x1, y1, x2, y2);

            } else if (cell.show && cell.value == BOMB) {
                ctx.fillStyle = RECT_COLOR_SHOW;
                ctx.fillRect(x1, y1, x2, y2);
                ctx.drawImage(mineImg, x, y, CELL_SIZE * .9, CELL_SIZE * .9);
            }
            else if (cell.show) {

                ctx.fillStyle = RECT_COLOR_SHOW;
                ctx.fillRect(x1, y1, x2, y2);

                ctx.fillStyle = TEXT_COLOR;
                let xc = (x2 + x1) / 2, yc = (y2 + y1) / 2;
                ctx.fillText(cell.value, xc, yc);
            }

            x += CELL_SIZE;
        }
        y += CELL_SIZE;
    }
}

renderBoard();
