import React from 'react';
import logo from './logo.svg';
import './App.css';
import threebody, {scaleX, scaleY} from './threebody/body';

function App() {
  React.useEffect(() => {
    threebody();
  }, []);
  return (
    <div className="App">
      <canvas id="threebody" width={scaleX} height={scaleY}></canvas>
    </div>
  );
}

export default App;
