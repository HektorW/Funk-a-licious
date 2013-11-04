var ac;
var sounds = {};
var reverbs = {};
var matrix = [];
// var soundI = ['c4','d4','e4','f4','g4','a4','b4','c5'].reverse();
var soundI = ['c4','d4','e4','f4','g4','a4','b4','c5','d5','e5','f5','g5','a5','b5','c6','d6'].reverse();
// var soundI = ['c4','d4','e4'];
var col = -1;
var col_max = 16;
var row_max = 16;
var col_t = 0.0;
var col_time = 0.10;
var last_t;
var canvas;
var ctx;
var playing = true;

dom.on(window, 'load', function(){
    ac = new webkitAudioContext();
    canvas = dom('canvas')[0];
    ctx = canvas.getContext('2d');

    for(var i = 0; i < col_max; i++){
        matrix.push([]);
        for(var j = 0; j < row_max; j++){
            matrix[i][j] = 0;
        }
    }

    loadSound('sounds/marimba/c4.wav', 'c4');
    loadSound('sounds/marimba/d4.wav', 'd4');
    loadSound('sounds/marimba/e4.wav', 'e4');
    loadSound('sounds/marimba/f4.wav', 'f4');
    loadSound('sounds/marimba/g4.wav', 'g4');
    loadSound('sounds/marimba/a4.wav', 'a4');
    loadSound('sounds/marimba/b4.wav', 'b4');
    loadSound('sounds/marimba/c5.wav', 'c5');
    loadSound('sounds/marimba/d5.wav', 'd5');
    loadSound('sounds/marimba/e5.wav', 'e5');
    loadSound('sounds/marimba/f5.wav', 'f5');
    loadSound('sounds/marimba/g5.wav', 'g5');
    loadSound('sounds/marimba/a5.wav', 'a5');
    loadSound('sounds/marimba/b5.wav', 'b5');
    loadSound('sounds/marimba/c6.wav', 'c6');
    loadSound('sounds/marimba/d6.wav', 'd6');

    loadReverb('sounds/reverbs/Rays.wav', 'Rays');
    loadReverb('sounds/reverbs/Five Columns.wav', 'Five Columns');
    loadReverb('sounds/reverbs/Five Columns Long.wav', 'Five Columns Long');

    keys.on('space', function(){
        playing = !playing;
    });

    showmatrix();

    webkitRequestAnimationFrame(loop);
    last_t = performance.now();
});

function loop(t){
    if(playing){
        var elapsed = (t - last_t) / 1000.0;
        last_t = t;
        col_t += elapsed;
        if(col_t > col_time){
            col_t = 0;
            col = (++col) % col_max;
            playcol(col);
        }
    }

    if(mouse.leftdown){
        var x = mouse.x - canvas.offsetLeft;
        var y = mouse.y - canvas.offsetTop;

        var cw = canvas.width;
        var ch = canvas.height;

        var w = cw / col_max;
        var h = ch / row_max;

        var c = parseInt(x / w, 10);
        var r = parseInt(y / h, 10);
        
        if(c >= 0 && r >= 0 && c < col_max && r < row_max){
            if(keys('shift'))
                matrix[c][r] = 0;
            else
                matrix[c][r] = 1;
        }
    }

    mouse.update();
    keys.update();

    showmatrix();

    webkitRequestAnimationFrame(loop);
}

function showmatrix(){
    var cw = canvas.width;
    var ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    var w = cw / col_max;
    var h = ch / row_max;

    var outline, fill;

    var radius = 10;

    for(var i = 0; i < col_max; i++){
        ctx.fillStyle = (i == col) ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 102, 0, 0.8)';
        ctx.strokeStyle = (i == col) ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 102, 0, 1.0)';


        for(var j = 0; j < row_max; j++){
            if(matrix[i][j] == 1){
                roundedRectFill(ctx, i*w, j*h, w, h, radius);
                ctx.lineWidth = 2;
                roundedRectStroke(ctx, i*w, j*h, w, h, radius);
            }
        }
    }
}

function playcol(col){
    var i;
    for(i = 0; i < row_max; i++){
        if(matrix[col][i] === 1){
            playSound(soundI[i % soundI.length]);
        }
    }
}

function playSound(note){
    var s = ac.createBufferSource();
    if(!sounds[note]) return;
    s.buffer = sounds[note];
    var now = ac.currentTime;

    var gain = gainNode(1.0, 0.0, 0.4);
    s.connect(gain);
    gain.connect(ac.destination);

    s.noteOn(0);
}

function gainNode(start, end, time){
    var g = ac.createGainNode();
    var n = ac.currentTime;
    g.gain.linearRampToValueAtTime(start, n);
    g.gain.linearRampToValueAtTime(end, n + time);
    return g;
}

function loadSound(url, name){
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
        ac.decodeAudioData(xhr.response, function(buffer){
            sounds[name] = buffer;
        });
    };
    xhr.open('GET', url);
    xhr.send();
}
function loadReverb(url, name){
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(){
        ac.decodeAudioData(xhr.response, function(buffer){
            reverbs[name] = buffer;
        });
    };
    xhr.open('GET', url);
    xhr.send();
}

function roundedRectFill(ctx,x,y,width,height,radius){
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
}
function roundedRectStroke(ctx,x,y,width,height,radius){
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
}