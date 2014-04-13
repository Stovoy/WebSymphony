var tagToColor = {
    'DIV' : 'blue',
    'A' : 'red',
    'SPAN' : 'green',
    'IMG' : 'orange',
    'INPUT' : 'black'
};

var chords = [
    ['guitar/1.wav',
        'guitar/2.wav',
        'guitar/3.wav',
        'guitar/4.wav',
        'guitar/5.wav',
        'guitar/6.wav',
        'guitar/7.wav',
        'guitar/8.wav',
        'guitar/9.wav',
        'guitar/10.wav',
        'guitar/11.wav',
        'guitar/12.wav',
        'guitar/13.wav',
        'guitar/14.wav',
        'guitar/15.wav',
        'guitar/16.wav',
        'guitar/17.wav',
        'guitar/18.wav',
        'guitar/19.wav',
        'guitar/20.wav',
        'guitar/21.wav',
        'guitar/22.wav',
        'guitar/23.wav',
        'guitar/24.wav'],

    ['keyboard/1.wav',
        'keyboard/2.wav',
        'keyboard/3.wav',
        'keyboard/4.wav',
        'keyboard/5.wav',
        'keyboard/6.wav',
        'keyboard/7.wav',
        'keyboard/8.wav',
        'keyboard/9.wav',
        'keyboard/10.wav',
        'keyboard/11.wav',
        'keyboard/12.wav',
        'keyboard/13.wav',
        'keyboard/14.wav',
        'keyboard/15.wav',
        'keyboard/16.wav',
        'keyboard/17.wav',
        'keyboard/18.wav',
        'keyboard/19.wav',
        'keyboard/20.wav',
        'keyboard/21.wav',
        'keyboard/22.wav',
        'keyboard/23.wav',
        'keyboard/24.wav']
];

var licks = [
    ['acoustic_guitar/1.wav',
        'acoustic_guitar/2.wav',
        'acoustic_guitar/3.wav',
        'acoustic_guitar/4.wav',
        'acoustic_guitar/5.wav',
        'acoustic_guitar/6.wav',
        'acoustic_guitar/7.wav',
        'acoustic_guitar/8.wav',
        'acoustic_guitar/9.wav'],

    ['electric_guitar/1.wav',
        'electric_guitar/2.wav',
        'electric_guitar/3.wav',
        'electric_guitar/4.wav',
        'electric_guitar/5.wav'],

    ['flute/1.wav',
        'flute/2.wav'],

    ['keyboard/1.wav',
        'keyboard/2.wav',
        'keyboard/3.wav',
        'keyboard/4.wav',
        'keyboard/5.wav',
        'keyboard/6.wav'],

    ['nylon_guitar/1.wav',
        'nylon_guitar/2.wav',
        'nylon_guitar/3.wav',
        'nylon_guitar/4.wav',
        'nylon_guitar/5.wav'],

    ['sax/1.wav',
        'sax/2.wav',
        'sax/3.wav',
        'sax/4.wav',
        'sax/5.wav'],

    ['trumpet/1.wav',
        'trumpet/2.wav',
        'trumpet/3.wav',
        'trumpet/4.wav',
        'trumpet/5.wav'],

    ['pipes/1.wav',
        'pipes/2.wav',
        'pipes/3.wav',
        'pipes/4.wav',
        'pipes/5.wav',
        'pipes/6.wav',
        'pipes/7.wav',
        'pipes/8.wav',
        'pipes/9.wav']
];

var percussion = [
    ['conga/1.wav',
        'conga/2.wav',
        'conga/3.wav'],

    ['funk/1.wav',
        'funk/2.wav',
        'funk/3.wav',
        'funk/4.wav',
        'funk/5.wav'],

    ['jazz/1.wav',
        'jazz/2.wav',
        'jazz/3.wav',
        'jazz/4.wav'],

    ['world/1.wav',
        'world/2.wav',
        'world/3.wav',
        'world/4.wav',
        'world/5.wav',
        'world/6.wav',
        'world/7.wav',
        'world/8.wav',
        'world/9.wav',
        'world/10.wav',
        'world/11.wav',
        'world/12.wav',
        'world/13.wav',
        'world/14.wav',
        'world/15.wav',
        'world/16.wav']
];

var divCount = 0;
var spanCount = 0;
var aCount = 0;
var imgCount = 0;

var context = $('#song_animation_canvas').get(0).getContext('2d');
var windowWidth = Math.max($(document).width(), $(window).width())
var windowHeight = Math.max($(document).height(), $(window).height());
context.canvas.width = windowWidth;
context.canvas.height = windowHeight;
$('#song_progress').width(windowWidth - getScrollbarWidth() - 20);

var allElements = $("input, a, span, div, img");
var notes = createNotes(allElements);
var playingNotes = [];

notes.sort(function(a, b) {
    return Math.abs(a.b - b.b) < 50 ? a.r - b.r : a.b - b.b;
});

notes = setNotePlayData(notes);

var start = false;
var stop = false;
var restart = false;

var time = 0;
var interval;

$(document).ready(function(){
    playNotes();
});

function playNotes() {
    var i = 0;
    interval = setInterval(function() {
        advancePlayingNotes();
        while (true) {
            while (time - notes[i].playTime > 110) {
                i++;
            }
            var note = notes[i];
            if (note.playTime <= time) {
                note.howl.play();
                fillNote(note);
                var cloned = new Note(note.x, note.y, note.w, note.h);
                cloned.color = note.color;
                cloned.alpha = note.alpha;
                playingNotes.push(cloned);
                i++;
                var percentage = (i.toFixed() / notes.length) * 100;
                $("#song_progress").find("> div").width(percentage + '%') ;
                if (i > notes.length) {
                    clearInterval(interval);
                }
            }
            else {
                break;
            }
        }
        time += 100;
    }, 100);
}

$('#song_start').click(function() {
    if (!(interval !== false)) {
        playNotes();
    }
});

$('#song_stop').click(function() {
    clearInterval(interval);
    interval = false;
});

$('#song_restart').click(function() {
    time = 0;
    if (interval !== false) {
        clearInterval(interval);
    }
    playNotes();
});

var seed;
function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function randomBetween(min, max) {
    return Math.floor(random() * (max - min + 1) + min);
}

function advancePlayingNotes() {
    var i;
    var playingNote;
    for (i = 0; i < playingNotes.length; ++i) {
        playingNote = playingNotes[i];

        //Clear old note
        clearNote(playingNote);

        //Update old note
        playingNote.alpha -= 0.01;
        if (playingNote.alpha <= 0) {
            playingNotes.splice(i, 1);
        } else {
            playingNote.x--;
            playingNote.y--;
            playingNote.w += 2;
            playingNote.h += 2;
        }
    }
    for (i = 0; i < playingNotes.length; ++i) {
        fillNote(playingNotes[i]);
    }
}

function getColor(color, alpha) {
    var colors = {
        'black' : 'rgba(0, 0, 0, ' + alpha + ')',
        'red' : 'rgba(255, 0, 0, ' + alpha + ')',
        'green' : 'rgba(0, 255, 0, ' + alpha + ')',
        'blue' : 'rgba(0, 0, 255, ' + alpha + ')',
        'orange' : 'rgba(255, 165, 0, ' + alpha + ')'
    };
    return colors[color];
}

function fillNote(note) {
    context.fillStyle = getColor(note.color, note.alpha);
    roundRect(note.x, note.y, note.w, note.h, Math.min(note.w / 2, note.h / 2), true, false);
}

function clearNote(note) {
    context.clearRect(note.x, note.y, note.w, note.h);
}

function Note(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.r = x + w;
    this.b = y + h;
    this.color = 'gray';
    this.alpha = 0.5;
    this.playTime = 0;
    this.howl = null;
}

function createNotes(elementList) {
    var notes = [];
    var noteCount = 0;
    for (var i = 0; i < elementList.length; ++i) {
        var item = elementList[i];
        if (item == null) {
            continue;
        }
        var rect = item.getBoundingClientRect();
        //Check if valid, and add if it is
        if (!(rect.left < 0 || rect.top < 80 || rect.width < 3 || rect.height < 3 || rect.left >= windowWidth || rect.top >= windowHeight)) {
            if (item.tagName === 'DIV') {
                divCount++;
            }
            else if (item.tagName === 'SPAN') {
                spanCount++;
            }
            else if (item.tagName === 'A') {
                aCount++;
            }
            else if (item.tagName === 'IMG') {
                imgCount++;
            }
            notes[noteCount++] = new Note(rect.left, rect.top, rect.width, rect.height);
        }
    }
    return notes;
}

function setNotePlayData(sortedNotes) {
    seed = (divCount + 1) * (aCount + 1) * (spanCount + 1) * (imgCount + 1);

    var chordMode = randomBetween(0, 2);
    var lickMode = randomBetween(0, 2);
    var percussionMode = randomBetween(0, 2);

    var chordSelection = randomBetween(0, chords.length - 1);
    var percussionSelection = randomBetween(0, percussion.length - 1);

    var songPlan = createSongPlan(0);
    var songPlanIndex = 0;
    var songPlanSoundsIndex = 0;

    var countIndex = 0;

    var playTime = 3000;

    var diff = 4180;

    var chordIndex = 0;
    var lickIndex = 0;
    var percussionIndex = 0;

    var chordProgression = createProgression(chords, chordMode, chordSelection);
    var lickProgression = createProgression(licks, lickMode, randomBetween(0, licks.length - 1));
    var percussionProgression = createProgression(percussion, percussionMode, percussionSelection);

    for (var i = 0; i < sortedNotes.length; ++i) {
        var note = sortedNotes[i];
        note.playTime = playTime;

        var count = songPlan[songPlanIndex].count;

        var soundType = songPlan[songPlanIndex].sounds[songPlanSoundsIndex];

        if (++songPlanSoundsIndex == songPlan[songPlanIndex].sounds.length) {
            songPlanSoundsIndex = 0;
            if (++countIndex == count) {
                countIndex = 0;
                if (++songPlanIndex == songPlan.length) {
                    songPlanIndex = 0;

                    chordSelection = randomBetween(0, chords.length - 1);
                    percussionSelection = randomBetween(0, percussion.length - 1);
                }
            }
            playTime += diff;
        }

        var soundUrl = "";
        var soundGenre = "";

        if (soundType === 'lick') {
            soundGenre = 'licks';
            soundUrl = lickProgression[lickIndex++];
            if (lickIndex == lickProgression.length) {
                lickIndex = 0;
                lickMode = randomBetween(0, 3);
                lickProgression = createProgression(licks, lickMode, randomBetween(0, licks.length - 1));
            }
            note.color = 'red';
        }
        else if (soundType === 'chord') {
            soundGenre = 'chords';
            soundUrl = chordProgression[chordIndex++];
            if (chordIndex == chordProgression.length) {
                chordIndex = 0;
                chordMode = randomBetween(0, 3);
                chordProgression = createProgression(chords, chordMode, chordSelection);
            }
            note.color = 'green';
        }
        else if (soundType === 'percussion') {
            soundGenre = 'percussion';
            soundUrl = percussionProgression[percussionIndex++];
            if (percussionIndex == percussionProgression.length) {
                percussionIndex = 0;
                percussionMode = randomBetween(0, 3);
                percussionProgression = createProgression(percussion, percussionMode, percussionSelection);
            }
            note.color = 'blue';
        }
        var source = '../audio/' + soundGenre + '/' + soundUrl;
        note.source = source;
        note.howl = new Howl({
            urls: [source]
        });
    }

    sortedNotes.sort(function(a, b) {
        return a.playTime - b.playTime;
    });

    return sortedNotes;
}

function createSongPlan(type) {
    var songPlan = [];

    songPlan.push({sounds:['percussion'], count:2});
    songPlan.push({sounds:['percussion','chord'], count:4});
    songPlan.push({sounds:['percussion','lick'], count:1});
    songPlan.push({sounds:['percussion'], count:1});
    songPlan.push({sounds:['percussion','lick'], count:1});
    songPlan.push({sounds:['percussion'], count:1});
    songPlan.push({sounds:['percussion','lick'], count:4});
    songPlan.push({sounds:['percussion','lick','chord'], count:2});
    songPlan.push({sounds:['percussion','chord'], count:2});
    songPlan.push({sounds:['percussion','lick','chord'], count:2});
    songPlan.push({sounds:['percussion','chord'], count:2});
    songPlan.push({sounds:['percussion','lick','chord'], count:8});
    songPlan.push({sounds:['lick','chord'], count:4});
    songPlan.push({sounds:['chord'], count:4});
    songPlan.push({sounds:['lick','chord'], count:4});
    songPlan.push({sounds:['chord'], count:2});

    return songPlan;

    switch (type) {
        case 0:
            break;
        case 1:
            break;
        case 2:
            break;
        case 3:
            break;
        case 4:
            break;
        case 5:
            break;
        case 6:
            break;
        case 7:
            break;
    }
}

function createProgression(soundGenreArray, type, index) {
    var progression = [];

    var soundArray = soundGenreArray[index];

    var one = soundArray[randomBetween(0, soundArray.length - 1)];
    var two = soundArray[randomBetween(0, soundArray.length - 1)];
    var three = soundArray[randomBetween(0, soundArray.length - 1)];

    switch (type) {
        case 0:
            progression.push(one);
            progression.push(two);
            progression.push(one);
            progression.push(three);
            break;
        case 1:
            progression.push(one);
            progression.push(one);
            progression.push(two);
            progression.push(two);
            progression.push(one);
            progression.push(one);
            progression.push(two);
            progression.push(three);
            break;
        case 2:
            progression.push(one);
            progression.push(one);
            progression.push(two);
            progression.push(two);
            break;
        case 3:
            progression.push(one);
            progression.push(one);
            progression.push(three);
            progression.push(two);
            progression.push(one);
            progression.push(one);
            progression.push(three);
            progression.push(three);
            break;
    }

    return progression;
}

function roundRect(x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined" ) {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
    if (stroke) {
        context.stroke();
    }
    if (fill) {
        context.fill();
    }
}

function getScrollbarWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

    document.body.appendChild(outer);

    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";

    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);

    var widthWithScroll = inner.offsetWidth;

    // remove divs
    outer.parentNode.removeChild(outer);

    return widthNoScroll - widthWithScroll;
}