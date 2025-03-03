
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Configurations
const CELL_COUNT = 8;
const CELL_SIZE = canvas.width / CELL_COUNT; // height & width of a cell

const BOMB = -1;
const EMPTY = 0;

const TEXT_COLOR = "white";
const RECT_COLOR = "#4c545c";
const RECT_STROKE_COLOR = "black";

let boardArrary = [];


const handleClickEvents = (e) => {
    e.preventDefault();
    let clickedX = e.offsetX;
    let clickedY = e.offsetY;

    let cellY = (clickedY / CELL_SIZE) % CELL_COUNT;
    let cellX = (clickedX / CELL_SIZE) % CELL_COUNT;

    if (e.type === "click") {

    }
    else if (e.type === "contextmenu") {
    }

}

canvas.addEventListener("contextmenu", handleClickEvents);
canvas.addEventListener("click", handleClickEvents);


// Images
const mineImg = document.getElementById("img-mine");
const flagImg = document.getElementById("img-flag");

// Generating bomb
for (let i = 0; i < CELL_COUNT; i++) {
    let inner = [];
    for (let j = 0; j < CELL_COUNT; j++) {
        let cellValue = Math.random() < .5 ? BOMB : EMPTY;
        inner.push(cellValue);
    }
    boardArrary.push(inner);
}

// Writing counts
for (let i = 0; i < CELL_COUNT; i++) {
    for (let j = 0; j < CELL_COUNT; j++) {
        // Getting moore neighbours only if rand num is < .5
        if (Math.random() < .5 || boardArrary[i][j] == BOMB) {
            continue;
        }

        let neighBombCount = 0;
        for (let m = -1; m <= 1; m++) {
            for (let n = -1; n <= 1; n++) {
                let x = i + m, y = j + n;
                if ((x >= 0 && y >= 0) && (x < CELL_COUNT && y < CELL_COUNT)) {
                    neighBombCount += boardArrary[x][y] == BOMB ? 1 : 0;
                }
            }
        }
        boardArrary[i][j] = neighBombCount;
    }
}

let x = 0;
let y = 0;


ctx.strokeStyle = RECT_STROKE_COLOR;
ctx.font = "25px arial";

for (let i = 0; i < CELL_COUNT; i++) {
    x = 0;
    for (let j = 0; j < CELL_COUNT; j++) {
        ctx.beginPath();
        ctx.fillStyle = RECT_COLOR;

        let x1 = x, y1 = y, x2 = x + CELL_SIZE, y2 = y + CELL_SIZE;

        ctx.strokeRect(x1, y1, x2, y2);
        ctx.fillRect(x1, y1, x2, y2);

        ctx.fillStyle = TEXT_COLOR;
        let cellValue = boardArrary[i][j];
        if (cellValue == BOMB) {
            ctx.drawImage(mineImg, x, y, CELL_SIZE * .9, CELL_SIZE * .9);
        } else if (cellValue > 0) {
            let xc = (x2 + x1) / 2, yc = (y2 + y1) / 2;
            ctx.fillText(cellValue, xc, yc);
        }
        x += CELL_SIZE;
    }
    y += CELL_SIZE;
}

