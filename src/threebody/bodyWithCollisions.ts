class Universe {
    bodyCount: number;
    collisions: boolean = true;
    collisionRange: number = 9;
    gravityMagnitude:number =1;
    openUnivserse:boolean = false;
    canvas: HTMLCanvasElement;
    bodies: Body[];
    traj: Trajectory[];
    colors: number[];
    strongForceRange = 3;
    K: 1;
    state: State;
    system: System;
    lastTimestamp: number;
    static instance: Universe|undefined;
    scaleX = window.innerWidth;
    scaleY = window.innerHeight;
    kill = false;
    recenter = () => {
        let sum_x = 0;
        let sum_y = 0;
        for(let i = 0; i < this.bodyCount; i++) {
            sum_x += this.state.bodies[i].position.x;
            sum_y += this.state.bodies[i].position.y;
        }
        const avg_x = sum_x / this.bodyCount;
        const avg_y = sum_y / this.bodyCount;
        for(let i = 0; i < this.bodyCount; i++) {
            this.state.bodies[i].position.x -= (avg_x - this.scaleX/2);
            this.state.bodies[i].position.y -= (avg_y - this.scaleY/2);
            this.traj[i].recenter(avg_x - this.scaleX/2, avg_y - this.scaleY/2);
        }
    }
    delete = () => {
        this.kill = true;
        this.canvas.remove();
        Universe.instance = undefined;
    }
    // only supply a number if you want to override the default body count
    static getInstance(num: number = 10, 
        collisions: boolean = true,
        collisionRange: number = 9,
        gravityMagnitude:number =1,
        openUnivserse:boolean = false,
        strongForceRange = 3,
    ): Universe {
        if(!Universe.instance) {
            Universe.instance = new Universe(
                num,
                collisions,
                collisionRange,
                gravityMagnitude,
                openUnivserse,
                strongForceRange
            );
        }
        return Universe.instance;
    }

    constructor(
        bodyCount: number = 10,
        collisions: boolean = true,
        collisionRange: number = 9,
        gravityMagnitude:number =1,
        openUnivserse:boolean = false,
        strongForceRange = 3
    ) {
        this.kill = false;
        this.bodyCount = bodyCount;
        this.collisions = collisions;
        this.collisionRange = collisionRange;
        this.gravityMagnitude = gravityMagnitude;
        this.openUnivserse = openUnivserse;
        this.strongForceRange = strongForceRange;
        this.canvas = document.createElement("canvas");
        // this.canvas = document.getElementById('threebody') as HTMLCanvasElement;
        this.canvas.setAttribute('id', 'threebody');
        this.canvas.width = window.innerWidth;
        this.scaleX = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.scaleY = window.innerHeight;
        setTimeout(() => {
            document.body.appendChild(this.canvas);
        },0);
        this.bodies = new Array(bodyCount);
        this.traj = new Array(bodyCount);
        this.colors = new Array(bodyCount);
        this.K = 1;
        // this.state = new State(bodyCount);
        this.system = new System(this);
        this.lastTimestamp = new Date().getTime();
        for (let i = 0; i < bodyCount; i++) {
            this.bodies[i] = new Body(randomPosition(), randomVelocity());
        }
        this.state = new State(bodyCount, this.bodies.map(b => b.position), this.bodies.map(b => b.velocity));
        for (let i = 0; i < bodyCount; i++) {
            this.traj[i] = new Trajectory(this.bodies[i].position, 5);
        }
        for (let i = 0; i < bodyCount; i++) {
            //hsl
            this.colors[i] = Math.random() * 360;
        }
    }
 
    draw = () => {
        const ts = new Date().getTime();
        const deltaTime = ts - this.lastTimestamp;
        this.lastTimestamp = ts; 
        const dt = deltaTime / 100;
        const kStates = new Array(this.bodyCount+1);
        for(let i = 0; i < this.bodyCount+1; i++) {
            kStates[i] = new State(this.bodyCount);
        }
        let K=1;
        for(let k=0; k<K; k++ ) {
            kStates[0].set( this.system.ff( this.state ) ).mulEqual(dt);

            for(let i = 1; i < this.bodyCount; i++) {
                kStates[i].set(this.system.ff( kStates[i].set(this.state).madEqual(kStates[i-1], 0.5))).mulEqual(dt);
            }
            kStates[this.bodyCount].set( this.system.ff( kStates[this.bodyCount].addEqual(kStates[this.bodyCount-1]) ) ).mulEqual(dt);
            const sumRollUp = (k:number):State => {
                if(k === this.bodyCount-1) {
                    return kStates[k].addEqual(kStates[k+1]);
                }
                // return kStates[k].madEqual(sumRollUp(k+1), 2.0);
                return kStates[k].madEqual(sumRollUp(k+1), 1.0);

            }

            const sum = sumRollUp(0);
            this.state.madEqual(sum, 1.0 / 6.0);
            for(let i = 0; i < this.bodyCount; i++) {
                if(!this.openUnivserse){
                    this.state.bodies[i].position.x = this.state.bodies[i].position.x % this.scaleX;
                    this.state.bodies[i].position.y = this.state.bodies[i].position.y % this.scaleY;
                    if(this.state.bodies[i].position.x < 0) {
                        this.state.bodies[i].position.x += this.scaleX;
                    }
                    if(this.state.bodies[i].position.y < 0) {
                        this.state.bodies[i].position.y += this.scaleY;
                    }
                }
                this.state.bodies[i].velocity.addEqual( kStates[i].bodies[i].velocity );
            }
            for(let i=0; i<this.bodyCount; i++ ) {
                this.traj[i].add( this.state.bodies[i].position );
            }
        }
    }
    hasStarted = 0;
    start = () => {
        if(this.hasStarted) {
            return;
        }
        this.hasStarted = 1;
        const cycle = () => {
            if(this.kill) {
                return;
            }
            this.draw();
            this.render();
            setTimeout(cycle, 0);
        }
        cycle();
    }


    render = () => {
        const ctx = this.canvas.getContext('2d');
        if(!ctx) { return; }
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = 0; i < this.bodyCount; i++) {
            ctx.beginPath();
            ctx.fillStyle = `hsl(${this.colors[i]}, 100%, 100%)`;
            ctx.arc(this.state.bodies[i].position.x, this.state.bodies[i].position.y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
            this.traj[i].draw();
        }

    };

   
  }

 


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


const bodyCount = 10;
// const bodyCount = 70;
// const bodyCount = 10;




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
    recenter(x:number,y:number) {
        for (let i = 0; i < this.N; i++) {
            this.traj[i].x -= x;
            this.traj[i].y -= y;
        }
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
        const uni = Universe.getInstance();
        for (let i = 0; i < this.N - 1; i++) {
            const pt1 = (this.cursor + i) % this.N;
            const pt2 = (this.cursor + i + 1) % this.N;
            const ctx = uni.canvas.getContext('2d');
            if(!ctx) { return; }
            const s = (this.traj[pt1].x - this.traj[pt2].x)*(this.traj[pt1].x - this.traj[pt2].x) + (this.traj[pt1].y - this.traj[pt2].y)* (this.traj[pt1].y - this.traj[pt2].y);
            // if(s>100) console.log('s', s, scaleY);
            if(s<(uni.scaleX*uni.scaleX)/2 && s<(uni.scaleY*uni.scaleY)/2) { //
                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 0.5;
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
    return new Vector2(Math.round(Math.random() * window.innerWidth), Math.round(Math.random() * window.innerHeight));
}
const randomVelocity = () => {
    return new Vector2(Math.random() - Math.random(), Math.random() - Math.random());//.mul(1);
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
    universe: Universe;  
    f: Vector2[];
    dir = new Vector2(0, 0);
    ret_state: State;
    constructor(universe: Universe) {
        this.f = new Array(universe.bodyCount);
        this.universe = universe;
        this.ret_state = new State(this.universe.bodyCount);
        for (let i = 0; i < this.universe.bodyCount; i++) {
            this.f[i] = new Vector2(0, 0);
        }
    }
    acc(pos: Vector2[]): Vector2[] {
        for (let i = 0; i < this.universe.bodyCount; i++) {
            this.f[i].setZero();
        }
        for (let i = 0; i < this.universe.bodyCount; i++) {
            for (let j = i + 1; j < this.universe.bodyCount; j++) {
                // pure gravity
                let sqdis = pos[i].sqDistance(pos[j]);
                if(!this.universe.collisions || sqdis>(this.universe.collisionRange*this.universe.collisionRange) ) {
                    let magnitude = 1/ Math.sqrt(sqdis);
                    this.dir = this.dir.sub(pos[i], pos[j]);
                    this.dir.normalize().mulEqual(magnitude);
                    this.f[i].subEqual(this.dir);
                    this.f[j].addEqual(this.dir);
                } else if (sqdis<this.universe.strongForceRange*this.universe.strongForceRange) {
                    this.universe.bodies[i].velocity = this.universe.bodies[j].velocity;
                    this.universe.bodies[i].position = this.universe.bodies[j].position;

                }
                else {
                    console.log('collision');
                    //chemical bonds
                    // this.dir = this.dir.sub(pos[i], pos[j]);
                    // let magnitude = 1/ Math.sqrt(sqdis);
                    // this.dir.normalize().mulEqual(magnitude);
                    pos[i].addEqual(pos[j]);
                    pos[j].set(pos[i]);
                    pos[i].mulEqual(0.5);
                    pos[j].mulEqual(0.5);

                    // this.f[i].subEqual(this.dir);
                    // this.f[j].addEqual(this.dir);
                }
            }
        }
        return this.f;
    }
    

    ff(state: State): State {
        let a = this.acc(state.bodies.map(b => b.position));
        for (let i = 0; i < state.bodies.length; i++) {
            this.ret_state.bodies[i].position = state.bodies[i].velocity;
            this.ret_state.bodies[i].velocity = a[i];
        }
        return this.ret_state;
    }

}

export default Universe;