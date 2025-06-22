import { 
  createGrid, 
  initializeCars, 
  applyRule184,
  updateBrokenTimers,
  hasBrokenCarAhead,
  randomlyBreakCars
} from './utils';

// Crear una simulación de dos carriles
export const createTwoWay = (width, height, density) => {
  const grid = createGrid(width, height, 0);
  const lane1 = Math.floor(height / 2) - 1;
  const lane2 = Math.floor(height / 2) + 1;
  
  // Inicializar autos en ambos carriles
  const gridWithCars = initializeCars(grid, density, [lane1, lane2]);
  
  return {
    grid: gridWithCars,
    brokenCars: new Set(),
    brokenTimers: {},
    direction: {
      [lane1]: 1,  // Derecha
      [lane2]: -1, // Izquierda
    },
  };
};

// Aplicar la regla 184 con soporte de dirección
const applyRule184WithDirection = (row, direction, brokenCars, brokenTimers, lane) => {
  const newRow = [...row];
  const width = row.length;
  
  // Determinar dirección de iteración basada en movimiento del auto
  const indices = direction > 0 
    ? Array.from({ length: width }, (_, i) => i) // De izquierda a derecha
    : Array.from({ length: width }, (_, i) => width - 1 - i); // De derecha a izquierda
  
  for (const x of indices) {
    // Saltar si la celda está vacía
    if (newRow[x] <= 0) continue;
    
    // Verificar si el auto está descompuesto
    const carKey = `${lane},${x}`;
    if (brokenCars.has(carKey)) {
      // No mover autos descompuestos
      continue;
    }
    
    // Verificar si hay un auto descompuesto delante
    const directionStr = direction > 0 ? 'right' : 'left';
    const hasBrokenAhead = hasBrokenCarAhead(x, 0, directionStr, brokenCars, width, 1);
    
    // Mover el auto si no hay autos descompuestos delante
    if (!hasBrokenAhead) {
      const nextX = (x + direction + width) % width;
      // Solo mover si la siguiente celda está vacía
      if (newRow[nextX] === 0) {
        newRow[nextX] = newRow[x];
        newRow[x] = 0;
      }
    }
  }
  
  return newRow;
};

// Actualizar la simulación de dos carriles
export const updateTwoWay = (prevState) => {
  const newGrid = prevState.grid.map(row => [...row]);
  const lane1 = Math.floor(prevState.grid.length / 2) - 1;
  const lane2 = Math.floor(prevState.grid.length / 2) + 1;
  
  // Aplicar la regla 184 a cada carril con dirección apropiada
  newGrid[lane1] = applyRule184WithDirection(
    prevState.grid[lane1], 
    prevState.direction[lane1],
    prevState.brokenCars,
    prevState.brokenTimers,
    lane1
  );
  
  newGrid[lane2] = applyRule184WithDirection(
    prevState.grid[lane2],
    prevState.direction[lane2],
    prevState.brokenCars,
    prevState.brokenTimers,
    lane2
  );
  
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
    [newGrid[lane1], newGrid[lane2]],
    updatedBrokenCars,
    updatedTimers,
    0.01,  // 1% de probabilidad de descomponerse
    20     // 20 pasos para repararse
  );
  
  // Actualizar referencias
  updatedBrokenCars = newBrokenCars;
  const updatedBrokenTimers = newBrokenTimers;
  
  // Cambios de carril (10% de probabilidad)
  [lane1, lane2].forEach(lane => {
    for (let x = 0; x < newGrid[lane].length; x++) {
      if (newGrid[lane][x] > 0) {
        const carKey = `${lane},${x}`;
        
        // Verificar cambios de carril (10% de probabilidad cuando no está dañado)
        if (Math.random() < 0.1 && !prevState.brokenCars.has(carKey)) {
          const targetLane = lane === lane1 ? lane2 : lane1;
          const targetX = x; // Igual posición x en el otro carril
          
          // Verificar si la posición objetivo está vacía
          if (newGrid[targetLane][targetX] === 0) {
            // Mover el auto al otro carril
            newGrid[targetLane][targetX] = newGrid[lane][x];
            newGrid[lane][x] = 0;
            
            // Actualizar la posición del auto dañado si se está moviendo un auto dañado
            if (prevState.brokenCars.has(carKey)) {
              updatedBrokenCars.delete(carKey);
              updatedBrokenCars.add(`${targetLane},${targetX}`);
            }
          }
        }
      }
    }
  });
  
  return {
    grid: newGrid,
    brokenCars: updatedBrokenCars,
    brokenTimers: updatedBrokenTimers,
    direction: { ...prevState.direction },
  };
};
