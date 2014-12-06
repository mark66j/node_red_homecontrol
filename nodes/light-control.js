module.exports = function(RED) {
	"use strict";
	var Insteon = require('home-controller').Insteon;

	function PLMNode(n) {
		RED.nodes.createNode(this,n);
		this.port = n.port;
		console.log('Creating Insteon objects');
		this.plm = new Insteon();
		console.log('Will try to connect to ' + this.port);
		this.plm.serial(this.port,function(){
			console.log('PLM Connected!');
		});
	}

	RED.nodes.registerType("plm",PLMNode);

	function LightControlNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		this.op = config.op;
		if(this.plm) {
			this.log('PLM configured');
		} else {
			this.log('PLM not set up');
		}

		this.on('input', function(msg) {
			if(this.op === 'OFF') {
				this.log('Attempting to turn off ' + msg.payload);
				this.plm.plm.light(msg.payload).turnOff();
			} else if(this.op === 'ON') {
				console.log('Attempting to turn on ' + msg.payload);
				this.plm.plm.light(msg.payload).turnOn();

			} else if(this.op === 'PARAM') {
				// this means payload is in form "id:op"
				var devices = msg.payload.split(',');
				for(var i = 0; i < devices.length ; i++) {
					var parts = devices[i].split(':');
					if('ON' === parts[1])  {
						this.log('Attempting to turn on ' + parts[0]);
						this.plm.plm.light(parts[0]).turnOn();
					} else if ('OFF' === parts[1])  {
						this.log('Attempting to turn off ' + parts[0]);

						this.plm.plm.light(parts[0]).turnOff();
					} else {
						this.warn('Unknown operation from msg : ' + parts[1]);
					}
				}
			} else if(this.op === 'SCENE') {
				// this means payload is in form "group:op"
				var devices = msg.payload.split(',');
				var parts = msg.payload.split(':');
				if('ON' === parts[1])  {
					this.log('Attempting to turn on group ' + parts[0]);
					this.plm.plm.sceneOnFast(parts[0]);
				} else if ('OFF' === parts[1])  {
					this.log('Attempting to turn off group' + parts[0]);
					this.plm.plm.sceneOffFast(parts[0]);
				} else {
					this.warn('Unknown operation from msg : ' + parts[1]);
				}
			}
		});

	}
	RED.nodes.registerType("light",LightControlNode);

	function MotionControlNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		this.device= config.device;
		this.motion = null;
		if(this.plm) {
			this.log('PLM configured');
			this.motion = this.plm.plm.motion(this.device);

		} else {
			this.log('PLM not set up');
		}
		if(this.motion) {
			this.log('Configuring motion functions');
			var sendMsg = this.send.bind(this);

			this.motion.on('motion', function() {
				var msg = { payload:'ON', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.motion.on('clear', function() {
				var msg = { payload:'OFF', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.motion.on('dawn', function() {
				var msg = { payload:'DAWN', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.motion.on('dusk', function() {
				var msg = { payload:'DUSK', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.motion.on('battery', function() {
				var msg = { payload:'BATTERY', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.motion.on('unknown', function() {
				var msg = { payload:'UNKNOWN', timestamp:new Date().toISOString()};
				sendMsg(msg);
			});
			this.log('Motion configuration completed');

		} else {
			this.error('Cannot create motion object');
		}

	}
	RED.nodes.registerType("motion",MotionControlNode);


	function MonitorNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		if(this.plm) {
			this.log('PLM configured');

		} else {
			this.log('PLM not set up');
		}
		var sendMsg = this.send.bind(this);
		this.plm.plm.on('command', function(command) {
			var msg = { payload: command.standard,
					id: command.standard.id, command1: command.standard.command1, 
					command2: command.standard.command2,
					gatewayId : command.standard.gatewayId,
					type : command.standard.type, timestamp: new Date().toISOString()};
			sendMsg(msg);
		});
	}
	RED.nodes.registerType("monitor",MonitorNode);

	function SceneNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		this.group = config.group;
		if(this.plm) {
			this.log('PLM configured');

		} else {
			this.log('PLM not set up');
		}
		this.on('input', function(msg) {
			// payload should be list of light devices to bind into scene
			var devices = msg.payload.split(',');
			var options = { group: this.group };

			this.plm.plm.scene('gw', devices, options);
		});
	}
	RED.nodes.registerType("scene",SceneNode);

	function InsteonRawCommandNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		if(this.plm) {
			this.log('PLM configured');

		} else {
			this.log('PLM not set up');
		}
		var sendMsg = this.send.bind(this);

		this.on('input', function(msg) {
			// payload should be the command object in JSON format, timeout the timeout to use
			this.plm.plm.sendCommand(msg.payload, msg.timeout, function(status) {
				var msg = { payload: status};
				sendMsg(msg);
			});
		});
	}
	RED.nodes.registerType("raw_command",InsteonRawCommandNode);
	
	function InsteonLinkNode(config) {
		RED.nodes.createNode(this,config);
		this.plm =  RED.nodes.getNode(config.plm);
		if(this.plm) {
			this.log('PLM configured');

		} else {
			this.log('PLM not set up');
		}
		var sendMsg = this.send.bind(this);

		this.on('input', function(msg) {
			// payload should be the device id
			// Link gateway to multiple devices
			this.plm.plm.link(msg.payload, function(error, link) {
				var msg = { payload: link, error: error};
				sendMsg(msg);
			})
		});
	}
	RED.nodes.registerType("link",InsteonLinkNode);
	
};
