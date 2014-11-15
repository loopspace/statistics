var histogram;
var hctx;
var boxplot;
var bctx;
var form;
var num;
var values = new Object();
var data = [];
var edata = [];
var sdata = [];
var scale = 10;
var border = 20;
var width;
var height;
var bwidth = 10;
var bheight = 10;
var gwidth;
var bins;
var hbin;
var nbins;
var offset;
var pos = 50;
var below;
var mouseClicked;
var distributions = [];
var distribution;

function init() {
    histogram = document.querySelector("#histogram");
    histogram.addEventListener("mousedown",doMouseDown,false);
    histogram.addEventListener("mouseup",doMouseUp,false);
    histogram.addEventListener("mouseout",doMouseOut,false);
    histogram.addEventListener("mousemove",doMouseMove,false);
    hctx = histogram.getContext("2d");

    boxplot = document.querySelector("#boxplot");
    bctx = boxplot.getContext("2d");
    
    form = document.querySelector("#values");
    var elts = form.elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
    	    element.onkeypress = checkReturn;
	if (element.type === "select-one")
    	    element.onchange = getValues;
    }

    var button = document.querySelector("#reset");
    button.onclick = function() {getValues(true)};
    
    elts = document.getElementsByClassName('arrow');
    for (var i=0, element; element = elts[i++];) {
	element.onclick = toggle_div;
    }
    
    setSize();
    getValues();
}

function makeGauss() {
    var g;

    return function (m,s) {
	if (g != null) {
	    var gg = g;
	    g = null;
	    return gg;
	}
	var u = 1;
	var v = 1;
	while (u*u + v*v > 1) {
	    u = 2 * Math.random() - 1;
	    v = 2 * Math.random() - 1; 
	}
	var r = u*u + v*v;
	var n = Math.sqrt(-2 * Math.log(r)/r);
	var x = u*n;
	var y = v*n;
	g = s*y + m;
	return s*x+m;
    }
}

function uniform(m,s) {
    return (2 * Math.random() - 1)*s*Math.sqrt(3) + m;
}

function exponential(m,s) {
    return -Math.log(1 - Math.random())*m;
}

distributions = [
    makeGauss(),
    exponential,
    uniform,
];


function getValues (redo) {
    var elts = form.elements;
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
	    if (element.name == "distribution") {
		x = distributions[element.options.selectedIndex];
		if (x != distribution)
		    redo = true;
		distribution = x
	    }
	}
    }
    if (redo) {
	// Regenerate random data
	data = [];
	for (var i=0;i<values.number;i++) {
	    data.push(distribution(values.mean,values.stddev));
	}
	edata = [];
    }
    edata.forEach(
	function(d) {
	    if (data.indexOf(d) != -1)
		data.splice(data.indexOf(d),1);
	}
    );
    ndarr.forEach(
	function(d) {
	    data.push(d);
	    edata.push(d);
	}
    );
    // sort the data
    sdata = data.slice(0);
    sdata.sort(compareNumbers);
    offset = Math.floor((Math.min(0,sdata[0]) - values.classb)/values.classw)*values.classw + values.classb;
    bins = [];
    below = 0;
    abelow = 0;
    nbins = 0;

    data.forEach( function(y) {
	x = Math.floor((y - offset)/values.classw)
	bins[x] = (bins[x] || 0) + 1;
	nbins = Math.max(nbins,x);
	if (y < pos)
	    below++;
    });
    nbins += 1;
    scale = gwidth/(nbins * values.classw);

    for (var i=0;i<Math.max(bins.length,nbins);i++) {
	bins[i] = bins[i] || 0;
    }
    x = Math.floor((pos-offset)/values.classw);
    if (x < nbins) {
	abelow = (pos/values.classw - x)*bins[x];
    
	for (var i=0;i<x;i++) {
	    abelow += bins[i];
	}
    } else {
	abelow = values.number;
    }
    hbin = 10/Math.ceil(Math.max.apply(null,bins)/10);
    document.querySelector('#below').innerHTML = below;
    document.querySelector('#abelow').innerHTML = abelow;
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    document.querySelector('#smean').innerHTML = Math.round10(mean(data),-1);
    document.querySelector('#smedian').innerHTML = Math.round10(median(data),-1);
    var md = mode(bins);
    document.querySelector('#smode').innerHTML = (md * values.classw + offset) + ' - ' + ((md+1) * values.classw + offset);
    document.querySelector('#svariance').innerHTML = Math.round10(variance(data),-1);
    document.querySelector('#sstddev').innerHTML = Math.round10(stddev(data),-1);
    var lq = Math.round10(lowerquartile(data),-1);
    var uq = Math.round10(upperquartile(data),-1);
    document.querySelector('#slowq').innerHTML = lq;
    document.querySelector('#supq').innerHTML = uq;
    document.querySelector('#siqrange').innerHTML = Math.round10(uq - lq,-1);

    lq = Math.round10(binlowerquartile(bins) * values.classw + offset,-1);
    var mq = Math.round10(binmedian(bins) * values.classw + offset,-1);
    uq = Math.round10(binupperquartile(bins) * values.classw + offset,-1);
    document.querySelector('#sblowq').innerHTML = lq;
    document.querySelector('#sbmedian').innerHTML = mq;
    document.querySelector('#sbupq').innerHTML = uq;
    document.querySelector('#sbiqrange').innerHTML = Math.round10(uq - lq,-1);

    // Raw data
    var datatxt = data.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    document.querySelector('#data').innerHTML = datatxt;

    // Sorted data
    datatxt = sdata.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    document.querySelector('#sdata').innerHTML = datatxt;

    // Frequency Table
    var tbl = document.querySelector("#freq");
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt,bbin,tbin;
    bbin = nbins;
    tbin = 0;
    for (var i=0; i<nbins;i++) {
	if (bins[i] != 0) {
	    bbin = Math.min(bbin,i);
	    tbin = Math.max(tbin,i);
	}
    }
    tbin += 1;
    for (var i=bbin;i<tbin;i++) {
	nrow = tblbdy.insertRow(i - bbin);
	ncell = nrow.insertCell(0);
	ntxt = document.createTextNode((i * values.classw) + offset);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(1);
	ntxt = document.createTextNode(" \u2014 " + ((i+1) * values.classw + offset));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(2);
	ntxt = document.createTextNode(bins[i]);
	ncell.appendChild(ntxt);
    }
    tbl.replaceChild(tblbdy,document.querySelector('#freqrows'));
    tblbdy.id = 'freqrows';
    // Stem and Leaf
    var sdata = data.map(function(v) {return Math.floor(v+.5)});
    sdata.sort(compareNumbers);
    tbl = document.querySelector("#stem");
    tblbdy = document.createElement('tbody');
    var stem = -10;
    var stemind = 0;
    var cellind;
    sdata.forEach(
	function(s) {
	    if (Math.floor(s/10) != stem) {
		stem = Math.floor(s/10);
		nrow = tblbdy.insertRow(stemind);
		stemind++;
		ncell = nrow.insertCell(0);
		cellind = 1;
		ntxt = document.createTextNode(stem);
		ncell.appendChild(ntxt);
		ncell = nrow.insertCell(1);
	    }
	    ntxt = document.createTextNode((s - stem*10) + ' ');
	    ncell.appendChild(ntxt);
	}
    );
    tbl.replaceChild(tblbdy,document.querySelector('#stemrows'));
    tblbdy.id = 'stemrows';
    // Draw histogram and box plot
    draw();
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function recalc(e) {
    var coords = getRelativeCoords(e);
    pos = (coords.x - border)/scale + offset;
    below=0;
    abelow = 0;
    data.forEach(
	function(v) {
	    if (v < pos)
		below++;
	}
    );
    var x = Math.floor((pos-offset)/values.classw);
    if (x < nbins) {
	abelow = ((pos-offset)/values.classw - x)*bins[x];
    
	for (var i=0;i<x;i++) {
	    abelow += bins[i];
	}
    } else {
	abelow = values.number;
    }
    document.querySelector('#below').innerHTML = below;
    document.querySelector('#abelow').innerHTML = Math.round10(abelow,-1);//Math.floor(abelow + .5);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    draw();
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

function draw() {
    clear(hctx);
    hctx.save();
    hctx.translate(0,histogram.height);
    hctx.translate(10,-20);
    hctx.translate(-offset*scale,0);
    drawAxes(hctx);
    hctx.strokeStyle = "black";
    for (var i=0; i<nbins;i++) {
	hctx.fillStyle = 'gray';
	hctx.fillRect((i*values.classw+offset)*scale,0,values.classw*scale,-bins[i]*hbin);
	if (bins[i] != 0) {
	    tm = hctx.measureText(bins[i]);
	    hctx.fillStyle = 'black';
	    hctx.fillText(bins[i],(values.classw*(i+.5)+offset)*scale-tm.width/2,-10);
	}
    }
    hctx.fillStyle = 'blue';
    data.forEach(
	function(x) {
	    mark(hctx,x*scale,-60);
	}
    );
    hctx.fillStyle = 'red';
    for (var i=0; i<bins.length; i++) {
	for (var j=0; j<bins[i]; j++) {
	    mark(hctx,(values.classw*i+offset)*scale + (j+.5)*scale*values.classw/bins[i],-70);
	}
    }
    hctx.strokeStyle = "red";
    hctx.beginPath();
    hctx.moveTo(pos*scale,0);

    hctx.lineTo(pos*scale,-100);
    hctx.stroke();
    hctx.restore();

    clear(bctx);
    bctx.save()
    bctx.translate(0,boxplot.height);
    bctx.translate(10,-20);
    bctx.translate(-offset*scale,0);
    drawAxes(bctx,0);
    var md = median(data);
    var lq = lowerquartile(data);
    var uq = upperquartile(data);
    var iq = uq - lq;
    bctx.fillStyle = 'gray';
    bctx.fillRect(lq*scale,-10,iq*scale,-40);
    bctx.beginPath();
    bctx.strokeStyle = 'red';
    bctx.moveTo(md*scale,-10);
    bctx.lineTo(md*scale,-50);
    bctx.stroke();
    var lf = md - 1.5*iq;
    var uf = md + 1.5*iq;
    var lw = md;
    var uw = md;
    data.forEach(function(x) {
	if (x > lf)
	    lw = Math.min(lw,x);
	if (x < uf)
	    uw = Math.max(uw,x);
    });
    bctx.beginPath();
    bctx.strokeStyle = 'black';
    bctx.moveTo(lq*scale,-30);
    bctx.lineTo(lw*scale,-30);
    bctx.moveTo(lw*scale,-50);
    bctx.lineTo(lw*scale,-10);
    bctx.moveTo(uq*scale,-30);
    bctx.lineTo(uw*scale,-30);
    bctx.moveTo(uw*scale,-50);
    bctx.lineTo(uw*scale,-10);
    bctx.stroke();
    data.forEach(function(x) {
	bctx.fillStyle = 'blue';
	mark(bctx,x*scale,-60);
	bctx.fillStyle = 'black';
	if ((x < lw) || (x > uw))
	    mark(bctx,x*scale,-30);
    });
    bctx.restore();
}

function mark(c,x,y) {
    c.beginPath();
    c.arc(x,y,values.radius,0,360);
    c.fill();
}

function drawAxes(c,o) {
    if (o === undefined) {
	o = offset;
    }
    c.beginPath();
    c.moveTo(0,10);
    c.lineTo(0,-height + 10);
    c.stroke();
    c.beginPath();
    c.moveTo(-10+offset*scale,0);
    c.lineTo(width - 10+offset*scale,0);
    c.stroke();
    c.beginPath();
    var tm;
    c.fillStyle = 'black';
    for (var i=0; i<=nbins;i++) {
	tm = hctx.measureText(i*values.classw+o);
	c.fillText(i*values.classw+o,(values.classw*i+o)*scale-tm.width/2,14);
    }
    c.stroke();
}

function setSize() {
    var fheight, fwidth;
    fheight=Math.min(window.innerHeight - form.offsetHeight,100+2*border+bheight);
    fwidth=window.innerWidth;
    histogram.height=fheight;
    histogram.width=fwidth;
    boxplot.height=fheight;
    boxplot.width=fwidth;
    width = fwidth - 2*border;
    height = fheight - 2*border;
    gwidth = width - bwidth;
}

function clear(c) {
    
    c.save();

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);

    c.restore();
}

function checkReturn(e) {
    if(e && e.keyCode == 13)
    {
	getValues();
	return false;
    }
}

function mean(d) {
    var s = 0;
    var n = d.length;
    d.forEach(function(x) {s += x});
    return s/n;
}

function variance(d) {
    var m = mean(d);
    var v = 0;
    var n = d.length;
    d.forEach(function(x) {v += x*x});
    return v/n - m*m;
}

function stddev(d) {
    var v = variance(d);
    return Math.sqrt(v);
}

function median (d) {
    var n = d.length;
    var sd = d.slice(0);
    sd.sort(compareNumbers);
    if (n%2 == 0) {
	return (sd[n/2-1] + sd[n/2])/2;
    } else {
	return sd[(n-1)/2];
    }
}

function lowerquartile (d) {
    var n = d.length;
    var sd = d.slice(0);
    sd.sort(compareNumbers);
    if (n%4 == 0) {
	return (sd[n/4-1] + sd[n/4])/2;
    } else {
	return sd[Math.floor(n/4)];
    }
}

function upperquartile (d) {
    var n = d.length;
    var sd = d.slice(0);
    sd.sort(compareNumbers);
    if (n%4 == 0) {
	return (sd[3*n/4-1] + sd[3*n/4])/2;
    } else {
	return sd[Math.floor(3*n/4)];
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
