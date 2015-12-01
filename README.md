# puller

the root of puller must contain 

config.json

port: number default 8080

the port of the web server

hostname: string default 0.0.0.0

hostname the webserver listens to. default is all

repos: { required

	"owner/repo": "/path/to/repo"
	
}

