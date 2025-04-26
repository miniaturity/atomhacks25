import './App.css';
import React, { useState, useEffect } from 'react';
import { LEVELS, GOALS, BALANCES, DELAYS } from './Levels';


const getLineColor = (lineName) => {
  const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
  const index = parseInt(lineName.split(' ')[1]) - 1;
  return colors[index % colors.length];
};

function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [delays, setDelays] = useState(DELAYS[currentLevel])
  const [balance, setBalance] = useState(BALANCES[currentLevel]);
  const [currentStop, setCurrentStop] = useState(LEVELS[currentLevel][0][0]); 
  const [hasWon, setHasWon] = useState(false);
  const [hasLost, setHasLost] = useState(false);
  const [disable, setDisable] = useState(false);
  const [direction, setDirection] = useState(1);
  const [moves, setMoves] = useState(0);
  const [message, setMessage] = useState("Stand clear of the closing doors, please.");
  const [score, setScore] = useState(100);

  useEffect(() => {
    setHasWon(false);
    setBalance(BALANCES[currentLevel]);
    setMoves(0);
    setCurrentStop(LEVELS[currentLevel][0][0]);
    setDisable(false);
    setDirection(1);
    setMessage("Stand clear of the closing doors, please.");
    setDelays(DELAYS[currentLevel]);
  }, [currentLevel]);

  if (hasWon && !disable) {
    setCurrentStop(GOALS[currentLevel])
    setDisable(true);
    setMoves(moves - 1);
    return;
  }

  const handleNextLevel = () => {
    if (!hasWon) return;
    setCurrentLevel(prevLevel => {
      const nextLevel = prevLevel + 1;
      if (nextLevel >= LEVELS.length) {
        setMessage("You've completed all levels!");
        return prevLevel;
      }
      return nextLevel;
    });
  };

  const resetLevel = () => {
    console.log(currentLevel);
    setHasWon(false);
    setBalance(BALANCES[currentLevel]);
    setMoves(0);
    setCurrentStop(LEVELS[currentLevel][0][0]);
    setDisable(false);
    setDirection(1);
    setMessage("Stand clear of the closing doors, please.");
    setDelays(DELAYS[currentLevel]);
  }

  const handleNextStop = () => {
    const delayInfo = DELAYS[currentLevel].find(([stop]) => stop === currentStop)
    console.log(delayInfo);
    if (delayInfo && moves < delayInfo[1]) {
      setMoves(moves + 1);
      setMessage("This line is currently experiencing delays.")
      return;
    }

    const [stopNum, linePrefix, ...connections] = currentStop.split('_');
    const currentLine = LEVELS[currentLevel].find(line =>
      line[0].split('_')[1] === linePrefix
    );
  
    const currentIndex = currentLine.findIndex(stop => stop === currentStop);
    
    let nextIndex = currentIndex + direction;
    let newDirection = direction;
    
    if (nextIndex < 0 || nextIndex >= currentLine.length) {
      newDirection = direction === 1 ? -1 : 1;
      nextIndex = currentIndex + newDirection;
      setMessage("This is the last stop; please get off the train.")
    } else {
      setMessage("Stand clear of the closing doors, please.")
    }
    
    const nextStop = currentLine[nextIndex];
    
    if (nextStop) {
      setCurrentStop(nextStop);
      setDirection(newDirection);
    }

    if (nextStop === GOALS[currentLevel]) {
      setHasWon(true);
      setScore(parseInt(balance) * (score - moves));
    }
    setMoves(moves + 1);
  };

  
  const handleTransfer = (targetLinePrefix) => {
    if (hasWon) return;
    console.log("run");
    if (balance === 0) {
      setMessage("!!!! Your balance is too low, you lost :( !!!!");
      return;
    }
    const [stopNum, currentLinePrefix] = currentStop.split('_');
    
    const targetLine = LEVELS[currentLevel].find(line => 
      line[0].split('_')[1] === targetLinePrefix
    );
    
    const targetStop = targetLine.find(stop => 
      stop.startsWith(`${stopNum}_`) && 
      stop.split('_').slice(2).includes(currentLinePrefix)
    );
    
    if (targetStop) {
      setCurrentStop(targetStop);
      setBalance(prev => prev - 1.75);
    }

    if (targetStop === GOALS[currentLevel]) {
      setHasWon(true);
    }
  };

  const getAvailableTransfers = () => {
    if (!currentStop) return []; 
    const parts = currentStop.split('_');
    if (parts.length < 3) return []; 
    const [, , ...connections] = parts;
    return connections;
  };

  const availableTransfers = getAvailableTransfers();

  return (
    <div className="container">
      <TutorialWindow />
      <GenerateMap 
        level={LEVELS[currentLevel]} 
        currentStop={currentStop}
        onNextStop={handleNextStop}
      />
      <div className="menuSideBar">
        <div className="level">{"Current Level: " + (currentLevel + 1)}</div>
        <div className="stop">{"Current Stop: " + currentStop.split("_")[0] + currentStop.split("_")[1].toUpperCase()}</div>
        <div className="bal">{"Balance: $" + balance.toFixed(2)}</div>
        <div className="goal">{"Goal: " + GOALS[currentLevel].split("_")[0] + GOALS[currentLevel].split("_")[1].toUpperCase()}</div>
        <div className="moves">{"Moves: " + moves}</div>
        <section className="actions">
          <button onClick={handleNextStop} style={{
            backgroundColor: '#2ecc71'
          }}>Next Stop</button>
          <section>
            <h1>Transfer</h1>
            {hasWon ? <p className='no-transfers'>{`You won! Score: ${score}`}  </p> : availableTransfers.length > 0 ? (
              <div className="transfer-options">
                {availableTransfers.map(transferPrefix => {
                  const lineIndex = LEVELS[currentLevel].findIndex(line => 
                    line[0].split('_')[1] === transferPrefix
                  );
                  return (
                    <button 
                      key={transferPrefix}
                      onClick={() => handleTransfer(transferPrefix)}
                      style={{ backgroundColor: getLineColor(`Line ${lineIndex + 1}`) }}
                    >
                      {transferPrefix.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            ) : (
             <p className="no-transfers">No transfers available here</p>
            )}
            
          </section>
          <button onClick={handleNextLevel}> Next Level </button>
          <button onClick={resetLevel}> Reset Level </button>
          
        </section>
      </div>
      <footer><marquee>DELAYS: {delays.map(del => `${del[0].split("_")[0]+del[0].split("_")[1].toUpperCase()} - ${del[1]} STOPS, `)} | ANNOUNCEMENTS: {message}</marquee></footer>
    </div>
  );
}

function GenerateMap({ level, currentStop }) {
  const lines = {};
  const allStopNumbers = new Set();
  
  level.forEach(lineStops => {
    lineStops.forEach(stop => {
      const stopNum = stop.split('_')[0];
      allStopNumbers.add(parseInt(stopNum));
    });
  });
  
  
  const sortedStopNumbers = Array.from(allStopNumbers).sort((a, b) => a - b);
  
  level.forEach((lineStops, lineIndex) => {
    const lineName = `Line ${lineIndex + 1}`;
    const linePrefix = String.fromCharCode(97 + lineIndex);
    lines[lineName] = [];
    
    for (let num of sortedStopNumbers) {
      const lineStopNumbers = lineStops.map(stop => parseInt(stop.split('_')[0]));
      const minStop = Math.min(...lineStopNumbers);
      const maxStop = Math.max(...lineStopNumbers);
      
      if (num >= minStop && num <= maxStop) {
        const originalStop = lineStops.find(s => s.startsWith(`${num}_`));
        
        if (originalStop) {
          const [stopNum, ...connectionParts] = originalStop.split('_');
          const connections = connectionParts.map(part => {
            return part.replace('_c', '').replace('_d', '');
          }).filter(part => part !== linePrefix);
          
          lines[lineName].push({
            id: originalStop,
            number: stopNum,
            name: `Stop ${stopNum}`,
            connections: [...new Set(connections)],
            line: lineName,
            isOriginal: true,
            connectionParts: connectionParts
          });
        } else {
          lines[lineName].push({
            id: `${num}_${linePrefix}`,
            number: num.toString(),
            name: `Stop ${num}`,
            connections: [],
            line: lineName,
            isOriginal: false,
            connectionParts: []
          });
        }
      }
    }
  });

  const connections = [];
  const allStops = Object.values(lines).flat();
  
  allStops.forEach(stop => {
    stop.connectionParts.forEach(part => {
      if (part.endsWith('c')) {
        const connectedLinePrefix = part.replace('_c', '');
        const connectedStop = allStops.find(s => 
          s.number === stop.number && 
          s.line !== stop.line && 
          s.id.startsWith(`${s.number}_${connectedLinePrefix}`)
        );
        
        if (connectedStop && !connections.some(c => 
          (c.from.id === stop.id && c.to.id === connectedStop.id) ||
          (c.from.id === connectedStop.id && c.to.id === stop.id)
        )) {
          connections.push({
            from: stop,
            to: connectedStop,
            at: stop.number
          });
        }
      }
    });
  });

  const linePositions = {};
  const lineSpacing = 150;
  const stopSpacing = 120;
  const lineIndicatorSize = 36;
  
  const stopNumberPositions = {};
  sortedStopNumbers.forEach((num, index) => {
    stopNumberPositions[num] = index * stopSpacing + 60 + lineIndicatorSize;
  });

  Object.keys(lines).forEach((lineName, lineIndex) => {
    const stops = lines[lineName];
    
    linePositions[lineName] = {
      stops: {},
      verticalPosition: lineIndex * lineSpacing,
      color: getLineColor(lineName)
    };
    
    stops.forEach(stop => {
      linePositions[lineName].stops[stop.id] = {
        x: stopNumberPositions[parseInt(stop.number)],
        y: lineIndex * lineSpacing + 60,
        ...stop
      };
    });
  });

  function getLineColor(lineName) {
    const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'];
    const index = parseInt(lineName.split(' ')[1]) - 1;
    return colors[index % colors.length];
  }

  
  const totalWidth = sortedStopNumbers.length * stopSpacing + 120 + lineIndicatorSize;
  const totalHeight = Object.keys(lines).length * lineSpacing + 60;

  return (
    <div className="subway-map" style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: `${totalHeight}px`,
      backgroundImage: 'url(../public/assets/Untitled\ design.png)',
      padding: '40px',
      overflow: 'auto'
    }}>
      {Object.entries(lines).map(([lineName, stops]) => {
        const lineNumber = parseInt(lineName.split(' ')[1]);
        const lineLetter = String.fromCharCode(64 + lineNumber);
        
        return (
          <div key={lineName} style={{ 
            position: 'absolute',
            width: `${totalWidth}px`,
            height: `${lineSpacing}px`,
            top: `${linePositions[lineName].verticalPosition}px`
          }}>
            <div style={{
              position: 'absolute',
              left: '10px',
              top: '48px',
              width: `${lineIndicatorSize}px`,
              height: `${lineIndicatorSize}px`,
              borderRadius: '50%',
              backgroundColor: linePositions[lineName].color,
              border: '4px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 3
            }}>
              {lineLetter}
            </div>
            
            <svg style={{
              position: 'absolute',
              top: '60px',
              left: `${lineIndicatorSize + 10}px`,
              width: `calc(100% - ${lineIndicatorSize + 10}px)`,
              height: '40px'
            }}>
              <path
                d={`M${stopNumberPositions[parseInt(stops[0].number)] - lineIndicatorSize - 10},0 L${stopNumberPositions[parseInt(stops[stops.length-1].number)] - lineIndicatorSize - 10},0`}
                stroke={linePositions[lineName].color}
                strokeWidth="8"
                fill="none"
              />
            </svg>
            
            {stops.map(stop => (
              <div key={stop.id} style={{
                position: 'absolute',
                left: `${stopNumberPositions[parseInt(stop.number)] - 12}px`,
                top: '48px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: linePositions[lineName].color,
                border: '4px solid white',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {stop.id === currentStop && (
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ffeb3b',
                    border: '2px solid #ff9800',
                    zIndex: 4
                  }} />
                )}
                {stop.number}
                {stop.connections.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '2px'
                  }}>
                    {stop.connections.map((conn, i) => {
                      const connectedLineLetter = String.fromCharCode(64 + (conn.charCodeAt(0) - 96));
                      return (
                        <div key={i} style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: getLineColor(`Line ${conn.charCodeAt(0) - 96}`),
                          border: '2px solid white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '8px',
                          fontWeight: 'bold'
                        }}>
                          {connectedLineLetter}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TutorialWindow() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-window">
        <button 
          className="close-button"
          onClick={() => setIsOpen(false)}
          aria-label="Close tutorial"
        >
          &times;
        </button>
        
        <h2 style={{
          transform: 'translateY(-10px)'
        }}>Welcome to the Subway Maze..</h2>
        
        <div className="tutorial-content">
          <div className="tutorial-step">
            <h3>How to Play</h3>
            <p>Navigate through the subway system by moving through stops, by pressing the <strong>Next Stop</strong> button. Transfer to other subway lines in the <strong>Transfer</strong> menu. Make it to your goal without spending all of your balance. Try to get the highest score!</p>
          
          </div>
          
          <div className="tutorial-step">
            <h3>Line Indicators</h3>
            <p>Each colored circle represents a different subway line.</p>
            <div className="line-examples">
              <span className="line-example" style={{ backgroundColor: '#e41a1c' }}>A</span>
              <span className="line-example" style={{ backgroundColor: '#377eb8' }}>B</span>
              <span className="line-example" style={{ backgroundColor: '#4daf4a' }}>C</span>
            </div>
            <p> The orange dot is you. </p>
          </div>
          
          <div className="tutorial-step">
            <h3>Connections</h3>
            <p>Transfer between lines at connected stations (marked with dots).
              Each transfer costs $1.75.
            </p>
          </div>
          
          <button 
            className="got-it-button"
            onClick={() => setIsOpen(false)}
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
}


export default App;