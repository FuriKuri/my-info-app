var server = require('info-bundling');
server(1337);

var reachable = require('reachable');
var jenkins = require('jenkins-build-status');

function repeat(interval, fn) {
	fn();
	setTimeout(repeat.bind(undefined, interval, fn), interval);
}

var jenkinsToLevel = {
	success: "ok",
	notbuilt: "info",
	warning: "warning",
	error: "error"
};

(function(jobs){ 
	jobs.forEach(function(job) {
	  function update(client) {
	  	jenkins.build({
				  host: '192.168.0.107',
			    port: 8080,
			    name: job,
			    user: 'furi',
			    token: process.env.JENKINS_TOKEN
			}, function(result) {
				var msg = {
					name: "Jenkins " + job,
					status: result.status,
					level: jenkinsToLevel[result.status]
				};
				client.write(JSON.stringify(msg));
			});
	  }
		var net = require('net');
		var client = net.connect({port: 1337},
			function() {
				repeat(2000, update.bind(undefined, client));
			}
		);
	});
}(['Second', 'First', 'Third'])); 

(function(ips){ 
	ips.forEach(function(ip) {
	  function update(client) {
	  	reachable.ping(ip, 2, function(result) {
				var msg = {
					name: "IP Ping " + ip,
					status: result.pingable.toString(),
					level: result.pingable ? "ok" : "error"
				};
				client.write(JSON.stringify(msg));
			});
	  }
		var net = require('net');
		var client = net.connect({port: 1337},
			function() {
				repeat(2000, update.bind(undefined, client));
			}
		);
	});
}(['localhost', '192.168.0.107', '192.168.0.105'])); 


(function(pages){ 
	pages.forEach(function(page) {
	  function update(client) {
	  	reachable.page(page.url, page.element, function(result) {
	  		var level = 'error';
	  		if (result.page && result.element) {
	  			level = 'ok';
	  		} else if (result.page) {
	  			level = 'warning';
	  		}
				var msg = {
					name: page.url,
					status: result.page.toString() + '/' + result.element.toString(),
					level: level
				};
				client.write(JSON.stringify(msg));
			});
	  }
		var net = require('net');
		var client = net.connect({port: 1337},
			function() {
				repeat(2000, update.bind(undefined, client));
			}
		);
	});
}([{url: 'https://duckduckgo.com/', element: 'pg-index'}, 
	{url: 'http://192.168.0.107:8080/', element: 'jenkins'}])); 