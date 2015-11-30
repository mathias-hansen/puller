var fs = require("fs");
var http = require("http");
var exec = require("child_process").exec;

function getConfig() {
	return new Promise(function(resolve, reject) {
		fs.readFile("config.json", function (err, data) {
			if (err) reject(err);
			else {
				resolve(JSON.parse(data));
			}
		});
	});
}

function pull(path) {
	var child = exec("cd " + path + " && git pull origin master", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});
	
	return child;
}

function handleRequest(request, response, path) {
	if (request.url === "/pull") {
		pull(path);
		
		console.log("pulled");
		response.end("pulled");
	}
	else {
		response.end(":)");	
	}
}

function startServer(config) {
	var port = config.port,
		hostname = config.hostname,
		repoPath = config["repo-path"];
	
	var server = http.createServer(function (request, response) {
		handleRequest(request, response, repoPath);
	});
	
	server.listen(port, hostname, function () {
		console.log("server listening on http://" + hostname + ":" + port + "/");
	});
}

getConfig().then(function (config) {
	if (config.port && config.hostname) {
		startServer(config);
	} else {
		throw "config must have port and homstname";
	}
});
