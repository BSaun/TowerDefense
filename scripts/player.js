MyGame.player = (function (assets) {
    'use strict';

    MyGame.sounds = {}
    // Reference: https://freesound.org/data/previews/156/156031_2703579-lq.mp3
    MyGame.sounds['proj_fire'] = assets['proj_fire'];
    MyGame.sounds['flak_fire'] = assets['flak_fire'];
    MyGame.sounds['bomb_fire'] = assets['bomb_fire'];
    MyGame.sounds['miss_fire'] = assets['miss_fire'];
    MyGame.sounds['music'] = assets['pizz'];
    // // Reference: https://freesound.org//data/previews/109/109662_945474-lq.mp3
    // MyGame.sounds['audio/sound-2'] = loadSound('audio/sound-2.mp3');
    // // Reference: https://www.bensound.com/royalty-free-music/track/extreme-action
    // MyGame.sounds['audio/Bells'] = loadSound('audio/Bells.mp3');

    //------------------------------------------------------------------
    //
    // Pauses the specified audio
    //
    //------------------------------------------------------------------
    function pauseSound(whichSound) {
        MyGame.sounds[whichSound].pause();
    }

    //------------------------------------------------------------------
    //
    // Plays the specified audio
    //
    //------------------------------------------------------------------
    function playSound(whichSound, repeat) {
        if (repeat) {
            MyGame.sounds[whichSound].addEventListener('ended', function () {
                playSound(whichSound, repeat);
            });
        }

        MyGame.sounds[whichSound].play();
    }

    //------------------------------------------------------------------
    //
    // Stops the specified audio
    //
    //------------------------------------------------------------------
    function stopSound(whichSound) {
        MyGame.sounds[whichSound].pause();
        MyGame.sounds[whichSound].currentTime = 0;
    }

    //------------------------------------------------------------------
    //
    // Allow the music volume to be changed
    //
    //------------------------------------------------------------------
    function changeVolume(value) {
        // MyGame.sounds['audio/Bells'].volume = value / 100;
    }
    
    return {
        playSound: playSound,
        pauseSound: pauseSound,
        stopSound: stopSound,
        changeVolume: changeVolume,
    };
}(MyGame.assets));
