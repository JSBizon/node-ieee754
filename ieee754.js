/*
http://babbage.cs.qc.edu/IEEE-754/Decimal.html
*/

var util = require('util');

var NUMERALS = "0123456789",
	CNST = 2102,   // 1 (carry bit) + 1023 + 1 + 1022 + 53 + 2 (round bits)
	BIAS = 1024,
	FLOAT_SIZE = 32,
	DOUBLE_SIZE = 64;


var Ieee = function(size){
	this.BinaryPower = 0;
	this.DecValue = "";
	this.DispStr = "";
	this.StatCond = "normal";
	this.StatCond64 = "normal";
	this.BinString = "";
	
	// 1 (carry bit) + 1023 + 1 + 1022 + 53 + 2 (round bits)
	this.BinVal = new Array(CNST);//Binary Representation
	for (index1 = 0; index1 < CNST; index1++)  
		this.BinVal[index1] = 0;
	
	this.size = size;
	this.ExpBias = 127;
	this.MaxExp = 127;
	this.MinExp = -126;
	this.MinUnnormExp = -149;

	this.binary = new Array(this.size);
	
	for (var i = 0; i < this.size; i++) 
		this.binary[i] = 0;
};


Ieee.prototype.bin = function(){
	var val = this.binary.join('');
	return val;
};


Ieee.prototype.hex = function(){
	var val = bin2hex(this.binary.join(''));
	var bytes = Math.ceil(this.size / 8);
	//auto complete by zero
	if(val.length < bytes * 2)
		val =  repeatStr("0", bytes * 2 - val.length) + val;
	return val.toUpperCase();
};

Ieee.prototype.isPositive = function(){
	
};

Ieee.prototype.dec = function(){
	var dp, val, hid, temp, power;
	with (Math){
		var s = this.size == 32 ? 9 : 12;
		if ((this.BinaryPower < this.MinExp) || (this.BinaryPower > this.MaxExp)){
			dp = 0;
			val = 0;
		}
		else
		{
			dp = - 1;
			val = 1;
		}

		for (var i = s; i < this.size; i++)
			val += parseInt(this.binary[i])*pow(2, dp + s - i);

		var decValue = val * pow(2, this.BinaryPower);

		this.FullDecValue = decValue;

		if (this.size == 32)
		{
			s = 8;
			if (val > 0)
			{
				power = floor( log(decValue) / LN10 );
				decValue += 0.5 * pow(10, power - s + 1);
				val += 5E-8;
			}
		}
		else s = 17;

		if (this.binary[0] == 1)
		{
			decValue = - decValue;
			this.FullDecValue = - this.FullDecValue;
		}
		
		//return decValue;
		
		//the system refuses to display negative "0"s with a minus sign
		this.DecValue = "" + decValue;
		if ((this.DecValue == "0") && (this.binary[0] == 1))
			this.DecValue = "-" + this.DecValue;
		
		this.DecValue = numStrClipOff(this.DecValue, s);
		return this.DecValue;
	}
};


Ieee.prototype.decValue = function(){
	return parseFloat(this.dec());
};


Ieee.prototype.decSignificand = function(){
	var  i, dp, val, hid, temp, power;

	var s = this.size == 32 ? 9 : 12;
	if ((this.BinaryPower < this.MinExp) || (this.BinaryPower > this.MaxExp)){
		dp = 0;
		val = 0;
	}
	else{
		dp = - 1;
		val = 1;
	}
	for (i = s; i < this.size; i++)
		val += parseInt(this.binary[i])*Math.pow(2, dp + s - i);
	
	var decValue = val * Math.pow(2, this.BinaryPower);
	if (this.size == 32)
	{
		s = 8;
		if (val > 0)
		{
			power = Math.floor( Math.log(decValue) / Math.LN10 );
			decValue += 0.5 * Math.pow(10, power - s + 1);
			val += 5E-8;
		}
	}
	else 
		s = 17;

	if (this.binary[0] == 1) 
		decValue = - decValue;

	//the system refuses to display negative "0"s with a minus sign
	this.DecValue = "" + decValue;
	if ((this.DecValue == "0") && (this.binary[0] == 1))
		this.DecValue = "-" + this.DecValue;

	this.DecValue = numStrClipOff(this.DecValue, s);
	var output = numCutOff(val, s);
	return output;
};


Ieee.prototype._convert2Bin = function(rounding){
	var binexpnt2, moreBits;
	
	with (Math)
	{
		//sign bit
		//this.binary[0] = signBit;
		//obtain exponent value
		var index1 = 0;
		var index2 = this.size == 32 ? 9 : 12;
		if (rounding && (this.StatCond  == "normal")){
			//find most significant bit of significand
			var rounded = 0;
			while ((index1 < CNST) && (this.BinVal[index1] != 1)) 
				index1++;
			var binexpnt = BIAS - index1;
			//regular normalized numbers
			if (binexpnt >= this.MinExp)
			{
				//the value is shifted until the most
				//significant 1 is to the left of the binary
				//point and that bit is implicit in the encoding
				index1++;
			}//if normalized numbers
			//support for zero and denormalized numbers
			//exponent underflow for this precision
			else
			{
				binexpnt = this.MinExp - 1;
				index1 = BIAS - binexpnt;
			}//if zero or denormalized (else section)

			//use round to nearest value mode
			//compute least significant (low-order) bit of significand
			var lastbit = this.size - 1 - index2 + index1;
			//the bits folllowing the low-order bit have a value of (at least) 1/2
			if (this.BinVal[lastbit + 1] == 1){
				rounded = 0;
				//odd low-order bit
				if (this.BinVal[lastbit] == 1)
				{
					//exactly 1/2 the way between odd and even rounds up to the even,
					//so the rest of the bits don't need to be checked to see if the value
					//is more than 1/2 since the round up to the even number will occur
					//anyway due to the 1/2
					rounded = 1;
				}//if odd low-order bit
				//even low-order bit
				else  //this.BinVal[lastbit] == 0
				{
					//exactly 1/2 the way between even and odd rounds down to the even,
					//so the rest of the bits need to be checked to see if the value
					//is more than 1/2 in order to round up to the odd number
					var index3 = lastbit + 2;
					while ((rounded == 0) && (index3 < CNST))
					{
						rounded = this.BinVal[index3];
						index3++;
					}//while checking for more than 1/2
				}//if even low-order bit (else section)

				//do rounding "additions"
				var index3 = lastbit;
				while ((rounded == 1) && (index3 >= 0))
				{
					// 0 + 1 -> 1 result with 0 carry
					if (this.BinVal[index3] == 0){
						// 1 result
						this.BinVal[index3] = 1;
						// 0 carry
						rounded = 0;
					}//if bit is a 0
					// 1 + 1 -> 0 result with 1 carry
					else  //this.BinVal[index3] == 1
					{
						// 0 result
						this.BinVal[index3] = 0;
						// 1 carry
						// rounded = 1
					}//if bit is a 1 (else section)
					index3--;
				}//while "adding" carries from right to left in bits

			}//if at least 1/2

			//obtain exponent value
			index1 = index1 - 2;
			if (index1 < 0) index1 = 0;
		}//if rounding

		//find most significant bit of significand
		while ((index1 < CNST) && (this.BinVal[index1] != 1)) index1++;
		
		var binexpnt2 = BIAS - index1;
		if (this.StatCond == "normal"){
			binexpnt = binexpnt2;
			//regular normalized numbers
			if ((binexpnt >= this.MinExp) && (binexpnt <= this.MaxExp)){
				//the value is shifted until the most
				//significant 1 is to the left of the binary
				//point and that bit is implicit in the encoding
				index1++;
			}//if normalized numbers
			//support for zero and denormalized numbers
			//exponent underflow for this precision
			else if (binexpnt < this.MinExp){
				if (binexpnt2 == BIAS - CNST)
					//value is truely zero
					this.StatCond = "normal";
				else if (binexpnt2 < this.MinUnnormExp)
					this.StatCond = "underflow";
				else
					this.StatCond = "denormalized";

				binexpnt = this.MinExp - 1;
				index1 = BIAS - binexpnt;
			}//if zero or denormalized (else if section)
		}
		else //already special values
		{
			binexpnt = this.BinaryPower;
			index1 = BIAS - binexpnt;
			if (binexpnt > this.MaxExp)
				binexpnt = this.MaxExp + 1;
			else if (binexpnt < this.MinExp)
				binexpnt = this.MinExp - 1;
		}//if already special (else section)

		//copy the result
		while ((index2 < this.size) && (index1 < CNST)){
			this.binary[index2] = this.BinVal[index1];
			index2++;
			index1++;
		}//while
		//max exponent for this precision
		if ((binexpnt > this.MaxExp) || (this.StatCond != "normal")){
			//overflow of this precision, set infinity
			if (this.StatCond == "normal")
			{
				binexpnt = this.MaxExp + 1;
				this.StatCond = "overflow";
				this.DispStr = "Infinity";
				if (this.binary[0] == 1)
					this.DispStr = "-" + this.DispStr;
				index2 = this.size == 32 ? 9 : 12;
				//zero the significand
				while (index2 < this.size)
				{
					this.binary[index2] = 0;
					index2++;
				}//while
			}//if overflowed
		}//if max exponent
		//convert exponent value to binary representation
		index1 = this.size == 32 ? 8 : 11;
		this.BinaryPower = binexpnt;
		binexpnt += this.ExpBias;	
		while ((binexpnt / 2) != 0){
			this.binary[index1] = binexpnt % 2;
			if (binexpnt % 2 == 0) 
				binexpnt = binexpnt / 2;
			else 
				binexpnt = binexpnt / 2 - 0.5;
			index1 -= 1;
		}
	}//with Math
};


Ieee.prototype._dec2Bin = function(input){
	with (Math){
		input = parseFloat(input);
		this.binary[0] = input < 0 ? 1 : 0;
		
		//convert and seperate input to integer and decimal parts
		var value = abs(input),
			intpart = floor(value),
			decpart = value - intpart,
			index1 = BIAS;
			//convert integer part
		while (((intpart / 2) != 0) && (index1 >= 0)){
			this.BinVal[index1] = intpart % 2;
			if (intpart % 2 == 0) 
				intpart = intpart / 2;
			else intpart = intpart / 2 - 0.5;
				index1 -= 1;
		}
		//convert decimal part
		index1 = BIAS + 1;
		while ((decpart > 0) && (index1 < CNST)){
			decpart *= 2;
			if (decpart >= 1){
				this.BinVal[index1] = 1; 
				decpart --; 
				index1++;
			}
			else {
				this.BinVal[index1] = 0; 
				index1++;
			}
		}
		//obtain exponent value
		index1 = 0;
		//find most significant bit of significand
		while ((index1 < CNST) && (this.BinVal[index1] != 1)) 
			index1++;
		
		var binexpnt = BIAS - index1;
		//support for zero and denormalized numbers
		//exponent underflow for this precision
		if (binexpnt < this.MinExp){
			binexpnt = this.MinExp - 1;
		}//if zero or denormalized
		
		this.BinaryPower = binexpnt;
	}//with Math
};

Ieee.prototype._binary2BinVal = function(){
	with (Math){
		//obtain exponent value
		var binexpnt = 0,
			index1,
			index2 = this.size == 32 ? 9 : 12;
		
		console.log("Bin: " + this.binary);
		
		for (index1 = 1; index1 < index2; index1++){
			console.log("index1: "+ index1 +" - " + parseInt(this.binary[index1],2));
			binexpnt += parseInt(this.binary[index1],2)*pow(2, index2 - index1 - 1);
		}
		binexpnt -= this.ExpBias;
		this.BinaryPower = binexpnt;
		index1 = BIAS - binexpnt;
		//regular normalized numbers
		if ((binexpnt >= this.MinExp) && (binexpnt <= this.MaxExp)){
			//the encoding's hidden 1 is inserted
			this.BinVal[index1] = 1;
			index1++;
		}//if normalized numbers

		var index3 = index1;
		
		
		
		if (this.binary[index2] == 0)
			zeroFirst = true;
		this.BinVal[index1] = this.binary[index2];
		index2++;
		index1++;
		
		var zeroRest = true;
		while ((index2 < this.size) && (index1 < CNST)){
			if (this.binary[index2] == 1)
				zeroRest = false;
				this.BinVal[index1] = this.binary[index2];
			index2++;
			index1++;
		}//while

		//console.log("res: " + this.BinVal);
		
		//find most significant bit of significand
		//for the actual denormalized exponent test for zero
		while ((index3 < CNST) && (this.BinVal[index3] != 1)) 
			index3++;
		binexpnt2 = BIAS - index3;
		
		//zero and denormalized numbers
		if (binexpnt < this.MinExp){
			if (binexpnt2 == BIAS - CNST)
				//value is truely zero
				this.StatCond = "normal";
			else if (binexpnt2 < this.MinUnnormExp)
				this.StatCond = "underflow";
			else
				this.StatCond = "denormalized";
		}//if zero or denormalized
		//max exponent for this precision
		else if (binexpnt > this.MaxExp)
		{
			if (zeroFirst && zeroRest)
			{
				//Infinity
				this.StatCond = "overflow";
				this.DispStr = "Infinity";
			}//if Infinity
			else if (!zeroFirst && zeroRest && (this.binary[0] == 1))
			{
				//Indeterminate quiet NaN
				this.StatCond = "quiet";
				this.DispStr = "Indeterminate";
			}//if Indeterminate quiet NaN (else if section)
			else if (!zeroFirst)
			{
				//quiet NaN
				this.StatCond = "quiet";
				this.DispStr = "NaN";
			}//if quiet NaN (else if section)
			else
			{
				//signaling NaN
				this.StatCond = "signaling";
				this.DispStr = "NaN";
			}//if signaling NaN (else section)

			if ((this.binary[0] == 1) && (this.DispStr != "Indeterminate"))
				this.DispStr = "-" + this.DispStr;
		}//if max exponent (else if section)
	}//with Math

};


function numStrClipOff(input, precision){
	var tempstr = input.toUpperCase();
	var locE = tempstr.indexOf("E"),
		stop = input.length,
		expstr = new String,
		expnum = 0;
	if (locE != -1){
		stop = locE;
		expstr = input.substring(locE + 1, input.length);
		expnum = expstr * 1;
	}
	
	if (input.indexOf(".") == -1){
		tempstr = input.substring(0, stop);
		tempstr += ".";
		if (input.length != stop)
			tempstr += input.substring(locE, input.length);
		input = tempstr;
		locE = locE + 1;
		stop = stop + 1;
	}
	
	var locDP = input.indexOf("."),
		signstr = "",
		start = 0;
	if (input.charAt(start) == "-"){
		start++;
		signstr = "-";
	}
	var MSD = start,
		index,
		MSDfound = false;
	while ((MSD < stop) && !MSDfound){
		index = 1;
		while (index < NUMERALS.length){
			if (input.charAt(MSD) == NUMERALS.charAt(index)){
				MSDfound = true;
				break;
			}
			index++;
		}
		MSD++;
	}
	MSD--;
	var expdelta;
	if (MSDfound){
		expdelta = locDP - MSD;
		if (expdelta > 0)
			expdelta = expdelta - 1;
		expnum = expnum + expdelta;
		expstr = "e" + expnum;
	}
	else  //No significant digits found, value is zero
		MSD = start;
	
	var digits = stop - MSD;
	tempstr = input.substring(MSD, stop);

	if (tempstr.indexOf(".") != -1)
		digits = digits - 1;

	var number = (precision < digits) ? precision : digits;

	tempstr = input.substring(MSD, MSD + number + 1);
	
	var result = new String();
	if ( (MSD != start) || (tempstr.indexOf(".") == -1) ){
		result = signstr;
		result += input.substring(MSD, MSD + 1);
		result += ".";
		result += input.substring(MSD + 1, MSD + number);
		while (digits < precision)
		{
			result += "0";
			digits += 1;
		}
		result += expstr;
	}
	else{
		result = input.substring(0, start + number + 1);
		while (digits < precision){
			result += "0";
			digits += 1;
		}
		if (input.length != stop)
			result += input.substring(locE, input.length);
	}
	return result;
}


function numCutOff(input, precision){
	var temp = input;
	if(temp < 1)
		temp += 1;

	var tempstr = numStrClipOff("" + temp, precision);
	
	var result = (temp == input) ? tempstr.substring(0, 1) : "0";
	result += tempstr.substring(1, tempstr.length);
	
	return result;
}

function repeatStr(s, n){
	var a = [];
	while(a.length < n) a.push(s);
	return a.join('');
}


function bin2hex(binStr,bits){
	return parseInt(binStr, 2).toString(16);
}


function hex2bin(hexStr,bits){
	return parseInt(hexStr, 16).toString(2);
}

function raw2bin(buf,size){
	
}

function Float(input,notrounding,type){
	Ieee.call(this,FLOAT_SIZE);
	this.init(input,notrounding,type);

}
util.inherits(Float, Ieee);
exports.Float = Float; 

function Double(input,notrounding,type){
	Ieee.call(this,DOUBLE_SIZE);
	
	this.ExpBias = 1023;
	this.MaxExp = 1023;
	this.MinExp = -1022;
	this.MinUnnormExp = -1074;
	
	this.init(input,notrounding,type);
};
util.inherits(Double, Ieee);
exports.Double = Double;

Float.prototype.init = Double.prototype.init = function(input,notrounding,type){
	
	if(type == 'bin'){
		
		var bin = parseInt(binStr, 2).toString(2);
		for(var i = this.size - 1, j = bin.length - 1; i >= 0 && j >= 0; i--, j--)
			this.binary[i] = Number(bin[j]);
		
		this._binary2BinVal();
	}else if(type == 'hex'){
		
		var bin = hex2bin(input);
		for(var i = this.size - 1, j = bin.length - 1; i >= 0 && j >= 0; i--, j--)
			this.binary[i] = Number(bin[j]);
		
		this._binary2BinVal();
	}else if(type == 'raw'){
		
		if(typeof input !== 'string' && typeof input !== 'object')
			throw new Error('First argument needs to be array or string.');

		for(var i = size - 1, j = input.length - 1; i >= 0 && j >=0; j--){
			var byte = input[j];
			if(typeof byte === 'string') {
				if(j > 0) byte = input[--j] + byte;
				byte = parseInt(byte,16);
			}

			var mask = 1;
			for(var k = 8; k > 0 && i >= 0; k--,i--){
				this.binary[i] = (byte & mask) ? 1 : 0;
				mask <<= 1;
			}
		}
		
		this._binary2BinVal();
	}else{
		//decimial
		this._dec2Bin(input);
		this._convert2Bin(!notrounding);
	}
};

Float.fromHex = Double.fromHex = function(input){
	return new this(input,null,'hex');
};

Float.fromDec = Double.fromDec = function(input){
	return new this(input,null,'dec');
};

Float.fromRaw = Double.fromRaw = function(input){
	return new this(input,null,'raw');
};

