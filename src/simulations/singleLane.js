import { 
  createGrid, 
  initializeCars, 
  updateBrokenTimers, 
  hasBrokenCarAhead, 
  randomlyBreakCars 
} from './utils';

// Versión simplificada de applyRule184 para carril simple
const applySimpleRule184 = (row, brokenCars, brokenTimers, roadRow) => {
  const newRow = [...row];
  const width = row.length;
  
  // Procesar de derecha a izquierda para evitar sobrescritura
  for (let x = width - 1; x >= 0; x--) {
    // Saltar si la celda está vacía
    if (newRow[x] <= 0) continue;
    
    // Verificar si el auto está descompuesto
    const carKey = `${roadRow},${x}`;
    if (brokenCars.has(carKey)) {
      // No mover autos descompuestos
      continue;
    }
    
    // Verificar si hay un auto descompuesto delante usando la función de utilidad
    const hasBrokenAhead = hasBrokenCarAhead(x, roadRow, 'right', brokenCars, width, 1);
    
    // Mover el auto si no hay autos descompuestos delante
    if (!hasBrokenAhead) {
      const nextX = (x + 1) % width;
      // Solo mover si la siguiente celda está vacía
      if (newRow[nextX] === 0) {
        newRow[nextX] = 1;  // Siempre usar 1 para autos normales
        newRow[x] = 0;
      }
    }
  }
  
  return newRow;
};

// Crear una simulación de un carril simple
export const createSingleLane = (width, height, density) => {
  const grid = createGrid(width, height, 0);
  const roadRow = Math.floor(height / 2);
  
  // Inicializar solo autos normales (valor 1) en la fila central
  const gridWithCars = grid.map((row, y) => {
    if (y !== roadRow) return row;
    return row.map(cell => {
      // Solo poner autos normales (1) o vacío (0)
      return Math.random() < density ? 1 : 0;
    });
  });
  
  return {
    grid: gridWithCars,
    brokenCars: new Set(),
    brokenTimers: {},
  };
};

// Actualizar la simulación de un carril simple
export const updateSingleLane = (prevState) => {
  const newGrid = prevState.grid.map(row => [...row]);
  const roadRow = Math.floor(prevState.grid.length / 2);
  
  // Aplicar la regla 184 simplificada a la fila de la carretera
  const newRoadRow = applySimpleRule184(prevState.grid[roadRow], prevState.brokenCars, prevState.brokenTimers, roadRow);
  newGrid[roadRow] = newRoadRow;
  
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
    [newRoadRow],
    updatedBrokenCars,
    updatedTimers,
    0.01,  // 1% de probabilidad de descomponerse
    20     // 20 pasos para repararse
  );
  
  // Actualizar referencias
  updatedBrokenCars = newBrokenCars;
  const updatedBrokenTimers = newBrokenTimers;
  
  return {
    grid: newGrid,
    brokenCars: updatedBrokenCars,
    brokenTimers: updatedBrokenTimers,
  };
};
