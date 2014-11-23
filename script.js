var hctx;
var bctx;
var sctx;
var values = new Object();
var bins = [];
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
    
    var elts = document.querySelector("#form").elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
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

    var enable = document.querySelector('#enable_Y');
    enable.onchange = activateY;
    activateY_aux(enable);

    var classes = document.querySelector('#even');
    classes.onchange = evenClasses;
    evenClasses_aux(classes);
    
    var button = document.querySelector("#reset");
    button.onclick = function() {getValues(true); return false;};
    var plus = document.querySelector('#add_1');
    plus.onclick = function(e) {addQuantile(e.target);
	return false;};
    
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
    var elts = document.querySelector("#form").elements;
    var redo = redo || false;
    var x;
    var ndarr = [];
    var ename;
    for (var i=0, element; element = elts[i++];) {
	ename = element.name.substring(0,element.name.indexOf('_'));
	if (element.type === "text") {
	    if (element.name === "classes") {
		values[element.name] = element.value.toString();
	    } else if (ename === "edata") {
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
	    x = element.checked;
	    if (x != values[element.name] && element.name != 'even')
		redo = true;
	    values[element.name] = x;
	}
    }

    values.number_X = parseInt(values.number_X,10);
    values.number_Y = parseInt(values.number_Y,10);
    if (values.correlate || values.coding) {
	values.number_Y = values.number_X;
	values.distribution_Y = values.distribution_X;
    }

    if (values.type == 1) {
	toggleClass('cts',false);
	toggleClass('discrete',true);
    } else {
	toggleClass('discrete',false);
	toggleClass('cts',true);
    }
    
    if (redo) {
	// Regenerate random data
	data_X.generate(values.mean_X,values.stddev_X,values.number_X,values.distribution_X,values.type);
	data_Y.generate(values.mean_Y,values.stddev_Y,values.number_Y,values.distribution_Y,values.type);
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

    if (values.coding) {
	var d = [];
	data_X.data.forEach (function (x) { d.push(values.coding_a * x + values.coding_b) });
	data_Y.data = d;
    } else {
	data_Y.add_data(values.edata_Y||[]);
    }
    data_Y.initialise();

    bins = [];
    var lv,hv,lbls,lble;
    if (values.even) {
	lv = Math.floor((Math.min(data_X.sdata[0],data_Y.sdata[0]) - values.classb)/values.classw);
	hv = Math.ceil((Math.max(data_X.sdata[data_X.sdata.length-1],data_Y.sdata[data_Y.sdata.length-1]) - values.classb)/values.classw);

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
	lv = Math.floor(Math.min(data_X.sdata[0],data_Y.sdata[0])) - 1;
	hv = Math.ceil(Math.max(data_X.sdata[data_X.sdata.length-1],data_Y.sdata[data_Y.sdata.length-1])) + 1;
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
    data_X.write_below('below_X',pos);
    data_X.write_abelow('abelow_X',pos,bins);
    data_Y.write_below('below_Y',pos);
    data_Y.write_abelow('abelow_Y',pos,bins);
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    
    data_X.write_mean('smean_X');
    data_X.write_median('smedian_X');
    if (values.type == 1) {
	data_X.write_mode('smode_X');
    } else {
	data_X.write_modal('smode_X',bins);
    }
    data_X.write_variance('svariance_X');
    data_X.write_stddev('sstddev_X');
    data_X.write_lowerquartile('slowq_X');
    data_X.write_upperquartile('supq_X');
    data_X.write_interquartilerange('siqrange_X');
    data_X.write_binlowerquartile('sblowq_X',bins);
    data_X.write_binmedian('sbmedian_X',bins);
    data_X.write_binmean('sbmean_X',bins);
    data_X.write_binupperquartile('sbupq_X',bins);
    data_X.write_bininterquartilerange('sbiqrange_X',bins);

    data_X.write('data_X');
    data_X.write_sorted('sdata_X');

    data_Y.write_mean('smean_Y');
    data_Y.write_median('smedian_Y');
    if (values.type == 1) {
	data_Y.write_mode('smode_Y');
    } else {
	data_Y.write_modal('smode_Y',bins);
    }
    data_Y.write_variance('svariance_Y');
    data_Y.write_stddev('sstddev_Y');
    data_Y.write_lowerquartile('slowq_Y');
    data_Y.write_upperquartile('supq_Y');
    data_Y.write_interquartilerange('siqrange_Y');
    data_Y.write_binlowerquartile('sblowq_Y',bins);
    data_Y.write_binmedian('sbmedian_Y',bins);
    data_Y.write_binmean('sbmean_Y',bins);
    data_Y.write_binupperquartile('sbupq_Y',bins);
    data_Y.write_bininterquartilerange('sbiqrange_Y',bins);

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
	    data_X.write_ntile('quantile_' + m + '_X',k,n);
	    data_Y.write_ntile('quantile_' + m + '_Y',k,n);
	    data_X.write_entile('equantile_' + m + '_X',k,n,bins);
	    data_Y.write_entile('equantile_' + m + '_Y',k,n,bins);
	}
    }
    
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
    data_X.write_abelow('abelow_X',pos,bins);
    data_Y.write_below('below_Y',pos);
    data_Y.write_abelow('abelow_Y',pos,bins);
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
    getValues();
}

function setCorrelation_aux(e) {
    if (e.checked) {
	document.getElementsByName('distribution_Y')[0].disabled = true;
	document.getElementsByName('number_Y')[0].disabled = true;
	document.getElementsByName('correlation')[0].disabled = false;
	document.getElementsByName('coding_a')[0].disabled = true;
	document.getElementsByName('coding_b')[0].disabled = true;
	document.getElementsByName('coding')[0].checked = false;
    } else {
	document.getElementsByName('distribution_Y')[0].disabled = false;
	document.getElementsByName('number_Y')[0].disabled = false;
	document.getElementsByName('correlation')[0].disabled = true;
    }
}

function setCoding(e) {
    setCoding_aux(e.target);
    getValues();
}


function setCoding_aux(e) {
    if (e.checked) {
	document.getElementsByName('distribution_Y')[0].disabled = true;
	document.getElementsByName('number_Y')[0].disabled = true;
	document.getElementsByName('correlation')[0].disabled = true;
	document.getElementsByName('coding_a')[0].disabled = false;
	document.getElementsByName('coding_b')[0].disabled = false;
	document.getElementsByName('correlate')[0].checked = false;
    } else {
	document.getElementsByName('distribution_Y')[0].disabled = false;
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
    document.getElementsByName('number_Y')[0].disabled = !e.checked;
    document.getElementsByName('mean_Y')[0].disabled = !e.checked;
    document.getElementsByName('stddev_Y')[0].disabled = !e.checked;
    document.getElementsByName('edata_Y')[0].disabled = !e.checked;
    document.getElementsByName('correlate')[0].disabled = !e.checked;
    document.getElementsByName('correlation')[0].disabled = !e.checked;
    document.getElementsByName('coding')[0].disabled = !e.checked;
    document.getElementsByName('coding_a')[0].disabled = !e.checked;
    document.getElementsByName('coding_b')[0].disabled = !e.checked;

    toggleClass('second',e.checked);
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
    var lx,hx,s,vs;
    lx = Math.min(0,bins[0].lower);
    hx = bins[bins.length-1].upper;
    s = Math.min(scale,hctx.canvas.width/bins[bins.length-1].upper);
    if (data_Y.active) {
	hctx.canvas.height = "250";
	vs =  Math.min(10/Math.ceil(Math.max.apply(null,data_X.bins)/10),10/Math.ceil(Math.max.apply(null,data_X.bins)/10));
    } else {
	hctx.canvas.height = "100";
	vs = 10/Math.ceil(Math.max.apply(null,data_X.bins)/10);
    }
    offset = lx;
    ascale = s;
    clear(hctx);
    hctx.save();
    hctx.translate(0,hctx.canvas.height);
    hctx.translate(10,-20);
    hctx.translate(-lx*s,0);
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
	bctx.canvas.height = "100";
    }
    clear(bctx);
    bctx.save();
    bctx.translate(0,hctx.canvas.height);
    bctx.translate(10,-20);
    bctx.translate(-lx*s,0);
    drawAxes(bctx,lx,hx,s,bins);//values.classb);
    data_X.draw_boxplot(bctx);
    if (data_Y.active) {
	bctx.translate(0,-bctx.canvas.height/2);
	data_Y.draw_boxplot(bctx);
    }
    bctx.restore();
    
}

function scatter() {
    var lx,hx,s;
    lx = Math.min(0,bins[0].lower);
    hx = Math.ceil(bins[bins.length-1].upper/10)*10;
    s = Math.min(scale,hctx.canvas.width/bins[bins.length-1].upper);
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
    var w = 10;
    sctx.fillStyle = 'black';
    var nb = Math.ceil((hx-lx)/w);
    for (var i=0; i<=nb;i++) {
	sctx.moveTo(i*w*s,0);
	sctx.lineTo(i*w*s,5);
	tm = sctx.measureText(i*w);
	sctx.fillText(i*w,w*i*s-tm.width/2,14);
    }
    for (var i=0; i<=nb;i++) {
	sctx.moveTo(0,-i*w*s);
	sctx.lineTo(-5,-i*w*s);
	tm = sctx.measureText(i*w);
	sctx.fillText(i*w,-14-tm.width/2,-w*i*s);
    }
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
    console.log(e.rows);
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
