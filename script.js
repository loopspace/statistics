var hctx;
var bctx;
var values = new Object();
var data = new Data();
var scale = 10;

var pos;
var mouseClicked;

function init() {
    histogram = document.querySelector("#histogram");
    histogram.addEventListener("mousedown",doMouseDown,false);
    histogram.addEventListener("mouseup",doMouseUp,false);
    histogram.addEventListener("mouseout",doMouseOut,false);
    histogram.addEventListener("mousemove",doMouseMove,false);
    hctx = histogram.getContext("2d");

    boxplot = document.querySelector("#boxplot");
    bctx = boxplot.getContext("2d");

    var elts = document.querySelector("#data_form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
    	    element.onkeypress = checkReturn;
	if (element.type === "select-one")
    	    element.onchange = getValues;
    }
    elts = document.querySelector("#class_form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
    	    element.onkeypress = checkReturn;
    }

    var button = document.querySelector("#reset");
    button.onclick = function() {getValues(true)};
    
    elts = document.getElementsByClassName('arrow');
    for (var i=0, element; element = elts[i++];) {
	element.onclick = toggle_div;
    }
    
    setSize(histogram);
    setSize(boxplot);
    getValues();
}


function getValues (redo) {
    var elts = document.querySelector("#data_form").elements;
    var redo = redo || false;
    var x;
    var ndarr = [];
    for (var i=0, element; element = elts[i++];) {

	if (element.type === "text") {
	    if (element.name === "edata") {
		if (element.value != '') {
		    ndarr = element.value.split(/\s*[\s,;]+\s*/);
		    ndarr = ndarr.map(function(d) {return parseInt(d,10)});
		}
	    } else {
		x = parseInt(element.value,10);
		if (
		    ((element.name == "mean")
		     || (element.name == "stddev")
		     || (element.name == "number")
		    )
			&& (x != values[element.name] )
		) 
		    redo = true;
		values[element.name] = x;
	    }
	}
	if (element.type === 'select-one') {
	    x = element.options.selectedIndex;
	    if (x != values[element.name])
		redo = true;
	    values[element.name] = x
	}
    }
    var elts = document.querySelector("#class_form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
	    values[element.name] = parseInt(element.value,10);
    }

    if (redo) {
	// Regenerate random data
	data.generate(values.mean,values.stddev,values.number,values.distribution,values.type);
    }
    data.add_data(ndarr);
    data.initialise();
    data.set_table(values.classb,values.classw);
    pos = data.median();
    data.write_below('below',pos);
    data.write_abelow('abelow',pos);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    data.write_mean('smean');
    data.write_median('smedian');
    data.write_mode('smode');
    data.write_variance('svariance');
    data.write_stddev('sstddev');
    data.write_lowerquartile('slowq');
    data.write_upperquartile('supq');
    data.write_interquartilerange('siqrange');
    data.write_binlowerquartile('sblowq');
    data.write_binmedian('sbmedian');
    data.write_binupperquartile('sbupq');
    data.write_bininterquartilerange('sbiqrange');

    data.write('data');
    data.write_sorted('sdata');
    // Frequency Table
    data.write_table('freqrows');
    // Stem and Leaf
    data.write_stem('stemrows');
    // Draw histogram and box plot
    data.draw_histogram(hctx,pos);
    data.draw_boxplot(bctx);
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function recalc(e) {
    var coords = getRelativeCoords(e);
    pos = (coords.x - parseInt(window.getComputedStyle(hctx.canvas).marginLeft,10) - parseInt(window.getComputedStyle(hctx.canvas).marginRight,10) + data.offset)/data.scale;
    data.write_below('below',pos);
    data.write_abelow('abelow',pos);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    data.draw_histogram(hctx,pos);
}

function doMouseDown(e) {
    mouseClicked = true;
    recalc(e);
}
function doMouseUp(e) {
    mouseClicked = false;
}
function doMouseOut(e) {}
function doMouseMove(e) {
    if (mouseClicked) {
	recalc(e);
    }
}


function setSize(cvs) {
    cvs.width=window.innerWidth - parseInt(window.getComputedStyle(cvs).marginLeft,10) - parseInt(window.getComputedStyle(cvs).marginRight,10);
}

function checkReturn(e) {
    if(e && e.keyCode == 13)
    {
	getValues();
	return false;
    }
}


function mode (b) {
    var i = -1;
    var n = 0;
    for (var j=0; j < b.length; j++) {
	if (b[j] > n) {
	    i = j;
	    n = b[j];
	}
    }
    return i;
}

function binlowerquartile (b) {
    var n = 0;
    for (var j = 0; j < b.length; j++) {
	n += b[j];
    }
    n = n/4;
    var m = 0;
    for (var j = 0; j < b.length; j++) {
	if (m + b[j] > n) {
	    return j + (n - m)/b[j];
	}
	m += b[j];
    }
}

function binmedian (b) {
    var n = 0;
    for (var j = 0; j < b.length; j++) {
	n += b[j];
    }
    n = n/2;
    var m = 0;
    for (var j = 0; j < b.length; j++) {
	if (m + b[j] > n) {
	    return j + (n - m)/b[j];
	}
	m += b[j];
    }
}

function binupperquartile (b) {
    var n = 0;
    for (var j = 0; j < b.length; j++) {
	n += b[j];
    }
    n = 3*n/4;
    var m = 0;
    for (var j = 0; j < b.length; j++) {
	if (m + b[j] > n) {
	    return j + (n - m)/b[j];
	}
	m += b[j];
    }
}


// Copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
// Closure
(function(){

	/**
	 * Decimal adjustment of a number.
	 *
	 * @param	{String}	type	The type of adjustment.
	 * @param	{Number}	value	The number.
	 * @param	{Integer}	exp		The exponent (the 10 logarithm of the adjustment base).
	 * @returns	{Number}			The adjusted value.
	 */
	function decimalAdjust(type, value, exp) {
		// If the exp is undefined or zero...
		if (typeof exp === 'undefined' || +exp === 0) {
			return Math[type](value);
		}
		value = +value;
		exp = +exp;
		// If the value is not a number or the exp is not an integer...
		if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
			return NaN;
		}
		// Shift
		value = value.toString().split('e');
		value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
		// Shift back
		value = value.toString().split('e');
		return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
	}

	// Decimal round
	if (!Math.round10) {
		Math.round10 = function(value, exp) {
			return decimalAdjust('round', value, exp);
		};
	}
	// Decimal floor
	if (!Math.floor10) {
		Math.floor10 = function(value, exp) {
			return decimalAdjust('floor', value, exp);
		};
	}
	// Decimal ceil
	if (!Math.ceil10) {
		Math.ceil10 = function(value, exp) {
			return decimalAdjust('ceil', value, exp);
		};
	}

})();

function compareNumbers(a,b) {
    return a - b;
}

function toggle_div(e) {
    var dv;
    var src;
    var e = e || window.event;
    src = e.srcElement || e.target;
    dv = src.parentElement;
    dv = dv.nextSibling;
    while (dv && dv.nodeType != 1) {
	dv = dv.nextSibling;
    }
    if (dv.style.display && dv.style.display == 'none') {
	dv.style.display = 'block';
	src.innerHTML = '&#9660;';
    } else {
	dv.style.display = 'none';
	src.innerHTML = '&#9654;';
    }
    return false;
}

