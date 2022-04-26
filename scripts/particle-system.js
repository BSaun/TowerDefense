//------------------------------------------------------------------
//
// This is the particle system use by the game code
//
//------------------------------------------------------------------
MyGame.systems = function(assets) {
    'use strict';

    function ParticleSystem(spec) {
        let nextName = 1;       // Unique identifier for the next particle
        let particles = {};

        //------------------------------------------------------------------
        //
        // This creates one new particle
        //
        //------------------------------------------------------------------
        function create() {
            let size = Random.nextGaussian(spec.size.mean, spec.size.stdev);
            let p = {
                center: { x: spec.center.x, y: spec.center.y },
                size: { x: size, y: size },  // Making square particles
                direction: Random.nextCircleVector(),
                speed: Random.nextGaussian(spec.speed.mean, spec.speed.stdev), // pixels per second
                rotation: 0,
                lifetime: Random.nextGaussian(spec.lifetime.mean, spec.lifetime.stdev),    // How long the particle should live, in seconds
                alive: 0    // How long the particle has been alive, in seconds
            };

            return p;
        }

        //------------------------------------------------------------------
        //
        // Update the state of all particles.  This includes removing any that have exceeded their lifetime.
        //
        //------------------------------------------------------------------
        function update(elapsedTime) {
            let removeMe = [];

            if(spec.moveSpeed != 0) {
                let systemDirection = { x: Math.cos(spec.rotation), y: Math.sin(spec.rotation) }

                spec.center.x += spec.moveSpeed * elapsedTime * systemDirection.x;
                spec.center.y += spec.moveSpeed * elapsedTime * systemDirection.y;
            }

            //
            // We work with time in seconds, elapsedTime comes in as milliseconds
            elapsedTime = elapsedTime / 1000;

            Object.getOwnPropertyNames(particles).forEach(function (value, index, array) {
                let particle = particles[value];
                //
                // Update how long it has been alive
                particle.alive += elapsedTime;

                //
                // Update its center
                particle.center.x += (elapsedTime * particle.speed * particle.direction.x);
                particle.center.y += (elapsedTime * particle.speed * particle.direction.y);

                //
                // Rotate proportional to its speed
                particle.rotation += particle.speed / 500;

                //
                // If the lifetime has expired, identify it for removal
                if (particle.alive > particle.lifetime) {
                    removeMe.push(value);
                }
            });

            //
            // Remove all of the expired particles
            for (let particle = 0; particle < removeMe.length; particle++) {
                delete particles[removeMe[particle]];
            }
            removeMe.length = 0;
            spec.systemLifetime -= elapsedTime;

            //
            // Generate some new particles
            if (spec.systemLifetime > 0) {
                for (let particle = 0; particle < spec.density; particle++) {
                    //
                    // Assign a unique name to each particle
                    particles[nextName++] = create();
                }
            }
        }

        let that = {
            update: update,
            get image() { return spec.image; },
            get particles() { return particles; }
        };

        return that;
    }

    function creepDeath(spec) {
        return ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 5, stdev: 4 },
            speed: { mean: 50, stdev: 5 },
            lifetime: { mean: .25, stdev: .05 },
            systemLifetime: .5,
            density: 1,
            moveSpeed: 0,
            image: assets['smoke']
        });
    }

    function missileTrail(spec) {
        return ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 5, stdev: 4 },
            speed: { mean: 50, stdev: 5 },
            lifetime: { mean: .25, stdev: .05 },
            systemLifetime: 2,
            rotation: spec.rotation,
            density: 1,
            moveSpeed: spec.moveSpeed,
            image: assets['smoke']
        });
    }

    function sellTower(spec) {
        return ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 5, stdev: 4 },
            speed: { mean: 80, stdev: 5 },
            lifetime: { mean: .25, stdev: .05 },
            systemLifetime: .5,
            density: 1,
            moveSpeed: 0,
            image: assets['fireworks']
        });
    }

    function bombExplosion(spec) {
        return ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 7, stdev: 2 },
            speed: { mean: 200, stdev: 5 },
            lifetime: { mean: .15, stdev: .05 },
            systemLifetime: .25,
            density: 3,
            moveSpeed: 0,
            image: assets['fire']
        });
    }

    return {
        bombExplosion: bombExplosion,
        creepDeath: creepDeath,
        sellTower: sellTower,
        missileTrail: missileTrail
    }
}(MyGame.assets);
