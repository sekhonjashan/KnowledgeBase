var FS 			= require('fs'),
	LINE_READER = require('line-by-line');

function csvHeaders(options, cb) {
	var headers = [];

	var allowedKeys = {
		'file'      : true,
		'delimiter' : true,
		'encoding'  : true
	};

	var lowercaseOptions = {},
		lineReader       = null;

	if(options && (Object.prototype.toString.call( options ) === '[object Object]')) {
		Object.keys(options).forEach(function(key) {
			if(!(key.toLowerCase() in allowedKeys) || !options[key]) {
				delete options[key];
			} else {
				lowercaseOptions[key.toLowerCase()] = options[key];
			}
		});

		// Check if file exists
		try {
			var stats = FS.statSync(lowercaseOptions['file']);
			if(stats && stats.isFile()) {
				var delimiter = lowercaseOptions['delimiter'] ? lowercaseOptions['delimiter'] : ',',
					encoding  = lowercaseOptions['encoding']  ? lowercaseOptions['encoding']  : 'utf8'; 

				lineReader = new LINE_READER(lowercaseOptions['file'], {
					encoding        : encoding,
					skipEmptyLines  : true
				});

				lineReader.on('line', function(line) {
					headers = line.split(delimiter).map(function(name) { return name.trim(); });
					lineReader.emit('end');
				});

				lineReader.on('end', function() {
					lineReader.removeAllListeners('line');
					lineReader.removeAllListeners('end');
					lineReader.removeAllListeners('error');
					if (cb) cb(null, headers);
				});

				lineReader.on('error', function(err) {
					lineReader.removeAllListeners('line');
					lineReader.removeAllListeners('end');
					lineReader.removeAllListeners('error');
					if (cb) cb('Error while reading the headers of csv file : ' + err);
				});

			} else {
				if (cb) cb('No file at specified path : ' + lowercaseOptions['file']);
			}
		} catch(e) {
			if(lineReader) {
				lineReader.close();
				lineReader = null;
			}

			if (cb) cb('File does not exists at : ' + lowercaseOptions['file']);
		}
	}

}

module.exports = csvHeaders;