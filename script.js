var hctx;
var bctx;
var sctx;
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

    var scatterplot = document.querySelector('#scatter');
    sctx = scatterplot.getContext('2d');
    
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

    var coding = document.querySelector('#coding');
    coding.onchange = setCoding;
    setCoding_aux(coding);

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
    setSize(scatterplot);
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
		    ndarr = ndarr.map(function(d) {return parseFloat(d)});
		    values[element.name] = ndarr;
		}
	    } else {
		x = parseFloat(element.value);
		if (
		    ((ename == "mean")
		     || (ename == "stddev")
		     || (ename == "number")
		     || (ename == "correlation")
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
	    redo = true;
	    values[element.name] = element.checked;
	}
    }
    var elts = document.querySelector("#class_form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
	    values[element.name] = parseFloat(element.value);
    }
    values.number_X = parseInt(values.number_X,10);
    values.number_Y = parseInt(values.number_Y,10);
    if (values.correlate || values.coding) {
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

    if (values.coding) {
	var d = [];
	data_X.data.forEach (function (x) { d.push(values.coding_a * x + values.coding_b) });
	data_Y.data = d;
    } else {
	data_Y.add_data(values.edata_Y||[]);
    }
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

    // Correlation
    data_X.write_Sxx('Sxx');
    data_Y.write_Sxx('Syy');
    data_X.write_Sxy('Sxy',data_Y);
    data_X.write_pmcc('pmcc',data_Y);

    
    // Frequency Table
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt,bbin,tbin,vis;
    var bbin = Math.min(data_X.zero,data_Y.zero);
    var tbin = Math.max(data_X.last,data_Y.last);
    if (data_Y.active) {
	vis = 'visible';
    } else {
	vis = 'hidden';
    }
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

    // Correlation graph
    if (data_Y.active)
	scatter();
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

/*
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

*/
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
	document.getElementsByName('coding_a')[0].disabled = true;
	document.getElementsByName('coding_b')[0].disabled = true;
	document.getElementsByName('coding')[0].checked = false;
    } else {
	document.getElementsByName('distribution_Y')[0].disabled = false;
	document.getElementsByName('type_Y')[0].disabled = false;
	document.getElementsByName('number_Y')[0].disabled = false;
	document.getElementsByName('correlation')[0].disabled = true;
    }
}

function setCoding(e) {
    setCoding_aux(e.target);
}


function setCoding_aux(e) {
    if (e.checked) {
	document.getElementsByName('distribution_Y')[0].disabled = true;
	document.getElementsByName('type_Y')[0].disabled = true;
	document.getElementsByName('number_Y')[0].disabled = true;
	document.getElementsByName('correlation')[0].disabled = true;
	document.getElementsByName('coding_a')[0].disabled = false;
	document.getElementsByName('coding_b')[0].disabled = false;
	document.getElementsByName('correlate')[0].checked = false;
    } else {
	document.getElementsByName('distribution_Y')[0].disabled = false;
	document.getElementsByName('type_Y')[0].disabled = false;
	document.getElementsByName('number_Y')[0].disabled = false;
	document.getElementsByName('coding_a')[0].disabled = true;
	document.getElementsByName('coding_b')[0].disabled = true;
    }
}

function activateY(e) {
    activateY_aux(e.target);
    stem();
    plots();
    scatter();
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
    document.getElementsByName('coding')[0].disabled = !e.checked;
    document.getElementsByName('coding_a')[0].disabled = !e.checked;
    document.getElementsByName('coding_b')[0].disabled = !e.checked;

    var elts = document.getElementsByClassName('second');
    var vis;
    if (e.checked) {
	vis = '';
    } else {
	vis = 'none';
    }
    for (var i=0, elt; elt = elts[i]; i++)
	elt.style.display = vis;
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
	document.querySelector('#leaflabel').style.display = 'inline';
    } else {
	root = leaf_X.start;
	document.querySelector('#leaflabel').style.display = 'none';
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
	    ncell.classList.add('second');
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

function drawAxes(c,lx,ux,s,w,o) {
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
    var lx,hx,s,vs;
    if (data_Y.active) {
	hctx.canvas.height = "250";
	lx = Math.min(0,data_X.offset,data_Y.offset);
	hx = Math.max(data_X.last,data_Y.last)*values.classw;
	s = Math.min(scale,hctx.canvas.width/((Math.max(data_X.last,data_Y.last))*values.classw));
	vs =  Math.min(10/Math.ceil(Math.max.apply(null,data_X.bins)/10),10/Math.ceil(Math.max.apply(null,data_X.bins)/10));
    } else {
	hctx.canvas.height = "100";
	lx = Math.min(0,data_X.offset);
	hx = data_X.last*values.classw;
	s = Math.min(scale,hctx.canvas.width/(data_X.last*values.classw));
	vs = 10/Math.ceil(Math.max.apply(null,data_X.bins)/10);
    }
    offset = lx;
    ascale = s;
    clear(hctx);
    hctx.save();
    hctx.translate(0,hctx.canvas.height);
    hctx.translate(10,-20);
    hctx.translate(-lx*s,0);
    drawAxes(hctx,lx,hx,s,values.classw,offset);//values.classb);
    data_X.draw_histogram(hctx,pos,s,vs);

    if (data_Y.active) {
	hctx.translate(0,-hctx.canvas.height/2);
	data_Y.draw_histogram(hctx,pos,s,vs);
    }
    hctx.restore();
    if (data_Y.active) {
	bctx.canvas.height = "250";
    } else {
	bctx.canvas.height = "100";
    }
    clear(bctx);
    bctx.save();
    bctx.translate(0,hctx.canvas.height);
    bctx.translate(10,-20);
    bctx.translate(-lx*s,0);
    drawAxes(bctx,lx,hx,s,values.classw,offset);//values.classb);
    data_X.draw_boxplot(bctx);
    if (data_Y.active) {
	bctx.translate(0,-bctx.canvas.height/2);
	data_Y.draw_boxplot(bctx);
    }
    bctx.restore();
    
}

function scatter() {
    var lx,hx,s;
    lx = Math.min(0,data_X.offset,data_Y.offset);
    hx = Math.max(data_X.last,data_Y.last)*values.classw;
    s = Math.min(scale,sctx.canvas.width/((Math.max(data_X.last,data_Y.last))*values.classw));
    sctx.canvas.height = s*(hx-lx)+40;
    
    sctx.save();
    sctx.translate(0,sctx.canvas.height);
    sctx.translate(20,-20);
    sctx.translate(-lx*s,-lx*s);

    var height = sctx.canvas.height;
    sctx.beginPath();
    sctx.moveTo(0,10+lx*s);
    sctx.lineTo(0,-hx*s - 10);
    sctx.stroke();
    sctx.beginPath();
    sctx.moveTo(-10+lx*s,0);
    sctx.lineTo(hx*s + 10,0);
    sctx.stroke();
    sctx.beginPath();
    var tm;
    var w = values.classw;
    var o = values.classb;
    sctx.fillStyle = 'black';
    var nb = Math.ceil((hx-lx)/w);
    for (var i=0; i<=nb;i++) {
	sctx.moveTo((i*w+o)*s,0);
	sctx.lineTo((i*w+o)*s,5);
	tm = sctx.measureText(i*w+o);
	sctx.fillText(i*w+o,(w*i+o)*s-tm.width/2,14);
    }
    for (var i=0; i<=nb;i++) {
	sctx.moveTo(0,-(i*w+o)*s);
	sctx.lineTo(-5,-(i*w+o)*s);
	tm = sctx.measureText(i*w+o);
	sctx.fillText(i*w+o,-14-tm.width/2,-(w*i+o)*s);
    }
    sctx.stroke();
    for (var i=0; i < data_X.data.length; i++) {
	mark(sctx,s*data_X.data[i],-s*data_Y.data[i]);
    }
}
