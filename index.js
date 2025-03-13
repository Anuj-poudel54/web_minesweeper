/*
TODOS:
    - ✅ Logic for revealing empty cells when cliked one of it.
    - ✅ Empty cell generation logic, that is, a cell can be empty only if it's moore neighbour is a hint number or an empty cell.
    - ✅ Hint numbers are not accurate.
    - ✅ User getLegalMooreNeighbours method.
    - ✅ Game end and won logic.
    - Adding wasm 😀
    - Modal instead of alert for showing game won or lost.
    - Coloring each number.
    - Timer when starting.
    - Smily face for game restart.
    - Step recorder (Optional)
*/

/*
create a function in c that gives you cell value by index.
     get_cell_at(x,y, cell_buffer) -> arr[value,flagged,show];

also function that changes the value of the cell array.
    change_cell_values( x, y, show, flagged);

FLOW:
 call set_cell_count(int) and set number of cells to be initialized
 to render iterate and call get_cell_at(...)
*/

const canvas = document.getElementById("canvas");
const gameStatsWrapper = document.querySelector(".game-stats");
const ctx = canvas.getContext("2d");

class Cell {
    value = null;
    constructor(value, flagged, show) {
        this.value = value;
        this.flagged = flagged;
        this.show = show;

    }

}

// WASAM-y-thingy here
const num_t = 'number';

// console.log(Module.calledRun);
Module.onRuntimeInitialized = function () {

    // a cell's data will come int this buffer
    let cell_buffer = null;
    cell_buffer = Module._malloc(3 * Int32Array.BYTES_PER_ELEMENT);

    // wraping all the wasm functions
    const wasm_get_cell_at = Module.cwrap("get_cell_at", num_t, [num_t, num_t, num_t])
    const wasm_change_cell_values = Module.cwrap("change_cell_values", null, [num_t, num_t, num_t, num_t])

    const wasm_initialize_game_states = Module.cwrap("initialize_game_states", num_t);
    const wasm_set_cell_count = Module.cwrap("set_cell_count", null, [num_t]);
    const wasm_reveal_empty_cells = Module.cwrap("reveal_empty_cells", null, [num_t, num_t]);
    const wasm_is_playing = Module.cwrap("is_playing", num_t);
    const wasm_has_won = Module.cwrap("has_won", num_t);
    const wasm_hint_number_count = Module.cwrap("get_hint_number_count", num_t);

    // Wrapper around wasm funcs
    const get_cell_at = (x, y) => {
        wasm_get_cell_at(x, y, cell_buffer);
        const array = new Int32Array(Module.HEAP32.buffer, cell_buffer, 3);
        return new Cell(array[0], array[1], array[2]);
    }

    // Game states
    let hintNumbersCount = 0;
    let revealedHintsNumbers = 0;

    // Configurations
    const HACK = false;
    const BOMB_PROBABILITY = .3;
    const EMPTY_CELL_PROBABILITY = .7;

    const CELL_COUNT = 8;
    const CELL_SIZE = canvas.width / CELL_COUNT; // height & width of a cell

    // cells states
    const EMPTY = 0;
    const BOMB = -1;

    const TEXT_COLOR = "white";
    const RECT_COLOR = "#4c545c";
    const RECT_COLOR_SHOW = "#83898f";
    const RECT_STROKE_COLOR = "black";


    // Initializing in wasm
    wasm_set_cell_count(CELL_COUNT);
    const is_initialized = wasm_initialize_game_states();
    console.log("INITIALIZED: ", is_initialized);


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

    const initializeGameStates = () => {

        won = false;
        playing = true;
        const boardArray = [];
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
                const cell = boardArray[i][j];
                if (cell.value === BOMB) continue;

                const neighs = getLegalMooreNeighbours(i, j);
                const canbeEmpty = neighs.every(([x, y]) => boardArray[x][y].value !== BOMB);
                if (canbeEmpty && Math.random() < EMPTY_CELL_PROBABILITY) continue;

                // calculating bomb counts
                const totalBombAround = neighs.reduce((a, [x, y]) => a + (boardArray[x][y].value === BOMB), 0);
                boardArray[i][j].value = totalBombAround;
                hintNumbersCount++;

            }
        }
        return boardArray;
    }

    const revealEmptyCells = (x, y) => {
        // Using dfs for searching empty cells
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

        // let cell = boardArray[cellX][cellY];
        let cell = get_cell_at(cellX, cellY);

        if (cell.show || !wasm_is_playing()) return;
        if (e.type === "click") {
            if (cell.flagged) return;
            if (cell.value > 0) {
                // boardArray[cellX][cellY].show = true;
                wasm_change_cell_values(cellX, cellY, cell.flagged, 1);
                revealedHintsNumbers++;
                let won = revealedHintsNumbers === wasm_hint_number_count();
                console.log(won);
            }
            // Player lost here
            else if (cell.value === BOMB) {
                // playing = false;
            } else if (cell.value === EMPTY) {
                wasm_reveal_empty_cells(cellX, cellY);
                // revealEmptyCells(cellX, cellY);
            }
            renderBoard();
        }
        else if (e.type === "contextmenu") {
            // boardArray[cellX][cellY].flagged = !boardArray[cellX][cellY].flagged;
            wasm_change_cell_values(cellX, cellY, !cell.flagged, cell.show);
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

    const renderBoard = () => {
        // x, y position of a cell in canvas while drawing
        let x_pos = 0;
        let y_pos = 0;

        for (let i = 0; i < CELL_COUNT; i++) {
            x_pos = 0;
            for (let j = 0; j < CELL_COUNT; j++) {

                ctx.fillStyle = RECT_COLOR;

                let x1 = x_pos, y1 = y_pos;
                let x2 = x_pos + CELL_SIZE, y2 = y_pos + CELL_SIZE;

                ctx.strokeRect(x1, y1, x2, y2);
                ctx.fillRect(x1, y1, x2, y2);

                // let cell = boardArray[i][j];
                let cell = get_cell_at(i, j);

                if (!wasm_is_playing()) {
                    if (cell.value === BOMB) {
                        cell.show = true;
                    }
                }
                if (cell.value === BOMB && HACK) {
                    ctx.fillStyle = "red";
                    ctx.fillRect(x1, y1, x2, y2);
                }
                if (cell.flagged) {
                    ctx.drawImage(flagImg, x_pos, y_pos, CELL_SIZE * .9, CELL_SIZE * .9);
                } else if (cell.show && cell.value === EMPTY) {
                    ctx.fillStyle = RECT_COLOR_SHOW;
                    ctx.fillRect(x1, y1, x2, y2);

                } else if (cell.show && cell.value == BOMB) {
                    ctx.fillStyle = RECT_COLOR_SHOW;
                    ctx.fillRect(x1, y1, x2, y2);
                    ctx.drawImage(mineImg, x_pos, y_pos, CELL_SIZE * .9, CELL_SIZE * .9);
                }
                else if (cell.show) {

                    ctx.fillStyle = RECT_COLOR_SHOW;
                    ctx.fillRect(x1, y1, x2, y2);

                    ctx.fillStyle = TEXT_COLOR;
                    let xc = (x2 + x1) / 2, yc = (y2 + y1) / 2;
                    ctx.fillText(cell.value, xc, yc);
                }

                x_pos += CELL_SIZE;
            }
            y_pos += CELL_SIZE;
        }

        if (wasm_has_won()) {
            alert("You won :)");
        }
        else if (!wasm_is_playing() && !wasm_has_won()) {
            toggleSmily();
        }
    }

    // let boardArray = initializeGameStates();
    renderBoard();


    // UI handling
    gameStatsWrapper.onclick = (e) => {
        if (Array.from(e.target.classList).includes("smily")) {
            wasm_set_cell_count(CELL_COUNT);
            const is_inited = wasm_initialize_game_states();
            console.log(is_inited);
            // boardArray = initializeGameStates();
            renderBoard();
            const allSmily = gameStatsWrapper.querySelectorAll(".smily");
            allSmily[0].hidden = false;
            allSmily[1].hidden = true;
        }

    }
    const toggleSmily = () => {
        gameStatsWrapper.querySelectorAll(".smily").forEach(img => {
            img.hidden = !img.hidden;
        })
    }
}