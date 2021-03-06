var Data;

var distributions = [];
var quantiles = [];
var data_types = [];
var precision = -1;

Data = function(s) {
    this.data = [];
    this.gdata = [];
    this.sdata = [];
    this.active = true;
    this.suffix = s;
}

Data.prototype.generate = function(m,s,n,d,t,q) {
    this.gdata = [];
    var dist;
    if (q) {
	dist = function (x) {
	    return data_types[t](quantiles[d](x,m,s));
	};
    } else {
	dist = function (x) {
	    return data_types[t](distributions[d](Math.random(),m,s));
	};
    }
    for (var i=0;i<n;i++) {
	this.gdata.push(dist((i+.5)/n));
    }
}

Data.prototype.add_data = function(d) {
    this.data = this.gdata.concat(d);
}

Data.prototype.set_data = function(d) {
    this.gdata = d;
}

Data.prototype.initialise = function() {
    this.sdata = this.data.slice(0);
    this.sdata.sort(compareNumbers);
    this.stats = [];
}

Data.prototype.has_data = function() {
    if (this.data && this.data.length > 0) {
	return true;
    } else {
	return false;
    }
}

Data.prototype.set_field = function(id,s,b) {
    var i = '#' + id;
    if (!b) {
	i += '_' + this.suffix;
    }
    var elt = document.querySelector(i);
    if (elt) {
	elt.innerHTML = s;
    } else {
	console.log('Trying to write to non-existant element with id ' + i);
    }
}

Data.prototype.enable = function(b) {
    this.active = b;
}

Data.prototype.correlate = function(d,r) {
    var r = r || 0;
    r = Math.max(Math.min(r,1),-1);
    var s = Math.sqrt(1 - r*r);
    var data = [];
    for (var i=0; i< this.gdata.length; i++) {
	data.push(s * this.gdata[i] + r * d.gdata[i]);
    }
    this.gdata = data;
}

Data.prototype.set_table = function(b) {
    var bins = [];
    var i = 0;
    var j = 0;
    var n = 0;
    var l = b.length;
    var t = 0;
    while (i < b.length && j < this.sdata.length) {
	if (this.sdata[j] < b[i].upper) {
	    n++;
	    j++;
	} else {
	    if (n != 0) {
		l = Math.min(l,i);
		t = Math.max(t,i);
	    }
	    bins[i] = n;
	    i++;
	    n=0;
	}
    }
    if (n != 0) {
	l = Math.min(l,i);
	t = Math.max(t,i);
    }
    bins[i] = n;
    this.bins = bins;
    this.first = l;
    this.last = t;
}

Data.prototype.write = function(id) {
    if (!this.active) return;
    var datatxt = this.data.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    this.set_field(id,datatxt);
}

Data.prototype.write_sorted = function(id) {
    if (!this.active) return;
    var datatxt = this.sdata.map(function(v) {return Math.round10(v,-1)}).join([separator = ', ']);
    this.set_field(id,datatxt);
}

Data.prototype.write_pairs = function(id,d) {
    if (!this.active) return;
    if (!d.active) return;
    var td = this.data.map(function(v) {return Math.round10(v,-1)});
    var od = d.data.map(function(v) {return Math.round10(v,-1)});
    var datatxt = [];
    for (var i = 0; i < Math.min(td.length,od.length); i++) {
	datatxt.push("(" + td[i] + "," + od[i] + ")");
    }
    this.set_field(id,datatxt.join([separator = ', ']),true);
}

/*
Data.prototype.write_table = function(id) {
    if (!this.active) return;
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
    console.log(this.bins.length,bbin,tbin);
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
*/

Data.prototype.table_row = function(i) {
    if (i >= this.first && i <= this.last) {
	return this.bins[i];
    } else {
	return '0';
    }
}

/*
Data.prototype.write_stem = function(id) {
    if (!this.active) return;
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
*/

Data.prototype.prepare_stem = function(r) {
    var sdata = this.sdata.map(function(v) {return Math.floor(v + .5)});
    var i = 0;
    var st = Math.floor(sdata[0]/10);
    var self = this;
    return {start: st,leaves: function(s) {
	if (i >= sdata.length || !self.active) {
	    return false;
	}
	var leaf = [];
	while (i < sdata.length && Math.floor(sdata[i]/10) == s) {
	    leaf.push(sdata[i] - s*10);
	    i++;
	}
	if (r)
	    leaf.reverse();
	return leaf.join([separator = ' ']);
    }
	   };
	    
}

Data.prototype.write_below = function(id,p) {
    if (!this.active) return;
    var n = 0;
    this.data.forEach( function(x) {
	if (x < p) {
	    n++;
	}
    });
    this.set_field(id,n);
}

Data.prototype.write_abelow = function(id,p,b) {
    if (!this.active) return;
    var n = 0;
    var abelow; 
    if (p < b[0].lower) {
	abelow = 0;
    } else if (p > b[b.length-1].upper) {
	abelow = this.data.length;
    } else {
	var x = 0;
	var m = 0;
	for (var i=0; i < b.length; i++) {
	    if (p >= b[i].upper) {
		m += this.bins[i];
	    } else if (p >= b[i].lower && p < b[i].upper) {
		x = i;
		break;
	    }
	}

	abelow = m + (p - b[x].lower)/(b[x].upper - b[x].lower) * this.bins[x];
    }
    this.set_field(id,Math.round10(abelow,-1));
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

Data.prototype.write_size = function(id) {
    if (!this.active) return;
    this.set_field(id,this.data.length);
}
    
Data.prototype.write_mean = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.mean(),precision));
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

Data.prototype.sample_variance = function() {
    if (this.stats.sample_variance) {
	return this.stats.sample_variance;
    }
    var s = this.variance();
    s *= this.data.length/(this.data.length-1);
    this.stats.sample_variance = s;
    return this.stats.sample_variance;
}

Data.prototype.write_variance = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.variance(),precision));
}

Data.prototype.stddev = function() {
    if (this.stats.stddev) {
	return this.stats.stddev;
    }
    var v = this.variance();
    this.stats.stddev = Math.sqrt(v);
    return this.stats.stddev;
}

Data.prototype.sample_stddev = function() {
    if (this.stats.sample_stddev) {
	return this.stats.sample_stddev;
    }
    var v = this.sample_variance();
    this.stats.sample_stddev = Math.sqrt(v);
    return this.stats.sample_stddev;
}

Data.prototype.write_stddev = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.stddev(),precision));
}

Data.prototype.Sxx = function() {
    if (this.stats.Sxx) {
	return this.stats.Sxx;
    }
    var s = 0;
    var m = this.mean();
    this.data.forEach(function(x) {s += (x - m)*(x - m)});
    this.stats.Sxx = s;
    return this.stats.Sxx;
}

Data.prototype.write_Sxx = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.Sxx(),precision),true);
}

Data.prototype.Sxy = function(d) {
    if (this.stats.Sxy && d.stats.Sxy) {
	return this.stats.Sxy;
    }
    var s = 0;
    var m = this.mean();
    var md = d.mean();
    var n = this.data.length;
    for (var i=0; i < n; i++) {
	s += (this.data[i] - m) * (d.data[i] - md);
    }
    this.stats.Sxy = s;
    d.stats.Sxy = s;
    return this.stats.Sxy;
}

Data.prototype.write_Sxy = function(id,d) {
    if (!this.active) return;
    if (!d.active) return;
    this.set_field(id,Math.round10(this.Sxy(d),precision),true);
}

Data.prototype.pmcc = function(d) {
    if (this.stats.pmcc && d.stats.pmcc) {
	return this.stats.pmcc;
    }
    this.stats.pmcc = this.Sxy(d)/Math.sqrt(this.Sxx() * d.Sxx());
    d.stats.pmcc = this.stats.pmcc;
    return this.stats.pmcc;
}

Data.prototype.write_pmcc = function(id,d) {
    if (!this.active) return;
    if (!d.active) return;
    this.set_field(id,Math.round10(this.pmcc(d),precision),true);
    
}

Data.prototype.regression_gradient = function(d) {
    if (!this.active) return;
    if (!d.active) return;
    var sxy = this.Sxy(d);
    var sxx = this.Sxx();
    this.stats.gradient = sxy/sxx;
    return this.stats.gradient;
}

Data.prototype.regression_yintercept = function(d) {
    if (!this.active) return;
    if (!d.active) return;
    var g = this.regression_gradient(d);
    var xm = this.mean();
    var ym = d.mean();
    this.stats.yintercept = ym - g*xm;
    return this.stats.yintercept;
}

Data.prototype.write_regression = function(gid,yid,eid,d) {
    if (!this.active) return;
    if (!d.active) return;
    var b = this.regression_gradient(d);
    var a = this.regression_yintercept(d);
    this.write_linearguess(gid,yid,eid,b,a,d);
}

Data.prototype.write_linearguess = function(gid,yid,eid,b,a,d) {
    if (!this.active) return;
    if (!d.active) return;
    this.set_field(gid,Math.round10(b,precision),true);
    this.set_field(yid,Math.round10(a,precision),true);
    var e = 0;
    for (var i = 0; i < this.data.length; i++) {
	e += (d.data[i] - this.data[i] * b - a)**2;
    }
    this.set_field(eid,Math.round10(e,precision),true);
}

Data.prototype.ntile = function(k,n) {
    if (this.sdata.length%n == 0) {
	return (this.sdata[k*this.sdata.length/n - 1] + this.sdata[k*this.sdata.length/n])/2;
    } else {
	return this.sdata[Math.floor(k*this.sdata.length/n)];
    }
}

Data.prototype.write_ntile = function(id,k,n) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.ntile(k,n),precision));
}


Data.prototype.median = function(id) {
    if (this.stats.median) {
	return this.stats.median;
    }
    this.stats.median = this.ntile(1,2);
    return this.stats.median;
}

Data.prototype.write_median = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.median(),precision));
}

Data.prototype.lowerquartile = function() {
    if (this.stats.lowerquartile) {
	return this.stats.lowerquartile;
    }
    this.stats.lowerquartile = this.ntile(1,4);
    return this.stats.lowerquartile;
}

Data.prototype.write_lowerquartile = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.lowerquartile(),precision));
}

Data.prototype.upperquartile = function() {
    if (this.stats.upperquartile) {
	return this.stats.upperquartile;
    }
    this.stats.upperquartile = this.ntile(3,4);
    return this.stats.upperquartile;
}

Data.prototype.write_upperquartile = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.upperquartile(),precision));
}

Data.prototype.interquartilerange = function() {
    return this.upperquartile() - this.lowerquartile();
}

Data.prototype.write_interquartilerange = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.interquartilerange(),precision));
}

Data.prototype.write_skewmedian = function(id) {
    if (!this.active) return;
    var m = this.mean();
    var md = this.median();
    var s = this.stddev();
    this.set_field(id,Math.round10(3*(m - md)/s,precision));
}

Data.prototype.write_skewmode = function(id) {
    if (!this.active) return;
    var m = this.mean();
    var md = this.mode();
    var s = this.stddev();
    this.set_field(id,Math.round10((m - md)/s,precision));
}

Data.prototype.write_skewquartile = function(id) {
    if (!this.active) return;
    var qa = this.ntile(1,4);
    var md = this.ntile(2,4);
    var qb = this.ntile(3,4);
    this.set_field(id,Math.round10((qb - 2*md + qa)/(qb - qa),precision));
}

Data.prototype.entile = function(k,n,b) {
    var l = k/n*this.data.length;
    var x = this.bins.length-1;
    var m = 0;
    for (var i=0; i< this.bins.length; i++) {
	if (this.bins[i] < l) {
	    l -= this.bins[i];
	} else {
	    x = i;
	    break;
	}
    }
    return b[x].lower + l/this.bins[x]*(b[x].upper - b[x].lower);
}

Data.prototype.write_entile = function(id,k,n,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.entile(k,n,b),precision));
}

Data.prototype.binlowerquartile = function(b) {
    if (this.stats.binlowerquartile) {
	return this.stats.binlowerquartile;
    }
    this.stats.binlowerquartile = this.entile(1,4,b);
    return this.stats.binlowerquartile;
}

Data.prototype.write_binlowerquartile = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binlowerquartile(b),precision));
}

Data.prototype.binupperquartile = function(b) {
    if (this.stats.binupperquartile) {
	return this.stats.binupperquartile;
    }
    this.stats.binupperquartile = this.entile(3,4,b);
    return this.stats.binupperquartile;
}

Data.prototype.write_binupperquartile = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binupperquartile(b),precision));
}

Data.prototype.binmean = function(b) {
    if (this.stats.binmean) {
	return this.stats.binmean;
    }
    var s = 0;
    var i = 0;
    var j = 0;
    while (b[i] && this.sdata[j]) {
	if (this.sdata[j] < b[i].upper) {
	    s += (b[i].lower + b[i].upper)/2;
	    j++;
	} else {
	    i++;
	}
    }
    this.stats.binmean = s/this.data.length;
    return this.stats.binmean;
}

Data.prototype.write_binmean = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binmean(b),precision));
}

Data.prototype.binvariance = function(b) {
    if (this.stats.binvariance) {
	return this.stats.binvariance;
    }
    var m = this.binmean();
    var s = 0;
    var i = 0;
    var j = 0;
    while (b[i] && this.sdata[j]) {
	if (this.sdata[j] < b[i].upper) {
	    s += Math.pow((b[i].lower + b[i].upper)/2,2);
	    j++;
	} else {
	    i++;
	}
    }
    this.stats.binvariance = s/this.data.length - m*m;
    return this.stats.binvariance;
}

Data.prototype.write_binvariance = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binvariance(b),precision));
}

Data.prototype.binstddev = function(b) {
    if (this.stats.binstddev) {
	return this.stats.binstddev;
    }
    var v = this.binvariance(b);
    this.stats.binstddev = Math.sqrt(v);
    return this.stats.binstddev;
}

Data.prototype.write_binstddev = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binstddev(b),precision));
}

Data.prototype.binmedian = function(b) {
    if (this.stats.binmedian) {
	return this.stats.binmedian;
    }
    this.stats.binmedian = this.entile(1,2,b);
    return this.stats.binmedian;
}

Data.prototype.write_binmedian = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.binmedian(b),precision));
}

Data.prototype.bininterquartilerange = function(b) {
    return this.binupperquartile(b) - this.binlowerquartile(b);
}

Data.prototype.write_bininterquartilerange = function(id,b) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.bininterquartilerange(b),precision));
}

Data.prototype.modal = function() {
    if (this.stats.modal) {
	return this.stats.modal;
    }
    var i = -1;
    var n = 0;
    for (var j=0; j < this.bins.length; j++) {
	if (this.bins[j] > n) {
	    i = j;
	    n = this.bins[j];
	}
    }
    this.stats.modal = i;
    return this.stats.modal;
}

Data.prototype.write_modal = function(id,b) {
    if (!this.active) return;
    var i = this.modal();
    str = b[i].labelpre + b[i].labelpost;
    this.set_field(id,str);
}

Data.prototype.mode = function () {
    if (this.stats.mode) {
	return this.stats.mode;
    }
    var n = 0;
    var m = 0;
    var md = 0;
    var p = this.sdata[0];
    this.sdata.forEach( function(x) {
	if (x == p) {
	    n++;
	} else {
	    if (n > m) {
		m = n;
		md = p;
	    }
	    n = 0;
	}
	p = x;
    });
    if (n > m) {
	md = p;
    }
    this.stats.mode = md;
    return this.stats.mode;
}

Data.prototype.write_mode = function(id) {
    if (!this.active) return;
    this.set_field(id,this.mode());
}

Data.prototype.lilliefors = function() {
    if (this.stats.lilliefors)
	return this.stats.lilliefors;
    var m = this.mean();
    var s = this.sample_stddev();
    var n = this.data.length;
    var pd, d;
    pd = 0;
    d = 0;
    s *= Math.sqrt(2);
    for (var i = 0; i < n; i++) {
	d = Math.max(d, Math.abs( (i+1)/(n+1) - pd ));
	pd = (1 + erf((this.sdata[i] - m)/s))/2;
	d = Math.max(d, Math.abs( (i+1)/(n+1) - pd ));
    }
    var b2 = 0.08861783849346;
    var b1 = 1.30748185078790;
    var b0 = 0.37872256037043;
    var A = ( - (b1 + n) + Math.sqrt( Math.pow(b1 + n,2) - 4 * b2 * ( b0 - Math.pow(d,-2) ) ) )/( 2*b2 );
    var p = -.37782822932809
	+ 1.67819837908004 * A
	- 3.02959249450445 * Math.pow(A,2)
	+ 2.80015798142101 * Math.pow(A,3)
	- 1.39874347510845 * Math.pow(A,4)
	+ 0.40466213484419 * Math.pow(A,5)
	- 0.06353440854207 * Math.pow(A,6)
	+ 0.00287462087623 * Math.pow(A,7)
	+ 0.00069650013110 * Math.pow(A,8)
	- 0.00011872227037 * Math.pow(A,9)
	+ 0.00000575586834 * Math.pow(A,10);
    this.stats.lilliefors = d;
    return this.stats.lilliefors;
}

Data.prototype.write_lilliefors = function(id) {
    if (!this.active) return;
    this.set_field(id,Math.round10(this.lilliefors(),-3));
}


Data.prototype.draw_histogram = function(ctx,pos,scale,hbin,bins) {
    if (!this.active) return;
    var tm;
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    for (var i=0; i<this.bins.length;i++) {
	ctx.fillStyle = 'gray';
	ctx.fillRect(bins[i].lower*scale,0,(bins[i].upper-bins[i].lower)*scale,-this.bins[i]*hbin/(bins[i].upper-bins[i].lower));
	ctx.strokeRect(bins[i].lower*scale,0,(bins[i].upper-bins[i].lower)*scale,-this.bins[i]*hbin/(bins[i].upper-bins[i].lower));
	if (this.bins[i] != 0) {
	    tm = ctx.measureText(this.bins[i]);
	    ctx.fillStyle = 'black';
	    ctx.fillText(this.bins[i],(bins[i].lower+bins[i].upper)/2*scale-tm.width/2,-10);
	}
    }
    ctx.fillStyle = 'blue';
    this.data.forEach(
	function(x) {
	    mark(ctx,x*scale,-60);
	}
    );
    ctx.fillStyle = 'red';
    for (var i=0; i<this.bins.length; i++) {
	for (var j=0; j<this.bins[i]; j++) {
	    mark(ctx,(this.width*i+this.offset)*scale + (j+.5)*scale*this.width/this.bins[i],-70);
	}
    }
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(pos*scale,0);

    ctx.lineTo(pos*scale,-100);
    ctx.stroke();
    ctx.restore();
}

Data.prototype.draw_boxplot = function(ctx,s) {
    if (!this.active) return;
/*    clear(ctx);
    ctx.translate(0,ctx.canvas.height);
    ctx.translate(10,-20);
    ctx.translate(-this.offset*scale,0);
    this.drawAxes(ctx);
*/
    ctx.save()
    var md = this.median();
    var lq = this.lowerquartile();
    var uq = this.upperquartile();
    var iq = uq - lq;
    ctx.fillStyle = 'gray';
    ctx.fillRect(lq*s,-10,iq*s,-40);
    ctx.beginPath();
    ctx.strokeStyle = 'red';
    ctx.moveTo(md*s,-10);
    ctx.lineTo(md*s,-50);
    ctx.stroke();
    var lf = lq - 1.5*iq;
    var uf = uq + 1.5*iq;
    var lw = lq;
    var uw = uq;
    this.data.forEach(function(x) {
	if (x > lf)
	    lw = Math.min(lw,x);
	if (x < uf)
	    uw = Math.max(uw,x);
    });
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(lq*s,-30);
    ctx.lineTo(lw*s,-30);
    ctx.moveTo(lw*s,-50);
    ctx.lineTo(lw*s,-10);
    ctx.moveTo(uq*s,-30);
    ctx.lineTo(uw*s,-30);
    ctx.moveTo(uw*s,-50);
    ctx.lineTo(uw*s,-10);
    ctx.stroke();
    this.data.forEach(function(x) {
	ctx.fillStyle = 'blue';
	mark(ctx,x*s,-60);
	ctx.fillStyle = 'black';
	if ((x < lw) || (x > uw))
	    mark(ctx,x*s,-30);
    });
    ctx.restore();
}

function mark(c,x,y) {
    c.beginPath();
    c.arc(x,y,2,0,360);
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
    c.moveTo(-10+this.offset*scale,0);
    c.lineTo((this.bins.length*this.width + this.offset)*scale + 10,0);
    c.stroke();
    c.beginPath();
    var tm;
    c.fillStyle = 'black';
    for (var i=0; i<=this.bins.length;i++) {
	c.moveTo((i*this.width+o)*scale,0);
	c.lineTo((i*this.width+o)*scale,5);
	tm = c.measureText(i*this.width+o);
	c.fillText(i*this.width+o,(this.width*i+o)*scale-tm.width/2,14);
    }
    c.stroke();
}

var compareNumbers = function(a,b) {
    return a - b;
}



var makeGauss = function() {
    var g;

    /*
      Implementation means that we can guarentee that xx is U(0,1)
     */
    return function (xx,m,s) {
	if (g != null) {
	    var gg = g;
	    g = null;
	    return s*gg+m;
	}
	var u = 1;
	var v = 1;
	while (u*u + v*v > 1) {
	    u = 2 * xx - 1;
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

var gaussian = makeGauss();

var uniform =  function(x,m,s) {
    return (2 * x - 1)*s*Math.sqrt(3) + m;
}

var exponential = function(x,m,s) {
    return -Math.log(1 - x)*s + m - s;
}

var lognormal = function(x,m,s) {
    var ms = m*m;
    var v = s*s;
    var mu = Math.log(ms/Math.sqrt(v + ms));
    var sigma = Math.sqrt(Math.log(1 + v/ms));
    return Math.exp(gaussian(x,mu,sigma));
}

/*
  if x == 0, return 0
  if x != 0, work in log space
  
  nk is log( nCk ) so updates via
  nCk = nC(k-1) * (n-k+1)/k
  nk += log(n-k+1) - log(k)
  starts with nk = 0
  
  np is log(p^k q^(n-k))
  p^k q^(n-k) = p^(k-1) q^(n-k+1) * p/q
  np += log(p) - log(q)
  starts with np = n log(p)
*/
var binomial = function(x,n,p) {
    var q,k,nk,np;
    if (x == 0)
	return 0;
    if (p <= 0)
	return 0;
    if (p >= 1)
	return n;
    
    q = Math.log(1 - p);
    p = Math.log(p);
    k = 0;
    nk = 0;
    np = n * q;
    x -= Math.exp(np);
    
    while (x > 0 && k < n) {
	k++;
	nk += Math.log(n - k + 1) - Math.log(k); // log nCk
	np += p - q; // log p^k q^(n-k)
	x -= Math.exp(nk + np);
    }
    return k;
   
}

var binomial_test = function(n,p) {
    var pr = [];
    for (var k = 0; k <= n; k++) {
	pr.push(binomial(k/n,n,p));
    }
    return pr;
}

// console.log(binomial_test(12,.1));

/*
  x ~ U(0,1)
  if x == 0, return 0
  if x != 0, work in log space
  
  nk is log( e^(-l) l^k/k! ) so updates via
  nk += log(l) - log(k)
  starts with nk = -l
  
*/
var poisson = function(x,l,s) {
    // lambda = l
    var k,nk;
    if (x == 0)
	return 0;
    if (l <= 0)
	return 0;
    nk = -l;
    l = Math.log(l);
    k = 0;
    x -= Math.exp(nk);
    
    while (x > 0) {
	k++;
	nk += l - Math.log(k);
	x -= Math.exp(nk);
    }
    return k;
}

var poisson_test = function(l) {
    var pr = [];
    for (var i = 0; i < 20; i++) {
	pr.push(poisson(i/20,l));
    }
    return pr;
}

// console.log(poisson_test(5,0));

var uniformd = function(x,m,s) {
    // 1 to m inclusive, ignore s
    return Math.floor(m * x) + 1;
}

function erf(x) {
    var t = 1/(1 + .5*Math.abs(x));
    var p = -x * x
	- 1.26551223
	+ t * ( 1.00002368
		+ t * ( 0.37409196
			+ t * ( 0.09678418
				+ t * ( -0.18628806
					+ t * ( 0.27886807
						+ t * (- 1.13520398
						       + t * ( 1.48851587
							       + t * (- 0.82215223
								      + t * 0.17087277
								     ))))))))
    ;
    var tau = t * Math.exp(p);
    if (x >= 0)
	return 1 - tau;
    return tau - 1;
}

function erfinv(x) {
    var a = -16;
    var b = 16;
    var m,p;
    for (var i = 0; i < 25; i++) {
	m = (a + b)/2;
	p = erf(m);
	if (p == x)
	    return m;
	if (p < x) {
	    a = m;
	} else {
	    b = m;
	}
    }
    return m;
}

function normalsQ(q) {
    return Math.sqrt(2) * erfinv(2 * q - 1);
}

function normalQ(q,m,s) {
    return normalsQ(q) * s + m;
}

function lognormalQ(q,m,s) {
    var ms = m*m;
    var v = s*s;
    var mu = Math.log(ms/Math.sqrt(v + ms));
    var sigma = Math.sqrt(Math.log(1 + v/ms));
    return Math.exp(normalQ(q,mu,sigma));
}

distributions = [
    gaussian,
    exponential,
    uniform,
    lognormal,
    binomial,
    poisson,
    uniformd
];

quantiles = [
    normalQ,
    exponential,
    uniform,
    lognormalQ,
    binomial,
    poisson,
    uniformd
];

data_types = [
    function(x) {return x;},
    function(x) {return Math.round(x);},
    function(x) {return Math.round(x);},
];
