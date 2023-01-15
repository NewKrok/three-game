// TODO: handle enableDiagonalMovement
export default function IslandBuilderWorker() {
  const SEARCH_DIRECTIONS = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];

  const build = ({ grid }) => {
    const islands = [];
    const { col, row } = grid;
    let islandId = 0;
    let currentIsland = null;

    const nodes = {};
    for (let x = 0; x < col; x++)
      for (let z = 0; z < row; z++)
        nodes[`${x}-${z}`] = { x, z, isVisited: false };

    function buildStep(xStart, zStart) {
      const path = [];
      path.push([xStart, zStart]);
      while (path.length) {
        const [x, z] = path.at(-1);
        path.pop();
        const nodeKey = `${x}-${z}`;
        if (!grid.grid[z][x].value && !nodes[nodeKey].isVisited) {
          if (!currentIsland) {
            currentIsland = {
              id: islandId++,
              nodes: {},
            };
            islands.push(currentIsland);
          }

          currentIsland.nodes[nodeKey] = true;
          nodes[nodeKey].isVisited = true;

          SEARCH_DIRECTIONS.forEach((nextNodeDirection) => {
            const nextX = x + nextNodeDirection[0];
            const nextZ = z + nextNodeDirection[1];
            const nextNode = nodes[`${nextX}-${nextZ}`];
            if (nextNode && !nextNode.isVisited) path.push([nextX, nextZ]);
          });
        }
      }
    }

    for (let x = 0; x < col; x++) {
      for (let z = 0; z < row; z++) {
        if (!nodes[`${x}-${z}`].isVisited) {
          currentIsland = null;
          buildStep(x, z);
        }
      }
    }

    postMessage({ event: "buildResult", data: { islands } });
  };

  const map = {
    build: build,
  };

  onmessage = (e) => {
    map[e.data.event](e.data.data);
  };
}
