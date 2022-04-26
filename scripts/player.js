MyGame.player = (function (assets) {
    'use strict';

    MyGame.sounds = {}
    // Reference: https://freesound.org/data/previews/156/156031_2703579-lq.mp3
    MyGame.sounds['proj_fire'] = assets['proj_fire'];
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
    // Allow the music volume to be changed
    //
    //------------------------------------------------------------------
    function changeVolume(value) {
        // MyGame.sounds['audio/Bells'].volume = value / 100;
    }
    
    return {
        playSound: playSound,
        pauseSound: pauseSound,
        changeVolume: changeVolume,
    };
}(MyGame.assets));
