# Project Rules – p5.js Steering Behaviors

## General Principles
- All motion and AI behaviors must follow the steering behaviors described by Craig Reynolds:
  - Seek
  - Flee
  - Arrive
  - Wander
  - Separation
  - Alignment
  - Cohesion
- Behaviors must be force-based and applied via acceleration vectors.

## Architecture Constraints
- The file `Vehicle.js` is a core base class and MUST NOT be modified.
- `Vehicle.js` contains shared properties and base behaviors for all vehicles.

## Extension Strategy
- To add new behaviors or visuals, you MUST:
  - Create subclasses that extend `Vehicle`
  - Override or specialize methods such as:
    - `applyBehaviors()`
    - `show()`
    - `update()`
- Do not duplicate logic already present in `Vehicle.js`.

## Code Style
- Use p5.Vector for all vector math.
- Avoid hard-coded magic numbers; use named constants.
- Behaviors should be modular and composable.

## Forbidden
- No direct position manipulation (`pos.x += ...`) outside physics updates.
- No behavioral logic inside `draw()`.

## Preferred
- Behaviors return a p5.Vector force.
- Forces are combined and weighted before being applied.
