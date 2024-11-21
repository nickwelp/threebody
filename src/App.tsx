import React, {useState, useRef} from 'react';
import logo from './logo.svg';
import './App.css';
// import threebody, {scaleX, scaleY} from './threebody/body';
import Universe, {scaleX, scaleY} from './threebody/bodyWithCollisions';
function App() {
  const ls = useRef(localStorage);
  ls.current = localStorage;
  const initialBodies = parseInt(ls.current.getItem('bodies')||'10');
  const [bodies, updateBodies] = useState(initialBodies);
  const setBodies = (bodies: number) => {
    updateBodies(bodies);
    ls.current.setItem('bodies', bodies.toString());
  }
  const initialCollisions = ls.current.getItem('collisions') || false;
  const [collisions, updateCollisions] = useState(initialCollisions === 'true');
  const setCollisions = (collisions: boolean) => {
    updateCollisions(collisions);
    ls.current.setItem('collisions', collisions.toString());
  }
  const initialCollisionRange = parseInt(ls.current.getItem('collisionRange')||'9');
  const [collisionRange, updateCollisionRange] = useState(initialCollisionRange);
  const setCollisionRange = (collisionRange: number) => {
    updateCollisionRange(collisionRange);
    ls.current.setItem('collisionRange', collisionRange.toString());
  }
  const initialGravityMagnitude = parseInt(ls.current.getItem('gravityMagnitude') || '1');
  const [gravityMagnitude, updateGravityMagnitude] = useState(initialGravityMagnitude);
  const setGravityMagnitude = (gravityMagnitude: number) => {
    updateGravityMagnitude(gravityMagnitude);
    ls.current.setItem('gravityMagnitude', gravityMagnitude.toString());
  }
  const [menuOpen, setMenuOpen] = useState(false);
  const initialOpenUniverse = ls.current.getItem('openUniverse') || false;
  const [openUnivserse, updateOpenUniverse] = useState(initialOpenUniverse === 'true');
  const setOpenUniverse = (openUniverse: boolean) => {
    updateOpenUniverse(openUniverse);
    ls.current.setItem('openUniverse', openUniverse.toString());  
  }
  const Menu = () => {
    // if (!menuOpen) {
    //   return <button onClick={() => setMenuOpen(true)}>Open Menu</button>;
    // };
    return (
      <div className={`menu ${menuOpen?'open':'closed'}`}>
        {menuOpen && (
          <>
            <h2>Menu</h2>
            <div>
              <label htmlFor="bodies">Bodies</label>
              <input type="number" id="bodies" value={bodies} onChange={e => setBodies(parseInt(e.target.value))} />
            </div>
            <div>
              <label htmlFor="collisions">Collisions</label>
              <input type="checkbox" id="collisions" checked={collisions} onChange={e => setCollisions(!collisions)} />
            </div>
            <div>
              <label htmlFor="collisions">Open Universe</label>
              <input type="checkbox" id="open_universe" checked={openUnivserse} onChange={e => setOpenUniverse(!openUnivserse)} />
            </div>
            <div>
              <label htmlFor="collisionRange">Collision Range</label>
              <input type="number" id="collisionRange" value={collisionRange} onChange={e => setCollisionRange(parseInt(e.target.value))} />
            </div>
            <div>
              <label htmlFor="gravityMagnitude">Gravity Magnitude</label>
              <input type="number" id="gravityMagnitude" value={gravityMagnitude} onChange={e => setGravityMagnitude(parseInt(e.target.value))} />
            </div>
            <button onClick={() => {
              let universe = Universe.getInstance();
              universe.delete();
              // universe = Universe.getInstance(bodies);
              universe = Universe.getInstance(bodies, collisions, collisionRange, gravityMagnitude, openUnivserse);
              // universe.setBodies(bodies);
              // universe.setCollisions(collisions);
              // universe.setCollisionRange(collisionRange);
              // universe.setGravityMagnitude(gravityMagnitude);
              universe.start();
            }}>Update</button>
            <button onClick={() => setMenuOpen(false)}>Close</button>
            <button onClick={() => {
              let universe = Universe.getInstance();
              universe.recenter();
            }}>Center</button>
          </>
        )}
        {!menuOpen && (
          <button className={'menuOpenButton'} onClick={() => setMenuOpen(true)}>Open Menu</button>
        )}
      </div>
    );
  }

  const universe = Universe.getInstance(bodies, collisions, collisionRange, gravityMagnitude, openUnivserse);
  React.useEffect(() => {
    universe.start();
  }, []);
  return (
    <div className="App">
      {Menu()}
      {/* <canvas id="threebody" width={scaleX} height={scaleY}></canvas> */}
    </div>
  );
}

export default App;
