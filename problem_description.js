var argv = require('yargs').argv;
var fs = require('fs');
var beautify = require("json-beautify");
var request = require('request');
var cheerio = require('cheerio');
var waitSync = require('wait-sync');

if(argv.problem!=undefined) getDescription();

function getDescription(){
	var url = 'http://www.spoj.com/problems/'+argv.problem;
	request(url, function(error, response, body){
		if(!error && response.statusCode==200){
			$ = cheerio.load(body, {
				normalizeWhitespace: true
			});
			var problemObj = {};
			problemObj.name = $('#problem-name').text();
			problemObj.tags = $('#problem-tags').text();
			problemObj.body = $('#problem-body').text();
			var dir = 'problems';
			if(!fs.existsSync(dir)) fs.mkdirSync(dir);
			var dir = 'problems/'+argv.problem;
			if(!fs.existsSync(dir)) fs.mkdirSync(dir);
			dir = dir+'/description.json';
			fs.writeFileSync(dir, beautify(problemObj, null, '\t', 80));
		}
		else if(error){
			console.log('Failed to request: '+error.message+'\nURL: '+url);
			waitSync(5);
			getStatusPage();
		}
		else{
			console.log('Failed to request: '+response.statusCode+'\nURL: '+url);
			waitSync(5);
			getStatusPage();
		}
	});
}
