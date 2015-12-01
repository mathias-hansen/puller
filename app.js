var fs = require("fs");
var http = require("http");
var exec = require("child_process").exec;

// config
function getConfig() {
	return new Promise(function(resolve, reject) {
		fs.readFile("config.json.sample", function (err, data) {
			if (err) reject(err);
			else {
				resolve(JSON.parse(data));
			}
		});
	});
}

// git
function pull(path) {
	var child = exec("cd " + path + " && git pull origin master", function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}
	});
	
	return child;
}

// server
function handleRequest(request, response, repos) {
	if (request.url === "/pull") {
		var payload = "";
		
		request.on("data", function (chunk) {
			payload += chunk;
		});
		request.on('end', function() {
			payload = JSON.parse(payload);
			
			var repoName = payload.compare
				.match(/https:\/\/github.com\/\w+\/\w+/)[0]
				.replace(/https:\/\/github.com\//, ""),
				repoPath = repos[repoName];
				
			pull(repoPath);
		});
		
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
		repos = config.repos;
	
	var server = http.createServer(function (request, response) {
		handleRequest(request, response, repos);
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
