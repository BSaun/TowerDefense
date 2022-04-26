//------------------------------------------------------------------
//
// This function provides the "game" code.
//
//------------------------------------------------------------------
MyGame.screens['game-play'] = (function (game, objects, graphics, input, systems, assets, soundPlayer) {
    'use strict';

    let lastTimeStamp = performance.now();
    let cancelNextRequest = true;
    let LEFT_CELL = {};
    let RIGHT_CELL = {};
    let UP_CELL = {};
    let DOWN_CELL = {};
    let vertical = false;

    let towerType = 1;
    let level = 1;
    let creepCounts = [3, 5, 2]
    let levelCooldown = 0;
    let score = 0;
    let playerHealth = 30;
    let money = 1000;
    let myScore = objects.Text({
        text: 'Score: ' + score.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: { x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 }
    });
    let myHealth = objects.Text({
        text: 'Life: ' + playerHealth.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: { x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 2 }
    });
    let myMoney = objects.Text({
        text: 'Money: ' + money.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: { x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 3 }
    });
    let myLevel = objects.Text({
        text: 'Level: ' + level.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: { x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 4 }
    });

    let particlesList = [];

    let MAZE_SIZE = 15;

    let shopList = [];
    let placingTower = false;
    let selectingTower = false;


    let maze = [];
    let startCell = {};
    let lastCell = {};
    let shortestPathH = [];
    let shortestPathV = [];

    let myKeyboard = {};
    let myMouse = input.Mouse();

    let creeps = [];
    let walls = [];
    let bullets = [];
    let floatingScores = [];

    let potentialTurret = formTower(MAZE_SIZE * 2, MAZE_SIZE * 2, towerType, false);

    let towers = [];
    let selected = {};
    let prevX = MAZE_SIZE * 2;
    let prevY = MAZE_SIZE * 2;

    for (let i = 1; i < 5; i++) {
        let icon = formShopTower(i, 4);
        shopList.push(icon);
    }

    function compareNumbers(a, b) {
        return b - a;
    }

    function inExplosiveRange(bulletSpec, spec2) {
        return bulletSpec.radius >= Math.sqrt((bulletSpec.center.x - spec2.center.x) ** 2 + (bulletSpec.center.y - spec2.center.y) ** 2)
    }

    function findShortestPath(startCell, lastCell) {
        let open = [];
        let closed = [];

        open.push(startCell);

        while (open.length > 0) {
            let current = open[0];
            let currentCellIndex = 0;
            for (let i = 1; i < open.length; i++) {
                if (open[i].fCost < current.fCost || open[i].fCost == current.fCost && open[i].hCost < current.hCost) {
                    current = open[i];
                    currentCellIndex = i;
                }
            }

            open.splice(currentCellIndex, 1);
            closed.push(current);

            if (current == lastCell) {
                return retrace(startCell, lastCell);
            }

            if (current.x < MAZE_SIZE - 1 && maze[current.x + 1][current.y] !== undefined && !closed.includes(maze[current.x + 1][current.y]) && !maze[current.x + 1][current.y].tower) {
                calculateCost(current, maze[current.x + 1][current.y], open, lastCell);
            }

            if (current.x > 0 && maze[current.x - 1][current.y] !== undefined && !closed.includes(maze[current.x - 1][current.y]) && !maze[current.x - 1][current.y].tower) {
                calculateCost(current, maze[current.x - 1][current.y], open, lastCell);
            }

            if (current.y < MAZE_SIZE - 1 && maze[current.x][current.y + 1] !== undefined && !closed.includes(maze[current.x][current.y + 1]) && !maze[current.x][current.y + 1].tower) {
                calculateCost(current, maze[current.x][current.y + 1], open, lastCell);
            }

            if (current.y > 0 && maze[current.x][current.y - 1] !== undefined && !closed.includes(maze[current.x][current.y - 1]) && !maze[current.x][current.y - 1].tower) {
                calculateCost(current, maze[current.x][current.y - 1], open, lastCell);
            }
        }
    }

    function getDistance(a, b) {
        let dX = Math.abs(a.x - b.x);
        let dY = Math.abs(a.y - b.y);

        return dX + dY;
    }

    function calculateCost(currentCell, neighbor, open, lastCell) {
        let newCost = currentCell.gCost + getDistance(currentCell, neighbor);
        if (newCost < neighbor.gCost || !open.includes(neighbor)) {
            neighbor.gCost = newCost;
            neighbor.hCost = getDistance(neighbor, lastCell);
            neighbor.fCost = neighbor.hCost + neighbor.gCost;
            neighbor.parent = currentCell;

            if (!open.includes(neighbor)) {
                open.push(neighbor);
            }
        }
    }

    function formPath() {
        for (let i = 0; i < shortestPathH.length - 1; i++) {
            shortestPathH[i].setDirection(shortestPathH[i + 1], false)
        }
        for (let i = 0; i < shortestPathV.length - 1; i++) {
            shortestPathV[i].setDirection(shortestPathV[i + 1], true)
        }
    }

    function retrace(start, end) {
        let path = [];
        let currentCell = end;

        while (currentCell != start) {
            path.push(currentCell);
            currentCell = currentCell.parent;
        }
        path.push(start);
        return path.reverse();
    }

    //------------------------------------------------------------------
    //
    // Process the registered input handlers here.
    //
    //------------------------------------------------------------------
    function processInput(elapsedTime) {
        myMouse.update(elapsedTime);
        myKeyboard.update(elapsedTime);
    }

    //------------------------------------------------------------------
    //
    // Update the state of the "model" based upon time.
    //
    //------------------------------------------------------------------
    function update(elapsedTime) {
        for (let i = 0; i < particlesList.length; i++) {
            particlesList[i].update(elapsedTime);
        }
        for (let i = 0; i < floatingScores.length; i++) {
            floatingScores[i].update(elapsedTime);
            if (!floatingScores[i].active) {
                floatingScores.splice(i, 1);
            }
        }
        for (let i = 0; i < towers.length; i++) {
            towers[i].update(elapsedTime);
            if (!towers[i].active) {
                towers.splice(i, 1)
            }
        }
        for (let i = 0; i < creeps.length; i++) {
            creeps[i].update(elapsedTime);
            if (!creeps[i].active) {
                if (creeps[i].escaped) {
                    playerHealth -= 1;
                    creeps.splice(i, 1);
                }
                else {
                    particlesList.push(createSmokeParticles(creeps[i]));
                    floatingScores.push(createFloatingScore(creeps[i]));
                    let reward = creeps.splice(i, 1)[0].score;
                    score += reward;
                    money += reward;
                }
            }
        }
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].update(elapsedTime);
            for (let j = 0; j < creeps.length; j++) {
                if (intersectBullets(bullets[i], creeps[j])) {
                    let canHit = bullets[i].flying == creeps[j].isFlying || bullets[i].ground == !creeps[j].isFlying;
                    if (bullets[i].type == 1 && canHit) {
                        creeps[j].currentHealth -= bullets[i].damage;
                        bullets[i].active = false;
                    }
                    else if (canHit) {
                        creeps[j].currentHealth -= bullets[i].damage;
                        bullets[i].active = false;
                        particlesList.push(createExplosionParticles(bullets[i]))
                        for (let k = 0; k < creeps.length; k++) {
                            if (inExplosiveRange(bullets[i], creeps[k])) {
                                creeps[k].currentHealth -= bullets[i].damage;
                            }
                        }
                    }
                }
            }
            if (!bullets[i].active) {
                bullets.splice(i, 1);
            }
        }
        if (levelCooldown > 0) {
            levelCooldown -= elapsedTime;
        }

    }

    //------------------------------------------------------------------
    //
    // Render the state of the game.
    //
    //------------------------------------------------------------------
    function render() {
        graphics.clear();
        graphics.drawGrid(MAZE_SIZE);
        for (let i = 0; i < towers.length; i++) {
            towers[i].render();
        }
        for (let i = 0; i < walls.length; i++) {
            walls[i].render();
        }
        potentialTurret.render();
        for (let i = 0; i < creeps.length; i++) {
            creeps[i].render();
        }
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].render();
        }
        graphics.drawShop();
        for (let i = 0; i < shopList.length; i++) {
            shopList[i].render();
        }
        myScore.updateText('Score: ' + score.toString());
        myScore.render();
        myHealth.updateText('Life: ' + playerHealth.toString());
        myHealth.render();
        myMoney.updateText('Money: ' + money.toString());
        myMoney.render();
        myLevel.updateText('Level: ' + level.toString());
        myLevel.render();
        for (let i = 0; i < particlesList.length; i++) {
            graphics.renderParticles(particlesList[i]);
        }
        for (let i = 0; i < floatingScores.length; i++) {
            floatingScores[i].render();
        }
    }

    //------------------------------------------------------------------
    //
    // This is the Game Loop function!
    //
    //------------------------------------------------------------------
    function gameLoop(time) {
        let elapsedTime = time - lastTimeStamp;
        lastTimeStamp = time;

        processInput(elapsedTime);
        update(elapsedTime);
        render();

        if (!cancelNextRequest) {
            requestAnimationFrame(gameLoop);
        }
    }

    function initialize() {
        maze = []
        for (let i = 0; i < MAZE_SIZE; i++) {
            maze.push([])
            for (let j = 0; j < MAZE_SIZE; j++) {
                maze[i].push(objects.MazeCell({
                    coords: { x: i, y: j }
                }));
            }
        }

        LEFT_CELL = maze[0][7];
        RIGHT_CELL = maze[14][7];
        UP_CELL = maze[7][0];
        DOWN_CELL = maze[7][14];
        UP_CELL.direction = {x: 0, y: 1}
        DOWN_CELL.direction = {x: 0, y: 1}
        let entryPoints = [LEFT_CELL, RIGHT_CELL, UP_CELL, DOWN_CELL];

        startCell = LEFT_CELL;
        lastCell = RIGHT_CELL;
        for (let i = 0; i < MAZE_SIZE; i++) {
            let wall = {};
            if (!entryPoints.includes(maze[i][0])) {
                wall = formWall(i, 0);
                walls.push(wall);
                maze[i][0].setTower();
            }
            if (!entryPoints.includes(maze[0][i])) {
                wall = formWall(0, i);
                walls.push(wall);
                maze[0][i].setTower();
            }
            if (!entryPoints.includes(maze[MAZE_SIZE - 1][i])) {
                wall = formWall(MAZE_SIZE - 1, i);
                walls.push(wall);
                maze[MAZE_SIZE - 1][i].setTower();
            }
            if (!entryPoints.includes(maze[i][MAZE_SIZE - 1])) {
                wall = formWall(i, MAZE_SIZE - 1);
                walls.push(wall);
                maze[i][MAZE_SIZE - 1].setTower();
            }
        }

        LEFT_CELL.removeTower();
        RIGHT_CELL.removeTower();
        UP_CELL.removeTower();
        DOWN_CELL.removeTower();

        shortestPathH = findShortestPath(LEFT_CELL, RIGHT_CELL);
        shortestPathV = findShortestPath(UP_CELL, DOWN_CELL);
        formPath();

        if (localStorage.getItem('MyGame.highscores') === null) {
            localStorage['MyGame.highscores'] = JSON.stringify([0, 0, 0, 0, 0])
        }
        if (localStorage.getItem('MyGame.controls') === null) {
            localStorage['MyGame.controls'] = JSON.stringify([85, 83, 71]);
        }

        //
        // Whenever the mouse is moved, check to see if a potential turret needs to be rendered,
        // render if necessary. Otherwise, store the potential turret object offscreen
        myMouse.registerCommand('mousemove', function (e, elapsedTime) {
            let indexX = parseInt(e.clientX / graphics.CELL_WIDTH);
            let indexY = parseInt(e.clientY / graphics.CELL_HEIGHT);
            if (indexX > 0 && indexX < 14 && indexY > 0 && indexY < 14 && placingTower) {
                if (!(prevX == indexX && prevY == indexY)) {
                    potentialTurret = formTower(indexX, indexY, towerType, true);
                    prevX = indexX;
                    prevY = indexY;
                }
            }
            else {
                potentialTurret = formTower(MAZE_SIZE * 2, MAZE_SIZE * 2, towerType, false);
                prevX = MAZE_SIZE * 2;
                prevY = MAZE_SIZE * 2;
            }
        });

        myMouse.registerCommand('mousedown', function (e) {
            let indexX = parseInt(e.clientX / graphics.CELL_WIDTH);
            let indexY = parseInt(e.clientY / graphics.CELL_HEIGHT);
            if (indexX > 0 && indexX < 14 && indexY > 0 && indexY < 14) {
                if (placingTower) {
                    placeTower(indexX, indexY);
                }
                else {
                    if (maze[indexX][indexY].tower) {
                        if (!isEmpty(selected)) {
                            selected.toggleRangeRender();
                        }
                        selected = maze[indexX][indexY].towerReference
                        if (!isEmpty(selected)) {
                            selected.toggleRangeRender();
                        }
                    }
                }
            }

            else {
                for (let i = 0; i < shopList.length; i++) {
                    if (shopList[i].beenClicked(e)) {
                        let tower = formTower(indexX, indexY, shopList[i].getType(), false);
                        if (tower.placeCost <= money) {
                            towerType = shopList[i].getType();
                            placingTower = true;
                            selectingTower = false;
                            if (!isEmpty(selected)) {
                                selected.toggleRangeRender();
                                selected = {};
                            }
                        }
                    }
                }
            }
        })
    }

    function hasTower(indexX, indexY) {
        return maze[indexX][indexY].tower
    }

    function formTower(indexX, indexY, type, renderRange) {
        let spec = {
            center: { x: graphics.CELL_WIDTH * indexX + graphics.CELL_WIDTH / 2, y: graphics.CELL_HEIGHT * indexY + graphics.CELL_HEIGHT / 2 },
            size: { width: graphics.CELL_WIDTH, height: graphics.CELL_HEIGHT },
            target: { x: 200, y: 100 },
            range: 100,
            level: 1,
            coords: { x: indexX, y: indexY },
            creepList: creeps,
            renderRange: renderRange,
            renderCost: false,
            bullets: bullets,
            rotateRate: 20 * 3.14159 / 1000 // radians per second
        }
        switch (type) {
            case 1:
                return objects.simpleTower(spec);
            case 2:
                return objects.bombTower(spec);
            case 3:
                return objects.missileTower(spec);
            case 4:
                return objects.flakTower(spec);
            default:
                console.log("No Turret")
        }
    }

    function formWall(indexX, indexY) {
        let spec = {
            center: { x: graphics.CELL_WIDTH * indexX + graphics.CELL_WIDTH / 2, y: graphics.CELL_HEIGHT * indexY + graphics.CELL_HEIGHT / 2 },
            size: { width: graphics.CELL_WIDTH, height: graphics.CELL_HEIGHT },
            coords: { x: indexX, y: indexY }
        }

        return objects.Wall(spec);
    }


    function formShopTower(index, num_towers) {
        let spec = {
            center: { x: (graphics.SHOP_END - graphics.SHOP_BEGIN) / 2 + graphics.SHOP_BEGIN, y: (graphics.CANVAS_HEIGHT * 2 / 3) / (num_towers + 1) * (index - 1) + 100 },
            size: { width: (graphics.SHOP_END - graphics.SHOP_BEGIN) / num_towers, height: (graphics.SHOP_END - graphics.SHOP_BEGIN) / num_towers },
            target: { x: 0, y: 0 },
            range: 0,
            level: 1,
            coords: { x: MAZE_SIZE, y: MAZE_SIZE },
            creepList: creeps,
            renderRange: false,
            renderCost: true,
            rotateRate: 0 // radians per second
        }
        switch (index) {
            case 1:
                return objects.simpleTower(spec);
            case 2:
                return objects.bombTower(spec);
            case 3:
                return objects.missileTower(spec);
            case 4:
                return objects.flakTower(spec);
            default:
                console.log("No Turret")
        }
    }

    function placeTower(indexX, indexY) {
        if (indexX > 0 && indexX < MAZE_SIZE - 1 && indexY > 0 && indexY < MAZE_SIZE - 1) {
            if (!hasTower(indexX, indexY)) {
                maze[indexX][indexY].setTower();
                shortestPathH = findShortestPath(LEFT_CELL, RIGHT_CELL);
                shortestPathV = findShortestPath(UP_CELL, DOWN_CELL);
                if (shortestPathH != undefined && shortestPathV != undefined) {
                    let tower = formTower(indexX, indexY, towerType, false);
                    towers.push(tower);
                    score += tower.score;
                    money -= tower.placeCost;
                    maze[indexX][indexY].towerReference = tower;
                    formPath();
                    placingTower = false;
                    selectingTower = true;
                    particlesList.push(createFireworkParticles(tower));
                }
                else {
                    maze[indexX][indexY].removeTower();
                    shortestPathH = findShortestPath(LEFT_CELL, RIGHT_CELL);
                    shortestPathV = findShortestPath(LEFT_CELL, RIGHT_CELL);
                }
            }
        }
    }

    function run() {
        myKeyboard = input.Keyboard();
        let controls = JSON.parse(localStorage.getItem('MyGame.controls'));
        myKeyboard.registerCommand(controls[0], upgrade);
        myKeyboard.registerCommand(controls[1], sell);
        myKeyboard.registerCommand(controls[2], nextLevel);

        myKeyboard.registerCommand(27, function () {
            //
            // Stop the game loop by canceling the request for the next animation frame
            //
            // Then, open the pause menu
            if (isEmpty(selected)) {
                cancelNextRequest = true;
                soundPlayer.pauseSound('music');
                game.showScreen('pause');
            }
            else {
                selected.toggleRangeRender();
                selected = {};
            }
        });
        game.controls = myKeyboard;

        lastTimeStamp = performance.now();
        cancelNextRequest = false;

        soundPlayer.playSound('music', true);
        requestAnimationFrame(gameLoop);
    }

    function upgrade() {
        if (!isEmpty(selected) && selected.placeCost <= money) {
            if (selected.upgrade()) {
                score += selected.score;
                money -= selected.placeCost;
            }
        }
    }

    function sell() {
        if (!isEmpty(selected)) {
            selected.sell();
            particlesList.push(createSmokeParticles(selected));
            maze[selected.coords.x][selected.coords.y].removeTower();
            money += selected.refundCost;
            selected = {};
        }
    }

    function formCreep(i, wave) {
        let creepCenter = {x: 0, y: 0 }
        let creepDirection = {x: 0, y: 0}
        let creepRotation = 0;
        if (LEFT_CELL == startCell) {
            creepCenter = { x: 0 - (i + .25) * graphics.CELL_WIDTH - wave * graphics.CELL_WIDTH * creepCounts[(level % 3)] * 2, y: graphics.CELL_HEIGHT * (MAZE_SIZE / 2) + Random.nextRange(-graphics.CELL_HEIGHT / 4, graphics.CELL_HEIGHT / 4) }
            creepDirection = { x: 1, y: 0 }
            console.log(creepCounts[(level % 3)])
        }
        if (UP_CELL == startCell) {
            creepCenter = { x: graphics.CELL_WIDTH * (MAZE_SIZE / 2) + Random.nextRange(-graphics.CELL_WIDTH / 4, graphics.CELL_WIDTH / 4), y: 0 - (i + .25) * graphics.CELL_HEIGHT - creepCounts[(level % 3)] * wave * graphics.CELL_HEIGHT * 2}
            creepDirection = { x: 0, y: 1 }
            creepRotation = Math.PI / 2;
            console.log(creepCounts[(level % 3)])
        }
        let spec = {
            center: creepCenter,
            size: { width: graphics.CELL_WIDTH / 2, height: graphics.CELL_HEIGHT / 2 },
            direction: creepDirection,
            maze: maze,
            rotation: creepRotation,
            vertical: vertical
        }
        let creepType = level % 3;
        switch (creepType) {
            case 1:
                return objects.baseCreep(spec);
            case 2:
                return objects.tankCreep(spec);
            case 0:
                return objects.flyCreep(spec);
            default:
                console.log("No Turret")
        }
    }

    function nextLevel() {
        if (levelCooldown <= 0) {
            for (let wave = 0; wave < 3; wave++) {
                for (let i = 0; i < creepCounts[(level % 3)]; i++) {
                    let myCreep = formCreep(i, wave)
                    creeps.push(myCreep);
                }
            }
            levelCooldown = 2000;
            creepCounts[(level % 3)] = Math.floor(creepCounts[(level % 3)] * 1.4) + 1;
            level += 1;
            if (startCell == LEFT_CELL) {
                startCell = UP_CELL;
                lastCell = DOWN_CELL;
                vertical = true;
            }
            else {
                startCell = LEFT_CELL;
                lastCell = RIGHT_CELL;
                vertical = false;
            }
        }
    }


    function intersectBullets(r1, r2) {
        return !(
            r2.center.x - r2.size.width / 4 > r1.center.x + r1.size.width / 4 ||
            r2.center.x + r2.size.width / 4 < r1.center.x - r1.size.width / 4 ||
            r2.center.y - r2.size.height / 4 > r1.center.y + r1.size.height / 4 ||
            r2.center.y + r2.size.height / 4 < r1.center.y - r1.size.height / 4
        );
    }

    function isEmpty(object) {
        for (const property in object) {
            return false;
        }
        return true;
    }

    function createSmokeParticles(spec) {
        return systems.ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 5, stdev: 4 },
            speed: { mean: 25, stdev: 5 },
            lifetime: { mean: .25, stdev: .05 },
            systemLifetime: .5,
            density: 1,
            image: assets['smoke']
        });
    }

    function createFireworkParticles(spec) {
        return systems.ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 5, stdev: 4 },
            speed: { mean: 80, stdev: 5 },
            lifetime: { mean: .25, stdev: .05 },
            systemLifetime: .5,
            density: 1,
            image: assets['fireworks']
        });
    }

    function createExplosionParticles(spec) {
        return systems.ParticleSystem({
            center: { x: spec.center.x, y: spec.center.y },
            size: { mean: 7, stdev: 2 },
            speed: { mean: 200, stdev: 5 },
            lifetime: { mean: .15, stdev: .05 },
            systemLifetime: .25,
            density: 3,
            image: assets['fire']
        });
    }

    function createFloatingScore(spec) {
        return objects.Text({
            text: spec.score.toString(),
            font: '12pt Times New Roman',
            fillStyle: 'rgba(255, 255, 255, 1)',
            strokeStyle: 'rgba(0, 0, 0, 1)',
            position: { x: spec.center.x, y: spec.center.y },
            time: 1000
        });
    }

    function quit() {
        if (score != 0) {
            let scores = JSON.parse(localStorage.getItem('MyGame.highscores'));
            scores.push(score);
            scores.sort(compareNumbers);
            scores.splice(scores.length - 1, 1)
            localStorage['MyGame.highscores'] = JSON.stringify(scores);
            score = 0;
        }
        playerHealth = 30;
        money = 1000;
        towers = [];
        bullets = [];
        creeps = [];
        selected = {};
        creepCounts = [3, 5, 2];
        vertical = false;
        level = 1;
        soundPlayer.stopSound('music');
        initialize();
        game.showScreen('main-menu');
    }

    return {
        run: run,
        initialize: initialize,
        quit: quit
    }

}(MyGame.game, MyGame.objects, MyGame.graphics, MyGame.input, MyGame.systems, MyGame.assets, MyGame.player));
