const rows = 16;
const cols = 16;
const cellSize = 40;
let grid;

let newMazeBtn = document.getElementById("newMaze");
newMazeBtn.addEventListener("click", newMaze);

let solveBtn = document.getElementById("solve");
solveBtn.addEventListener("click", solve);

// row x col grid of cells
function createGrid() {
    return Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            top: true, right: true, bottom: true, left: true // object describing maze cell
        }))
    );
}

// generate maze
function generateMaze(grid, startRow = 0, startCol = 0) {
    let visited = new Set();

    function visit(r, c) {
        visited.add(`${r},${c}`);
        let directions = [ 
            // dr, dc, current cell wall, adjacent cell wall
            [0, -1, "left", "right"],
            [0, 1, "right", "left"],
            [-1, 0, "top", "bottom"],
            [1, 0, "bottom", "top"]
        ];
        directions.sort(() => Math.random() - 0.5);

        for (let [dr, dc, wall, opposite] of directions) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!visited.has(`${nr},${nc}`)) {
                    grid[r][c][wall] = false;
                    grid[nr][nc][opposite] = false;
                    visit(nr, nc);
                }
            }
        }
    }

    visit(startRow, startCol);
}

function drawMaze(ctx, grid, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#e8eaed";
    ctx.lineWidth = 2;
    ctx.beginPath();

    grid.forEach((row, r) => {
        row.forEach((cell, c) => {
            let x = c * cellSize;
            let y = r * cellSize;

            if (cell.top) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
            if (cell.right) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
            if (cell.bottom) { ctx.moveTo(x + cellSize, y + cellSize); ctx.lineTo(x, y + cellSize); }
            if (cell.left) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x, y); }
        });
    });
    ctx.stroke();
}

function newMaze() {
    grid = createGrid();
    generateMaze(grid);
    let canvas = document.getElementById("mazeCanvas");
    let ctx = canvas.getContext("2d");
    drawMaze(ctx, grid, canvas);
}

function solve() {
    let canvas = document.getElementById("mazeCanvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMaze(ctx, grid, canvas);

    newMazeBtn.removeEventListener("click", newMaze);
    solveBtn.removeEventListener("click", solve);

    let algo = document.getElementById("algorithm");

    if (algo.value == "dfs") {
        dfs();
    } else if (algo.value == "bfs") {
        bfs();
    }

}

function bfs() {
    let queue = [[0, 0]];
    let visited = new Set(["0,0"]);
    let parent = {};

    let canvas = document.getElementById("mazeCanvas");
    let ctx = canvas.getContext("2d");

    ctx.strokeStyle = "#ec407e";
    ctx.lineWidth = 5;
    ctx.lineCap = "square";
    ctx.beginPath();

    // start at the first cell center
    let [r0, c0] = queue[0];
    ctx.moveTo(c0 * cellSize + cellSize / 2, r0 * cellSize + cellSize / 2);

    function bfsStep() {
        if (queue.length === 0) return; // no path (shouldn’t happen)

        let [r, c] = queue.shift();

        let x = c * cellSize + cellSize / 2;
        let y = r * cellSize + cellSize / 2;

        let cell = grid[r][c];
        let directions = [
            [-1, 0, "top"], [1, 0, "bottom"],
            [0, -1, "left"], [0, 1, "right"]
        ];

        // check adjacency
        if (Math.abs(r0 - r) + Math.abs(c0 - c) === 1) {
            ctx.lineTo(x, y);
        } else {
            for (let [dr, dc, wall] of directions) {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (!cell[wall] && visited.has(`${nr},${nc}`)) {
                        ctx.moveTo(nc * cellSize + cellSize / 2, nr * cellSize + cellSize / 2);
                        ctx.lineTo(x, y);
                    }
                }
            }
        }

        ctx.stroke();

        // update previous cell
        r0 = r;
        c0 = c;

        if (r === rows - 1 && c === cols - 1) {
            let path = [];
            let cur = [r, c];
            while (cur) {
                path.push(cur);
                cur = parent[`${cur[0]},${cur[1]}`];
            }
            path.reverse();
            if (path) animateContinuousPath(path);
            return;
        }

        for (let [dr, dc, wall] of directions) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!cell[wall] && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    parent[`${nr},${nc}`] = [r, c];
                    queue.push([nr, nc]);
                }
            }
        }

        setTimeout(bfsStep, 100);
    }

    bfsStep();
}


function dfs() {
    let stack = [[0, 0]];
    let visited = new Set(["0,0"]);
    let parent = {};
    let path = null;

    let canvas = document.getElementById("mazeCanvas");
    let ctx = canvas.getContext("2d");

    ctx.strokeStyle = "#ec407e";
    ctx.lineWidth = 5;
    ctx.lineCap = "square";
    ctx.beginPath();

    // start at the first cell center
    let [r0, c0] = stack[stack.length - 1];
    ctx.moveTo(c0 * cellSize + cellSize / 2, r0 * cellSize + cellSize / 2);

    function dfsStep() {
        if (stack.length <= 0) return; // no path (shouldn’t happen)

        let [r, c] = stack.pop();

        let x = c * cellSize + cellSize / 2;
        let y = r * cellSize + cellSize / 2;

        let cell = grid[r][c];
        let directions = [
            [-1, 0, "top"], [1, 0, "bottom"],
            [0, -1, "left"], [0, 1, "right"]
        ];
        directions.sort(() => Math.random() - 0.5);

        // check adjacency
        if (Math.abs(r0 - r) + Math.abs(c0 - c) === 1) {
            ctx.lineTo(x, y);
        } else {
            for (let [dr, dc, wall] of directions) {
                let nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    if (!cell[wall] && visited.has(`${nr},${nc}`)) {
                        ctx.moveTo(nc * cellSize + cellSize / 2, nr * cellSize + cellSize / 2);
                        ctx.lineTo(x, y);
                    }
                }
            }
        }

        ctx.stroke();

        // update previous cell
        r0 = r;
        c0 = c;

        if (r === rows - 1 && c === cols - 1) {
            path = [];
            let cur = [r, c];
            while (cur) {
                path.push(cur);
                cur = parent[`${cur[0]},${cur[1]}`];
            }
            path.reverse();
            if (path) animateContinuousPath(path);
            return;
        }

        for (let [dr, dc, wall] of directions) {
            let nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (!cell[wall] && !visited.has(`${nr},${nc}`)) {
                    visited.add(`${nr},${nc}`);
                    parent[`${nr},${nc}`] = [r, c];
                    stack.push([nr, nc]);
                }
            }
        }

        setTimeout(dfsStep, 100);
    }

    dfsStep();
}

function animateContinuousPath(path) {
    let canvas = document.getElementById("mazeCanvas");
    let ctx = canvas.getContext("2d");

    let i = 0;
    let t = 0;

    function step() {
        if (i >= path.length - 1) return;

        let [r1, c1] = path[i];
        let [r2, c2] = path[i + 1];

        let x1 = c1 * cellSize + cellSize / 2;
        let y1 = r1 * cellSize + cellSize / 2;
        let x2 = c2 * cellSize + cellSize / 2;
        let y2 = r2 * cellSize + cellSize / 2;

        let dx = x2 - x1;
        let dy = y2 - y1;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let steps = Math.max(1, Math.floor(dist / 15));

        if (t <= steps) {
            let x = x1 + (dx * t) / steps;
            let y = y1 + (dy * t) / steps;

            ctx.strokeStyle = "#aac7ff";
            ctx.lineWidth = 10;
            ctx.lineCap = "square";
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x, y);
            ctx.stroke();

            t++;
        } else {
            i++;
            t = 0;
        }

        requestAnimationFrame(step);
    }

    step();

    newMazeBtn.addEventListener("click", newMaze);
    solveBtn.addEventListener("click", solve);
}

// generate first maze on load
newMaze();