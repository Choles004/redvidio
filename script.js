const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level');
const gameMessage = document.getElementById('game-message');

const gridWidth = 10;
const gridHeight = 20;
const cellSize = 30;

canvas.width = gridWidth * cellSize;
canvas.height = gridHeight * cellSize;

let grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
let currentPiece = getNewPiece();
let nextPiece = getNewPiece();
let score = 0;
let level = 1;
let gameOver = false;
let pause = false;

function getNewPiece() {
    const shapes = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1, 1], [0, 1, 0]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]]
    ];
    const colors = [
        '#0FF', '#FF0', '#800', '#F60', '#00F', '#0F0', '#F00'
    ];
    const index = Math.floor(Math.random() * shapes.length);
    return { shape: shapes[index], color: colors[index], x: 3, y: 0 };
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x]) {
                ctx.fillStyle = grid[y][x];
                ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }
    drawPiece(currentPiece);
}

function drawPiece(piece) {
    ctx.fillStyle = piece.color;
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                ctx.fillRect((piece.x + x) * cellSize, (piece.y + y) * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }
}

function movePieceDown() {
    if (!isCollision(currentPiece, 1, 0)) {
        currentPiece.y++;
    } else {
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = getNewPiece();
        if (isCollision(currentPiece, 0, 0)) {
            gameOver = true;
            gameMessage.innerText = 'Game Over!';
        }
    }
}

function isCollision(piece, offsetY, offsetX) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + offsetX;
                const newY = piece.y + y + offsetY;
                if (newX < 0 || newX >= gridWidth || newY >= gridHeight || (newY >= 0 && grid[newY][newX])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                grid[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
            }
        }
    }
}

function clearLines() {
    for (let y = gridHeight - 1; y >= 0; y--) {
        if (grid[y].every(cell => cell !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array(gridWidth).fill(0));
            score += 100 * level;
            if (score >= 700 * level) {
                level++;
            }
            scoreDisplay.innerText = score;
            levelDisplay.innerText = level;
        }
    }
}

function rotatePiece() {
    const newShape = currentPiece.shape[0].map((_, index) =>
        currentPiece.shape.map(row => row[index]).reverse()
    );
    const originalShape = currentPiece.shape;
    currentPiece.shape = newShape;
    if (isCollision(currentPiece, 0, 0)) {
        currentPiece.shape = originalShape;
    }
}

document.getElementById('left-btn').addEventListener('click', () => {
    if (!isCollision(currentPiece, 0, -1)) {
        currentPiece.x--;
    }
});

document.getElementById('right-btn').addEventListener('click', () => {
    if (!isCollision(currentPiece, 0, 1)) {
        currentPiece.x++;
    }
});

document.getElementById('rotate-btn').addEventListener('click', rotatePiece);

document.getElementById('pause-btn').addEventListener('click', () => {
    pause = !pause;
    if (pause) {
        gameMessage.innerText = 'Pausa';
    } else {
        gameMessage.innerText = '';
        gameLoop();
    }
});

function gameLoop() {
    if (!gameOver && !pause) {
        movePieceDown();
        drawGrid();
        setTimeout(gameLoop, 1000);
    }
}

gameLoop();
