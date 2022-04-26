
MyGame.objects = (function (graphics, assets, soundPlayer) {
    'use strict';

    //------------------------------------------------------------------
    //
    // Returns the magnitude of the 2D cross product.  The sign of the
    // magnitude tells you which direction to rotate to close the angle
    // between the two vectors.
    //
    //------------------------------------------------------------------
    function crossProduct2d(v1, v2) {
        return (v1.x * v2.y) - (v1.y * v2.x);
    }

    //------------------------------------------------------------------
    //
    // Computes the angle, and direction (cross product) between two vectors.
    //
    //------------------------------------------------------------------
    function computeAngle(rotation, ptCenter, ptTarget) {
        let v1 = {
            x: Math.cos(rotation),
            y: Math.sin(rotation)
        };
        let v2 = {
            x: ptTarget.x - ptCenter.x,
            y: ptTarget.y - ptCenter.y
        };

        v2.len = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        v2.x /= v2.len;
        v2.y /= v2.len;

        let dp = v1.x * v2.x + v1.y * v2.y;
        let angle = Math.acos(dp);

        //
        // Get the cross product of the two vectors so we can know
        // which direction to rotate.
        let cp = crossProduct2d(v1, v2);

        return {
            angle: angle,
            crossProduct: cp
        };
    }

    //------------------------------------------------------------------
    //
    // Simple helper function to help testing a value with some level of tolerance.
    //
    //------------------------------------------------------------------
    function testTolerance(value, test, tolerance) {
        if (Math.abs(value - test) < tolerance) {
            return true;
        } else {
            return false;
        }
    }

    //------------------------------------------------------------------
    //
    // Simple helper function to help test if a target is in range of a tower.
    //
    //------------------------------------------------------------------
    function testRange(targetX, targetY, turretX, turretY, range) {
        let distance = Math.sqrt((targetX - turretX) ** 2 + (targetY - turretY) ** 2)
        if (range < distance) {
            return false;
        }
        return true;
    }

    //------------------------------------------------------------------
    //
    // Defines a creep that moves towards the end-zone
    //
    //------------------------------------------------------------------
    function Creep(spec) {
        let that = {};
        that.isFlying = spec.flying;

        that.score = spec.score;
        let creepSprite = graphics.AnimatedSprite({
            sprite: spec.sprite,
            center: spec.center,
            size: spec.size,
            intervals: spec.intervalArray,
            rotation: spec.rotation
        });

        let currentDirection = spec.direction;
        let moveTime = 0;
        let protectedMove = false;

        that.active = true;
        that.escaped = false;

        that.center = spec.center;
        that.size = spec.size;

        that.currentHealth = spec.currentHealth

        that.update = function (elapsedTime) {
            if (!spec.flying) {
                getDirection();
            }
            spec.center.x += spec.moveSpeed * elapsedTime * currentDirection.x;
            spec.center.y += spec.moveSpeed * elapsedTime * currentDirection.y;
            if (that.currentHealth <= 0) {
                that.active = false;
            }
            if (moveTime > 0) {
                moveTime -= elapsedTime;
            }
            if (spec.center.x > graphics.SHOP_BEGIN || spec.center.y < 0) {
                that.escaped = true;
                that.active = false;
            }
            creepSprite.update(elapsedTime);
        };

        function getDirection() {
            let indexX = parseInt(spec.center.x / graphics.CELL_WIDTH);
            let indexY = parseInt(spec.center.y / graphics.CELL_HEIGHT);
            if (indexX > 0 && indexX < 14 && indexY > 0 && indexY < 14) {
                let nextDirection = spec.maze[indexX][indexY].direction;
                if (nextDirection == currentDirection || (moveTime > 0 && protectedMove)) {
                    return;
                }
                else if (!protectedMove && moveTime <= 0) {
                    protectedMove = true;
                    moveTime = Random.nextRange((spec.size.width / 2) / spec.moveSpeed, (graphics.CELL_WIDTH - spec.size.width / 2) / spec.moveSpeed);
                    return;
                }
                else {
                    currentDirection = nextDirection;
                    protectedMove = false;

                    switch (currentDirection.x) {
                        case -1:
                            spec.rotation = Math.PI;
                            break;
                        case 1:
                            spec.rotation = 0;
                            break;
                        default:
                            switch (currentDirection.y) {
                                case -1:
                                    spec.rotation = Math.PI * (3 / 2);

                                    break;
                                case 1:
                                    spec.rotation = Math.PI / 2;
                                    break;
                            }
                    }
                    creepSprite.changeRotation(spec.rotation);
                }
            }
        }

        that.render = function () {
            creepSprite.draw();
            spec.currentHealth = that.currentHealth;
            graphics.drawHealthbar(spec);
        };

        return that;
    }

    function baseCreep(spec) {
        spec.sprite = assets['creep'];
        spec.score = 10;
        spec.intervalArray = [250, 250, 250, 250];
        spec.moveSpeed = graphics.CELL_WIDTH / 1500;
        spec.fullHealth = 75;
        spec.currentHealth = 75;
        spec.flying = false;
        return Creep(spec)
    }

    function tankCreep(spec) {
        spec.sprite = assets['tank'];
        spec.score = 10;
        spec.intervalArray = [250, 250, 250, 250];
        spec.moveSpeed = graphics.CELL_WIDTH / 2500;
        spec.fullHealth = 200;
        spec.currentHealth = 200;
        spec.flying = false;
        return Creep(spec)
    }

    function flyCreep(spec) {
        spec.sprite = assets['flyer'];
        spec.score = 10;
        spec.intervalArray = [250, 250, 250, 250, 250, 250];
        spec.moveSpeed = graphics.CELL_WIDTH / 2000;
        spec.fullHealth = 100;
        spec.currentHealth = 100;
        spec.flying = true;
        return Creep(spec)
    }

    //------------------------------------------------------------------
    //
    // Defines a cell that holds information for which direction creeps should move
    // and if there is a tower in the associated grid square.
    //
    //------------------------------------------------------------------
    function MazeCell(spec) {
        let that = {};

        that.tower = false;
        that.towerReference = null;
        that.parent = null;
        that.direction = { x: 1, y: 0 };
        that.x = spec.coords.x;
        that.y = spec.coords.y;
        that.gCost = 0;
        that.hCost = 0;
        that.fCost = spec.gCost + spec.hCost;

        that.setDirection = function (nextCell) {
            that.direction = { x: nextCell.x - that.x, y: nextCell.y - that.y }
        };

        that.setTower = function () {
            that.tower = true;
        };

        that.removeTower = function () {
            that.tower = false;
        }

        return that;
    }

    //------------------------------------------------------------------
    //
    // Defines a tower that has a base sprite and a weapon sprite that will
    // rotate towards the current 'target'.
    //
    //------------------------------------------------------------------
    function Tower(spec) {
        let that = {};

        that.score = spec.score;
        that.placeCost = spec.placeCost;
        that.refundCost = Math.floor(spec.placeCost * .75);
        that.center = spec.center;

        let costText = Text({
            text: spec.costText,
            font: '24pt Times New Roman',
            fillStyle: 'rgba(255, 255, 255, 1)',
            strokeStyle: 'rgba(0, 0, 0, 1)',
            position: {x: spec.center.x - spec.size.width / 2, y: spec.center.y + spec.size.height / 2}
        });

        let hasTarget = false;
        let weaponSprite = graphics.Sprite({
            sprite: spec.weaponSprites[0],
            size: spec.size,
            center: spec.center,
            rotation: 0
        });
        let baseSprite = graphics.Sprite({
            sprite: assets['base'],
            size: spec.size,
            center: spec.center,
            rotation: 0
        });

        that.coords = { x: spec.coords.x, y: spec.coords.y }

        spec.rotation = -Math.PI / 2;
        let upgradeCooldown = 800;
        let shootCooldown = spec.fireCooldown;

        that.active = true;

        //------------------------------------------------------------------
        //
        // Here we check to see if the tower should still rotate towards the target.
        //
        //------------------------------------------------------------------
        that.update = function (elapsedTime) {
            if (spec.creepList.length == 0) {
                spec.target = {
                    x: spec.center.x,
                    y: spec.center.y + 1
                };
                hasTarget = false;
            }
            else {
                for (let i = 0; i < spec.creepList.length; i++) {
                    let creepX = spec.creepList[i].center.x
                    let creepY = spec.creepList[i].center.y
                    if ((spec.creepList[i].isFlying == spec.flying || !spec.creepList[i].isFlying == spec.ground) 
                    && testRange(creepX, creepY, spec.center.x, spec.center.y, spec.range) && creepX > 0 && creepY > 0) {
                        this.setTarget(creepX, creepY);
                        hasTarget = true;
                        break;
                    }
                    spec.target = {
                        x: spec.center.x,
                        y: spec.center.y + 1
                    };
                    hasTarget = false;
                }
            }
            // Check to see if the tower is pointing at the target or not
            let result = computeAngle(spec.rotation, spec.center, spec.target);
            if (testTolerance(result.angle, 0, .05) === false) {
                if (result.crossProduct > 0) {
                    weaponSprite.rotateRight(spec.rotateRate);
                    spec.rotation += spec.rotateRate;
                } else {
                    weaponSprite.rotateLeft(spec.rotateRate);
                    spec.rotation -= spec.rotateRate;
                }
            }
            else {
                if (hasTarget && shootCooldown <= 0) {
                    spec.fire();
                    shootCooldown = spec.fireCooldown;
                }
            }
            if (upgradeCooldown > 0) {
                upgradeCooldown -= elapsedTime;
            }
            if (shootCooldown > 0) {
                shootCooldown -= elapsedTime;
            }
        };


        //------------------------------------------------------------------
        //
        // Two parts to the tower, a base and the weapon.
        //
        //------------------------------------------------------------------
        that.render = function () {
            baseSprite.draw();
            weaponSprite.draw();
            //
            // A little hack job to show something interesting.
            if (spec.renderRange) {
                weaponSprite.drawArc(spec.range);
            }
            if (spec.renderCost) {
                costText.render();
            }
        };

        //------------------------------------------------------------------
        //
        // Point we want our weapon to point at.
        //
        //------------------------------------------------------------------
        that.setTarget = function (x, y) {
            if (testRange(x, y, spec.center.x, spec.center.y, spec.range)) {
                spec.target = {
                    x: x,
                    y: y
                };
            }
        };

        that.toggleRangeRender = function () {
            spec.renderRange = !spec.renderRange;
        }

        that.sell = function () {
            this.active = false;
        }

        that.upgrade = function () {
            if (spec.level < 3 && upgradeCooldown <= 0) {
                spec.level += 1;
                weaponSprite.changeSprite(spec.weaponSprites[spec.level - 1]);
                spec.fireCooldown -= (spec.fireCooldown * .25);
                spec.range += (spec.range * .10);

                upgradeCooldown = 800;
                that.refundCost += Math.floor(that.refundCost * .75);
                return true
            }
            return false
        }

        that.beenClicked = function (e) {
            return e.clientX >= spec.center.x - spec.size.width / 2 &&
                e.clientX <= spec.center.x + spec.size.width / 2 &&
                e.clientY >= spec.center.y - spec.size.height / 2 &&
                e.clientY <= spec.center.y + spec.size.height / 2
        }

        that.getType = function () {
            return spec.type;
        }

        return that;
    }

    //------------------------------------------------------------------
    //
    // Defines a wall that acts as a barrier for creeps
    //
    //------------------------------------------------------------------
    function Wall(spec) {
        let that = {};

        let baseSprite = graphics.Sprite({
            sprite: assets['base'],
            size: spec.size,
            center: spec.center,
            rotation: 0
        });

        that.render = function () {
            baseSprite.draw();
        };

        that.coords = { x: spec.coords.x, y: spec.coords.y }

        that.active = true;

        return that;
    };

    function simpleTower(spec) {
        spec.weaponSprites = [assets['proj1'], assets['proj2'], assets['proj3']];
        spec.range = 150;
        spec.type = 1;
        spec.score = 25;
        spec.placeCost = 50;
        spec.ground = true;
        spec.flying = false;
        spec.costText = 'Projectile: $' + spec.placeCost.toString();

        spec.fire = function () {
            let bulletSpec = JSON.parse(JSON.stringify(spec));
            bulletSpec.moveSpeed = graphics.CELL_WIDTH / 100;
            bulletSpec.damage = 10;
            spec.bullets.push(bullet(bulletSpec));
            soundPlayer.stopSound('proj_fire');
            soundPlayer.playSound('proj_fire', false);
        };
        spec.fireCooldown = 1000;

        let that = Tower(spec);
        return that;
    }

    function bombTower(spec) {
        spec.weaponSprites = [assets['bomb1'], assets['bomb2'], assets['bomb3']];
        spec.range = 250;
        spec.type = 2;
        spec.score = 50;
        spec.placeCost = 300;
        spec.ground = true;
        spec.flying = false;
        spec.costText = 'Bomb: $' + spec.placeCost.toString();

        spec.fire = function () {
            let bulletSpec = JSON.parse(JSON.stringify(spec));
            bulletSpec.moveSpeed = graphics.CELL_WIDTH / 500;
            bulletSpec.damage = 10;
            spec.bullets.push(bomb(bulletSpec));
            soundPlayer.stopSound('bomb_fire');
            soundPlayer.playSound('bomb_fire', false);
        };
        spec.fireCooldown = 2000;

        let that = Tower(spec);
        return that;
    }

    function missileTower(spec) {
        spec.weaponSprites = [assets['mis1'], assets['mis2'], assets['mis3']];
        spec.range = 200;
        spec.type = 3;
        spec.score = 50;
        spec.placeCost = 100;
        spec.ground = false;
        spec.flying = true;
        spec.costText = 'Missile: $' + spec.placeCost.toString();

        spec.fire = function () {
            let bulletSpec = JSON.parse(JSON.stringify(spec));
            bulletSpec.moveSpeed = graphics.CELL_WIDTH / 100;
            bulletSpec.damage = 10;
            spec.bullets.push(missile(bulletSpec));
            soundPlayer.stopSound('miss_fire');
            soundPlayer.playSound('miss_fire', false);
        };
        spec.fireCooldown = 600;

        let that = Tower(spec);
        return that;
    }


    function flakTower(spec) {
        spec.weaponSprites = [assets['flak1'], assets['flak2'], assets['flak3']];
        spec.range = 100;
        spec.type = 4;
        spec.score = 100;
        spec.placeCost = 200;
        spec.ground = true;
        spec.flying = true;
        spec.costText = 'Flak: $' + spec.placeCost.toString();

        spec.fire = function () {
            let bulletSpec = JSON.parse(JSON.stringify(spec));
            bulletSpec.moveSpeed = graphics.CELL_WIDTH / 100;
            bulletSpec.damage = 1.5;
            spec.bullets.push(bullet(bulletSpec));
            spec.bullets.push(bullet(bulletSpec));
            soundPlayer.stopSound('flak_fire');
            soundPlayer.playSound('flak_fire', false);
        };
        spec.fireCooldown = 200;

        let that = Tower(spec);
        return that;
    }

    function bullet(spec) {
        let that = {};
        that.active = true;
        that.type = 1;
        that.flying = spec.flying;
        that.ground = spec.ground;

        let bulletSprite = graphics.Sprite({
            sprite: assets['proj1'],
            center: spec.center,
            size: { width: spec.size.width / 3, height: spec.size.height / 3 },
            rotation: spec.rotation
        });

        let direction = { x: Math.cos(spec.rotation), y: Math.sin(spec.rotation) }

        that.update = function (elapsedTime) {
            spec.center.x += spec.moveSpeed * elapsedTime * direction.x;
            spec.center.y += spec.moveSpeed * elapsedTime * direction.y;

            if (spec.center.x < 0 || spec.center.x > graphics.SHOP_BEGIN || spec.center.y < 0 || spec.center.y > graphics.CANVAS_HEIGHT) {
                that.active = false;
            }
        };

        that.render = function () {
            bulletSprite.draw();
        };
        that.center = spec.center;
        that.size = spec.size;
        that.damage = spec.damage;

        return that;
    }

    function bomb(spec) {
        let that = {};
        that.active = true;
        that.type = 2;
        that.flying = spec.flying;
        that.ground = spec.ground;

        let bulletSprite = graphics.Sprite({
            sprite: assets['mis1'],
            center: spec.center,
            size: { width: spec.size.width / 3, height: spec.size.height / 3 },
            rotation: spec.rotation
        });

        let direction = { x: Math.cos(spec.rotation), y: Math.sin(spec.rotation) }

        that.update = function (elapsedTime) {
            spec.center.x += spec.moveSpeed * elapsedTime * direction.x;
            spec.center.y += spec.moveSpeed * elapsedTime * direction.y;

            if (spec.center.x < 0 || spec.center.x > graphics.SHOP_BEGIN || spec.center.y < 0 || spec.center.y > graphics.CANVAS_HEIGHT) {
                that.active = false;
            }
        };

        that.render = function () {
            bulletSprite.draw();
        };
        that.center = spec.center;
        that.size = spec.size;
        that.damage = spec.damage;
        that.radius = spec.size.width * 1.5

        return that;
    }

    function missile(spec) {
        let that = {};
        that.active = true;
        that.type = 1;
        that.flying = spec.flying;
        that.ground = spec.ground;

        let bulletSprite = graphics.Sprite({
            sprite: assets['proj1'],
            center: spec.center,
            size: { width: spec.size.width / 3, height: spec.size.height / 3 },
            rotation: spec.rotation
        });

        let direction = { x: Math.cos(spec.rotation), y: Math.sin(spec.rotation) }

        that.update = function (elapsedTime) {
            spec.center.x += spec.moveSpeed * elapsedTime * direction.x;
            spec.center.y += spec.moveSpeed * elapsedTime * direction.y;

            if (spec.center.x < 0 || spec.center.x > graphics.SHOP_BEGIN || spec.center.y < 0 || spec.center.y > graphics.CANVAS_HEIGHT) {
                that.active = false;
            }
        };

        that.render = function () {
            bulletSprite.draw();
        };
        that.center = spec.center;
        that.size = spec.size;
        that.damage = spec.damage;

        return that;
    }

    function Text(spec) {
        let that = {};
        that.active = true;
        that.updateText = function(newText) {spec.text = newText}
        that.render = function () {
            graphics.drawText(spec);
        }
        that.update = function(elapsedTime) {
            spec.position.y -= (graphics.CELL_HEIGHT / 1000) * elapsedTime;
            spec.time -= elapsedTime;
            if (spec.time <= 0) {
                that.active = false;
            }
        }
    
        return that;
    }

    return {
        MazeCell: MazeCell,
        baseCreep: baseCreep,
        flyCreep: flyCreep,
        tankCreep: tankCreep,
        Wall: Wall,
        Text: Text,
        simpleTower: simpleTower,
        missileTower: missileTower,
        bombTower: bombTower,
        flakTower: flakTower
    };

}(MyGame.graphics, MyGame.assets, MyGame.player));