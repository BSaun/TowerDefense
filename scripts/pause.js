MyGame.screens['pause'] = (function(game) {
    'use strict';
    
    function initialize() {
        document.getElementById('id-pause-quit').addEventListener(
            'click',
            function() { 
                MyGame.screens['game-play'].quit();
            });
        document.getElementById('id-pause-resume').addEventListener(
            'click',
            function() { game.showScreen('game-play'); });
    }
    
    function run() {
        //
        // I know this is empty, there isn't anything to do.
    }
    
    return {
        initialize : initialize,
        run : run
    };
}(MyGame.game));
