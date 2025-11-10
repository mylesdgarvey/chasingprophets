import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import { PriceData } from '../../types/price';
import { usePlotlyTheme } from '../../hooks/usePlotlyTheme';

interface Props {
  data: PriceData[];
  height?: number;
}

export default function PriceVolumeExplorer({ data, height = 440 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showControls, setShowControls] = React.useState(true);
  const plotlyTheme = usePlotlyTheme();

  useEffect(() => {
    if (!containerRef.current || !data || data.length < 2) return;

    const closes = data.map(d => d.close);
    const vols = data.map(d => Math.max(0, d.volume || 0));
    const dates = data.map(d => d.date);
    const nPoints = data.length;

    // Normalize data for visualization
    const pMin = Math.min(...closes);
    const pMax = Math.max(...closes);
    const vMin = Math.min(...vols);
    const vMax = Math.max(...vols);
    const pRange = pMax - pMin || 1;
    const vRange = vMax - vMin || 1;

    // Create a surface mesh with:
    // X = time indices (0, 1, 2...), Y = actual volume at each time, Z = price
    // Surface will be drawn through the actual (time, volume, price) data points
    
    // Subsample time for cleaner surface
    const timeSkip = Math.max(1, Math.floor(nPoints / 25));
    const xIndices: number[] = [];
    const xLabels: string[] = [];
    const xTickVals: number[] = [];
    const xTickTexts: string[] = [];
    
    for (let i = 0; i < nPoints; i += timeSkip) {
      xIndices.push(i);
      // Format date cleanly (YYYY-MM-DD)
      const dateStr = dates[i];
      xLabels.push(dateStr.split('T')[0]);
    }
    
    // Create tick labels every Nth date for cleaner display
    const tickSkip = Math.max(1, Math.floor(xIndices.length / 8));
    for (let k = 0; k < xIndices.length; k += tickSkip) {
      xTickVals.push(xIndices[k]);
      xTickTexts.push(xLabels[k]);
    }
    
    // Create volume bands (volume levels that go from 0 to max)
    const volumeBands = 12;
    const yBands: number[] = [];
    for (let j = 0; j < volumeBands; j++) {
      yBands.push((j / (volumeBands - 1)) * vMax);
    }
    
    // Build Z matrix and color matrix
    // For each volume band, find price values at those volume levels via interpolation
    const zMatrix: number[][] = [];
    const colorMatrix: number[][] = [];
    
    for (let j = 0; j < volumeBands; j++) {
      const targetVolume = yBands[j];
      const zRow: number[] = [];
      const colorRow: number[] = [];
      
      for (let idx of xIndices) {
        // Find the actual data point at this time
        const actualVolume = vols[idx];
        const actualPrice = closes[idx];
        const actualColor = actualVolume;
        
        // If target volume is close to actual volume, use actual price
        // Otherwise interpolate smoothly
        const volumeCloseness = Math.max(0, 1 - Math.abs(actualVolume - targetVolume) / Math.max(vMax * 0.3, 1));
        const smoothedPrice = actualPrice + (volumeCloseness - 0.5) * (pRange * 0.05);
        
        zRow.push(smoothedPrice);
        colorRow.push(actualColor); // Color always by actual volume
      }
      zMatrix.push(zRow);
      colorMatrix.push(colorRow);
    }
    
    const trace = {
      x: xIndices,
      y: yBands,
      z: zMatrix,
      surfacecolor: colorMatrix,
      type: 'surface' as const,
      colorscale: [
        [0, plotlyTheme.chartColors[0]],
        [0.25, plotlyTheme.chartColors[1]],
        [0.5, plotlyTheme.chartColors[2]],
        [0.75, plotlyTheme.chartColors[3]],
        [1, plotlyTheme.chartColors[4]]
      ],
      showscale: true,
      colorbar: {
        title: 'Volume',
        len: 0.7,
        thickness: 20
      }
    };

    const layout: any = {
      height: height,
      margin: { t: 20, r: 10, l: 50, b: 20 },
      paper_bgcolor: plotlyTheme.paper_bgcolor,
      plot_bgcolor: plotlyTheme.plot_bgcolor,
      font: plotlyTheme.font,
      scene: {
        xaxis: { 
          title: 'X',
          titlefont: { size: 10, color: plotlyTheme.font.color },
          gridcolor: plotlyTheme.xaxis.gridcolor,
          showbackground: true,
          tickvals: xTickVals,
          ticktext: xTickTexts,
          tickfont: { size: 8, color: plotlyTheme.font.color }
        },
        yaxis: { 
          title: 'Y',
          titlefont: { size: 10, color: plotlyTheme.font.color },
          gridcolor: plotlyTheme.yaxis.gridcolor,
          showbackground: true,
          type: 'linear',
          tickfont: { size: 8, color: plotlyTheme.font.color }
        },
        zaxis: { 
          title: 'Z',
          titlefont: { size: 10, color: plotlyTheme.font.color },
          gridcolor: plotlyTheme.xaxis.gridcolor,
          showbackground: true,
          tickfont: { size: 8, color: plotlyTheme.font.color }
        },
        // Camera positioned to view X-Z plane from bottom-left
        camera: {
          eye: { x: -1.5, y: -1.5, z: 0.8 },
          center: { x: 0, y: 0, z: 0 },
          up: { x: 0, y: 0, z: 1 }
        }
      },
      showlegend: false
    };

    Plotly.newPlot(containerRef.current, [trace] as any, layout, { responsive: true }).catch(console.error);

    // Add interactive camera controls
    const container = containerRef.current;
    let cameraState = {
      eyeX: -1.5,
      eyeY: -1.5,
      eyeZ: 0.8,
      moveSpeed: 0.02,      // Slower movement (W/S/A/D/Q/E)
      rotationSpeed: 0.05   // Keep rotation at current speed
    };

    const keys: { [key: string]: boolean } = {};

    // Keyboard controls for WASD camera movement and arrow keys for rotation
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Map arrow keys properly
      const keyMap: { [k: string]: string } = {
        'arrowup': 'arrowup',
        'arrowdown': 'arrowdown',
        'arrowleft': 'arrowleft',
        'arrowright': 'arrowright'
      };
      
      const mappedKey = keyMap[key] || key;
      
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(mappedKey)) {
        keys[mappedKey] = true;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const keyMap: { [k: string]: string } = {
        'arrowup': 'arrowup',
        'arrowdown': 'arrowdown',
        'arrowleft': 'arrowleft',
        'arrowright': 'arrowright'
      };
      
      const mappedKey = keyMap[key] || key;
      
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(mappedKey)) {
        keys[mappedKey] = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleBlur = () => {
      // Clear all keys when focus is lost
      Object.keys(keys).forEach(key => {
        keys[key] = false;
      });
    };

    const updateCamera = () => {
      let moved = false;

      // W: move forward (toward center)
      if (keys['w']) {
        cameraState.eyeX *= (1 - cameraState.moveSpeed);
        cameraState.eyeY *= (1 - cameraState.moveSpeed);
        cameraState.eyeZ *= (1 - cameraState.moveSpeed);
        moved = true;
      }
      // S: move backward (away from center)
      if (keys['s']) {
        cameraState.eyeX *= (1 + cameraState.moveSpeed);
        cameraState.eyeY *= (1 + cameraState.moveSpeed);
        cameraState.eyeZ *= (1 + cameraState.moveSpeed);
        moved = true;
      }
      // A: strafe left
      if (keys['a']) {
        cameraState.eyeX -= cameraState.moveSpeed;
        cameraState.eyeY -= cameraState.moveSpeed;
        moved = true;
      }
      // D: strafe right
      if (keys['d']) {
        cameraState.eyeX += cameraState.moveSpeed;
        cameraState.eyeY += cameraState.moveSpeed;
        moved = true;
      }
      // Q: move up
      if (keys['q']) {
        cameraState.eyeZ += cameraState.moveSpeed;
        moved = true;
      }
      // E: move down
      if (keys['e']) {
        cameraState.eyeZ -= cameraState.moveSpeed;
        moved = true;
      }

      // Arrow keys: rotate around the scene
      // Up arrow: rotate upward
      if (keys['arrowup']) {
        const distance = Math.sqrt(cameraState.eyeX ** 2 + cameraState.eyeY ** 2 + cameraState.eyeZ ** 2);
        cameraState.eyeZ += cameraState.rotationSpeed;
        // Keep same distance from center
        const newDistance = Math.sqrt(cameraState.eyeX ** 2 + cameraState.eyeY ** 2 + cameraState.eyeZ ** 2);
        if (newDistance > 0) {
          const scale = distance / newDistance;
          cameraState.eyeX *= scale;
          cameraState.eyeY *= scale;
          cameraState.eyeZ *= scale;
        }
        moved = true;
      }
      // Down arrow: rotate downward
      if (keys['arrowdown']) {
        const distance = Math.sqrt(cameraState.eyeX ** 2 + cameraState.eyeY ** 2 + cameraState.eyeZ ** 2);
        cameraState.eyeZ -= cameraState.rotationSpeed;
        // Keep same distance from center
        const newDistance = Math.sqrt(cameraState.eyeX ** 2 + cameraState.eyeY ** 2 + cameraState.eyeZ ** 2);
        if (newDistance > 0) {
          const scale = distance / newDistance;
          cameraState.eyeX *= scale;
          cameraState.eyeY *= scale;
          cameraState.eyeZ *= scale;
        }
        moved = true;
      }
      // Left arrow: rotate left (around Z axis)
      if (keys['arrowleft']) {
        const angle = cameraState.rotationSpeed;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = cameraState.eyeX * cos - cameraState.eyeY * sin;
        const newY = cameraState.eyeX * sin + cameraState.eyeY * cos;
        cameraState.eyeX = newX;
        cameraState.eyeY = newY;
        moved = true;
      }
      // Right arrow: rotate right (around Z axis)
      if (keys['arrowright']) {
        const angle = -cameraState.rotationSpeed;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = cameraState.eyeX * cos - cameraState.eyeY * sin;
        const newY = cameraState.eyeX * sin + cameraState.eyeY * cos;
        cameraState.eyeX = newX;
        cameraState.eyeY = newY;
        moved = true;
      }

      // Update camera if any movement
      if (moved) {
        // @ts-ignore
        Plotly.relayout(container, {
          'scene.camera.eye': { 
            x: cameraState.eyeX, 
            y: cameraState.eyeY, 
            z: cameraState.eyeZ 
          }
        } as any).catch(() => {});
      }
    };

    // Animation loop for smooth camera movement
    let animationId: number;
    const animate = () => {
      updateCamera();
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Add event listeners to container only (so it doesn't interfere with other inputs)
    container.addEventListener('keydown', handleKeyDown);
    container.addEventListener('keyup', handleKeyUp);
    container.addEventListener('blur', handleBlur);

    // Resize handler
    const onResize = () => {
      if (containerRef.current) {
        // @ts-ignore
        Plotly.Plots && Plotly.Plots.resize && Plotly.Plots.resize(containerRef.current);
      }
    };
    const obs = new ResizeObserver(onResize);
    obs.observe(containerRef.current);

    return () => {
      obs.disconnect();
      cancelAnimationFrame(animationId);
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('blur', handleBlur);
      if (containerRef.current) {
        Plotly.purge(containerRef.current);
      }
    };
  }, [data, height, plotlyTheme]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: height, minHeight: height, outline: 'none' }}
        tabIndex={0}
        onKeyDown={(e) => {
          // Prevent default arrow key scrolling when focused on container
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
          }
        }}
      />
      {/* Toggle button */}
      <button
        onClick={() => setShowControls(!showControls)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 11,
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)')}
      >
        {showControls ? '⊕' : '⊖'}
      </button>
      
      {/* Controls info box */}
      {showControls && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 50,
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          lineHeight: '1.4',
          maxWidth: '160px',
          zIndex: 10
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Controls:</div>
          <div>W/S: Forward/Back</div>
          <div>A/D: Strafe L/R</div>
          <div>Q/E: Up/Down</div>
          <div style={{ marginTop: '4px', marginBottom: '4px', fontSize: '9px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px' }}>Arrow Keys: Rotate</div>
          <div style={{ fontSize: '10px', opacity: 0.8 }}>Mouse: Rotate (drag)</div>
          <div style={{ marginTop: '4px', fontSize: '9px', opacity: 0.7 }}>Click to focus</div>
        </div>
      )}
    </div>
  );
}
