MyGame.screens['controls'] = (function(game) {
    'use strict';
    let controls = {};

    function initialize() {
        controls = JSON.parse(localStorage.getItem('MyGame.controls'));
        document.getElementById('id-controls-upgrade').addEventListener(
            'click',
            function() { 
                window.addEventListener("keydown", bindUpgrade);
                document.getElementById('id-controls-upgrade').innerHTML = 'PRESS NEW KEY';
                }
            );
        document.getElementById('id-controls-sell').addEventListener(
            'click',
            function() { 
                window.addEventListener("keydown", bindSell);
                document.getElementById('id-controls-sell').innerHTML = 'PRESS NEW KEY';
                }
            );
        document.getElementById('id-controls-next-level').addEventListener(
            'click',
            function() { 
                window.addEventListener("keydown", nextLevel);
                document.getElementById('id-controls-next-level').innerHTML = 'PRESS NEW KEY';
                }
            );
        document.getElementById('id-controls-back').addEventListener(
            'click',
            function() { 
                game.showScreen('main-menu'); 
            });
    }

    function bindUpgrade(e) {
        window.removeEventListener("keydown", bindUpgrade); 
        document.getElementById('id-controls-upgrade').innerHTML = 'Upgrade: ' + e.key;
        controls[0] = e.keyCode;
        localStorage['MyGame.controls'] = JSON.stringify(controls);
    }
    
    function bindSell(e) {
        window.removeEventListener("keydown", bindSell);  
        document.getElementById('id-controls-sell').innerHTML = 'Sell: ' + e.key;
        controls[1] = e.keyCode;
        localStorage['MyGame.controls'] = JSON.stringify(controls);
    }


    function nextLevel(e) {
        window.removeEventListener("keydown", nextLevel);    
        document.getElementById('id-controls-next-level').innerHTML = 'Next Level: ' + e.key;
        controls[2] = e.keyCode;
        localStorage['MyGame.controls'] = JSON.stringify(controls);   
    }

    function run() {
        document.getElementById('id-controls-upgrade').innerHTML = 'Sell: ' + String.fromCharCode(controls[0]).toLowerCase();
        document.getElementById('id-controls-sell').innerHTML = 'Upgrade: ' + String.fromCharCode(controls[1]).toLowerCase();
        document.getElementById('id-controls-next-level').innerHTML = 'Next Level: ' + String.fromCharCode(controls[2]).toLowerCase();
    }
    
    return {
        initialize : initialize,
        run : run
    };
}(MyGame.game));
