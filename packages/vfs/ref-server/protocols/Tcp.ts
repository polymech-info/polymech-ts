import { Protocol } from './Protocol';
import * as utils from '../shared/utils';
import { mixin } from '@xblox/core/objects';
import { remove } from '@xblox/core/arrays';
import * as _ from 'lodash';
import * as net from 'net';
import { DeviceInfo, EVENTS } from './../shared/types';
import { Connection } from '../model/Connection'
import * as debug from '../log';
import { IProtocolHandler, ConnectionManager } from '../manager/ConnectionManager';
import * as os from 'os';
import { IDeviceCommand, ERRORS } from '../types';
const ipaddr = require('ipaddr.js');
const evilscan = require('evilscan');
const _debug = false;

export class Tcp extends Protocol {
    _name = 'tcp';
    _socket: net.Socket;
    _server: net.Server;
    _clients: Connection[] = [];
    _creatingServer: boolean;
    _handler: ConnectionManager;
    connections: any[] = [];
    _handleSocketEmits(socket: any) {
        /*
        var self = this;
        var connection = self.connection;
        var scope = this.blockScope;
        var responseVariable = scope.getVariable('value');
        var responseVariables = scope.getVariables({
            group: types.BLOCK_GROUPS.CF_DRIVER_RESPONSE_VARIABLES
        });
        var responseBlocks = scope.getBlocks({
            group: types.BLOCK_GROUPS.CF_DRIVER_RESPONSE_BLOCKS
        });
        socket.on('connection', (conn) =>{
            this.socket = conn;
            this.clients.push(conn);
            conn.on('data', function (data) {
                const messages = [{
                    string: data.toString(),
                    bytes: data.join(",")
                }];

                for (var i = 0; i < messages.length; i++) {
                    if (messages[i].length === 0) {
                        continue;
                    }
                    responseVariable.value = new String(messages[i].string);
                    responseVariable.value.setBytes(messages[i].bytes);

                    //now run each top variable block in 'conditional process'
                    for (var j = 0; j < responseVariables.length; j++) {
                        var _var = responseVariables[j];
                        if (responseVariables[j].title == 'value') {
                            continue;
                        }

                        var _varResult = null;
                        var _cValue = responseVariable.value;


                        if (!(typeof _cValue == "number")) {
                            _cValue = '' + _cValue;
                            _cValue = "'" + _cValue + "'";
                        }
                        var prefix = "var value = " + _cValue + ";";

                        _varResult = _cValue;
                        if (_var.target && _var.target != 'None' && _varResult !== null && _varResult != 'null' && _varResult != "'null'") {
                            var targetVariable = scope.getVariable(_var.target);
                            if (targetVariable) {
                                targetVariable.value = _varResult;
                                this.publish(types.EVENTS.ON_DRIVER_VARIABLE_CHANGED, {
                                    item: targetVariable,
                                    scope: scope,
                                    owner: this,
                                    save: false,
                                    source: types.MESSAGE_SOURCE.BLOX  //for prioritizing
                                });
                            }
                        }
                    }

                    for (var k = 0; k < messages.length; k++) {
                        var __message = messages[k];
                        if (_.isObject(__message)) {
                            if (__message.src) {
                                var block = scope.getBlockById(__message.src);
                                if (block && block.onData) {
                                    block.onData(__message);
                                }
                            }
                        }
                    }


                    for (var l = 0; l < responseBlocks.length; l++) {
                        var block = responseBlocks[l];
                        if (block.enabled === false) {
                            continue;
                        }
                        block.override = {
                            args: [responseVariable.value]
                        };
                        try {
                            scope.solveBlock(responseBlocks[l], {
                                highlight: false
                            });
                        } catch (e) {
                            console.log('----solving response block crashed ', e);
                            console.trace();
                        }
                    }
                }
            });
            conn.on('close', function () {
                debug && console.info('close client connection ');
            });
        });
        */
    }
    makeServer() {
        if (this._creatingServer) {
            return;
        }
        this._creatingServer = true;
        /*
        try {

            var options = this.info();
            var port = options.port;
            var host = options.host;

            var connectionManager = this.owner;
            var context = connectionManager.ctx;

            var driverManager = context.getDriverManager();
            var dfd = driverManager.createDriverInstance(options);
            var self = this;

            dfd.then(function (data) {
                self.blockScope = data.blockScope;
                self.driverInstance = data.driverInstance;
            });

            var server = new net.Server();
            server.listen(port, host);
            self._socket = server;
            server.writable = true;
            self._handleSocketEmits(server);
            self.connection.connected = true;
            self.delegate.onConnect2(self.connection);
            this.subscribe(types.EVENTS.ON_DEVICE_CONNECTED, this.onDeviceConnected);
            this.subscribe(types.EVENTS.ON_DEVICE_DISCONNECTED, this.onDeviceDisconnected);
        } catch (e) {
            console.error('error creating server', e);
        }
        return this;
        */
    }

    onConnect(evt: any) {
        var connection = evt.connection;
        if (!connection) {
            return;
        }
        var cOptions = connection.options;
        var options = this.device;
        if (!this.connections) {
            this.connections = [];
        }
        if (connection.id === this.connection.id) {
            return;
        }
        var exists = false;//this.delegate.getConnectionById(connection.id);

        if (exists && options.host === cOptions.host && options.port === cOptions.port && options.protocol === cOptions.protocol && !connection.isServer()) {
            if (this.connections.indexOf(connection) === -1) {
                this.connections.push(connection);
            }
        }
    }
    onDisconnect(evt: any) {
        var connection = evt.connection;

        if (!connection) {
            return;
        }
        remove(this.connections, connection);
    }
    connect() {

        const isServer = this.isServer();
        if (isServer) {
            return this.makeServer();
        }
        const options = this.device;
        const port = options.port;
        const host = options.host;
        this._clients = [];

        this._socket = new net.Socket(mixin({
            allowHalfOpen: true,
            writable: true,
            readable: true
        }, {

            }));
        const self = this;
        this.isDebug() && console.log('TCP-Client->Connect to ' + options.host + ' : ' + options.port + ' @ ' + this.name());
        this._socket.connect(parseInt(port), host, () => {
            this.connected = true;
            this.handler().onConnected(this, new Buffer(this.device.name));
        });
        this._socket.setNoDelay(true);
        this._socket.setKeepAlive(true, 0);
        this.listen(this._socket, this.handler());
        // (this._socket as any).owner = this;
        // this._setupEventListeners(this._socket, this.delegate);
        return this;
    }
    listen(socket: net.Socket, handler:ConnectionManager) {

        var self = this;

        //var connection = this.connection;
        /*
        socket.handle = function (data) {
            handler.onHandle(connection, data);
        };*/

        const toArrayBuffer = (buffer) => {
            var ab = new ArrayBuffer(buffer.length);
            var view = new Uint8Array(ab);
            for (var i = 0; i < buffer.length; ++i) {
                view[i] = buffer[i];
            }
            return ab;
        }

        socket.on('data', (data) => {
            handler.onData(this, data);
        });

        if (!handler) {
            debug.stack('have no handler');
        }

        /*
        if (!connection) {
            console.error('have no connection');
            debug.stack('have no connect');
        }
        */

        socket.on('error', (exception) => {
            this.isDebug() && debug.error('socket error : ', exception);
            handler.onError(this, exception);
        });
        socket.on('timeout', () => {
            handler.onTimeout(this);
        });

        // Add a 'close' event handler for the client client
        socket.on('close', (data) => {
            handler.onClose(this);
        });

    }
    broadCastMessage(eventName, _data) {
        const data = _data;
        const connections = this.connections;
        this.connections.forEach((connection) => {
            if (!connection) {
                return;
            }
            if (connection._destroyed) {
                remove(connections, Connection);
            }
            if (connection.client) {
                connection.client.delegate.onData(connection, data.toString(), data);
            } else {
                debug.error('not at a real connection', connection);
            }
        });

    }
    send(data: IDeviceCommand) {
        return new Promise<any>((resolve, reject) => {
            const cmd = data.command;
            if (cmd == null) {
                debug.error('TCP : invalid command');
                return;
            }
            const intArray = utils.bufferFromDecString(cmd);
            const buffer = new Buffer(intArray);
            if (this.isServer()) {
                this.broadCastMessage(EVENTS.ON_DEVICE_MESSAGE, buffer);
            } else {
                debug.log('send device command ' + buffer.toString());
                if (this._socket.writable) {
                    try {
                        if (this._socket.write(buffer)) {
                            resolve();
                        } else {
                            reject('send failed');
                        };
                    } catch (e) {
                        debug.error('error send TCP command', e);
                    }
                } else {
                    debug.error('Socket not writeable ' + this.debug());
                    const e = {
                        code: ERRORS.EHOSTUNREACH,
                        errno: 16,
                        message: 'Socket not writeable'
                    } as NodeJS.ErrnoException
                    this.handler().onError(this, e);
                }
            }
        });
    }
    debug = () => `Protocol ${this.name()} @ ${this.device.host} : ${this.device.port} | Id : ${this.id}`;
    destroy() {
        if (this.isDestroyed()) {
            debug.warn('already destroyed: ' + this.debug());
            return;
        }
        if (!this.isServer()) {
            this._socket.end();
        } else {
            this._server.close();
        }
        /*
        this.blockScope && this.blockScope.destroy();
        this.driverInstance && this.driverInstance.destroy();
        delete this.blockScope;
        delete this.driverInstance;
        delete this.connections;
        delete this.clients;
        delete this._socket;
        this._destroyed = true;
        */
        super.destroy();
    }
    close() {
        if (!this.isServer()) {
            this._socket.end();
        } else {
            this._server.close();
            this.destroy();
        }
    }
    static ls(query: any = {}) {
        return new Promise((resolve, reject) => {
            try {

                const ifaces = os.networkInterfaces();
                const ips = [];
                Object.keys(ifaces).forEach(function (ifname) {
                    let alias = 0;
                    ifaces[ifname].forEach(function (iface) {
                        if ('IPv4' !== iface.family || iface.internal !== false) {
                            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                            return;
                        }
                        if (alias >= 1) {
                            // this single interface has multiple ipv4 addresses
                            ips.push({
                                face: ifname + alias,
                                ip: iface.address
                            })
                        } else {
                            ips.push({
                                face: ifname,
                                ip: iface.address
                            })
                        }
                        ++alias;
                    });
                });
                let results = {}

                function checkResults() {
                    var done = true;
                    _.each(results, function (item) {
                        if (!item.done) {
                            done = false;
                        }
                    })
                    if (done) {
                        var result = [];
                        results = _.filter(results, function (result) {
                            return result.list.length > 0
                        });
                        _.each(results, function (item) {
                            result = result.concat(item.list);
                        });
                        resolve(result);
                    }
                }
                _.each(ips, function (ip) {
                    const range = ipaddr.parse(ip.ip);
                    const octets = range.octets;
                    octets[octets.length - 1] = 0;
                    const target = octets.join('.') + '-254';
                    const testPorts = [query.ports || '80'];
                    const options = {
                        target: target,
                        port: testPorts.join(','),
                        status: 'Open', // Timeout, Refused, Open, Unreachable
                        timeout: 500,
                        banner: false
                    }
                    const scanner = new evilscan(options);
                    if (!results[target]) {
                        results[target] = {
                            done: false
                        };
                        results[target].list = [];
                    }
                    scanner.on('result', function (data) {
                        // fired when item is matching options
                        if (data.status === 'open') {
                            results[target].list.push({
                                host: data.ip,
                                port: data.port,
                                description: ip.face + ' ' + ip.ip,
                                "interface": ip.face
                            });
                        }
                    });
                    scanner.on('error', function (err) {
                        reject("error scanning tcp");
                    });
                    scanner.on('done', function () {
                        //console.log('done');
                        results[target].done = true;
                        checkResults();
                    });
                    scanner.run();
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}
