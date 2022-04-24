//------------------------------------------------------------------
//
// This function provides the "game" code.
//
//------------------------------------------------------------------
MyGame.screens['game-play'] = (function (game, objects, graphics, input) {
    'use strict';

    let lastTimeStamp = performance.now();
    let cancelNextRequest = true;

    let playing = true;
    let towerType = 1
    let level = 1;
    let creepCounts = [5, 10, 3]
    let levelCooldown = 0;
    let score = 0;
    let playerHealth = 30;
    let money = 1000;
    let myScore = objects.Text({
        text: 'Score: ' + score.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: {x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5}
    });
    let myHealth = objects.Text({
        text: 'Life: ' + playerHealth.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: {x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 2}
    });
    let myMoney = objects.Text({
        text: 'Money: ' + money.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: {x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 3}
    });
    let myLevel = objects.Text({
        text: 'Level: ' + level.toString(),
        font: '24pt Times New Roman',
        fillStyle: 'rgba(255, 255, 255, 1)',
        strokeStyle: 'rgba(0, 0, 0, 1)',
        position: {x: graphics.SHOP_BEGIN / 2, y: graphics.HUD_BEGIN + (graphics.CANVAS_HEIGHT - graphics.HUD_BEGIN) / 5 * 4}
    });

    let MAZE_SIZE = 15;

    let shopList = [];
    let placingTower = false;
    let selectingTower = false;

    
    let maze = [];
    let startCell = {};
    let lastCell = {};
    let shortestPath = [];

    let myKeyboard = input.Keyboard();
    let myMouse = input.Mouse();

    let creeps = [];
    let walls = [];
    let bullets = [];

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
        for (let i = 0; i < shortestPath.length - 1; i++) {
            shortestPath[i].setDirection(shortestPath[i + 1])
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
                    let reward = creeps.splice(i, 1)[0].score
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
    
        startCell = maze[0][7]
        lastCell = maze[14][7]
        for (let i = 0; i < MAZE_SIZE; i++) {
            let wall = {};
            if (maze[i][0] != startCell && maze[i][0] != lastCell) {
                wall = formWall(i, 0);
                walls.push(wall);
                maze[i][0].setTower();
            }
            if (maze[0][i] != startCell && maze[0][i] != lastCell) {
                wall = formWall(0, i);
                walls.push(wall);
                maze[0][i].setTower();
            }
            if (maze[MAZE_SIZE - 1][i] != startCell && maze[MAZE_SIZE - 1][i] != lastCell) {
                wall = formWall(MAZE_SIZE - 1, i);
                walls.push(wall);
                maze[MAZE_SIZE - 1][i].setTower();
            }
            if (maze[i][MAZE_SIZE - 1] != startCell && maze[i][MAZE_SIZE - 1] != lastCell) {
                wall = formWall(i, MAZE_SIZE - 1);
                walls.push(wall);
                maze[i][MAZE_SIZE - 1].setTower();
            }
        }
    
        startCell.removeTower();
        lastCell.removeTower();
    
        shortestPath = findShortestPath(startCell, lastCell)
        formPath();

        if (localStorage.getItem('MyGame.highscores') === null) {
            localStorage['MyGame.highscores'] = JSON.stringify([0, 0, 0, 0, 0])
        }
        playing = true;
        if (localStorage.getItem('MyGame.controls') === null) {
            myKeyboard.registerCommand(83, upgrade);
            myKeyboard.registerCommand(85, sell);
            myKeyboard.registerCommand(71, nextLevel);
            localStorage['MyGame.controls'] = JSON.stringify([83, 85, 71]);
        }
        myKeyboard.registerCommand(27, function () {
            //
            // Stop the game loop by canceling the request for the next animation frame
            //
            // Then, open the pause menu
            if (isEmpty(selected)) {
                cancelNextRequest = true;
                game.showScreen('pause');
            }
            else {
                selected.toggleRangeRender();
                selected = {};
            }

        });
        game.controls = myKeyboard;

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
                shortestPath = findShortestPath(startCell, lastCell);
                if (shortestPath != undefined) { 
                    let tower = formTower(indexX, indexY, towerType, false);
                    towers.push(tower);
                    score += tower.score;
                    money -= tower.placeCost;
                    maze[indexX][indexY].towerReference = tower;
                    formPath();
                    placingTower = false;
                    selectingTower = true;
                }
                else {
                    maze[indexX][indexY].removeTower();
                    shortestPath = findShortestPath(startCell, lastCell);
                }
            }
        }
    }

    function run() {
        let controls = JSON.parse(localStorage.getItem('MyGame.controls'));
        myKeyboard.registerCommand(controls[0], sell);
        myKeyboard.registerCommand(controls[1], upgrade);
        myKeyboard.registerCommand(controls[2], nextLevel);

        lastTimeStamp = performance.now();
        cancelNextRequest = false;
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
            maze[selected.coords.x][selected.coords.y].removeTower();
            money += selected.refundCost;
            selected = {};
        }
    }

    function formCreep(i) {
        let spec = {
            center: { x: 0 - (i + .25) * graphics.CELL_WIDTH, y: graphics.CELL_HEIGHT * (MAZE_SIZE / 2) + Random.nextRange(-graphics.CELL_HEIGHT / 4, graphics.CELL_HEIGHT / 4) },
            size: { width: graphics.CELL_WIDTH / 2, height: graphics.CELL_HEIGHT / 2 },
            direction: { x: 1, y: 0 },
            maze: maze,
            rotation: 0
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
            for (let i = 0; i < level * 5; i++) {
                let myCreep = formCreep(i)
                creeps.push(myCreep);
            }
            levelCooldown = 2000;
            creepCounts[(level % 3)] = Math.floor(creepCounts[(level % 3)] * 1.4)
            level += 1;
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
        initialize();
        game.showScreen('main-menu'); 
    }

    return {
        run: run,
        initialize: initialize,
        quit: quit
    }

}(MyGame.game, MyGame.objects, MyGame.graphics, MyGame.input));
