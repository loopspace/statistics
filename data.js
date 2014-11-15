var Data;

var distributions = [];
var data_types = [];
var precision = -1;

Data = function() {
}

Data.prototype.generate = function(m,s,n,d,t) {
    this.gdata = [];
    for (var i=0;i<n;i++) {
	this.gdata.push(data_types[t](distributions[d](m,s)));
    }
}

Data.prototype.add_data = function(d) {
    this.data = this.gdata.concat(d);
}

Data.prototype.initialise = function() {
    this.sdata = this.data.slice(0);
    this.sdata.sort(compareNumbers);
    this.stats = [];
}

Data.prototype.set_table = function(o,w) {
    var offset =  Math.floor((Math.min(0,this.sdata[0]) - o)/w)*w + o;
    this.width = w;
    var bins = [];

    var x;
    this.data.forEach( function(y) {
	x = Math.floor((y - offset)/w)
	bins[x] = (bins[x] || 0) + 1;
    });

    for (var i=0;i<bins.length;i++) {
	bins[i] = bins[i] || 0;
    }
    this.bins = bins;
    this.offset = offset;
}

Data.prototype.write = function(id) {
    var datatxt = this.data.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    set_field(id,datatxt);
}

Data.prototype.write_sorted = function(id) {
    var datatxt = this.sdata.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    set_field(id,datatxt);
}

Data.prototype.write_table = function(id) {
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt,bbin,tbin;
    var bbin = this.bins.length;
    var tbin = 0;
    for (var i=0; i<this.bins.length;i++) {
	if (this.bins[i] != 0) {
	    bbin = Math.min(bbin,i);
	    tbin = Math.max(tbin,i);
	}
    }
    tbin += 1;
    for (var i=bbin;i<tbin;i++) {
	nrow = tblbdy.insertRow(i - bbin);
	ncell = nrow.insertCell(0);
	ntxt = document.createTextNode((i * this.width) + this.offset);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(1);
	ntxt = document.createTextNode(" \u2014 " + ((i+1) * this.width + this.offset));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(2);
	ntxt = document.createTextNode(this.bins[i]);
	ncell.appendChild(ntxt);
    }
    var otblbdy = document.querySelector('#' + id);
    var tbl = otblbdy.parentElement;
    tbl.replaceChild(tblbdy,otblbdy);
    tblbdy.id = id;
}

Data.prototype.write_stem = function(id) {
    var sdata = this.data.map(function(v) {return Math.floor(v+.5)});
    sdata.sort(compareNumbers);
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
    var otblbdy = document.querySelector('#' + id);
    var tbl = otblbdy.parentElement;
    tbl.replaceChild(tblbdy,otblbdy);
    tblbdy.id = id;
}

Data.prototype.write_below = function(id,p) {
    var n = 0;
    this.data.forEach( function(x) {
	if (x < p) {
	    n++;
	}
    });
    set_field(id,n);
}

Data.prototype.write_abelow = function(id,p) {
    var n = 0;
    var abelow;
    var x = Math.floor((p-this.offset)/this.width);
    if (x < this.bins.length) {
	abelow = (p/this.width - x)*this.bins[x];
	for (var i=0;i<x;i++) {
	    abelow += this.bins[i];
	}
    } else {
	abelow = this.data.length;
    }
    set_field(id,Math.round10(abelow,-1));
}

Data.prototype.mean = function() {
    if (this.stats.mean) {
	return this.stats.mean;
    }
    var s = 0;
    this.data.forEach(function(x) {s += x});
    this.stats.mean = s/this.data.length;
    return this.stats.mean;
}

Data.prototype.write_mean = function(id) {
    set_field(id,Math.round10(this.mean(),precision));
}
    
Data.prototype.variance = function() {
    if (this.stats.variance) {
	return this.stats.variance;
    }
    var s = 0;
    var m = this.mean();
    this.data.forEach(function(x) {s += x*x});
    this.stats.variance = s/this.data.length - m*m;
    return this.stats.variance;
}

Data.prototype.write_variance = function(id) {
    set_field(id,Math.round10(this.variance(),precision));
}

Data.prototype.stddev = function() {
    if (this.stats.stddev) {
	return this.stats.stddev;
    }
    var v = this.variance();
    this.stats.stddev = Math.sqrt(v);
    return this.stats.stddev;
}

Data.prototype.write_stddev = function(id) {
    set_field(id,Math.round10(this.stddev(),precision));
}

Data.prototype.ntile = function(k,n) {
    if (this.sdata.length%n == 0) {
	return (this.sdata[k*this.sdata.length/n - 1] + this.sdata[k*this.sdata.length/n])/2;
    } else {
	return this.sdata[Math.floor(k*this.sdata.length/n)];
    }
}

Data.prototype.median = function(id) {
    if (this.stats.median) {
	return this.stats.median;
    }
    this.stats.median = this.ntile(1,2);
    return this.stats.median;
}

Data.prototype.write_median = function(id) {
    set_field(id,Math.round10(this.median(),precision));
}

Data.prototype.lowerquartile = function() {
    if (this.stats.lowerquartile) {
	return this.stats.lowerquartile;
    }
    this.stats.lowerquartile = this.ntile(1,4);
    return this.stats.lowerquartile;
}

Data.prototype.write_lowerquartile = function(id) {
    set_field(id,Math.round10(this.lowerquartile(),precision));
}

Data.prototype.upperquartile = function() {
    if (this.stats.upperquartile) {
	return this.stats.upperquartile;
    }
    this.stats.upperquartile = this.ntile(3,4);
    return this.stats.upperquartile;
}

Data.prototype.write_upperquartile = function(id) {
    set_field(id,Math.round10(this.upperquartile(),precision));
}

Data.prototype.interquartilerange = function() {
    return this.upperquartile() - this.lowerquartile();
}

Data.prototype.write_interquartilerange = function(id) {
    set_field(id,Math.round10(this.interquartilerange(),precision));
}

Data.prototype.entile = function(k,n) {
    var l = k/n*this.data.length;
    var i = 0;
    var m = 0;
    for (var j=0; j < this.bins.length; j++) {
	if (this.bins[j] < l) {
	    i = j;
	    l -= this.bins[j];
	} else {
	    break;
	}
    }
    i += 1;
    return i*this.width + this.offset + l/this.bins[i]*this.width;
}

Data.prototype.binlowerquartile = function() {
    if (this.stats.binlowerquartile) {
	return this.stats.binlowerquartile;
    }
    this.stats.binlowerquartile = this.entile(1,4);
    return this.stats.binlowerquartile;
}

Data.prototype.write_binlowerquartile = function(id) {
    set_field(id,Math.round10(this.binlowerquartile(),precision));
}

Data.prototype.binupperquartile = function() {
    if (this.stats.binupperquartile) {
	return this.stats.binupperquartile;
    }
    this.stats.binupperquartile = this.entile(3,4);
    return this.stats.binupperquartile;
}

Data.prototype.write_binupperquartile = function(id) {
    set_field(id,Math.round10(this.binupperquartile(),precision));
}

Data.prototype.binmedian = function() {
    if (this.stats.binmedian) {
	return this.stats.binmedian;
    }
    this.stats.binmedian = this.entile(1,2);
    return this.stats.binmedian;
}

Data.prototype.write_binmedian = function(id) {
    set_field(id,Math.round10(this.binmedian(),precision));
}

Data.prototype.bininterquartilerange = function() {
    return this.binupperquartile() - this.binlowerquartile();
}

Data.prototype.write_bininterquartilerange = function(id) {
    set_field(id,Math.round10(this.bininterquartilerange(),precision));
}

Data.prototype.mode = function() {
    if (this.stats.mode) {
	return this.stats.mode;
    }
    var i = -1;
    var n = 0;
    for (var j=0; j < this.bins.length; j++) {
	if (this.bins[j] > n) {
	    i = j;
	    n = this.bins[j];
	}
    }
    this.stats.mode = i;
    return this.stats.mode;
}

Data.prototype.write_mode = function(id) {
    str = (this.mode() * this.width + this.offset) + ' \u2014 ' + ((this.mode() + 1) * this.width + this.offset);
    set_field(id,str);
}

Data.prototype.draw_histogram = function(ctx,pos) {
    var hbin = 10/Math.ceil(Math.max.apply(null,this.bins)/10);
    this.scale = Math.min(scale,ctx.canvas.width/((this.bins.length+1)*this.width + this.offset));
    var tm;
    clear(ctx);
    ctx.save();
    ctx.translate(0,ctx.canvas.height);
    ctx.translate(10,-20);
    ctx.translate(-this.offset*this.scale,0);
    this.drawAxes(ctx,true);
    ctx.strokeStyle = "black";
    for (var i=0; i<this.bins.length;i++) {
	ctx.fillStyle = 'gray';
	ctx.fillRect((i*this.width+this.offset)*this.scale,0,this.width*this.scale,-this.bins[i]*hbin);
	if (this.bins[i] != 0) {
	    tm = ctx.measureText(this.bins[i]);
	    ctx.fillStyle = 'black';
	    ctx.fillText(this.bins[i],(this.width*(i+.5)+this.offset)*this.scale-tm.width/2,-10);
	}
    }
    ctx.fillStyle = 'blue';
    this.data.forEach(
	function(x) {
	    mark(ctx,x*this.scale,-60);
	}
    );
    ctx.fillStyle = 'red';
    for (var i=0; i<this.bins.length; i++) {
	for (var j=0; j<this.bins[i]; j++) {
	    mark(ctx,(this.width*i+this.offset)*this.scale + (j+.5)*this.scale*this.width/this.bins[i],-70);
	}
    }
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(pos*this.scale,0);

    ctx.lineTo(pos*this.scale,-100);
    ctx.stroke();
    ctx.restore();
}

Data.prototype.draw_boxplot = function(ctx) {
    clear(ctx);
    ctx.save()
    ctx.translate(0,ctx.canvas.height);
    ctx.translate(10,-20);
    ctx.translate(-this.offset*this.scale,0);
    this.drawAxes(ctx);
    var md = this.median();
    var lq = this.lowerquartile();
    var uq = this.upperquartile();
    var iq = uq - lq;
    ctx.fillStyle = 'gray';
    ctx.fillRect(lq*this.scale,-10,iq*this.scale,-40);
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.moveTo(md*this.scale,-10);
    ctx.lineTo(md*this.scale,-50);
    ctx.stroke();
    var lf = md - 1.5*iq;
    var uf = md + 1.5*iq;
    var lw = md;
    var uw = md;
    this.data.forEach(function(x) {
	if (x > lf)
	    lw = Math.min(lw,x);
	if (x < uf)
	    uw = Math.max(uw,x);
    });
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(lq*this.scale,-30);
    ctx.lineTo(lw*this.scale,-30);
    ctx.moveTo(lw*this.scale,-50);
    ctx.lineTo(lw*this.scale,-10);
    ctx.moveTo(uq*this.scale,-30);
    ctx.lineTo(uw*this.scale,-30);
    ctx.moveTo(uw*this.scale,-50);
    ctx.lineTo(uw*this.scale,-10);
    ctx.stroke();
    this.data.forEach(function(x) {
	ctx.fillStyle = 'blue';
	mark(ctx,x*this.scale,-60);
	ctx.fillStyle = 'black';
	if ((x < lw) || (x > uw))
	    mark(ctx,x*this.scale,-30);
    });
    ctx.restore();
}

function mark(c,x,y) {
    c.beginPath();
    c.arc(x,y,values.radius,0,360);
    c.fill();
}

Data.prototype.drawAxes = function(c,uo) {
    var height,o
    if (uo) {
	o = this.offset;
    } else {
	o = 0;
    }
    height = c.canvas.height;
    c.beginPath();
    c.moveTo(0,10);
    c.lineTo(0,-height + 10);
    c.stroke();
    c.beginPath();
    c.moveTo(-10+this.offset*this.scale,0);
    c.lineTo((this.bins.length*this.width + this.offset)*this.scale + 10,0);
    c.stroke();
    c.beginPath();
    var tm;
    c.fillStyle = 'black';
    for (var i=0; i<=this.bins.length;i++) {
	c.moveTo((i*this.width+o)*this.scale,0);
	c.lineTo((i*this.width+o)*this.scale,5);
	tm = c.measureText(i*this.width+o);
	c.fillText(i*this.width+o,(this.width*i+o)*this.scale-tm.width/2,14);
    }
    c.stroke();
}

function clear(c) {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, c.canvas.width, c.canvas.height);
    c.restore();
}

var compareNumbers = function(a,b) {
    return a - b;
}


var set_field = function(id,s) {
    document.querySelector('#' + id).innerHTML = s;
}

var makeGauss = function() {
    var g;

    return function (m,s) {
	if (g != null) {
	    var gg = g;
	    g = null;
	    return s*gg+m;
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
	g = y;
	return s*x+m;
    }
}

var uniform =  function(m,s) {
    return (2 * Math.random() - 1)*s*Math.sqrt(3) + m;
}

var exponential = function(m,s) {
    return -Math.log(1 - Math.random())*m;
}

distributions = [
    makeGauss(),
    exponential,
    uniform,
];

data_types = [
    function(x) {return x;},
    function(x) {return Math.round(x);}
];
