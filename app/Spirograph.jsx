import { useState, useRef, useEffect, useCallback } from 'react';

const DRAWING_MODES = {
  AUTO: 'auto',
  MANUAL: 'manual',
};

const PRESET_PATTERNS = [
  { name: 'Classic Star', R: 120, r: 45, d: 75 },
  { name: 'Flower', R: 150, r: 90, d: 120 },
  { name: 'Tight Loops', R: 105, r: 30, d: 90 },
  { name: 'Wild Card', R: 135, r: 68, d: 128 },
  { name: 'Delicate', R: 150, r: 38, d: 30 },
  { name: 'Galaxy', R: 128, r: 83, d: 135 },
];

const PEN_COLORS = [
  '#E63946', '#F4A261', '#E9C46A', '#2A9D8F', '#264653',
  '#7209B7', '#3A0CA3', '#4361EE', '#4CC9F0', '#06D6A0',
  '#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF',
];

function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

export default function Spirograph() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const segmentsRef = useRef([]); // Store segments with their colors
  const currentSegmentRef = useRef(null); // Current segment being drawn
  const lastMouseAngleRef = useRef(0);
  const cumulativeAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  
  const [outerRadius, setOuterRadius] = useState(120);
  const [innerRadius, setInnerRadius] = useState(45);
  const [penDistance, setPenDistance] = useState(75);
  const [penColor, setPenColor] = useState('#E63946');
  const [lineWidth, setLineWidth] = useState(1.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [showGears, setShowGears] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [drawingMode, setDrawingMode] = useState(DRAWING_MODES.MANUAL);
  const [isManualDrawing, setIsManualDrawing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);

  const getSpirographPoint = useCallback((t, R, r, d, centerX, centerY) => {
    const diff = R - r;
    const ratio = diff / r;
    const x = centerX + diff * Math.cos(t) + d * Math.cos(ratio * t);
    const y = centerY + diff * Math.sin(t) - d * Math.sin(ratio * t);
    return { x, y };
  }, []);

  const getTotalRotations = useCallback((R, r) => {
    const g = gcd(R, r);
    return r / g;
  }, []);

  const drawGears = useCallback((ctx, t, R, r, d, centerX, centerY) => {
    const diff = R - r;
    const innerCenterX = centerX + diff * Math.cos(t);
    const innerCenterY = centerY + diff * Math.sin(t);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, R, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(innerCenterX, innerCenterY, r, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    const ratio = diff / r;
    const penX = innerCenterX + d * Math.cos(ratio * t);
    const penY = innerCenterY - d * Math.sin(ratio * t);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(innerCenterX, innerCenterY);
    ctx.lineTo(penX, penY);
    ctx.stroke();
    
    ctx.fillStyle = penColor;
    ctx.beginPath();
    ctx.arc(penX, penY, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [penColor]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw all completed segments
    segmentsRef.current.forEach(segment => {
      if (segment.points.length > 1) {
        ctx.strokeStyle = segment.color;
        ctx.lineWidth = segment.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(segment.points[0].x, segment.points[0].y);
        for (let i = 1; i < segment.points.length; i++) {
          ctx.lineTo(segment.points[i].x, segment.points[i].y);
        }
        ctx.stroke();
      }
    });
    
    // Draw current segment being drawn
    if (currentSegmentRef.current && currentSegmentRef.current.points.length > 1) {
      ctx.strokeStyle = currentSegmentRef.current.color;
      ctx.lineWidth = currentSegmentRef.current.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentSegmentRef.current.points[0].x, currentSegmentRef.current.points[0].y);
      for (let i = 1; i < currentSegmentRef.current.points.length; i++) {
        ctx.lineTo(currentSegmentRef.current.points[i].x, currentSegmentRef.current.points[i].y);
      }
      ctx.stroke();
    }
    
    if (showGears && isDrawing && currentSegmentRef.current && currentSegmentRef.current.points.length > 0) {
      const totalRotations = getTotalRotations(outerRadius, innerRadius);
      const maxT = totalRotations * Math.PI * 2;
      const currentT = (progress / 100) * maxT;
      drawGears(ctx, currentT, outerRadius, innerRadius, penDistance, centerX, centerY);
    }
    
    if (showGears && drawingMode === DRAWING_MODES.MANUAL) {
      drawGears(ctx, currentAngle, outerRadius, innerRadius, penDistance, centerX, centerY);
    }
  }, [backgroundColor, showGears, isDrawing, progress, outerRadius, innerRadius, penDistance, getTotalRotations, drawGears, drawingMode, currentAngle]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const totalRotations = getTotalRotations(outerRadius, innerRadius);
    const maxT = totalRotations * Math.PI * 2;
    const step = 0.02 * speed;
    const totalSteps = maxT / step;
    
    let currentStep = Math.floor((progress / 100) * totalSteps);
    
    const drawFrame = () => {
      if (currentStep >= totalSteps) {
        // Move current segment to completed segments
        if (currentSegmentRef.current) {
          segmentsRef.current.push(currentSegmentRef.current);
          currentSegmentRef.current = null;
        }
        setIsDrawing(false);
        setProgress(100);
        draw();
        return;
      }
      
      const t = currentStep * step;
      const point = getSpirographPoint(t, outerRadius, innerRadius, penDistance, centerX, centerY);
      
      if (currentSegmentRef.current) {
        currentSegmentRef.current.points.push(point);
      }
      
      currentStep++;
      setProgress((currentStep / totalSteps) * 100);
      
      draw();
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    
    drawFrame();
  }, [outerRadius, innerRadius, penDistance, speed, progress, getTotalRotations, getSpirographPoint, draw]);

  const startDrawing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    // Start a new segment with current color and lineWidth
    currentSegmentRef.current = {
      color: penColor,
      lineWidth: lineWidth,
      points: []
    };
    setProgress(0);
    setIsDrawing(true);
  };

  const pauseDrawing = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsDrawing(false);
  };

  const resumeDrawing = () => {
    if (progress < 100) {
      setIsDrawing(true);
    }
  };

  const clearCanvas = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    segmentsRef.current = [];
    currentSegmentRef.current = null;
    setProgress(0);
    setIsDrawing(false);
    setIsManualDrawing(false);
    setCurrentAngle(0);
    lastMouseAngleRef.current = 0;
    cumulativeAngleRef.current = 0;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (drawingMode === DRAWING_MODES.MANUAL && showGears) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        drawGears(ctx, 0, outerRadius, innerRadius, penDistance, centerX, centerY);
      }
    }
  };

  const applyPreset = (preset) => {
    clearCanvas();
    setOuterRadius(preset.R);
    setInnerRadius(preset.r);
    setPenDistance(preset.d);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'spirograph.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const getMousePos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (drawingMode !== DRAWING_MODES.MANUAL) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(e);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    isDraggingRef.current = true;
    setIsManualDrawing(true);
    
    const mouseAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
    lastMouseAngleRef.current = mouseAngle;
    
    // Start a new segment if we don't have one, or if color/lineWidth changed
    if (!currentSegmentRef.current || 
        currentSegmentRef.current.color !== penColor || 
        currentSegmentRef.current.lineWidth !== lineWidth) {
      // Save current segment if it exists and has points
      if (currentSegmentRef.current && currentSegmentRef.current.points.length > 0) {
        segmentsRef.current.push(currentSegmentRef.current);
      }
      // Start new segment with current color
      currentSegmentRef.current = {
        color: penColor,
        lineWidth: lineWidth,
        points: []
      };
      // Add starting point
      const point = getSpirographPoint(cumulativeAngleRef.current, outerRadius, innerRadius, penDistance, centerX, centerY);
      currentSegmentRef.current.points.push(point);
    }
    
    draw();
  }, [drawingMode, outerRadius, innerRadius, penDistance, penColor, lineWidth, getMousePos, getSpirographPoint, draw]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || drawingMode !== DRAWING_MODES.MANUAL) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const pos = getMousePos(e);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const mouseAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
    
    // Calculate the change in mouse angle
    let angleDiff = mouseAngle - lastMouseAngleRef.current;
    
    // Handle wrapping around from -PI to PI
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    // Add this difference to our cumulative angle
    const newCumulativeAngle = cumulativeAngleRef.current + angleDiff;
    
    // Interpolate points between old and new cumulative angles for smooth drawing
    const steps = Math.max(1, Math.floor(Math.abs(angleDiff) / 0.02));
    const stepSize = angleDiff / steps;
    
    for (let i = 1; i <= steps; i++) {
      const t = cumulativeAngleRef.current + stepSize * i;
      const point = getSpirographPoint(t, outerRadius, innerRadius, penDistance, centerX, centerY);
      if (currentSegmentRef.current) {
        currentSegmentRef.current.points.push(point);
      }
    }
    
    // Update refs and state
    cumulativeAngleRef.current = newCumulativeAngle;
    lastMouseAngleRef.current = mouseAngle;
    setCurrentAngle(newCumulativeAngle);
    
    draw();
  }, [drawingMode, outerRadius, innerRadius, penDistance, getMousePos, getSpirographPoint, draw]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback((e) => {
    handleMouseDown(e);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e) => {
    handleMouseMove(e);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 900;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (drawingMode === DRAWING_MODES.MANUAL && showGears) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        drawGears(ctx, 0, outerRadius, innerRadius, penDistance, centerX, centerY);
      }
    }
  }, []);

  useEffect(() => {
    if (drawingMode === DRAWING_MODES.MANUAL) {
      draw();
    }
  }, [drawingMode, draw]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);

  useEffect(() => {
    if (isDrawing) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDrawing, animate]);

  useEffect(() => {
    if (!isDrawing) {
      draw();
    }
  }, [backgroundColor, draw, isDrawing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-1 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Virtual Spirograph
        </h1>
        <p className="text-center text-slate-400 mb-4 text-sm">Create mesmerizing geometric patterns</p>
        
        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-2xl border border-slate-700/50 flex-shrink-0">
            <canvas
              ref={canvasRef}
              className={`rounded-xl shadow-inner ${drawingMode === DRAWING_MODES.MANUAL ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ width: '900px', maxWidth: '100%', height: 'auto', touchAction: 'none' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            />
            
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {drawingMode === DRAWING_MODES.AUTO && (
                <>
                  {!isDrawing && progress === 0 && (
                    <button
                      onClick={startDrawing}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25"
                    >
                      ▶ Start
                    </button>
                  )}
                  {isDrawing && (
                    <button
                      onClick={pauseDrawing}
                      className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-yellow-500/25"
                    >
                      ⏸ Pause
                    </button>
                  )}
                  {!isDrawing && progress > 0 && progress < 100 && (
                    <button
                      onClick={resumeDrawing}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-green-500/25"
                    >
                      ▶ Resume
                    </button>
                  )}
                </>
              )}
              <button
                onClick={clearCanvas}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-red-500/25"
              >
                ✕ Clear
              </button>
              <button
                onClick={downloadImage}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                ↓ Save
              </button>
            </div>
            
            {drawingMode === DRAWING_MODES.AUTO && (isDrawing || progress > 0) && (
              <div className="mt-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-slate-400 text-sm mt-1">
                  {progress.toFixed(1)}% complete
                </p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-slate-700/50 w-full xl:w-80 flex-shrink-0">
            <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Drawing Mode</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDrawingMode(DRAWING_MODES.MANUAL);
                      clearCanvas();
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      drawingMode === DRAWING_MODES.MANUAL
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    Mouse
                  </button>
                  <button
                    onClick={() => {
                      setDrawingMode(DRAWING_MODES.AUTO);
                      clearCanvas();
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      drawingMode === DRAWING_MODES.AUTO
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    Auto
                  </button>
                </div>
                {drawingMode === DRAWING_MODES.MANUAL && (
                  <p className="text-xs text-slate-400 mt-2">
                    Click and drag on the canvas to move the inner gear!
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Preset Patterns</h3>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PATTERNS.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => applyPreset(preset)}
                      className="px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg text-sm transition-colors border border-slate-600/50"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Outer Gear (R)</span>
                  <span className="text-purple-400">{outerRadius}</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="250"
                  value={outerRadius}
                  onChange={(e) => setOuterRadius(Number(e.target.value))}
                  className="w-full mt-1 accent-purple-500"
                  disabled={isDrawing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Inner Gear (r)</span>
                  <span className="text-cyan-400">{innerRadius}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max={outerRadius - 5}
                  value={Math.min(innerRadius, outerRadius - 5)}
                  onChange={(e) => setInnerRadius(Number(e.target.value))}
                  className="w-full mt-1 accent-cyan-500"
                  disabled={isDrawing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Pen Distance (d)</span>
                  <span className="text-pink-400">{penDistance}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={penDistance}
                  onChange={(e) => setPenDistance(Number(e.target.value))}
                  className="w-full mt-1 accent-pink-500"
                  disabled={isDrawing}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Drawing Speed</span>
                  <span className="text-green-400">{speed}x</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full mt-1 accent-green-500"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-300 flex justify-between">
                  <span>Line Width</span>
                  <span className="text-orange-400">{lineWidth}px</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-full mt-1 accent-orange-500"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Pen Color</h3>
                <div className="flex flex-wrap gap-2">
                  {PEN_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPenColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                        penColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-2">Background</h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {['#1a1a2e', '#0a0a0a', '#1e3a5f', '#2d1b4e', '#1b2e1b'].map((bg) => (
                      <button
                        key={bg}
                        onClick={() => setBackgroundColor(bg)}
                        className={`w-8 h-8 rounded border-2 transition-transform hover:scale-110 ${
                          backgroundColor === bg ? 'border-white' : 'border-slate-600'
                        }`}
                        style={{ backgroundColor: bg }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Show Gears</span>
                <button
                  onClick={() => setShowGears(!showGears)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    showGears ? 'bg-purple-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      showGears ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-slate-500 text-sm">
          {drawingMode === DRAWING_MODES.AUTO ? (
            <p>Tip: Adjust the gear ratios to create different patterns. The mathematical relationship between R, r, and d determines the design!</p>
          ) : (
            <p>Tip: Click and drag in circular motions around the canvas center. The faster you go, the more fluid the pattern!</p>
          )}
        </div>
      </div>
    </div>
  );
}
