MyGame = {
    screens: {},
    input: {},
    objects: {},
    render: [],
    systems: {},
    controls: {},
    assets: {},
    sounds: {},
    player: {}
};
//------------------------------------------------------------------
//
// Purpose of this code is to bootstrap (maybe I should use that as the name)
// the rest of the application.  Only this file is specified in the index.html
// file, then the code in this file gets all the other code and assets
// loaded.
//
//------------------------------------------------------------------
MyGame.loader = (function () {
    'use strict';
    let scriptOrder = [{
        scripts: ['input'],
        message: 'Input loaded',
        onComplete: null
    }, {
        scripts: ['graphics'],
        message: 'Graphics model loaded',
        onComplete: null
    }, {
        scripts: ['player'],
        message: 'Sound player loaded',
        onComplete: null
    }, {
        scripts: ['gameobjects'],
        message: 'Game objects loaded',
        onComplete: null
    }, {
        scripts: ['particle-system'],
        message: 'Particle systems loaded',
        onComplete: null
    }, {
        scripts: ['random'],
        message: 'Random loaded',
        onComplete: null
    }, {
        scripts: ['game'],
        message: 'Game object loaded',
        onComplete: null
    }, {
        scripts: ['mainmenu'],
        message: 'Main Menu loaded',
        onComplete: null
    }, {
        scripts: ['credits'],
        message: 'Credits loaded',
        onComplete: null
    }, {
        scripts: ['pause'],
        message: 'Pause loaded',
        onComplete: null
    }, {
        scripts: ['gameplay'],
        message: 'Game loop loaded',
        onComplete: null
    }, {
        scripts: ['highscores'],
        message: 'Highscores loaded',
        onComplete: null
    }, {
        scripts: ['controls'],
        message: 'Controls loaded',
        onComplete: null
    }];

    let assetOrder = [{
        key: 'proj_fire',
        source: '/audio/proj_fire.mp3'
    }, {
        key: 'pizz',
        source: '/audio/Pizz.mp3'
    }, {
        key: 'miss_fire',
        source: '/audio/miss_fire.mp3'
    }, {
        key: 'flak_fire',
        source: '/audio/flak_fire.mp3'
    }, {
        key: 'bomb_fire',
        source: '/audio/bomb_fire.mp3'
    }, {
        key: 'smoke',
        source: '/assets/smoke.png'
    }, {
        key: 'fireworks',
        source: '/assets/fireworks.png'
    }, {
        key: 'fire',
        source: '/assets/fire.png'
    }, {
        key: 'creep',
        source: '/assets/creep-1.png'
    }, {
        key: 'tank',
        source: '/assets/creep-2.png'
    }, {
        key: 'flyer',
        source: '/assets/creep-3.png'
    }, {
        key: 'base',
        source: '/assets/turret-base.png'
    }, {
        key: 'proj1',
        source: '/assets/turret-1-1.png'
    }, {
        key: 'proj2',
        source: '/assets/turret-1-2.png'
    }, {
        key: 'proj3',
        source: '/assets/turret-1-3.png'
    }, {
        key: 'mis1',
        source: '/assets/turret-2-1.png'
    }, {
        key: 'mis2',
        source: '/assets/turret-2-2.png'
    }, {
        key: 'mis3',
        source: '/assets/turret-2-3.png'
    }, {
        key: 'bomb1',
        source: '/assets/turret-3-1.png'
    }, {
        key: 'bomb2',
        source: '/assets/turret-3-2.png'
    }, {
        key: 'bomb3',
        source: '/assets/turret-3-3.png'
    }, {
        key: 'flak1',
        source: '/assets/turret-4-1.png'
    }, {
        key: 'flak2',
        source: '/assets/turret-4-2.png'
    }, {
        key: 'flak3',
        source: '/assets/turret-4-3.png'
    }];

    //------------------------------------------------------------------
    //
    // Helper function used to load scripts in the order specified by the
    // 'scripts' parameter.  'scripts' expects an array of objects with
    // the following format...
    //    {
    //        scripts: [script1, script2, ...],
    //        message: 'Console message displayed after loading is complete',
    //        onComplete: function to call when loading is complete, may be null
    //    }
    //
    //------------------------------------------------------------------
    function loadScripts(scripts, onComplete) {
        //
        // When we run out of things to load, that is when we call onComplete.
        if (scripts.length > 0) {
            let entry = scripts[0];
            require(entry.scripts, function () {
                console.log(entry.message);
                if (entry.onComplete) {
                    entry.onComplete();
                }
                scripts.shift();    // Alternatively: scripts.splice(0, 1);
                loadScripts(scripts, onComplete);
            });
        } else {
            onComplete();
        }
    }

    //------------------------------------------------------------------
    //
    // Helper function used to load assets in the order specified by the
    // 'assets' parameter.  'assets' expects an array of objects with
    // the following format...
    //    {
    //        key: 'asset-1',
    //        source: 'asset/.../asset.png'
    //    }
    //
    // onSuccess is invoked per asset as: onSuccess(key, asset)
    // onError is invoked per asset as: onError(error)
    // onComplete is invoked once per 'assets' array as: onComplete()
    //
    //------------------------------------------------------------------
    function loadAssets(assets, onSuccess, onError, onComplete) {
        //
        // When we run out of things to load, that is when we call onComplete.
        if (assets.length > 0) {
            let entry = assets[0];
            loadAsset(entry.source,
                function (asset) {
                    onSuccess(entry, asset);
                    assets.shift();    // Alternatively: assets.splice(0, 1);
                    loadAssets(assets, onSuccess, onError, onComplete);
                },
                function (error) {
                    onError(error);
                    assets.shift();    // Alternatively: assets.splice(0, 1);
                    loadAssets(assets, onSuccess, onError, onComplete);
                });
        } else {
            onComplete();
        }
    }

    //------------------------------------------------------------------
    //
    // This function is used to asynchronously load image and audio assets.
    // On success the asset is provided through the onSuccess callback.
    // Reference: http://www.html5rocks.com/en/tutorials/file/xhr2/
    //
    //------------------------------------------------------------------
    function loadAsset(source, onSuccess, onError) {
        let xhr = new XMLHttpRequest();
        let fileExtension = source.substr(source.lastIndexOf('.') + 1);    // Source: http://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript

        if (fileExtension) {
            xhr.open('GET', source, true);
            xhr.responseType = 'blob';

            xhr.onload = function () {
                let asset = null;
                if (xhr.status === 200) {
                    if (fileExtension === 'png' || fileExtension === 'jpg') {
                        asset = new Image();
                    } else if (fileExtension === 'mp3') {
                        asset = new Audio();
                    } else {
                        if (onError) { onError('Unknown file extension: ' + fileExtension); }
                    }
                    asset.onload = function () {
                        window.URL.revokeObjectURL(asset.src);
                    };
                    asset.src = window.URL.createObjectURL(xhr.response);
                    if (onSuccess) { onSuccess(asset); }
                } else {
                    if (onError) { onError('Failed to retrieve: ' + source); }
                }
            };
        } else {
            if (onError) { onError('Unknown file extension: ' + fileExtension); }
        }

        xhr.send();
    }

    //------------------------------------------------------------------
    //
    // Called when all the scripts are loaded, it kicks off the demo app.
    //
    //------------------------------------------------------------------
    function mainComplete() {
        console.log('It is all loaded up');
        MyGame.game.initialize();
    }

    //
    // Start with loading the assets, then the scripts.
    console.log('Starting to dynamically load project assets');
    loadAssets(assetOrder,
        function (source, asset) {    // Store it on success
            MyGame.assets[source.key] = asset;
        },
        function (error) {
            console.log(error);
        },
        function () {
            console.log('All game assets loaded');
            console.log('Starting to dynamically load project scripts');
            loadScripts(scriptOrder, mainComplete);
        }
    );

}());
