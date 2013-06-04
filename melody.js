/*****************************************************************************
*
*  This file is part of the Melodique project. The project is
*  distributed at:
*  https://github.com/maximecb/Melodique
*
*  Copyright (c) 2013, Maxime Chevalier-Boisvert. All rights reserved.
*
*  This software is licensed under the following license (Modified BSD
*  License):
*
*  Redistribution and use in source and binary forms, with or without
*  modification, are permitted provided that the following conditions are
*  met:
*   1. Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*   2. Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*   3. The name of the author may not be used to endorse or promote
*      products derived from this software without specific prior written
*      permission.
*
*  THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED
*  WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
*  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
*  NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
*  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
*  NOT LIMITED TO PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
*  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
*  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
*  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
*  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*****************************************************************************/

function initSynth(synthNet, piece)
{
    var outNode = synthNet.addNode(new OutNode(2));

    var mixer = synthNet.addNode(new Mixer());
    mixer.inVolume[0] = 0.3;
    mixer.outVolume = 1.0;

    // Synth piano
    var vanalog = synthNet.addNode(new VAnalog(2));
    vanalog.name = 'synth piano';
    vanalog.oscs[0].type = 'sawtooth';
    vanalog.oscs[0].detune = 0;
    vanalog.oscs[0].volume = 0.75;

    vanalog.oscs[0].env.a = 0;
    vanalog.oscs[0].env.d = 0.67;
    vanalog.oscs[0].env.s = 0.25;
    vanalog.oscs[0].env.r = 0.50;
    
    vanalog.oscs[1].type = 'pulse';
    vanalog.oscs[1].duty = 0.15;
    vanalog.oscs[1].detune = 1400;
    vanalog.oscs[1].volume = 1;

    vanalog.oscs[1].sync = true;
    vanalog.oscs[1].syncDetune = 0;

    vanalog.oscs[1].env = vanalog.oscs[0].env;
    
    vanalog.cutoff = 0.1;
    vanalog.resonance = 0;
    
    vanalog.filterEnv.a = 0;
    vanalog.filterEnv.d = 5.22;
    vanalog.filterEnv.s = 0;
    vanalog.filterEnv.r = 5;
    vanalog.filterEnvAmt = 0.75;

    // Connect all synth nodes and topologically order them
    vanalog.output.connect(mixer.input0);
    mixer.output.connect(outNode.signal);
    synthNet.orderNodes();

    // Create a track for the instrument
    var track = new Track(vanalog);
    piece.addTrack(track);
}

function initForm()
{
    var scaleRoot = findElementById('scaleRoot');
    for (var name in NOTE_NAME_PC)
    {
        var opt = document.createElement("option");
        opt.text = name;
        opt.value = NOTE_NAME_PC[name];
        scaleRoot.appendChild(opt);
    }

    var scaleType = findElementById('scaleType');
    for (var scale in scaleIntervs)
    {
        var opt = document.createElement("option");
        opt.text = scale;
        opt.value = scale;
        scaleType.appendChild(opt);
    }

    var chordTypes = findElementById('chordTypes');
    for (var type in chordIntervs)
    {    
        var text = document.createTextNode(type);
        chordTypes.appendChild(text);

        var checked = (type === 'maj' || type === 'min');

        var box = document.createElement('input');
        box.type = 'checkbox';
        box.name = type;
        box.checked = checked;
        chordTypes.appendChild(box);
    }

    var melPatterns = findElementById('melPatterns');

    for (var key in patterns)
    {    
        var pattern = patterns[key];

        var text = document.createTextNode(pattern.name);
        melPatterns.appendChild(text);

        var box = document.createElement('input');
        box.type = 'checkbox';
        box.name = key;
        box.checked = pattern.checked;
        melPatterns.appendChild(box);
    }
}

function makeMelody(piece)
{
    //
    // Extract form information
    //

    // Extract the scale root note
    var scaleRoot = document.getElementById('scaleRoot');
    for (var i = 0; i < scaleRoot.length; ++i)
    {
        if (scaleRoot[i].selected === true)
        {
            var pc = Number(scaleRoot[i].value);
            var rootNo = (new Note('C4')).noteNo + pc;
            var scaleRoot = new Note(rootNo);
            break;
        }
    }

    if ((scaleRoot instanceof Note) === false)
        error('Invalid scale root');

    // Extract the scale type
    var scaleType = findElementById('scaleType');
    for (var i = 0; i < scaleType.length; ++i)
    {
        if (scaleType[i].selected === true)
        {
            var scaleType = scaleType[i].value;
            break;
        }
    }

    if (scaleIntervs[scaleType] === undefined)
        error('Invalid scale type');

    // Extract the duration in bars
    var duration = findElementById('duration');
    var numBars = Number(duration.value);
    if (isPosInt(numBars) === false)
        error('Invalid duration in bars: ' + numBars);

    // Extract the tempo
    var tempo = findElementById('tempo');
    var beatsPerMin = Number(tempo.value);
    if (isPosInt(beatsPerMin) === false)
        error('Invalid tempo: ' + beatsPerMin);

    // Extract the time signature
    var timeSigNum = findElementById('timeSigNum');
    var timeSigDenom = findElementById('timeSigDenom');
    var beatsPerBar = Number(timeSigNum.value);
    var noteVal = Number(timeSigDenom.value);
    if (isPosInt(beatsPerBar) === false || isNaN(noteVal) === true)
        error('Invalid time signature');

    // Extract a list of chord types allowed
    var chordTypesElem = findElementById('chordTypes');
    var chordTypes = [];
    for (var i = 0; i < chordTypesElem.children.length; ++i)
    {
        var chordElem = chordTypesElem.children[i];
        if (chordElem.checked === true)
            chordTypes.push(chordElem.name);
    }
    if (chordTypes.length === 0)
        error('Must allow at least one chord type');

    // Extract the chord options
    var rootInv = Boolean(findElementById('rootInv').value);
    var endOnI = Boolean(findElementById('endOnI').value);

    // Extract a list of melodic patterns allowed
    var melPatternsElem = findElementById('melPatterns');
    var melPatterns = [];
    for (var i = 0; i < melPatternsElem.children.length; ++i)
    {
        var patElem = melPatternsElem.children[i];
        if (patElem.checked === true)
            melPatterns.push(patterns[patElem.name]);
    }
    if (melPatterns.length === 0)
        error('Must allow at least one melodic pattern type');

    //
    // Initialize the piece/track
    //

    // Get the melody track and clear it
    var track = piece.tracks[0];
    track.clear();

    // Set the tempo
    piece.beatsPerMin = beatsPerMin;

    // Set the time signature
    piece.beatsPerBar = beatsPerBar;
    piece.noteVal = noteVal;

    //
    // Melodic phrase generation
    //

    // TODO
    // - first inversion -> move the root an octave higher
    //- open chords -> move the root an octave lower

    // TODO
    // - Play with pauses, tonic (center tone), longer pauses on down phases?
    // - Chords sound better if they only use notes from the scale?

    // Usually people write songs that heavily use the I, IV, and V chords,
    // as well as the relative minor (vi)
    // TODO: give I, IV, V, vi chords higher probability?

    // Compute the total number of beats
    var numBeats = numBars * beatsPerBar;

    // Generate the scale notes
    var scaleNotes = genScale(scaleRoot, scaleType);

    console.log('num beats: ' + numBeats);

    // Get the major chord type to use
    var majType;
    if (chordTypes.indexOf('maj') !== -1)
        majType = 'maj';
    else if (chordTypes.indexOf('maj7') !== -1)
        majType = 'maj7';
    else
        majType = chordTypes[0];

    // Get the minor chord type to use
    var minType;
    if (chordTypes.indexOf('min') !== -1)
        minType = 'min';
    else if (chordTypes.indexOf('min7') !== -1)
        minType = 'min7';
    else
        minType = chordTypes[0];

    // Chord description string
    var chordNames = '';

    // Until the melodic phrase is complete
    for (var beatNo = 0; lastBeat !== true;)
    {
        var chordDegree;
        var chordType;

        //console.log('end time : ' + track.endTime());
        //console.log('beat time: ' + endBeatTime);

        // Test if this is the last beat
        var lastBeat = beatNo > numBeats - 2;

        // Choose the scale degree for this chord
        if (endOnI === true && lastBeat === true)
        {
            chordDegree = 0;
            chordType = majType;
        }
        else
        {
            var r0 = randomInt(0, (scaleNotes.length > 5)? 6:5);

            switch (r0)
            {
                // Random chord
                case 0:
                chordDegree = randomInt(0, scaleNotes.length - 1);
                chordType = randomChoice.apply(null, chordTypes);
                break;

                // I
                case 1:
                chordDegree = 0;
                chordType = majType;
                break;

                // IV
                case 2:
                case 3:
                chordDegree = 3;
                chordType = majType;
                break;

                // V
                case 4:
                case 5:
                chordDegree = 4;
                chordType = majType;
                break;

                // vi
                case 6:
                chordDegree = 5;
                chordType = minType;
                break;
            }
        }

        // Get the chord root note
        var chordRoot = scaleNotes[chordDegree];

        // Add the chord name to the name string
        chordNames += ((beatNo !== 0)? ' ':'') + chordRoot + chordType;

        // Generate the chord notes
        var chordNotes = genChord(chordRoot, chordType);

        // Randomly choose if the root should be inverted
        if (rootInv === true && randomBool() === true)
            chordNotes[0] = chordNotes[0].shift(1);

        // Sort the chord notes by ascending pitch
        chordNotes.sort(Note.sortFn);

        // Choose a melodic pattern
        if (endOnI === true && lastBeat === true)
            var pattern = patterns.allNotesOn;
        else
            var pattern = randomChoice.apply(null, melPatterns);

        // Make the notes for this pattern
        beatNo = pattern.makeNotes(piece, track, chordNotes, beatNo);
    }

    console.log('chord names: ' + chordNames);

    // Output the chord names on the page
    var chordText = findElementById('chordText');
    chordText.value = chordNames;

    // Draw the track with the generated notes
    drawTrack();
}

function drawMelody(canvas, canvasCtx, piece, track)
{
    piece.drawTrack(
        track,
        canvasCtx, 
        0, 
        0, 
        canvas.width, 
        canvas.height,
        new Note('C3'),
        4
    );
}

/**
@namespace Melodic patterns
*/
var patterns = {};

patterns.allNotesOn = {};
patterns.allNotesOn.name = 'All notes on';
patterns.allNotesOn.checked = true;
patterns.allNotesOn.makeNotes = function (piece, track, notes, beatNo)
{
    for (var i = 0; i < notes.length; ++i)
        piece.makeNote(track, beatNo, notes[i], 1);
 
    return beatNo + 1;
}

patterns.doubleNotes = {};
patterns.doubleNotes.name = 'Double notes';
patterns.doubleNotes.checked = true;
patterns.doubleNotes.makeNotes = function (piece, track, notes, beatNo)
{
    for (var i = 0; i < notes.length; ++i)
        piece.makeNote(track, beatNo, notes[i], 0.5);

    for (var i = 0; i < notes.length; ++i)
        piece.makeNote(track, beatNo + 0.5, notes[i], 0.5);

    return beatNo + 1;
}

patterns.shortNotes = {};
patterns.shortNotes.name = 'Short notes';
patterns.shortNotes.checked = true;
patterns.shortNotes.makeNotes = function (piece, track, notes, beatNo)
{
    for (var i = 0; i < notes.length; ++i)
        piece.makeNote(track, beatNo, notes[i], 0.5);

    return beatNo + 1;
}

patterns.ascArp = {};
patterns.ascArp.name = 'Asc. arp.';
patterns.ascArp.checked = true;
patterns.ascArp.makeNotes = function (piece, track, notes, beatNo)
{
    var noteLen = 1 / notes.length;

    for (var i = 0; i < notes.length; ++i)
    {
        var note = notes[i];
        piece.makeNote(track, beatNo + i * noteLen, note, noteLen);
    }

    return beatNo + 1;
}

patterns.descArp = {};
patterns.descArp.name = 'Desc. arp.';
patterns.descArp.checked = true;
patterns.descArp.makeNotes = function (piece, track, notes, beatNo)
{
    var noteLen = 1 / notes.length;

    for (var i = notes.length - 1; i >= 0; --i)
    {
        var note = notes[i];
        piece.makeNote(track, beatNo + i * noteLen, note, noteLen);
    }

    return beatNo + 1;
}

patterns.randArp = {};
patterns.randArp.name = 'Rand. arp.';
patterns.randArp.checked = true;
patterns.randArp.makeNotes = function (piece, track, notes, beatNo)
{
    var noteLen = 1 / notes.length;

    notes = notes.slice(0);

    for (var i = notes.length - 1; i >= 0; --i)
    {
        var n = randomInt(0, notes.length - 1);
        var note = notes[n];
        notes.splice(n, 1);

        piece.makeNote(track, beatNo + i * noteLen, note, noteLen);
    }

    return beatNo + 1;
}

/*
patterns.halfBeatGap = {};
patterns.halfBeatGap.name = '1/2-beat gap';
patterns.halfBeatGap.checked = false;
patterns.halfBeatGap.makeNotes = function (piece, track, notes, beatNo)
{
    beatNo += 0.5;
    return beatNo;
}
*/
