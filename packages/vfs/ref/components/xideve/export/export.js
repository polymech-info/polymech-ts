/** @module nxapp/manager/ExportManager */
define([
    "dcl/dcl",
    'nxapp/manager/ManagerBase',
    'nxapp/manager/_Drivers_Devices',
    'nxapp/utils/_LogMixin',
    "nxapp/utils/_console",
    "xide/utils",
    "nxapp/utils",
    "dojo/node!path",
    "dojo/node!fs-jetpack",
    "dojo/node!cheerio",
    "dojo/node!fs",
    "dojo/has"
], function (dcl, ManagerBase, _Drivers_Devices, _LogMixin, _console, utils, xutils, path, jet, cheerio, fs,has) {

    var console = _console;
    var debugPaths = true;

    /**
     * Common base class for protocol connections
     * @class module:nxapp/manager/ExportManager
     * @extends module:nxapp/manager/ManagerBase
     */
    return dcl([ManagerBase, _LogMixin, _Drivers_Devices], {
        declaredClass: "nxapp.manager.ExportManager",
        options: null,
        /**
         * @member {string|null} serverTemplates the path to the server templates. Defaults to
         *  this.root + 'server-template'
         */
        serverTemplates: null,
        linux32:true,
        linux64:true,
        osx:true,
        arm:true,
        windows:true,
        nginxOptions:null,
        mongoOptions:null,
        serverOptions:null,
        init: function (profile) {
            this.profile = profile;
        },
        run:function(delegate){
            this.delegate = delegate;
            this.initWithOptions(this.options);
        },
        onProgress:function(msg){
            this.delegate && this.delegate.onProgress(msg);
            console.log('Progress:  ' + msg);
        },
        onError:function(msg){
            this.delegate && this.delegate.onError(msg);
        },
        onFinish:function(msg){
            this.delegate && this.delegate.onFinish(msg);
            console.log('Finish:  ' + msg);
        },
        /**
         * @param options {module:nxapp/model/ExportOptions}
         */
        initWithOptions: function (options) {
            this.options = options;
            utils.mixin(this, options);
            this.onProgress('Export Manager: begin export',{
                progress:0
            });
            if(!this.root){
                this.onError('Export Manager: have no root');
                throw new Error('Export Manager: have no root');
            }

            if(!this.data){
                this.onError('Export Manager: have no data');
                throw new Error('Export Manager: have no data');
            }

            if(!this.user){
                this.onError('Export Manager: have no user');
                return;
            }


            if(!this.client){
                if(has('debug')) {
                    this.client = xutils.resolve(this.root + '/dist/windows/Code/client/');
                }else{
                    this.client = xutils.resolve(this.root + '/Code/client/');
                }
            }

            if (!this.serverTemplates) {
                this.serverTemplates = xutils.resolve(this.root + '/server-template');
            }

            if (!this.dist) {
                this.dist = xutils.resolve(this.root + '/dist/all/server/');
            }

            debugPaths && console.log('export with \n', utils.inspect({
                "System Data": this.data,
                "User Data": this.user +' = ' +path.resolve(this.user),
                "Root": path.resolve(this.root),
                "Server-Templates": this.serverTemplates,
                "Target": path.resolve(this.target),
                "Node Servers": path.resolve(this.dist),
                "Client": this.client,
                "Export Windows":this.windows,
                "Export Linux - 32 ":this.linux32,
                "Export Linux - 64 ":this.linux64,
                "Export OSX":this.osx,
                "Export ARM":this.arm
            }));

            var NGINX_OPTIONS = utils.mixin({
                port: 8889,
                templatePath: xutils.resolve(this.serverTemplates + '/nginx/all/conf/nginx.app.template.conf')
            },this.nginxOptions);

            var serverOptions = utils.mixin({
                port: 9997,
                mongo_port: 27018,
                mqtt_port: 1884
            },this.serverOptions);

            var all = true;
            if (all) {
                this.exportNGINX(NGINX_OPTIONS);
                var MONGO_OPTIONS = this.mongoOptions || {};
                this.exportMongo(MONGO_OPTIONS);
                this.createDirectoryLayout();

                this.exportServer();

                this.onProgress('Exported Servers',{
                    progress:0.2
                });

                this.exportUser();

                this.onProgress('Exported User',{
                    progress:0.3
                });

                this.exportSystem();
                this.onProgress('Exported System Data',{
                    progress:0.4
                });
                this.exportMisc(serverOptions);
                this.onProgress('Exported Misc Data',{
                    progress:0.5
                });
                this.exportHTML(serverOptions);
                this.onProgress('Exported User Workspace HTML',{
                    progress:0.6
                });
                this.exportDevices({serverSide: true});
                this.onProgress('Exported Devices',{
                    progress:0.7
                });
                this.exportDrivers({});
                this.onProgress('Exported Drivers',{
                    progress:0.8
                });
                if(this.client){
                    this.exportClientEx();
                }else {
                    if (has('debug')) {
                        this.exportClient();
                    } else {
                        this.exportClientDist();
                    }
                }

                this.onProgress('Exported Client Application Assets',{
                    progress:0.9
                });
                console.log('Export Done! Your application can be found at '+this.target);

                this.onProgress('Export Done',{
                    progress:1.2
                });

                this.onFinish('Export Done! Your application can be found at '+this.target);

            } else {
                this.exportHTML(serverOptions);
            }
        },
        exportHTML: function (options) {

            var source = jet.dir(this.target + '/www/user/workspace/');
            var thiz = this;

            function parseDirectory(_path, name) {
                //name = directory abs

                var dirItems = fs.readdirSync(_path);
                if (dirItems.length) {
                    _.each(dirItems, function (file) {
                        //file = file name
                        if (file.indexOf('.dhtml') !== -1) {
                            var root = name.replace(source.path() + '/', '');
                            thiz.exportHTMLFile2(_path + '/' + file, root, options);
                        }
                    });
                }
            }

            function _walk(dir) {
                var results = [];

                if (fs.existsSync(dir)) {

                    var list = fs.readdirSync(dir);

                    list.forEach(function (file) {
                        file = dir + '/' + file;
                        var stat = fs.statSync(file);
                        if (stat) {
                            var root = file.replace(path + '/', '');
                            if (stat.isDirectory()) {
                                parseDirectory(file, root);
                            } else {
                                if (file.indexOf('.dhtml') !== -1) {
                                    root = root.replace(dir + '/', '');
                                    thiz.exportHTMLFile2(file, root, options);
                                }

                            }
                        } else {
                            console.error('cant get stat for ' + file);
                        }
                    });
                } else {
                    console.error('device path ' + dir + ' doesnt exists');
                }
                return results;
            }

            _walk(source.path());

        },
        exportHTMLFile2: function (file, folder, options) {

            var exportRoot = jet.dir(this.root + '/export/');
            var template = utils.readFile(path.resolve(exportRoot.path() + '/app.template.html'));
            var path_parts = utils.pathinfo(file);
            if (folder === path_parts.basename) {
                folder = "";
            }

            var templateVariables = utils.mixin({
                libRoot: '/Code/client/src/lib',
                lodashUrl: '/Code/client/src/lib/external/lodash.min.js',
                requireBaseUrl: "/Code/client/src/lib/xibm/ibm",
                jQueryUrl: "/Code/client/src/lib/external/jquery-1.9.1.min.js",
                data: "",
                user: "/user",
                css: './' + utils.cleanUrl(path_parts.filename + ".css"),
                theme: "bootstrap",
                blox_file: "./" + folder + '/' + path_parts.filename + ".xblox",
                scene_file: "./" + folder + '/' + path_parts.filename + ".dhtml",
                mount: "workspace",
                "VFS_VARS": JSON.stringify({
                    "user_drivers": './www/user/drivers',
                    "system_drivers": './www/system/drivers'
                }, null, 2)
            }, options);

            template = utils.replace(template, null, templateVariables, {
                begin: '%',
                end: '%'
            });
            var content = utils.readFile(file);
            content = content.replace('<viewHeaderTemplate/>', template);
            content = content.replace(/\burl\s*\(\s*["']?([^"'\r\n\)\(]+)["']?\s*\)/gi,
                function (matchstr, parens) {
                    var parts = parens.split('://');
                    var mount = parts[0];
                    var path  = parts[1];
                    if(mount && path) {
                        return "url('./" + path + "')";
                    }
                    return parens;
                }
            );

            var dom = cheerio.load(content);
            var extra = '\n<script type="text/javascript">';
            extra += '\n\tvar test = 0;';
            extra += '\n</script>';
            dom('HEAD').append(dom(extra));
            utils.writeFile(file.replace('.dhtml', '.html'), dom.html());
        },
        exportHTMLFile: function (options) {
            var exportRoot = jet.dir(this.root + '/export/');
            var source = jet.dir(this.target + '/www/user/workspace/');
            var file = path.resolve(source.path() + '/ascene.dhtml');
            var template = utils.readFile(path.resolve(exportRoot.path() + '/app.template.html'));
            var templateVariables = utils.mixin({
                libRoot: '/Code/client/src/lib',
                lodashUrl: '/Code/client/src/lib/external/lodash.min.js',
                requireBaseUrl: "/Code/client/src/lib/xibm/ibm",
                jQueryUrl: "/Code/client/src/lib/external/jquery-1.9.1.min.js",
                data: "",
                user: "/user",
                css: "./ascene.css",
                theme: "bootstrap",
                blox_file: "./ascene.xblox",
                mount: "workspace",
                "VFS_VARS": JSON.stringify({
                    "user_drivers": './www/user/drivers',
                    "system_drivers": './www/system/drivers'
                }, null, 2)
            }, options);

            template = utils.replace(template, null, templateVariables, {
                begin: '%',
                end: '%'
            });
            var content = utils.readFile(file);
            content = content.replace('<viewHeaderTemplate/>', template);
            var did = false;
            content = content.replace(/\burl\s*\(\s*["']?([^"'\r\n\)\(]+)["']?\s*\)/gi,
                function (matchstr, parens) {
                    var parts = parens.split('://');
                    var mount = parts[0];
                    var path  = parts[1];
                    if(mount && path) {
                        console.error('----'+path);
                        did = true;
                        return "url('./" + path + "')";
                    }
                    return parens;
                }
            );
            
            
            var dom = cheerio.load(content);
            var extra = '\n<script type="text/javascript">';
            extra += '\n\tvar test = 0;';
            extra += '\n</script>';

            dom('HEAD').append(dom(extra));

            utils.writeFile(file.replace('.dhtml', '.html'), dom.html());
        },
        exportDevices: function (options) {
            var user_devices_path = path.resolve(this.target + '/www/user/devices');
            var devices = this.getDevices(user_devices_path, 'user_devices', options);

            utils.writeFile(user_devices_path + '/user_devices.json', JSON.stringify({
                items: devices
            }, null, 2));

            var system_devices_path = path.resolve(this.target + '/www/system/devices');
            devices = this.getDevices(system_devices_path, 'system_devices', options);
            utils.writeFile(system_devices_path + '/system_devices.json', JSON.stringify({
                    items: devices
                }, null, 2));
        },
        exportDrivers: function (options) {

            var user_drivers_path = path.resolve(this.target + '/www/user/drivers');
            var drivers = this.getDrivers(user_drivers_path, 'user_drivers');
            utils.writeFile(user_drivers_path + '/user_drivers.json', JSON.stringify({
                items: drivers
            }, null, 2));

            var system_drivers_path = path.resolve(this.target + '/www/system/drivers');
            drivers = this.getDrivers(system_drivers_path, 'system_drivers');
            utils.writeFile(system_drivers_path + '/system_drivers.json', JSON.stringify({
                items: drivers
            }, null, 2));
        },
        exportMisc: function (options) {
            var source = jet.dir(this.root + '/export');
            var target = jet.dir(this.target);
            jet.copy(source.path(), target.path(), {
                matching: [
                    '**'
                ],
                overwrite: true
            });

            /**
             * update config
             */
            var template = xutils.readFile(path.resolve(source.path() + '/profile_device_server.json'));
            var content = utils.replace(template, null, options, {
                begin: '%',
                end: '%'
            });


            this.linux32 !=='false' && jet.exists(target.path() + path.sep + '/server/linux_32/nxappmain/profile_device_server.json') && utils.writeFile(target.path() + path.sep + '/server/linux_32/nxappmain/profile_device_server.json', content);
            this.linux64 !=='false' && jet.exists(target.path() + path.sep + '/server/linux_64/nxappmain/profile_device_server.json') && utils.writeFile(target.path() + path.sep + '/server/linux_64/nxappmain/profile_device_server.json', content);
            this.windows !=='false' && jet.exists(target.path() + path.sep + '/server/windows/nxappmain/profile_device_server.json') && this.windows !=='false' && utils.writeFile(target.path() + path.sep + '/server/windows/nxappmain/profile_device_server.json', content);
            this.arm !=='false' && jet.exists(target.path() + path.sep + '/server/arm/nxappmain/profile_device_server.json') && utils.writeFile(target.path() + path.sep + '/server/arm/nxappmain/profile_device_server.json', content);
            this.osx !=='false' && jet.exists(target.path() + path.sep + '/server/osx_64/nxappmain/profile_device_server.json') && utils.writeFile(target.path() + path.sep + '/server/osx_64/nxappmain/profile_device_server.json', content);


            /**
             * update boot start.js
             */
            template = xutils.readFile(path.resolve(source.path() + '/start.js'));
            content = utils.replace(template, null, options, {
                begin: '%',
                end: '%'
            });

            this.linux32 !=='false' && jet.exists(target.path() + '/server/linux_32/start.js') && utils.writeFile(target.path() + '/server/linux_32/start.js', content);
            this.linux64 !=='false' && jet.exists(target.path() + '/server/linux_64/start.js') && utils.writeFile(target.path() + '/server/linux_64/start.js', content);
            this.windows !=='false' && utils.writeFile(target.path() + '/server/windows/start.js', content);
            this.arm !=='false' && jet.exists(target.path() + '/server/arm/start.js') && utils.writeFile(target.path() + '/server/arm/start.js', content);
            this.osx !=='false' && jet.exists(target.path() + '/server/osx_64/start.js') && utils.writeFile(target.path() + '/server/osx_64/start.js', content);

        },
        exportClientEx: function () {
            var source = jet.dir(path.resolve(this.client) + '');
            var target = jet.dir(this.target + '/www/Code/client');
            jet.copy(source.path(), target.path(), {
                matching: [
                    '**'
                ],
                overwrite: true
            });
        },
        exportClient: function () {
            var source = jet.dir(this.root + '/Code/client');
            var target = jet.dir(this.target + '/www/Code/client');
            jet.copy(source.path(), target.path(), {
                matching: [
                    '**'
                ],
                overwrite: true
            });
        },
        exportClientDist: function () {
            var source = jet.dir(this.root + '/dist/all/Code/client/');
            var target = jet.dir(this.target + '/www/Code/client');
            jet.copy(source.path(), target.path(), {
                matching: [
                    '**'
                ],
                overwrite: true
            });
        },
        exportUser: function () {

            var source = jet.dir(this.user);
            var target = jet.dir(this.target + '/www/user');

            console.log('export user from ' + source.path() + ' to ' + target.path() );

            try {
                jet.copy(source.path(), target.path(), {
                    matching: [
                        '**',
                        '!./.git/**/*',
                        '!**/**claycenter',
                        '!./claycenter',
                        '!**claycenter'

                    ],
                    overwrite: true
                });
            } catch (err) {
                if (err.code === 'EEXIST') {
                    console.error('Error copying, file exists!', err);
                }

                if (err.code === 'EACCES') {
                    console.error('Error copying, file access perrmissions!', err);
                }
                console.error('error : ',err);
            }
        },
        exportSystem: function () {
            var source = jet.dir(this.data + '/system');
            var target = jet.dir(this.target + '/www/system');
            jet.copy(source.path(), target.path(), {
                matching: [
                    '**'
                ],
                overwrite: true
            });
        },
        clean: function () {
            var dir = 'leveldown';
            var files = ['*.lib', '*.pdb'];
        },
        copyServer: function (platform) {
            var target = jet.dir(this.target + '/server/' + platform);
            var isDebug = false;
            var source = "";
            if (this.dist) {
                if(!jet.exists(this.dist + '/' + platform)){
                    return;
                }
                source = jet.dir(this.dist + '/' + platform);
            } else {
                if (!isDebug) {
                    source = jet.dir(this.root + '/server/' + platform);
                } else {
                    source = jet.dir(this.root + '/server/nodejs/dist/' + platform);
                }
            }

            if(!jet.exists(source.path())){
                return;
            }
            console.info('export Device-Server ' + platform + ' from : ' + source.path());
            try {

                jet.copy(source.path(), target.path(), {
                    matching: [
                        '**'
                    ],
                    overwrite: true
                });
            } catch (err) {
                if (err.code === 'EEXIST') {
                    console.error('Error copying, file exists!', err);
                }
                if (err.code === 'EACCES') {
                    console.error('Error copying, file access perrmissions!', err);
                }
            }
        },
        exportServer: function (options) {
            this.windows !=='false' && this.copyServer('windows');
            this.linux32 !=='false' && this.copyServer('linux_32');
            this.linux64 !=='false' && this.copyServer('linux_64');
            this.arm !=='false' && this.copyServer('arm');
            this.osx !=='false' && this.copyServer('osx_64');
        },
        /**
         * Create the default directory layout
         */
        createDirectoryLayout: function () {
            jet.dir(this.target + '/data/_MONGO');
            jet.dir(this.target + '/www/');
            jet.dir(this.target + '/nginx/logs');
        },
        /**
         *
         * @param options
         */
        exportMongo: function (options) {
            /**
             * copy nginx
             */
            var source = jet.dir(this.serverTemplates + '/mongo');
            var target = jet.dir(this.target + '/mongo');

            jet.copy(source.path(), target.path(), {
                matching: [
                    'mongod-arm',
                    'mongod-linux_32',
                    'mongod-linux_64',
                    'mongod-windows.exe',
                    'mongod-32.exe',
                    'mongod-osx'
                ],
                overwrite: true
            });
        },
        /**
         * @param options {object}
         * @param options.port {int|string} The port nginx will listen
         * @param options.templatePath {string} Path to the NGINX conf template
         */
        exportNGINX: function (options) {
            /**
             * copy nginx
             */
            var source = jet.dir(this.serverTemplates + '/nginx');
            var target = jet.dir(this.target + '/nginx');

            try {
                jet.copy(source.path(), target.path(), {
                    matching: [
                        'nginx-arm',
                        'nginx-linux_32',
                        'nginx-linux_64',
                        'nginx-windows.exe',
                        'nginx-osx',
                        'msvcr110.dll'
                    ],

                    overwrite: true
                });
            } catch (err) {

                if (err.code === 'EEXIST') {
                    console.error('Error copying, file exists!', err);
                }

                if (err.code === 'EACCES') {
                    console.error('Error copying, file access perrmissions!', err);
                }

                if (err.code === 'ETXTBSY') {
                    console.error('Error copying, file is busy', err);
                }
            }


            /**
             * Copy meta files
             */
            source = jet.dir(this.serverTemplates + '/nginx/all/conf');
            target = jet.dir(this.target + '/nginx');

            jet.copy(source.path(), target.path(), {
                overwrite: true
            });

            source = jet.dir(this.serverTemplates + '/nginx/temp');
            target = jet.dir(this.target + '/nginx/temp');
            jet.copy(source.path(), target.path(), {
                overwrite: true
            });


            /**
             * create config
             */
            var template = xutils.readFile(options.templatePath);
            var content = utils.replace(template, null, options, {
                begin: '%%',
                end: '%%'
            });
            source = jet.dir(this.serverTemplates + '/nginx/all/conf');
            target = jet.dir(this.target + '/nginx/');
            utils.writeFile(target.path() + path.sep + 'nginx.conf', content);
        }
    });
});