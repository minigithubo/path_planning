const Tool = { WALL: "WALL", ERASE: "ERASE", START: "START", GOAL: "GOAL" };
const initialState = {
  rows: 20,
  cols: 30,
  start: { row: 4, col: 4 },
  goal: { row: 15, col: 24 },
  walls: new Set(),
  path: [],
  visited: [],
  tool: Tool.WALL,
  allowDiagonal: false,
  status: "Place obstacles on the grid and run pathfinding.",
};
const state = { ...initialState };

function keyOf(row, col) {
  return `${row},${col}`;
}
function parseKey(key) {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}
function heuristic(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}
function neighbors(node, rows, cols, allowDiagonal) {
  const dirs = allowDiagonal
    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
    : [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const list = [];
  for (const [dr, dc] of dirs) {
    const nr = node.row + dr;
    const nc = node.col + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      list.push({ row: nr, col: nc, cost: dr !== 0 && dc !== 0 ? 1.414 : 1 });
    }
  }
  return list;
}
function runAStar() {
  const { rows, cols, start, goal, walls, allowDiagonal } = state;
  const startKey = keyOf(start.row, start.col);
  const goalKey = keyOf(goal.row, goal.col);
  const open = new Set([startKey]);
  const cameFrom = new Map();
  const gScore = new Map([[startKey, 0]]);
  const fScore = new Map([[startKey, heuristic(start, goal)]]);
  const visitedOrder = [];
  while (open.size) {
    let currentKey = null;
    let currentF = Infinity;
    for (const key of open) {
      const v = fScore.get(key) ?? Infinity;
      if (v < currentF) {
        currentF = v;
        currentKey = key;
      }
    }
    if (!currentKey) break;
    const current = parseKey(currentKey);
    visitedOrder.push(currentKey);
    if (currentKey === goalKey) {
      const path = [];
      let walk = currentKey;
      while (walk) {
        path.push(walk);
        walk = cameFrom.get(walk);
      }
      return { found: true, path: path.reverse(), visitedOrder };
    }
    open.delete(currentKey);
    for (const next of neighbors(current, rows, cols, allowDiagonal)) {
      const nextKey = keyOf(next.row, next.col);
      if (walls.has(nextKey)) continue;
      const tentative = (gScore.get(currentKey) ?? Infinity) + next.cost;
      if (tentative < (gScore.get(nextKey) ?? Infinity)) {
        cameFrom.set(nextKey, currentKey);
        gScore.set(nextKey, tentative);
        fScore.set(nextKey, tentative + heuristic(next, goal));
        open.add(nextKey);
      }
    }
  }
  return { found: false, path: [], visitedOrder };
}

function clearResultOnly() {
  state.path = [];
  state.visited = [];
}
function setActiveTool(tool) {
  state.tool = tool;
  render();
}
function resizeGrid(nextRows, nextCols) {
  state.rows = nextRows;
  state.cols = nextCols;
  const nextWalls = new Set();
  for (const key of state.walls) {
    const { row, col } = parseKey(key);
    if (row < nextRows && col < nextCols) nextWalls.add(key);
  }
  state.walls = nextWalls;
  state.start = {
    row: Math.min(state.start.row, nextRows - 1),
    col: Math.min(state.start.col, nextCols - 1),
  };
  state.goal = {
    row: Math.min(state.goal.row, nextRows - 1),
    col: Math.min(state.goal.col, nextCols - 1),
  };
  clearResultOnly();
  render();
}
function handleCellClick(row, col) {
  const key = keyOf(row, col);
  clearResultOnly();
  if (state.tool === Tool.START) {
    if (state.goal.row === row && state.goal.col === col) return;
    state.start = { row, col };
    state.walls.delete(key);
    render();
    return;
  }
  if (state.tool === Tool.GOAL) {
    if (state.start.row === row && state.start.col === col) return;
    state.goal = { row, col };
    state.walls.delete(key);
    render();
    return;
  }
  if (
    (state.start.row === row && state.start.col === col) ||
    (state.goal.row === row && state.goal.col === col)
  ) {
    return;
  }
  if (state.tool === Tool.WALL) state.walls.add(key);
  if (state.tool === Tool.ERASE) state.walls.delete(key);
  render();
}
function findPath() {
  const result = runAStar();
  state.path = result.path;
  state.visited = result.visitedOrder;
  state.status = result.found
    ? `Path found. Length: ${Math.max(0, result.path.length - 1)} cells`
    : "No path found. Try adjusting the obstacles.";
  render();
}
function resetAll() {
  state.rows = initialState.rows;
  state.cols = initialState.cols;
  state.start = { ...initialState.start };
  state.goal = { ...initialState.goal };
  state.walls = new Set();
  state.path = [];
  state.visited = [];
  state.tool = Tool.WALL;
  state.allowDiagonal = false;
  state.status = "Reset to the initial state.";
  render();
}

function btnClass(isActive) {
  return `button${isActive ? " active" : ""}`;
}

function render() {
  const root = document.getElementById("root");
  const pathSet = new Set(state.path);
  const visitedSet = new Set(state.visited);

  root.innerHTML = `
    <div class="app">
      <h1 class="title">Path Planning UI (A*)</h1>
      <p class="subtitle">Edit start, goal, and obstacles, then visualize the shortest path with A*.</p>
      <div class="panel">
        <div class="controls">
          <button id="tool-wall" class="${btnClass(state.tool === Tool.WALL)}">Draw Obstacles</button>
          <button id="tool-erase" class="${btnClass(state.tool === Tool.ERASE)}">Erase Obstacles</button>
          <button id="tool-start" class="${btnClass(state.tool === Tool.START)}">Move Start</button>
          <button id="tool-goal" class="${btnClass(state.tool === Tool.GOAL)}">Move Goal</button>
          <button id="run-path" class="button">Run Pathfinding</button>
          <button id="clear-path" class="button">Clear Path Display</button>
          <button id="reset-all" class="button">Reset All</button>
        </div>
        <div class="row">
          <span class="label">Rows</span>
          <input id="rows-range" class="range" type="range" min="10" max="40" value="${state.rows}" />
          <span>${state.rows}</span>
        </div>
        <div class="row">
          <span class="label">Cols</span>
          <input id="cols-range" class="range" type="range" min="10" max="60" value="${state.cols}" />
          <span>${state.cols}</span>
        </div>
        <div class="row">
          <label><input id="diag-toggle" type="checkbox" ${state.allowDiagonal ? "checked" : ""}/> Allow diagonal movement</label>
        </div>
        <div class="legend">
          <div class="legend-item"><span class="swatch" style="background:#16a34a"></span>Start</div>
          <div class="legend-item"><span class="swatch" style="background:#ef4444"></span>Goal</div>
          <div class="legend-item"><span class="swatch" style="background:#1e293b"></span>Obstacle</div>
          <div class="legend-item"><span class="swatch" style="background:#60a5fa"></span>Visited Node</div>
          <div class="legend-item"><span class="swatch" style="background:#f59e0b"></span>Final Path</div>
        </div>
        <div class="grid-wrap">
          <div id="grid" class="grid" style="grid-template-columns: repeat(${state.cols}, 24px);"></div>
        </div>
        <div class="status">${state.status}</div>
      </div>
    </div>
  `;

  document.getElementById("tool-wall").onclick = () => setActiveTool(Tool.WALL);
  document.getElementById("tool-erase").onclick = () => setActiveTool(Tool.ERASE);
  document.getElementById("tool-start").onclick = () => setActiveTool(Tool.START);
  document.getElementById("tool-goal").onclick = () => setActiveTool(Tool.GOAL);
  document.getElementById("run-path").onclick = findPath;
  document.getElementById("clear-path").onclick = () => {
    clearResultOnly();
    render();
  };
  document.getElementById("reset-all").onclick = resetAll;
  document.getElementById("rows-range").oninput = (e) =>
    resizeGrid(Number(e.target.value), state.cols);
  document.getElementById("cols-range").oninput = (e) =>
    resizeGrid(state.rows, Number(e.target.value));
  document.getElementById("diag-toggle").onchange = (e) => {
    state.allowDiagonal = Boolean(e.target.checked);
    clearResultOnly();
    render();
  };

  const grid = document.getElementById("grid");
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const key = keyOf(r, c);
      const btn = document.createElement("button");
      btn.className = "cell";
      if (state.start.row === r && state.start.col === c) btn.className += " start";
      else if (state.goal.row === r && state.goal.col === c) btn.className += " goal";
      else if (state.walls.has(key)) btn.className += " wall";
      else if (pathSet.has(key)) btn.className += " path";
      else if (visitedSet.has(key)) btn.className += " visited";
      btn.title = `(${r}, ${c})`;
      btn.onclick = () => handleCellClick(r, c);
      grid.appendChild(btn);
    }
  }
}

render();
