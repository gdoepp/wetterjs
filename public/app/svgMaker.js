'use strict';
angular.module('wetterDB')
 .factory('svgMakerFactory', svgMakerFactory);


function smooth(data, n) {
	
	var arr0 = data.slice(-n,0).concat(data.slice(0,n+1));
	
	func = function(curr, i, arr) {
	   var val = (this.reduce(function(total,x) {return total+x;})+arr[i])/(2*n+2);
	   this.shift();
	   this.push(arr[(i+n+1)%arr.length]);
	   return val;
	}	
	return data.map(func, arr0);
}

function makeRange(dims, data, values, typ) {
	
	var center = 0;
	
	if (dims.mny === undefined) { dims.mny = 9999; center = 1; }
	if (dims.mxy === undefined) { dims.mxy = -9999; }
	
	for (var k=0; k<data.length; k++) {
		
		var tv = data[k];
		
		for (var v in values) {
			if (tv[values[v]]) {
				dims.mny = Math.min(dims.mny, tv[values[v]]);
				dims.mxy = Math.max(dims.mxy, tv[values[v]]);
			}
		}
	}
	
	if (dims.mxy-dims.mny < 3) {
		if (center) {
			dims.mxy = dims.mxy+1;
			dims.mny = dims.mny-1;
		} else {
			dims.mxy = dims.mxy+1;
		}
	}
	
	dims.dmy = dims.height * 0.99 / (dims.mxy - dims.mny);
	dims.dx = (dims.width * 0.99 - 1.5*dims.x1) / (typ.indexn-typ.index0);

}

function makeCurves(obj, data, dims, typ, values) {
		
	for (var v in values) {
		obj[values[v]] = "";
	}
	for (var k=0; k<data.length; k++) {		
			var tv = data[k];
			var j = typ.index(tv,0.5);
			for (v in values) {
				if (tv[values[v]]) {
					obj[values[v]] += " " + Math.round(dims.x1+j*dims.dx) + " " + 
						Math.round( dims.height-(tv[values[v]] - dims.mny) * dims.dmy);
				}
			}
	}
}

function makeRects(obj, data, dims, typ, values, cols) {
	
	for (var v in values) {
		obj[values[v]] = [];
	}
	if (data.length>1) {
		obj.xwidth = 0.9*dims.dx*(typ.index(data[1])-typ.index(data[0]));
	}
	for (var k=0; k<data.length; k++) {		
			var tv = data[k];
			var j = typ.index(tv);
			for (v in values) {
				if (tv[values[v]]) {
					obj[values[v]].push({x: Math.round(dims.x1+j*dims.dx+obj.xwidth*0.07), 
										 y: Math.round( dims.height-(tv[values[v]] - dims.mny) * dims.dmy),
										 color: cols[v]
										 });					
				}
			}
	}
}


function makeAxes(obj, data, dims, typ) {
	obj.tickYx = dims.x1-5;
    obj.tickYy = [];
    obj.tickYTag = [];
    
    obj.gridYPath = [];
    obj.gridYStroke = [];
    
    var step = 1;
    if (dims.mxy-dims.mny > 20) { 
    	step = 5; 
    }
    
    for (var j = Math.ceil(dims.mny); j <= Math.floor(dims.mxy); j++) {
        if (j % step == 0) {
		    obj.gridYPath.push(dims.x1 + " " + Math.round(dims.height-(j-dims.mny)*dims.dmy) + " " + dims.width + 
		    		" " + Math.round(dims.height-(j-dims.mny)*dims.dmy));
		    obj.gridYStroke.push(j==0 ? 3 : 1);

		    obj.tickYy.push((dims.height-(j-dims.mny)*dims.dmy));
        	obj.tickYTag.push(j);
        }
    }		    
    
    obj.tickXx = [];
    obj.tickXy = dims.height+20;
    obj.tickXTag = typ.xaxis;
    		    
    obj.gridXPath = [];
    obj.link = [];
    obj.x = [];

    var mbeg=typ.tick();
    
    if (data.length > 0 && (data[0].time_d || data[0].monat)) {
    	obj.tickXwidth=(mbeg[1]-mbeg[0])*dims.dx-7;
    	obj.tickXheight=20;
	    for (var j=0; j<data.length; j++) {
		     if (data[j].time_d) {
		    	obj.link.push(data[j].time_d); 
		    } else {
		    	obj.link.push(data[j].monat);
		    }
		    obj.x.push(Math.round(dims.x1+typ.index(data[j])*dims.dx));
	    }
    } else {
    	obj.tickXwidth=0;
    	obj.tickXheight=0;
    	//obj.tickXwidth=(mbeg[1]-mbeg[0])*dims.dx-7;
    	//obj.tickXheight=20;
    }
    
    for (var j=0; j<mbeg.length; j++) {
	    obj.gridXPath.push(Math.round(dims.x1 + (mbeg[j]*dims.dx)) + " 0 " + 
	    		Math.round(dims.x1 + (mbeg[j]*dims.dx)) + " " + dims.height + " ");
	    obj.tickXx.push(5+Math.round(dims.x1+(mbeg[j]*dims.dx)));
    }

    obj.title = typ.title;

}

function svgMakerFactory() {
	
	return {
		prepareTemp: function(obj, typ) {
			
			var values = ["temp_o",  "temp_i", "temp_o_min", "temp_o_max", "temp_o_absmin", "temp_o_absmax"];
			
			var data = obj.list;
		    obj.list = undefined;
		    if (data.length==0) return;
		    
		    if (!data[0]["temp_o_absmin"]) {
		    	values=values.slice(0,4);
		    } 
		    if (!data[0]["temp_o_min"]) {
		    	values=values.slice(0,2);
		    } 
			
			console.log("d.len:"+data.length);
			
			var dims={height: 1000, width: 1600, x1: 90};
	        
	        makeRange(dims, data, values, typ);
	       
		    makeCurves(obj, data, dims, typ, values);
		    
		    makeAxes(obj, data, dims, typ);
		    
		},
	
		
		preparePhen: function(obj, typ, feld) {
			
			var values = [feld];
			
			var data = obj.list;
		    obj.list = undefined;
			
			console.log("d.len:"+data.length);
			
			var dims={height: 970, width: 1600, x1: 90};
	        
			var col = 'green';
	        
			if (feld=='precip') { dims.mny=0; col='blue';}
			if (feld=='sun') { dims.mny=0; col='yellow'; }
			if (feld=='cloud') { dims.mny=0; dims.mxy=8; col='gray';}
			
			makeRange(dims, data, values, typ);
		    
	        if (feld=='precip' || feld=='cloud' || feld == 'sun') {
	        	makeRects(obj, data, dims, typ, values, [col]);
	        } else {
	        	makeCurves(obj, data, dims, typ, values);
	        }
		    
		    makeAxes(obj, data, dims, typ);
		},
		
		prepareWind: function(obj, typ, feld) {
			
			var values = ['windf', 'windf_max'];
			var cols = ['cyan', 'violet'];
			
			var data = obj.list;
		    obj.list = undefined;
			
			console.log("d.len:"+data.length);
			
			var dims={height: 970, width: 1600, x1: 90};
	        
			dims.mny=0;
			
			makeRange(dims, data, values, typ);
		    
	        makeRects(obj,data,dims,typ,values, cols);
	        
	        obj.windd = [];
	        obj.windv = [];
	        
	        for (var k=0; k<data.length; k++) {
	        	var tv = data[k];
	        	if (tv.windf) {
						obj.windd.push(tv.windd[1]);
						obj.windv.push(tv.windd[0]/tv.windf)
	        	}
	        }
		    
		    makeAxes(obj, data, dims, typ);
		}
	};
}




