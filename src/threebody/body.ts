class Vector2 {
    x: number;
    y: number;

    constructor(x:number, y:number);
    constructor(v: Vector2);
    constructor(arg1: any, arg2?: number){
        if (typeof arg1 === 'number' && typeof arg2 === 'number') {    
            this.x = arg1;
            this.y = arg2;
        }
        else {
            this.x = arg1.x;
            this.y = arg1.y;
        }
    }
    add(v: Vector2): Vector2;
    add(v: Vector2, v2: Vector2): Vector2;
    add(v: Vector2, v2?: Vector2): Vector2 {
        if (v2) {
            return new Vector2(v.x + v2.x, v2.y + v2.y);
        }
        else {
            return new Vector2( this.x + v.x, this.y + v.y);
        }
    }
    sub(v: Vector2): Vector2;
    sub(v: Vector2, v2: Vector2): Vector2;
    sub(v: Vector2, v2?: Vector2): Vector2 {
        if (v2) {
            return new Vector2(v.x - v2.x, v.y - v2.y);
        }
        else {
            return new Vector2(this.x - v.x, this.y - v.y);
        }
    }
    mul(s: number): Vector2;
    mul(v: Vector2, s: number): Vector2;
    mul(v: Vector2|number, s?: number): Vector2 {
        if (typeof v === 'number') {
            return new Vector2(this.x * v,this.y * v );
        } else {
            return new Vector2(v.x * (s||1), v.y * (s||1));
        }
    }
    mad(v: Vector2, s: number): Vector2 {
        return new Vector2(this.x + v.x * s, this.y + v.y * s);
    }
    mulEqual(s: number): Vector2 {
        this.x *= s;
        this.y *= s;
        return this;
    }
    addEqual(v: Vector2): Vector2 {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    subEqual(v: Vector2): Vector2 {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    set(v: Vector2): Vector2 {
        this.x = v.x;
        this.y = v.y;
        return this;
    }
    setZero(): Vector2 {
        this.x = 0;
        this.y = 0;
        return this;
    }
    sqnorm(): number {
        return this.x * this.x + this.y * this.y;
    }
    norm(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    sqDistance(v: Vector2): number {
        return (this.x - v.x) * (this.x - v.x) + (this.y - v.y) * (this.y - v.y);
    }
    normalized(): Vector2 {
        return this.mul(1.0 / this.norm());
    }
    normalize(): Vector2 {
        const inv_norm = 1.0 / this.norm();
        this.x *= inv_norm;
        this.y *= inv_norm;
        return this;
    }
}


const bodyCount = 6;

export const scaleY = window.innerHeight;
export const scaleX = window.innerWidth;
let canvas: HTMLCanvasElement;
const bodies = new Array(bodyCount);
const traj = new Array(bodyCount);
const colors = new Array(bodyCount);   
const graph_name = "none";
let K = 1;



class Trajectory {
    N = 20;
    traj: Vector2[];
    div_n: number;
    cursor = 1;
    div = 0;
    constructor(pos: Vector2, div_n: number) {
        this.traj = new Array(this.N);
        for (let i = 0; i < this.N; i++) {
            this.traj[i] = new Vector2(pos);
        }
        this.div_n = div_n;
    }

    add(pos: Vector2) {
        if (this.div++ < this.div_n) {
            return;
        }
        this.div = 0;
        this.traj[this.cursor] = new Vector2(pos);
        this.cursor = (this.cursor + 1) % this.N;
    }
    pop() {

    }
    draw() {
        for (let i = 0; i < this.N - 1; i++) {
            const pt1 = (this.cursor + i) % this.N;
            const pt2 = (this.cursor + i + 1) % this.N;
            const ctx = canvas.getContext('2d');
            if(!ctx) { return; }
            const s = (this.traj[pt1].x - this.traj[pt2].x)*(this.traj[pt1].x - this.traj[pt2].x) + (this.traj[pt1].y - this.traj[pt2].y)* (this.traj[pt1].y - this.traj[pt2].y);
            // if(s>100) console.log('s', s, scaleY);
            if(s<(scaleY*scaleY)/2) { //s<scaleX*scaleX && 
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1;
                ctx.moveTo(this.traj[pt1].x, this.traj[pt1].y);
                ctx.lineTo(this.traj[pt2].x, this.traj[pt2].y);
                ctx.stroke();
                ctx.closePath();
                // console.log('drawing line');
                // line(this.traj[pt1].x, this.traj[pt1].y, this.traj[pt2].x, this.traj[pt2].y);
            }
        }
    }
}
class Body {
    position: Vector2;
    velocity: Vector2;
    constructor(pos: Vector2, vel: Vector2) {
        this.position = new Vector2(pos);
        this.velocity = new Vector2(vel);
    }
}



const randomPosition = () => {
    return new Vector2(Math.round(Math.random() * scaleX), Math.round(Math.random() * scaleY));
}
const randomVelocity = () => {
    return new Vector2(Math.random() - 0.5, Math.random() - 0.5);
}


class State {
    bodies: Body[];
    constructor(bodies:number);
    constructor(bodies:number, pos: Vector2[], vel: Vector2[]);
    constructor(bodies:number, pos?: Vector2[], vel?: Vector2[]) {
        this.bodies = new Array(bodies);
        for (let i = 0; i < bodies; i++) {
            if(pos && vel) {
                this.bodies[i] = new Body(pos[i], vel[i]);
            } else {
                this.bodies[i] = new Body(randomPosition(), randomVelocity());
            }
        }
    }
    add(f: State): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.add(f.bodies[i].position);
            this.bodies[i].velocity.add(f.bodies[i].velocity);
        }
        return this;
    }


    mul(h: number): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.mul(h);
            this.bodies[i].velocity.mul(h);
        }
        return this;
    }

    mad(f: State, h: number): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.mad(f.bodies[i].position, h);
            this.bodies[i].velocity.mad(f.bodies[i].velocity, h);
        }
        return this;
    }

    addEqual(f: State): State {
        for(let i = 0; i<this.bodies.length; i++) {
            if(f&&f.bodies) {
                this.bodies[i].position.addEqual(f.bodies[i].position);
                this.bodies[i].velocity.addEqual(f.bodies[i].velocity);
            }
        }
        return this;
    }
    mulEqual(h: number): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.mulEqual(h);
            this.bodies[i].velocity.mulEqual(h);
        }
        return this;
    }
    madEqual(f: State, h: number): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.x += f.bodies[i].position.x * h;
            this.bodies[i].position.y += f.bodies[i].position.y * h;
            this.bodies[i].velocity.x += f.bodies[i].velocity.x * h;
            this.bodies[i].velocity.y += f.bodies[i].velocity.y * h;
        }
        return this;
    }
    set(f: State): State {
        for(let i = 0; i<this.bodies.length; i++) {
            this.bodies[i].position.set(f.bodies[i].position);
            this.bodies[i].velocity.set(f.bodies[i].velocity);
        }
        return this;
    }
}

class System {
    f: Vector2[] = new Array(bodyCount);
    dir = new Vector2(0, 0);
    constructor() {
        for (let i = 0; i < bodyCount; i++) {
            this.f[i] = new Vector2(0, 0);
        }
    }
    acc(pos: Vector2[]): Vector2[] {
        for (let i = 0; i < bodyCount; i++) {
            this.f[i].setZero();
        }
        for (let i = 0; i < bodyCount; i++) {
            for (let j = i + 1; j < bodyCount; j++) {
                let eps = 0.1;
                let sqdis = pos[i].sqDistance(pos[j]);
                if (1===1) {
                    sqdis = sqdis < eps ? eps : sqdis;
                }
                let magnitude = 1/ Math.sqrt(sqdis);
                // throw new Error('stopppp')
                this.dir = this.dir.sub(pos[i], pos[j]);
                this.dir.normalize().mulEqual(magnitude);
                this.f[i].subEqual(this.dir);
                this.f[j].addEqual(this.dir);
            }
        }
        return this.f;
    }
    ret_state = new State(bodyCount);

    ff(state: State): State {
        let a = this.acc(state.bodies.map(b => b.position));
        for (let i = 0; i < state.bodies.length; i++) {
            this.ret_state.bodies[i].position = state.bodies[i].velocity;
            this.ret_state.bodies[i].velocity = a[i];
        }
        return this.ret_state;
    }

}

let state = new State(bodyCount);
const system = new System();

const setup = () => {
    for (let i = 0; i < bodyCount; i++) {
        const rp = randomPosition();
        const {x,y} = rp;
        // console.log(`randomPosition x: ${x}, y: ${y}`);
        bodies[i] = new Body(rp, randomVelocity());
    }
    state = new State(bodyCount, bodies.map(b => b.position), bodies.map(b => b.velocity));
    for (let i = 0; i < bodyCount; i++) {
        traj[i] = new Trajectory(state.bodies[i].position, 5);
    }
    for (let i = 0; i < bodyCount; i++) {
        //hsl
        colors[i] = Math.random() * 360;
    }

}


     
        

const draw = () => {
    const dt = 0.05 / K;
    // const dt = 1; //0.05/K;
    const kStates = new Array(bodyCount+1);
    for(let i = 0; i < bodyCount+1; i++) {
        kStates[i] = new State(bodyCount);
    }

    // State k1 = new State();
    // State k2 = new State();
    // State k3 = new State();
    // State k4 = new State();

    // console.log("Body count", bodyCount);
    for(let k=0; k<K; k++ ) {
        kStates[0].set( system.ff( state ) ).mulEqual(dt);

        for(let i = 1; i < bodyCount; i++) {
            kStates[i].set(system.ff( kStates[i].set(state).madEqual(kStates[i-1], 0.5))).mulEqual(dt);
        }
        kStates[bodyCount].set( system.ff( kStates[bodyCount].addEqual(kStates[bodyCount-1]) ) ).mulEqual(dt);
        const sumRollUp = (k:number):State => {
            if(k === bodyCount-1) {
                return kStates[k].addEqual(kStates[k+1]);
            }
            return kStates[k].madEqual(sumRollUp(k+1), 2.0);
        }

        const sum = sumRollUp(0);
        state.madEqual(sum, 1.0 / 6.0);
        for(let i = 0; i < bodyCount; i++) {
            state.bodies[i].position.x = state.bodies[i].position.x % scaleX;
            state.bodies[i].position.y = state.bodies[i].position.y % scaleY;
            if(state.bodies[i].position.x < 0) {
                state.bodies[i].position.x += scaleX;
            }
            if(state.bodies[i].position.y < 0) {
                state.bodies[i].position.y += scaleY;
            }
            state.bodies[i].velocity.addEqual( kStates[i].bodies[i].velocity );
        }
        for(let i=0; i<bodyCount; i++ ) {
            traj[i].add( state.bodies[i].position );
        }
    }

   
  }

let instance=0;
const start = () => {
    if(instance) {
        return;
    }
    instance = 1;
    setup();
    // canvas = document.createElement("canvas");
    canvas = document.getElementById('threebody') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = scaleX;
    canvas.height = scaleY;
    setTimeout(() => {
        document.body.appendChild(canvas);
    },0);
    // @ts-ignore
    window.canvas = canvas;
    
    // const stepButton = document.createElement('button');
    // stepButton.textContent = 'Step';
    // stepButton.onclick = () => {
    //     draw();
    //     render();
    // }
    // document.body.appendChild(stepButton);
    setInterval(() => {
        draw();
        render();
        // console.log('drawing....');
    }, 1);
}

let count = 0;

const render = () => {
    // console.log("render count", count++);
    const ctx = canvas.getContext('2d');
    if(!ctx) { return; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < bodyCount; i++) {
        ctx.beginPath();
        // ctx.fillStyle = `hsl(${colors[i]}, 50%, 50%)`;
        // ctx.arc(traj[i].traj[traj[i].cursor].x, traj[i].traj[traj[i].cursor].y, 2, 0, 2 * Math.PI);
        // ctx.fill();
        ctx.fillStyle = `hsl(${colors[i]}, 100%, 100%)`;
        ctx.arc(state.bodies[i].position.x, state.bodies[i].position.y, 5, 0, 2 * Math.PI);
        ctx.strokeStyle = `hsl(${colors[i]}, 100%, 50%)`;
        ctx.lineWidth = 1;  ctx.stroke();
        ctx.fill();
        ctx.closePath();
        traj[i].draw();
    }

};

export default start;