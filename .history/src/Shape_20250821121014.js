import React, { useState, useRef, useEffect } from "react";
import "./Shape.sass";

const SHAPES = [
  { type: "circle", sizes: ["small", "medium", "large"] },
  { type: "square", sizes: ["small", "medium", "large"] },
  { type: "rectangle", sizes: ["small", "medium", "large"] },
  { type: "triangle", sizes: ["small", "medium", "large"] },
  { type: "diamond", sizes: ["small", "medium", "large"] },
  { type: "hexagon", sizes: ["small", "medium", "large"] }
];

const SIZE_MAP = {
  small: { width: 30, height: 30 },
  medium: { width: 50, height: 50 },
  large: { width: 70, height: 70 }
};

function formatTime(sec) {
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  return `${min}:${s.toString().padStart(2, "0")}`;
}

function Shape() {
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalShapes, setTotalShapes] = useState(0);
  const [totalShapesEver, setTotalShapesEver] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [bestTime, setBestTime] = useState(null);
  const [missedShapes, setMissedShapes] = useState(0);
  const [missedClicks, setMissedClicks] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300);

  // Game visuals
  const [shape, setShape] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showStart, setShowStart] = useState(true);
  const [effects, setEffects] = useState([]); // [{type, x, y, text, className}]

  // Refs
  const gameAreaRef = useRef(null);
  const shapeTimeout = useRef();
  const shapeStartTime = useRef();
  const timerInterval = useRef();

  // Stats
  const [avgReaction, setAvgReaction] = useState(0);
  const [best, setBest] = useState("--");
  const [accuracy, setAccuracy] = useState(100);

  // Update stats
  useEffect(() => {
    if (reactionTimes.length > 0) {
      setAvgReaction(
        Math.round(reactionTimes.reduce((a, b) => a + b) / reactionTimes.length)
      );
      setBest(Math.min(...reactionTimes) + "ms");
    } else {
      setAvgReaction(0);
      setBest("--");
    }
    const totalActions = totalShapesEver + missedClicks + missedShapes;
    setAccuracy(
      totalActions > 0
        ? Math.round((totalShapesEver / totalActions) * 100)
        : 100
    );
  }, [reactionTimes, totalShapesEver, missedClicks, missedShapes]);

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0) {
      setCountdown("GO!");
      setTimeout(() => {
        setShowCountdown(false);
        setShowStart(false);
        setIsPlaying(true);
        setTimeRemaining(300);
      }, 1000);
    }
  }, [countdown, showCountdown]);

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      timerInterval.current = setInterval(() => {
        setTimeRemaining((t) => {
          if (t <= 1) {
            stopGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [isPlaying]);

  // Spawn shape on game start
  useEffect(() => {
    if (isPlaying) spawnShape();
    // eslint-disable-next-line
  }, [isPlaying]);

  // Effects cleanup
  useEffect(() => {
    if (effects.length === 0) return;
    const t = setTimeout(() => setEffects([]), 2000);
    return () => clearTimeout(t);
  }, [effects]);

  // Handle area click
  const handleGameAreaClick = (e) => {
    if (!isPlaying) return;
    if (e.target === gameAreaRef.current) {
      setMissedClicks((m) => m + 1);
      setTotalShapes(0);
      showMissEffect(e.clientX, e.clientY);
    }
  };

  // Start game
  const startGame = () => {
    setTotalShapes(0);
    setTotalShapesEver(0);
    setReactionTimes([]);
    setMissedShapes(0);
    setMissedClicks(0);
    setTimeRemaining(300);
    setShape(null);
    setShowCountdown(true);
    setCountdown(3);
    setShowStart(false);
    setBestTime(bestTime);
  };

  // Stop game
  const stopGame = () => {
    setIsPlaying(false);
    clearInterval(timerInterval.current);
    clearTimeout(shapeTimeout.current);
    setShape(null);
    setShowStart(true);
  };

  // Spawn shape
  const spawnShape = () => {
    if (!isPlaying) return;
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    const shapeData = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = shapeData.sizes[Math.floor(Math.random() * shapeData.sizes.length)];
    const dims = SIZE_MAP[size];
    let width = dims.width, height = dims.height;
    if (shapeData.type === "rectangle") width = dims.width * 1.5;
    if (shapeData.type === "hexagon") height = dims.height * 0.6;
    const maxX = gameArea.offsetWidth - width;
    const maxY = gameArea.offsetHeight - height;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    setShape({
      type: shapeData.type,
      size,
      style: {
        left: x,
        top: y,
        width: shapeData.type !== "triangle" ? width : undefined,
        height: shapeData.type !== "triangle" ? height : undefined
      }
    });
    shapeStartTime.current = Date.now();
    // Remove shape after 3s if not clicked
    shapeTimeout.current = setTimeout(() => {
      setShape(null);
      setMissedShapes((m) => m + 1);
      setTotalShapes(0);
      spawnShape();
    }, 3000);
  };

  // Shape click
  const handleShapeClick = (e) => {
    if (!isPlaying) return;
    clearTimeout(shapeTimeout.current);
    const reactionTime = Date.now() - shapeStartTime.current;
    setReactionTimes((rt) => [...rt, reactionTime]);
    setTotalShapes((s) => s + 1);
    setTotalShapesEver((s) => s + 1);
    let particleColor = "#4ecdc4";
    if (reactionTime < 200) particleColor = "#ffd93d";
    else if (reactionTime < 400) particleColor = "#4ecdc4";
    else particleColor = "#ff6b6b";
    showReactionTime(e.clientX, e.clientY, reactionTime, particleColor);
    setShape(null);
    setTimeout(spawnShape, 500);
  };

  // Show reaction time effect
  const showReactionTime = (x, y, time, color) => {
    let text = `${time}ms`, className = "";
    if (time < 200) {
      text = `PERFECT! ${time}ms`;
      className = "perfect-bonus";
    } else if (time < 400) {
      text = `FAST! ${time}ms`;
      className = "fast-bonus";
    }
    setEffects([{ type: "reaction", x, y, text, className, color }]);
  };

  // Show miss effect
  const showMissEffect = (x, y) => {
    setEffects([{ type: "miss", x, y, text: "MISS! RESET!" }]);
  };

  // Effects rendering
  const renderEffects = () =>
    effects.map((e, i) =>
      <div
        key={i}
        className={e.type === "reaction" ? `reaction-time ${e.className}` : "miss-effect"}
        style={{ left: (e.x - 50) + "px", top: (e.y - 30) + "px" }}
      >{e.text}</div>
    );

  // Render shape
  const renderShape = () => {
    if (!shape) return null;
    const { type, size, style } = shape;
    let classNames = `shape ${type} ${size}`;
    return (
      <div
        className={classNames}
        style={style}
        onClick={handleShapeClick}
      ></div>
    );
  };

  return (
    <div className="game-root">
      <div className="background-shapes" />
      <div className="container">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{totalShapes}</span>
            <span className="stat-label">Current Streak</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatTime(timeRemaining)}</span>
            <span className="stat-label">Time Left</span>
          </div>
          <div className="stat">
            <span className="stat-value">{missedClicks}</span>
            <span className="stat-label">Missed Clicks</span>
          </div>
          <div className="stat">
            <span className="stat-value">{avgReaction}ms</span>
            <span className="stat-label">Avg Reaction</span>
          </div>
          <div className="stat">
            <span className="stat-value">{best}</span>
            <span className="stat-label">Best Time</span>
          </div>
          <div className="stat">
            <span className="stat-value">{accuracy}%</span>
            <span className="stat-label">Accuracy</span>
          </div>
        </div>
        {showStart &&
          <button className="start-btn" onClick={startGame}>
            {isPlaying ? "Play Again" : "Start Game"}
          </button>
        }
        <div
          className="game-area"
          ref={gameAreaRef}
          onClick={handleGameAreaClick}
        >
          {showCountdown &&
            <div className="countdown">{countdown}</div>
          }
          {renderShape()}
          {renderEffects()}
        </div>
      </div>
    </div>
  );
}

export default Shape;