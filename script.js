var canvas;
var ctx;
var form;
var num;
var values = new Object();
var data = [];
var scale = 10;
var border;
var width;
var height;
var fwidth;
var fheight;
var bwidth = 10;
var bheight = 10;
var gwidth;
var gheight;
var txtWidth;
var bins;
var hbin;
var nbins;
var pos = 50;
var below;
var mouseClicked;
var distributions = [];

function init() {
    canvas = document.querySelector("#canvas");
    canvas.addEventListener("mousedown",doMouseDown,false);
    canvas.addEventListener("mouseup",doMouseUp,false);
    canvas.addEventListener("mouseout",doMouseOut,false);
    canvas.addEventListener("mousemove",doMouseMove,false);
    ctx = canvas.getContext("2d");
    
    form = document.querySelector("#values");
    var elts = form.elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text")
    	    element.onkeypress = checkReturn;
	if (element.type === "select-one")
    	    element.onchange = getValues;
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

distributions = [
    makeGauss(),
    uniform
];


function getValues () {
    var elts = form.elements;
    for (var i=0, element; element = elts[i++];) {
	if (element.type === "text") 
	    values[element.name] = parseInt(element.value,10);
	if (element.type === 'select-one')
	    distribution = distributions[element.options.selectedIndex];
    }
    data = [];
    bins = [];
    below = 0;
    abelow = 0;
    nbins = Math.ceil(100/values.classw);
    var x;
    for (var i=0;i<values.number;i++) {
	x = distribution(values.mean,values.stddev);
	data.push(x);
	bins[Math.floor(x/values.classw)] = (bins[Math.floor(x/values.classw)] || 0) + 1;
	if (x < pos)
	    below++;
    }
    for (var i=0;i<Math.max(bins.length,nbins);i++) {
	bins[i] = bins[i] || 0;
    }
    x = Math.floor(pos/values.classw);
    for (var i=0;i<x;i++) {
	abelow += bins[i];
    }
    hbin = 10/Math.ceil(Math.max.apply(null,bins)/10);
    document.querySelector('#below').innerHTML = below;
    document.querySelector('#abelow').innerHTML = abelow;
    document.querySelector('#mark').innerHTML = Math.floor(pos);
    var datatxt = data.map(function(v) {return Math.floor(v*10+.5)/10}).join([separator = ', ']);
    document.querySelector('#data').innerHTML = datatxt;
    var tbl = document.querySelector("#freq");
    var tblbdy = document.createElement('tbody');
    var nrow,ncell,ntxt;
    for (var i=0;i<nbins;i++) {
	nrow = tblbdy.insertRow(i);
	ncell = nrow.insertCell(0);
	ntxt = document.createTextNode((i * values.classw));
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(1);
	ntxt = document.createTextNode(' - ' + (i+1) * values.classw);
	ncell.appendChild(ntxt);
	ncell = nrow.insertCell(2);
	ntxt = document.createTextNode(bins[i]);
	ncell.appendChild(ntxt);
    }
    tbl.replaceChild(tblbdy,document.querySelector('#freqrows'));
    tblbdy.id = 'freqrows';
    draw();
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function recalc(e) {
    var coords = getRelativeCoords(e);
    pos = (coords.x - border)/scale;
    below=0;
    abelow = 0;
    for (var i=0;i<data.length;i++) {
	if (data[i] < pos)
	    below++;
    }
    var x = Math.floor(pos/values.classw);
    for (var i=0;i<x;i++) {
	abelow += bins[i];
    }
    abelow += bins[x]*(pos - values.classw*x)/values.classw;
    document.querySelector('#below').innerHTML = below;
    document.querySelector('#abelow').innerHTML = Math.floor(abelow + .5);
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
    clear();
    ctx.save();
    ctx.translate(0,canvas.height);
    ctx.translate(10,-20);
    drawAxes();
    ctx.strokeStyle = "black";
    for (var i=0; i<nbins;i++) {
	ctx.fillStyle = 'gray';
	ctx.fillRect(i*values.classw*scale,0,values.classw*scale,-bins[i]*hbin);
	if (bins[i] != 0) {
	    tm = ctx.measureText(bins[i]);
	    ctx.fillStyle = 'black';
	    ctx.fillText(bins[i],values.classw*(i+.5)*scale-tm.width/2,-10);
	}
    }
    ctx.fillStyle = 'black';
    for (var i=0; i<values.number; i++) {
	mark(data[i]*scale,-60);
    }
    ctx.fillStyle = 'red';
    for (var i=0; i<bins.length; i++) {
	for (var j=0; j<bins[i]; j++) {
	    mark(values.classw*i*scale + (j+.5)*scale*values.classw/bins[i],-70);
	}
    }
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(pos*scale,0);

    ctx.lineTo(pos*scale,-100);
    ctx.stroke();
    ctx.restore();
}

var xsize=5;

function mark(x,y) {
    ctx.beginPath();
    ctx.arc(x,y,2,0,360);
    ctx.fill();
    /*
    ctx.beginPath();
    ctx.moveTo(x-xsize,y-xsize);
    ctx.lineTo(x+xsize,y+xsize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x+xsize,y-xsize);
    ctx.lineTo(x-xsize,y+xsize);
    ctx.stroke();
    */
}

function drawAxes() {
    ctx.beginPath();
    ctx.moveTo(0,10);
    ctx.lineTo(0,-height + 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10,0);
    ctx.lineTo(width - 10,0);
    ctx.stroke();
    ctx.beginPath();
    var tm;
    for (var i=0;i<11;i++) {
	ctx.moveTo(10*i*scale,0);
	ctx.lineTo(10*i*scale,5);
	tm = ctx.measureText(i*10);
	ctx.fillText(i*10,10*i*scale-tm.width/2,14);
    }
    ctx.stroke();
}

function setSize() {
    border = 20;
    fheight=Math.min(window.innerHeight - form.offsetHeight,100+2*border+bheight);
    fwidth=window.innerWidth;
    canvas.height=fheight;
    canvas.width=fwidth;
    width = fwidth - 2*border;
    height = fheight - 2*border;
    gwidth = width - bwidth;
    gheight = height - bheight;
    scale = gwidth/100;
}

function clear() {
    
    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
}

function checkReturn(e) {
    if(e && e.keyCode == 13)
    {
	getValues();
    }
}
