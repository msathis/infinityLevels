'use strict';

var fs = require('fs'), readline = require('readline'); 

exports.analyzeFile = function(filePath) {

    var statusObject = {
        'GET': {},
        'POST': {}
    };

    var rd = readline.createInterface({
        input: fs.createReadStream(filePath),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', processLine.bind(statusObject));
    rd.on('close', printStats.bind(statusObject));
};

var processLine = function(line) {
    var lineArray = line.split(" ");
    var path = lineArray[4].split("=")[1];
    var method = lineArray[3].split("=")[1];
    var dyno = lineArray[7].split("=")[1];
    var connectTime = parseInt(lineArray[8].split("=")[1]);
    var serviceTime = parseInt(lineArray[9].split("=")[1]);
    var totalTime = connectTime + serviceTime;

    var re1 = /\/api\/(.*)user(s?)\/(.*)/; 
    var matches;

    if ((matches = re1.exec(path)) !== null) {
        if (matches.index === re1.lastIndex) {
            re1.lastIndex++;
        }
        path ='/api/'+ matches[1] +'user'+ matches[2] +'/{user_id}/' + (matches[3].split('/')[1] || '');
    }

    if (typeof this[method][path] === 'undefined') {
        this[method][path] = {
            count: 0,
            dynos: {},
            resTime:  {
                total: 0,
                values: []
            }
        };
    }

    this[method][path].count += 1;
    this[method][path].dynos[dyno] = (this[method][path].dynos[dyno] || 0) + 1;
    this[method][path].resTime.total = this[method][path].resTime.total + totalTime;
    this[method][path].resTime.values.push(totalTime);
};

var printStats = function() {

    for (var method in this) {
        for (var path in this[method]) {
            var avgTime = Math.round(this[method][path].resTime.total / this[method][path].count);
            var median = getMedian(this[method][path].resTime.values);
            var mode = getMode(this[method][path].resTime.values);
            var dyno = getMaxKey(this[method][path].dynos);
           
            console.log(method + " " + path + " " +avgTime + "ms " + median + "ms " + mode + "ms " + dyno);
        }
    }
};

var getMaxKey = function(values) {
    var max = 0, maxKey;
    for (var key in values) {
        if (values[key] > max) {
            max = values[key];
            maxKey = key;
        }
    }
    return maxKey;
};

var getMedian = function(values) {
    
    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length / 2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
};

var getMode = function(array) {
   if(array.length == 0)
    	return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
    	var el = array[i];
    	if(modeMap[el] == null)
    		modeMap[el] = 1;
    	else
    		modeMap[el]++;	
    	if(modeMap[el] > maxCount)
    	{
    		maxEl = el;
    		maxCount = modeMap[el];
    	}
    }
    return maxEl;
};


