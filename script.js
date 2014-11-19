var hctx;
var bctx;
var values = new Object();
var data_X = new Data();
var data_Y = new Data();
var scale = 10;
var ascale = scale;
var offset = 0;

var pos;
var mouseClicked;

function init() {
    var histogram = document.querySelector("#histogram");
    histogram.addEventListener("mousedown",doMouseDown,false);
    histogram.addEventListener("mouseup",doMouseUp,false);
    histogram.addEventListener("mouseout",doMouseOut,false);
    histogram.addEventListener("mousemove",doMouseMove,false);
    hctx = histogram.getContext("2d");

    var boxplot = document.querySelector("#boxplot");
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
    var correlate = document.querySelector('#correlate');
    correlate.onchange = setCorrelation;
    setCorrelation_aux(correlate);

    var enable = document.querySelector('#enable_Y');
    enable.onchange = activateY;
    activateY_aux(enable);

    var button = document.querySelector("#reset");
    button.onclick = function() {getValues(true); return false;};
    
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
    var ename;
    for (var i=0, element; element = elts[i++];) {
	ename = element.name.substring(0,element.name.indexOf('_'));
	if (element.type === "text") {
	    if (ename === "edata") {
		if (element.value != '') {
		    ndarr = element.value.split(/\s*[\s,;]+\s*/);
		    ndarr = ndarr.map(function(d) {return parseInt(d,10)});
		    values[element.name] = ndarr;
		}
	    } else {
		x = parseInt(element.value,10);
		if (
		    ((ename == "mean")
		     || (ename == "stddev")
		     || (ename == "number")
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
	    values[element.name] = x;
	}
	if (element.type === 'checkbox') {
	    values[element.name] = element.checked;
	}
    }
    var elts = document.querySelector("#class_form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
	    values[element.name] = parseInt(element.value,10);
    }

    if (values.correlate) {
	values.number_Y = values.number_X;
	values.type_Y = values.type_X;
	values.distribution_Y = values.distribution_X;
    }
    
    if (redo) {
	// Regenerate random data
	data_X.generate(values.mean_X,values.stddev_X,values.number_X,values.distribution_X,values.type_X);
	data_Y.generate(values.mean_Y,values.stddev_Y,values.number_Y,values.distribution_Y,values.type_Y);
    }
    if (values.correlate) {
	data_Y.correlate(data_X,values.correlation||0);
	values.edata_X = values.edata_X || [];
	values.edata_Y = values.edata_Y || [];
	if (values.edata_X.length > values.edata_Y.length) {
	    if (values.edata_Y.length > 0) {
		for (var i = 0; i < values.edata_X.length - values.edata_Y.length; i++) {
		    values.edata_Y.push(values.edata_Y[values.edata_Y.length-1]);
		}
	    } else {
		values.edata_Y = values.edata_X;
	    }
	} else if (values.edata_X.length < values.edata_Y.length) {
	    if (valeus.edata_X.length > 0) {
		for (var i = 0; i < values.edata_Y.length - values.edata_X.length; i++) {
		    values.edata_X.push(values.edata_X[values.edata_X.length-1]);
		}
	    } else {
		values.edata_X = values.edata_Y;
	    }
	}
    }
    data_X.add_data(values.edata_X||[]);
    data_X.initialise();
    data_X.set_table(values.classb,values.classw);

    data_Y.add_data(values.edata_Y||[]);
    data_Y.initialise();
    data_Y.set_table(values.classb,values.classw);

    pos = data_X.median();
    data_X.write_below('below_X',pos);
    data_X.write_abelow('abelow_X',pos);
    data_Y.write_below('below_Y',pos);
    data_Y.write_abelow('abelow_Y',pos);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    
    data_X.write_mean('smean_X');
    data_X.write_median('smedian_X');
    data_X.write_mode('smode_X');
    data_X.write_variance('svariance_X');
    data_X.write_stddev('sstddev_X');
    data_X.write_lowerquartile('slowq_X');
    data_X.write_upperquartile('supq_X');
    data_X.write_interquartilerange('siqrange_X');
    data_X.write_binlowerquartile('sblowq_X');
    data_X.write_binmedian('sbmedian_X');
    data_X.write_binmean('sbmean_X');
    data_X.write_binupperquartile('sbupq_X');
    data_X.write_bininterquartilerange('sbiqrange_X');

    data_X.write('data_X');
    data_X.write_sorted('sdata_X');

    data_Y.write_mean('smean_Y');
    data_Y.write_median('smedian_Y');
    data_Y.write_mode('smode_Y');
    data_Y.write_variance('svariance_Y');
    data_Y.write_stddev('sstddev_Y');
    data_Y.write_lowerquartile('slowq_Y');
    data_Y.write_upperquartile('supq_Y');
    data_Y.write_interquartilerange('siqrange_Y');
    data_Y.write_binlowerquartile('sblowq_Y');
    data_Y.write_binmedian('sbmedian_Y');
    data_Y.write_binmean('sbmean_Y');
    data_Y.write_binupperquartile('sbupq_Y');
    data_Y.write_bininterquartilerange('sbiqrange_Y');

    data_Y.write('data_Y');
    data_Y.write_sorted('sdata_Y');
    // Frequency Table
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt,bbin,tbin;
    var bbin = Math.min(data_X.zero,data_Y.zero);
    var tbin = Math.max(data_X.last,data_Y.last);
    for (var i=bbin;i<tbin;i++) {
	nrow = tblbdy.insertRow(-1);
	ncell = nrow.insertCell(-1);
	ntxt = document.createTextNode((i * values.classw) + values.classb);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ntxt = document.createTextNode(" \u2014 " + ((i+1) * values.classw + values.classb));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ncell.classList.add('first');
	if (i < data_X.zero || i >=data_X.last) {
	    nrow.classList.add('second');
	}
	ntxt = document.createTextNode(data_X.table_row(i));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ncell.classList.add('second');
	if (i < data_Y.zero || i >=data_Y.last) {
	    nrow.classList.add('first');
	}
	ntxt = document.createTextNode(data_Y.table_row(i));
	ncell.appendChild(ntxt);
    }
    var otblbdy = document.querySelector('#freqrows');
    var tbl = otblbdy.parentElement;
    tbl.replaceChild(tblbdy,otblbdy);
    tblbdy.id = 'freqrows';
    
    // Stem and Leaf
    stem();
    
    // Draw histogram and box plot
    plots();

    return false;
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function recalc(e) {
    var coords = getRelativeCoords(e);
    pos = (coords.x - parseInt(window.getComputedStyle(hctx.canvas).marginLeft,10) - parseInt(window.getComputedStyle(hctx.canvas).marginRight,10) + offset)/ascale;
    data_X.write_below('below_X',pos);
    data_X.write_abelow('abelow_X',pos);
    data_Y.write_below('below_Y',pos);
    data_Y.write_abelow('abelow_Y',pos);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    plots();
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

function setCorrelation(e) {
    setCorrelation_aux(e.target);
}

function setCorrelation_aux(e) {
    if (e.checked) {
	document.getElementsByName('distribution_Y')[0].disabled = true;
	document.getElementsByName('type_Y')[0].disabled = true;
	document.getElementsByName('number_Y')[0].disabled = true;
	document.getElementsByName('correlation')[0].disabled = false;
    } else {
	document.getElementsByName('distribution_Y')[0].disabled = false;
	document.getElementsByName('type_Y')[0].disabled = false;
	document.getElementsByName('number_Y')[0].disabled = false;
	document.getElementsByName('correlation')[0].disabled = true;
    }
}

function activateY(e) {
    activateY_aux(e.target);
    stem();
    plots();
}

function activateY_aux(e) {
    data_Y.enable(e.checked);
    document.getElementsByName('distribution_Y')[0].disabled = !e.checked;
    document.getElementsByName('type_Y')[0].disabled = !e.checked;
    document.getElementsByName('number_Y')[0].disabled = !e.checked;
    document.getElementsByName('mean_Y')[0].disabled = !e.checked;
    document.getElementsByName('stddev_Y')[0].disabled = !e.checked;
    document.getElementsByName('edata_Y')[0].disabled = !e.checked;
    document.getElementsByName('correlate')[0].disabled = !e.checked;
    document.getElementsByName('correlation')[0].disabled = !e.checked;

    var elts = document.getElementsByClassName('second');
    var vis;
    if (e.checked) {
	vis = 'visible';
    } else {
	vis = 'collapse';
    }

    for (var i=0; i< elts.length; i++) {
	elts[i].style.visibility = vis;
    }
}

function blank(id) {
    document.querySelector('#' + id).innerHTML = '';
}

function stem() {
    var leaf_X,leaf_Y,side;
    if (data_Y.active)
	side = true;
	
    leaf_X = data_X.prepare_stem(side);
    leaf_Y = data_Y.prepare_stem(!side);
    var leafX,leafY,root;
    if (data_Y.active) {
	root = Math.min(leaf_X.start,leaf_Y.start);
    } else {
	root = leaf_X.start;
    }
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt;
    leafX = leaf_X.leaves(root);
    leafY = leaf_Y.leaves(root);
    while (leafX !== false || leafY !== false) {
	nrow = tblbdy.insertRow(-1);
	ncell = nrow.insertCell(-1);
	if (data_Y.active) {
	    ntxt = document.createTextNode(leafX || '');
	    ncell.appendChild(ntxt);
	    ncell = nrow.insertCell(-1);
	}
	ntxt = document.createTextNode(root*10);
	ncell.appendChild(ntxt);
	ncell.classList.add('stem');
	ncell = nrow.insertCell(-1);
	if (data_Y.active) {
	    ntxt = document.createTextNode(leafY || '');
	} else {
	    ntxt = document.createTextNode(leafX || '');
	}	    
	ncell.appendChild(ntxt);
	root++;
	leafX = leaf_X.leaves(root);
	leafY = leaf_Y.leaves(root);
    }
    var otblbdy = document.querySelector('#stemrows');
    var tbl = otblbdy.parentElement;
    tbl.replaceChild(tblbdy,otblbdy);
    tblbdy.id = 'stemrows';
    if (!data_Y.active) {
	document.querySelector('#leftleaf').style.display = 'none';
    } else {
	document.querySelector('#leftleaf').style.display = 'block';
    }	
}

function clear(c) {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.restore();
}

drawAxes = function(c,lx,ux,s,w,o) {
    var height = c.canvas.height;
    c.beginPath();
    c.moveTo(0,10);
    c.lineTo(0,-height + 10);
    c.stroke();
    c.beginPath();
    c.moveTo(-10+lx*s,0);
    c.lineTo(ux*s + 10,0);
    c.stroke();
    c.beginPath();
    var tm;
    c.fillStyle = 'black';
    var nb = Math.ceil((ux-lx)/w);
    for (var i=0; i<=nb;i++) {
	c.moveTo((i*w+o)*s,0);
	c.lineTo((i*w+o)*s,5);
	tm = c.measureText(i*w+o);
	c.fillText(i*w+o,(w*i+o)*s-tm.width/2,14);
    }
    c.stroke();
}

function plots() {
    if (data_Y.active) {
	hctx.canvas.height = "200";
    } else {
	hctx.canvas.height = "100";
    }
    clear(hctx);
    var lx = Math.min(0,data_X.offset,data_Y.offset);
    offset = lx;
    var hx = Math.max(data_X.last,data_Y.last)*values.classw;
    var s = Math.min(scale,hctx.canvas.width/((Math.max(data_X.last,data_Y.last))*values.classw));
    ascale = s;
    hctx.save();
    hctx.translate(0,hctx.canvas.height);
    hctx.translate(10,-20);
    hctx.translate(lx*s,0);
    drawAxes(hctx,lx,hx,s,values.classw,values.classb);
    data_X.draw_histogram(hctx,pos,s);

    if (data_Y.active) {
	hctx.translate(0,-hctx.canvas.height/2);
	data_Y.draw_histogram(hctx,pos,s);
    }
    hctx.restore();
    if (data_Y.active) {
	bctx.canvas.height = "200";
    } else {
	bctx.canvas.height = "100";
    }
    clear(bctx);
    bctx.save();
    bctx.translate(0,hctx.canvas.height);
    bctx.translate(10,-20);
    bctx.translate(lx*s,0);
    drawAxes(bctx,lx,hx,s,values.classw,values.classb);
    data_X.draw_boxplot(bctx);
    if (data_Y.active) {
	bctx.translate(0,-bctx.canvas.height/2);
	data_Y.draw_boxplot(bctx);
    }
    bctx.restore();
    
}
