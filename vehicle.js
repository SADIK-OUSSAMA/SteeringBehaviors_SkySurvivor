/*
  Base Vehicle class - copied from 6-ObstacleAvoidance
  Contains all steering behaviors: seek, flee, pursue, evade, arrive, wander, avoid, boundaries, separate
  
  Per rules.md: This file MUST NOT be modified.
  Create subclasses that extend Vehicle instead.
*/

function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

class Vehicle {
  static debug = false;

  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 4;
    this.maxForce = 0.2;
    this.color = "white";
    this.r_pourDessin = 16;
    this.r = this.r_pourDessin * 3;
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;

    // Wander parameters
    this.distanceCercle = 200;
    this.wanderRadius = 80;
    this.wanderTheta = -Math.PI / 2;
    this.displaceRange = 0.3;

    // Behavior weights
    this.seekWeight = 0.3;
    this.avoidWeight = 3;
    this.separateWeight = 0.1;
    this.boundariesWeight = 3;
    this.wanderForceWeight = 0;
  }

  applyBehaviors() {
    // Override in subclasses
  }

  avoid(obstacles) {
    let ahead = this.vel.copy();
    ahead.mult(30);
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);

    let pointAuBoutDeAhead = this.pos.copy().add(ahead);
    let pointAuBoutDeAhead2 = this.pos.copy().add(ahead2);

    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    let distance1 = pointAuBoutDeAhead.dist(obstacleLePlusProche.pos);
    let distance2 = pointAuBoutDeAhead2.dist(obstacleLePlusProche.pos);
    let distance = min(distance1, distance2);

    if (distance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
      let force;
      if (distance1 < distance2) {
        force = p5.Vector.sub(pointAuBoutDeAhead, obstacleLePlusProche.pos);
      } else {
        force = p5.Vector.sub(pointAuBoutDeAhead2, obstacleLePlusProche.pos);
      }
      force.setMag(this.maxSpeed);
      force.sub(this.vel);
      force.limit(this.maxForce / 2);
      return force;
    } else {
      return createVector(0, 0);
    }
  }

  wander() {
    let pointDevant = this.vel.copy();
    pointDevant.setMag(this.distanceCercle);
    pointDevant.add(this.pos);

    let theta = this.wanderTheta + this.vel.heading();
    let pointSurLeCercle = createVector(0, 0);
    pointSurLeCercle.x = this.wanderRadius * cos(theta);
    pointSurLeCercle.y = this.wanderRadius * sin(theta);
    pointSurLeCercle.add(pointDevant);

    this.wanderTheta += random(-this.displaceRange, this.displaceRange);

    let force = p5.Vector.sub(pointSurLeCercle, this.pos);
    force.setMag(this.maxForce);

    return force;
  }

  boundaries(bx, by, bw, bh, d) {
    let vitesseDesiree = null;

    const xBordGauche = bx + d;
    const xBordDroite = bx + bw - d;
    const yBordHaut = by + d;
    const yBordBas = by + bh - d;

    if (this.pos.x < xBordGauche) {
      vitesseDesiree = createVector(this.maxSpeed, this.vel.y);
    } else if (this.pos.x > xBordDroite) {
      vitesseDesiree = createVector(-this.maxSpeed, this.vel.y);
    }

    if (this.pos.y < yBordHaut) {
      vitesseDesiree = createVector(this.vel.x, this.maxSpeed);
    } else if (this.pos.y > yBordBas) {
      vitesseDesiree = createVector(this.vel.x, -this.maxSpeed);
    }

    if (vitesseDesiree !== null) {
      vitesseDesiree.setMag(this.maxSpeed);
      const force = p5.Vector.sub(vitesseDesiree, this.vel);
      vitesseDesiree.limit(this.maxForce);
      return vitesseDesiree;
    }

    return createVector(0, 0);
  }

  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      const distance = this.pos.dist(o.pos);
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;
  }

  arrive(target, d = 0) {
    return this.seek(target, true, d);
  }

  seek(target, arrival = false, d = 0) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    if (arrival) {
      let slowRadius = 100;
      let distance = force.mag();
      if (distance < slowRadius) {
        desiredSpeed = map(distance, d, slowRadius, 0, this.maxSpeed);
      }
    }
    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }

  flee(target) {
    return this.seek(target).mult(-1);
  }

  pursue(vehicle) {
    let target = vehicle.pos.copy();
    let prediction = vehicle.vel.copy();
    prediction.mult(10);
    target.add(prediction);
    return this.seek(target);
  }

  evade(vehicle) {
    let pursuit = this.pursue(vehicle);
    pursuit.mult(-1);
    return pursuit;
  }

  separate(boids) {
    let desiredseparation = this.r;
    let steer = createVector(0, 0, 0);
    let count = 0;

    for (let i = 0; i < boids.length; i++) {
      let other = boids[i];
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredseparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }

    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxSpeed);
      steer.sub(this.vel);
      steer.limit(this.maxForce);
    }
    return steer;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);
  }

  show() {
    this.drawVehicle();
  }

  drawVehicle() {
    stroke(255);
    strokeWeight(2);
    fill(this.color);

    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.vel.heading());
    triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
    pop();
  }

  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}
