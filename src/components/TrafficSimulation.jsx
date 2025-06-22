import { useEffect, useRef, useState } from 'react';
import { createSingleLane, updateSingleLane } from '../simulations/singleLane';
import { createTwoWay, updateTwoWay } from '../simulations/twoWay';
import { createIntersection, updateIntersection } from '../simulations/intersection';
import { FaCarSide, FaTrafficLight, FaInfoCircle } from 'react-icons/fa';

const CELL_SIZE = 15;
const GRID_COLOR = '#333';
const ROAD_COLOR = '#555';
const CAR_COLORS = ['#FF5252', '#4CAF50', '#2196F3', '#FFC107'];
const BROKEN_CAR_COLOR = '#9E9E9E';

// Tipos de autos
const CAR_TYPES = [
  { color: '#FF5252', label: 'Auto normal' },
  { color: '#4CAF50', label: 'Auto con giro pendiente' },
  { color: '#2196F3', label: 'Auto con cambio de carril' },
  { color: '#FFC107', label: 'Auto en intersección' },
  { color: '#9E9E9E', label: 'Auto descompuesto' },
];

export default function TrafficSimulation({ type, density, isRunning, onStep, steps }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [simulation, setSimulation] = useState({
    grid: [],
    brokenCars: new Set(),
    brokenTimers: {},
  });

  // Inicializar simulación basada en el tipo
  useEffect(() => {
    let newSimulation;
    const width = Math.floor(window.innerWidth * 0.9 / CELL_SIZE);
    const height = 20;

    switch (type) {
      case 'single-lane':
        newSimulation = createSingleLane(width, height, density);
        break;
      case 'two-way':
        newSimulation = createTwoWay(width, height, density);
        break;
      case 'intersection':
        newSimulation = createIntersection(width, height, density);
        break;
      default:
        newSimulation = createSingleLane(width, height, density);
    }

    setSimulation(newSimulation);
  }, [type, density]);

  // Control de velocidad de la simulación
  const frameCount = useRef(0);
  const lastUpdateTime = useRef(0);
  const updateInterval = 1000; // Actualizar cada 1000ms
  
  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp) => {
      // Solo actualizar si ha pasado el tiempo suficiente
      if (timestamp - lastUpdateTime.current > updateInterval) {
        onStep();
        updateSimulation();
        lastUpdateTime.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    lastUpdateTime.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, onStep]);

  // Actualizar estado de la simulación
  const updateSimulation = () => {
    setSimulation(prev => {
      switch (type) {
        case 'single-lane':
          return updateSingleLane(prev);
        case 'two-way':
          return updateTwoWay(prev);
        case 'intersection':
          return updateIntersection(prev);
        default:
          return updateSingleLane(prev);
      }
    });
  };

  // Dibujar la simulación
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!simulation.grid.length) return;

    const width = simulation.grid[0].length * CELL_SIZE;
    const height = simulation.grid.length * CELL_SIZE;
    
    canvas.width = width;
    canvas.height = height;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determinar si estamos en modo de carril simple
    const isSingleLane = type === 'single-lane';
    
    // Dibujar celdas
    for (let y = 0; y < simulation.grid.length; y++) {
      for (let x = 0; x < simulation.grid[y].length; x++) {
        const cell = simulation.grid[y][x];
        
        // Saltar celdas vacías o no de carretera
        if (cell === -1) continue;
        
        // Determinar color basado en el tipo de celda
        let color = ROAD_COLOR;
        if (cell > 0) {
          const carKey = `${y},${x}`;
          if (simulation.brokenCars.has(carKey)) {
            color = BROKEN_CAR_COLOR;
          } else {
            // En modo carril simple, siempre usar el primer color (auto normal)
            color = isSingleLane ? CAR_COLORS[0] : CAR_COLORS[Math.min(cell - 1, CAR_COLORS.length - 1)];
          }
        }
        
        // Dibujar celda
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [simulation, steps]);

  const handleStep = () => {
    onStep();
    updateSimulation();
  };

  // Manejar clic en el canvas para avanzar manualmente
  const handleCanvasClick = (e) => {
    if (!isRunning) {
      onStep();
      updateSimulation();
    }
  };

  return (
    <div className="simulation-container">
      <div className="simulation">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            border: '1px solid #444',
            backgroundColor: GRID_COLOR,
            cursor: 'pointer',
          }}
          title={isRunning ? 'La simulación está en ejecución' : 'Haz clic para avanzar un paso'}
        />
      </div>
      
      <div className="legend">
        <h3><FaInfoCircle /> Leyenda de colores</h3>
        <div className="legend-items">
          {CAR_TYPES.map((car, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: car.color }}
              />
              <span>{car.label}</span>
            </div>
          ))}
        </div>
        
        <div className="rule-explanation">
          <h3><FaTrafficLight /> Regla 184</h3>
          <p>
            La Regla 184 es un autómata celular unidimensional donde cada celda puede estar ocupada (1) o vacía (0).
            Las reglas son simples:
          </p>
          <ul>
            <li>Si una celda está ocupada y la siguiente está vacía, el auto avanza.</li>
            <li>Si la siguiente celda está ocupada, el auto se detiene.</li>
            <li>Si una celda está vacía y la anterior está ocupada, un nuevo auto puede llegar.</li>
          </ul>
          <p>En esta simulación, hemos extendido la regla para incluir múltiples carriles, intersecciones y comportamientos adicionales.</p>
        </div>
      </div>
    </div>
  );
}
