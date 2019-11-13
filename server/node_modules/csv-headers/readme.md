# csv-headers

Returns an array containing those elements which are present in first array and not in others


## Installation

```sh
$ npm install csv-headers
```


## Usage

```js
var csvHeaders = require('csv-headers');

// Various options are:
// file      : Mandatory, Absolute path of file : specified in quotes
// delimiter : Optional, Specify the delimiter between various fields, defaults to comma(,)
// encoding  : Optional, Specify the file encoding, defaults to 'utf8'

var options = {
	file      : 'absoulte file path',
	delimiter : ','
};

csvHeaders(options, function(err, headers) {
	if(!err)
		console.log(headers);
});
//=> ['title', 'salary', 'city', 'state']
```


## License

MIT © [Gaurav Luthra](luthra.zenith@gmail.com)