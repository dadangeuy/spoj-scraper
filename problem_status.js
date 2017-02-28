var argv = require('yargs').argv;
var fs = require('fs');
var beautify = require("json-beautify");
var request = require('request');
var cheerio = require('cheerio');

if(argv.problem!=undefined && argv.user!=undefined) getStatus();

function getStatus(){
	var url = 'http://www.spoj.com/status/'+argv.problem+','+argv.user;
	var pageNum = 1;
	request(url, function(error, response, body){
		if(!error && response.statusCode==200){
			$ = cheerio.load(body, {
				normalizeWhitespace: true
			});
			//spoj only provide submission history until page 5
			$('.pager_link').each(function(){
				if($(this).text() == '2') pageNum = 2;
				if($(this).text() == '3') pageNum = 3;
				if($(this).text() == '4') pageNum = 4;
				if($(this).text() == '5') pageNum = 5;
			});
			for(var i=1; i<=pageNum; i++){
				var startPage = String(20*(i-1));
				getStatusPage(url+'/start='+startPage, i, pageNum);
			}
			return;
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

function getStatusPage(url, curPage, pageNum){
	request(url, function(error, response, body){
		if(!error && response.statusCode==200){
			$ = cheerio.load(body, {
				normalizeWhitespace: true
			});
			var problem = [];
			var date = [];
			var res = [];
			var time = [];
			var memory = [];
			$('.status_sm').each(function(){
				var cleanStr = cleanText($(this).text());
				date.push(cleanStr);
			});
			$('.statusres').each(function(){
				var cleanStr = cleanText($(this).text());
				res.push(cleanStr);
			});
			$('.stime').each(function(){
				var cleanStr = cleanText($(this).text());
				time.push(parseFloat(cleanStr));
			});
			$('.smemory').each(function(){
				var cleanStr = cleanText($(this).text());
				cleanStr = cleanStr.substring(0, cleanStr.length-1);
				memory.push(parseFloat(cleanStr));
			});
			var statusObj = [];
			for(var i in res){
				var obj = {};
				obj.problem = argv.problem;
				obj.user = argv.user;
				obj.date = date[i];
				obj.res = res[i];
				obj.time = time[i];
				obj.memory = memory[i];
				statusObj.push(obj);
			}
			var dir = 'problems';
			if(!fs.existsSync(dir)) fs.mkdirSync(dir);
			var dir = 'problems/'+argv.problem;
			if(!fs.existsSync(dir)) fs.mkdirSync(dir);
			var dir = 'problems/'+argv.problem+'/'+argv.user;
			if(!fs.existsSync(dir)) fs.mkdirSync(dir);
			var dir = 'problems/'+argv.problem+'/'+argv.user+'/status_'+curPage+'.json';
			fs.writeFileSync(dir, beautify(statusObj, null, '\t', 80));
			mergeStatus(pageNum);
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

function mergeStatus(pageNum){
	//check if all file exist
	for(var i=1; i<=pageNum; i++){
		var dir = 'problems/'+argv.problem+'/'+argv.user+'/status_'+String(i)+'.json';
		if(!fs.existsSync(dir)) return;
	}
	var statusObj = [];
	for(var i=1; i<=pageNum; i++){
		var dir = 'problems/'+argv.problem+'/'+argv.user+'/status_'+String(i)+'.json';
		var obj = JSON.parse(fs.readFileSync(dir));
		statusObj = statusObj.concat(obj);
	}
	var dir = 'problems/'+argv.problem+'/'+argv.user+'/status_all.json';
	fs.writeFileSync(dir, beautify(statusObj, null, '\t', 80));
}

function cleanText(str){
	var left=0, right=str.length-1;
	while(str[left]==' ') left++;
	while(str[right]==' ') right--;
	var cleanStr = str.substring(left, right+1);
	return cleanStr;
}