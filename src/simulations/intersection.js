import { 
  createGrid, 
  initializeCars, 
  updateBrokenTimers,
  hasBrokenCarAhead,
  randomlyBreakCars
} from './utils';

// Crear una simulación de intersección
export const createIntersection = (width, height, density) => {
  const grid = createGrid(width, height, 0);
  
  // Posiciones de las carreteras (horizontal y vertical) 
  const centerY = Math.floor(height / 2);
  const centerX = Math.floor(width / 2);
  
  // Crear carreteras horizontales y verticales
  const roadRows = [centerY - 2, centerY - 1, centerY, centerY + 1, centerY + 2];
  const roadCols = [centerX - 2, centerX - 1, centerX, centerX + 1, centerX + 2];
  
  // Marcar carreteras en la cuadrícula
  const gridWithRoads = grid.map((row, y) => {
    return row.map((cell, x) => {
      // Horizontal road
      if (roadRows.includes(y)) return 0;
      // Vertical road
      if (roadCols.includes(x)) return 0;
      // Non-road area
      return -1;
    });
  });
  
  // Inicializar autos en las carreteras
  const gridWithCars = initializeCars(gridWithRoads, density, roadRows);
  
  return {
    grid: gridWithCars,
    brokenCars: new Set(),
    brokenTimers: {},
    trafficLights: {
      horizontal: 'green',
      vertical: 'red',
      timer: 20, // Tiempo hasta que cambie la luz
    },
    centerX,
    centerY,
  };
};

// Actualizar la simulación de intersección
export const updateIntersection = (prevState) => {
  const newGrid = prevState.grid.map(row => [...row]);
  const { centerX, centerY } = prevState;
  
  // Actualizar luces de tráfico
  const trafficLights = { ...prevState.trafficLights };
  trafficLights.timer--;
  
  if (trafficLights.timer <= 0) {
    // Alternar luces
    trafficLights.horizontal = trafficLights.horizontal === 'green' ? 'red' : 'green';
    trafficLights.vertical = trafficLights.vertical === 'green' ? 'red' : 'green';
    trafficLights.timer = 20; //    Reset timer
  }
  
  // Función para verificar si un auto puede moverse a la intersección
  const canEnterIntersection = (x, y, direction) => {
    // Verificar si se está moviendo hacia la intersección
    const inIntersectionX = Math.abs(x - centerX) <= 2;
    const inIntersectionY = Math.abs(y - centerY) <= 2;
    
    if (inIntersectionX && inIntersectionY) {
      // En la intersección
      return true;
    }
    
    // Aproximándose a la intersección
    if (direction === 'right' && x === centerX - 3 && y === centerY) {
      return trafficLights.horizontal === 'green';
    }
    if (direction === 'left' && x === centerX + 3 && y === centerY) {
      return trafficLights.horizontal === 'green';
    }
    if (direction === 'down' && y === centerY - 3 && x === centerX) {
      return trafficLights.vertical === 'green';
    }
    if (direction === 'up' && y === centerY + 3 && x === centerX) {
      return trafficLights.vertical === 'green';
    }
    
    return true;
  };
  
  // Procesar cada celda en la cuadrícula
  const width = prevState.grid[0].length;
  const height = prevState.grid.length;
  
  // Primera pasada: calcular nuevas posiciones
  const moves = [];
  
  // Procesar carreteras horizontales (de izquierda a derecha)
  for (let y of [centerY - 2, centerY - 1, centerY, centerY + 1, centerY + 2]) {
    // Procesar de derecha a izquierda para evitar sobrescritura
    for (let x = width - 1; x >= 0; x--) {
      const cell = prevState.grid[y][x];
      if (cell <= 0) continue;
      
      // Verificar si el auto está descompuesto
      const carKey = `${y},${x}`;
      if (prevState.brokenCars.has(carKey)) {
        // No mover autos descompuestos
        continue;
      }
      
      // Verificar si hay un auto descompuesto delante
      const hasBrokenAhead = hasBrokenCarAhead(x, y, 'right', prevState.brokenCars, width, height);
      if (hasBrokenAhead) {
        // No mover si hay un auto descompuesto delante
        continue;
      }
      
      // Determinar dirección basada en la posición relativa a la intersección
      let direction = x < centerX ? 'right' : 'left';
      let nextX = direction === 'right' ? x + 1 : x - 1;
      let nextY = y;
      
      if (canEnterIntersection(x, y, direction)) {
        if (nextX >= 0 && nextX < width) {
          if (newGrid[nextY][nextX] === 0) {
            moves.push({ fromX: x, fromY: y, toX: nextX, toY: nextY });
          }
        }
      }
    }
  }
  
  // Procesar carreteras verticales (de abajo a arriba)
  for (let x of [centerX - 2, centerX - 1, centerX, centerX + 1, centerX + 2]) {
    // Procesar de abajo a arriba para evitar sobrescritura
    for (let y = height - 1; y >= 0; y--) {
      const cell = prevState.grid[y][x];
      if (cell <= 0) continue;
      
      // Verificar si el auto está descompuesto
      const carKey = `${y},${x}`;
      if (prevState.brokenCars.has(carKey)) {
        // No mover autos descompuestos
        continue;
      }
      
      // Verificar si hay un auto descompuesto abajo
      const hasBrokenAhead = hasBrokenCarAhead(x, y, 'down', prevState.brokenCars, width, height);
      if (hasBrokenAhead) {
        // No mover si hay un auto descompuesto abajo
        continue;
      }
      
      // Determinar dirección basada en la posición relativa a la intersección
      let direction = y < centerY ? 'down' : 'up';
      let nextY = direction === 'down' ? y + 1 : y - 1;
      let nextX = x;
      
      if (canEnterIntersection(x, y, direction)) {
        if (nextY >= 0 && nextY < height) {
          if (newGrid[nextY][nextX] === 0) {
            moves.push({ fromX: x, fromY: y, toX: nextX, toY: nextY });
          }
        }
      }
    }
  }
  
  // Segunda pasada: aplicar movimientos
  moves.forEach(({ fromX, fromY, toX, toY }) => {
    // Saltar si la celda de origen ya está vacía o el destino no está vacío
    if (newGrid[fromY][fromX] <= 0 || newGrid[toY][toX] > 0) return;
    
    // Mover el auto
    newGrid[toY][toX] = newGrid[fromY][fromX];
    newGrid[fromY][fromX] = 0;
    
    // Actualizar posiciones de autos dañados
    const carKey = `${fromY},${fromX}`;
    if (prevState.brokenCars.has(carKey)) {
      prevState.brokenCars.delete(carKey);
      prevState.brokenCars.add(`${toY},${toX}`);
    }
  });
  
  // Actualizar temporizadores de autos descompuestos usando la función de utilidad
  const { updatedTimers, justRepaired } = updateBrokenTimers(
    prevState.brokenTimers,
    prevState.brokenCars
  );
  
  // Actualizar el conjunto de autos descompuestos
  let updatedBrokenCars = new Set(prevState.brokenCars);
  justRepaired.forEach(key => updatedBrokenCars.delete(key));
  
  // Aplicar daños aleatorios usando la función de utilidad
  const { updatedBrokenCars: newBrokenCars, updatedBrokenTimers: newBrokenTimers } = randomlyBreakCars(
    newGrid,
    updatedBrokenCars,
    updatedTimers,
    0.01,  // 1% de probabilidad de descomponerse
    20     // 20 pasos para repararse
  );
  
  // Actualizar referencias
  updatedBrokenCars = newBrokenCars;
  const updatedBrokenTimers = newBrokenTimers;
  
  // Daños aleatorios (1% de probabilidad) y giros (10% de probabilidad)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (newGrid[y][x] > 0) {
        const carKey = `${y},${x}`;
        
        // Verificar giro (10% de probabilidad cuando se acerca a la intersección)
        if (Math.random() < 0.1 && !prevState.brokenCars.has(carKey)) {
          // Solo permitir giro cuando se acerca a la intersección
          const nearIntersection = 
            (Math.abs(x - centerX) <= 3 && Math.abs(y - centerY) <= 1) ||
            (Math.abs(y - centerY) <= 3 && Math.abs(x - centerX) <= 1);
            
          if (nearIntersection) {
            // Determinar giros posibles basados en dirección
            let possibleTurns = [];
            
            if (y === centerY) {
              // Carretera horizontal - puede girar arriba o abajo
              if (x < centerX) {
                // Moviendo hacia la derecha
                possibleTurns = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
              } else {
                // Moviendo hacia la izquierda
                possibleTurns = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
              }
            } else if (x === centerX) {
              // Carretera vertical - puede girar izquierda o derecha
              if (y < centerY) {
                // Moviendo hacia abajo
                possibleTurns = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
              } else {
                // Moviendo hacia arriba
                possibleTurns = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
              }
            }
            
            // Intentar cada giro posible
            for (const turn of possibleTurns) {
              const newX = x + turn.dx;
              const newY = y + turn.dy;
              
              // Verificar si el giro es válido (dentro de los límites y en una carretera)
              if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
                if (newGrid[newY][newX] === 0) {
                  // Realizar el giro
                  newGrid[newY][newX] = newGrid[y][x];
                  newGrid[y][x] = 0;
                  
                  // Actualizar posiciones de autos dañados si es necesario
                  if (prevState.brokenCars.has(carKey)) {
                    updatedBrokenCars.delete(carKey);
                    updatedBrokenCars.add(`${newY},${newX}`);
                  }
                  
                  break;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return {
    grid: newGrid,
    brokenCars: updatedBrokenCars,
    brokenTimers: updatedBrokenTimers,
    trafficLights,
    centerX,
    centerY,
  };
};
