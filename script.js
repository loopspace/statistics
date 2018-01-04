var hctx;
var bctx;
var sctx;
var values = new Object();
var bins = [];
var data_X;
var data_Y;
var scale = 10;
var ascale = scale;
var offset = 0;

var pos;
var mouseClicked;
var yintercept;
var gradient;

var distributions = [
    gaussian,
    exponential,
    uniform,
    lognormal,
    binomial,
    poisson,
    uniformd
];


var tabs = [
    ["datadef","datadefdiv"],
    ["rawdata","rawdatadiv"],
//    ["sortdata","sortdatadiv"],
    ["datarep","datarepdiv"],
    ["freqtab","freqtabdiv"],
    ["stem","stemdiv"],
    ["hist","histdiv"],
    ["box","boxdiv"],
    ["samstat","samstatdiv"],
    ["correl","correldiv"],
    ["help","helpdiv"]
];

function init() {
    data_X = new Data('X');
    data_Y = new Data('Y');
    var histogram = document.querySelector("#histogram");
    histogram.addEventListener("mousedown",doHistMouseDown,false);
    histogram.addEventListener("mouseup",doHistMouseUp,false);
    histogram.addEventListener("mouseout",doHistMouseOut,false);
    histogram.addEventListener("mousemove",doHistMouseMove,false);
    hctx = histogram.getContext("2d");

    var boxplot = document.querySelector("#boxplot");
    bctx = boxplot.getContext("2d");

    var scatterplot = document.querySelector('#scatter');
    scatterplot.addEventListener("mousedown",doScatterMouseDown,false);
    scatterplot.addEventListener("mouseup",doScatterMouseUp,false);
    scatterplot.addEventListener("mouseout",doScatterMouseOut,false);
    scatterplot.addEventListener("mousemove",doScatterMouseMove,false);
    sctx = scatterplot.getContext('2d');
    
    var elts = document.querySelector("#form").elements;
    if (elts.length == 0) {
	elts = document.querySelectorAll('[form]');
    }
    
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text" || element.type === "textarea")
    	    element.onkeypress = checkReturn;
	if (element.type === "select-one")
    	    element.onchange = getValues;
    }

    var correlate = document.querySelector('#correlate');
    correlate.onchange = setCorrelation;
    setCorrelation_aux(correlate);

    var coding = document.querySelector('#coding');
    coding.onchange = setCoding;
    setCoding_aux(coding);

    var quantiles = document.querySelector('#quantiles');
    quantiles.onchange = setQuantiles;
    setQuantiles_aux(quantiles);

    var enable = document.querySelector('#enable_Y');
    enable.onchange = activateY;
    activateY_aux(enable);

    var auto_X = document.querySelector('#auto_X');
    auto_X.onchange = autoX;
    auto_aux(auto_X,"X");
    
    var auto_Y = document.querySelector('#auto_Y');
    auto_Y.onchange = autoY;
    auto_aux(auto_Y,"Y");
    
    var classes = document.querySelector('#even');
    classes.onchange = evenClasses;
    evenClasses_aux(classes);
    
    var button = document.querySelector("#reset");
    button.onclick = function() {getValues(true); return false;};

    button = document.querySelector("#regroup");
    button.onclick = getValues;

    button = document.querySelector("#resetre");
    button.onclick = function () {
	if (typeof MathJax !== 'undefined') {
	    MathJax.Hub.Queue(writeCorrelation);
	    MathJax.Hub.Queue(["Typeset",MathJax.Hub,'corrmathml']);
	} else {
	    writeCorrelation();
	}
    }
    
    var plus = document.querySelector('#add_1');
    plus.onclick = function(e) {addQuantile(e.target);
	return false;};
    
/*    elts = document.getElementsByClassName('arrow');
    for (var i=0, element; element = elts[i++];) {
	element.onclick = toggle_div;
    }
*/
    var tab;
    for (var i = 0; i < tabs.length; i++) {
	tabs[i][0] = document.getElementById(tabs[i][0]);
	tabs[i][1] = document.getElementById(tabs[i][1]);
	tabs[i][0].dataset.index = i;
	tabs[i][0].addEventListener('click', function(e) {
	    e.preventDefault();
	    var i = e.currentTarget.dataset.index;
	    for (var j = 0; j < tabs.length; j++) {
		tabs[j][1].style.display = 'none';
		tabs[j][0].classList.remove('current');
	    }
	    tabs[i][1].style.display = 'block';
	    tabs[i][0].classList.add('current');
	});
	tabs[i][1].style.display = 'none';
	tabs[i][0].classList.remove('current');
    }
    tabs[0][1].style.display = 'block';
    tabs[0][0].classList.add('current');

    /*
    var eyrow = document.getElementById("enableYrow")
    var ayrect = eyrow.getBoundingClientRect();
    var axtable = document.getElementById("autoXtable")
    var axrow = document.getElementById("autoXrow")
    var axrect = axrow.getBoundingClientRect();
    axtable.style.paddingTop = (ayrect.bottom - axrect.top) + 'px';
    */

    window.addEventListener('resize',resize);
    resize();
    
    setSize(histogram);
    setSize(boxplot);
    setSize(scatterplot);
    getValues();
}

window.addEventListener("load",init);

function resize() {
    var mdiv = document.getElementById('main');
    var rect = mdiv.getBoundingClientRect();
    var ht = document.documentElement.clientHeight - rect.top - 100;
    mdiv.style.height = Math.floor(ht) + 'px';
}

function getValues (redo) {
    var elts = document.querySelector("#form").elements;
    // hack for IE
    if (elts.length == 0) {
	elts = document.querySelectorAll('[form]');
    }
    var redo = redo || false;
    var x;
    var ndarr = [];
    var ename;
    for (var i=0, element; element = elts[i++];) {
	ename = element.name.substring(0,element.name.indexOf('_'));
	if (element.type === "text" || element.type == "textarea") {
	    if (element.name === "classes") {
		values[element.name] = element.value.toString();
	    } else if (ename === "edata" || ename === "adata") {
		if (element.value != '') {
		    ndarr = element.value.split(/\s*[\s,;]+\s*/);
		    ndarr = ndarr.map(function(d) {return parseFloat(d)}).filter(function(d) {return !Number.isNaN(d)});
		    values[element.name] = ndarr;
		} else {
		    values[element.name] = [];
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
	    x = element.checked;
	    if (x != values[element.name] && element.name != 'even')
		redo = true;
	    values[element.name] = x;
	}
    }

    values.number_X = parseInt(values.number_X,10);
    values.number_Y = parseInt(values.number_Y,10);

    if (values.correlate || values.coding || values.quantiles) {
	if (values.auto_X) {
	    values.number_Y = values.number_X;
	} else {
	    values.number_Y = values.adata_X.length;
	}
    }
    if (values.correlate || values.coding) {
	values.distribution_Y = values.distribution_X;
    }

    if (values.type == 2) {
	toggleClass('cts',false);
	toggleClass('discrete',true);
	toggleElts('ctsdist',false,true);
	toggleElts('discretedist',true,true);
	if (values.distribution_X < 4) {
	    values.distribution_X = 4;
	    document.getElementById('defdisc_X').selected = true;
	}
	if (values.distribution_Y < 4) {
	    values.distribution_Y = 4;
	    document.getElementById('defdisc_Y').selected = true;
	}
	setDistOptions(values.distribution_X,"X");
	setDistOptions(values.distribution_Y,"Y");
    } else {
	toggleClass('discrete',false);
	toggleClass('cts',true);
	toggleElts('ctsdist',true,true);
	toggleElts('discretedist',false,true);
	if (values.distribution_X > 3) {
	    values.distribution_X = 0;
	    document.getElementById('defcts_X').selected = true;
	}
	if (values.distribution_Y > 3) {
	    values.distribution_Y = 0;
	    document.getElementById('defcts_Y').selected = true;
	}
	setDistOptions(values.distribution_X,"X");
	setDistOptions(values.distribution_Y,"Y");
    }
    if (values.correlate || values.coding)
	enableElt('stddev_Y',false);

    if (redo) {
	// Regenerate random data
	if (values.auto_X) {
	    data_X.generate(values.mean_X,values.stddev_X,values.number_X,values.distribution_X,values.type,false);
	} else {
	    data_X.set_data(values.adata_X);
	}
    }
    if (redo || values.correlate) {
	if (values.auto_Y) {
	    data_Y.generate(values.mean_Y,values.stddev_Y,values.number_Y,values.distribution_Y,values.type,values.quantiles);
	} else {
	    data_Y.set_data(values.adata_Y);
	}
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

    if (values.quantiles) {
	var xdata = [];
	for (var i = 0; i < data_X.gdata.length; i++) {
	    xdata.push([data_X.gdata[i],i]);
	}
	xdata.sort(function(a,b) { return a[0] - b[0] });
	var ydata = [];
	for (var i = 0; i < data_Y.gdata.length; i++) {
	    ydata[xdata[i][1]] = data_Y.gdata[i];
	}
	data_Y.gdata = ydata;
    }
    
    data_X.add_data(values.edata_X||[]);
    data_X.initialise();

    if (! data_X.has_data()) {
	return false;
    }
    
    if (values.coding) {
	var d = [];
	data_X.data.forEach (function (x) { d.push(values.coding_a * x + values.coding_b) });
	data_Y.data = d;
    } else {
	data_Y.add_data(values.edata_Y||[]);
    }
    data_Y.initialise();

    if (! data_Y.has_data()) {
	data_Y.enable(false);
    }
    
    bins = [];
    var lv,hv,lbls,lble;
    if (values.even) {
	lv = Math.floor((getMinimum(data_X,data_Y) - values.classb)/values.classw);
	hv = Math.ceil((getMaximum(data_X,data_Y) - values.classb)/values.classw)+1;

	for (var i=0; i< hv-lv; i++) {
	    if (values.type == 1 && values.classw == 1) {
		lbls = ((i + lv)*values.classw + values.classb).toString();
		lble = '';
	    } else {
		lbls = ((i+lv)*values.classw + values.classb).toString();
		lble = ' \u2014 ' + ((i+1+lv)*values.classw + values.classb);
	    }
	    bins.push({labelpre: lbls, labelpost: lble, lower: (i+lv)*values.classw + values.classb, upper: (i+1+lv)*values.classw + values.classb});
	}
    } else {
	values.classes = values.classes || '';
	values.classes = values.classes.toString();
	lv = Math.floor(getMinimum(data_X,data_Y)) - 1;
	hv = Math.ceil(getMaximum(data_X,data_Y)) + 1;
	var lvs = values.classes.split(/\s*[\s,;]+\s*/);
	lvs = lvs.map(function(d) {return parseFloat(d)});
	lvs.sort(compareNumbers);
	if (lvs.length > 0 && !isNaN(lvs[0])) {
	    if (lvs[0] > lv)
		lvs.unshift(Math.floor(lv));
	    if (lvs[lvs.length-1] < hv)
		lvs.push(Math.ceil(hv));
	    for (var i=0; i< lvs.length-1; i++) {
		if (values.type == 1) {
		    if (lvs[i+1] - lvs[i] == 1) {
			lbls = lvs[i].toString();
			lble = ''
		    } else {
			lbls = lvs[i];
			lble = ' \u2014 ' + (lvs[i+1] -1);
		    }
		} else {
		    lbls = lvs[i];
		    lble = ' \u2014 ' + lvs[i+1];
		}
		bins.push({labelpre: lbls, labelpost: lble, lower: lvs[i], upper: lvs[i+1]});
	    }
	} else {
	    bins.push({labelpre: Math.floor(lv).toString(), labelpost: ' \u2014 ' + Math.ceil(hv+.1), lower: Math.floor(lv), upper: Math.ceil(hv+.1)});
	}
    }
    data_X.set_table(bins);
    data_Y.set_table(bins);

    pos = data_X.median();
    data_X.write_below('below',pos);
    data_X.write_abelow('abelow',pos,bins);
    data_Y.write_below('below',pos);
    data_Y.write_abelow('abelow',pos,bins);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    
    data_X.write_size('size');
    data_X.write_mean('smean');
    data_X.write_median('smedian');
    if (values.type == 2) {
	data_X.write_mode('smode');
    } else {
	data_X.write_modal('smode',bins);
    }
    data_X.write_variance('svariance');
    data_X.write_stddev('sstddev');
    data_X.write_lowerquartile('slowq');
    data_X.write_upperquartile('supq');
    data_X.write_interquartilerange('siqrange');
    data_X.write_skewmedian('smedskew');
    data_X.write_skewmode('smodeskew');
    data_X.write_skewquartile('sskewq');
    data_X.write_lilliefors('lilliefors');
    data_X.write_binlowerquartile('sblowq',bins);
    data_X.write_binmedian('sbmedian',bins);
    data_X.write_binmean('sbmean',bins);
    data_X.write_binvariance('sbvariance',bins);
    data_X.write_binstddev('sbstddev',bins);
    data_X.write_binupperquartile('sbupq',bins);
    data_X.write_bininterquartilerange('sbiqrange',bins);

    data_X.write('data');
    data_X.write_sorted('sdata');

    
    data_Y.write_size('size');
    data_Y.write_mean('smean');
    data_Y.write_median('smedian');
    if (values.type == 1) {
	data_Y.write_mode('smode');
    } else {
	data_Y.write_modal('smode',bins);
    }
    data_Y.write_variance('svariance');
    data_Y.write_stddev('sstddev');
    data_Y.write_lowerquartile('slowq');
    data_Y.write_upperquartile('supq');
    data_Y.write_interquartilerange('siqrange');
    data_Y.write_skewmedian('smedskew');
    data_Y.write_skewmode('smodeskew');
    data_Y.write_skewquartile('sskewq');
    data_Y.write_lilliefors('lilliefors');
    data_Y.write_binlowerquartile('sblowq',bins);
    data_Y.write_binmedian('sbmedian',bins);
    data_Y.write_binmean('sbmean',bins);
    data_Y.write_binvariance('sbvariance',bins);
    data_Y.write_binstddev('sbstddev',bins);
    data_Y.write_binupperquartile('sbupq',bins);
    data_Y.write_bininterquartilerange('sbiqrange',bins);

    var elts = document.getElementsByClassName('quantiles');
    var ch,k,n,m,idb;
    for (var i = 0; i < elts.length; i++) {
	ch = elts[i].children;
	k = '';
	n = '';
	m = elts[i].parentElement.id.substring(elts[i].parentElement.id.indexOf('_')+1);
	for (var j = 0; j < ch.length; j++) {
	    if (ch[j].tagName.toLowerCase() == 'input') {
		if (ch[j].value) {
		    if (ch[j].id.substring(0,ch[j].id.indexOf('_')) == 'kth') {
			k = parseInt(ch[j].value,10);
		    } else if (ch[j].id.substring(0,ch[j].id.indexOf('_')) == 'nth') {
			n = parseInt(ch[j].value,10);
		    }
		}
	    }
	}
	if (k != '' && n != '') {
	    data_X.write_ntile('quantile_' + m,k,n);
	    data_Y.write_ntile('quantile_' + m,k,n);
	    data_X.write_entile('equantile_' + m,k,n,bins);
	    data_Y.write_entile('equantile_' + m,k,n,bins);
	}
    }
    
    data_Y.write('data');
    data_Y.write_sorted('sdata');
    data_X.write_pairs('data_XY',data_Y);

    // Correlation
    // As these are inside a MathML element, we need to inform MathJax that we're changing them.
    if (typeof MathJax !== 'undefined') {
	MathJax.Hub.Queue(writeCorrelation);
	MathJax.Hub.Queue(["Typeset",MathJax.Hub,'corrmathml']);
    } else {
	writeCorrelation();
    }

    
    // Frequency Table
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt,bbin,tbin,vis;
    for (var i=0;i < bins.length; i++) {
	nrow = tblbdy.insertRow(-1);
	ncell = nrow.insertCell(-1);
	ntxt = document.createTextNode(bins[i].labelpre);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ntxt = document.createTextNode(bins[i].labelpost);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ncell.classList.add('first');
	if (i < data_X.first || i > data_X.last) {
	    nrow.classList.add('second');
	}
	ntxt = document.createTextNode(data_X.table_row(i));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(-1);
	ncell.classList.add('second');
	if (i < data_Y.first || i > data_Y.last) {
	    nrow.classList.add('first');
	}
	ntxt = document.createTextNode(data_Y.table_row(i));
	ncell.appendChild(ntxt);
    }
    var otblbdy = document.querySelector('#freqrows');
    var tbl = otblbdy.parentElement;
    tbl.replaceChild(tblbdy,otblbdy);
    tblbdy.id = 'freqrows';
    toggleClass('second',data_Y.active);
    if (data_Y.active && (data_X.data.length == data_Y.data.length)) {
	toggleClass('correlate',true);
    } else {
	toggleClass('correlate',false);
    }
    
    // Stem and Leaf
    stem();
    
    // Draw histogram and box plot
    plots();

    // Correlation graph
    if (data_Y.active)
	scatter();

    return false;
}

function writeCorrelation() {
    data_X.write_Sxx('Sxx');
    data_Y.write_Sxx('Syy');
    data_X.write_Sxy('Sxy',data_Y);
    data_X.write_pmcc('pmcc',data_Y);
    data_X.write_regression('gradient','intercept','error',data_Y);
    gradient = data_X.regression_gradient(data_Y);
    yintercept = data_X.regression_yintercept(data_Y);
    scatter();
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function recalc(e) {
    var coords = getRelativeCoords(e);
    pos = (coords.x + offset - 20)/ascale;
    data_X.write_below('below',pos);
    data_X.write_abelow('abelow',pos,bins);
    data_Y.write_below('below',pos);
    data_Y.write_abelow('abelow',pos,bins);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    plots();
}

function doHistMouseDown(e) {
    mouseClicked = true;
    recalc(e);
}
function doHistMouseUp(e) {
    mouseClicked = false;
}
function doHistMouseOut(e) {}
function doHistMouseMove(e) {
    if (mouseClicked) {
	recalc(e);
    }
}

function doScatterMouseDown(e) {
    mouseClicked = true;
    adjustRegression(e);
}
function doScatterMouseUp(e) {
    mouseClicked = false;
}
function doScatterMouseOut(e) {
}
function doScatterMouseMove(e) {
    if (mouseClicked) {
	adjustRegression(e);
    }
}

function adjustRegression(e) {
    var coords = getRelativeCoords(e);
    var x,y;
    var lx,hx,ly,hy,s;
    var w = 10;
    lx = Math.floor(Math.min(0,data_X.sdata[0])/w)*w;
    ly = Math.floor(Math.min(0,data_Y.sdata[0])/w)*w;
    hx = Math.ceil(Math.max(0,data_X.sdata[data_X.sdata.length-1])/w)*w;
    hy = Math.ceil(Math.max(0,data_Y.sdata[data_Y.sdata.length-1])/w)*w;
    s = Math.min(scale,(hctx.canvas.width-50)/(hx-lx));

    x = (coords.x - 20)/s + lx;
    y = hy - (coords.y - 20)/s + ly;
    var cx = (hx + lx)/2;
    if ( Math.abs(x - cx) > (hx - lx)/4) {
	var cy = gradient * cx + yintercept
	gradient = (y - cy)/(x - cx);
    }
    yintercept = y - gradient * x;
    scatter();
    data_X.write_linearguess('gradient','intercept','error',gradient,yintercept,data_Y);
}


function setSize(cvs) {
    cvs.width=parseInt(window.getComputedStyle(document.getElementById('main')).width,10) - parseInt(window.getComputedStyle(cvs).marginLeft,10) - parseInt(window.getComputedStyle(cvs).marginRight,10);
}

function checkReturn(e) {
    if(e && e.keyCode == 13)
    {
	getValues();
	return false;
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

function getMinimum(dx,dy) {
    if (dx.has_data() && dy.has_data()) {
	return Math.min(dx.sdata[0],dy.sdata[0]);
    } else if (dx.has_data()) {
	return dx.sdata[0];
    } else if (dy.has_data()) {
	return dy.sdata[0];
    } else {
	return 0;
    }
}

function getMaximum(dx,dy) {
    if (dx.has_data() && dy.has_data()) {
	return Math.max(dx.sdata[dx.sdata.length-1],dy.sdata[dy.sdata.length-1]);
    } else if (dx.has_data()) {
	return dx.sdata[dx.sdata.length-1];
    } else if (dy.has_data()) {
	return dy.sdata[dy.sdata.length-1];
    } else {
	return 10;
    }
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
    getValues();
}

function setCorrelation_aux(e) {
    enableYparameters(!e.checked);
    document.getElementsByName('correlation')[0].disabled = !e.checked;
    if (e.checked) {
	document.getElementsByName('coding_a')[0].disabled = true;
	document.getElementsByName('coding_b')[0].disabled = true;
	document.getElementsByName('coding')[0].checked = false;
	document.getElementsByName('quantiles')[0].checked = false;
    }
}

function setCoding(e) {
    setCoding_aux(e.target);
    getValues();
}

function setCoding_aux(e) {
    enableYparameters(!e.checked);
    document.getElementsByName('coding_a')[0].disabled = !e.checked;
    document.getElementsByName('coding_b')[0].disabled = !e.checked;
    if (e.checked) {
	document.getElementsByName('correlate')[0].checked = false;
	document.getElementsByName('quantiles')[0].checked = false;
	document.getElementsByName('correlation')[0].disabled = true;
    }
}

function setQuantiles(e) {
    setQuantiles_aux(e.target);
    getValues();
}

function setQuantiles_aux(e) {
    enableYparameters(!e.checked);
    if (e.checked) {
	document.getElementsByName('coding_a')[0].disabled = true;
	document.getElementsByName('coding_b')[0].disabled = true;
	document.getElementsByName('correlation')[0].disabled = true;
	document.getElementsByName('correlate')[0].checked = false;
	document.getElementsByName('coding')[0].checked = false;
	document.getElementsByName('mean_Y')[0].disabled = false;
	document.getElementsByName('stddev_Y')[0].disabled = false;
    }
}

function enableYparameters(e) {
    document.getElementsByName('number_Y')[0].disabled = !e;
    document.getElementsByName('mean_Y')[0].disabled = !e;
    document.getElementsByName('stddev_Y')[0].disabled = !e;
}

function autoX(e) {
    auto_aux(e.target,"X");
}

function autoY(e) {
    auto_aux(e.target,"Y");
}

function auto_aux(e,s) {
    if (e.checked) {
	document.getElementById("auto_data_" + s).style.display = "table-row-group";
	document.getElementById("self_data_" + s).style.display = "none";
    } else {
	document.getElementById("self_data_" + s).style.display = "table-row-group";
	document.getElementById("auto_data_" + s).style.display = "none";
    }
}

function activateY(e) {
    activateY_aux(e.target);
    /*
    stem();
    plots();
    scatter();
*/
}

function activateY_aux(e) {
    data_Y.enable(e.checked);
    /*
    document.getElementsByName('distribution_Y')[0].disabled = !e.checked;
    document.getElementsByName('number_Y')[0].disabled = !e.checked;
    document.getElementsByName('mean_Y')[0].disabled = !e.checked;
    document.getElementsByName('stddev_Y')[0].disabled = !e.checked;
    document.getElementsByName('edata_Y')[0].disabled = !e.checked;
    document.getElementsByName('correlate')[0].disabled = !e.checked;
    document.getElementsByName('correlation')[0].disabled = !e.checked;
    document.getElementsByName('coding')[0].disabled = !e.checked;
    document.getElementsByName('coding_a')[0].disabled = !e.checked;
    document.getElementsByName('coding_b')[0].disabled = !e.checked;
*/
    toggleClass('second',e.checked);
    if (e.checked && (data_X.data.length == data_Y.data.length)) {
	toggleClass('correlate',true);
    } else {
	toggleClass('correlate',false);
    }
}

function evenClasses(e) {
    evenClasses_aux(e.target);
    getValues();
}

function evenClasses_aux(e) {
    if (e.checked) {
	document.getElementsByName('classb')[0].disabled = false;
	document.getElementsByName('classw')[0].disabled = false;
	document.getElementsByName('classes')[0].disabled = true;
    } else {
	document.getElementsByName('classb')[0].disabled = true;
	document.getElementsByName('classw')[0].disabled = true;
	document.getElementsByName('classes')[0].disabled = false;
    }
}

function setDistOptions(v,s) {
    if (v == 4) { // Binomial
	toggleElt('cts_mean_' + s,false);
	toggleElt('binomial_mean_' + s,true);
	toggleElt('uniformd_mean_' + s,false);
	toggleElt('cts_stddev_' + s,false);
	toggleElt('binomial_stddev_' + s,true);
	enableElt('stddev_' + s,true)
    } else if (v == 5) { // Poisson
	toggleElt('cts_mean_' + s,true);
	toggleElt('binomial_mean_' + s,false);
	toggleElt('uniformd_mean_' + s,false);
	toggleElt('cts_stddev_' + s,false);
	toggleElt('binomial_stddev_' + s,false);
	enableElt('stddev_' + s,false)
    } else if (v == 6) { // Uniform discrete
	toggleElt('cts_mean_' + s,false);
	toggleElt('binomial_mean_' + s,false);
	toggleElt('uniformd_mean_' + s,true);
	toggleElt('cts_stddev_' + s,false);
	toggleElt('binomial_stddev_' + s,false);
	enableElt('stddev_' + s,false)
    } else { // All continuous
	toggleElt('cts_mean_' + s,true);
	toggleElt('binomial_mean_' + s,false);
	toggleElt('uniformd_mean_' + s,false);
	toggleElt('cts_stddev_' + s,true);
	toggleElt('binomial_stddev_' + s,false);
	enableElt('stddev_' + s,true)
    }
}


function toggleClass(c,b) {
    var elts = document.getElementsByClassName(c);
    var vis;
    if (b) {
	vis = '';
    } else {
	vis = 'none';
    }
    for (var i=0, elt; elt = elts[i]; i++)
	elt.style.display = vis;
}

function toggleElts(c,b,e) {
    if (e) {
	toggleElt(c + "_X",b);
	toggleElt(c + "_Y",b);
    } else {
	toggleElt(c,b);
    }
}

function toggleElt(c,b) {
    var elt = document.getElementById(c);
    if (!elt)
	console.log(c);
    var vis;
    if (b) {
	vis = '';
    } else {
	vis = 'none';
    }
    elt.style.display = vis;
}

function enableElt(c,b) {
    var elt = document.getElementById(c);
    elt.disabled = !b;
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

function drawAxes(c,lx,ux,s,b) {
    var height = c.canvas.height;
    c.beginPath();
    if (lx < 0 && ux > 0) {
	c.moveTo(0,10);
	c.lineTo(0,-height + 10);
    } else {
	c.moveTo(lx*s-10,10);
	c.lineTo(lx*s-10,-height + 10);
    }
    c.stroke();
    c.beginPath();
    c.moveTo(-20+lx*s,0);
    c.lineTo(ux*s + 10,0);
    c.stroke();
    c.beginPath();
    var tm;
    c.fillStyle = 'black';
    for (var i=0; i<b.length;i++) {
	c.moveTo(b[i].lower*s,0);
	c.lineTo(b[i].lower*s,5);
	tm = c.measureText(b[i].lower);
	c.fillText(b[i].lower,b[i].lower*s-tm.width/2,14);
    }
    c.moveTo(b[b.length-1].upper*s,0);
    c.lineTo(b[b.length-1].upper*s,5);
    tm = c.measureText(b[b.length-1].upper);
    c.fillText(b[b.length-1].upper,b[b.length-1].upper*s-tm.width/2,14);
    c.stroke();
}

function plots() {
    var lx,hx,s,vs,fd;
    lx = bins[0].lower;
    hx = bins[bins.length-1].upper;
    s = Math.min(scale,(hctx.canvas.width-40)/(hx-lx));
    fd = [];
    /*
      fd * n = ht * wd
      ht = fd * n / wd
      fd = ht * wd/n
      1/fd = n/(wd * ht)
      Take 100/max(n/wd)
     */
    for (var i = 0; i < bins.length; i++) {
	if (data_X.bins[i]) {
	    fd.push(data_X.bins[i]/(bins[i].upper - bins[i].lower));
	}
    }
    if (data_Y.active) {
	hctx.canvas.height = "250";
	for (var i = 0; i < bins.length; i++) {
	    if (data_Y.bins[i]) {
		fd.push(data_Y.bins[i]/(bins[i].upper - bins[i].lower));
	    }
	}
    } else {
	hctx.canvas.height = "130";
    }
    vs = Math.floor(10/(Math.max.apply(null,fd)/10));
    offset = lx*s;
    ascale = s;
    clear(hctx);
    hctx.save();
    hctx.translate(0,hctx.canvas.height);
    hctx.translate(10,-20);
    hctx.translate(-lx*s+10,0);
    drawAxes(hctx,lx,hx,s,bins);//values.classb);
    data_X.draw_histogram(hctx,pos,s,vs,bins);

    if (data_Y.active) {
	hctx.translate(0,-hctx.canvas.height/2);
	data_Y.draw_histogram(hctx,pos,s,vs,bins);
    }
    hctx.restore();
    if (data_Y.active) {
	bctx.canvas.height = "250";
    } else {
	bctx.canvas.height = "130";
    }
    clear(bctx);
    bctx.save();
    bctx.translate(0,hctx.canvas.height);
    bctx.translate(10,-20);
    bctx.translate(-lx*s+10,0);
    drawAxes(bctx,lx,hx,s,bins);//values.classb);
    data_X.draw_boxplot(bctx,s);
    if (data_Y.active) {
	bctx.translate(0,-bctx.canvas.height/2);
	data_Y.draw_boxplot(bctx,s);
    }
    bctx.restore();
    
}

function scatter() {
    var lx,hx,ly,hy,s;
    var w = 10;
    lx = Math.floor(Math.min(0,data_X.sdata[0])/w)*w;
    ly = Math.floor(Math.min(0,data_Y.sdata[0])/w)*w;
    hx = Math.ceil(Math.max(0,data_X.sdata[data_X.sdata.length-1])/w)*w;
    hy = Math.ceil(Math.max(0,data_Y.sdata[data_Y.sdata.length-1])/w)*w;
    s = Math.min(scale,(hctx.canvas.width-50)/(hx-lx));
    sctx.canvas.height = s*(hy-ly)+40;
    
    sctx.save();
    sctx.translate(0,sctx.canvas.height);
    sctx.translate(20,-20);
    sctx.translate(-lx*s,ly*s);

    var height = sctx.canvas.height;
    sctx.beginPath();
    sctx.moveTo(0,10-ly*s);
    sctx.lineTo(0,-hy*s - 10);
    sctx.stroke();
    sctx.beginPath();
    sctx.moveTo(-10+lx*s,0);
    sctx.lineTo(hx*s + 10,0);
    sctx.stroke();
    sctx.beginPath();
    var tm;
    sctx.fillStyle = 'black';
    var nb = Math.ceil(hx/w);
    for (var i=0; i<=nb;i++) {
	sctx.moveTo(i*w*s,0);
	sctx.lineTo(i*w*s,5);
	tm = sctx.measureText(i*w);
	sctx.fillText(i*w,w*i*s-tm.width/2,14);
    }
    nb = Math.ceil(-lx/w);
    for (var i=1; i<=nb;i++) {
	sctx.moveTo(-i*w*s,0);
	sctx.lineTo(-i*w*s,5);
	tm = sctx.measureText(-i*w);
	sctx.fillText(-i*w,-w*i*s-tm.width/2,14);
    }
    nb = Math.ceil(hy/w);
    for (var i=0; i<=nb;i++) {
	sctx.moveTo(0,-i*w*s);
	sctx.lineTo(-5,-i*w*s);
	tm = sctx.measureText(i*w);
	sctx.fillText(i*w,-14-tm.width/2,-w*i*s);
    }
    nb = Math.ceil(-ly/w);
    for (var i=1; i<=nb;i++) {
	sctx.moveTo(0,i*w*s);
	sctx.lineTo(-5,i*w*s);
	tm = sctx.measureText(-i*w);
	sctx.fillText(-i*w,-14-tm.width/2,w*i*s);
    }
    sctx.stroke();
    sctx.beginPath();
    var g = gradient;
    var yin = yintercept;
    sctx.moveTo(lx*s,-(lx*g + yin)*s);
    sctx.lineTo(hx*s,-(hx*g + yin)*s);
    sctx.stroke();
    for (var i=0; i < data_X.data.length; i++) {
	mark(sctx,s*data_X.data[i],-s*data_Y.data[i]);
    }
}

function addQuantile(e) {
    while (e && e.tagName.toLowerCase() !== 'tbody') {
	e = e.parentElement;
    }
    var lrow = e.rows[e.rows.length-2].id;
    var n = parseInt(lrow.substring(lrow.indexOf('_')+1),10);
    n++;
    var nrow = e.insertRow(-1);
    nrow.id = 'quantile_' + n;
    var ncell = nrow.insertCell(-1);
    ncell.classList.add('quantiles');
/*    var elt = document.createElement('button');
    elt.id = 'add_' + n;
    elt.textContent = '+';
    elt.classList.add('plus');
    elt.setAttribute('form','form');
    elt.setAttribute('name','add_' + n);
    elt.onclick = function(e) {addQuantile(e.target);
	return false;};
    ncell.appendChild(elt);
*/
    var elt = document.createElement('input');
    elt.id = 'kth_' + n;
    elt.setAttribute('type','text');
    elt.setAttribute('form','form');
    elt.classList.add('quantile');
    elt.onkeypress = checkReturn;
    ncell.appendChild(elt);
    elt = document.createTextNode('th quantile of\u0020');
    ncell.appendChild(elt);
    elt = document.createElement('input');
    elt.id = 'nth_' + n;
    elt.setAttribute('type','text');
    elt.setAttribute('form','form');
    elt.classList.add('quantile');
    elt.onkeypress = checkReturn;
    ncell.appendChild(elt);
    ncell = nrow.insertCell(-1);
    ncell.id = 'quantile_' + n + '_X';
    ncell = nrow.insertCell(-1);
    ncell.id = 'quantile_' + n + '_Y';
    ncell.classList.add('second');
    nrow = e.insertRow(-1);
    ncell = nrow.insertCell(-1);
    elt = document.createTextNode('Estimate:');
    ncell.appendChild(elt);
    ncell = nrow.insertCell(-1);
    ncell.id = 'equantile_' + n + '_X';
    ncell = nrow.insertCell(-1);
    ncell.id = 'equantile_' + n + '_Y';
    ncell.classList.add('second');
}
