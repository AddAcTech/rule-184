// Helper function to create a 2D grid
const createGrid = (width, height, fill = 0) => {
  return Array(height).fill().map(() => Array(width).fill(fill));
};

// Function to initialize cars with given density
const initializeCars = (grid, density, roadRows) => {
  const newGrid = grid.map(row => [...row]);
  const height = newGrid.length;
  const width = newGrid[0].length;
  
  roadRows.forEach(row => {
    for (let x = 0; x < width; x++) {
      if (Math.random() < density) {
        newGrid[row][x] = 1 + Math.floor(Math.random() * 3); // Assign random car type (1-3)
      }
    }
  });
  
  return newGrid;
};

// Function to apply Rule 184 to a single row
const applyRule184 = (row, brokenCars, brokenTimers) => {
  const newRow = [...row];
  const width = row.length;
  
  // Create a copy to work with
  const currentState = [...row];
  
  for (let x = 0; x < width; x++) {
    const left = x === 0 ? width - 1 : x - 1;
    const right = (x + 1) % width;
    
    // Skip if cell is empty or car is broken
    if (currentState[x] === 0 || brokenCars.has(`0,${x}`)) continue;
    
    // Rule 184: A car moves right if the cell to its right is empty
    if (currentState[right] === 0) {
      newRow[x] = 0;
      newRow[right] = currentState[x];
    }
  }
  
  return newRow;
};

// Función para actualizar los temporizadores de los autos descompuestos
const updateBrokenTimers = (brokenTimers, brokenCars) => {
  const updatedTimers = { ...brokenTimers };
  const justRepaired = [];

  Object.entries(brokenTimers).forEach(([key, timer]) => {
    if (timer > 1) {
      updatedTimers[key] = timer - 1;
    } else {
      // Auto reparado
      delete updatedTimers[key];
      justRepaired.push(key);
    }
  });

  return { updatedTimers, justRepaired };
};

// Función para verificar si hay un auto descompuesto en la dirección de movimiento
const hasBrokenCarAhead = (x, y, direction, brokenCars, width, height) => {
  let nextX = x;
  let nextY = y;

  // Calcular siguiente posición según la dirección
  switch (direction) {
    case 'right':
      nextX = (x + 1) % width;
      break;
    case 'left':
      nextX = (x - 1 + width) % width;
      break;
    case 'down':
      nextY = (y + 1) % height;
      break;
    case 'up':
      nextY = (y - 1 + height) % height;
      break;
    default:
      break;
  }

  return brokenCars.has(`${nextY},${nextX}`);
};

// Función para dañar autos aleatoriamente
const randomlyBreakCars = (grid, brokenCars, brokenTimers, probability = 0.01, repairTime = 20) => {
  const updatedBrokenCars = new Set(brokenCars);
  const updatedBrokenTimers = { ...brokenTimers };
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      if (cell > 0 && Math.random() < probability) {
        const carKey = `${y},${x}`;
        if (!brokenCars.has(carKey)) {
          updatedBrokenCars.add(carKey);
          updatedBrokenTimers[carKey] = repairTime;
        }
      }
    }
  }
  
  return { updatedBrokenCars, updatedBrokenTimers };
};

export {
  createGrid,
  initializeCars,
  applyRule184,
  updateBrokenTimers,
  hasBrokenCarAhead,
  randomlyBreakCars
};
