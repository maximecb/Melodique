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

//============================================================================
// Misc utility code
//============================================================================

/**
Assert that a condition holds true
*/
function assert(condition, errorText)
{
    if (!condition)
    {
        error(errorText);
    }
}

/**
Abort execution because a critical error occurred
*/
function error(errorText)
{
    alert('ERROR: ' + errorText);

    throw errorText;
}

/**
Test that a value is integer
*/
function isInt(val)
{
    return (
        Math.floor(val) === val
    );
}

/**
Test that a value is a nonnegative integer
*/
function isNonNegInt(val)
{
    return (
        isInt(val) &&
        val >= 0
    );
}

/**
Test that a value is a strictly positive (nonzero) integer
*/
function isPosInt(val)
{
    return (
        isInt(val) &&
        val > 0
    );
}

/**
Get the current time in seconds
*/
function getTimeSecs()
{
    return (new Date()).getTime() / 1000;
}

/**
Generate a random integer within [a, b]
*/
function randomInt(a, b)
{
    assert (
        isInt(a) && isInt(b) && a <= b,
        'invalid params to randomInt'
    );

    var range = b - a;

    var rnd = a + Math.floor(Math.random() * (range + 1));

    return rnd;
}

/**
Generate a random boolean
*/
function randomBool()
{
    return (randomInt(0, 1) === 1);
}

/**
Choose a random argument value uniformly randomly
*/
function randomChoice()
{
    assert (
        arguments.length > 0,
        'must supply at least one possible choice'
    );

    var idx = randomInt(0, arguments.length - 1);

    return arguments[idx];
}

/**
Generate a random floating-point number within [a, b]
*/
function randomFloat(a, b)
{
    if (a === undefined)
        a = 0;
    if (b === undefined)
        b = 1;

    assert (
        a <= b,
        'invalid params to randomFloat'
    );

    var range = b - a;

    var rnd = a + Math.random() * range;

    return rnd;
}

/**
Generate a random value from a normal distribution
*/
function randomNorm(mean, variance)
{
	// Declare variables for the points and radius
    var x1, x2, w;

    // Repeat until suitable points are found
    do
    {
    	x1 = 2.0 * randomFloat() - 1.0;
    	x2 = 2.0 * randomFloat() - 1.0;
    	w = x1 * x1 + x2 * x2;
    } while (w >= 1.0 || w == 0);

    // compute the multiplier
    w = Math.sqrt((-2.0 * Math.log(w)) / w);
    
    // compute the gaussian-distributed value
    var gaussian = x1 * w;
    
    // Shift the gaussian value according to the mean and variance
    return (gaussian * variance) + mean;
}

/**
Escape a string for valid HTML formatting
*/
function escapeHTML(str)
{
    str = str.replace(/\n/g, '<br>');
    str = str.replace(/ /g, '&nbsp;');
    str = str.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    return str;
}

/**
Find an element in the HTML DOM tree by its id
*/
function findElementById(id, elem)
{
    if (elem === undefined)
        elem = document

    for (k in elem.childNodes)
    {
        var child = elem.childNodes[k];

        if (child.attributes)
        {
            var childId = child.getAttribute('id');

            if (childId == id)
                return child;
        }

        var nestedElem = findElementById(id, child);

        if (nestedElem)
            return nestedElem;
    }

    return null;
}

/**
Encode an array of bytes into base64 string format
*/
function encodeBase64(data)
{
    assert (
        data instanceof Array,
        'invalid data array'
    );

    var str = '';

    function encodeChar(bits)
    {
        //console.log(bits);

        var ch;

        if (bits < 26)
            ch = String.fromCharCode(65 + bits);
        else if (bits < 52)
            ch = String.fromCharCode(97 + (bits - 26));
        else if (bits < 62)
            ch = String.fromCharCode(48 + (bits - 52));
        else if (bits === 62)
            ch = '+';
        else
            ch = '/';

        str += ch;
    }

    for (var i = 0; i < data.length; i += 3)
    {
        var numRem = data.length - i;

        // 3 bytes -> 4 base64 chars
        var b0 = data[i];
        var b1 = (numRem >= 2)? data[i+1]:0
        var b2 = (numRem >= 3)? data[i+2]:0

        var bits = (b0 << 16) + (b1 << 8) + b2;

        encodeChar((bits >> 18) & 0x3F);
        encodeChar((bits >> 12) & 0x3F);

        if (numRem >= 2)
        {
            encodeChar((bits >> 6) & 0x3F);

            if (numRem >= 3)
                encodeChar((bits >> 0) & 0x3F);
            else
                str += '=';
        }
        else
        {
            str += '==';
        }
    }

    return str;
}

/**
Resample and normalize an array of data points
*/
function resample(data, numSamples, outLow, outHigh, inLow, inHigh)
{
    // Compute the number of data points per samples
    var ptsPerSample = data.length / numSamples;

    // Compute the number of samples
    var numSamples = Math.floor(data.length / ptsPerSample);

    // Allocate an array for the output samples
    var samples = new Array(numSamples);

    // Extract the samples
    for (var i = 0; i < numSamples; ++i)
    {
        samples[i] = 0;

        var startI = Math.floor(i * ptsPerSample);
        var endI = Math.min(Math.ceil((i+1) * ptsPerSample), data.length);
        var numPts = endI - startI;

        for (var j = startI; j < endI; ++j)
            samples[i] += data[j];

        samples[i] /= numPts;
    }    

    // If the input range is not specified
    if (inLow === undefined && inHigh === undefined)
    {
        // Min and max sample values
        var inLow = Infinity;
        var inHigh = -Infinity;

        // Compute the min and max sample values
        for (var i = 0; i < numSamples; ++i)
        {
            inLow = Math.min(inLow, samples[i]);
            inHigh = Math.max(inHigh, samples[i]);
        }
    }

    // Compute the input range
    var iRange = (inHigh > inLow)? (inHigh - inLow):1;

    // Compute the output range
    var oRange = outHigh - outLow;

    // Normalize the samples
    samples.forEach(
        function (v, i) 
        {
            var normVal = (v - inLow) / iRange;
            samples[i] =  outLow + (normVal * oRange);
        }
    );

    // Return the normalized samples
    return samples;
}

