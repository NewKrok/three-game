import { Astar, Grid } from "fast-astar";

import IslandBuilderWorker from "@newkrok/three-game/src/js/newkrok/three-game/world/modules/astar/island-builder-worker.js";
import { WorldModuleId } from "@newkrok/three-game/src/js/newkrok/three-game/modules/module-enums.js";
import { getUniqueId } from "@newkrok/three-utils/src/js/newkrok/three-utils/token.js";

const create = ({ config: { useCache } }) => {
  let cache = [];
  let workers = [];

  const fn = IslandBuilderWorker.toString();
  const fnBody = fn.substring(fn.indexOf("{") + 1, fn.lastIndexOf("}"));
  const workerSourceURL = URL.createObjectURL(new Blob([fnBody]));

  const createMap = ({
    id = null,
    col = 0,
    row = 0,
    obstacles = [],
    enableDiagonalMovement = true,
  }) => {
    const islandBuilderWorker = new Worker(workerSourceURL);
    workers.push(islandBuilderWorker);

    const grid = new Grid({
      col,
      row,
    });
    obstacles.forEach((item) => grid.set(item, "value", 1));

    const map = new Astar(grid);
    const mapId = id ?? `Grid-${getUniqueId()}`;

    const clearCache = () => (cache[mapId] = {});

    // TODO: check and clear the content of the path too
    const removePositionInfoFromCache = (key) => {
      if (cache[mapId]?.[key]) cache[mapId][key] = null;
      if (cache[mapId])
        Object.keys(cache[mapId]).forEach((fromKey) =>
          Object.keys(cache[mapId][fromKey]).forEach((toKey) => {
            if (toKey === key) cache[mapId][fromKey][toKey] = null;
          })
        );
    };

    let islands = [];
    const buildIslands = (onComplete = null) => {
      islandBuilderWorker.postMessage({ event: "build", data: { grid } });
      islandBuilderWorker.onmessage = (e) => {
        if (e.data.event === "buildResult") {
          islands = e.data.data.islands;
          onComplete();
        }
      };
    };

    const addObstacles = (list) => {
      list.forEach((item) => {
        grid.set(item, "value", 1);
        if (useCache) removePositionInfoFromCache(item);
      });
      buildIslands();
    };

    const removeObstacles = (list) => {
      list.forEach((item) => {
        grid.set(item, "value", 0);
        if (useCache) removePositionInfoFromCache(item);
      });
      buildIslands();
    };

    const search = (from, to) => {
      if (useCache && cache[mapId]?.[from]?.[to]) return cache[mapId][from][to];
      let path;

      const fromNodeKey = `${from[0]}-${from[1]}`;
      const toNodeKey = `${to[0]}-${to[1]}`;
      const fromIsland = islands.find((island) => island.nodes[fromNodeKey]);
      if (fromIsland.nodes[toNodeKey]) {
        path = map.search(from, to, {
          rightAngle: !enableDiagonalMovement,
        });

        grid.grid.forEach((col) =>
          col.forEach((node) => {
            if (node.g !== 0) {
              node.g = 0;
              node.h = 0;
              node.f = 0;
              node.parent = null;
              node.type = null;
            }
          })
        );
      }

      const result = path || [from];

      map.openList = {};
      map.closeList = {};

      if (useCache) {
        cache[mapId] = cache[mapId] || {};

        cache[mapId][from] = cache[mapId][from] || {};
        cache[mapId][from][to] = result;

        cache[mapId][to] = cache[mapId][to] || {};
        cache[mapId][to][from] = [...result].reverse();
      }
      return result;
    };

    return new Promise((resolve) => {
      buildIslands(() => {
        resolve({
          map,
          clearCache,
          addObstacles,
          removeObstacles,
          search,
        });
      });
    });
  };

  const dispose = () => {
    cache = null;
    workers.forEach((worker) => worker.terminate());
    workers = null;
  };

  return {
    createMap,
    dispose,
  };
};

export const astarModule = {
  id: WorldModuleId.ASTAR,
  create,
  config: { useCache: true },
};
