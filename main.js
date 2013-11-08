
/** { APP }
 * @type {Object}
 */
var APP = {
  audio_ctx: null,
  sounds: [],

  canvas: null,
  gfx_ctx: null,

  action_removing: false,

  ROWS: 16,
  COLS: 32,

  next_schedule_column: 1,
  draw_column: 0,
  last_drawn_time: 0.0,

  matrix: null,

  cell_size: 20,

  play_delay: 0.15,
  next_note_time: 0.0,
  schedule_ahead_time: 0.1,

  playing: false,
  animation_frame: null
};

APP.init = function() {
  if(!window.AudioContext) {
    APP.displayUnsupportedMessage('AudioContext');
    return;
  }

  APP.audio_ctx = new AudioContext();
  if(!APP.audio_ctx) {
    APP.displayErrorMessage('AudioContext not created');
  }

  APP.canvas = $('canvas')[0];
  APP.gfx_ctx = APP.canvas.getContext('2d');

  APP.initSounds();
  APP.initMatrix();
  APP.startUpAudioContextTimer();

  APP.initHandlers();

  // Check hash
  var hash = window.location.hash.replace('#', '');
  if(hash !== '') {
    APP.decodeHash(hash);
  }

  APP.start();
};
APP.initMatrix = function() {
  APP.matrix = new Array(APP.ROWS);

  for(var r = 0; r < APP.ROWS; r++){
    APP.matrix[r] = new Array(APP.COLS);
    for(var c = 0; c < APP.COLS; c++){
        APP.matrix[r][c] = 0;
    }
  }
};

// African beat song
// #g3agb5g641g682g78g34g28g41g34g32g6ag34g78g75g39ag78g7eg31g72g34g38
// 

APP.initSounds = function() {
  APP.loadSound('sounds/voice/bom_1.wav', 'c4');
  APP.loadSound('sounds/voice/bom_2.wav', 'd4');
  APP.loadSound('sounds/voice/bom_3.wav', 'e4');
  APP.loadSound('sounds/voice/bom_4.wav', 'f4');
  APP.loadSound('sounds/voice/bom_5.wav', 'g4');
  APP.loadSound('sounds/voice/bom_6.wav', 'a4');
  APP.loadSound('sounds/voice/bom_7.wav', 'b4');
  APP.loadSound('sounds/voice/bom_8.wav', 'c5');
  // APP.loadSound('sounds/marimba/c4.wav', 'c4');
  // APP.loadSound('sounds/marimba/d4.wav', 'd4');
  // APP.loadSound('sounds/marimba/e4.wav', 'e4');
  // APP.loadSound('sounds/marimba/f4.wav', 'f4');
  // APP.loadSound('sounds/marimba/g4.wav', 'g4');
  // APP.loadSound('sounds/marimba/a4.wav', 'a4');
  // APP.loadSound('sounds/marimba/b4.wav', 'b4');
  // APP.loadSound('sounds/marimba/c5.wav', 'c5');
  APP.loadSound('sounds/marimba/d5.wav', 'd5');
  APP.loadSound('sounds/marimba/e5.wav', 'e5');
  APP.loadSound('sounds/marimba/f5.wav', 'f5');
  APP.loadSound('sounds/marimba/g5.wav', 'g5');
  APP.loadSound('sounds/marimba/a5.wav', 'a5');
  APP.loadSound('sounds/marimba/b5.wav', 'b5');
  APP.loadSound('sounds/marimba/c6.wav', 'c6');
  APP.loadSound('sounds/marimba/d6.wav', 'd6');
};
/**
 * { LOAD SOUND }
 * Loads a sound from the given URL and stores in APP.sounds
 * 
 * @param  {String} url   URL to sound
 * @param  {String} name  [Optional] Name for sound, if not supplied URL will be used
 */
APP.loadSound = function(url, name) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(){
    APP.audio_ctx.decodeAudioData(xhr.response, function(buffer){
      APP.sounds[name] = buffer;
    });
  };
  xhr.open('GET', url);
  xhr.send();
};
/**
 * { INIT HANDLERS }
 * Init all interaction handlers
 */
APP.initHandlers = function() {
  $(APP.canvas)
    // Mouse down
    .on('mousedown', function(ev) {
      if(ev.button === 0) {
        // APP.mouse_down = true;
        // APP.onTouch(ev.pageX, ev.pageY);
        APP.touchStart(ev.pageX, ev.pageY);
        ev.preventDefault();
      }
    })
    .on('mousemove', function(ev) {
      if(APP.mouse_down) {
        APP.onTouch(ev.pageX, ev.pageY);
      }
    });

  $(window).on('mouseup', function(ev) {
    if(ev.button === 0)
      APP.touchEnd();
  });

  $(window).on('keydown', function(ev) {
    if(ev.keyCode === 32) { // Space
      APP.togglePlay();
      ev.preventDefault();
    }
  });

  $(window).on('focus', APP.start).on('blur', APP.pause);

  $('#share_container').click(function() {
    APP.share();
  });
  $('#reset_container').click(function() {
    APP.reset();
  });
};

APP.start = function() {
  APP.playing = true;
  APP.next_note_time = APP.audio_ctx.currentTime + APP.play_delay;
  APP.animation_frame = requestAnimationFrame(APP.loop);
};
APP.pause = function() {
  APP.playing = false;
  cancelAnimationFrame(APP.animation_frame);
};
APP.togglePlay = function() {
  if(APP.playing)
    APP.pause();
  else
    APP.start();
};

APP.reset = function() {
  for(var r = 0; r < APP.ROWS; r++){
    for(var c = 0; c < APP.COLS; c++){
        APP.matrix[r][c] = 0;
    }
  }
  if(!APP.playing)
    APP.draw();
};

APP.startUpAudioContextTimer = function() {
  // Set a timer
  setTimeout(f, 0);


  function f() {
    // If there are any buffers loaded they will appear here
    for(var v in APP.sounds) {
      // Play it
      APP.scheduleNote(APP.sounds[v]);
      // .. and return
      return;
    }

    // Else set a new timeout and wait for sounds
    setTimeout(f, 0);
  }
};

APP.validCell = function(r, c) {
  return !(r < 0 ||  r >= APP.ROWS || c < 0 || c >= APP.COLS);
};
APP.onTouch = function(pageX, pageY) {
  var b = APP.canvas.getBoundingClientRect();
  var c = Math.floor((pageX-b.left-window.scrollX) / (APP.canvas.width / APP.COLS));
  var r = Math.floor((pageY-b.top-window.scrollY) / (APP.canvas.height / APP.ROWS));

  if(!APP.validCell(r, c))
    return;

  APP.matrix[r][c] = APP.action_removing? 0 : 1;

  APP.draw();
};

APP.touchStart = function(pageX, pageY) {
  var b = APP.canvas.getBoundingClientRect();
  var c = Math.floor((pageX-b.left-window.scrollX) / (APP.canvas.width / APP.COLS));
  var r = Math.floor((pageY-b.top-window.scrollY) / (APP.canvas.height / APP.ROWS));

  if(!APP.validCell(r, c))
    return;

  if(APP.matrix[r][c] === 1)
    APP.action_removing = true;
  else
    APP.action_removing = false;

  APP.mouse_down = true;

  APP.onTouch(pageX, pageY);
};
APP.touchEnd = function() {
  APP.action_removing = false;
  APP.mouse_down = false;
};

APP.loop = function(performance_time) {

  APP.updateSound();
  APP.draw();

  if(APP.playing)
    APP.animation_frame = requestAnimationFrame(APP.loop);
};

APP.updateColumn = function() {
  APP.draw_column = ++APP.draw_column % APP.COLS;
};

APP.updateSound = function() {
  var current_time = APP.audio_ctx.currentTime,
      schedule_ahead_time = APP.schedule_ahead_time;

  while(APP.next_note_time < current_time + schedule_ahead_time) {
    // Schedule next column
    var played_sound = APP.scheduleColumn();


    setTimeout(APP.updateColumn, (APP.next_note_time - current_time) / 1000.0);

    // Update next note time
    APP.next_note_time += APP.play_delay;
    APP.next_schedule_column = ++APP.next_schedule_column % APP.COLS;
  }
};

APP.draw = function() {
  var cw = APP.canvas.width,
      ch = APP.canvas.height,
      ctx = APP.gfx_ctx,
      radius = 10,
      w = cw / APP.COLS,
      h = ch / APP.ROWS;


  var time = APP.audio_ctx.currentTime;

  // Fix clearing
  // to only clear changed portion of canvas
  ctx.clearRect(0, 0, cw, ch);

  var colors = [
    '#FD4487',
    '#D8CF5A',
    '#8C56AE',
    '#E43A43',
    '#F59B2D'
  ];

  // var active = '#7A0C0A';
  var active = '#BD1310';
  // var active = 'rgb(0, 255, 0)';


  for(var r = 0; r < APP.ROWS; r++){


    for(var c = 0; c < APP.COLS; c++){

      ctx.fillStyle = (c == APP.draw_column) ? active : colors[c%colors.length];
      ctx.strokeStyle = (c == APP.draw_column) ? active : colors[c%colors.length];

      var x = c*w;
      var y = r*h;

      if(APP.matrix[r][c] == 1){
        ctx.globalAlpha = 0.8;
        APP.roundedRectFill(ctx, x, y, w, h, radius);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        APP.roundedRectStroke(ctx, x, y, w, h, radius);
      }

    }
  }
};

APP.scheduleColumn = function() {
  var active_column = APP.next_schedule_column;
  var time = APP.next_note_time;
  // Loop through rows and see if active
  for(var r = 0; r < APP.ROWS; ++r) {

    // If row is active, schedule the note
    if(APP.matrix[r][active_column] === 1) {

      // Translate row-parameter into a sound buffer
      var sound_buffer = APP.translateRowToSoundBuffer(r);

      APP.scheduleNote(sound_buffer, time);

    }

  }
};
APP.translateRowToSoundBuffer = function(row) {
  // Temporary table just selecting
  var translate_table = ['c4','d4','e4','f4','g4','a4','b4','c5','d5','e5','f5','g5','a5','b5','c6','d6'].reverse();

  return APP.sounds[translate_table[row % translate_table.length]];
};
APP.scheduleNote = function(sound_buffer, time) {

  // Check sound buffer
  if(!sound_buffer) {
    return false;
  }

  // Create node to play
  var buffer_source = APP.audio_ctx.createBufferSource();
  buffer_source.buffer = sound_buffer;

  /////////////////
  // ADD EFFECTS //
  /////////////////
  // var gain = gainNode(1.0, 0.0, 0.4);
  // s.connect(gain);
  // gain.connect(ac.destination);

  // Connect node to output
  buffer_source.connect(APP.audio_ctx.destination);

  buffer_source.start(time || 0);
};


APP.printMatrix = function() {
  var s = '\n';

  for(var r = 0; r < APP.ROWS; r++){
    for(var c = 0; c < APP.COLS; c++){
        s += APP.matrix[r][c];
    }

    s += '\n';
  }

  console.log(s);

  // return s;
};

APP.displayUnsupportedMessage = function(unsupported_feature) {
  alert(unsupported_feature + ' is unsupported');
};
APP.displayErrorMessage = function(error) {
  alert('Error: ' + error);
};

APP.roundedRectFill = function(ctx,x,y,width,height,radius){
  ctx.beginPath();
  ctx.moveTo(x,y+radius);
  ctx.lineTo(x,y+height-radius);
  ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
  ctx.lineTo(x+width-radius,y+height);
  ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
  ctx.lineTo(x+width,y+radius);
  ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
  ctx.lineTo(x+radius,y);
  ctx.quadraticCurveTo(x,y,x,y+radius);
  ctx.fill();
};
APP.roundedRectStroke = function(ctx,x,y,width,height,radius){
  ctx.beginPath();
  ctx.moveTo(x,y+radius);
  ctx.lineTo(x,y+height-radius);
  ctx.quadraticCurveTo(x,y+height,x+radius,y+height);
  ctx.lineTo(x+width-radius,y+height);
  ctx.quadraticCurveTo(x+width,y+height,x+width,y+height-radius);
  ctx.lineTo(x+width,y+radius);
  ctx.quadraticCurveTo(x+width,y,x+width-radius,y);
  ctx.lineTo(x+radius,y);
  ctx.quadraticCurveTo(x,y,x,y+radius);
  ctx.stroke();
};


APP.decodeHash = function(hash) {
  var str = '0123456789abcdefghijklmnopqrstuv';

  var bits = 4;
  var bitInc = APP.ROWS / bits;

  hash = APP.decompressHash(hash);

  for(var c = 0; c < APP.COLS; ++c) {

    for(var l = 0; l < bitInc; ++l) {

      var letter = hash[bits*c + l];

      var val = str.indexOf(letter);
      var cv = 8;

      for(var i = 3; i >= 0; --i) {
        if(val >= cv) {
          APP.matrix[l*bitInc + i][c] = 1;
          val -= cv;
        }
        else {
          APP.matrix[l*bitInc + i][c] = 0;
        }
        cv /= 2;
      }


    }
  }

  // APP.printMatrix();
  APP.draw();
};
APP.encodeHash = function() {
  var str = '0123456789abcdefghijklmnopqrstuv';

  var hash = '';
  var bits = 4;

  for(var c = 0; c < APP.COLS; ++c) {

    var r = 0;

    while(r < APP.ROWS) {
      var val = 0;
      for(var i = 0; i < bits; ++i) {

        val += Math.pow(2, i) * APP.matrix[r+i][c];


      }

      hash += str[val];

      r += bits;
    }
  }

  return APP.compressHash(hash);
};

APP.decompressHash = function(hash) {
  var org = '0123456789abcdef';
  var trans = 'ghijklmnopqrstuv';

  var decompressed = '';

  for(var l = 0; l < hash.length; ++l) {
    var c = hash[l];

    var index = org.indexOf(c);

    if(index === -1) {
      var t = trans.indexOf(c);
      var hex = org[t];

      var n = org.indexOf(hash[++l]);

      decompressed += new Array(n+1).join(hex);

      // Increase one extra
    }
    else {
      decompressed += c;
    }
  }

  return decompressed;
};
APP.compressHash = function(hash) {
  var org = '0123456789abcdef';
  var trans = 'ghijklmnopqrstuv';

  var compressed = '';

  for(var l = 0; l < hash.length;) {
    var c = hash[l];

    var i = 1;
    while(i+l < hash.length && hash[l+i] === c && i < 15)
      ++i;

    if(i > 1) {
      var o = org.indexOf(c);
      var t = trans[0];

      compressed += t + org[i];
    }
    else {
      compressed += c;
    }

    l += i;
  }

  return compressed;
};

APP.share = function() {
  var hash = APP.encodeHash();

  var obj = {};

  window.history.pushState(obj, '', '#'+hash);
};

// Debug only
window.onerror = function(msg, file, lineno) {
  alert('Error: ' + msg + '\n' + file + '\n' + lineno);
};
$.fixPrefixes();
$(APP.init);



/////////
// GUI //
/////////
$(function() {
  var e = $('h1.title');
  var t = e.text();

  var c = [
    '#FD4487',
    '#D8CF5A',
    '#8C56AE',
    '#E43A43',
    '#F59B2D'
  ];

  var nt = '';
  for(var i=0;i<t.length;++i) {
    nt += '<span data-pos="'+i+'" style="color:' + c[i%c.length] + '"">'+t[i]+'</span>';
  }

  e.html(nt);

  e.find('span').on('mouseover', function(ev) {
    var pos = $(this).attr('data-pos');

    var sb = APP.translateRowToSoundBuffer(pos);

    // APP.scheduleNote(sb, 0);
  });
});