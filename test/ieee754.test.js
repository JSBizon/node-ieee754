/**
 * 
 */

var should = require('should');

var Float = require('../ieee754').Float,
	Double = require('../ieee754').Double;

/*
 * 1.002122e+10
 * 1.002122e+80 - overflow 32bit
 */
	
var DEC_VALUE1 = 10.1e+10;
var HEX_VALUE1 = '51BC208E';
var BIN_VALUE1 = '';


var DEC_VALUE2 = -10.1e-30;

var FLOW_OVERFLOW_VALUE = 1.002122e+80;

exports = {

	"test float constructor" : function(){
		var float = new Float(DEC_VALUE1);
		
		should.strictEqual(float.decValue(), DEC_VALUE1);
		
		should.strictEqual(float.hex(), HEX_VALUE1);
		
		//should.strictEqual(float.hex(), DEC_VALUE1);
		
		var dec = float.dec();
		
		
		console.log(float.dec());
		if(float.dec() != DEC_VALUE1){
			console.log('Not');
		}
		
		var dec = float.dec();
		console.log(typeof(dec));
		should.strictEqual(float.decValue(), DEC_VALUE1);
		
		
		//float.dec().should.equal(DEC_VALUE1);
		
		console.log(float.hex());
		console.log(float.bin());
		/*
		float = Float.fromBin('11111');
		float = Float.fromHex(HEX_VALUE1);
		*/
		
		//float = ieee754.Float.fromRaw(data);
	},
	
	"test double" : function(){
		var double = new Double(DEC_VALUE2);
	},
	
	"test overflow" : function(){
		
	}
};
