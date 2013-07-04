if (require.main === module) {
	var seq = require('sjs:sequence'), fs = require('sjs:nodejs/fs');
	process.argv.slice(1) .. seq.each {|f|
		var filename = JSON.stringify(f);
		fs.readFile(f) .. exports.compile({globalReturn: true, filename: filename, keeplines: true}) .. console.log
	}
}
