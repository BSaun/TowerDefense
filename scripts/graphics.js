// ------------------------------------------------------------------
//
// This is the graphics rendering code for the game.
//
// ------------------------------------------------------------------
MyGame.graphics = (function () {
    'use strict';

    let canvas = document.getElementById('id-canvas');
    let context = canvas.getContext('2d');
    let MAZE_SIZE = 15;
    let CELL_WIDTH = canvas.width / MAZE_SIZE * 2 / 3;
    let CELL_HEIGHT = canvas.height / MAZE_SIZE * 2 / 3;

    let SHOP_BEGIN = canvas.width * 2 / 3;
    let SHOP_END = canvas.width;

    let HUD_BEGIN = canvas.height * 2 / 3;
    let HUD_END = canvas.height;

    //------------------------------------------------------------------
    //
    // Place a 'clear' function on the Canvas prototype, this makes it a part
    // of the canvas, rather than making a function that calls and does it.
    //
    //------------------------------------------------------------------
    CanvasRenderingContext2D.prototype.clear = function () {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, canvas.width, canvas.height);
        this.restore();
    };

    //------------------------------------------------------------------
    //
    // Public function that allows the client code to clear the canvas.
    //
    //------------------------------------------------------------------
    function clear() {
        context.clear();
    }

    //------------------------------------------------------------------
    //
    // Draws the grid for the arena.
    //
    //------------------------------------------------------------------
    function drawGrid() {
        context.beginPath();
        for (let i = 0; i < MAZE_SIZE + 1; i++) {
            context.moveTo(i * (CELL_WIDTH), 0);
            context.lineTo(i * (CELL_WIDTH), canvas.height * 2 / 3);
            context.moveTo(0, i * (CELL_HEIGHT));
            context.lineTo(canvas.width * 2 / 3 + 3, i * (CELL_HEIGHT));
        }
        context.strokeStyle = 'rgb(0, 0, 0)';
        context.lineWidth = 6;
        context.stroke();
    }

    //------------------------------------------------------------------
    //
    // Draws a rectangle.
    //
    //------------------------------------------------------------------
    function drawRectangle(rect, fillStyle, strokeStyle) {
        context.save();
        context.translate(rect.center.x, rect.center.y);
        context.rotate(rect.rotation);
        context.translate(-rect.center.x, -rect.center.y);

        context.fillStyle = fillStyle;
        context.fillRect(rect.center.x - rect.size.x / 2, rect.center.y - rect.size.y / 2, rect.size.x, rect.size.y);

        context.strokeStyle = strokeStyle;
        context.strokeRect(rect.center.x - rect.size.x / 2, rect.center.y - rect.size.y / 2, rect.size.x, rect.size.y);

        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Draws a healthbar.
    //
    //------------------------------------------------------------------
    function drawHealthbar(spec) {
        context.lineWidth = .5;
        drawRectangle({
            center: { x: spec.center.x, y: spec.center.y - spec.size.height * (3 / 4) },
            size: { x: spec.size.width, y: spec.size.height / 3 },
            rotation: 0
        }, "red", "black");
        drawRectangle({
            center: { x: spec.center.x, y: spec.center.y - spec.size.height * (3 / 4) },
            size: { x: spec.size.width * (spec.currentHealth / spec.fullHealth), y: spec.size.height / 3 },
            rotation: 0
        }, "green", "black");
        context.lineWidth = 6;
    }

    //------------------------------------------------------------------
    //
    // Draws the shop area for the arena.
    //
    //------------------------------------------------------------------
    function drawShop() {
        drawRectangle({
            center: { x: (SHOP_BEGIN + SHOP_END) / 2, y: canvas.height / 3 },
            size: { x: SHOP_END - SHOP_BEGIN, y: canvas.height * 2 / 3 },
            rotation: 0
        }, "gray", "black");
        drawRectangle({
            center: { x: canvas.width / 2, y: (HUD_BEGIN + HUD_END) / 2 },
            size: { x: canvas.width, y: HUD_BEGIN - HUD_END },
            rotation: 0
        }, "#24c2d4", "black");
    }

    function drawText(spec) {
        context.save();

        context.font = spec.font;
        context.fillStyle = spec.fillStyle;
        context.strokeStyle = spec.strokeStyle;
        context.textBaseline = 'top';

        context.strokeText(spec.text, spec.position.x, spec.position.y);
        context.fillText(spec.text, spec.position.x, spec.position.y);

        context.restore();
    }

    //------------------------------------------------------------------
    //
    // Simple sprite, one image in the texture.
    //
    //------------------------------------------------------------------
    function Sprite(spec) {
        let that = {};

        that.draw = function () {
            context.save();

            context.translate(spec.center.x, spec.center.y);
            context.rotate(spec.rotation);
            context.translate(-spec.center.x, -spec.center.y);

            //
            // Pick the selected sprite from the sprite sheet to render
            context.drawImage(
                spec.sprite,
                spec.center.x - spec.size.width / 2,
                spec.center.y - spec.size.height / 2,
                spec.size.width, spec.size.height);

            context.restore();
        }
        

        that.rotateRight = function (angle) {
            spec.rotation += angle;
        };

        that.rotateLeft = function (angle) {
            spec.rotation -= angle;
        }

        that.changeSprite = function (newSprite) {
            spec.sprite = newSprite;
        }

        that.changeRotation = function (newRotation) {
            spec.rotation = newRotation;
        }

        //
        // The other side of that hack job
        that.drawArc = function (radius) {
            context.fillStyle = 'rgba(255, 0, 0, 0.5)';
            context.beginPath();
            context.arc(spec.center.x, spec.center.y, radius, 0, 2 * Math.PI);
            context.stroke();
        }

        return that;
    }

    //------------------------------------------------------------------
    //
    // Simple sprite, one image in the texture.
    //
    //------------------------------------------------------------------
    function AnimatedSprite(spec) {
        let that = {};
        let animationTime = 0;
        let subImageIndex = 0;
        let spriteCount = spec.intervals.length;
        //
        // Our clever trick, replace the draw function once the image is loaded...no if statements!
        that.draw = function () {
            context.save();

            context.translate(spec.center.x, spec.center.y);
            context.rotate(spec.rotation);
            context.translate(-spec.center.x, -spec.center.y);

            //
            // Pick the selected sprite from the sprite sheet to render
            context.drawImage(
                spec.sprite,
                subImageIndex * (spec.sprite.width / spriteCount), 0,      // Which sub-texture to pick out
                spec.sprite.width / spriteCount, spec.sprite.height,   // The size of the sub-texture
                spec.center.x - spec.size.width / 2,
                spec.center.y - spec.size.height / 2,
                spec.size.width, spec.size.height);

            context.restore();
        };

        that.update = function(elapsedTime) {
            animationTime += elapsedTime;
            //
            // Check to see if we should update the animation frame
            if (animationTime >= spec.intervals[subImageIndex]) {
                //
                // When switching sprites, keep the leftover time because
                // it needs to be accounted for the next sprite animation frame.
                animationTime -= spec.intervals[subImageIndex];
                subImageIndex += 1;
                //
                // Wrap around from the last back to the first sprite as needed
                subImageIndex = subImageIndex % spriteCount;
            }
        }

        that.changeRotation = function (newRotation) {
            spec.rotation = newRotation;
        }

        return that;
    }

    return {
        clear: clear,
        Sprite: Sprite,
        drawGrid: drawGrid,
        drawShop: drawShop,
        drawText: drawText,
        drawHealthbar: drawHealthbar,
        AnimatedSprite: AnimatedSprite,
        get CELL_HEIGHT() { return CELL_HEIGHT },
        get CELL_WIDTH() { return CELL_WIDTH },
        get CANVAS_HEIGHT() { return canvas.height },
        get SHOP_BEGIN() { return SHOP_BEGIN },
        get SHOP_END() { return SHOP_END },
        get HUD_BEGIN() { return HUD_BEGIN }
    };
}());
