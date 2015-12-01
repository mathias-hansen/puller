var fs = require("fs");
var http = require("http");
var exec = require("child_process").exec;

//log
function writeLog(data, resolve) {
	fs.writeFile("log", data, 'utf8', resolve);
}

function appendLog(type, message) {
	message = "\n[" + type.toUpperCase() + "]\t" + new Date().toString() + "\t" + message;
	
	return new Promise(function(resolve, reject) {
		
		fs.exists("log", function (exists) {
			if (exists) {
				fs.readFile("log", function (err, data) {
					if (err) reject(err);
					else {
						writeLog(data + message, resolve);
					}
				});
			} else {
				writeLog(message, resolve);
			}
		});
	});
}

// config
function getConfig() {
	var config;
	
	return new Promise(function(resolve, reject) {
		fs.readFile("config.json", function (err, data) {
			if (err) reject(err);
			else {
				if (data) {
					config = JSON.parse(data);
				}
				
				if (!config.hasOwnProperty("port")) {
					config.port = 8080;
				}
				if (!config.hasOwnProperty("hostname")) {
					config.hostname = "0.0.0.0";
				}
				
				resolve(config);
			}
		});
	});
}

// git
function pull(path) {
	var child = exec("cd " + path + " && git pull origin master", function (error, stdout, stderr) {
		if (error !== null) {
			appendLog("error", error);
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
		request.on("error", function (error) {
			throw error;
		});
		request.on('end', function() {
			payload = JSON.parse(payload);
			
			var repoName = payload.repository.full_name,
				repoPath = repos[repoName];
				
			pull(repoPath);
		});
		
		appendLog("ok", "pulled");
		response.end("");
	}
	else {
		response.end("");	
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
		appendLog("ok", "server listening on http://" + hostname + ":" + port + "/");
	});
}

getConfig().then(function (config) {
	if (config.repos) {
		startServer(config);
	} else {
		appendLog("error", "repos missing from config.json");
	}
}).catch(function (error) {
	if (error.message === "ENOENT: no such file or directory, open 'config.json'") {
		appendLog("error", "config.json is missing");
	} else {
		appendLog("error", error.message);
	}
});