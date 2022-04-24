MyGame.screens['high-scores'] = (function(game) {
    'use strict';
    
    function initialize() {
        document.getElementById('id-high-scores-back').addEventListener(
            'click',
            function() { game.showScreen('main-menu'); });
    }
    
    function run() {
        let scores = JSON.parse(localStorage.getItem('MyGame.highscores'));
        document.getElementById('id-high-1').innerHTML = scores[0];
        document.getElementById('id-high-2').innerHTML = scores[1];
        document.getElementById('id-high-3').innerHTML = scores[2];
        document.getElementById('id-high-4').innerHTML = scores[3];
        document.getElementById('id-high-5').innerHTML = scores[4];
    }
    
    return {
        initialize : initialize,
        run : run
    };
}(MyGame.game));
