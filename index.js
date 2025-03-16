/*
TODOS:
    - ✅ Logic for revealing empty cells when cliked one of it.
    - ✅ Empty cell generation logic, that is, a cell can be empty only if it's moore neighbour is a hint number or an empty cell.
    - ✅ Hint numbers are not accurate.
    - ✅ User getLegalMooreNeighbours method.
    - ✅ Game end and won logic.
    - ✅ Adding wasm 😀

    - Modal instead of alert for showing game won or lost.
    - Coloring each number.
    - Timer when starting.
    - Smily face for game restart.
    - Step recorder (Optional)
*/

const canvas = document.getElementById("canvas");
const gameStatsWrapper = document.querySelector(".game-stats");
const ctx = canvas.getContext("2d");

// loading sfxs
// Sound Effect by https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=6761"
const boomAud = new Audio("/assets/audios/boom.mp3");
const clickAud = new Audio("./assets/audios/click.mp3");
const wonAud = new Audio("./assets/audios/won.mp3");
clickAud.volume = .5;
boomAud.volume = .5;
wonAud.volume = .5;

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

function gameLoader() {

    // a cell's data will come int this memory buffer
    let cell_buffer = null;
    cell_buffer = Module._malloc(3 * Int32Array.BYTES_PER_ELEMENT);
    // wraping all the wasm functions
    const wasm_free_all = Module.cwrap("free_all", null);
    const wasm_get_cell_at = Module.cwrap("get_cell_at", num_t, [num_t, num_t, num_t])
    const wasm_change_cell_values = Module.cwrap("change_cell_values", null, [num_t, num_t, num_t, num_t])

    const wasm_initialize_game_states = Module.cwrap("initialize_game_states", num_t, [num_t], [num_t]);
    const wasm_set_bomb_prob = Module.cwrap("set_bomb_probability", null, [num_t]);
    const wasm_set_empty_cell_prob = Module.cwrap("set_empty_cell_probability", null, [num_t]);
    const wasm_set_cell_count = Module.cwrap("set_cell_count", null, [num_t]);
    const wasm_is_playing = Module.cwrap("is_playing", num_t);
    const wasm_has_won = Module.cwrap("has_won", num_t);

    // Wrapper around wasm funcs
    const get_cell_at = (x, y) => {
        wasm_get_cell_at(x, y, cell_buffer);
        const array = new Int32Array(Module.HEAP32.buffer, cell_buffer, 3);
        return new Cell(array[0], array[1], array[2]);
    }

    window.onbeforeunload = function (e) {
        console.log("Freeing your resources like a good programmer");
        Module._free(cell_buffer);
        wasm_free_all();
    }

    // Configurations
    const HACK = true;
    const BOMB_PROBABILITY = .255;
    const EMPTY_CELL_PROBABILITY = .5;
    const REVEAL_CELLS_AT_INIT = true;

    const CELL_COUNT = 10;
    const CELL_SIZE = canvas.width / CELL_COUNT; // height & width of a cell

    // cells states
    const EMPTY = 0;
    const BOMB = -1;

    const TEXT_COLOR = "white";
    const RECT_COLOR = "#4c545c";
    const RECT_COLOR_SHOW = "#83898f";
    const RECT_STROKE_COLOR = "black";


    // Initializing game states in wasm
    wasm_set_cell_count(CELL_COUNT);
    wasm_set_bomb_prob(BOMB_PROBABILITY);
    wasm_set_empty_cell_prob(EMPTY_CELL_PROBABILITY);
    const is_initialized = wasm_initialize_game_states(REVEAL_CELLS_AT_INIT);

    console.log("INITIALIZED: ", is_initialized);


    const handleClickEvents = (e) => {
        e.preventDefault();
        let clickedX = e.offsetX;
        let clickedY = e.offsetY;

        let cellY = Math.floor((clickedX / CELL_SIZE) % CELL_COUNT);
        let cellX = Math.floor((clickedY / CELL_SIZE) % CELL_COUNT);

        // let cell = boardArray[cellX][cellY];
        let cell = get_cell_at(cellX, cellY);

        if (cell.show || !wasm_is_playing()) return;
        clickAud.currentTime = 0;
        if (cell.value !== BOMB)
            clickAud.play();
        if (e.type === "click") {
            if (cell.flagged) return;
            // boardArray[cellX][cellY].show = true;
            // playing = false;
            wasm_change_cell_values(cellX, cellY, cell.flagged, 1);

            renderBoard();
        }
        else if (e.type === "contextmenu") {
            // boardArray[cellX][cellY].flagged = !boardArray[cellX][cellY].flagged;
            wasm_change_cell_values(cellX, cellY, !cell.flagged, cell.show);
            renderBoard();
            clickAud.play();
        }

    }

    canvas.addEventListener("contextmenu", handleClickEvents);
    canvas.addEventListener("click", handleClickEvents);


    // Images
    const mineImg = document.getElementById("img-mine");
    const flagImg = document.getElementById("img-flag");

    ctx.strokeStyle = RECT_STROKE_COLOR;
    ctx.font = (CELL_COUNT + 6) + "px arial bold";

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

                if (!wasm_is_playing() && !wasm_has_won()) {
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
            console.log("YOU WON!!!")
            wonAud.currentTime = 0;
            wonAud.play();


        }
        else if (!wasm_is_playing() && !wasm_has_won()) {
            toggleSmily();
            boomAud.play();
            console.log("you lost!")
        }
    }

    // let boardArray = initializeGameStates();
    renderBoard();


    // UI handling
    gameStatsWrapper.onclick = (e) => {
        if (Array.from(e.target.classList).includes("smily")) {
            wasm_set_cell_count(CELL_COUNT);
            const is_inited = wasm_initialize_game_states(REVEAL_CELLS_AT_INIT);
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

if (Module.calledRun) {
    gameLoader();
} else
    Module.onRuntimeInitialized = gameLoader;