/*
	DronaHQ Native Container SDK - v6.3.1
*/

;
(function () {

    var DronaHQ = {};

    //Check device type
    DronaHQ.onIos = /(iPad|iPhone|iPod)/i.test(window.navigator.userAgent);
    DronaHQ.onAndroid = /Android/i.test(window.navigator.userAgent);
    DronaHQ.onBlackBerry = /(BlackBerry|BB10)/i.test(window.navigator.userAgent);
    DronaHQ.onWindowsPhone = /Windows Phone/i.test(window.navigator.userAgent);

    DronaHQ.IsReady = false;
    DronaHQ.plugins = {
        camera: true,
        device: true,
        inappbrowser: true,
        dronahq: true,
        file: true,
        filetransfer: true,
        geo: false, //We only need this on iOS,
        sqlite: true,
        keyboard: false,
        kvstorage: true,
        localnotification: true,
        calendar: false
    };

    /*jshint -W079 */
    /*jshint -W020 */
    var require,
        define;

    (function () {
        var modules = {},
            // Stack of moduleIds currently being built.
            requireStack = [],
            // Map of module ID -> index into requireStack of modules currently being built.
            inProgressModules = {},
            SEPARATOR = ".";



        function build(module) {
            var factory = module.factory,
                localRequire = function (id) {
                    var resultantId = id;
                    //Its a relative path, so lop off the last portion and add the id (minus "./")
                    if (id.charAt(0) === ".") {
                        resultantId = module.id.slice(0, module.id.lastIndexOf(SEPARATOR)) + SEPARATOR + id.slice(2);
                    }
                    return require(resultantId);
                };
            module.exports = {};
            delete module.factory;
            factory(localRequire, module.exports, module);
            return module.exports;
        }

        require = function (id) {
            if (!modules[id]) {
                throw "module " + id + " not found";
            } else if (id in inProgressModules) {
                var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
                throw "Cycle in require graph: " + cycle;
            }
            if (modules[id].factory) {
                try {
                    inProgressModules[id] = requireStack.length;
                    requireStack.push(id);
                    return build(modules[id]);
                } finally {
                    delete inProgressModules[id];
                    requireStack.pop();
                }
            }
            return modules[id].exports;
        };

        define = function (id, factory) {
            if (modules[id]) {
                throw "module " + id + " already defined";
            }

            modules[id] = {
                id: id,
                factory: factory
            };
        };

        define.remove = function (id) {
            delete modules[id];
        };

        define.moduleMap = modules;
    })();

    //Export for use in node
    if (typeof module === "object" && typeof require === "function") {
        module.exports.require = require;
        module.exports.define = define;
    }

    var _fnCordovaPlugins = function () {
        //Device
        cordova.define("cordova-plugin-device.device", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            channel.createSticky('onCordovaInfoReady');
            // Tell cordova channel to wait on the CordovaInfoReady event
            channel.waitForInitialization('onCordovaInfoReady');

            /**
             * This represents the mobile device, and provides properties for inspecting the model, version, UUID of the
             * phone, etc.
             * @constructor
             */
            function Device() {
                this.available = false;
                this.platform = null;
                this.version = null;
                this.uuid = null;
                this.cordova = null;
                this.model = null;
                this.manufacturer = null;

                var me = this;

                channel.onCordovaReady.subscribe(function () {
                    me.getInfo(function (info) {
                        //ignoring info.cordova returning from native, we should use value from cordova.version defined in cordova.js
                        //TODO: CB-5105 native implementations should not return info.cordova
                        var buildLabel = cordova.version;
                        me.available = true;
                        me.platform = info.platform;
                        me.version = info.version;
                        me.uuid = info.uuid;
                        me.cordova = buildLabel;
                        me.model = info.model;
                        me.manufacturer = info.manufacturer || 'unknown';
                        channel.onCordovaInfoReady.fire();
                    }, function (e) {
                        me.available = false;
                        utils.alert("[ERROR] Error initializing Cordova: " + e);
                    });
                });
            }

            /**
             * Get device info
             *
             * @param {Function} successCallback The function to call when the heading data is available
             * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
             */
            Device.prototype.getInfo = function (successCallback, errorCallback) {
                argscheck.checkArgs('fF', 'Device.getInfo', arguments);
                exec(successCallback, errorCallback, "Device", "getDeviceInfo", []);
            };

            module.exports = new Device();

        });

        //Camera
        cordova.define("cordova-plugin-camera.camera", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                exec = require('cordova/exec'),
                Camera = require('./Camera');
            // XXX: commented out
            //CameraPopoverHandle = require('./CameraPopoverHandle');

            var cameraExport = {};

            // Tack on the Camera Constants to the base camera plugin.
            for (var key in Camera) {
                cameraExport[key] = Camera[key];
            }

            /**
             * Gets a picture from source defined by "options.sourceType", and returns the
             * image as defined by the "options.destinationType" option.
      
             * The defaults are sourceType=CAMERA and destinationType=FILE_URI.
             *
             * @param {Function} successCallback
             * @param {Function} errorCallback
             * @param {Object} options
             */
            cameraExport.getPicture = function (successCallback, errorCallback, options) {
                argscheck.checkArgs('fFO', 'Camera.getPicture', arguments);
                options = options || {};
                var getValue = argscheck.getValue;

                var quality = getValue(options.quality, 50);
                var destinationType = getValue(options.destinationType, Camera.DestinationType.FILE_URI);
                var sourceType = getValue(options.sourceType, Camera.PictureSourceType.CAMERA);
                var targetWidth = getValue(options.targetWidth, -1);
                var targetHeight = getValue(options.targetHeight, -1);
                var encodingType = getValue(options.encodingType, Camera.EncodingType.JPEG);
                var mediaType = getValue(options.mediaType, Camera.MediaType.PICTURE);
                var allowEdit = !!options.allowEdit;
                var correctOrientation = !!options.correctOrientation;
                var saveToPhotoAlbum = !!options.saveToPhotoAlbum;
                var popoverOptions = getValue(options.popoverOptions, null);
                var cameraDirection = getValue(options.cameraDirection, Camera.Direction.BACK);

                var args = [quality, destinationType, sourceType, targetWidth, targetHeight, encodingType,
                    mediaType, allowEdit, correctOrientation, saveToPhotoAlbum, popoverOptions, cameraDirection
                ];

                exec(successCallback, errorCallback, "Camera", "takePicture", args);
                // XXX: commented out
                //return new CameraPopoverHandle();
            };

            cameraExport.cleanup = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "Camera", "cleanup", []);
            };

            module.exports = cameraExport;

        });
        cordova.define("cordova-plugin-camera.Camera", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            module.exports = {
                DestinationType: {
                    DATA_URL: 0, // Return base64 encoded string
                    FILE_URI: 1, // Return file uri (content://media/external/images/media/2 for Android)
                    NATIVE_URI: 2 // Return native uri (eg. asset-library://... for iOS)
                },
                EncodingType: {
                    JPEG: 0, // Return JPEG encoded image
                    PNG: 1 // Return PNG encoded image
                },
                MediaType: {
                    PICTURE: 0, // allow selection of still pictures only. DEFAULT. Will return format specified via DestinationType
                    VIDEO: 1, // allow selection of video only, ONLY RETURNS URL
                    ALLMEDIA: 2 // allow selection from all media types
                },
                PictureSourceType: {
                    PHOTOLIBRARY: 0, // Choose image from picture library (same as SAVEDPHOTOALBUM for Android)
                    CAMERA: 1, // Take picture from camera
                    SAVEDPHOTOALBUM: 2 // Choose image from picture library (same as PHOTOLIBRARY for Android)
                },
                PopoverArrowDirection: {
                    ARROW_UP: 1, // matches iOS UIPopoverArrowDirection constants to specify arrow location on popover
                    ARROW_DOWN: 2,
                    ARROW_LEFT: 4,
                    ARROW_RIGHT: 8,
                    ARROW_ANY: 15
                },
                Direction: {
                    BACK: 0,
                    FRONT: 1
                }
            };

        });
        cordova.define("cordova-plugin-camera.CameraPopoverHandle", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec');

            /**
             * A handle to an image picker popover.
             */
            var CameraPopoverHandle = function () {
                this.setPosition = function (popoverOptions) {
                    console.log('CameraPopoverHandle.setPosition is only supported on iOS.');
                };
            };

            module.exports = CameraPopoverHandle;

        });
        cordova.define("cordova-plugin-camera.CameraPopoverOptions", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var Camera = require('./Camera');

            /**
             * Encapsulates options for iOS Popover image picker
             */
            var CameraPopoverOptions = function (x, y, width, height, arrowDir) {
                // information of rectangle that popover should be anchored to
                this.x = x || 0;
                this.y = y || 32;
                this.width = width || 320;
                this.height = height || 480;
                // The direction of the popover arrow
                this.arrowDir = arrowDir || Camera.PopoverArrowDirection.ARROW_ANY;
            };

            module.exports = CameraPopoverOptions;

        });

        //InAppBrowser
        cordova.define("cordova-plugin-inappbrowser.inappbrowser", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec');
            var channel = require('cordova/channel');
            var modulemapper = require('cordova/modulemapper');
            var urlutil = require('cordova/urlutil');

            function InAppBrowser() {
                this.channels = {
                    'loadstart': channel.create('loadstart'),
                    'loadstop': channel.create('loadstop'),
                    'loaderror': channel.create('loaderror'),
                    'exit': channel.create('exit')
                };
            }

            InAppBrowser.prototype = {
                _eventHandler: function (event) {
                    if (event && (event.type in this.channels)) {
                        this.channels[event.type].fire(event);
                    }
                },
                close: function (eventname) {
                    exec(null, null, "InAppBrowser", "close", []);
                },
                show: function (eventname) {
                    exec(null, null, "InAppBrowser", "show", []);
                },
                addEventListener: function (eventname, f) {
                    if (eventname in this.channels) {
                        this.channels[eventname].subscribe(f);
                    }
                },
                removeEventListener: function (eventname, f) {
                    if (eventname in this.channels) {
                        this.channels[eventname].unsubscribe(f);
                    }
                },

                executeScript: function (injectDetails, cb) {
                    if (injectDetails.code) {
                        exec(cb, null, "InAppBrowser", "injectScriptCode", [injectDetails.code, !!cb]);
                    } else if (injectDetails.file) {
                        exec(cb, null, "InAppBrowser", "injectScriptFile", [injectDetails.file, !!cb]);
                    } else {
                        throw new Error('executeScript requires exactly one of code or file to be specified');
                    }
                },

                insertCSS: function (injectDetails, cb) {
                    if (injectDetails.code) {
                        exec(cb, null, "InAppBrowser", "injectStyleCode", [injectDetails.code, !!cb]);
                    } else if (injectDetails.file) {
                        exec(cb, null, "InAppBrowser", "injectStyleFile", [injectDetails.file, !!cb]);
                    } else {
                        throw new Error('insertCSS requires exactly one of code or file to be specified');
                    }
                }
            };

            module.exports = function (strUrl, strWindowName, strWindowFeatures, callbacks) {
                // Don't catch calls that write to existing frames (e.g. named iframes).
                if (window.frames && window.frames[strWindowName]) {
                    var origOpenFunc = modulemapper.getOriginalSymbol(window, 'open');
                    return origOpenFunc.apply(window, arguments);
                }

                strUrl = urlutil.makeAbsolute(strUrl);
                var iab = new InAppBrowser();

                callbacks = callbacks || {};
                for (var callbackName in callbacks) {
                    iab.addEventListener(callbackName, callbacks[callbackName]);
                }

                var cb = function (eventname) {
                    iab._eventHandler(eventname);
                };

                strWindowFeatures = strWindowFeatures || "";

                exec(cb, cb, "InAppBrowser", "open", [strUrl, strWindowName, strWindowFeatures]);
                return iab;
            };


        });

        //DronaHQ User
        cordova.define("cordova-plugin-dronahq.user", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            function User() { };

            /**
             * Get user info
             *
             * @param {Function} successCallback The function to call when the heading data is available
             * @param {Function} errorCallback The function to call when there is an error getting the heading data. (OPTIONAL)
             */
            User.prototype.getProfile = function (successCallback, errorCallback) {
                argscheck.checkArgs('fF', 'DronaHQ.getProfile', arguments);
                exec(successCallback, errorCallback, "DronaHQ", "getUserProfile", []);
            };

            module.exports = new User();

        });

        //DronaHQ Notification
        cordova.define("cordova-plugin-dronahq.notification", function (require, exports, module) {
            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            function Notification() { };

            Notification.prototype.getNotification = function (notiId, successCallback, errorCallback) {
                argscheck.checkArgs('sfF', 'DronaHQ.getNotification', arguments);
                exec(successCallback, errorCallback, "DronaHQ", "getNotification", [notiId]);
            };

            Notification.prototype.getAllNotification = function (successCallback, errorCallback) {
                argscheck.checkArgs('fF', 'DronaHQ.getNotification', arguments);
                exec(successCallback, errorCallback, "DronaHQ", "getAllNotification", []);
            };

            module.exports = new Notification();
        });

        //DronaHQ App
        cordova.define("cordova-plugin-dronahq.app", function (require, exports, module) {
            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            function App() { };

            App.prototype.navigate = function (objNavigate) {
                argscheck.checkArgs('o', 'DronaHQ.navigate()', arguments);

                var destination = objNavigate.dest || '';
                var destId = objNavigate.dest_id || '0';
                var folderCatId = objNavigate.folder_id || '0';
                var destType = objNavigate.dest_type || '';

                var args = [destination, destId, destType, folderCatId];

                exec(null, null, "DronaHQ", "navigation", args);
            };

            App.prototype.exitApp = function () {
                exec(null, null, "DronaHQ", "exitApp", []);
            };

            App.prototype.getHomeScreen = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "DronaHQ", "getHomeScreenIcons", []);
            }

            App.prototype.getMeta = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "DronaHQ", "getApplicationDetails", []);
            }

            App.prototype.getApp = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "DHQApp", "getAppDetails", []);
            }

            App.prototype.setRating = function (successCallback, errorCallback, appRating) {
                exec(successCallback, errorCallback, "DHQApp", "setAppRating", [appRating]);
            }

            App.prototype.setAsFav = function (successCallback, errorCallback, isFav) {
                exec(successCallback, errorCallback, "DHQApp", "setAppAsFav", [isFav]);
            }

            App.prototype.getFeedback = function (successCallback, errorCallback, maxId, resultSize) {
                exec(successCallback, errorCallback, "DHQApp", "getAppFeedbackList", [maxId, resultSize]);
            }

            App.prototype.setFeedback = function (successCallback, errorCallback, feedbackText) {
                exec(successCallback, errorCallback, "DHQApp", "setAppFeedback", [feedbackText]);
            }

            App.prototype.handleMedia = function (successCallback, errorCallback, mediaUrl, mediaType, options) {
                exec(successCallback, errorCallback, "DronaHQ", "handleMedia", [mediaUrl, mediaType]);
            }

            module.exports = new App();
        });

        //DronaHQ Sync
        cordova.define("cordova-plugin-dronahq.sync", function (require, exports, module) {

            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            //Add custom document events
            cordova.addDocumentEventHandler('dronahq.sync.uploadcomplete'); //All uploads complete            

            function Sync() { };

            Sync.prototype.download = function (remoteUrl, saveUrl, successCallback, errorCallback) {
                exec(successCallback, errorCallback, "DronaHQ", "downloadSync", [remoteUrl, saveUrl]);
            };

            Sync.prototype.upload = function (remoteUrl, requestMethod, requestData, imageLocalPath, options, successCallback, errorCallback) {
                imageLocalPath = imageLocalPath || '';

                var reqHeader = [];
                var timeout = 0;
                if (options) {
                    reqHeader = options.header || [];
                    timeout = options.timeout || 0;
                }

                exec(successCallback, errorCallback, "DronaHQ", "uploadRequest", [remoteUrl, requestMethod, requestData, imageLocalPath, reqHeader, timeout]);
            };

            Sync.prototype.refresh = function (refreshType) {
                refreshType = refreshType || '';
                exec(null, null, "DronaHQ", "triggerSync", [refreshType]);
            }

            Sync.prototype.getPendingUploadCount = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "DronaHQ", "getPendingUploadCount", []);
            };

            module.exports = new Sync();
        });

        //DronaHQ KVStore
        cordova.define("cordova-plugin-dronahq.kvstore", function (require, exports, module) {
            var argscheck = require('cordova/argscheck'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                cordova = require('cordova');

            function KVStore() { };

            KVStore.prototype.getItem = function (keyName, fnSuccess, fnError) {
                argscheck.checkArgs('sFF', 'KVStore.getItem', arguments);
                exec(fnSuccess, fnError, "DHQStorage", "get", [keyName]);
            };

            KVStore.prototype.setItem = function (keyName, keyValue, fnSuccess, fnError, options) {
                argscheck.checkArgs('sSFFO', 'KVStore.setItem', arguments);

                var isGlobal = 0;
                if (options) {
                    isGlobal = options.global || 0;
                }

                exec(fnSuccess, fnError, "DHQStorage", "set", [keyName, keyValue, isGlobal]);
            };

            KVStore.prototype.removeItem = function (keyName, fnSuccess, fnError) {
                argscheck.checkArgs('sFF', 'KVStore.removeItem', arguments);
                exec(fnSuccess, fnError, "DHQStorage", "remove", [keyName]);
            };

            KVStore.prototype.clear = function (fnSuccess, fnError) {
                argscheck.checkArgs('fF', 'KVStore.clear', arguments);
                exec(fnSuccess, fnError, "DHQStorage", "clearAll", []);
            };

            module.exports = new KVStore();
        });

        //File
        cordova.define("cordova-plugin-file.androidFileSystem", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            FILESYSTEM_PROTOCOL = "cdvfile";

            module.exports = {
                __format__: function (fullPath, nativeUrl) {
                    var path = '/' + this.name + '/' + encodeURI(fullPath);
                    path = path.replace('//', '/');
                    var ret = FILESYSTEM_PROTOCOL + '://localhost' + path;
                    var m = /\?.*/.exec(nativeUrl);
                    if (m) {
                        ret += m[0];
                    }
                    return ret;
                }
            };


        });
        cordova.define("cordova-plugin-file.iosFileSystem", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            FILESYSTEM_PROTOCOL = "cdvfile";

            module.exports = {
                __format__: function (fullPath) {
                    var path = ('/' + this.name + (fullPath[0] === '/' ? '' : '/') + encodeURI(fullPath)).replace('//', '/');
                    return FILESYSTEM_PROTOCOL + '://localhost' + path;
                }
            };
        });
        cordova.define("cordova-plugin-file.DirectoryEntry", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                Entry = require('./Entry'),
                FileError = require('./FileError'),
                DirectoryReader = require('./DirectoryReader');

            /**
             * An interface representing a directory on the file system.
             *
             * {boolean} isFile always false (readonly)
             * {boolean} isDirectory always true (readonly)
             * {DOMString} name of the directory, excluding the path leading to it (readonly)
             * {DOMString} fullPath the absolute full path to the directory (readonly)
             * {FileSystem} filesystem on which the directory resides (readonly)
             */
            var DirectoryEntry = function (name, fullPath, fileSystem, nativeURL) {

                // add trailing slash if it is missing
                if ((fullPath) && !/\/$/.test(fullPath)) {
                    fullPath += "/";
                }
                // add trailing slash if it is missing
                if (nativeURL && !/\/$/.test(nativeURL)) {
                    nativeURL += "/";
                }
                DirectoryEntry.__super__.constructor.call(this, false, true, name, fullPath, fileSystem, nativeURL);
            };

            utils.extend(DirectoryEntry, Entry);

            /**
             * Creates a new DirectoryReader to read entries from this directory
             */
            DirectoryEntry.prototype.createReader = function () {
                return new DirectoryReader(this.toInternalURL());
            };

            /**
             * Creates or looks up a directory
             *
             * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a directory
             * @param {Flags} options to create or exclusively create the directory
             * @param {Function} successCallback is called with the new entry
             * @param {Function} errorCallback is called with a FileError
             */
            DirectoryEntry.prototype.getDirectory = function (path, options, successCallback, errorCallback) {
                argscheck.checkArgs('sOFF', 'DirectoryEntry.getDirectory', arguments);
                var fs = this.filesystem;
                var win = successCallback && function (result) {
                    var entry = new DirectoryEntry(result.name, result.fullPath, fs, result.nativeURL);
                    successCallback(entry);
                };
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(win, fail, "File", "getDirectory", [this.toInternalURL(), path, options]);
            };

            /**
             * Deletes a directory and all of it's contents
             *
             * @param {Function} successCallback is called with no parameters
             * @param {Function} errorCallback is called with a FileError
             */
            DirectoryEntry.prototype.removeRecursively = function (successCallback, errorCallback) {
                argscheck.checkArgs('FF', 'DirectoryEntry.removeRecursively', arguments);
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(successCallback, fail, "File", "removeRecursively", [this.toInternalURL()]);
            };

            /**
             * Creates or looks up a file
             *
             * @param {DOMString} path either a relative or absolute path from this directory in which to look up or create a file
             * @param {Flags} options to create or exclusively create the file
             * @param {Function} successCallback is called with the new entry
             * @param {Function} errorCallback is called with a FileError
             */
            DirectoryEntry.prototype.getFile = function (path, options, successCallback, errorCallback) {
                argscheck.checkArgs('sOFF', 'DirectoryEntry.getFile', arguments);
                var fs = this.filesystem;
                var win = successCallback && function (result) {
                    var FileEntry = require('./FileEntry');
                    var entry = new FileEntry(result.name, result.fullPath, fs, result.nativeURL);
                    successCallback(entry);
                };
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(win, fail, "File", "getFile", [this.toInternalURL(), path, options]);
            };

            module.exports = DirectoryEntry;

        });
        cordova.define("cordova-plugin-file.DirectoryReader", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec'),
                FileError = require('./FileError');

            /**
             * An interface that lists the files and directories in a directory.
             */
            function DirectoryReader(localURL) {
                this.localURL = localURL || null;
                this.hasReadEntries = false;
            }

            /**
             * Returns a list of entries from a directory.
             *
             * @param {Function} successCallback is called with a list of entries
             * @param {Function} errorCallback is called with a FileError
             */
            DirectoryReader.prototype.readEntries = function (successCallback, errorCallback) {
                // If we've already read and passed on this directory's entries, return an empty list.
                if (this.hasReadEntries) {
                    successCallback([]);
                    return;
                }
                var reader = this;
                var win = typeof successCallback !== 'function' ? null : function (result) {
                    var retVal = [];
                    for (var i = 0; i < result.length; i++) {
                        var entry = null;
                        if (result[i].isDirectory) {
                            entry = new (require('./DirectoryEntry'))();
                        } else if (result[i].isFile) {
                            entry = new (require('./FileEntry'))();
                        }
                        entry.isDirectory = result[i].isDirectory;
                        entry.isFile = result[i].isFile;
                        entry.name = result[i].name;
                        entry.fullPath = result[i].fullPath;
                        entry.filesystem = new (require('./FileSystem'))(result[i].filesystemName);
                        entry.nativeURL = result[i].nativeURL;
                        retVal.push(entry);
                    }
                    reader.hasReadEntries = true;
                    successCallback(retVal);
                };
                var fail = typeof errorCallback !== 'function' ? null : function (code) {
                    errorCallback(new FileError(code));
                };
                exec(win, fail, "File", "readEntries", [this.localURL]);
            };

            module.exports = DirectoryReader;

        });
        cordova.define("cordova-plugin-file.Entry", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                exec = require('cordova/exec'),
                FileError = require('./FileError'),
                Metadata = require('./Metadata');

            /**
             * Represents a file or directory on the local file system.
             *
             * @param isFile
             *            {boolean} true if Entry is a file (readonly)
             * @param isDirectory
             *            {boolean} true if Entry is a directory (readonly)
             * @param name
             *            {DOMString} name of the file or directory, excluding the path
             *            leading to it (readonly)
             * @param fullPath
             *            {DOMString} the absolute full path to the file or directory
             *            (readonly)
             * @param fileSystem
             *            {FileSystem} the filesystem on which this entry resides
             *            (readonly)
             * @param nativeURL
             *            {DOMString} an alternate URL which can be used by native
             *            webview controls, for example media players.
             *            (optional, readonly)
             */
            function Entry(isFile, isDirectory, name, fullPath, fileSystem, nativeURL) {
                this.isFile = !!isFile;
                this.isDirectory = !!isDirectory;
                this.name = name || '';
                this.fullPath = fullPath || '';
                this.filesystem = fileSystem || null;
                this.nativeURL = nativeURL || null;
            }

            /**
             * Look up the metadata of the entry.
             *
             * @param successCallback
             *            {Function} is called with a Metadata object
             * @param errorCallback
             *            {Function} is called with a FileError
             */
            Entry.prototype.getMetadata = function (successCallback, errorCallback) {
                argscheck.checkArgs('FF', 'Entry.getMetadata', arguments);
                var success = successCallback && function (entryMetadata) {
                    var metadata = new Metadata({
                        size: entryMetadata.size,
                        modificationTime: entryMetadata.lastModifiedDate
                    });
                    successCallback(metadata);
                };
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(success, fail, "File", "getFileMetadata", [this.toInternalURL()]);
            };

            /**
             * Set the metadata of the entry.
             *
             * @param successCallback
             *            {Function} is called with a Metadata object
             * @param errorCallback
             *            {Function} is called with a FileError
             * @param metadataObject
             *            {Object} keys and values to set
             */
            Entry.prototype.setMetadata = function (successCallback, errorCallback, metadataObject) {
                argscheck.checkArgs('FFO', 'Entry.setMetadata', arguments);
                exec(successCallback, errorCallback, "File", "setMetadata", [this.toInternalURL(), metadataObject]);
            };

            /**
             * Move a file or directory to a new location.
             *
             * @param parent
             *            {DirectoryEntry} the directory to which to move this entry
             * @param newName
             *            {DOMString} new name of the entry, defaults to the current name
             * @param successCallback
             *            {Function} called with the new DirectoryEntry object
             * @param errorCallback
             *            {Function} called with a FileError
             */
            Entry.prototype.moveTo = function (parent, newName, successCallback, errorCallback) {
                argscheck.checkArgs('oSFF', 'Entry.moveTo', arguments);
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                var filesystem = this.filesystem,
                    srcURL = this.toInternalURL(),
                    // entry name
                    name = newName || this.name,
                    success = function (entry) {
                        if (entry) {
                            if (successCallback) {
                                // create appropriate Entry object
                                var newFSName = entry.filesystemName || (entry.filesystem && entry.filesystem.name);
                                var fs = newFSName ? new FileSystem(newFSName, {
                                    name: "",
                                    fullPath: "/"
                                }) : new FileSystem(parent.filesystem.name, {
                                    name: "",
                                    fullPath: "/"
                                });
                                var result = (entry.isDirectory) ? new (require('./DirectoryEntry'))(entry.name, entry.fullPath, fs, entry.nativeURL) : new (require('cordova-plugin-file.FileEntry'))(entry.name, entry.fullPath, fs, entry.nativeURL);
                                successCallback(result);
                            }
                        } else {
                            // no Entry object returned
                            fail && fail(FileError.NOT_FOUND_ERR);
                        }
                    };

                // copy
                exec(success, fail, "File", "moveTo", [srcURL, parent.toInternalURL(), name]);
            };

            /**
             * Copy a directory to a different location.
             *
             * @param parent
             *            {DirectoryEntry} the directory to which to copy the entry
             * @param newName
             *            {DOMString} new name of the entry, defaults to the current name
             * @param successCallback
             *            {Function} called with the new Entry object
             * @param errorCallback
             *            {Function} called with a FileError
             */
            Entry.prototype.copyTo = function (parent, newName, successCallback, errorCallback) {
                argscheck.checkArgs('oSFF', 'Entry.copyTo', arguments);
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                var filesystem = this.filesystem,
                    srcURL = this.toInternalURL(),
                    // entry name
                    name = newName || this.name,
                    // success callback
                    success = function (entry) {
                        if (entry) {
                            if (successCallback) {
                                // create appropriate Entry object
                                var newFSName = entry.filesystemName || (entry.filesystem && entry.filesystem.name);
                                var fs = newFSName ? new FileSystem(newFSName, {
                                    name: "",
                                    fullPath: "/"
                                }) : new FileSystem(parent.filesystem.name, {
                                    name: "",
                                    fullPath: "/"
                                });
                                var result = (entry.isDirectory) ? new (require('./DirectoryEntry'))(entry.name, entry.fullPath, fs, entry.nativeURL) : new (require('cordova-plugin-file.FileEntry'))(entry.name, entry.fullPath, fs, entry.nativeURL);
                                successCallback(result);
                            }
                        } else {
                            // no Entry object returned
                            fail && fail(FileError.NOT_FOUND_ERR);
                        }
                    };

                // copy
                exec(success, fail, "File", "copyTo", [srcURL, parent.toInternalURL(), name]);
            };

            /**
             * Return a URL that can be passed across the bridge to identify this entry.
             */
            Entry.prototype.toInternalURL = function () {
                if (this.filesystem && this.filesystem.__format__) {
                    return this.filesystem.__format__(this.fullPath, this.nativeURL);
                }
            };

            /**
             * Return a URL that can be used to identify this entry.
             * Use a URL that can be used to as the src attribute of a <video> or
             * <audio> tag. If that is not possible, construct a cdvfile:// URL.
             */
            Entry.prototype.toURL = function () {
                if (this.nativeURL) {
                    return this.nativeURL;
                }
                // fullPath attribute may contain the full URL in the case that
                // toInternalURL fails.
                return this.toInternalURL() || "file://localhost" + this.fullPath;
            };

            /**
             * Backwards-compatibility: In v1.0.0 - 1.0.2, .toURL would only return a
             * cdvfile:// URL, and this method was necessary to obtain URLs usable by the
             * webview.
             * See CB-6051, CB-6106, CB-6117, CB-6152, CB-6199, CB-6201, CB-6243, CB-6249,
             * and CB-6300.
             */
            Entry.prototype.toNativeURL = function () {
                console.log("DEPRECATED: Update your code to use 'toURL'");
                return this.toURL();
            };

            /**
             * Returns a URI that can be used to identify this entry.
             *
             * @param {DOMString} mimeType for a FileEntry, the mime type to be used to interpret the file, when loaded through this URI.
             * @return uri
             */
            Entry.prototype.toURI = function (mimeType) {
                console.log("DEPRECATED: Update your code to use 'toURL'");
                return this.toURL();
            };

            /**
             * Remove a file or directory. It is an error to attempt to delete a
             * directory that is not empty. It is an error to attempt to delete a
             * root directory of a file system.
             *
             * @param successCallback {Function} called with no parameters
             * @param errorCallback {Function} called with a FileError
             */
            Entry.prototype.remove = function (successCallback, errorCallback) {
                argscheck.checkArgs('FF', 'Entry.remove', arguments);
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(successCallback, fail, "File", "remove", [this.toInternalURL()]);
            };

            /**
             * Look up the parent DirectoryEntry of this entry.
             *
             * @param successCallback {Function} called with the parent DirectoryEntry object
             * @param errorCallback {Function} called with a FileError
             */
            Entry.prototype.getParent = function (successCallback, errorCallback) {
                argscheck.checkArgs('FF', 'Entry.getParent', arguments);
                var fs = this.filesystem;
                var win = successCallback && function (result) {
                    var DirectoryEntry = require('./DirectoryEntry');
                    var entry = new DirectoryEntry(result.name, result.fullPath, fs, result.nativeURL);
                    successCallback(entry);
                };
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(win, fail, "File", "getParent", [this.toInternalURL()]);
            };

            module.exports = Entry;

        });
        cordova.define("cordova-plugin-file.File", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Constructor.
             * name {DOMString} name of the file, without path information
             * fullPath {DOMString} the full path of the file, including the name
             * type {DOMString} mime type
             * lastModifiedDate {Date} last modified date
             * size {Number} size of the file in bytes
             */

            var File = function (name, localURL, type, lastModifiedDate, size) {
                this.name = name || '';
                this.localURL = localURL || null;
                this.type = type || null;
                this.lastModified = lastModifiedDate || null;
                // For backwards compatibility, store the timestamp in lastModifiedDate as well
                this.lastModifiedDate = lastModifiedDate || null;
                this.size = size || 0;

                // These store the absolute start and end for slicing the file.
                this.start = 0;
                this.end = this.size;
            };

            /**
             * Returns a "slice" of the file. Since Cordova Files don't contain the actual
             * content, this really returns a File with adjusted start and end.
             * Slices of slices are supported.
             * start {Number} The index at which to start the slice (inclusive).
             * end {Number} The index at which to end the slice (exclusive).
             */
            File.prototype.slice = function (start, end) {
                var size = this.end - this.start;
                var newStart = 0;
                var newEnd = size;
                if (arguments.length) {
                    if (start < 0) {
                        newStart = Math.max(size + start, 0);
                    } else {
                        newStart = Math.min(size, start);
                    }
                }

                if (arguments.length >= 2) {
                    if (end < 0) {
                        newEnd = Math.max(size + end, 0);
                    } else {
                        newEnd = Math.min(end, size);
                    }
                }

                var newFile = new File(this.name, this.localURL, this.type, this.lastModified, this.size);
                newFile.start = this.start + newStart;
                newFile.end = this.start + newEnd;
                return newFile;
            };


            module.exports = File;

        });
        cordova.define("cordova-plugin-file.FileEntry", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                Entry = require('./Entry'),
                FileWriter = require('./FileWriter'),
                File = require('./File'),
                FileError = require('./FileError');

            /**
             * An interface representing a file on the file system.
             *
             * {boolean} isFile always true (readonly)
             * {boolean} isDirectory always false (readonly)
             * {DOMString} name of the file, excluding the path leading to it (readonly)
             * {DOMString} fullPath the absolute full path to the file (readonly)
             * {FileSystem} filesystem on which the file resides (readonly)
             */
            var FileEntry = function (name, fullPath, fileSystem, nativeURL) {
                FileEntry.__super__.constructor.apply(this, [true, false, name, fullPath, fileSystem, nativeURL]);
            };

            utils.extend(FileEntry, Entry);

            /**
             * Creates a new FileWriter associated with the file that this FileEntry represents.
             *
             * @param {Function} successCallback is called with the new FileWriter
             * @param {Function} errorCallback is called with a FileError
             */
            FileEntry.prototype.createWriter = function (successCallback, errorCallback) {
                this.file(function (filePointer) {
                    var writer = new FileWriter(filePointer);

                    if (writer.localURL === null || writer.localURL === "") {
                        errorCallback && errorCallback(new FileError(FileError.INVALID_STATE_ERR));
                    } else {
                        successCallback && successCallback(writer);
                    }
                }, errorCallback);
            };

            /**
             * Returns a File that represents the current state of the file that this FileEntry represents.
             *
             * @param {Function} successCallback is called with the new File object
             * @param {Function} errorCallback is called with a FileError
             */
            FileEntry.prototype.file = function (successCallback, errorCallback) {
                var localURL = this.toInternalURL();
                var win = successCallback && function (f) {
                    var file = new File(f.name, localURL, f.type, f.lastModifiedDate, f.size);
                    successCallback(file);
                };
                var fail = errorCallback && function (code) {
                    errorCallback(new FileError(code));
                };
                exec(win, fail, "File", "getFileMetadata", [localURL]);
            };


            module.exports = FileEntry;

        });
        cordova.define("cordova-plugin-file.FileError", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * FileError
             */
            function FileError(error) {
                this.code = error || null;
            }

            // File error codes
            // Found in DOMException
            FileError.NOT_FOUND_ERR = 1;
            FileError.SECURITY_ERR = 2;
            FileError.ABORT_ERR = 3;

            // Added by File API specification
            FileError.NOT_READABLE_ERR = 4;
            FileError.ENCODING_ERR = 5;
            FileError.NO_MODIFICATION_ALLOWED_ERR = 6;
            FileError.INVALID_STATE_ERR = 7;
            FileError.SYNTAX_ERR = 8;
            FileError.INVALID_MODIFICATION_ERR = 9;
            FileError.QUOTA_EXCEEDED_ERR = 10;
            FileError.TYPE_MISMATCH_ERR = 11;
            FileError.PATH_EXISTS_ERR = 12;

            module.exports = FileError;

        });
        cordova.define("cordova-plugin-file.FileReader", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec'),
                modulemapper = require('cordova/modulemapper'),
                utils = require('cordova/utils'),
                File = require('./File'),
                FileError = require('./FileError'),
                ProgressEvent = require('./ProgressEvent'),
                origFileReader = modulemapper.getOriginalSymbol(window, 'FileReader');

            /**
             * This class reads the mobile device file system.
             *
             * For Android:
             *      The root directory is the root of the file system.
             *      To read from the SD card, the file name is "sdcard/my_file.txt"
             * @constructor
             */
            var FileReader = function () {
                this._readyState = 0;
                this._error = null;
                this._result = null;
                this._localURL = '';
                this._realReader = origFileReader ? new origFileReader() : {};
            };

            // States
            FileReader.EMPTY = 0;
            FileReader.LOADING = 1;
            FileReader.DONE = 2;

            utils.defineGetter(FileReader.prototype, 'readyState', function () {
                return this._localURL ? this._readyState : this._realReader.readyState;
            });

            utils.defineGetter(FileReader.prototype, 'error', function () {
                return this._localURL ? this._error : this._realReader.error;
            });

            utils.defineGetter(FileReader.prototype, 'result', function () {
                return this._localURL ? this._result : this._realReader.result;
            });

            function defineEvent(eventName) {
                utils.defineGetterSetter(FileReader.prototype, eventName, function () {
                    return this._realReader[eventName] || null;
                }, function (value) {
                    this._realReader[eventName] = value;
                });
            }
            defineEvent('onloadstart'); // When the read starts.
            defineEvent('onprogress'); // While reading (and decoding) file or fileBlob data, and reporting partial file data (progress.loaded/progress.total)
            defineEvent('onload'); // When the read has successfully completed.
            defineEvent('onerror'); // When the read has failed (see errors).
            defineEvent('onloadend'); // When the request has completed (either in success or failure).
            defineEvent('onabort'); // When the read has been aborted. For instance, by invoking the abort() method.

            function initRead(reader, file) {
                // Already loading something
                if (reader.readyState == FileReader.LOADING) {
                    throw new FileError(FileError.INVALID_STATE_ERR);
                }

                reader._result = null;
                reader._error = null;
                reader._readyState = FileReader.LOADING;

                if (typeof file.localURL == 'string') {
                    reader._localURL = file.localURL;
                } else {
                    reader._localURL = '';
                    return true;
                }

                reader.onloadstart && reader.onloadstart(new ProgressEvent("loadstart", {
                    target: reader
                }));
            }

            /**
             * Abort reading file.
             */
            FileReader.prototype.abort = function () {
                if (origFileReader && !this._localURL) {
                    return this._realReader.abort();
                }
                this._result = null;

                if (this._readyState == FileReader.DONE || this._readyState == FileReader.EMPTY) {
                    return;
                }

                this._readyState = FileReader.DONE;

                // If abort callback
                if (typeof this.onabort === 'function') {
                    this.onabort(new ProgressEvent('abort', {
                        target: this
                    }));
                }
                // If load end callback
                if (typeof this.onloadend === 'function') {
                    this.onloadend(new ProgressEvent('loadend', {
                        target: this
                    }));
                }
            };

            /**
             * Read text file.
             *
             * @param file          {File} File object containing file properties
             * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
             */
            FileReader.prototype.readAsText = function (file, encoding) {
                if (initRead(this, file)) {
                    return this._realReader.readAsText(file, encoding);
                }

                // Default encoding is UTF-8
                var enc = encoding ? encoding : "UTF-8";
                var me = this;
                var execArgs = [this._localURL, enc, file.start, file.end];

                // Read file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        // Save result
                        me._result = r;

                        // If onload callback
                        if (typeof me.onload === "function") {
                            me.onload(new ProgressEvent("load", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        // null result
                        me._result = null;

                        // Save error
                        me._error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    }, "File", "readAsText", execArgs);
            };


            /**
             * Read file and return data as a base64 encoded data url.
             * A data url is of the form:
             *      data:[<mediatype>][;base64],<data>
             *
             * @param file          {File} File object containing file properties
             */
            FileReader.prototype.readAsDataURL = function (file) {
                if (initRead(this, file)) {
                    return this._realReader.readAsDataURL(file);
                }

                var me = this;
                var execArgs = [this._localURL, file.start, file.end];

                // Read file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        // Save result
                        me._result = r;

                        // If onload callback
                        if (typeof me.onload === "function") {
                            me.onload(new ProgressEvent("load", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        me._result = null;

                        // Save error
                        me._error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    }, "File", "readAsDataURL", execArgs);
            };

            /**
             * Read file and return data as a binary data.
             *
             * @param file          {File} File object containing file properties
             */
            FileReader.prototype.readAsBinaryString = function (file) {
                if (initRead(this, file)) {
                    return this._realReader.readAsBinaryString(file);
                }

                var me = this;
                var execArgs = [this._localURL, file.start, file.end];

                // Read file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        me._result = r;

                        // If onload callback
                        if (typeof me.onload === "function") {
                            me.onload(new ProgressEvent("load", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        me._result = null;

                        // Save error
                        me._error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    }, "File", "readAsBinaryString", execArgs);
            };

            /**
             * Read file and return data as a binary data.
             *
             * @param file          {File} File object containing file properties
             */
            FileReader.prototype.readAsArrayBuffer = function (file) {
                if (initRead(this, file)) {
                    return this._realReader.readAsArrayBuffer(file);
                }

                var me = this;
                var execArgs = [this._localURL, file.start, file.end];

                // Read file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        if (r instanceof Array) {
                            r = new Uint8Array(r).buffer;
                        }
                        me._result = r;

                        // If onload callback
                        if (typeof me.onload === "function") {
                            me.onload(new ProgressEvent("load", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me._readyState === FileReader.DONE) {
                            return;
                        }

                        // DONE state
                        me._readyState = FileReader.DONE;

                        me._result = null;

                        // Save error
                        me._error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                target: me
                            }));
                        }

                        // If onloadend callback
                        if (typeof me.onloadend === "function") {
                            me.onloadend(new ProgressEvent("loadend", {
                                target: me
                            }));
                        }
                    }, "File", "readAsArrayBuffer", execArgs);
            };

            module.exports = FileReader;

        });
        cordova.define("cordova-plugin-file.FileSystem", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var DirectoryEntry = require('./DirectoryEntry');

            /**
             * An interface representing a file system
             *
             * @constructor
             * {DOMString} name the unique name of the file system (readonly)
             * {DirectoryEntry} root directory of the file system (readonly)
             */
            var FileSystem = function (name, root) {
                this.name = name;
                if (root) {
                    this.root = new DirectoryEntry(root.name, root.fullPath, this, root.nativeURL);
                } else {
                    this.root = new DirectoryEntry(this.name, '/', this);
                }
            };

            FileSystem.prototype.__format__ = function (fullPath, nativeUrl) {
                return fullPath;
            };

            FileSystem.prototype.toJSON = function () {
                return "<FileSystem: " + this.name + ">";
            };

            module.exports = FileSystem;

        });
        cordova.define("cordova-plugin-file.fileSystemPaths", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec');
            var channel = require('cordova/channel');

            exports.file = {
                // Read-only directory where the application is installed.
                applicationDirectory: null,
                // Root of app's private writable storage
                applicationStorageDirectory: null,
                // Where to put app-specific data files.
                dataDirectory: null,
                // Cached files that should survive app restarts.
                // Apps should not rely on the OS to delete files in here.
                cacheDirectory: null,
                // Android: the application space on external storage.
                externalApplicationStorageDirectory: null,
                // Android: Where to put app-specific data files on external storage.
                externalDataDirectory: null,
                // Android: the application cache on external storage.
                externalCacheDirectory: null,
                // Android: the external storage (SD card) root.
                externalRootDirectory: null,
                // iOS: Temp directory that the OS can clear at will.
                tempDirectory: null,
                // iOS: Holds app-specific files that should be synced (e.g. to iCloud).
                syncedDataDirectory: null,
                // iOS: Files private to the app, but that are meaningful to other applciations (e.g. Office files)
                documentsDirectory: null,
                // BlackBerry10: Files globally available to all apps
                sharedDirectory: null
            };

            channel.waitForInitialization('onFileSystemPathsReady');
            channel.onCordovaReady.subscribe(function () {
                function after(paths) {
                    for (var k in paths) {
                        exports.file[k] = paths[k];
                    }
                    channel.initializationComplete('onFileSystemPathsReady');
                }
                exec(after, null, 'File', 'requestAllPaths', []);
            });


        });
        cordova.define("cordova-plugin-file.fileSystems", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            // Overridden by Android, BlackBerry 10 and iOS to populate fsMap.
            module.exports.getFs = function (name, callback) {
                callback(null);
            };

        });
        cordova.define("cordova-plugin-file.fileSystems-roots", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            // Map of fsName -> FileSystem.
            var fsMap = null;
            var FileSystem = require('./FileSystem');
            var exec = require('cordova/exec');

            // Overridden by Android, BlackBerry 10 and iOS to populate fsMap.
            require('./fileSystems').getFs = function (name, callback) {
                if (fsMap) {
                    callback(fsMap[name]);
                } else {
                    exec(success, null, "File", "requestAllFileSystems", []);

                    function success(response) {
                        fsMap = {};
                        for (var i = 0; i < response.length; ++i) {
                            var fsRoot = response[i];
                            var fs = new FileSystem(fsRoot.filesystemName, fsRoot);
                            fsMap[fs.name] = fs;
                        }
                        callback(fsMap[name]);
                    }
                }
            };


        });
        cordova.define("cordova-plugin-file.FileUploadOptions", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Options to customize the HTTP request used to upload files.
             * @constructor
             * @param fileKey {String}   Name of file request parameter.
             * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
             * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
             * @param params {Object}    Object with key: value params to send to the server.
             * @param headers {Object}   Keys are header names, values are header values. Multiple
             *                           headers of the same name are not supported.
             */
            var FileUploadOptions = function (fileKey, fileName, mimeType, params, headers, httpMethod) {
                this.fileKey = fileKey || null;
                this.fileName = fileName || null;
                this.mimeType = mimeType || null;
                this.params = params || null;
                this.headers = headers || null;
                this.httpMethod = httpMethod || null;
            };

            module.exports = FileUploadOptions;

        });
        cordova.define("cordova-plugin-file.FileUploadOptions1", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Options to customize the HTTP request used to upload files.
             * @constructor
             * @param fileKey {String}   Name of file request parameter.
             * @param fileName {String}  Filename to be used by the server. Defaults to image.jpg.
             * @param mimeType {String}  Mimetype of the uploaded file. Defaults to image/jpeg.
             * @param params {Object}    Object with key: value params to send to the server.
             */
            var FileUploadOptions = function (fileKey, fileName, mimeType, params, headers, httpMethod) {
                this.fileKey = fileKey || null;
                this.fileName = fileName || null;
                this.mimeType = mimeType || null;
                this.headers = headers || null;
                this.httpMethod = httpMethod || null;

                if (params && typeof params != typeof "") {
                    var arrParams = [];
                    for (var v in params) {
                        arrParams.push(v + "=" + params[v]);
                    }
                    this.params = encodeURIComponent(arrParams.join("&"));
                } else {
                    this.params = params || null;
                }
            };

            module.exports = FileUploadOptions;

        });
        cordova.define("cordova-plugin-file.FileUploadResult", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * FileUploadResult
             * @constructor
             */
            module.exports = function FileUploadResult(size, code, content) {
                this.bytesSent = size;
                this.responseCode = code;
                this.response = content;
            };
        });
        cordova.define("cordova-plugin-file.FileWriter", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec'),
                FileError = require('./FileError'),
                ProgressEvent = require('./ProgressEvent');

            /**
             * This class writes to the mobile device file system.
             *
             * For Android:
             *      The root directory is the root of the file system.
             *      To write to the SD card, the file name is "sdcard/my_file.txt"
             *
             * @constructor
             * @param file {File} File object containing file properties
             * @param append if true write to the end of the file, otherwise overwrite the file
             */
            var FileWriter = function (file) {
                this.fileName = "";
                this.length = 0;
                if (file) {
                    this.localURL = file.localURL || file;
                    this.length = file.size || 0;
                }
                // default is to write at the beginning of the file
                this.position = 0;

                this.readyState = 0; // EMPTY

                this.result = null;

                // Error
                this.error = null;

                // Event handlers
                this.onwritestart = null; // When writing starts
                this.onprogress = null; // While writing the file, and reporting partial file data
                this.onwrite = null; // When the write has successfully completed.
                this.onwriteend = null; // When the request has completed (either in success or failure).
                this.onabort = null; // When the write has been aborted. For instance, by invoking the abort() method.
                this.onerror = null; // When the write has failed (see errors).
            };

            // States
            FileWriter.INIT = 0;
            FileWriter.WRITING = 1;
            FileWriter.DONE = 2;

            /**
             * Abort writing file.
             */
            FileWriter.prototype.abort = function () {
                // check for invalid state
                if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
                    throw new FileError(FileError.INVALID_STATE_ERR);
                }

                // set error
                this.error = new FileError(FileError.ABORT_ERR);

                this.readyState = FileWriter.DONE;

                // If abort callback
                if (typeof this.onabort === "function") {
                    this.onabort(new ProgressEvent("abort", {
                        "target": this
                    }));
                }

                // If write end callback
                if (typeof this.onwriteend === "function") {
                    this.onwriteend(new ProgressEvent("writeend", {
                        "target": this
                    }));
                }
            };

            /**
             * Writes data to the file
             *
             * @param data text or blob to be written
             */
            FileWriter.prototype.write = function (data) {

                var that = this;
                var supportsBinary = (typeof window.Blob !== 'undefined' && typeof window.ArrayBuffer !== 'undefined');
                var isProxySupportBlobNatively = (cordova.platformId === "windows8" || cordova.platformId === "windows");
                var isBinary;

                // Check to see if the incoming data is a blob
                if (data instanceof File || (!isProxySupportBlobNatively && supportsBinary && data instanceof Blob)) {
                    var fileReader = new FileReader();
                    fileReader.onload = function () {
                        // Call this method again, with the arraybuffer as argument
                        FileWriter.prototype.write.call(that, this.result);
                    };
                    if (supportsBinary) {
                        fileReader.readAsArrayBuffer(data);
                    } else {
                        fileReader.readAsText(data);
                    }
                    return;
                }

                // Mark data type for safer transport over the binary bridge
                isBinary = supportsBinary && (data instanceof ArrayBuffer);
                if (isBinary && cordova.platformId === "windowsphone") {
                    // create a plain array, using the keys from the Uint8Array view so that we can serialize it
                    data = Array.apply(null, new Uint8Array(data));
                }

                // Throw an exception if we are already writing a file
                if (this.readyState === FileWriter.WRITING) {
                    throw new FileError(FileError.INVALID_STATE_ERR);
                }

                // WRITING state
                this.readyState = FileWriter.WRITING;

                var me = this;

                // If onwritestart callback
                if (typeof me.onwritestart === "function") {
                    me.onwritestart(new ProgressEvent("writestart", {
                        "target": me
                    }));
                }

                // Write file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me.readyState === FileWriter.DONE) {
                            return;
                        }

                        // position always increases by bytes written because file would be extended
                        me.position += r;
                        // The length of the file is now where we are done writing.

                        me.length = me.position;

                        // DONE state
                        me.readyState = FileWriter.DONE;

                        // If onwrite callback
                        if (typeof me.onwrite === "function") {
                            me.onwrite(new ProgressEvent("write", {
                                "target": me
                            }));
                        }

                        // If onwriteend callback
                        if (typeof me.onwriteend === "function") {
                            me.onwriteend(new ProgressEvent("writeend", {
                                "target": me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me.readyState === FileWriter.DONE) {
                            return;
                        }

                        // DONE state
                        me.readyState = FileWriter.DONE;

                        // Save error
                        me.error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                "target": me
                            }));
                        }

                        // If onwriteend callback
                        if (typeof me.onwriteend === "function") {
                            me.onwriteend(new ProgressEvent("writeend", {
                                "target": me
                            }));
                        }
                    }, "File", "write", [this.localURL, data, this.position, isBinary]);
            };

            /**
             * Moves the file pointer to the location specified.
             *
             * If the offset is a negative number the position of the file
             * pointer is rewound.  If the offset is greater than the file
             * size the position is set to the end of the file.
             *
             * @param offset is the location to move the file pointer to.
             */
            FileWriter.prototype.seek = function (offset) {
                // Throw an exception if we are already writing a file
                if (this.readyState === FileWriter.WRITING) {
                    throw new FileError(FileError.INVALID_STATE_ERR);
                }

                if (!offset && offset !== 0) {
                    return;
                }

                // See back from end of file.
                if (offset < 0) {
                    this.position = Math.max(offset + this.length, 0);
                }
                    // Offset is bigger than file size so set position
                    // to the end of the file.
                else if (offset > this.length) {
                    this.position = this.length;
                }
                    // Offset is between 0 and file size so set the position
                    // to start writing.
                else {
                    this.position = offset;
                }
            };

            /**
             * Truncates the file to the size specified.
             *
             * @param size to chop the file at.
             */
            FileWriter.prototype.truncate = function (size) {
                // Throw an exception if we are already writing a file
                if (this.readyState === FileWriter.WRITING) {
                    throw new FileError(FileError.INVALID_STATE_ERR);
                }

                // WRITING state
                this.readyState = FileWriter.WRITING;

                var me = this;

                // If onwritestart callback
                if (typeof me.onwritestart === "function") {
                    me.onwritestart(new ProgressEvent("writestart", {
                        "target": this
                    }));
                }

                // Write file
                exec(
                    // Success callback
                    function (r) {
                        // If DONE (cancelled), then don't do anything
                        if (me.readyState === FileWriter.DONE) {
                            return;
                        }

                        // DONE state
                        me.readyState = FileWriter.DONE;

                        // Update the length of the file
                        me.length = r;
                        me.position = Math.min(me.position, r);

                        // If onwrite callback
                        if (typeof me.onwrite === "function") {
                            me.onwrite(new ProgressEvent("write", {
                                "target": me
                            }));
                        }

                        // If onwriteend callback
                        if (typeof me.onwriteend === "function") {
                            me.onwriteend(new ProgressEvent("writeend", {
                                "target": me
                            }));
                        }
                    },
                    // Error callback
                    function (e) {
                        // If DONE (cancelled), then don't do anything
                        if (me.readyState === FileWriter.DONE) {
                            return;
                        }

                        // DONE state
                        me.readyState = FileWriter.DONE;

                        // Save error
                        me.error = new FileError(e);

                        // If onerror callback
                        if (typeof me.onerror === "function") {
                            me.onerror(new ProgressEvent("error", {
                                "target": me
                            }));
                        }

                        // If onwriteend callback
                        if (typeof me.onwriteend === "function") {
                            me.onwriteend(new ProgressEvent("writeend", {
                                "target": me
                            }));
                        }
                    }, "File", "truncate", [this.localURL, size]);
            };

            module.exports = FileWriter;

        });
        cordova.define("cordova-plugin-file.Flags", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Supplies arguments to methods that lookup or create files and directories.
             *
             * @param create
             *            {boolean} file or directory if it doesn't exist
             * @param exclusive
             *            {boolean} used with create; if true the command will fail if
             *            target path exists
             */
            function Flags(create, exclusive) {
                this.create = create || false;
                this.exclusive = exclusive || false;
            }

            module.exports = Flags;

        });
        cordova.define("cordova-plugin-file.LocalFileSystem", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            exports.TEMPORARY = 0;
            exports.PERSISTENT = 1;

        });
        cordova.define("cordova-plugin-file.Metadata", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Information about the state of the file or directory
             *
             * {Date} modificationTime (readonly)
             */
            var Metadata = function (metadata) {
                if (typeof metadata == "object") {
                    this.modificationTime = new Date(metadata.modificationTime);
                    this.size = metadata.size || 0;
                } else if (typeof metadata == "undefined") {
                    this.modificationTime = null;
                    this.size = 0;
                } else {
                    /* Backwards compatiblity with platforms that only return a timestamp */
                    this.modificationTime = new Date(metadata);
                }
            };

            module.exports = Metadata;

        });
        cordova.define("cordova-plugin-file.ProgressEvent", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            // If ProgressEvent exists in global context, use it already, otherwise use our own polyfill
            // Feature test: See if we can instantiate a native ProgressEvent;
            // if so, use that approach,
            // otherwise fill-in with our own implementation.
            //
            // NOTE: right now we always fill in with our own. Down the road would be nice if we can use whatever is native in the webview.
            var ProgressEvent = (function () {
                /*
                var createEvent = function(data) {
                    var event = document.createEvent('Events');
                    event.initEvent('ProgressEvent', false, false);
                    if (data) {
                        for (var i in data) {
                            if (data.hasOwnProperty(i)) {
                                event[i] = data[i];
                            }
                        }
                        if (data.target) {
                            // TODO: cannot call <some_custom_object>.dispatchEvent
                            // need to first figure out how to implement EventTarget
                        }
                    }
                    return event;
                };
                try {
                    var ev = createEvent({type:"abort",target:document});
                    return function ProgressEvent(type, data) {
                        data.type = type;
                        return createEvent(data);
                    };
                } catch(e){
                */
                return function ProgressEvent(type, dict) {
                    this.type = type;
                    this.bubbles = false;
                    this.cancelBubble = false;
                    this.cancelable = false;
                    this.lengthComputable = false;
                    this.loaded = dict && dict.loaded ? dict.loaded : 0;
                    this.total = dict && dict.total ? dict.total : 0;
                    this.target = dict && dict.target ? dict.target : null;
                };
                //}
            })();

            module.exports = ProgressEvent;

        });
        cordova.define("cordova-plugin-file.requestFileSystem", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            //For browser platform: not all browsers use this file.
            function checkBrowser() {
                if (cordova.platformId === "browser" && navigator.userAgent.search(/Chrome/) > 0) {
                    var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
                    module.exports = requestFileSystem;
                    return;
                }
            }
            checkBrowser();

            var argscheck = require('cordova/argscheck'),
                FileError = require('./FileError'),
                FileSystem = require('./FileSystem'),
                exec = require('cordova/exec');
            var fileSystems = require('./fileSystems');

            /**
             * Request a file system in which to store application data.
             * @param type  local file system type
             * @param size  indicates how much storage space, in bytes, the application expects to need
             * @param successCallback  invoked with a FileSystem object
             * @param errorCallback  invoked if error occurs retrieving file system
             */
            var requestFileSystem = function (type, size, successCallback, errorCallback) {
                argscheck.checkArgs('nnFF', 'requestFileSystem', arguments);
                var fail = function (code) {
                    errorCallback && errorCallback(new FileError(code));
                };

                if (type < 0) {
                    fail(FileError.SYNTAX_ERR);
                } else {
                    // if successful, return a FileSystem object
                    var success = function (file_system) {
                        if (file_system) {
                            if (successCallback) {
                                fileSystems.getFs(file_system.name, function (fs) {
                                    // This should happen only on platforms that haven't implemented requestAllFileSystems (windows)
                                    if (!fs) {
                                        fs = new FileSystem(file_system.name, file_system.root);
                                    }
                                    successCallback(fs);
                                });
                            }
                        } else {
                            // no FileSystem object returned
                            fail(FileError.NOT_FOUND_ERR);
                        }
                    };
                    exec(success, fail, "File", "requestFileSystem", [type, size]);
                }
            };

            module.exports = requestFileSystem;

        });
        cordova.define("cordova-plugin-file.resolveLocalFileSystemURI", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            //For browser platform: not all browsers use overrided `resolveLocalFileSystemURL`.
            function checkBrowser() {
                if (cordova.platformId === "browser" && navigator.userAgent.search(/Chrome/) > 0) {
                    var requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
                    module.exports = requestFileSystem;
                    return;
                }
            }
            checkBrowser();

            var argscheck = require('cordova/argscheck'),
                DirectoryEntry = require('./DirectoryEntry'),
                FileEntry = require('./FileEntry'),
                FileError = require('./FileError'),
                exec = require('cordova/exec');
            var fileSystems = require('./fileSystems');

            /**
             * Look up file system Entry referred to by local URI.
             * @param {DOMString} uri  URI referring to a local file or directory
             * @param successCallback  invoked with Entry object corresponding to URI
             * @param errorCallback    invoked if error occurs retrieving file system entry
             */
            module.exports.resolveLocalFileSystemURL = function (uri, successCallback, errorCallback) {
                argscheck.checkArgs('sFF', 'resolveLocalFileSystemURI', arguments);
                // error callback
                var fail = function (error) {
                    errorCallback && errorCallback(new FileError(error));
                };
                // sanity check for 'not:valid:filename' or '/not:valid:filename'
                // file.spec.12 window.resolveLocalFileSystemURI should error (ENCODING_ERR) when resolving invalid URI with leading /.
                if (!uri || uri.split(":").length > 2) {
                    setTimeout(function () {
                        fail(FileError.ENCODING_ERR);
                    }, 0);
                    return;
                }
                // if successful, return either a file or directory entry
                var success = function (entry) {
                    if (entry) {
                        if (successCallback) {
                            // create appropriate Entry object
                            var fsName = entry.filesystemName || (entry.filesystem && entry.filesystem.name) || (entry.filesystem == window.PERSISTENT ? 'persistent' : 'temporary');
                            fileSystems.getFs(fsName, function (fs) {
                                // This should happen only on platforms that haven't implemented requestAllFileSystems (windows)
                                if (!fs) {
                                    fs = new FileSystem(fsName, {
                                        name: "",
                                        fullPath: "/"
                                    });
                                }
                                var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath, fs, entry.nativeURL) : new FileEntry(entry.name, entry.fullPath, fs, entry.nativeURL);
                                successCallback(result);
                            });
                        }
                    } else {
                        // no Entry object returned
                        fail(FileError.NOT_FOUND_ERR);
                    }
                };

                exec(success, fail, "File", "resolveLocalFileSystemURI", [uri]);
            };

            module.exports.resolveLocalFileSystemURI = function () {
                console.log("resolveLocalFileSystemURI is deprecated. Please call resolveLocalFileSystemURL instead.");
                module.exports.resolveLocalFileSystemURL.apply(this, arguments);
            };

        });

        //File Transfer
        cordova.define("cordova-plugin-file-transfer.FileTransfer", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                exec = require('cordova/exec'),
                FileTransferError = require('./FileTransferError'),
                ProgressEvent = require('cordova-plugin-file.ProgressEvent');

            function newProgressEvent(result) {
                var pe = new ProgressEvent();
                pe.lengthComputable = result.lengthComputable;
                pe.loaded = result.loaded;
                pe.total = result.total;
                return pe;
            }

            function getUrlCredentials(urlString) {
                var credentialsPattern = /^https?\:\/\/(?:(?:(([^:@\/]*)(?::([^@\/]*))?)?@)?([^:\/?#]*)(?::(\d*))?).*$/,
                    credentials = credentialsPattern.exec(urlString);

                return credentials && credentials[1];
            }

            function getBasicAuthHeader(urlString) {
                var header = null;


                // This is changed due to MS Windows doesn't support credentials in http uris
                // so we detect them by regexp and strip off from result url
                // Proof: http://social.msdn.microsoft.com/Forums/windowsapps/en-US/a327cf3c-f033-4a54-8b7f-03c56ba3203f/windows-foundation-uri-security-problem

                if (window.btoa) {
                    var credentials = getUrlCredentials(urlString);
                    if (credentials) {
                        var authHeader = "Authorization";
                        var authHeaderValue = "Basic " + window.btoa(credentials);

                        header = {
                            name: authHeader,
                            value: authHeaderValue
                        };
                    }
                }

                return header;
            }

            function convertHeadersToArray(headers) {
                var result = [];
                for (var header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        var headerValue = headers[header];
                        result.push({
                            name: header,
                            value: headerValue.toString()
                        });
                    }
                }
                return result;
            }

            var idCounter = 0;

            /**
             * FileTransfer uploads a file to a remote server.
             * @constructor
             */
            var FileTransfer = function () {
                this._id = ++idCounter;
                this.onprogress = null; // optional callback
            };

            /**
             * Given an absolute file path, uploads a file on the device to a remote server
             * using a multipart HTTP request.
             * @param filePath {String}           Full path of the file on the device
             * @param server {String}             URL of the server to receive the file
             * @param successCallback (Function}  Callback to be invoked when upload has completed
             * @param errorCallback {Function}    Callback to be invoked upon error
             * @param options {FileUploadOptions} Optional parameters such as file name and mimetype
             * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
             */
            FileTransfer.prototype.upload = function (filePath, server, successCallback, errorCallback, options, trustAllHosts) {
                argscheck.checkArgs('ssFFO*', 'FileTransfer.upload', arguments);
                // check for options
                var fileKey = null;
                var fileName = null;
                var mimeType = null;
                var params = null;
                var chunkedMode = true;
                var headers = null;
                var httpMethod = null;
                var basicAuthHeader = getBasicAuthHeader(server);
                if (basicAuthHeader) {
                    server = server.replace(getUrlCredentials(server) + '@', '');

                    options = options || {};
                    options.headers = options.headers || {};
                    options.headers[basicAuthHeader.name] = basicAuthHeader.value;
                }

                if (options) {
                    fileKey = options.fileKey;
                    fileName = options.fileName;
                    mimeType = options.mimeType;
                    headers = options.headers;
                    httpMethod = options.httpMethod || "POST";
                    if (httpMethod.toUpperCase() == "PUT") {
                        httpMethod = "PUT";
                    } else {
                        httpMethod = "POST";
                    }
                    if (options.chunkedMode !== null || typeof options.chunkedMode != "undefined") {
                        chunkedMode = options.chunkedMode;
                    }
                    if (options.params) {
                        params = options.params;
                    } else {
                        params = {};
                    }
                }

                if (cordova.platformId === "windowsphone") {
                    headers = headers && convertHeadersToArray(headers);
                    params = params && convertHeadersToArray(params);
                }

                var fail = errorCallback && function (e) {
                    var error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body, e.exception);
                    errorCallback(error);
                };

                var self = this;
                var win = function (result) {
                    if (typeof result.lengthComputable != "undefined") {
                        if (self.onprogress) {
                            self.onprogress(newProgressEvent(result));
                        }
                    } else {
                        successCallback && successCallback(result);
                    }
                };
                exec(win, fail, 'FileTransfer', 'upload', [filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod]);
            };

            /**
             * Downloads a file form a given URL and saves it to the specified directory.
             * @param source {String}          URL of the server to receive the file
             * @param target {String}         Full path of the file on the device
             * @param successCallback (Function}  Callback to be invoked when upload has completed
             * @param errorCallback {Function}    Callback to be invoked upon error
             * @param trustAllHosts {Boolean} Optional trust all hosts (e.g. for self-signed certs), defaults to false
             * @param options {FileDownloadOptions} Optional parameters such as headers
             */
            FileTransfer.prototype.download = function (source, target, successCallback, errorCallback, trustAllHosts, options) {
                argscheck.checkArgs('ssFF*', 'FileTransfer.download', arguments);
                var self = this;

                var basicAuthHeader = getBasicAuthHeader(source);
                if (basicAuthHeader) {
                    source = source.replace(getUrlCredentials(source) + '@', '');

                    options = options || {};
                    options.headers = options.headers || {};
                    options.headers[basicAuthHeader.name] = basicAuthHeader.value;
                }

                var headers = null;
                if (options) {
                    headers = options.headers || null;
                }

                if (cordova.platformId === "windowsphone" && headers) {
                    headers = convertHeadersToArray(headers);
                }

                var win = function (result) {
                    if (typeof result.lengthComputable != "undefined") {
                        if (self.onprogress) {
                            return self.onprogress(newProgressEvent(result));
                        }
                    } else if (successCallback) {
                        var entry = null;
                        if (result.isDirectory) {
                            entry = new (require('cordova-plugin-file.DirectoryEntry'))();
                        } else if (result.isFile) {
                            entry = new (require('cordova-plugin-file.FileEntry'))();
                        }
                        entry.isDirectory = result.isDirectory;
                        entry.isFile = result.isFile;
                        entry.name = result.name;
                        entry.fullPath = result.fullPath;
                        entry.filesystem = new FileSystem(result.filesystemName || (result.filesystem == window.PERSISTENT ? 'persistent' : 'temporary'));
                        entry.nativeURL = result.nativeURL;
                        successCallback(entry);
                    }
                };

                var fail = errorCallback && function (e) {
                    var error = new FileTransferError(e.code, e.source, e.target, e.http_status, e.body, e.exception);
                    errorCallback(error);
                };

                exec(win, fail, 'FileTransfer', 'download', [source, target, trustAllHosts, this._id, headers]);
            };

            /**
             * Aborts the ongoing file transfer on this object. The original error
             * callback for the file transfer will be called if necessary.
             */
            FileTransfer.prototype.abort = function () {
                exec(null, null, 'FileTransfer', 'abort', [this._id]);
            };

            module.exports = FileTransfer;

        });
        cordova.define("cordova-plugin-file-transfer.FileTransferError", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * FileTransferError
             * @constructor
             */
            var FileTransferError = function (code, source, target, status, body, exception) {
                this.code = code || null;
                this.source = source || null;
                this.target = target || null;
                this.http_status = status || null;
                this.body = body || null;
                this.exception = exception || null;
            };

            FileTransferError.FILE_NOT_FOUND_ERR = 1;
            FileTransferError.INVALID_URL_ERR = 2;
            FileTransferError.CONNECTION_ERR = 3;
            FileTransferError.ABORT_ERR = 4;
            FileTransferError.NOT_MODIFIED_ERR = 5;

            module.exports = FileTransferError;

        });

        //Geolocation for iOS
        //Even though the browser's implementation of geolocation is working
        //The permission popup for the particular page is not good. :(
        if (DronaHQ.onIos) {
            cordova.define("cordova-plugin-geolocation.Coordinates", function (require, exports, module) {
                /*
                 *
                 * Licensed to the Apache Software Foundation (ASF) under one
                 * or more contributor license agreements.  See the NOTICE file
                 * distributed with this work for additional information
                 * regarding copyright ownership.  The ASF licenses this file
                 * to you under the Apache License, Version 2.0 (the
                 * "License"); you may not use this file except in compliance
                 * with the License.  You may obtain a copy of the License at
                 *
                 *   http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing,
                 * software distributed under the License is distributed on an
                 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
                 * KIND, either express or implied.  See the License for the
                 * specific language governing permissions and limitations
                 * under the License.
                 *
                 */

                /**
                 * This class contains position information.
                 * @param {Object} lat
                 * @param {Object} lng
                 * @param {Object} alt
                 * @param {Object} acc
                 * @param {Object} head
                 * @param {Object} vel
                 * @param {Object} altacc
                 * @constructor
                 */
                var Coordinates = function (lat, lng, alt, acc, head, vel, altacc) {
                    /**
                     * The latitude of the position.
                     */
                    this.latitude = lat;
                    /**
                     * The longitude of the position,
                     */
                    this.longitude = lng;
                    /**
                     * The accuracy of the position.
                     */
                    this.accuracy = acc;
                    /**
                     * The altitude of the position.
                     */
                    this.altitude = (alt !== undefined ? alt : null);
                    /**
                     * The direction the device is moving at the position.
                     */
                    this.heading = (head !== undefined ? head : null);
                    /**
                     * The velocity with which the device is moving at the position.
                     */
                    this.speed = (vel !== undefined ? vel : null);

                    if (this.speed === 0 || this.speed === null) {
                        this.heading = NaN;
                    }

                    /**
                     * The altitude accuracy of the position.
                     */
                    this.altitudeAccuracy = (altacc !== undefined) ? altacc : null;
                };

                module.exports = Coordinates;

            });
            cordova.define("cordova-plugin-geolocation.Position", function (require, exports, module) {
                /*
                 *
                 * Licensed to the Apache Software Foundation (ASF) under one
                 * or more contributor license agreements.  See the NOTICE file
                 * distributed with this work for additional information
                 * regarding copyright ownership.  The ASF licenses this file
                 * to you under the Apache License, Version 2.0 (the
                 * "License"); you may not use this file except in compliance
                 * with the License.  You may obtain a copy of the License at
                 *
                 *   http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing,
                 * software distributed under the License is distributed on an
                 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
                 * KIND, either express or implied.  See the License for the
                 * specific language governing permissions and limitations
                 * under the License.
                 *
                 */

                var Coordinates = require('./Coordinates');

                var Position = function (coords, timestamp) {
                    if (coords) {
                        this.coords = new Coordinates(coords.latitude, coords.longitude, coords.altitude, coords.accuracy, coords.heading, coords.velocity, coords.altitudeAccuracy);
                    } else {
                        this.coords = new Coordinates();
                    }
                    this.timestamp = (timestamp !== undefined) ? timestamp : new Date();
                };

                module.exports = Position;

            });
            cordova.define("cordova-plugin-geolocation.PositionError", function (require, exports, module) {
                /*
                 *
                 * Licensed to the Apache Software Foundation (ASF) under one
                 * or more contributor license agreements.  See the NOTICE file
                 * distributed with this work for additional information
                 * regarding copyright ownership.  The ASF licenses this file
                 * to you under the Apache License, Version 2.0 (the
                 * "License"); you may not use this file except in compliance
                 * with the License.  You may obtain a copy of the License at
                 *
                 *   http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing,
                 * software distributed under the License is distributed on an
                 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
                 * KIND, either express or implied.  See the License for the
                 * specific language governing permissions and limitations
                 * under the License.
                 *
                 */

                /**
                 * Position error object
                 *
                 * @constructor
                 * @param code
                 * @param message
                 */
                var PositionError = function (code, message) {
                    this.code = code || null;
                    this.message = message || '';
                };

                PositionError.PERMISSION_DENIED = 1;
                PositionError.POSITION_UNAVAILABLE = 2;
                PositionError.TIMEOUT = 3;

                module.exports = PositionError;

            });
            cordova.define("cordova-plugin-geolocation.geolocation", function (require, exports, module) {
                /*
                 *
                 * Licensed to the Apache Software Foundation (ASF) under one
                 * or more contributor license agreements.  See the NOTICE file
                 * distributed with this work for additional information
                 * regarding copyright ownership.  The ASF licenses this file
                 * to you under the Apache License, Version 2.0 (the
                 * "License"); you may not use this file except in compliance
                 * with the License.  You may obtain a copy of the License at
                 *
                 *   http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing,
                 * software distributed under the License is distributed on an
                 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
                 * KIND, either express or implied.  See the License for the
                 * specific language governing permissions and limitations
                 * under the License.
                 *
                 */

                var argscheck = require('cordova/argscheck'),
                    utils = require('cordova/utils'),
                    exec = require('cordova/exec'),
                    PositionError = require('./PositionError'),
                    Position = require('./Position');

                var timers = {}; // list of timers in use

                // Returns default params, overrides if provided with values
                function parseParameters(options) {
                    var opt = {
                        maximumAge: 0,
                        enableHighAccuracy: false,
                        timeout: Infinity
                    };

                    if (options) {
                        if (options.maximumAge !== undefined && !isNaN(options.maximumAge) && options.maximumAge > 0) {
                            opt.maximumAge = options.maximumAge;
                        }
                        if (options.enableHighAccuracy !== undefined) {
                            opt.enableHighAccuracy = options.enableHighAccuracy;
                        }
                        if (options.timeout !== undefined && !isNaN(options.timeout)) {
                            if (options.timeout < 0) {
                                opt.timeout = 0;
                            } else {
                                opt.timeout = options.timeout;
                            }
                        }
                    }

                    return opt;
                }

                // Returns a timeout failure, closed over a specified timeout value and error callback.
                function createTimeout(errorCallback, timeout) {
                    var t = setTimeout(function () {
                        clearTimeout(t);
                        t = null;
                        errorCallback({
                            code: PositionError.TIMEOUT,
                            message: "Position retrieval timed out."
                        });
                    }, timeout);
                    return t;
                }

                var geolocation = {
                    lastPosition: null, // reference to last known (cached) position returned
                    /**
                     * Asynchronously acquires the current position.
                     *
                     * @param {Function} successCallback    The function to call when the position data is available
                     * @param {Function} errorCallback      The function to call when there is an error getting the heading position. (OPTIONAL)
                     * @param {PositionOptions} options     The options for getting the position data. (OPTIONAL)
                     */
                    getCurrentPosition: function (successCallback, errorCallback, options) {
                        argscheck.checkArgs('fFO', 'geolocation.getCurrentPosition', arguments);
                        options = parseParameters(options);

                        // Timer var that will fire an error callback if no position is retrieved from native
                        // before the "timeout" param provided expires
                        var timeoutTimer = {
                            timer: null
                        };

                        var win = function (p) {
                            clearTimeout(timeoutTimer.timer);
                            if (!(timeoutTimer.timer)) {
                                // Timeout already happened, or native fired error callback for
                                // this geo request.
                                // Don't continue with success callback.
                                return;
                            }
                            var pos = new Position({
                                latitude: p.latitude,
                                longitude: p.longitude,
                                altitude: p.altitude,
                                accuracy: p.accuracy,
                                heading: p.heading,
                                velocity: p.velocity,
                                altitudeAccuracy: p.altitudeAccuracy
                            },
                                (p.timestamp === undefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
                            );
                            geolocation.lastPosition = pos;
                            successCallback(pos);
                        };
                        var fail = function (e) {
                            clearTimeout(timeoutTimer.timer);
                            timeoutTimer.timer = null;
                            var err = new PositionError(e.code, e.message);
                            if (errorCallback) {
                                errorCallback(err);
                            }
                        };

                        // Check our cached position, if its timestamp difference with current time is less than the maximumAge, then just
                        // fire the success callback with the cached position.
                        if (geolocation.lastPosition && options.maximumAge && (((new Date()).getTime() - geolocation.lastPosition.timestamp.getTime()) <= options.maximumAge)) {
                            successCallback(geolocation.lastPosition);
                            // If the cached position check failed and the timeout was set to 0, error out with a TIMEOUT error object.
                        } else if (options.timeout === 0) {
                            fail({
                                code: PositionError.TIMEOUT,
                                message: "timeout value in PositionOptions set to 0 and no cached Position object available, or cached Position object's age exceeds provided PositionOptions' maximumAge parameter."
                            });
                            // Otherwise we have to call into native to retrieve a position.
                        } else {
                            if (options.timeout !== Infinity) {
                                // If the timeout value was not set to Infinity (default), then
                                // set up a timeout function that will fire the error callback
                                // if no successful position was retrieved before timeout expired.
                                timeoutTimer.timer = createTimeout(fail, options.timeout);
                            } else {
                                // This is here so the check in the win function doesn't mess stuff up
                                // may seem weird but this guarantees timeoutTimer is
                                // always truthy before we call into native
                                timeoutTimer.timer = true;
                            }
                            exec(win, fail, "Geolocation", "getLocation", [options.enableHighAccuracy, options.maximumAge]);
                        }
                        return timeoutTimer;
                    },
                    /**
                     * Asynchronously watches the geolocation for changes to geolocation.  When a change occurs,
                     * the successCallback is called with the new location.
                     *
                     * @param {Function} successCallback    The function to call each time the location data is available
                     * @param {Function} errorCallback      The function to call when there is an error getting the location data. (OPTIONAL)
                     * @param {PositionOptions} options     The options for getting the location data such as frequency. (OPTIONAL)
                     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
                     */
                    watchPosition: function (successCallback, errorCallback, options) {
                        argscheck.checkArgs('fFO', 'geolocation.getCurrentPosition', arguments);
                        options = parseParameters(options);

                        var id = utils.createUUID();

                        // Tell device to get a position ASAP, and also retrieve a reference to the timeout timer generated in getCurrentPosition
                        timers[id] = geolocation.getCurrentPosition(successCallback, errorCallback, options);

                        var fail = function (e) {
                            clearTimeout(timers[id].timer);
                            var err = new PositionError(e.code, e.message);
                            if (errorCallback) {
                                errorCallback(err);
                            }
                        };

                        var win = function (p) {
                            clearTimeout(timers[id].timer);
                            if (options.timeout !== Infinity) {
                                timers[id].timer = createTimeout(fail, options.timeout);
                            }
                            var pos = new Position({
                                latitude: p.latitude,
                                longitude: p.longitude,
                                altitude: p.altitude,
                                accuracy: p.accuracy,
                                heading: p.heading,
                                velocity: p.velocity,
                                altitudeAccuracy: p.altitudeAccuracy
                            },
                                (p.timestamp === undefined ? new Date() : ((p.timestamp instanceof Date) ? p.timestamp : new Date(p.timestamp)))
                            );
                            geolocation.lastPosition = pos;
                            successCallback(pos);
                        };

                        exec(win, fail, "Geolocation", "addWatch", [id, options.enableHighAccuracy]);

                        return id;
                    },
                    /**
                     * Clears the specified heading watch.
                     *
                     * @param {String} id       The ID of the watch returned from #watchPosition
                     */
                    clearWatch: function (id) {
                        if (id && timers[id] !== undefined) {
                            clearTimeout(timers[id].timer);
                            timers[id].timer = false;
                            exec(null, null, "Geolocation", "clearWatch", [id]);
                        }
                    }
                };

                module.exports = geolocation;

            });
        }

        //https://github.com/litehelpers/Cordova-sqlite-storage
        //Sqlite storage with sandbox modification
        cordova.define("cordova-sqlite-storage.SQLitePlugin", function (require, exports, module) {
            (function () {
                var DB_STATE_INIT, DB_STATE_OPEN, READ_ONLY_REGEX, SQLiteFactory, SQLitePlugin, SQLitePluginTransaction, argsArray, dblocations, newSQLError, nextTick, root, txLocks;

                root = this;

                READ_ONLY_REGEX = /^\s*(?:drop|delete|insert|update|create)\s/i;

                DB_STATE_INIT = "INIT";

                DB_STATE_OPEN = "OPEN";

                txLocks = {};

                newSQLError = function (error, code) {
                    var sqlError;
                    sqlError = error;
                    if (!code) {
                        code = 0;
                    }
                    if (!sqlError) {
                        sqlError = new Error("a plugin had an error but provided no response");
                        sqlError.code = code;
                    }
                    if (typeof sqlError === "string") {
                        sqlError = new Error(error);
                        sqlError.code = code;
                    }
                    if (!sqlError.code && sqlError.message) {
                        sqlError.code = code;
                    }
                    if (!sqlError.code && !sqlError.message) {
                        sqlError = new Error("an unknown error was returned: " + JSON.stringify(sqlError));
                        sqlError.code = code;
                    }
                    return sqlError;
                };

                nextTick = window.setImmediate || function (fun) {
                    window.setTimeout(fun, 0);
                };


                /*
                  Utility that avoids leaking the arguments object. See
                  https://www.npmjs.org/package/argsarray
                 */

                argsArray = function (fun) {
                    return function () {
                        var args, i, len;
                        len = arguments.length;
                        if (len) {
                            args = [];
                            i = -1;
                            while (++i < len) {
                                args[i] = arguments[i];
                            }
                            return fun.call(this, args);
                        } else {
                            return fun.call(this, []);
                        }
                    };
                };

                SQLitePlugin = function (openargs, openSuccess, openError) {
                    var dbname;
                    if (!(openargs && openargs['name'])) {
                        throw newSQLError("Cannot create a SQLitePlugin db instance without a db name");
                    }
                    dbname = openargs.name;
                    if (typeof dbname !== 'string') {
                        throw newSQLError('sqlite plugin database name must be a string');
                    }
                    this.openargs = openargs;
                    this.dbname = dbname;
                    this.openSuccess = openSuccess;
                    this.openError = openError;
                    this.openSuccess || (this.openSuccess = function () {
                        console.log("DB opened: " + dbname);
                    });
                    this.openError || (this.openError = function (e) {
                        console.log(e.message);
                    });
                    this.open(this.openSuccess, this.openError);
                };

                SQLitePlugin.prototype.databaseFeatures = {
                    isSQLitePluginDatabase: true
                };

                SQLitePlugin.prototype.openDBs = {};

                SQLitePlugin.prototype.addTransaction = function (t) {
                    if (!txLocks[this.dbname]) {
                        txLocks[this.dbname] = {
                            queue: [],
                            inProgress: false
                        };
                    }
                    txLocks[this.dbname].queue.push(t);
                    if (this.dbname in this.openDBs && this.openDBs[this.dbname] !== DB_STATE_INIT) {
                        this.startNextTransaction();
                    } else {
                        if (this.dbname in this.openDBs) {
                            console.log('new transaction is waiting for open operation');
                        } else {
                            console.log('database is closed, new transaction is [stuck] waiting until db is opened again!');
                        }
                    }
                };

                SQLitePlugin.prototype.transaction = function (fn, error, success) {
                    if (!this.openDBs[this.dbname]) {
                        error(newSQLError('database not open'));
                        return;
                    }
                    this.addTransaction(new SQLitePluginTransaction(this, fn, error, success, true, false));
                };

                SQLitePlugin.prototype.readTransaction = function (fn, error, success) {
                    if (!this.openDBs[this.dbname]) {
                        error(newSQLError('database not open'));
                        return;
                    }
                    this.addTransaction(new SQLitePluginTransaction(this, fn, error, success, false, true));
                };

                SQLitePlugin.prototype.startNextTransaction = function () {
                    var self;
                    self = this;
                    nextTick((function (_this) {
                        return function () {
                            var txLock;
                            if (!(_this.dbname in _this.openDBs) || _this.openDBs[_this.dbname] !== DB_STATE_OPEN) {
                                console.log('cannot start next transaction: database not open');
                                return;
                            }
                            txLock = txLocks[self.dbname];
                            if (!txLock) {
                                console.log('cannot start next transaction: database connection is lost');
                                return;
                            } else if (txLock.queue.length > 0 && !txLock.inProgress) {
                                txLock.inProgress = true;
                                txLock.queue.shift().start();
                            }
                        };
                    })(this));
                };

                SQLitePlugin.prototype.abortAllPendingTransactions = function () {
                    var j, len1, ref, tx, txLock;
                    txLock = txLocks[this.dbname];
                    if (!!txLock && txLock.queue.length > 0) {
                        ref = txLock.queue;
                        for (j = 0, len1 = ref.length; j < len1; j++) {
                            tx = ref[j];
                            tx.abortFromQ(newSQLError('Invalid database handle'));
                        }
                        txLock.queue = [];
                        txLock.inProgress = false;
                    }
                };

                SQLitePlugin.prototype.open = function (success, error) {
                    var openerrorcb, opensuccesscb;
                    if (this.dbname in this.openDBs) {
                        console.log('database already open: ' + this.dbname);
                        nextTick((function (_this) {
                            return function () {
                                success(_this);
                            };
                        })(this));
                    } else {
                        console.log('OPEN database: ' + this.dbname);
                        opensuccesscb = (function (_this) {
                            return function () {
                                var txLock;
                                if (!_this.openDBs[_this.dbname]) {
                                    console.log('database was closed during open operation');
                                }
                                if (_this.dbname in _this.openDBs) {
                                    _this.openDBs[_this.dbname] = DB_STATE_OPEN;
                                }
                                if (!!success) {
                                    success(_this);
                                }
                                txLock = txLocks[_this.dbname];
                                if (!!txLock && txLock.queue.length > 0 && !txLock.inProgress) {
                                    _this.startNextTransaction();
                                }
                            };
                        })(this);
                        openerrorcb = (function (_this) {
                            return function () {
                                console.log('OPEN database: ' + _this.dbname + ' failed, aborting any pending transactions');
                                if (!!error) {
                                    error(newSQLError('Could not open database'));
                                }
                                delete _this.openDBs[_this.dbname];
                                _this.abortAllPendingTransactions();
                            };
                        })(this);
                        this.openDBs[this.dbname] = DB_STATE_INIT;
                        cordova.exec(opensuccesscb, openerrorcb, "SQLitePlugin", "open", [this.openargs]);
                    }
                };

                SQLitePlugin.prototype.close = function (success, error) {
                    if (this.dbname in this.openDBs) {
                        if (txLocks[this.dbname] && txLocks[this.dbname].inProgress) {
                            console.log('cannot close: transaction is in progress');
                            error(newSQLError('database cannot be closed while a transaction is in progress'));
                            return;
                        }
                        console.log('CLOSE database: ' + this.dbname);
                        delete this.openDBs[this.dbname];
                        if (txLocks[this.dbname]) {
                            console.log('closing db with transaction queue length: ' + txLocks[this.dbname].queue.length);
                        } else {
                            console.log('closing db with no transaction lock state');
                        }
                        cordova.exec(success, error, "SQLitePlugin", "close", [{
                            path: this.dbname
                        }]);
                    } else {
                        console.log('cannot close: database is not open');
                        if (error) {
                            nextTick(function () {
                                return error();
                            });
                        }
                    }
                };

                SQLitePlugin.prototype.executeSql = function (statement, params, success, error) {
                    var myerror, myfn, mysuccess;
                    mysuccess = function (t, r) {
                        if (!!success) {
                            return success(r);
                        }
                    };
                    myerror = function (t, e) {
                        if (!!error) {
                            return error(e);
                        }
                    };
                    myfn = function (tx) {
                        tx.addStatement(statement, params, mysuccess, myerror);
                    };
                    this.addTransaction(new SQLitePluginTransaction(this, myfn, null, null, false, false));
                };

                SQLitePlugin.prototype.sqlBatch = function (sqlStatements, success, error) {
                    var batchList, j, len1, myfn, st;
                    if (!sqlStatements || sqlStatements.constructor !== Array) {
                        throw newSQLError('sqlBatch expects an array');
                    }
                    batchList = [];
                    for (j = 0, len1 = sqlStatements.length; j < len1; j++) {
                        st = sqlStatements[j];
                        if (st.constructor === Array) {
                            if (st.length === 0) {
                                throw newSQLError('sqlBatch array element of zero (0) length');
                            }
                            batchList.push({
                                sql: st[0],
                                params: st.length === 0 ? [] : st[1]
                            });
                        } else {
                            batchList.push({
                                sql: st,
                                params: []
                            });
                        }
                    }
                    myfn = function (tx) {
                        var elem, k, len2, results;
                        results = [];
                        for (k = 0, len2 = batchList.length; k < len2; k++) {
                            elem = batchList[k];
                            results.push(tx.addStatement(elem.sql, elem.params, null, null));
                        }
                        return results;
                    };
                    this.addTransaction(new SQLitePluginTransaction(this, myfn, error, success, true, false));
                };

                SQLitePluginTransaction = function (db, fn, error, success, txlock, readOnly) {
                    if (typeof fn !== "function") {

                        /*
                        This is consistent with the implementation in Chrome -- it
                        throws if you pass anything other than a function. This also
                        prevents us from stalling our txQueue if somebody passes a
                        false value for fn.
                         */
                        throw newSQLError("transaction expected a function");
                    }
                    this.db = db;
                    this.fn = fn;
                    this.error = error;
                    this.success = success;
                    this.txlock = txlock;
                    this.readOnly = readOnly;
                    this.executes = [];
                    if (txlock) {
                        this.addStatement("BEGIN", [], null, function (tx, err) {
                            throw newSQLError("unable to begin transaction: " + err.message, err.code);
                        });
                    }
                };

                SQLitePluginTransaction.prototype.start = function () {
                    var err, error1;
                    try {
                        this.fn(this);
                        this.run();
                    } catch (error1) {
                        err = error1;
                        txLocks[this.db.dbname].inProgress = false;
                        this.db.startNextTransaction();
                        if (this.error) {
                            this.error(newSQLError(err));
                        }
                    }
                };

                SQLitePluginTransaction.prototype.executeSql = function (sql, values, success, error) {
                    if (this.finalized) {
                        throw {
                            message: 'InvalidStateError: DOM Exception 11: This transaction is already finalized. Transactions are committed after its success or failure handlers are called. If you are using a Promise to handle callbacks, be aware that implementations following the A+ standard adhere to run-to-completion semantics and so Promise resolution occurs on a subsequent tick and therefore after the transaction commits.',
                            code: 11
                        };
                        return;
                    }
                    if (this.readOnly && READ_ONLY_REGEX.test(sql)) {
                        this.handleStatementFailure(error, {
                            message: 'invalid sql for a read-only transaction'
                        });
                        return;
                    }
                    this.addStatement(sql, values, success, error);
                };

                SQLitePluginTransaction.prototype.addStatement = function (sql, values, success, error) {
                    var j, len1, params, t, v;
                    params = [];
                    if (!!values && values.constructor === Array) {
                        for (j = 0, len1 = values.length; j < len1; j++) {
                            v = values[j];
                            t = typeof v;
                            params.push((v === null || v === void 0 || t === 'number' || t === 'string' ? v : v instanceof Blob ? v.valueOf() : v.toString()));
                        }
                    }
                    this.executes.push({
                        success: success,
                        error: error,
                        sql: sql,
                        params: params
                    });
                };

                SQLitePluginTransaction.prototype.handleStatementSuccess = function (handler, response) {
                    var payload, rows;
                    if (!handler) {
                        return;
                    }
                    rows = response.rows || [];
                    payload = {
                        rows: {
                            item: function (i) {
                                return rows[i];
                            },
                            length: rows.length
                        },
                        rowsAffected: response.rowsAffected || 0,
                        insertId: response.insertId || void 0
                    };
                    handler(this, payload);
                };

                SQLitePluginTransaction.prototype.handleStatementFailure = function (handler, response) {
                    if (!handler) {
                        throw newSQLError("a statement with no error handler failed: " + response.message, response.code);
                    }
                    if (handler(this, response) !== false) {
                        throw newSQLError("a statement error callback did not return false: " + response.message, response.code);
                    }
                };

                SQLitePluginTransaction.prototype.run = function () {
                    var batchExecutes, handlerFor, i, mycb, mycbmap, request, tropts, tx, txFailure, waiting;
                    txFailure = null;
                    tropts = [];
                    batchExecutes = this.executes;
                    waiting = batchExecutes.length;
                    this.executes = [];
                    tx = this;
                    handlerFor = function (index, didSucceed) {
                        return function (response) {
                            var err, error1;
                            try {
                                if (didSucceed) {
                                    tx.handleStatementSuccess(batchExecutes[index].success, response);
                                } else {
                                    tx.handleStatementFailure(batchExecutes[index].error, newSQLError(response));
                                }
                            } catch (error1) {
                                err = error1;
                                if (!txFailure) {
                                    txFailure = newSQLError(err);
                                }
                            }
                            if (--waiting === 0) {
                                if (txFailure) {
                                    tx.abort(txFailure);
                                } else if (tx.executes.length > 0) {
                                    tx.run();
                                } else {
                                    tx.finish();
                                }
                            }
                        };
                    };
                    i = 0;
                    mycbmap = {};
                    while (i < batchExecutes.length) {
                        request = batchExecutes[i];
                        mycbmap[i] = {
                            success: handlerFor(i, true),
                            error: handlerFor(i, false)
                        };
                        tropts.push({
                            qid: 1111,
                            sql: request.sql,
                            params: request.params
                        });
                        i++;
                    }
                    mycb = function (result) {
                        var j, last, q, r, ref, res, type;
                        last = result.length - 1;
                        for (i = j = 0, ref = last; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
                            r = result[i];
                            type = r.type;
                            res = r.result;
                            q = mycbmap[i];
                            if (q) {
                                if (q[type]) {
                                    q[type](res);
                                }
                            }
                        }
                    };
                    cordova.exec(mycb, null, "SQLitePlugin", "backgroundExecuteSqlBatch", [{
                        dbargs: {
                            dbname: this.db.dbname
                        },
                        executes: tropts
                    }]);
                };

                SQLitePluginTransaction.prototype.abort = function (txFailure) {
                    var failed, succeeded, tx;
                    if (this.finalized) {
                        return;
                    }
                    tx = this;
                    succeeded = function (tx) {
                        txLocks[tx.db.dbname].inProgress = false;
                        tx.db.startNextTransaction();
                        if (tx.error) {
                            tx.error(txFailure);
                        }
                    };
                    failed = function (tx, err) {
                        txLocks[tx.db.dbname].inProgress = false;
                        tx.db.startNextTransaction();
                        if (tx.error) {
                            tx.error(newSQLError("error while trying to roll back: " + err.message, err.code));
                        }
                    };
                    this.finalized = true;
                    if (this.txlock) {
                        this.addStatement("ROLLBACK", [], succeeded, failed);
                        this.run();
                    } else {
                        succeeded(tx);
                    }
                };

                SQLitePluginTransaction.prototype.finish = function () {
                    var failed, succeeded, tx;
                    if (this.finalized) {
                        return;
                    }
                    tx = this;
                    succeeded = function (tx) {
                        txLocks[tx.db.dbname].inProgress = false;
                        tx.db.startNextTransaction();
                        if (tx.success) {
                            tx.success();
                        }
                    };
                    failed = function (tx, err) {
                        txLocks[tx.db.dbname].inProgress = false;
                        tx.db.startNextTransaction();
                        if (tx.error) {
                            tx.error(newSQLError("error while trying to commit: " + err.message, err.code));
                        }
                    };
                    this.finalized = true;
                    if (this.txlock) {
                        this.addStatement("COMMIT", [], succeeded, failed);
                        this.run();
                    } else {
                        succeeded(tx);
                    }
                };

                SQLitePluginTransaction.prototype.abortFromQ = function (sqlerror) {
                    if (this.error) {
                        this.error(sqlerror);
                    }
                };

                dblocations = ["docs", "libs", "nosync"];

                SQLiteFactory = {

                    /*
                    NOTE: this function should NOT be translated from Javascript
                    back to CoffeeScript by js2coffee.
                    If this function is edited in Javascript then someone will
                    have to translate it back to CoffeeScript by hand.
                     */
                    opendb: argsArray(function (args) {
                        var dblocation, errorcb, first, okcb, openargs;
                        if (args.length < 1) {
                            return null;
                        }
                        first = args[0];
                        openargs = null;
                        okcb = null;
                        errorcb = null;
                        if (first.constructor === String) {
                            openargs = {
                                name: first
                            };
                            if (args.length >= 5) {
                                okcb = args[4];
                                if (args.length > 5) {
                                    errorcb = args[5];
                                }
                            }
                        } else {
                            openargs = first;
                            if (args.length >= 2) {
                                okcb = args[1];
                                if (args.length > 2) {
                                    errorcb = args[2];
                                }
                            }
                        }
                        dblocation = !!openargs.location ? dblocations[openargs.location] : null;
                        openargs.dblocation = dblocation || dblocations[0];
                        if (!!openargs.createFromLocation && openargs.createFromLocation === 1) {
                            openargs.createFromResource = "1";
                        }
                        if (!!openargs.androidDatabaseImplementation && openargs.androidDatabaseImplementation === 2) {
                            openargs.androidOldDatabaseImplementation = 1;
                        }
                        if (!!openargs.androidLockWorkaround && openargs.androidLockWorkaround === 1) {
                            openargs.androidBugWorkaround = 1;
                        }
                        return new SQLitePlugin(openargs, okcb, errorcb);
                    }),
                    deleteDb: function (first, success, error) {
                        var args, dblocation;
                        args = {};
                        if (first.constructor === String) {
                            args.path = first;
                            args.dblocation = dblocations[0];
                        } else {
                            if (!(first && first['name'])) {
                                throw new Error("Please specify db name");
                            }
                            args.path = first.name;
                            dblocation = !!first.location ? dblocations[first.location] : null;
                            args.dblocation = dblocation || dblocations[0];
                        }
                        delete SQLitePlugin.prototype.openDBs[args.path];
                        return cordova.exec(success, error, "SQLitePlugin", "delete", [args]);
                    }
                };

                root.sqlitePlugin = {
                    sqliteFeatures: {
                        isSQLitePlugin: true
                    },
                    echoTest: function (okcb, errorcb) {
                        var error, ok;
                        ok = function (s) {
                            if (s === 'test-string') {
                                return okcb();
                            } else {
                                return errorcb("Mismatch: got: '" + s + "' expected 'test-string'");
                            }
                        };
                        error = function (e) {
                            return errorcb(e);
                        };
                        return cordova.exec(okcb, errorcb, "SQLitePlugin", "echoStringValue", [{
                            value: 'test-string'
                        }]);
                    },
                    openDatabase: SQLiteFactory.opendb,
                    deleteDatabase: SQLiteFactory.deleteDb
                };

            }).call(this);
        });

        //Ionic Keyboard
        //https://github.com/driftyco/ionic-plugin-keyboard
        cordova.define("ionic-plugin-keyboard.iOS", function (require, exports, module) {
            var argscheck = require('cordova/argscheck'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec');


            var Keyboard = function () { };

            Keyboard.hideKeyboardAccessoryBar = function (hide) {
                // exec(null, null, "Keyboard", "hideKeyboardAccessoryBar", [hide]);
                console.warn('hideKeyboardAccessoryBar has been removed until a method is found that doesn\'t get rejected from the App Store.')
            };

            Keyboard.close = function () {
                exec(null, null, "Keyboard", "close", []);
            };

            Keyboard.show = function () {
                console.warn('Showing keyboard not supported in iOS due to platform limitations.')
                console.warn('Instead, use input.focus(), and ensure that you have the following setting in your config.xml: \n');
                console.warn('    <preference name="KeyboardDisplayRequiresUserAction" value="false"/>\n');
                // exec(null, null, "Keyboard", "show", []);
            };

            Keyboard.disableScroll = function (disable) {
                exec(null, null, "Keyboard", "disableScroll", [disable]);
            };

            /*
            Keyboard.styleDark = function(dark) {
            exec(null, null, "Keyboard", "styleDark", [dark]);
            };
            */

            Keyboard.isVisible = false;

            module.exports = Keyboard;
        });
        cordova.define("ionic-plugin-keyboard.Android", function (require, exports, module) {
            var argscheck = require('cordova/argscheck'),
                utils = require('cordova/utils'),
                exec = require('cordova/exec'),
                channel = require('cordova/channel');


            var Keyboard = function () { };

            Keyboard.hideKeyboardAccessoryBar = function (hide) {
                exec(null, null, "Keyboard", "hideKeyboardAccessoryBar", [hide]);
            };

            Keyboard.close = function () {
                exec(null, null, "Keyboard", "close", []);
            };

            Keyboard.show = function () {
                exec(null, null, "Keyboard", "show", []);
            };

            Keyboard.disableScroll = function (disable) {
                exec(null, null, "Keyboard", "disableScroll", [disable]);
            };

            /*
            Keyboard.styleDark = function(dark) {
            exec(null, null, "Keyboard", "styleDark", [dark]);
            };
            */

            Keyboard.isVisible = false;

            channel.onCordovaReady.subscribe(function () {
                exec(success, null, 'Keyboard', 'init', []);

                function success(msg) {
                    var action = msg.charAt(0);
                    if (action === 'S') {
                        var keyboardHeight = msg.substr(1);
                        cordova.plugins.Keyboard.isVisible = true;
                        cordova.fireWindowEvent('native.keyboardshow', {
                            'keyboardHeight': +keyboardHeight
                        });

                        //deprecated
                        cordova.fireWindowEvent('native.showkeyboard', {
                            'keyboardHeight': +keyboardHeight
                        });
                    } else if (action === 'H') {
                        cordova.plugins.Keyboard.isVisible = false;
                        cordova.fireWindowEvent('native.keyboardhide');

                        //deprecated
                        cordova.fireWindowEvent('native.hidekeyboard');
                    }
                }
            });

            module.exports = Keyboard;
        });

        //Local notification: https://github.com/katzer/cordova-plugin-local-notifications
        cordova.define("de.appplant.cordova.plugin.local-notification.LocalNotification", function (require, exports, module) {
            /*
             * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
             *
             * @APPPLANT_LICENSE_HEADER_START@
             *
             * This file contains Original Code and/or Modifications of Original Code
             * as defined in and that are subject to the Apache License
             * Version 2.0 (the 'License'). You may not use this file except in
             * compliance with the License. Please obtain a copy of the License at
             * http://opensource.org/licenses/Apache-2.0/ and read it before using this
             * file.
             *
             * The Original Code and all software distributed under the License are
             * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
             * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
             * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
             * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
             * Please see the License for the specific language governing rights and
             * limitations under the License.
             *
             * @APPPLANT_LICENSE_HEADER_END@
             */


            /*************
             * INTERFACE *
             *************/

            /**
             * Returns the default settings.
             *
             * @return {Object}
             */
            exports.getDefaults = function () {
                return this.core.getDefaults();
            };

            /**
             * Overwrite default settings.
             *
             * @param {Object} defaults
             */
            exports.setDefaults = function (defaults) {
                this.core.setDefaults(defaults);
            };

            /**
             * Schedule a new local notification.
             *
             * @param {Object} notifications
             *      The notification properties
             * @param {Function} callback
             *      A function to be called after the notification has been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             * @param {Object?} args
             *      skipPermission:true schedules the notifications immediatly without
             *                          registering or checking for permission
             */
            exports.schedule = function (notifications, callback, scope, args) {
                this.core.schedule(notifications, callback, scope, args);
            };

            /**
             * Update existing notifications specified by IDs in options.
             *
             * @param {Object} notifications
             *      The notification properties to update
             * @param {Function} callback
             *      A function to be called after the notification has been updated
             * @param {Object?} scope
             *      The scope for the callback function
             * @param {Object?} args
             *      skipPermission:true schedules the notifications immediatly without
             *                          registering or checking for permission
             */
            exports.update = function (notifications, callback, scope, args) {
                this.core.update(notifications, callback, scope, args);
            };

            /**
             * Clear the specified notification.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A function to be called after the notification has been cleared
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.clear = function (ids, callback, scope) {
                this.core.clear(ids, callback, scope);
            };

            /**
             * Clear all previously sheduled notifications.
             *
             * @param {Function} callback
             *      A function to be called after all notifications have been cleared
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.clearAll = function (callback, scope) {
                this.core.clearAll(callback, scope);
            };

            /**
             * Cancel the specified notifications.
             *
             * @param {String[]} ids
             *      The IDs of the notifications
             * @param {Function} callback
             *      A function to be called after the notifications has been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.cancel = function (ids, callback, scope) {
                this.core.cancel(ids, callback, scope);
            };

            /**
             * Remove all previously registered notifications.
             *
             * @param {Function} callback
             *      A function to be called after all notifications have been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.cancelAll = function (callback, scope) {
                this.core.cancelAll(callback, scope);
            };

            /**
             * Check if a notification with an ID is present.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isPresent = function (id, callback, scope) {
                this.core.isPresent(id, callback, scope);
            };

            /**
             * Check if a notification with an ID is scheduled.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isScheduled = function (id, callback, scope) {
                this.core.isScheduled(id, callback, scope);
            };

            /**
             * Check if a notification with an ID was triggered.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isTriggered = function (id, callback, scope) {
                this.core.isTriggered(id, callback, scope);
            };

            /**
             * List all local notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllIds = function (callback, scope) {
                this.core.getAllIds(callback, scope);
            };

            /**
             * Alias for `getAllIds`.
             */
            exports.getIds = function () {
                this.getAllIds.apply(this, arguments);
            };

            /**
             * List all scheduled notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getScheduledIds = function (callback, scope) {
                this.core.getScheduledIds(callback, scope);
            };

            /**
             * List all triggered notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getTriggeredIds = function (callback, scope) {
                this.core.getTriggeredIds(callback, scope);
            };

            /**
             * Property list for given local notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.get = function () {
                this.core.get.apply(this.core, arguments);
            };

            /**
             * Property list for all local notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAll = function (callback, scope) {
                this.core.getAll(callback, scope);
            };

            /**
             * Property list for given scheduled notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getScheduled = function () {
                this.core.getScheduled.apply(this.core, arguments);
            };

            /**
             * Property list for all scheduled notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllScheduled = function (callback, scope) {
                this.core.getAllScheduled(callback, scope);
            };

            /**
             * Property list for given triggered notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getTriggered = function () {
                this.core.getTriggered.apply(this.core, arguments);
            };

            /**
             * Property list for all triggered notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllTriggered = function (callback, scope) {
                this.core.getAllTriggered(callback, scope);
            };

            /**
             * Informs if the app has the permission to show notifications.
             *
             * @param {Function} callback
             *      The function to be exec as the callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.hasPermission = function (callback, scope) {
                this.core.hasPermission(callback, scope);
            };

            /**
             * Register permission to show notifications if not already granted.
             *
             * @param {Function} callback
             *      The function to be exec as the callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.registerPermission = function (callback, scope) {
                this.core.registerPermission(callback, scope);
            };


            /****************
             * DEPRECATIONS *
             ****************/

            /**
             * Schedule a new local notification.
             */
            exports.add = function () {
                console.warn('Depreated: Please use `notification.local.schedule` instead.');

                this.schedule.apply(this, arguments);
            };

            /**
             * Register permission to show notifications
             * if not already granted.
             */
            exports.promptForPermission = function () {
                console.warn('Depreated: Please use `notification.local.registerPermission` instead.');

                this.registerPermission.apply(this, arguments);
            };


            /**********
             * EVENTS *
             **********/

            /**
             * Register callback for given event.
             *
             * @param {String} event
             *      The event's name
             * @param {Function} callback
             *      The function to be exec as callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.on = function (event, callback, scope) {
                this.core.on(event, callback, scope);
            };

            /**
             * Unregister callback for given event.
             *
             * @param {String} event
             *      The event's name
             * @param {Function} callback
             *      The function to be exec as callback
             */
            exports.un = function (event, callback) {
                this.core.un(event, callback);
            };

        });
        cordova.define("de.appplant.cordova.plugin.local-notification.LocalNotification.Core", function (require, exports, module) {
            /*
             * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
             *
             * @APPPLANT_LICENSE_HEADER_START@
             *
             * This file contains Original Code and/or Modifications of Original Code
             * as defined in and that are subject to the Apache License
             * Version 2.0 (the 'License'). You may not use this file except in
             * compliance with the License. Please obtain a copy of the License at
             * http://opensource.org/licenses/Apache-2.0/ and read it before using this
             * file.
             *
             * The Original Code and all software distributed under the License are
             * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
             * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
             * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
             * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
             * Please see the License for the specific language governing rights and
             * limitations under the License.
             *
             * @APPPLANT_LICENSE_HEADER_END@
             */

            var exec = require('cordova/exec');


            /********
             * CORE *
             ********/

            /**
             * Returns the default settings.
             *
             * @return {Object}
             */
            exports.getDefaults = function () {
                return this._defaults;
            };

            /**
             * Overwrite default settings.
             *
             * @param {Object} defaults
             */
            exports.setDefaults = function (newDefaults) {
                var defaults = this.getDefaults();

                for (var key in defaults) {
                    if (newDefaults.hasOwnProperty(key)) {
                        defaults[key] = newDefaults[key];
                    }
                }
            };

            /**
             * Schedule a new local notification.
             *
             * @param {Object} msgs
             *      The notification properties
             * @param {Function} callback
             *      A function to be called after the notification has been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             * @param {Object?} args
             *      skipPermission:true schedules the notifications immediatly without
             *                          registering or checking for permission
             */
            exports.schedule = function (msgs, callback, scope, args) {
                var fn = function (granted) {

                    if (!granted) return;

                    var notifications = Array.isArray(msgs) ? msgs : [msgs];

                    for (var i = 0; i < notifications.length; i++) {
                        var notification = notifications[i];

                        this.mergeWithDefaults(notification);
                        this.convertProperties(notification);
                    }

                    this.exec('schedule', notifications, callback, scope);
                };

                if (args && args.skipPermission) {
                    fn.call(this, true);
                } else {
                    this.registerPermission(fn, this);
                }
            };

            /**
             * Update existing notifications specified by IDs in options.
             *
             * @param {Object} notifications
             *      The notification properties to update
             * @param {Function} callback
             *      A function to be called after the notification has been updated
             * @param {Object?} scope
             *      The scope for the callback function
             * @param {Object?} args
             *      skipPermission:true schedules the notifications immediatly without
             *                          registering or checking for permission
             */
            exports.update = function (msgs, callback, scope, args) {
                var fn = function (granted) {

                    if (!granted) return;

                    var notifications = Array.isArray(msgs) ? msgs : [msgs];

                    for (var i = 0; i < notifications.length; i++) {
                        var notification = notifications[i];

                        this.convertProperties(notification);
                    }

                    this.exec('update', notifications, callback, scope);
                };

                if (args && args.skipPermission) {
                    fn.call(this, true);
                } else {
                    this.registerPermission(fn, this);
                }
            };

            /**
             * Clear the specified notification.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A function to be called after the notification has been cleared
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.clear = function (ids, callback, scope) {
                ids = Array.isArray(ids) ? ids : [ids];
                ids = this.convertIds(ids);

                this.exec('clear', ids, callback, scope);
            };

            /**
             * Clear all previously sheduled notifications.
             *
             * @param {Function} callback
             *      A function to be called after all notifications have been cleared
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.clearAll = function (callback, scope) {
                this.exec('clearAll', null, callback, scope);
            };

            /**
             * Cancel the specified notifications.
             *
             * @param {String[]} ids
             *      The IDs of the notifications
             * @param {Function} callback
             *      A function to be called after the notifications has been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.cancel = function (ids, callback, scope) {
                ids = Array.isArray(ids) ? ids : [ids];
                ids = this.convertIds(ids);

                this.exec('cancel', ids, callback, scope);
            };

            /**
             * Remove all previously registered notifications.
             *
             * @param {Function} callback
             *      A function to be called after all notifications have been canceled
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.cancelAll = function (callback, scope) {
                this.exec('cancelAll', null, callback, scope);
            };

            /**
             * Check if a notification with an ID is present.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isPresent = function (id, callback, scope) {
                this.exec('isPresent', id || 0, callback, scope);
            };

            /**
             * Check if a notification with an ID is scheduled.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isScheduled = function (id, callback, scope) {
                this.exec('isScheduled', id || 0, callback, scope);
            };

            /**
             * Check if a notification with an ID was triggered.
             *
             * @param {String} id
             *      The ID of the notification
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.isTriggered = function (id, callback, scope) {
                this.exec('isTriggered', id || 0, callback, scope);
            };

            /**
             * List all local notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllIds = function (callback, scope) {
                this.exec('getAllIds', null, callback, scope);
            };

            /**
             * Alias for `getAllIds`.
             */
            exports.getIds = function () {
                this.getAllIds.apply(this, arguments);
            };

            /**
             * List all scheduled notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getScheduledIds = function (callback, scope) {
                this.exec('getScheduledIds', null, callback, scope);
            };

            /**
             * List all triggered notification IDs.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getTriggeredIds = function (callback, scope) {
                this.exec('getTriggeredIds', null, callback, scope);
            };

            /**
             * Property list for given local notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.get = function () {
                var args = Array.apply(null, arguments);

                if (typeof args[0] == 'function') {
                    args.unshift([]);
                }

                var ids = args[0],
                    callback = args[1],
                    scope = args[2];

                if (!Array.isArray(ids)) {
                    this.exec('getSingle', Number(ids), callback, scope);
                    return;
                }

                ids = this.convertIds(ids);

                this.exec('getAll', ids, callback, scope);
            };

            /**
             * Property list for all local notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAll = function (callback, scope) {
                this.exec('getAll', null, callback, scope);
            };

            /**
             * Property list for given scheduled notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getScheduled = function () {
                var args = Array.apply(null, arguments);

                if (typeof args[0] == 'function') {
                    args.unshift([]);
                }

                var ids = args[0],
                    callback = args[1],
                    scope = args[2];

                if (!Array.isArray(ids)) {
                    ids = [ids];
                }

                if (!Array.isArray(ids)) {
                    this.exec('getSingleScheduled', Number(ids), callback, scope);
                    return;
                }

                ids = this.convertIds(ids);

                this.exec('getScheduled', ids, callback, scope);
            };

            /**
             * Property list for all scheduled notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllScheduled = function (callback, scope) {
                this.exec('getScheduled', null, callback, scope);
            };

            /**
             * Property list for given triggered notifications.
             * If called without IDs, all notification will be returned.
             *
             * @param {Number[]?} ids
             *      Set of notification IDs
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getTriggered = function () {
                var args = Array.apply(null, arguments);

                if (typeof args[0] == 'function') {
                    args.unshift([]);
                }

                var ids = args[0],
                    callback = args[1],
                    scope = args[2];

                if (!Array.isArray(ids)) {
                    ids = [ids];
                }

                if (!Array.isArray(ids)) {
                    this.exec('getSingleTriggered', Number(ids), callback, scope);
                    return;
                }

                ids = this.convertIds(ids);

                this.exec('getTriggered', ids, callback, scope);
            };

            /**
             * Property list for all triggered notifications.
             *
             * @param {Function} callback
             *      A callback function to be called with the list
             * @param {Object?} scope
             *      The scope for the callback function
             */
            exports.getAllTriggered = function (callback, scope) {
                this.exec('getTriggered', null, callback, scope);
            };

            /**
             * Informs if the app has the permission to show notifications.
             *
             * @param {Function} callback
             *      The function to be exec as the callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.hasPermission = function (callback, scope) {
                var fn = this.createCallbackFn(callback, scope);

                if (device.platform != 'iOS') {
                    fn(true);
                    return;
                }

                exec(fn, null, 'LocalNotification', 'hasPermission', []);
            };

            /**
             * Register permission to show notifications if not already granted.
             *
             * @param {Function} callback
             *      The function to be exec as the callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.registerPermission = function (callback, scope) {

                if (this._registered) {
                    return this.hasPermission(callback, scope);
                } else {
                    this._registered = true;
                }

                var fn = this.createCallbackFn(callback, scope);

                if (device.platform != 'iOS') {
                    fn(true);
                    return;
                }

                exec(fn, null, 'LocalNotification', 'registerPermission', []);
            };


            /**********
             * EVENTS *
             **********/

            /**
             * Register callback for given event.
             *
             * @param {String} event
             *      The event's name
             * @param {Function} callback
             *      The function to be exec as callback
             * @param {Object?} scope
             *      The callback function's scope
             */
            exports.on = function (event, callback, scope) {

                if (typeof callback !== "function")
                    return;

                if (!this._listener[event]) {
                    this._listener[event] = [];
                }

                var item = [callback, scope || window];

                this._listener[event].push(item);
            };

            /**
             * Unregister callback for given event.
             *
             * @param {String} event
             *      The event's name
             * @param {Function} callback
             *      The function to be exec as callback
             */
            exports.un = function (event, callback) {
                var listener = this._listener[event];

                if (!listener)
                    return;

                for (var i = 0; i < listener.length; i++) {
                    var fn = listener[i][0];

                    if (fn == callback) {
                        listener.splice(i, 1);
                        break;
                    }
                }
            };

        });
        cordova.define("de.appplant.cordova.plugin.local-notification.LocalNotification.Util", function (require, exports, module) {
            /*
             * Copyright (c) 2013-2015 by appPlant UG. All rights reserved.
             *
             * @APPPLANT_LICENSE_HEADER_START@
             *
             * This file contains Original Code and/or Modifications of Original Code
             * as defined in and that are subject to the Apache License
             * Version 2.0 (the 'License'). You may not use this file except in
             * compliance with the License. Please obtain a copy of the License at
             * http://opensource.org/licenses/Apache-2.0/ and read it before using this
             * file.
             *
             * The Original Code and all software distributed under the License are
             * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
             * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
             * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
             * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
             * Please see the License for the specific language governing rights and
             * limitations under the License.
             *
             * @APPPLANT_LICENSE_HEADER_END@
             */

            var exec = require('cordova/exec'),
                channel = require('cordova/channel');


            /***********
             * MEMBERS *
             ***********/

            // Default values
            exports._defaults = {
                text: '',
                title: '',
                sound: 'res://platform_default',
                badge: 0,
                id: 0,
                data: undefined,
                every: undefined,
                at: undefined
            };

            // listener
            exports._listener = {};

            // Registered permission flag
            exports._registered = false;


            /********
             * UTIL *
             ********/

            /**
             * Merge platform specific properties into the default ones.
             *
             * @return {Object}
             *      The default properties for the platform
             */
            exports.applyPlatformSpecificOptions = function () {
                var defaults = this._defaults;

                switch (device.platform) {
                    case 'Android':
                        defaults.icon = 'res://ic_popup_reminder';
                        defaults.smallIcon = undefined;
                        defaults.ongoing = false;
                        defaults.autoClear = true;
                        defaults.led = undefined;
                        defaults.color = undefined;
                        break;
                }

                return defaults;
            };

            /**
             * Merge custom properties with the default values.
             *
             * @param {Object} options
             *      Set of custom values
             *
             * @retrun {Object}
             *      The merged property list
             */
            exports.mergeWithDefaults = function (options) {
                var defaults = this.getDefaults();

                options.at = this.getValueFor(options, 'at', 'firstAt', 'date');
                options.text = this.getValueFor(options, 'text', 'message');
                options.data = this.getValueFor(options, 'data', 'json');

                if (defaults.hasOwnProperty('autoClear')) {
                    options.autoClear = this.getValueFor(options, 'autoClear', 'autoCancel');
                }

                if (options.autoClear !== true && options.ongoing) {
                    options.autoClear = false;
                }

                if (options.at === undefined || options.at === null) {
                    options.at = new Date();
                }

                for (var key in defaults) {
                    if (options[key] === null || options[key] === undefined) {
                        if (options.hasOwnProperty(key) && ['data', 'sound'].indexOf(key) > -1) {
                            options[key] = undefined;
                        } else {
                            options[key] = defaults[key];
                        }
                    }
                }

                for (key in options) {
                    if (!defaults.hasOwnProperty(key)) {
                        delete options[key];
                        console.warn('Unknown property: ' + key);
                    }
                }

                return options;
            };

            /**
             * Convert the passed values to their required type.
             *
             * @param {Object} options
             *      Set of custom values
             *
             * @retrun {Object}
             *      The converted property list
             */
            exports.convertProperties = function (options) {

                if (options.id) {
                    if (isNaN(options.id)) {
                        options.id = this.getDefaults().id;
                        console.warn('Id is not a number: ' + options.id);
                    } else {
                        options.id = Number(options.id);
                    }
                }

                if (options.title) {
                    options.title = options.title.toString();
                }

                if (options.text) {
                    options.text = options.text.toString();
                }

                if (options.badge) {
                    if (isNaN(options.badge)) {
                        options.badge = this.getDefaults().badge;
                        console.warn('Badge number is not a number: ' + options.id);
                    } else {
                        options.badge = Number(options.badge);
                    }
                }

                if (options.at) {
                    if (typeof options.at == 'object') {
                        options.at = options.at.getTime();
                    }

                    options.at = Math.round(options.at / 1000);
                }

                if (typeof options.data == 'object') {
                    options.data = JSON.stringify(options.data);
                }

                if (options.every) {
                    if (device.platform == 'iOS' && typeof options.every != 'string') {
                        options.every = this.getDefaults().every;
                        var warning = 'Every option is not a string: ' + options.id;
                        warning += '. Expects one of: second, minute, hour, day, week, ';
                        warning += 'month, year on iOS.';
                        console.warn(warning);
                    }
                }

                return options;
            };

            /**
             * Create callback, which will be executed within a specific scope.
             *
             * @param {Function} callbackFn
             *      The callback function
             * @param {Object} scope
             *      The scope for the function
             *
             * @return {Function}
             *      The new callback function
             */
            exports.createCallbackFn = function (callbackFn, scope) {

                if (typeof callbackFn != 'function')
                    return;

                return function () {
                    callbackFn.apply(scope || this, arguments);
                };
            };

            /**
             * Convert the IDs to numbers.
             *
             * @param {String/Number[]} ids
             *
             * @return Array of Numbers
             */
            exports.convertIds = function (ids) {
                var convertedIds = [];

                for (var i = 0; i < ids.length; i++) {
                    convertedIds.push(Number(ids[i]));
                }

                return convertedIds;
            };

            /**
             * First found value for the given keys.
             *
             * @param {Object} options
             *      Object with key-value properties
             * @param {String[]} keys*
             *      Key list
             */
            exports.getValueFor = function (options) {
                var keys = Array.apply(null, arguments).slice(1);

                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];

                    if (options.hasOwnProperty(key)) {
                        return options[key];
                    }
                }
            };

            /**
             * Fire event with given arguments.
             *
             * @param {String} event
             *      The event's name
             * @param {args*}
             *      The callback's arguments
             */
            exports.fireEvent = function (event) {
                var args = Array.apply(null, arguments).slice(1),
                    listener = this._listener[event];

                if (!listener)
                    return;

                for (var i = 0; i < listener.length; i++) {
                    var fn = listener[i][0],
                        scope = listener[i][1];

                    fn.apply(scope, args);
                }
            };

            /**
             * Execute the native counterpart.
             *
             * @param {String} action
             *      The name of the action
             * @param args[]
             *      Array of arguments
             * @param {Function} callback
             *      The callback function
             * @param {Object} scope
             *      The scope for the function
             */
            exports.exec = function (action, args, callback, scope) {
                var fn = this.createCallbackFn(callback, scope),
                    params = [];

                if (Array.isArray(args)) {
                    params = args;
                } else if (args) {
                    params.push(args);
                }

                exec(fn, null, 'LocalNotification', action, params);
            };


            /*********
             * HOOKS *
             *********/

            // Called after 'deviceready' event
            channel.deviceready.subscribe(function () {
                // Device is ready now, the listeners are registered
                // and all queued events can be executed.
                exec(null, null, 'LocalNotification', 'deviceready', []);
            });

            // Called before 'deviceready' event
            channel.onCordovaReady.subscribe(function () {
                // Device plugin is ready now
                channel.onCordovaInfoReady.subscribe(function () {
                    // Merge platform specifics into defaults
                    exports.applyPlatformSpecificOptions();
                });
            });

        });

        //Calendar Plugin: https://github.com/dronahq/Calendar-PhoneGap-Plugin
        cordova.define("cordova-plugin-calendar.Calendar", function (require, exports, module) {
            "use strict";

            function Calendar() { }

            Calendar.prototype.getCreateCalendarOptions = function () {
                return {
                    calendarName: null,
                    calendarColor: null // optional, the OS will choose one if left empty, example: pass "#FF0000" for red
                };
            };

            Calendar.prototype.hasReadPermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "hasReadPermission", []);
            };

            Calendar.prototype.requestReadPermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "requestReadPermission", []);
            };

            Calendar.prototype.hasWritePermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "hasWritePermission", []);
            };

            Calendar.prototype.requestWritePermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "requestWritePermission", []);
            };

            Calendar.prototype.hasReadWritePermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "hasReadWritePermission", []);
            };

            Calendar.prototype.requestReadWritePermission = function (callback) {
                cordova.exec(callback, null, "Calendar", "requestReadWritePermission", []);
            };

            Calendar.prototype.createCalendar = function (calendarNameOrOptionsObject, successCallback, errorCallback) {
                var options;
                if (typeof calendarNameOrOptionsObject == "string") {
                    options = {
                        "calendarName": calendarNameOrOptionsObject
                    };
                } else {
                    options = calendarNameOrOptionsObject;
                }
                // merge passed options with defaults
                var mergedOptions = Calendar.prototype.getCreateCalendarOptions();
                for (var val in options) {
                    if (options.hasOwnProperty(val)) {
                        mergedOptions[val] = options[val];
                    }
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "createCalendar", [mergedOptions]);
            };

            Calendar.prototype.deleteCalendar = function (calendarName, successCallback, errorCallback) {
                cordova.exec(successCallback, errorCallback, "Calendar", "deleteCalendar", [{
                    "calendarName": calendarName
                }]);
            };

            Calendar.prototype.openCalendar = function (date, successCallback, errorCallback) {
                // default: today
                if (!(date instanceof Date)) {
                    date = new Date();
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "openCalendar", [{
                    "date": date.getTime()
                }]);
            };

            Calendar.prototype.getCalendarOptions = function () {
                return {
                    firstReminderMinutes: 60,
                    secondReminderMinutes: null,
                    recurrence: null, // options are: 'daily', 'weekly', 'monthly', 'yearly'
                    recurrenceInterval: 1, // only used when recurrence is set
                    recurrenceEndDate: null,
                    calendarName: null,
                    calendarId: null,
                    url: null
                };
            };

            /**
             * This method can be used if you want more control over the event details.
             * Pass in an options object which you can easily override as follow:
             *   var options = window.plugins.calendar.getCalendarOptions();
             *   options.firstReminderMinutes = 150;
             */
            Calendar.prototype.createEventWithOptions = function (title, location, notes, startDate, endDate, options, successCallback, errorCallback) {
                if (!(startDate instanceof Date && endDate instanceof Date)) {
                    errorCallback("startDate and endDate must be JavaScript Date Objects");
                    return;
                }

                // merge passed options with defaults
                var mergedOptions = Calendar.prototype.getCalendarOptions();
                for (var val in options) {
                    if (options.hasOwnProperty(val)) {
                        mergedOptions[val] = options[val];
                    }
                }
                if (options.recurrenceEndDate != null) {
                    mergedOptions.recurrenceEndTime = options.recurrenceEndDate.getTime();
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "createEventWithOptions", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null,
                    "options": mergedOptions
                }]);
            };

            /**
             * @deprecated use createEventWithOptions instead
             */
            Calendar.prototype.createEventInNamedCalendar = function (title, location, notes, startDate, endDate, calendarName, successCallback, errorCallback) {
                Calendar.prototype.createEventWithOptions(title, location, notes, startDate, endDate, {
                    calendarName: calendarName
                }, successCallback, errorCallback);
            };

            Calendar.prototype.createEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
                Calendar.prototype.createEventWithOptions(title, location, notes, startDate, endDate, {}, successCallback, errorCallback);
            };

            Calendar.prototype.createEventInteractively = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
                Calendar.prototype.createEventInteractivelyWithOptions(title, location, notes, startDate, endDate, {}, successCallback, errorCallback);
            };

            Calendar.prototype.createEventInteractivelyWithOptions = function (title, location, notes, startDate, endDate, options, successCallback, errorCallback) {
                // merge passed options with defaults
                var mergedOptions = Calendar.prototype.getCalendarOptions();
                for (var val in options) {
                    if (options.hasOwnProperty(val)) {
                        mergedOptions[val] = options[val];
                    }
                }
                if (options.recurrenceEndDate != null) {
                    mergedOptions.recurrenceEndTime = options.recurrenceEndDate.getTime();
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "createEventInteractively", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null,
                    "options": mergedOptions
                }])
            };

            Calendar.prototype.findEventWithOptions = function (title, location, notes, startDate, endDate, options, successCallback, errorCallback) {
                // merge passed options with defaults
                var mergedOptions = Calendar.prototype.getCalendarOptions();
                for (var val in options) {
                    if (options.hasOwnProperty(val)) {
                        mergedOptions[val] = options[val];
                    }
                }
                if (options.recurrenceEndDate != null) {
                    mergedOptions.recurrenceEndTime = options.recurrenceEndDate.getTime();
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "findEventWithOptions", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null,
                    "options": mergedOptions
                }])
            };

            Calendar.prototype.findEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
                Calendar.prototype.findEventWithOptions(title, location, notes, startDate, endDate, {}, successCallback, errorCallback);
            };

            Calendar.prototype.findAllEventsInNamedCalendar = function (calendarName, successCallback, errorCallback) {
                cordova.exec(successCallback, errorCallback, "Calendar", "findAllEventsInNamedCalendar", [{
                    "calendarName": calendarName
                }]);
            };

            Calendar.prototype.deleteEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
                if (!(startDate instanceof Date && endDate instanceof Date)) {
                    errorCallback("startDate and endDate must be JavaScript Date Objects");
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "deleteEvent", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null
                }])
            };

            Calendar.prototype.deleteEventFromNamedCalendar = function (title, location, notes, startDate, endDate, calendarName, successCallback, errorCallback) {
                cordova.exec(successCallback, errorCallback, "Calendar", "deleteEventFromNamedCalendar", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null,
                    "calendarName": calendarName
                }])
            };

            Calendar.prototype.modifyEventWithOptions = function (title, location, notes, startDate, endDate, newTitle, newLocation, newNotes, newStartDate, newEndDate, options, newOptions, successCallback, errorCallback) {
                if (!(newStartDate instanceof Date && newEndDate instanceof Date)) {
                    errorCallback("newStartDate and newEndDate must be JavaScript Date Objects");
                    return;
                }
                // merge passed options with defaults
                var mergedOptions = Calendar.prototype.getCalendarOptions();
                for (var val in options) {
                    if (options.hasOwnProperty(val)) {
                        mergedOptions[val] = options[val];
                    }
                }
                if (options.recurrenceEndDate != null) {
                    mergedOptions.recurrenceEndTime = options.recurrenceEndDate.getTime();
                }
                // and also merge passed newOptions with defaults
                var newMergedOptions = Calendar.prototype.getCalendarOptions();
                for (var val2 in newOptions) {
                    if (newOptions.hasOwnProperty(val2)) {
                        newMergedOptions[val2] = newOptions[val2];
                    }
                }
                if (newOptions.recurrenceEndDate != null) {
                    newMergedOptions.recurrenceEndTime = newOptions.recurrenceEndDate.getTime();
                }
                cordova.exec(successCallback, errorCallback, "Calendar", "modifyEventWithOptions", [{
                    "title": title,
                    "location": location,
                    "notes": notes,
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null,
                    "newTitle": newTitle,
                    "newLocation": newLocation,
                    "newNotes": newNotes,
                    "newStartTime": newStartDate instanceof Date ? newStartDate.getTime() : null,
                    "newEndTime": newEndDate instanceof Date ? newEndDate.getTime() : null,
                    "options": mergedOptions,
                    "newOptions": newMergedOptions
                }])
            };

            Calendar.prototype.modifyEvent = function (title, location, notes, startDate, endDate, newTitle, newLocation, newNotes, newStartDate, newEndDate, successCallback, errorCallback) {
                Calendar.prototype.modifyEventWithOptions(title, location, notes, startDate, endDate, newTitle, newLocation, newNotes, newStartDate, newEndDate, {}, successCallback, errorCallback);
            };

            Calendar.prototype.modifyEventInNamedCalendar = function (title, location, notes, startDate, endDate, newTitle, newLocation, newNotes, newStartDate, newEndDate, calendarName, successCallback, errorCallback) {
                var options = Calendar.prototype.getCalendarOptions();
                options.calendarName = calendarName;
                Calendar.prototype.modifyEventWithOptions(title, location, notes, startDate, endDate, newTitle, newLocation, newNotes, newStartDate, newEndDate, options, successCallback, errorCallback);
            };

            Calendar.prototype.listEventsInRange = function (startDate, endDate, successCallback, errorCallback) {
                cordova.exec(successCallback, errorCallback, "Calendar", "listEventsInRange", [{
                    "startTime": startDate instanceof Date ? startDate.getTime() : null,
                    "endTime": endDate instanceof Date ? endDate.getTime() : null
                }])
            };

            Calendar.prototype.listCalendars = function (successCallback, errorCallback) {
                cordova.exec(successCallback, errorCallback, "Calendar", "listCalendars", []);
            };

            Calendar.install = function () {
                if (!window.plugins) {
                    window.plugins = {};
                }

                window.plugins.calendar = new Calendar();
                return window.plugins.calendar;
            };

            cordova.addConstructor(Calendar.install);
        });

        //Dialogs plugin: https://github.com/dronahq/cordova-plugin-dialogs
        cordova.define("cordova-plugin-dialogs.notification", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec');
            var platform = require('cordova/platform');

            /**
             * Provides access to notifications on the device.
             */

            module.exports = {

                /**
                 * Open a native alert dialog, with a customizable title and button text.
                 *
                 * @param {String} message              Message to print in the body of the alert
                 * @param {Function} completeCallback   The callback that is called when user clicks on a button.
                 * @param {String} title                Title of the alert dialog (default: Alert)
                 * @param {String} buttonLabel          Label of the close button (default: OK)
                 */
                alert: function (message, completeCallback, title, buttonLabel) {
                    var _message = (typeof message === "string" ? message : JSON.stringify(message));
                    var _title = (typeof title === "string" ? title : "Alert");
                    var _buttonLabel = (buttonLabel || "OK");
                    exec(completeCallback, null, "Notification", "alert", [_message, _title, _buttonLabel]);
                },

                /**
                 * Open a native confirm dialog, with a customizable title and button text.
                 * The result that the user selects is returned to the result callback.
                 *
                 * @param {String} message              Message to print in the body of the alert
                 * @param {Function} resultCallback     The callback that is called when user clicks on a button.
                 * @param {String} title                Title of the alert dialog (default: Confirm)
                 * @param {Array} buttonLabels          Array of the labels of the buttons (default: ['OK', 'Cancel'])
                 */
                confirm: function (message, resultCallback, title, buttonLabels) {
                    var _message = (typeof message === "string" ? message : JSON.stringify(message));
                    var _title = (typeof title === "string" ? title : "Confirm");
                    var _buttonLabels = (buttonLabels || ["OK", "Cancel"]);

                    // Strings are deprecated!
                    if (typeof _buttonLabels === 'string') {
                        console.log("Notification.confirm(string, function, string, string) is deprecated.  Use Notification.confirm(string, function, string, array).");
                    }

                    _buttonLabels = convertButtonLabels(_buttonLabels);

                    exec(resultCallback, null, "Notification", "confirm", [_message, _title, _buttonLabels]);
                },

                /**
                 * Open a native prompt dialog, with a customizable title and button text.
                 * The following results are returned to the result callback:
                 *  buttonIndex     Index number of the button selected.
                 *  input1          The text entered in the prompt dialog box.
                 *
                 * @param {String} message              Dialog message to display (default: "Prompt message")
                 * @param {Function} resultCallback     The callback that is called when user clicks on a button.
                 * @param {String} title                Title of the dialog (default: "Prompt")
                 * @param {Array} buttonLabels          Array of strings for the button labels (default: ["OK","Cancel"])
                 * @param {String} defaultText          Textbox input value (default: empty string)
                 */
                prompt: function (message, resultCallback, title, buttonLabels, defaultText) {
                    var _message = (typeof message === "string" ? message : JSON.stringify(message));
                    var _title = (typeof title === "string" ? title : "Prompt");
                    var _buttonLabels = (buttonLabels || ["OK", "Cancel"]);

                    // Strings are deprecated!
                    if (typeof _buttonLabels === 'string') {
                        console.log("Notification.prompt(string, function, string, string) is deprecated.  Use Notification.confirm(string, function, string, array).");
                    }

                    _buttonLabels = convertButtonLabels(_buttonLabels);

                    var _defaultText = (defaultText || "");
                    exec(resultCallback, null, "Notification", "prompt", [_message, _title, _buttonLabels, _defaultText]);
                },

                /**
                 * Causes the device to beep.
                 * On Android, the default notification ringtone is played "count" times.
                 *
                 * @param {Integer} count       The number of beeps.
                 */
                beep: function (count) {
                    var defaultedCount = count || 1;
                    exec(null, null, "Notification", "beep", [defaultedCount]);
                }
            };


            function convertButtonLabels(buttonLabels) {

                // Some platforms take an array of button label names.
                // Other platforms take a comma separated list.
                // For compatibility, we convert to the desired type based on the platform.
                if (platform.id == "amazon-fireos" || platform.id == "android" || platform.id == "ios" ||
                    platform.id == "windowsphone" || platform.id == "firefoxos" || platform.id == "ubuntu" ||
                    platform.id == "windows8" || platform.id == "windows") {

                    if (typeof buttonLabels === 'string') {
                        buttonLabels = buttonLabels.split(","); // not crazy about changing the var type here
                    }
                } else {
                    if (Array.isArray(buttonLabels)) {
                        var buttonLabelArray = buttonLabels;
                        buttonLabels = buttonLabelArray.toString();
                    }
                }

                return buttonLabels;
            }

        });

        //Barcode scanner: https://github.com/dronahq/phonegap-plugin-barcodescanner
        cordova.define("phonegap-plugin-barcodescanner.BarcodeScanner", function (require, exports, module) {
            /**
             * cordova is available under *either* the terms of the modified BSD license *or* the
             * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
             *
             * Copyright (c) Matt Kane 2010
             * Copyright (c) 2011, IBM Corporation
             */

            var exec = cordova.require("cordova/exec");

            var scanInProgress = false;

            /**
             * Constructor.
             *
             * @returns {BarcodeScanner}
             */
            function BarcodeScanner() {

                /**
                 * Encoding constants.
                 *
                 * @type Object
                 */
                this.Encode = {
                    TEXT_TYPE: "TEXT_TYPE",
                    EMAIL_TYPE: "EMAIL_TYPE",
                    PHONE_TYPE: "PHONE_TYPE",
                    SMS_TYPE: "SMS_TYPE"
                    //  CONTACT_TYPE: "CONTACT_TYPE",  // TODO:  not implemented, requires passing a Bundle class from Javascript to Java
                    //  LOCATION_TYPE: "LOCATION_TYPE" // TODO:  not implemented, requires passing a Bundle class from Javascript to Java
                };

                /**
                 * Barcode format constants, defined in ZXing library.
                 *
                 * @type Object
                 */
                this.format = {
                    "all_1D": 61918,
                    "aztec": 1,
                    "codabar": 2,
                    "code_128": 16,
                    "code_39": 4,
                    "code_93": 8,
                    "data_MATRIX": 32,
                    "ean_13": 128,
                    "ean_8": 64,
                    "itf": 256,
                    "maxicode": 512,
                    "msi": 131072,
                    "pdf_417": 1024,
                    "plessey": 262144,
                    "qr_CODE": 2048,
                    "rss_14": 4096,
                    "rss_EXPANDED": 8192,
                    "upc_A": 16384,
                    "upc_E": 32768,
                    "upc_EAN_EXTENSION": 65536
                };
            }

            /**
             * Read code from scanner.
             *
             * @param {Function} successCallback This function will recieve a result object: {
             *        text : '12345-mock',    // The code that was scanned.
             *        format : 'FORMAT_NAME', // Code format.
             *        cancelled : true/false, // Was canceled.
             *    }
             * @param {Function} errorCallback
             * @param config
             */
            BarcodeScanner.prototype.scan = function (successCallback, errorCallback, config) {

                if (config instanceof Array) {
                    // do nothing
                } else {
                    if (typeof (config) === 'object') {
                        config = [config];
                    } else {
                        config = [];
                    }
                }

                if (errorCallback == null) {
                    errorCallback = function () { };
                }

                if (typeof errorCallback != "function") {
                    console.log("BarcodeScanner.scan failure: failure parameter not a function");
                    return;
                }

                if (typeof successCallback != "function") {
                    console.log("BarcodeScanner.scan failure: success callback parameter must be a function");
                    return;
                }

                if (scanInProgress) {
                    errorCallback('Scan is already in progress');
                    return;
                }

                scanInProgress = true;

                exec(
                    function (result) {
                        scanInProgress = false;
                        successCallback(result);
                    },
                    function (error) {
                        scanInProgress = false;
                        errorCallback(error);
                    },
                    'BarcodeScanner',
                    'scan',
                    config
                );
            };

            //-------------------------------------------------------------------
            BarcodeScanner.prototype.encode = function (type, data, successCallback, errorCallback, options) {
                if (errorCallback == null) {
                    errorCallback = function () { };
                }

                if (typeof errorCallback != "function") {
                    console.log("BarcodeScanner.encode failure: failure parameter not a function");
                    return;
                }

                if (typeof successCallback != "function") {
                    console.log("BarcodeScanner.encode failure: success callback parameter must be a function");
                    return;
                }

                exec(successCallback, errorCallback, 'BarcodeScanner', 'encode', [{
                    "type": type,
                    "data": data,
                    "options": options
                }]);
            };

            var barcodeScanner = new BarcodeScanner();
            module.exports = barcodeScanner;
        });

        // Network Info
        cordova.define("cordova-plugin-network-information.Connection", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             * Network status
             */
            module.exports = {
                UNKNOWN: "unknown",
                ETHERNET: "ethernet",
                WIFI: "wifi",
                CELL_2G: "2g",
                CELL_3G: "3g",
                CELL_4G: "4g",
                CELL: "cellular",
                NONE: "none"
            };
        });
        cordova.define("cordova-plugin-network-information.network", function (require, exports, module) {
            /*
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var exec = require('cordova/exec'),
                cordova = require('cordova'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils');

            // Link the onLine property with the Cordova-supplied network info.
            // This works because we clobber the navigator object with our own
            // object in bootstrap.js.
            // Browser platform do not need to define this property, because
            // it is already supported by modern browsers
            if (cordova.platformId !== 'browser' && typeof navigator != 'undefined') {
                utils.defineGetter(navigator, 'onLine', function () {
                    return this.connection.type != 'none';
                });
            }

            function NetworkConnection() {
                this.type = 'unknown';
            }

            /**
             * Get connection info
             *
             * @param {Function} successCallback The function to call when the Connection data is available
             * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
             */
            NetworkConnection.prototype.getInfo = function (successCallback, errorCallback) {
                exec(successCallback, errorCallback, "NetworkStatus", "getConnectionInfo", []);
            };

            var me = new NetworkConnection();
            var timerId = null;
            var timeout = 500;

            channel.createSticky('onCordovaConnectionReady');
            channel.waitForInitialization('onCordovaConnectionReady');

            channel.onCordovaReady.subscribe(function () {
                me.getInfo(function (info) {
                    me.type = info;
                    if (info === "none") {
                        // set a timer if still offline at the end of timer send the offline event
                        timerId = setTimeout(function () {
                            cordova.fireDocumentEvent("offline");
                            timerId = null;
                        }, timeout);
                    } else {
                        // If there is a current offline event pending clear it
                        if (timerId !== null) {
                            clearTimeout(timerId);
                            timerId = null;
                        }
                        cordova.fireDocumentEvent("online");
                    }

                    // should only fire this once
                    if (channel.onCordovaConnectionReady.state !== 2) {
                        channel.onCordovaConnectionReady.fire();
                    }
                },
                    function (e) {
                        // If we can't get the network info we should still tell Cordova
                        // to fire the deviceready event.
                        if (channel.onCordovaConnectionReady.state !== 2) {
                            channel.onCordovaConnectionReady.fire();
                        }
                        console.log("Error initializing Network Connection: " + e);
                    });
            });
            module.exports = me;
        });

        // X Social Sharing: https://github.com/dronahq/SocialSharing-PhoneGap-Plugin
        cordova.define("cordova-plugin-x-socialsharing.SocialSharing", function (require, exports, module) {
            function SocialSharing() { }

            // Override this method (after deviceready) to set the location where you want the iPad popup arrow to appear.
            // If not overridden with different values, the popup is not used. Example:
            //
            //   window.plugins.socialsharing.iPadPopupCoordinates = function() {
            //     return "100,100,200,300";
            //   };
            SocialSharing.prototype.iPadPopupCoordinates = function () {
                // left,top,width,height
                return "-1,-1,-1,-1";
            };

            SocialSharing.prototype.setIPadPopupCoordinates = function (coords) {
                // left,top,width,height
                cordova.exec(function () { }, this._getErrorCallback(function () { }, "setIPadPopupCoordinates"), "SocialSharing", "setIPadPopupCoordinates", [coords]);
            };

            SocialSharing.prototype.available = function (callback) {
                cordova.exec(function (avail) {
                    callback(avail ? true : false);
                }, null, "SocialSharing", "available", []);
            };

            // this is the recommended way to share as it is the most feature-rich with respect to what you pass in and get back
            SocialSharing.prototype.shareWithOptions = function (options, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareWithOptions"), "SocialSharing", "shareWithOptions", [options]);
            };

            SocialSharing.prototype.share = function (message, subject, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "share"), "SocialSharing", "share", [message, subject, this._asArray(fileOrFileArray), url]);
            };

            SocialSharing.prototype.shareViaTwitter = function (message, file /* multiple not allowed by twitter */, url, successCallback, errorCallback) {
                var fileArray = this._asArray(file);
                var ecb = this._getErrorCallback(errorCallback, "shareViaTwitter");
                if (fileArray.length > 1) {
                    ecb("shareViaTwitter supports max one file");
                } else {
                    cordova.exec(successCallback, ecb, "SocialSharing", "shareViaTwitter", [message, null, fileArray, url]);
                }
            };

            SocialSharing.prototype.shareViaFacebook = function (message, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaFacebook"), "SocialSharing", "shareViaFacebook", [message, null, this._asArray(fileOrFileArray), url]);
            };

            SocialSharing.prototype.shareViaFacebookWithPasteMessageHint = function (message, fileOrFileArray, url, pasteMessageHint, successCallback, errorCallback) {
                pasteMessageHint = pasteMessageHint || "If you like you can paste a message from your clipboard";
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaFacebookWithPasteMessageHint"), "SocialSharing", "shareViaFacebookWithPasteMessageHint", [message, null, this._asArray(fileOrFileArray), url, pasteMessageHint]);
            };

            SocialSharing.prototype.shareViaWhatsApp = function (message, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaWhatsApp"), "SocialSharing", "shareViaWhatsApp", [message, null, this._asArray(fileOrFileArray), url, null]);
            };

            SocialSharing.prototype.shareViaWhatsAppToReceiver = function (receiver, message, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaWhatsAppToReceiver"), "SocialSharing", "shareViaWhatsApp", [message, null, this._asArray(fileOrFileArray), url, receiver]);
            };

            SocialSharing.prototype.shareViaSMS = function (options, phonenumbers, successCallback, errorCallback) {
                var opts = options;
                if (typeof options == "string") {
                    opts = {
                        "message": options
                    }; // for backward compatibility as the options param used to be the message
                }
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaSMS"), "SocialSharing", "shareViaSMS", [opts, phonenumbers]);
            };

            SocialSharing.prototype.shareViaEmail = function (message, subject, toArray, ccArray, bccArray, fileOrFileArray, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaEmail"), "SocialSharing", "shareViaEmail", [message, subject, this._asArray(toArray), this._asArray(ccArray), this._asArray(bccArray), this._asArray(fileOrFileArray)]);
            };

            SocialSharing.prototype.canShareVia = function (via, message, subject, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "canShareVia"), "SocialSharing", "canShareVia", [message, subject, this._asArray(fileOrFileArray), url, via]);
            };

            SocialSharing.prototype.canShareViaEmail = function (successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "canShareViaEmail"), "SocialSharing", "canShareViaEmail", []);
            };

            SocialSharing.prototype.shareViaInstagram = function (message, fileOrFileArray, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareViaInstagram"), "SocialSharing", "shareViaInstagram", [message, null, this._asArray(fileOrFileArray), null]);
            };

            SocialSharing.prototype.shareVia = function (via, message, subject, fileOrFileArray, url, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "shareVia"), "SocialSharing", "shareVia", [message, subject, this._asArray(fileOrFileArray), url, via]);
            };

            SocialSharing.prototype.saveToPhotoAlbum = function (fileOrFileArray, successCallback, errorCallback) {
                cordova.exec(successCallback, this._getErrorCallback(errorCallback, "saveToPhotoAlbum"), "SocialSharing", "saveToPhotoAlbum", [this._asArray(fileOrFileArray)]);
            };

            SocialSharing.prototype._asArray = function (param) {
                if (param == null) {
                    param = [];
                } else if (typeof param === 'string') {
                    param = new Array(param);
                }
                return param;
            };

            SocialSharing.prototype._getErrorCallback = function (ecb, functionName) {
                if (typeof ecb === 'function') {
                    return ecb;
                } else {
                    return function (result) {
                        console.log("The injected error callback of '" + functionName + "' received: " + JSON.stringify(result));
                    }
                }
            };

            SocialSharing.install = function () {
                if (!window.plugins) {
                    window.plugins = {};
                }

                window.plugins.socialsharing = new SocialSharing();
                return window.plugins.socialsharing;
            };

            cordova.addConstructor(SocialSharing.install);
        });

        // https://github.com/dronahq/mobile-connected-client
        if (DronaHQ.onIos) {
            cordova.define("tableau-plugin-oauth.TableauOAuth", function (require, exports, module) {
                var exec = require('cordova/exec');

                module.exports = {
                    requestOAuthTokens: function (serverUrl, success, error) {
                        exec(success, error, "TableauOAuth", "requestOAuthTokensCordova", [serverUrl]);
                    },
                    checkSignInStatus: function (serverUrl, siteName, success, error) {
                        exec(success, error, "TableauOAuth", "checkSignInStatusCordova", [serverUrl, siteName]);
                    },
                    signOut: function (serverUrl, error) {
                        exec(null, error, "TableauOAuth", "signOutCordova", [serverUrl]);
                    }
                };
            });
        }

        // Call Number: https://github.com/dronahq/CordovaCallNumberPlugin
        cordova.define("call-number.CallNumber", function (require, exports, module) {
            var CallNumber = function () { };

            CallNumber.prototype.callNumber = function (success, failure, number, bypassAppChooser) {
                cordova.exec(success, failure, "CallNumber", "callNumber", [number, bypassAppChooser]);
            };

            //Plug in to Cordova
            cordova.addConstructor(function () {

                if (!window.Cordova) {
                    window.Cordova = cordova;
                };

                if (!window.plugins) window.plugins = {};
                window.plugins.CallNumber = new CallNumber();
            });

        });

        // Location Accuracy: https://github.com/dronahq/cordova-plugin-request-location-accuracy
        if (DronaHQ.onAndroid) {
            cordova.define("cordova-plugin-request-location-accuracy.RequestLocationAccuracy", function (require, exports, module) {
                /**
                 *  Request Location Accuracy plugin
                 *
                 *  Copyright (c) 2016 Dave Alden (Working Edge Ltd.)
                 **/
                var RequestLocationAccuracy = function () {
                    this.requesting = false;
                };

                /**
                 * Request location mode priority "no power": the best accuracy possible with zero additional power consumption.
                 * https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#PRIORITY_NO_POWER
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.REQUEST_PRIORITY_NO_POWER = 0;

                /**
                 * Request location mode priority "low power":  "city" level accuracy (about 10km accuracy)
                 * https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#PRIORITY_LOW_POWER
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.REQUEST_PRIORITY_LOW_POWER = 1;

                /**
                 * Request location mode priority "balanced power":  "block" level accuracy (about 100 meter accuracy)
                 * https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#PRIORITY_BALANCED_POWER_ACCURACY
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.REQUEST_PRIORITY_BALANCED_POWER_ACCURACY = 2;

                /**
                 * Request location mode priority "high accuracy":  the most accurate locations available. This will use GPS hardware to retrieve positions.
                 * https://developers.google.com/android/reference/com/google/android/gms/location/LocationRequest.html#PRIORITY_HIGH_ACCURACY
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.REQUEST_PRIORITY_HIGH_ACCURACY = 3;


                /**
                 * Success due to current location settings already satisfying requested accuracy
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.SUCCESS_SETTINGS_SATISFIED = 0;

                /**
                 * Success due to user agreeing to requested accuracy change
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.SUCCESS_USER_AGREED = 1;

                /**
                 * Error due an unresolved request already being in progress.
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_ALREADY_REQUESTING = -1;

                /**
                 * Error due invalid action requested
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_INVALID_ACTION = 0;

                /**
                 * Error due invalid accuracy requested
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_INVALID_ACCURACY = 1;

                /**
                 * Error due to exception in the native code
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_EXCEPTION = 2;

                /**
                 * Error due to not being able to change location accuracy to requested state
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_CANNOT_CHANGE_ACCURACY = 3;

                /**
                 * Error due to user rejecting requested accuracy change
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_USER_DISAGREED = 4;

                /**
                 * Error due to failure to connect to Google Play Services API
                 * @type {number}
                 */
                RequestLocationAccuracy.prototype.ERROR_GOOGLE_API_CONNECTION_FAILED = 5;

                /**
                 * Requests a specific accuracy for Location Services.
                 *
                 * @param [Function} successCallback - callback to be invoked on successful resolution of the requested accuracy.
                 * A single object argument will be passed which has two keys: "code" in an integer corresponding to a SUCCESS constant and indicates the reason for success;
                 * "message" is a string containing a description of the success.
                 * @param {Function} errorCallback - callback to be invoked on failure to resolve the requested accuracy.
                 * A single object argument will be passed which has two keys: "code" in an integer corresponding to an ERROR constant and indicates the reason for failure;
                 * "message" is a string containing a description of the error.
                 * @param {Integer} accuracy - The location accuracy to request defined by an integer corresponding to a REQUEST constant.
                 */
                RequestLocationAccuracy.prototype.request = function (successCallback, errorCallback, accuracy) {
                    var _this = this;

                    if (this.requesting) {
                        return errorCallback({
                            code: _this.ERROR_ALREADY_REQUESTING,
                            message: "A request is already in progress"
                        });
                    }

                    this.requesting = true;

                    return cordova.exec(function (data) {
                        _this.requesting = false;
                        successCallback(data)
                    },
                        function (err) {
                            _this.requesting = false;
                            errorCallback(err);
                        },
                        'RequestLocationAccuracy',
                        'request', [accuracy]);
                };

                /**
                 * Indicates if a request is currently in progress.
                 *
                 * @param [Function} successCallback - callback to pass result to.
                 * This is passed a boolean argument indicating if a request is currently in progress;
                 */
                RequestLocationAccuracy.prototype.isRequesting = function (successCallback) {
                    successCallback(!!this.requesting);
                };

                /**
                 * Indicates if it is possible to request a specific location accuracy.
                 * This will return true if the app is authorized to use location.
                 *
                 * @param [Function} successCallback - callback to pass result to.
                 * This is passed a boolean argument indicating if a request can be made.
                 */
                RequestLocationAccuracy.prototype.canRequest = function (successCallback) {
                    return cordova.exec(successCallback, null, 'RequestLocationAccuracy', 'canRequest', []);
                };

                module.exports = new RequestLocationAccuracy();


            });
        } else if (DronaHQ.onIos) {
            cordova.define("cordova-plugin-request-location-accuracy.RequestLocationAccuracy", function (require, exports, module) {
                /**
                 *  Request Location Accuracy plugin
                 *
                 *  Copyright (c) 2016 Dave Alden (Working Edge Ltd.)
                **/
                var RequestLocationAccuracy = function () {
                };


                /**
                 * Requests a position to invoke to native dialog to turn on Location Services.
                 *
                 * @param [Function} successCallback - callback to be invoked on successful position request.
                 * @param {Function} errorCallback - callback to be invoked on failure to request position.
                 */
                RequestLocationAccuracy.prototype.request = function (successCallback, errorCallback) {
                    return cordova.exec(successCallback, errorCallback, 'RequestLocationAccuracy', 'request', []);
                };

                /**
                 * Indicates if a request is possible to invoke to native dialog to turn on Location Services.
                 * This will return true if Location Services is currently OFF and request is not currently in progress.
                 *
                 * @param [Function} successCallback - callback to pass result to.
                 * This is passed a boolean argument indicating if a request can be made.
                 */
                RequestLocationAccuracy.prototype.canRequest = function (successCallback) {
                    return cordova.exec(successCallback, null, 'RequestLocationAccuracy', 'canRequest', []);
                };

                /**
                 * Indicates if a request is currently in progress.
                 *
                 * @param [Function} successCallback - callback to pass result to.
                 * This is passed a boolean argument indicating if a request is currently in progress;
                 */
                RequestLocationAccuracy.prototype.isRequesting = function (successCallback) {
                    return cordova.exec(successCallback, null, 'RequestLocationAccuracy', 'isRequesting', []);
                };

                module.exports = new RequestLocationAccuracy();


            });
        }

        // Device Orientation: https://github.com/dronahq/cordova-plugin-device-orientation
        cordova.define("cordova-plugin-device-orientation.compass", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var argscheck = require('cordova/argscheck'),
                exec = require('cordova/exec'),
                utils = require('cordova/utils'),
                CompassHeading = require('./CompassHeading'),
                CompassError = require('./CompassError'),

                timers = {},
                eventTimerId = null,
                compass = {
                    /**
                     * Asynchronously acquires the current heading.
                     * @param {Function} successCallback The function to call when the heading
                     * data is available
                     * @param {Function} errorCallback The function to call when there is an error
                     * getting the heading data.
                     * @param {CompassOptions} options The options for getting the heading data (not used).
                     */
                    getCurrentHeading: function (successCallback, errorCallback, options) {
                        argscheck.checkArgs('fFO', 'compass.getCurrentHeading', arguments);

                        var win = function (result) {
                            var ch = new CompassHeading(result.magneticHeading, result.trueHeading, result.headingAccuracy, result.timestamp);
                            successCallback(ch);
                        };
                        var fail = errorCallback && function (code) {
                            var ce = new CompassError(code);
                            errorCallback(ce);
                        };

                        // Get heading
                        exec(win, fail, "Compass", "getHeading", [options]);
                    },

                    /**
                     * Asynchronously acquires the heading repeatedly at a given interval.
                     * @param {Function} successCallback The function to call each time the heading
                     * data is available
                     * @param {Function} errorCallback The function to call when there is an error
                     * getting the heading data.
                     * @param {HeadingOptions} options The options for getting the heading data
                     * such as timeout and the frequency of the watch. For iOS, filter parameter
                     * specifies to watch via a distance filter rather than time.
                     */
                    watchHeading: function (successCallback, errorCallback, options) {
                        argscheck.checkArgs('fFO', 'compass.watchHeading', arguments);
                        // Default interval (100 msec)
                        var frequency = (options !== undefined && options.frequency !== undefined) ? options.frequency : 100;
                        var filter = (options !== undefined && options.filter !== undefined) ? options.filter : 0;

                        var id = utils.createUUID();
                        if (filter > 0) {
                            // is an iOS request for watch by filter, no timer needed
                            timers[id] = "iOS";
                            compass.getCurrentHeading(successCallback, errorCallback, options);
                        } else {
                            // Start watch timer to get headings
                            timers[id] = window.setInterval(function () {
                                compass.getCurrentHeading(successCallback, errorCallback);
                            }, frequency);
                        }

                        if (cordova.platformId === 'browser' && !eventTimerId) {
                            // Start firing deviceorientation events if haven't already
                            var deviceorientationEvent = new Event('deviceorientation');
                            eventTimerId = window.setInterval(function () {
                                window.dispatchEvent(deviceorientationEvent);
                            }, 200);
                        }

                        return id;
                    },

                    /**
                     * Clears the specified heading watch.
                     * @param {String} id The ID of the watch returned from #watchHeading.
                     */
                    clearWatch: function (id) {
                        // Stop javascript timer & remove from timer list
                        if (id && timers[id]) {
                            if (timers[id] != "iOS") {
                                clearInterval(timers[id]);
                            } else {
                                // is iOS watch by filter so call into device to stop
                                exec(null, null, "Compass", "stopHeading", []);
                            }
                            delete timers[id];

                            if (eventTimerId && Object.keys(timers).length === 0) {
                                // No more watchers, so stop firing 'deviceorientation' events
                                window.clearInterval(eventTimerId);
                                eventTimerId = null;
                            }
                        }
                    }
                };

            module.exports = compass;

        });
        cordova.define("cordova-plugin-device-orientation.CompassError", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            /**
             *  CompassError.
             *  An error code assigned by an implementation when an error has occurred
             * @constructor
             */
            var CompassError = function (err) {
                this.code = (err !== undefined ? err : null);
            };

            CompassError.COMPASS_INTERNAL_ERR = 0;
            CompassError.COMPASS_NOT_SUPPORTED = 20;

            module.exports = CompassError;

        });
        cordova.define("cordova-plugin-device-orientation.CompassHeading", function (require, exports, module) {
            /*
             *
             * Licensed to the Apache Software Foundation (ASF) under one
             * or more contributor license agreements.  See the NOTICE file
             * distributed with this work for additional information
             * regarding copyright ownership.  The ASF licenses this file
             * to you under the Apache License, Version 2.0 (the
             * "License"); you may not use this file except in compliance
             * with the License.  You may obtain a copy of the License at
             *
             *   http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing,
             * software distributed under the License is distributed on an
             * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
             * KIND, either express or implied.  See the License for the
             * specific language governing permissions and limitations
             * under the License.
             *
             */

            var CompassHeading = function (magneticHeading, trueHeading, headingAccuracy, timestamp) {
                this.magneticHeading = magneticHeading;
                this.trueHeading = trueHeading;
                this.headingAccuracy = headingAccuracy;
                this.timestamp = timestamp || new Date().getTime();
            };

            module.exports = CompassHeading;

        });

        // Cordova Email Plugin@v0.8.2: https://github.com/dronahq/cordova-plugin-email-composer/tree/0.8.2
        cordova.define("cordova-plugin-email-composer.EmailComposer", function (require, exports, module) {
            /*
                Copyright 2013-2016 appPlant UG
        
                Licensed to the Apache Software Foundation (ASF) under one
                or more contributor license agreements.  See the NOTICE file
                distributed with this work for additional information
                regarding copyright ownership.  The ASF licenses this file
                to you under the Apache License, Version 2.0 (the
                "License"); you may not use this file except in compliance
                with the License.  You may obtain a copy of the License at
        
                 http://www.apache.org/licenses/LICENSE-2.0
        
                Unless required by applicable law or agreed to in writing,
                software distributed under the License is distributed on an
                "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
                KIND, either express or implied.  See the License for the
                specific language governing permissions and limitations
                under the License.
            */

            var exec = require('cordova/exec');

            /**
             * List of all registered mail app aliases.
             */
            exports.aliases = {
                gmail: 'com.google.android.gm'
            };

            /**
             * List of all available options with their default value.
             *
             * @return {Object}
             */
            exports.getDefaults = function () {
                return {
                    app: undefined,
                    subject: '',
                    body: '',
                    to: [],
                    cc: [],
                    bcc: [],
                    attachments: [],
                    isHtml: true
                };
            };

            /**
             * Verifies if sending emails is supported on the device.
             *
             * @param {Function} callback
             *      A callback function to be called with the result
             * @param {Object} scope
             *      The scope of the callback
             */
            exports.isAvailable = function (callback, scope) {
                var fn = this.createCallbackFn(callback, scope);

                exec(fn, null, 'EmailComposer', 'isAvailable', []);
            };

            /**
             * Displays the email composer pre-filled with data.
             *
             * @param {Object} options
             *      Different properties of the email like the body, subject
             * @param {Function} callback
             *      A callback function to be called with the result
             * @param {Object?} scope
             *      The scope of the callback
             */
            exports.open = function (options, callback, scope) {
                var fn = this.createCallbackFn(callback, scope);

                options = this.mergeWithDefaults(options || {});

                exec(fn, null, 'EmailComposer', 'open', [options]);
            };

            /**
             * Adds a new mail app alias.
             *
             * @param {String} alias
             *      The alias name
             * @param {String} package
             *      The package name
             */
            exports.addAlias = function (alias, package) {
                this.aliases[alias] = package;
            }

            /**
             * @depreacted
             */
            exports.isServiceAvailable = function () {
                console.log('`email.isServiceAvailable` is deprecated.' +
                    ' Please use `email.isAvailable` instead.');

                this.isAvailable.apply(this, arguments);
            };

            /**
             * Alias für `open()`.
             */
            exports.openDraft = function () {
                this.open.apply(this, arguments);
            };

            /**
             * @private
             *
             * Merge settings with default values.
             *
             * @param {Object} options
             *      The custom options
             *
             * @retrun {Object}
             *      Default values merged
             *      with custom values
             */
            exports.mergeWithDefaults = function (options) {
                var defaults = this.getDefaults();

                if (options.hasOwnProperty('isHTML')) {
                    options.isHtml = options.isHTML;
                }

                if (options.hasOwnProperty('app')) {
                    var package = this.aliases[options.app];

                    options.app = package || options.app;
                }

                for (var key in defaults) {

                    if (!options.hasOwnProperty(key)) {
                        options[key] = defaults[key];
                        continue;
                    }

                    var custom_ = options[key],
                        default_ = defaults[key];

                    if (custom_ === null || custom_ === undefined) {
                        options[key] = default_;
                        continue;
                    }

                    if (typeof default_ != typeof custom_) {

                        if (typeof default_ == 'string') {
                            options[key] = custom_.join('');
                        } else if (typeof default_ == 'object') {
                            options[key] = [custom_.toString()];
                        }
                    }
                }

                return options;
            };

            /**
             * @private
             *
             * Creates a callback, which will be executed
             * within a specific scope.
             *
             * @param {Function} callbackFn
             *      The callback function
             * @param {Object} scope
             *      The scope for the function
             *
             * @return {Function}
             *      The new callback function
             */
            exports.createCallbackFn = function (callbackFn, scope) {
                if (typeof callbackFn != 'function')
                    return;

                return function () {
                    callbackFn.apply(scope || this, arguments);
                };
            };

        });
    };

    var _fnCordovaCommon = function (CORDOVA_JS_BUILD_LABEL) {

        // file: src/cordova.js
        define("cordova", function (require, exports, module) {


            var channel = require('cordova/channel');
            var platform = require('cordova/platform');

            /**
             * Intercept calls to addEventListener + removeEventListener and handle deviceready,
             * resume, and pause events.
             */
            var m_document_addEventListener = document.addEventListener;
            var m_document_removeEventListener = document.removeEventListener;
            var m_window_addEventListener = window.addEventListener;
            var m_window_removeEventListener = window.removeEventListener;

            /**
             * Houses custom event handlers to intercept on document + window event listeners.
             */
            var documentEventHandlers = {},
                windowEventHandlers = {};

            document.addEventListener = function (evt, handler, capture) {
                var e = evt.toLowerCase();
                if (typeof documentEventHandlers[e] != 'undefined') {
                    documentEventHandlers[e].subscribe(handler);
                } else {
                    m_document_addEventListener.call(document, evt, handler, capture);
                }
            };

            window.addEventListener = function (evt, handler, capture) {
                var e = evt.toLowerCase();
                if (typeof windowEventHandlers[e] != 'undefined') {
                    windowEventHandlers[e].subscribe(handler);
                } else {
                    m_window_addEventListener.call(window, evt, handler, capture);
                }
            };

            document.removeEventListener = function (evt, handler, capture) {
                var e = evt.toLowerCase();
                // If unsubscribing from an event that is handled by a plugin
                if (typeof documentEventHandlers[e] != "undefined") {
                    documentEventHandlers[e].unsubscribe(handler);
                } else {
                    m_document_removeEventListener.call(document, evt, handler, capture);
                }
            };

            window.removeEventListener = function (evt, handler, capture) {
                var e = evt.toLowerCase();
                // If unsubscribing from an event that is handled by a plugin
                if (typeof windowEventHandlers[e] != "undefined") {
                    windowEventHandlers[e].unsubscribe(handler);
                } else {
                    m_window_removeEventListener.call(window, evt, handler, capture);
                }
            };

            function createEvent(type, data) {
                var event = document.createEvent('Events');
                event.initEvent(type, false, false);
                if (data) {
                    for (var i in data) {
                        if (data.hasOwnProperty(i)) {
                            event[i] = data[i];
                        }
                    }
                }
                return event;
            }


            var cordova = {
                define: define,
                require: require,
                version: CORDOVA_JS_BUILD_LABEL,
                platformId: platform.id,
                /**
                 * Methods to add/remove your own addEventListener hijacking on document + window.
                 */
                addWindowEventHandler: function (event) {
                    return (windowEventHandlers[event] = channel.create(event));
                },
                addStickyDocumentEventHandler: function (event) {
                    return (documentEventHandlers[event] = channel.createSticky(event));
                },
                addDocumentEventHandler: function (event) {
                    return (documentEventHandlers[event] = channel.create(event));
                },
                removeWindowEventHandler: function (event) {
                    delete windowEventHandlers[event];
                },
                removeDocumentEventHandler: function (event) {
                    delete documentEventHandlers[event];
                },
                /**
                 * Retrieve original event handlers that were replaced by Cordova
                 *
                 * @return object
                 */
                getOriginalHandlers: function () {
                    return {
                        'document': {
                            'addEventListener': m_document_addEventListener,
                            'removeEventListener': m_document_removeEventListener
                        },
                        'window': {
                            'addEventListener': m_window_addEventListener,
                            'removeEventListener': m_window_removeEventListener
                        }
                    };
                },
                /**
                 * Method to fire event from native code
                 * bNoDetach is required for events which cause an exception which needs to be caught in native code
                 */
                fireDocumentEvent: function (type, data, bNoDetach) {
                    var evt = createEvent(type, data);
                    if (typeof documentEventHandlers[type] != 'undefined') {
                        if (bNoDetach) {
                            documentEventHandlers[type].fire(evt);
                        } else {
                            setTimeout(function () {
                                // Fire deviceready on listeners that were registered before cordova.js was loaded.
                                if (type == 'deviceready') {
                                    document.dispatchEvent(evt);
                                }
                                documentEventHandlers[type].fire(evt);
                            }, 0);
                        }
                    } else {
                        document.dispatchEvent(evt);
                    }
                },
                fireWindowEvent: function (type, data) {
                    var evt = createEvent(type, data);
                    if (typeof windowEventHandlers[type] != 'undefined') {
                        setTimeout(function () {
                            windowEventHandlers[type].fire(evt);
                        }, 0);
                    } else {
                        window.dispatchEvent(evt);
                    }
                },

                /**
                 * Plugin callback mechanism.
                 */
                // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
                // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
                callbackId: Math.floor(Math.random() * 2000000000),
                callbacks: {},
                callbackStatus: {
                    NO_RESULT: 0,
                    OK: 1,
                    CLASS_NOT_FOUND_EXCEPTION: 2,
                    ILLEGAL_ACCESS_EXCEPTION: 3,
                    INSTANTIATION_EXCEPTION: 4,
                    MALFORMED_URL_EXCEPTION: 5,
                    IO_EXCEPTION: 6,
                    INVALID_ACTION: 7,
                    JSON_EXCEPTION: 8,
                    ERROR: 9
                },

                /**
                 * Called by native code when returning successful result from an action.
                 */
                callbackSuccess: function (callbackId, args) {
                    try {
                        cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
                    } catch (e) {
                        console.log("Error in success callback: " + callbackId + " = " + e);
                    }
                },

                /**
                 * Called by native code when returning error result from an action.
                 */
                callbackError: function (callbackId, args) {
                    // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
                    // Derive success from status.
                    try {
                        cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
                    } catch (e) {
                        console.log("Error in error callback: " + callbackId + " = " + e);
                    }
                },

                /**
                 * Called by native code when returning the result from an action.
                 */
                callbackFromNative: function (callbackId, success, status, args, keepCallback) {
                    var callback = cordova.callbacks[callbackId];
                    if (callback) {
                        if (success && status == cordova.callbackStatus.OK) {
                            callback.success && callback.success.apply(null, args);
                        } else if (!success) {
                            callback.fail && callback.fail.apply(null, args);
                        }

                        // Clear callback if not expecting any more results
                        if (!keepCallback) {
                            delete cordova.callbacks[callbackId];
                        }
                    }
                },
                addConstructor: function (func) {
                    channel.onCordovaReady.subscribe(function () {
                        try {
                            func();
                        } catch (e) {
                            console.log("Failed to run constructor: " + e);
                        }
                    });
                }
            };


            module.exports = cordova;

        });

        // file: src/common/argscheck.js
        define("cordova/argscheck", function (require, exports, module) {

            var exec = require('cordova/exec');
            var utils = require('cordova/utils');

            var moduleExports = module.exports;

            var typeMap = {
                'A': 'Array',
                'D': 'Date',
                'N': 'Number',
                'S': 'String',
                'F': 'Function',
                'O': 'Object'
            };

            function extractParamName(callee, argIndex) {
                return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
            }

            function checkArgs(spec, functionName, args, opt_callee) {
                if (!moduleExports.enableChecks) {
                    return;
                }
                var errMsg = null;
                var typeName;
                for (var i = 0; i < spec.length; ++i) {
                    var c = spec.charAt(i),
                        cUpper = c.toUpperCase(),
                        arg = args[i];
                    // Asterix means allow anything.
                    if (c == '*') {
                        continue;
                    }
                    typeName = utils.typeName(arg);
                    if ((arg === null || arg === undefined) && c == cUpper) {
                        continue;
                    }
                    if (typeName != typeMap[cUpper]) {
                        errMsg = 'Expected ' + typeMap[cUpper];
                        break;
                    }
                }
                if (errMsg) {
                    errMsg += ', but got ' + typeName + '.';
                    errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
                    // Don't log when running unit tests.
                    if (typeof jasmine == 'undefined') {
                        console.error(errMsg);
                    }
                    throw TypeError(errMsg);
                }
            }

            function getValue(value, defaultValue) {
                return value === undefined ? defaultValue : value;
            }

            moduleExports.checkArgs = checkArgs;
            moduleExports.getValue = getValue;
            moduleExports.enableChecks = true;


        });

        // file: src/common/base64.js
        define("cordova/base64", function (require, exports, module) {

            var base64 = exports;

            base64.fromArrayBuffer = function (arrayBuffer) {
                var array = new Uint8Array(arrayBuffer);
                return uint8ToBase64(array);
            };

            base64.toArrayBuffer = function (str) {
                var decodedStr = typeof atob != 'undefined' ? atob(str) : new Buffer(str, 'base64').toString('binary');
                var arrayBuffer = new ArrayBuffer(decodedStr.length);
                var array = new Uint8Array(arrayBuffer);
                for (var i = 0, len = decodedStr.length; i < len; i++) {
                    array[i] = decodedStr.charCodeAt(i);
                }
                return arrayBuffer;
            };

            //------------------------------------------------------------------------------

            /* This code is based on the performance tests at http://jsperf.com/b64tests
             * This 12-bit-at-a-time algorithm was the best performing version on all
             * platforms tested.
             */

            var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
            var b64_12bit;

            var b64_12bitTable = function () {
                b64_12bit = [];
                for (var i = 0; i < 64; i++) {
                    for (var j = 0; j < 64; j++) {
                        b64_12bit[i * 64 + j] = b64_6bit[i] + b64_6bit[j];
                    }
                }
                b64_12bitTable = function () {
                    return b64_12bit;
                };
                return b64_12bit;
            };

            function uint8ToBase64(rawData) {
                var numBytes = rawData.byteLength;
                var output = "";
                var segment;
                var table = b64_12bitTable();
                for (var i = 0; i < numBytes - 2; i += 3) {
                    segment = (rawData[i] << 16) + (rawData[i + 1] << 8) + rawData[i + 2];
                    output += table[segment >> 12];
                    output += table[segment & 0xfff];
                }
                if (numBytes - i == 2) {
                    segment = (rawData[i] << 16) + (rawData[i + 1] << 8);
                    output += table[segment >> 12];
                    output += b64_6bit[(segment & 0xfff) >> 6];
                    output += '=';
                } else if (numBytes - i == 1) {
                    segment = (rawData[i] << 16);
                    output += table[segment >> 12];
                    output += '==';
                }
                return output;
            }

        });

        // file: src/common/builder.js
        define("cordova/builder", function (require, exports, module) {

            var utils = require('cordova/utils');

            function each(objects, func, context) {
                for (var prop in objects) {
                    if (objects.hasOwnProperty(prop)) {
                        func.apply(context, [objects[prop], prop]);
                    }
                }
            }

            function clobber(obj, key, value) {
                exports.replaceHookForTesting(obj, key);
                obj[key] = value;
                // Getters can only be overridden by getters.
                if (obj[key] !== value) {
                    utils.defineGetter(obj, key, function () {
                        return value;
                    });
                }
            }

            function assignOrWrapInDeprecateGetter(obj, key, value, message) {
                if (message) {
                    utils.defineGetter(obj, key, function () {
                        console.log(message);
                        delete obj[key];
                        clobber(obj, key, value);
                        return value;
                    });
                } else {
                    clobber(obj, key, value);
                }
            }

            function include(parent, objects, clobber, merge) {
                each(objects, function (obj, key) {
                    try {
                        var result = obj.path ? require(obj.path) : {};

                        if (clobber) {
                            // Clobber if it doesn't exist.
                            if (typeof parent[key] === 'undefined') {
                                assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                            } else if (typeof obj.path !== 'undefined') {
                                // If merging, merge properties onto parent, otherwise, clobber.
                                if (merge) {
                                    recursiveMerge(parent[key], result);
                                } else {
                                    assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                                }
                            }
                            result = parent[key];
                        } else {
                            // Overwrite if not currently defined.
                            if (typeof parent[key] == 'undefined') {
                                assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                            } else {
                                // Set result to what already exists, so we can build children into it if they exist.
                                result = parent[key];
                            }
                        }

                        if (obj.children) {
                            include(result, obj.children, clobber, merge);
                        }
                    } catch (e) {
                        utils.alert('Exception building Cordova JS globals: ' + e + ' for key "' + key + '"');
                    }
                });
            }

            /**
             * Merge properties from one object onto another recursively.  Properties from
             * the src object will overwrite existing target property.
             *
             * @param target Object to merge properties into.
             * @param src Object to merge properties from.
             */
            function recursiveMerge(target, src) {
                for (var prop in src) {
                    if (src.hasOwnProperty(prop)) {
                        if (target.prototype && target.prototype.constructor === target) {
                            // If the target object is a constructor override off prototype.
                            clobber(target.prototype, prop, src[prop]);
                        } else {
                            if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                                recursiveMerge(target[prop], src[prop]);
                            } else {
                                clobber(target, prop, src[prop]);
                            }
                        }
                    }
                }
            }

            exports.buildIntoButDoNotClobber = function (objects, target) {
                include(target, objects, false, false);
            };
            exports.buildIntoAndClobber = function (objects, target) {
                include(target, objects, true, false);
            };
            exports.buildIntoAndMerge = function (objects, target) {
                include(target, objects, true, true);
            };
            exports.recursiveMerge = recursiveMerge;
            exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
            exports.replaceHookForTesting = function () { };

        });

        // file: src/common/channel.js
        define("cordova/channel", function (require, exports, module) {

            var utils = require('cordova/utils'),
                nextGuid = 1;

            /**
             * Custom pub-sub "channel" that can have functions subscribed to it
             * This object is used to define and control firing of events for
             * cordova initialization, as well as for custom events thereafter.
             *
             * The order of events during page load and Cordova startup is as follows:
             *
             * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
             * onNativeReady*              Internal event that indicates the Cordova native side is ready.
             * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
             * onDeviceReady*              User event fired to indicate that Cordova is ready
             * onResume                    User event fired to indicate a start/resume lifecycle event
             * onPause                     User event fired to indicate a pause lifecycle event
             * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
             *
             * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
             * All listeners that subscribe after the event is fired will be executed right away.
             *
             * The only Cordova events that user code should register for are:
             *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
             *      pause                 App has moved to background
             *      resume                App has returned to foreground
             *
             * Listeners can be registered as:
             *      document.addEventListener("deviceready", myDeviceReadyListener, false);
             *      document.addEventListener("resume", myResumeListener, false);
             *      document.addEventListener("pause", myPauseListener, false);
             *
             * The DOM lifecycle events should be used for saving and restoring state
             *      window.onload
             *      window.onunload
             *
             */

            /**
             * Channel
             * @constructor
             * @param type  String the channel name
             */
            var Channel = function (type, sticky) {
                this.type = type;
                // Map of guid -> function.
                this.handlers = {};
                // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
                this.state = sticky ? 1 : 0;
                // Used in sticky mode to remember args passed to fire().
                this.fireArgs = null;
                // Used by onHasSubscribersChange to know if there are any listeners.
                this.numHandlers = 0;
                // Function that is called when the first listener is subscribed, or when
                // the last listener is unsubscribed.
                this.onHasSubscribersChange = null;
            },
                channel = {
                    /**
                     * Calls the provided function only after all of the channels specified
                     * have been fired. All channels must be sticky channels.
                     */
                    join: function (h, c) {
                        var len = c.length,
                            i = len,
                            f = function () {
                                if (!(--i)) h();
                            };
                        for (var j = 0; j < len; j++) {
                            if (c[j].state === 0) {
                                throw Error('Can only use join with sticky channels.');
                            }
                            c[j].subscribe(f);
                        }
                        if (!len) h();
                    },
                    create: function (type) {
                        return channel[type] = new Channel(type, false);
                    },
                    createSticky: function (type) {
                        return channel[type] = new Channel(type, true);
                    },

                    /**
                     * cordova Channels that must fire before "deviceready" is fired.
                     */
                    deviceReadyChannelsArray: [],
                    deviceReadyChannelsMap: {},

                    /**
                     * Indicate that a feature needs to be initialized before it is ready to be used.
                     * This holds up Cordova's "deviceready" event until the feature has been initialized
                     * and Cordova.initComplete(feature) is called.
                     *
                     * @param feature {String}     The unique feature name
                     */
                    waitForInitialization: function (feature) {
                        if (feature) {
                            var c = channel[feature] || this.createSticky(feature);
                            this.deviceReadyChannelsMap[feature] = c;
                            this.deviceReadyChannelsArray.push(c);
                        }
                    },

                    /**
                     * Indicate that initialization code has completed and the feature is ready to be used.
                     *
                     * @param feature {String}     The unique feature name
                     */
                    initializationComplete: function (feature) {
                        var c = this.deviceReadyChannelsMap[feature];
                        if (c) {
                            c.fire();
                        }
                    }
                };

            function forceFunction(f) {
                if (typeof f != 'function')
                    throw "Function required as first argument!";
            }

            /**
             * Subscribes the given function to the channel. Any time that
             * Channel.fire is called so too will the function.
             * Optionally specify an execution context for the function
             * and a guid that can be used to stop subscribing to the channel.
             * Returns the guid.
             */
            Channel.prototype.subscribe = function (f, c) {
                // need a function to call
                forceFunction(f);
                if (this.state == 2) {
                    f.apply(c || this, this.fireArgs);
                    return;
                }

                var func = f,
                    guid = f.observer_guid;
                if (typeof c == "object") {
                    func = utils.close(c, f);
                }

                if (!guid) {
                    // first time any channel has seen this subscriber
                    guid = '' + nextGuid++;
                }
                func.observer_guid = guid;
                f.observer_guid = guid;

                // Don't add the same handler more than once.
                if (!this.handlers[guid]) {
                    this.handlers[guid] = func;
                    this.numHandlers++;
                    if (this.numHandlers == 1) {
                        this.onHasSubscribersChange && this.onHasSubscribersChange();
                    }
                }
            };

            /**
             * Unsubscribes the function with the given guid from the channel.
             */
            Channel.prototype.unsubscribe = function (f) {
                // need a function to unsubscribe
                forceFunction(f);

                var guid = f.observer_guid,
                    handler = this.handlers[guid];
                if (handler) {
                    delete this.handlers[guid];
                    this.numHandlers--;
                    if (this.numHandlers === 0) {
                        this.onHasSubscribersChange && this.onHasSubscribersChange();
                    }
                }
            };

            /**
             * Calls all functions subscribed to this channel.
             */
            Channel.prototype.fire = function (e) {
                var fail = false,
                    fireArgs = Array.prototype.slice.call(arguments);
                // Apply stickiness.
                if (this.state == 1) {
                    this.state = 2;
                    this.fireArgs = fireArgs;
                }
                if (this.numHandlers) {
                    // Copy the values first so that it is safe to modify it from within
                    // callbacks.
                    var toCall = [];
                    for (var item in this.handlers) {
                        toCall.push(this.handlers[item]);
                    }
                    for (var i = 0; i < toCall.length; ++i) {
                        toCall[i].apply(this, fireArgs);
                    }
                    if (this.state == 2 && this.numHandlers) {
                        this.numHandlers = 0;
                        this.handlers = {};
                        this.onHasSubscribersChange && this.onHasSubscribersChange();
                    }
                }
            };


            // defining them here so they are ready super fast!
            // DOM event that is received when the web page is loaded and parsed.
            channel.createSticky('onDOMContentLoaded');

            // Event to indicate the Cordova native side is ready.
            channel.createSticky('onNativeReady');

            // Event to indicate that all Cordova JavaScript objects have been created
            // and it's time to run plugin constructors.
            channel.createSticky('onCordovaReady');

            // Event to indicate that all automatically loaded JS plugins are loaded and ready.
            // FIXME remove this
            channel.createSticky('onPluginsReady');

            // Event to indicate that Cordova is ready
            channel.createSticky('onDeviceReady');

            // Event to indicate a resume lifecycle event
            channel.create('onResume');

            // Event to indicate a pause lifecycle event
            channel.create('onPause');

            // Event to indicate a destroy lifecycle event
            channel.createSticky('onDestroy');

            // Channels that must fire before "deviceready" is fired.
            channel.waitForInitialization('onCordovaReady');
            channel.waitForInitialization('onDOMContentLoaded');

            module.exports = channel;

        });

        // file: src/common/exec/proxy.js
        define("cordova/exec/proxy", function (require, exports, module) {


            // internal map of proxy function
            var CommandProxyMap = {};

            module.exports = {

                // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
                add: function (id, proxyObj) {
                    console.log("adding proxy for " + id);
                    CommandProxyMap[id] = proxyObj;
                    return proxyObj;
                },

                // cordova.commandProxy.remove("Accelerometer");
                remove: function (id) {
                    var proxy = CommandProxyMap[id];
                    delete CommandProxyMap[id];
                    CommandProxyMap[id] = null;
                    return proxy;
                },

                get: function (service, action) {
                    return (CommandProxyMap[service] ? CommandProxyMap[service][action] : null);
                }
            };
        });

        // file: src/common/init.js
        define("cordova/init", function (require, exports, module) {

            var channel = require('cordova/channel');
            var cordova = require('cordova');
            var modulemapper = require('cordova/modulemapper');
            var platform = require('cordova/platform');
            var pluginloader = require('cordova/pluginloader');

            var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

            function logUnfiredChannels(arr) {
                for (var i = 0; i < arr.length; ++i) {
                    if (arr[i].state != 2) {
                        console.log('Channel not fired: ' + arr[i].type);
                    }
                }
            }

            window.setTimeout(function () {
                if (channel.onDeviceReady.state != 2) {
                    console.log('deviceready has not fired after 5 seconds.');
                    logUnfiredChannels(platformInitChannelsArray);
                    logUnfiredChannels(channel.deviceReadyChannelsArray);
                }
            }, 5000);

            // Replace navigator before any modules are required(), to ensure it happens as soon as possible.
            // We replace it so that properties that can't be clobbered can instead be overridden.
            function replaceNavigator(origNavigator) {
                var CordovaNavigator = function () { };
                CordovaNavigator.prototype = origNavigator;
                var newNavigator = new CordovaNavigator();
                // This work-around really only applies to new APIs that are newer than Function.bind.
                // Without it, APIs such as getGamepads() break.
                if (CordovaNavigator.bind) {
                    for (var key in origNavigator) {
                        if (typeof origNavigator[key] == 'function') {
                            newNavigator[key] = origNavigator[key].bind(origNavigator);
                        }
                    }
                }
                return newNavigator;
            }
            if (window.navigator) {
                window.navigator = replaceNavigator(window.navigator);
            }

            if (!window.console) {
                window.console = {
                    log: function () { }
                };
            }
            if (!window.console.warn) {
                window.console.warn = function (msg) {
                    this.log("warn: " + msg);
                };
            }

            // Register pause, resume and deviceready channels as events on document.
            channel.onPause = cordova.addDocumentEventHandler('pause');
            channel.onResume = cordova.addDocumentEventHandler('resume');
            channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

            // Listen for DOMContentLoaded and notify our channel subscribers.
            if (document.readyState == 'complete' || document.readyState == 'interactive') {
                channel.onDOMContentLoaded.fire();
            } else {
                document.addEventListener('DOMContentLoaded', function () {
                    channel.onDOMContentLoaded.fire();
                }, false);
            }

            // _nativeReady is global variable that the native side can set
            // to signify that the native code is ready. It is a global since
            // it may be called before any cordova JS is ready.
            if (window._nativeReady) {
                channel.onNativeReady.fire();
            }

            modulemapper.clobbers('cordova', 'cordova');
            modulemapper.clobbers('cordova/exec', 'cordova.exec');
            modulemapper.clobbers('cordova/exec', 'Cordova.exec');

            // Call the platform-specific initialization.
            platform.bootstrap && platform.bootstrap();

            // Wrap in a setTimeout to support the use-case of having plugin JS appended to cordova.js.
            // The delay allows the attached modules to be defined before the plugin loader looks for them.
            setTimeout(function () {
                pluginloader.load(function () {
                    channel.onPluginsReady.fire();
                });
            }, 0);

            /**
             * Create all cordova objects once native side is ready.
             */
            channel.join(function () {
                modulemapper.mapModules(window);

                platform.initialize && platform.initialize();

                // Fire event to notify that all objects are created
                channel.onCordovaReady.fire();

                // Fire onDeviceReady event once page has fully loaded, all
                // constructors have run and cordova info has been received from native
                // side.
                channel.join(function () {
                    require('cordova').fireDocumentEvent('deviceready');

                    //Also set the flag DronaHQ.AreYouReady
                    DronaHQ.IsReady = true;

                }, channel.deviceReadyChannelsArray);

            }, platformInitChannelsArray);


        });

        // file: src/common/init_b.js
        define("cordova/init_b", function (require, exports, module) {

            var channel = require('cordova/channel');
            var cordova = require('cordova');
            var platform = require('cordova/platform');

            var platformInitChannelsArray = [channel.onDOMContentLoaded, channel.onNativeReady];

            // setting exec
            cordova.exec = require('cordova/exec');

            function logUnfiredChannels(arr) {
                for (var i = 0; i < arr.length; ++i) {
                    if (arr[i].state != 2) {
                        console.log('Channel not fired: ' + arr[i].type);
                    }
                }
            }

            window.setTimeout(function () {
                if (channel.onDeviceReady.state != 2) {
                    console.log('deviceready has not fired after 5 seconds.');
                    logUnfiredChannels(platformInitChannelsArray);
                    logUnfiredChannels(channel.deviceReadyChannelsArray);
                }
            }, 5000);

            // Replace navigator before any modules are required(), to ensure it happens as soon as possible.
            // We replace it so that properties that can't be clobbered can instead be overridden.
            function replaceNavigator(origNavigator) {
                var CordovaNavigator = function () { };
                CordovaNavigator.prototype = origNavigator;
                var newNavigator = new CordovaNavigator();
                // This work-around really only applies to new APIs that are newer than Function.bind.
                // Without it, APIs such as getGamepads() break.
                if (CordovaNavigator.bind) {
                    for (var key in origNavigator) {
                        if (typeof origNavigator[key] == 'function') {
                            newNavigator[key] = origNavigator[key].bind(origNavigator);
                        }
                    }
                }
                return newNavigator;
            }
            if (window.navigator) {
                window.navigator = replaceNavigator(window.navigator);
            }

            if (!window.console) {
                window.console = {
                    log: function () { }
                };
            }
            if (!window.console.warn) {
                window.console.warn = function (msg) {
                    this.log("warn: " + msg);
                };
            }

            // Register pause, resume and deviceready channels as events on document.
            channel.onPause = cordova.addDocumentEventHandler('pause');
            channel.onResume = cordova.addDocumentEventHandler('resume');
            channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

            // Listen for DOMContentLoaded and notify our channel subscribers.
            if (document.readyState == 'complete' || document.readyState == 'interactive') {
                channel.onDOMContentLoaded.fire();
            } else {
                document.addEventListener('DOMContentLoaded', function () {
                    channel.onDOMContentLoaded.fire();
                }, false);
            }

            // _nativeReady is global variable that the native side can set
            // to signify that the native code is ready. It is a global since
            // it may be called before any cordova JS is ready.
            if (window._nativeReady) {
                channel.onNativeReady.fire();
            }

            // Call the platform-specific initialization.
            platform.bootstrap && platform.bootstrap();

            /**
             * Create all cordova objects once native side is ready.
             */
            channel.join(function () {

                platform.initialize && platform.initialize();

                // Fire event to notify that all objects are created
                channel.onCordovaReady.fire();

                // Fire onDeviceReady event once page has fully loaded, all
                // constructors have run and cordova info has been received from native
                // side.
                channel.join(function () {
                    require('cordova').fireDocumentEvent('deviceready');
                }, channel.deviceReadyChannelsArray);

            }, platformInitChannelsArray);

        });

        // file: src/common/modulemapper.js
        define("cordova/modulemapper", function (require, exports, module) {

            var builder = require('cordova/builder'),
                moduleMap = define.moduleMap,
                symbolList,
                deprecationMap;

            exports.reset = function () {
                symbolList = [];
                deprecationMap = {};
            };

            function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
                if (!(moduleName in moduleMap)) {
                    throw new Error('Module ' + moduleName + ' does not exist.');
                }
                symbolList.push(strategy, moduleName, symbolPath);
                if (opt_deprecationMessage) {
                    deprecationMap[symbolPath] = opt_deprecationMessage;
                }
            }

            // Note: Android 2.3 does have Function.bind().
            exports.clobbers = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.merges = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.defaults = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.runs = function (moduleName) {
                addEntry('r', moduleName, null);
            };

            function prepareNamespace(symbolPath, context) {
                if (!symbolPath) {
                    return context;
                }
                var parts = symbolPath.split('.');
                var cur = context;
                for (var i = 0, part; part = parts[i]; ++i) {
                    cur = cur[part] = cur[part] || {};
                }
                return cur;
            }

            exports.mapModules = function (context) {
                var origSymbols = {};
                context.CDV_origSymbols = origSymbols;
                for (var i = 0, len = symbolList.length; i < len; i += 3) {
                    var strategy = symbolList[i];
                    var moduleName = symbolList[i + 1];
                    var module = require(moduleName);
                    // <runs/>
                    if (strategy == 'r') {
                        continue;
                    }
                    var symbolPath = symbolList[i + 2];
                    var lastDot = symbolPath.lastIndexOf('.');
                    var namespace = symbolPath.substr(0, lastDot);
                    var lastName = symbolPath.substr(lastDot + 1);

                    var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
                    var parentObj = prepareNamespace(namespace, context);
                    var target = parentObj[lastName];

                    if (strategy == 'm' && target) {
                        builder.recursiveMerge(target, module);
                    } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
                        if (!(symbolPath in origSymbols)) {
                            origSymbols[symbolPath] = target;
                        }
                        builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
                    }
                }
            };

            exports.getOriginalSymbol = function (context, symbolPath) {
                var origSymbols = context.CDV_origSymbols;
                if (origSymbols && (symbolPath in origSymbols)) {
                    return origSymbols[symbolPath];
                }
                var parts = symbolPath.split('.');
                var obj = context;
                for (var i = 0; i < parts.length; ++i) {
                    obj = obj && obj[parts[i]];
                }
                return obj;
            };

            exports.reset();


        });

        // file: src/common/modulemapper_b.js
        define("cordova/modulemapper_b", function (require, exports, module) {

            var builder = require('cordova/builder'),
                symbolList = [],
                deprecationMap;

            exports.reset = function () {
                symbolList = [];
                deprecationMap = {};
            };

            function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
                symbolList.push(strategy, moduleName, symbolPath);
                if (opt_deprecationMessage) {
                    deprecationMap[symbolPath] = opt_deprecationMessage;
                }
            }

            // Note: Android 2.3 does have Function.bind().
            exports.clobbers = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.merges = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.defaults = function (moduleName, symbolPath, opt_deprecationMessage) {
                addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
            };

            exports.runs = function (moduleName) {
                addEntry('r', moduleName, null);
            };

            function prepareNamespace(symbolPath, context) {
                if (!symbolPath) {
                    return context;
                }
                var parts = symbolPath.split('.');
                var cur = context;
                for (var i = 0, part; part = parts[i]; ++i) {
                    cur = cur[part] = cur[part] || {};
                }
                return cur;
            }

            exports.mapModules = function (context) {
                var origSymbols = {};
                context.CDV_origSymbols = origSymbols;
                for (var i = 0, len = symbolList.length; i < len; i += 3) {
                    var strategy = symbolList[i];
                    var moduleName = symbolList[i + 1];
                    var module = require(moduleName);
                    // <runs/>
                    if (strategy == 'r') {
                        continue;
                    }
                    var symbolPath = symbolList[i + 2];
                    var lastDot = symbolPath.lastIndexOf('.');
                    var namespace = symbolPath.substr(0, lastDot);
                    var lastName = symbolPath.substr(lastDot + 1);

                    var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
                    var parentObj = prepareNamespace(namespace, context);
                    var target = parentObj[lastName];

                    if (strategy == 'm' && target) {
                        builder.recursiveMerge(target, module);
                    } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
                        if (!(symbolPath in origSymbols)) {
                            origSymbols[symbolPath] = target;
                        }
                        builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
                    }
                }
            };

            exports.getOriginalSymbol = function (context, symbolPath) {
                var origSymbols = context.CDV_origSymbols;
                if (origSymbols && (symbolPath in origSymbols)) {
                    return origSymbols[symbolPath];
                }
                var parts = symbolPath.split('.');
                var obj = context;
                for (var i = 0; i < parts.length; ++i) {
                    obj = obj && obj[parts[i]];
                }
                return obj;
            };

            exports.reset();


        });

        //file: cordova_plugins.js - DronaHQ.js customization
        /* Cordova generally injects this file on runtime, but we want only 1 js to exist
         * Hence, we are putting this as a part of this js only
         */
        define('cordova/plugin_list', function (require, exports, module) {

            var arrDevice = [{
                "file": "plugins/cordova-plugin-device/www/device.js",
                "id": "cordova-plugin-device.device",
                "clobbers": [
                    "device"
                ]
            }];

            var arrCamera = [{
                "file": "plugins/cordova-plugin-camera/www/CameraConstants.js",
                "id": "cordova-plugin-camera.Camera",
                "clobbers": [
                    "Camera"
                ]
            }, {
                "file": "plugins/cordova-plugin-camera/www/CameraPopoverOptions.js",
                "id": "cordova-plugin-camera.CameraPopoverOptions",
                "clobbers": [
                    "CameraPopoverOptions"
                ]
            }, {
                "file": "plugins/cordova-plugin-camera/www/Camera.js",
                "id": "cordova-plugin-camera.camera",
                "clobbers": [
                    "navigator.camera"
                ]
            }, {
                "file": "plugins/cordova-plugin-camera/www/CameraPopoverHandle.js",
                "id": "cordova-plugin-camera.CameraPopoverHandle",
                "clobbers": [
                    "CameraPopoverHandle"
                ]
            }];

            var arrInAppBrowser = [{
                "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
                "id": "cordova-plugin-inappbrowser.inappbrowser",
                "clobbers": [
                    "cordova.InAppBrowser.open",
                    "window.open"
                ]
            }];

            var arrDronaHQ = [{
                "id": "cordova-plugin-dronahq.user",
                "clobbers": [
                    "DronaHQ.user"
                ]
            }, {
                "id": "cordova-plugin-dronahq.notification",
                "clobbers": [
                    "DronaHQ.notification"
                ]
            }, {
                "id": "cordova-plugin-dronahq.app",
                "clobbers": [
                    "DronaHQ.app"
                ]
            }, {
                "id": "cordova-plugin-dronahq.sync",
                "clobbers": [
                    "DronaHQ.sync"
                ]
            }, {
                "id": "cordova-plugin-dronahq.kvstore",
                "clobbers": [
                    "DronaHQ.KVStore"
                ]
            }];

            var arrFileTransfer = [{
                "file": "plugins/cordova-plugin-file-transfer/www/FileTransferError.js",
                "id": "cordova-plugin-file-transfer.FileTransferError",
                "clobbers": [
                    "window.FileTransferError"
                ]
            }, {
                "file": "plugins/cordova-plugin-file-transfer/www/FileTransfer.js",
                "id": "cordova-plugin-file-transfer.FileTransfer",
                "clobbers": [
                    "window.FileTransfer"
                ]
            }];

            var arrFile = [{
                "file": "plugins/cordova-plugin-file/www/DirectoryEntry.js",
                "id": "cordova-plugin-file.DirectoryEntry",
                "clobbers": [
                    "window.DirectoryEntry"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/DirectoryReader.js",
                "id": "cordova-plugin-file.DirectoryReader",
                "clobbers": [
                    "window.DirectoryReader"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/Entry.js",
                "id": "cordova-plugin-file.Entry",
                "clobbers": [
                    "window.Entry"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/File.js",
                "id": "cordova-plugin-file.File",
                "clobbers": [
                    "window.File"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileEntry.js",
                "id": "cordova-plugin-file.FileEntry",
                "clobbers": [
                    "window.FileEntry"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileError.js",
                "id": "cordova-plugin-file.FileError",
                "clobbers": [
                    "window.FileError"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileReader.js",
                "id": "cordova-plugin-file.FileReader",
                "clobbers": [
                    "window.FileReader"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileSystem.js",
                "id": "cordova-plugin-file.FileSystem",
                "clobbers": [
                    "window.FileSystem"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileUploadOptions.js",
                "id": "cordova-plugin-file.FileUploadOptions",
                "clobbers": [
                    "window.FileUploadOptions"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileUploadResult.js",
                "id": "cordova-plugin-file.FileUploadResult",
                "clobbers": [
                    "window.FileUploadResult"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/FileWriter.js",
                "id": "cordova-plugin-file.FileWriter",
                "clobbers": [
                    "window.FileWriter"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/Flags.js",
                "id": "cordova-plugin-file.Flags",
                "clobbers": [
                    "window.Flags"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/LocalFileSystem.js",
                "id": "cordova-plugin-file.LocalFileSystem",
                "clobbers": [
                    "window.LocalFileSystem"
                ],
                "merges": [
                    "window"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/Metadata.js",
                "id": "cordova-plugin-file.Metadata",
                "clobbers": [
                    "window.Metadata"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/ProgressEvent.js",
                "id": "cordova-plugin-file.ProgressEvent",
                "clobbers": [
                    "window.ProgressEvent"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/fileSystems.js",
                "id": "cordova-plugin-file.fileSystems"
            }, {
                "file": "plugins/cordova-plugin-file/www/requestFileSystem.js",
                "id": "cordova-plugin-file.requestFileSystem",
                "clobbers": [
                    "window.requestFileSystem"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/resolveLocalFileSystemURI.js",
                "id": "cordova-plugin-file.resolveLocalFileSystemURI",
                "merges": [
                    "window"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/ios/FileSystem.js",
                "id": "cordova-plugin-file.iosFileSystem",
                "merges": [
                    "FileSystem"
                ]
            }, {
                "file": "plugins/cordova-plugin-file/www/fileSystems-roots.js",
                "id": "cordova-plugin-file.fileSystems-roots",
                "runs": true
            }, {
                "file": "plugins/cordova-plugin-file/www/fileSystemPaths.js",
                "id": "cordova-plugin-file.fileSystemPaths",
                "merges": [
                    "cordova"
                ],
                "runs": true
            }];

            var arrGeo = [{
                "file": "plugins/cordova-plugin-geolocation/www/Coordinates.js",
                "id": "cordova-plugin-geolocation.Coordinates",
                "clobbers": [
                    "Coordinates"
                ]
            }, {
                "file": "plugins/cordova-plugin-geolocation/www/PositionError.js",
                "id": "cordova-plugin-geolocation.PositionError",
                "clobbers": [
                    "PositionError"
                ]
            }, {
                "file": "plugins/cordova-plugin-geolocation/www/Position.js",
                "id": "cordova-plugin-geolocation.Position",
                "clobbers": [
                    "Position"
                ]
            }, {
                "file": "plugins/cordova-plugin-geolocation/www/geolocation.js",
                "id": "cordova-plugin-geolocation.geolocation",
                "clobbers": [
                    "navigator.geolocation"
                ]
            }];

            var arrSqlliteStorage = [{
                "file": "plugins/cordova-sqlite-storage/www/SQLitePlugin.js",
                "id": "cordova-sqlite-storage.SQLitePlugin",
                "clobbers": [
                    "SQLitePlugin"
                ]
            }];

            var arrKeyboardIOS = [{
                "file": "",
                "id": "ionic-plugin-keyboard.iOS",
                "clobbers": [
                    "cordova.plugins.Keyboard"
                ]
            }];
            var arrKeyboardAndroid = [{
                "file": "",
                "id": "ionic-plugin-keyboard.Android",
                "clobbers": [
                    "cordova.plugins.Keyboard"
                ]
            }];

            var arrLocalNotification = [{
                "file": "plugins/de.appplant.cordova.plugin.local-notification/www/local-notification.js",
                "id": "de.appplant.cordova.plugin.local-notification.LocalNotification",
                "clobbers": [
                    "cordova.plugins.notification.local",
                    "plugin.notification.local"
                ]
            }, {
                "file": "plugins/de.appplant.cordova.plugin.local-notification/www/local-notification-core.js",
                "id": "de.appplant.cordova.plugin.local-notification.LocalNotification.Core",
                "clobbers": [
                    "cordova.plugins.notification.local.core",
                    "plugin.notification.local.core"
                ]
            }, {
                "file": "plugins/de.appplant.cordova.plugin.local-notification/www/local-notification-util.js",
                "id": "de.appplant.cordova.plugin.local-notification.LocalNotification.Util",
                "merges": [
                    "cordova.plugins.notification.local.core",
                    "plugin.notification.local.core"
                ]
            }];

            var arrCalendar = [{
                "file": "plugins/cordova-plugin-calendar/www/Calendar.js",
                "id": "cordova-plugin-calendar.Calendar",
                "clobbers": [
                    "Calendar"
                ]
            }];

            var arrDialog = [{
                "file": "plugins/cordova-plugin-dialogs/www/notification.js",
                "id": "cordova-plugin-dialogs.notification",
                "merges": [
                    "navigator.notification"
                ]
            }];

            var arrBarcodeScanner = [{
                "file": "plugins/phonegap-plugin-barcodescanner/www/barcodescanner.js",
                "id": "phonegap-plugin-barcodescanner.BarcodeScanner",
                "clobbers": [
                    "cordova.plugins.barcodeScanner"
                ]
            }];

            var arrNetworkInfo = [{
                "file": "plugins/cordova-plugin-network-information/www/network.js",
                "id": "cordova-plugin-network-information.network",
                "clobbers": [
                    "navigator.connection",
                    "navigator.network.connection"
                ]
            }, {
                "file": "plugins/cordova-plugin-network-information/www/Connection.js",
                "id": "cordova-plugin-network-information.Connection",
                "clobbers": [
                    "Connection"
                ]
            }];

            var arrSocialSharing = [{
                "file": "plugins/cordova-plugin-x-socialsharing/www/SocialSharing.js",
                "id": "cordova-plugin-x-socialsharing.SocialSharing",
                "clobbers": [
                    "window.plugins.socialsharing"
                ]
            }];

            var arrTableauOAuth = [{
                "file": "plugins/tableau-plugin-oauth/www/TableauOAuth.js",
                "id": "tableau-plugin-oauth.TableauOAuth",
                "clobbers": [
                    "TableauOAuth"
                ]
            }];

            var arrCallNumber = [{
                "file": "plugins/call-number/www/CallNumber.js",
                "id": "call-number.CallNumber",
                "clobbers": [
                    "call"
                ]
            }];

            var arrLocationAccuracy = [{
                "file": "plugins/cordova-plugin-request-location-accuracy/www/android/RequestLocationAccuracy.js",
                "id": "cordova-plugin-request-location-accuracy.RequestLocationAccuracy",
                "clobbers": [
                    "cordova.plugins.locationAccuracy"
                ]
            }];

            var arrDeviceOrientation = [{
                "file": "plugins/cordova-plugin-device-orientation/www/CompassError.js",
                "id": "cordova-plugin-device-orientation.CompassError",
                "clobbers": [
                    "CompassError"
                ]
            },
            {
                "file": "plugins/cordova-plugin-device-orientation/www/CompassHeading.js",
                "id": "cordova-plugin-device-orientation.CompassHeading",
                "clobbers": [
                    "CompassHeading"
                ]
            },
            {
                "file": "plugins/cordova-plugin-device-orientation/www/compass.js",
                "id": "cordova-plugin-device-orientation.compass",
                "clobbers": [
                    "navigator.compass"
                ]
            }];

            var arrEmailPlugin = [{
                "file": "plugins/cordova-plugin-email-composer/www/email_composer.js",
                "id": "cordova-plugin-email-composer.EmailComposer",
                "clobbers": [
                    "cordova.plugins.email",
                    "plugin.email"
                ]
            }];


            var arrPluginList = [];
            var objPluginMeta = {
                "cordova-plugin-file-transfer": "1.3.0",
                "": ""
            };

            // Camera
            if (DronaHQ.plugins.camera) {
                arrPluginList = arrPluginList.concat(arrCamera);
                objPluginMeta["cordova-plugin-camera"] = "1.2.0";
            }
            // Device
            if (DronaHQ.plugins.device) {
                arrPluginList = arrPluginList.concat(arrDevice);
                objPluginMeta["cordova-plugin-device"] = "1.0.1";
            }
            // InAppBrowser
            if (DronaHQ.plugins.inappbrowser) {
                arrPluginList = arrPluginList.concat(arrInAppBrowser);
                objPluginMeta["cordova-plugin-inappbrowser"] = "1.0.1";
            }
            // DronaHQ
            if (DronaHQ.plugins.dronahq) {
                arrPluginList = arrPluginList.concat(arrDronaHQ);
                objPluginMeta["cordova-plugin-dronahq"] = "0.5";
            }
            // File
            if (DronaHQ.plugins.file) {
                arrPluginList = arrPluginList.concat(arrFile);
                objPluginMeta["cordova-plugin-file"] = "3.0.0";
            }
            // FileTransfer
            if (DronaHQ.plugins.filetransfer) {
                arrPluginList = arrPluginList.concat(arrFileTransfer);
                objPluginMeta["cordova-plugin-file-transfer"] = "1.3.0";
            }
            // Geo
            if (DronaHQ.plugins.geo) {
                arrPluginList = arrPluginList.concat(arrGeo);
                objPluginMeta["cordova-plugin-geolocation"] = "1.0.2-dev";
            }
            // Sqlite
            if (DronaHQ.plugins.sqlite) {
                arrPluginList = arrPluginList.concat(arrSqlliteStorage);
                objPluginMeta["cordova-sqlite-storage"] = "0.8.0";
            }
            // Keyboard
            if (DronaHQ.plugins.keyboard) {
                if (DronaHQ.onIos) {
                    arrPluginList = arrPluginList.concat(arrKeyboardIOS);
                    objPluginMeta["ionic-plugin-keyboard"] = "2.0.1";
                }
                if (DronaHQ.onAndroid) {
                    arrPluginList = arrPluginList.concat(arrKeyboardAndroid);
                    objPluginMeta["ionic-plugin-keyboard"] = "2.0.1";
                }
            }
            // Local Notification
            if (DronaHQ.plugins.localnotification) {
                arrPluginList = arrPluginList.concat(arrLocalNotification);
                objPluginMeta["cordova-plugin-local-notifications"] = "0.8.4";
            }

            // Calendar
            if (DronaHQ.plugins.calendar) {
                arrPluginList = arrPluginList.concat(arrCalendar);
            }

            // Dialog
            arrPluginList = arrPluginList.concat(arrDialog);

            // Barcode Scanner
            arrPluginList = arrPluginList.concat(arrBarcodeScanner);

            // Connection network
            arrPluginList = arrPluginList.concat(arrNetworkInfo);

            // Social Sharing
            arrPluginList = arrPluginList.concat(arrSocialSharing);

            // Tableau OAuth Plugin
            if (DronaHQ.onIos) {
                arrPluginList = arrPluginList.concat(arrTableauOAuth);
            }

            arrPluginList = arrPluginList.concat(arrCallNumber);

            arrPluginList = arrPluginList.concat(arrLocationAccuracy);

            arrPluginList = arrPluginList.concat(arrEmailPlugin);

            module.exports = arrPluginList;
            module.exports.metadata = objPluginMeta;
        });

        // file: src/common/pluginloader.js
        define("cordova/pluginloader", function (require, exports, module) {

            var modulemapper = require('cordova/modulemapper');
            var urlutil = require('cordova/urlutil');

            // Helper function to inject a <script> tag.
            // Exported for testing.
            exports.injectScript = function (url, onload, onerror) {
                var script = document.createElement("script");
                // onload fires even when script fails loads with an error.
                script.onload = onload;
                // onerror fires for malformed URLs.
                script.onerror = onerror;
                script.src = url;
                document.head.appendChild(script);
            };

            function injectIfNecessary(id, url, onload, onerror) {
                onerror = onerror || onload;
                if (id in define.moduleMap) {
                    onload();
                } else {
                    exports.injectScript(url, function () {
                        if (id in define.moduleMap) {
                            onload();
                        } else {
                            onerror();
                        }
                    }, onerror);
                }
            }

            function onScriptLoadingComplete(moduleList, finishPluginLoading) {
                // Loop through all the plugins and then through their clobbers and merges.
                for (var i = 0, module; module = moduleList[i]; i++) {
                    if (module.clobbers && module.clobbers.length) {
                        for (var j = 0; j < module.clobbers.length; j++) {
                            modulemapper.clobbers(module.id, module.clobbers[j]);
                        }
                    }

                    if (module.merges && module.merges.length) {
                        for (var k = 0; k < module.merges.length; k++) {
                            modulemapper.merges(module.id, module.merges[k]);
                        }
                    }

                    // Finally, if runs is truthy we want to simply require() the module.
                    if (module.runs) {
                        modulemapper.runs(module.id);
                    }
                }

                finishPluginLoading();
            }

            // Handler for the cordova_plugins.js content.
            // See plugman's plugin_loader.js for the details of this object.
            // This function is only called if the really is a plugins array that isn't empty.
            // Otherwise the onerror response handler will just call finishPluginLoading().
            function handlePluginsObject(path, moduleList, finishPluginLoading) {
                // Now inject the scripts.
                var scriptCounter = moduleList.length;

                if (!scriptCounter) {
                    finishPluginLoading();
                    return;
                }

                function scriptLoadedCallback() {
                    if (!--scriptCounter) {
                        onScriptLoadingComplete(moduleList, finishPluginLoading);
                    }
                }

                for (var i = 0; i < moduleList.length; i++) {
                    injectIfNecessary(moduleList[i].id, path + moduleList[i].file, scriptLoadedCallback);
                }
            }

            function findCordovaPath() {
                var path = null;
                var scripts = document.getElementsByTagName('script');
                var term = '/cordova.js';
                for (var n = scripts.length - 1; n > -1; n--) {
                    var src = scripts[n].src.replace(/\?.*$/, ''); // Strip any query param (CB-6007).
                    if (src.indexOf(term) == (src.length - term.length)) {
                        path = src.substring(0, src.length - term.length) + '/';
                        break;
                    }
                }
                return path;
            }

            // Tries to load all plugins' js-modules.
            // This is an async process, but onDeviceReady is blocked on onPluginsReady.
            // onPluginsReady is fired when there are no plugins to load, or they are all done.
            exports.load = function (callback) {
                var pathPrefix = findCordovaPath();
                if (pathPrefix === null) {
                    //console.log('Could not find cordova.js script tag. Plugin loading may fail.');
                    pathPrefix = '';
                }
                injectIfNecessary('cordova/plugin_list', pathPrefix + 'cordova_plugins.js', function () {
                    var moduleList = require("cordova/plugin_list");

                    //Normally cordova likes to inject plugin scripts in the page
                    //Our case, we want 1 js that will be used by developers.
                    //So, we will have all those plugin code in this file only
                    _fnCordovaPlugins();

                    handlePluginsObject(pathPrefix, moduleList, callback);
                }, callback);
            };


        });

        // file: src/common/urlutil.js
        define("cordova/urlutil", function (require, exports, module) {


            /**
             * For already absolute URLs, returns what is passed in.
             * For relative URLs, converts them to absolute ones.
             */
            exports.makeAbsolute = function makeAbsolute(url) {
                var anchorEl = document.createElement('a');
                anchorEl.href = url;
                return anchorEl.href;
            };


        });

        // file: src/common/utils.js
        define("cordova/utils", function (require, exports, module) {

            var utils = exports;

            /**
             * Defines a property getter / setter for obj[key].
             */
            utils.defineGetterSetter = function (obj, key, getFunc, opt_setFunc) {
                if (Object.defineProperty) {
                    var desc = {
                        get: getFunc,
                        configurable: true
                    };
                    if (opt_setFunc) {
                        desc.set = opt_setFunc;
                    }
                    Object.defineProperty(obj, key, desc);
                } else {
                    obj.__defineGetter__(key, getFunc);
                    if (opt_setFunc) {
                        obj.__defineSetter__(key, opt_setFunc);
                    }
                }
            };

            /**
             * Defines a property getter for obj[key].
             */
            utils.defineGetter = utils.defineGetterSetter;

            utils.arrayIndexOf = function (a, item) {
                if (a.indexOf) {
                    return a.indexOf(item);
                }
                var len = a.length;
                for (var i = 0; i < len; ++i) {
                    if (a[i] == item) {
                        return i;
                    }
                }
                return -1;
            };

            /**
             * Returns whether the item was found in the array.
             */
            utils.arrayRemove = function (a, item) {
                var index = utils.arrayIndexOf(a, item);
                if (index != -1) {
                    a.splice(index, 1);
                }
                return index != -1;
            };

            utils.typeName = function (val) {
                return Object.prototype.toString.call(val).slice(8, -1);
            };

            /**
             * Returns an indication of whether the argument is an array or not
             */
            utils.isArray = function (a) {
                return utils.typeName(a) == 'Array';
            };

            /**
             * Returns an indication of whether the argument is a Date or not
             */
            utils.isDate = function (d) {
                return utils.typeName(d) == 'Date';
            };

            /**
             * Does a deep clone of the object.
             */
            utils.clone = function (obj) {
                if (!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
                    return obj;
                }

                var retVal, i;

                if (utils.isArray(obj)) {
                    retVal = [];
                    for (i = 0; i < obj.length; ++i) {
                        retVal.push(utils.clone(obj[i]));
                    }
                    return retVal;
                }

                retVal = {};
                for (i in obj) {
                    if (!(i in retVal) || retVal[i] != obj[i]) {
                        retVal[i] = utils.clone(obj[i]);
                    }
                }
                return retVal;
            };

            /**
             * Returns a wrapped version of the function
             */
            utils.close = function (context, func, params) {
                if (typeof params == 'undefined') {
                    return function () {
                        return func.apply(context, arguments);
                    };
                } else {
                    return function () {
                        return func.apply(context, params);
                    };
                }
            };

            /**
             * Create a UUID
             */
            utils.createUUID = function () {
                return UUIDcreatePart(4) + '-' +
                    UUIDcreatePart(2) + '-' +
                    UUIDcreatePart(2) + '-' +
                    UUIDcreatePart(2) + '-' +
                    UUIDcreatePart(6);
            };

            /**
             * Extends a child object from a parent object using classical inheritance
             * pattern.
             */
            utils.extend = (function () {
                // proxy used to establish prototype chain
                var F = function () { };
                // extend Child from Parent
                return function (Child, Parent) {
                    F.prototype = Parent.prototype;
                    Child.prototype = new F();
                    Child.__super__ = Parent.prototype;
                    Child.prototype.constructor = Child;
                };
            }());

            /**
             * Alerts a message in any available way: alert or console.log.
             */
            utils.alert = function (msg) {
                if (window.alert) {
                    //window.alert(msg);
                    console.log(msg);
                } else if (console && console.log) {
                    console.log(msg);
                }
            };

            //------------------------------------------------------------------------------
            function UUIDcreatePart(length) {
                var uuidpart = "";
                for (var i = 0; i < length; i++) {
                    var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
                    if (uuidchar.length == 1) {
                        uuidchar = "0" + uuidchar;
                    }
                    uuidpart += uuidchar;
                }
                return uuidpart;
            }


        });

        window.cordova = require('cordova');
        // file: src/scripts/bootstrap.js

        require('cordova/init');
    };

    var _fnCordovaiOS = function () {
        // Platform: ios
        // 3.6.3
        /*
         Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at
    
             http://www.apache.org/licenses/LICENSE-2.0
    
         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
        */

        var CORDOVA_JS_BUILD_LABEL = '3.6.3';

        // file: D:/Github/cordova-ios/cordova-js-src/exec.js
        define("cordova/exec", function (require, exports, module) {

            /**
             * Creates a gap bridge iframe used to notify the native code about queued
             * commands.
             */
            var cordova = require('cordova'),
                channel = require('cordova/channel'),
                utils = require('cordova/utils'),
                base64 = require('cordova/base64'),
                // XHR mode does not work on iOS 4.2.
                // XHR mode's main advantage is working around a bug in -webkit-scroll, which
                // doesn't exist only on iOS 5.x devices.
                // IFRAME_NAV is the fastest.
                // IFRAME_HASH could be made to enable synchronous bridge calls if we wanted this feature.
                jsToNativeModes = {
                    IFRAME_NAV: 0,
                    XHR_NO_PAYLOAD: 1,
                    XHR_WITH_PAYLOAD: 2,
                    XHR_OPTIONAL_PAYLOAD: 3,
                    IFRAME_HASH_NO_PAYLOAD: 4,
                    // Bundling the payload turns out to be slower. Probably since it has to be URI encoded / decoded.
                    IFRAME_HASH_WITH_PAYLOAD: 5,
                    WK_WEBVIEW_BINDING: 6
                },
                bridgeMode,
                execIframe,
                execHashIframe,
                hashToggle = 1,
                execXhr,
                requestCount = 0,
                vcHeaderValue = null,
                commandQueue = [], // Contains pending JS->Native messages.
                isInContextOfEvalJs = 0;

            function createExecIframe() {
                var iframe = document.createElement("iframe");
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                return iframe;
            }

            function createHashIframe() {
                var ret = createExecIframe();
                // Hash changes don't work on about:blank, so switch it to file:///.
                ret.contentWindow.history.replaceState(null, null, 'file:///#');
                return ret;
            }

            function shouldBundleCommandJson() {
                if (bridgeMode === jsToNativeModes.XHR_WITH_PAYLOAD) {
                    return true;
                }
                if (bridgeMode === jsToNativeModes.XHR_OPTIONAL_PAYLOAD) {
                    var payloadLength = 0;
                    for (var i = 0; i < commandQueue.length; ++i) {
                        payloadLength += commandQueue[i].length;
                    }
                    // The value here was determined using the benchmark within CordovaLibApp on an iPad 3.
                    return payloadLength < 4500;
                }
                return false;
            }

            function massageArgsJsToNative(args) {
                if (!args || utils.typeName(args) != 'Array') {
                    return args;
                }
                var ret = [];
                args.forEach(function (arg, i) {
                    if (utils.typeName(arg) == 'ArrayBuffer') {
                        ret.push({
                            'CDVType': 'ArrayBuffer',
                            'data': base64.fromArrayBuffer(arg)
                        });
                    } else {
                        ret.push(arg);
                    }
                });
                return ret;
            }

            function massageMessageNativeToJs(message) {
                if (message.CDVType == 'ArrayBuffer') {
                    var stringToArrayBuffer = function (str) {
                        var ret = new Uint8Array(str.length);
                        for (var i = 0; i < str.length; i++) {
                            ret[i] = str.charCodeAt(i);
                        }
                        return ret.buffer;
                    };
                    var base64ToArrayBuffer = function (b64) {
                        return stringToArrayBuffer(atob(b64));
                    };
                    message = base64ToArrayBuffer(message.data);
                }
                return message;
            }

            function convertMessageToArgsNativeToJs(message) {
                var args = [];
                if (!message || !message.hasOwnProperty('CDVType')) {
                    args.push(message);
                } else if (message.CDVType == 'MultiPart') {
                    message.messages.forEach(function (e) {
                        args.push(massageMessageNativeToJs(e));
                    });
                } else {
                    args.push(massageMessageNativeToJs(message));
                }
                return args;
            }

            function iOSExec() {
                // Use XHR for iOS 5 to work around a bug in -webkit-scroll.
                // Use IFRAME_NAV elsewhere since it's faster and XHR bridge
                // seems to have bugs in newer OS's (CB-3900, CB-3359, CB-5457, CB-4970, CB-4998, CB-5134)
                if (bridgeMode === undefined) {
                    if (navigator.userAgent) {
                        bridgeMode = navigator.userAgent.indexOf(' 5_') == -1 ? jsToNativeModes.IFRAME_NAV : jsToNativeModes.XHR_NO_PAYLOAD;
                    } else {
                        bridgeMode = jsToNativeModes.IFRAME_NAV;
                    }
                }

                if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.cordova && window.webkit.messageHandlers.cordova.postMessage) {
                    bridgeMode = jsToNativeModes.WK_WEBVIEW_BINDING;
                }

                var successCallback, failCallback, service, action, actionArgs, splitCommand;
                var callbackId = null;
                if (typeof arguments[0] !== "string") {
                    // FORMAT ONE
                    successCallback = arguments[0];
                    failCallback = arguments[1];
                    service = arguments[2];
                    action = arguments[3];
                    actionArgs = arguments[4];

                    // Since we need to maintain backwards compatibility, we have to pass
                    // an invalid callbackId even if no callback was provided since plugins
                    // will be expecting it. The Cordova.exec() implementation allocates
                    // an invalid callbackId and passes it even if no callbacks were given.
                    callbackId = 'INVALID';
                } else {
                    // FORMAT TWO, REMOVED
                    try {
                        splitCommand = arguments[0].split(".");
                        action = splitCommand.pop();
                        service = splitCommand.join(".");
                        actionArgs = Array.prototype.splice.call(arguments, 1);

                        console.log('The old format of this exec call has been removed (deprecated since 2.1). Change to: ' +
                            "cordova.exec(null, null, \"" + service + "\", \"" + action + "\"," + JSON.stringify(actionArgs) + ");"
                        );
                        return;
                    } catch (e) { }
                }

                // If actionArgs is not provided, default to an empty array
                actionArgs = actionArgs || [];

                // Register the callbacks and add the callbackId to the positional
                // arguments if given.
                callbackId = service + cordova.callbackId++;
                if (successCallback || failCallback) {
                    cordova.callbacks[callbackId] = {
                        success: successCallback,
                        fail: failCallback
                    };
                }

                actionArgs = massageArgsJsToNative(actionArgs);

                var command = [callbackId, service, action, actionArgs];

                // Stringify and queue the command. We stringify to command now to
                // effectively clone the command arguments in case they are mutated before
                // the command is executed.
                commandQueue.push(JSON.stringify(command));

                if (bridgeMode === jsToNativeModes.WK_WEBVIEW_BINDING) {
                    window.webkit.messageHandlers.cordova.postMessage(command);
                } else {
                    // If we're in the context of a stringByEvaluatingJavaScriptFromString call,
                    // then the queue will be flushed when it returns; no need for a poke.
                    // Also, if there is already a command in the queue, then we've already
                    // poked the native side, so there is no reason to do so again.
                    if (!isInContextOfEvalJs && commandQueue.length == 1) {
                        switch (bridgeMode) {
                            case jsToNativeModes.XHR_NO_PAYLOAD:
                            case jsToNativeModes.XHR_WITH_PAYLOAD:
                            case jsToNativeModes.XHR_OPTIONAL_PAYLOAD:
                                pokeNativeViaXhr();
                                break;
                            default: // iframe-based.
                                pokeNativeViaIframe();
                        }
                    }
                }
            }

            function pokeNativeViaXhr() {
                // This prevents sending an XHR when there is already one being sent.
                // This should happen only in rare circumstances (refer to unit tests).
                if (execXhr && execXhr.readyState != 4) {
                    execXhr = null;
                }
                // Re-using the XHR improves exec() performance by about 10%.
                execXhr = execXhr || new XMLHttpRequest();
                // Changing this to a GET will make the XHR reach the URIProtocol on 4.2.
                // For some reason it still doesn't work though...
                // Add a timestamp to the query param to prevent caching.
                execXhr.open('HEAD', "/!gap_exec?" + (+new Date()), true);
                if (!vcHeaderValue) {
                    vcHeaderValue = /.*\((.*)\)/.exec(navigator.userAgent)[1];
                }
                execXhr.setRequestHeader('vc', vcHeaderValue);
                execXhr.setRequestHeader('rc', ++requestCount);
                if (shouldBundleCommandJson()) {
                    execXhr.setRequestHeader('cmds', iOSExec.nativeFetchMessages());
                }
                execXhr.send(null);
            }

            function pokeNativeViaIframe() {
                // CB-5488 - Don't attempt to create iframe before document.body is available.
                if (!document.body) {
                    setTimeout(pokeNativeViaIframe);
                    return;
                }
                if (bridgeMode === jsToNativeModes.IFRAME_HASH_NO_PAYLOAD || bridgeMode === jsToNativeModes.IFRAME_HASH_WITH_PAYLOAD) {
                    execHashIframe = execHashIframe || createHashIframe();
                    // Check if they've removed it from the DOM, and put it back if so.
                    if (!execHashIframe.contentWindow) {
                        execHashIframe = createHashIframe();
                    }
                    // The delegate method is called only when the hash changes, so toggle it back and forth.
                    hashToggle = hashToggle ^ 3;
                    var hashValue = '%0' + hashToggle;
                    if (bridgeMode === jsToNativeModes.IFRAME_HASH_WITH_PAYLOAD) {
                        hashValue += iOSExec.nativeFetchMessages();
                    }
                    execHashIframe.contentWindow.location.hash = hashValue;
                } else {
                    execIframe = execIframe || createExecIframe();
                    // Check if they've removed it from the DOM, and put it back if so.
                    if (!execIframe.contentWindow) {
                        execIframe = createExecIframe();
                    }
                    execIframe.src = "gap://ready";
                }
            }

            iOSExec.jsToNativeModes = jsToNativeModes;

            iOSExec.setJsToNativeBridgeMode = function (mode) {
                // Remove the iFrame since it may be no longer required, and its existence
                // can trigger browser bugs.
                // https://issues.apache.org/jira/browse/CB-593
                if (execIframe) {
                    execIframe.parentNode.removeChild(execIframe);
                    execIframe = null;
                }
                bridgeMode = mode;
            };

            iOSExec.nativeFetchMessages = function () {
                // Each entry in commandQueue is a JSON string already.
                if (!commandQueue.length) {
                    return '';
                }
                var json = '[' + commandQueue.join(',') + ']';
                commandQueue.length = 0;
                return json;
            };

            iOSExec.nativeCallback = function (callbackId, status, message, keepCallback) {
                return iOSExec.nativeEvalAndFetch(function () {
                    var success = status === 0 || status === 1;
                    var args = convertMessageToArgsNativeToJs(message);
                    cordova.callbackFromNative(callbackId, success, status, args, keepCallback);
                });
            };

            iOSExec.nativeEvalAndFetch = function (func) {
                // This shouldn't be nested, but better to be safe.
                isInContextOfEvalJs++;
                try {
                    func();
                    return iOSExec.nativeFetchMessages();
                } finally {
                    isInContextOfEvalJs--;
                }
            };

            module.exports = iOSExec;

        });

        // file: D:/Github/cordova-ios/cordova-js-src/platform.js
        define("cordova/platform", function (require, exports, module) {

            module.exports = {
                id: 'ios',
                bootstrap: function () {
                    require('cordova/channel').onNativeReady.fire();
                }
            };


        });

        _fnCordovaCommon(CORDOVA_JS_BUILD_LABEL);
    };

    var _fnCordovAndroid = function () {
        // Platform: android
        // 3.6.3
        /*
         Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at
    
             http://www.apache.org/licenses/LICENSE-2.0
    
         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
        */
        var CORDOVA_JS_BUILD_LABEL = '3.6.3';

        // file: src/android/android/nativeapiprovider.js
        define("cordova/android/nativeapiprovider", function (require, exports, module) {

            /**
             * Exports the ExposedJsApi.java object if available, otherwise exports the PromptBasedNativeApi.
             */

            var nativeApi = this._cordovaNative || require('cordova/android/promptbasednativeapi');
            var currentApi = nativeApi;

            module.exports = {
                get: function () {
                    return currentApi;
                },
                setPreferPrompt: function (value) {
                    currentApi = value ? require('cordova/android/promptbasednativeapi') : nativeApi;
                },
                // Used only by tests.
                set: function (value) {
                    currentApi = value;
                }
            };

        });

        // file: src/android/android/promptbasednativeapi.js
        define("cordova/android/promptbasednativeapi", function (require, exports, module) {

            /**
             * Implements the API of ExposedJsApi.java, but uses prompt() to communicate.
             * This is used pre-JellyBean, where addJavascriptInterface() is disabled.
             */

            module.exports = {
                exec: function (bridgeSecret, service, action, callbackId, argsJson) {
                    return prompt(argsJson, 'gap:' + JSON.stringify([bridgeSecret, service, action, callbackId]));
                },
                setNativeToJsBridgeMode: function (bridgeSecret, value) {
                    prompt(value, 'gap_bridge_mode:' + bridgeSecret);
                },
                retrieveJsMessages: function (bridgeSecret, fromOnlineEvent) {
                    return prompt(+fromOnlineEvent, 'gap_poll:' + bridgeSecret);
                }
            };

        });

        // file: src/android/exec.js
        define("cordova/exec", function (require, exports, module) {

            /**
             * Execute a cordova command.  It is up to the native side whether this action
             * is synchronous or asynchronous.  The native side can return:
             *      Synchronous: PluginResult object as a JSON string
             *      Asynchronous: Empty string ""
             * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
             * depending upon the result of the action.
             *
             * @param {Function} success    The success callback
             * @param {Function} fail       The fail callback
             * @param {String} service      The name of the service to use
             * @param {String} action       Action to be run in cordova
             * @param {String[]} [args]     Zero or more arguments to pass to the method
             */
            var cordova = require('cordova'),
                nativeApiProvider = require('cordova/android/nativeapiprovider'),
                utils = require('cordova/utils'),
                base64 = require('cordova/base64'),
                channel = require('cordova/channel'),
                jsToNativeModes = {
                    PROMPT: 0,
                    JS_OBJECT: 1
                },
                nativeToJsModes = {
                    // Polls for messages using the JS->Native bridge.
                    POLLING: 0,
                    // For LOAD_URL to be viable, it would need to have a work-around for
                    // the bug where the soft-keyboard gets dismissed when a message is sent.
                    LOAD_URL: 1,
                    // For the ONLINE_EVENT to be viable, it would need to intercept all event
                    // listeners (both through addEventListener and window.ononline) as well
                    // as set the navigator property itself.
                    ONLINE_EVENT: 2,
                    // Uses reflection to access private APIs of the WebView that can send JS
                    // to be executed.
                    // Requires Android 3.2.4 or above.
                    PRIVATE_API: 3
                },
                jsToNativeBridgeMode, // Set lazily.
                nativeToJsBridgeMode = nativeToJsModes.ONLINE_EVENT,
                pollEnabled = false,
                messagesFromNative = [],
                bridgeSecret = -1;

            function androidExec(success, fail, service, action, args) {
                if (bridgeSecret < 0) {
                    // If we ever catch this firing, we'll need to queue up exec()s
                    // and fire them once we get a secret. For now, I don't think
                    // it's possible for exec() to be called since plugins are parsed but
                    // not run until until after onNativeReady.
                    throw new Error('exec() called without bridgeSecret');
                }
                // Set default bridge modes if they have not already been set.
                // By default, we use the failsafe, since addJavascriptInterface breaks too often
                if (jsToNativeBridgeMode === undefined) {
                    androidExec.setJsToNativeBridgeMode(jsToNativeModes.JS_OBJECT);
                }

                // Process any ArrayBuffers in the args into a string.
                for (var i = 0; i < args.length; i++) {
                    if (utils.typeName(args[i]) == 'ArrayBuffer') {
                        args[i] = base64.fromArrayBuffer(args[i]);
                    }
                }

                var callbackId = service + cordova.callbackId++,
                    argsJson = JSON.stringify(args);

                if (success || fail) {
                    cordova.callbacks[callbackId] = {
                        success: success,
                        fail: fail
                    };
                }

                var messages = nativeApiProvider.get().exec(bridgeSecret, service, action, callbackId, argsJson);
                // If argsJson was received by Java as null, try again with the PROMPT bridge mode.
                // This happens in rare circumstances, such as when certain Unicode characters are passed over the bridge on a Galaxy S2.  See CB-2666.
                if (jsToNativeBridgeMode == jsToNativeModes.JS_OBJECT && messages === "@Null arguments.") {
                    androidExec.setJsToNativeBridgeMode(jsToNativeModes.PROMPT);
                    androidExec(success, fail, service, action, args);
                    androidExec.setJsToNativeBridgeMode(jsToNativeModes.JS_OBJECT);
                    return;
                } else {
                    androidExec.processMessages(messages, true);
                }
            }

            androidExec.init = function () {
                bridgeSecret = +prompt('', 'gap_init:' + nativeToJsBridgeMode);
                channel.onNativeReady.fire();
            };

            function pollOnceFromOnlineEvent() {
                pollOnce(true);
            }

            function pollOnce(opt_fromOnlineEvent) {
                if (bridgeSecret < 0) {
                    // This can happen when the NativeToJsMessageQueue resets the online state on page transitions.
                    // We know there's nothing to retrieve, so no need to poll.
                    return;
                }
                var msg = nativeApiProvider.get().retrieveJsMessages(bridgeSecret, !!opt_fromOnlineEvent);
                androidExec.processMessages(msg);
            }

            function pollingTimerFunc() {
                if (pollEnabled) {
                    pollOnce();
                    setTimeout(pollingTimerFunc, 50);
                }
            }

            function hookOnlineApis() {
                function proxyEvent(e) {
                    cordova.fireWindowEvent(e.type);
                }
                // The network module takes care of firing online and offline events.
                // It currently fires them only on document though, so we bridge them
                // to window here (while first listening for exec()-releated online/offline
                // events).
                window.addEventListener('online', pollOnceFromOnlineEvent, false);
                window.addEventListener('offline', pollOnceFromOnlineEvent, false);
                cordova.addWindowEventHandler('online');
                cordova.addWindowEventHandler('offline');
                document.addEventListener('online', proxyEvent, false);
                document.addEventListener('offline', proxyEvent, false);
            }

            hookOnlineApis();

            androidExec.jsToNativeModes = jsToNativeModes;
            androidExec.nativeToJsModes = nativeToJsModes;

            androidExec.setJsToNativeBridgeMode = function (mode) {
                if (mode == jsToNativeModes.JS_OBJECT && !window._cordovaNative) {
                    mode = jsToNativeModes.PROMPT;
                }
                nativeApiProvider.setPreferPrompt(mode == jsToNativeModes.PROMPT);
                jsToNativeBridgeMode = mode;
            };

            androidExec.setNativeToJsBridgeMode = function (mode) {
                if (mode == nativeToJsBridgeMode) {
                    return;
                }
                if (nativeToJsBridgeMode == nativeToJsModes.POLLING) {
                    pollEnabled = false;
                }

                nativeToJsBridgeMode = mode;
                // Tell the native side to switch modes.
                // Otherwise, it will be set by androidExec.init()
                if (bridgeSecret >= 0) {
                    nativeApiProvider.get().setNativeToJsBridgeMode(bridgeSecret, mode);
                }

                if (mode == nativeToJsModes.POLLING) {
                    pollEnabled = true;
                    setTimeout(pollingTimerFunc, 1);
                }
            };

            // Processes a single message, as encoded by NativeToJsMessageQueue.java.
            function processMessage(message) {
                try {
                    var firstChar = message.charAt(0);
                    if (firstChar == 'J') {
                        eval(message.slice(1));
                    } else if (firstChar == 'S' || firstChar == 'F') {
                        var success = firstChar == 'S';
                        var keepCallback = message.charAt(1) == '1';
                        var spaceIdx = message.indexOf(' ', 2);
                        var status = +message.slice(2, spaceIdx);
                        var nextSpaceIdx = message.indexOf(' ', spaceIdx + 1);
                        var callbackId = message.slice(spaceIdx + 1, nextSpaceIdx);
                        var payloadKind = message.charAt(nextSpaceIdx + 1);
                        var payload;
                        if (payloadKind == 's') {
                            payload = message.slice(nextSpaceIdx + 2);
                        } else if (payloadKind == 't') {
                            payload = true;
                        } else if (payloadKind == 'f') {
                            payload = false;
                        } else if (payloadKind == 'N') {
                            payload = null;
                        } else if (payloadKind == 'n') {
                            payload = +message.slice(nextSpaceIdx + 2);
                        } else if (payloadKind == 'A') {
                            var data = message.slice(nextSpaceIdx + 2);
                            var bytes = window.atob(data);
                            var arraybuffer = new Uint8Array(bytes.length);
                            for (var i = 0; i < bytes.length; i++) {
                                arraybuffer[i] = bytes.charCodeAt(i);
                            }
                            payload = arraybuffer.buffer;
                        } else if (payloadKind == 'S') {
                            payload = window.atob(message.slice(nextSpaceIdx + 2));
                        } else {
                            payload = JSON.parse(message.slice(nextSpaceIdx + 1));
                        }
                        cordova.callbackFromNative(callbackId, success, status, [payload], keepCallback);
                    } else {
                        console.log("processMessage failed: invalid message: " + JSON.stringify(message));
                    }
                } catch (e) {
                    console.log("processMessage failed: Error: " + e);
                    console.log("processMessage failed: Stack: " + e.stack);
                    console.log("processMessage failed: Message: " + message);
                }
            }

            var isProcessing = false;

            // This is called from the NativeToJsMessageQueue.java.
            androidExec.processMessages = function (messages, opt_useTimeout) {
                if (messages) {
                    messagesFromNative.push(messages);
                }
                // Check for the reentrant case.
                if (isProcessing) {
                    return;
                }
                if (opt_useTimeout) {
                    window.setTimeout(androidExec.processMessages, 0);
                    return;
                }
                isProcessing = true;
                try {
                    // TODO: add setImmediate polyfill and process only one message at a time.
                    while (messagesFromNative.length) {
                        var msg = popMessageFromQueue();
                        // The Java side can send a * message to indicate that it
                        // still has messages waiting to be retrieved.
                        if (msg == '*' && messagesFromNative.length === 0) {
                            setTimeout(pollOnce, 0);
                            return;
                        }
                        processMessage(msg);
                    }
                } finally {
                    isProcessing = false;
                }
            };

            function popMessageFromQueue() {
                var messageBatch = messagesFromNative.shift();
                if (messageBatch == '*') {
                    return '*';
                }

                var spaceIdx = messageBatch.indexOf(' ');
                var msgLen = +messageBatch.slice(0, spaceIdx);
                var message = messageBatch.substr(spaceIdx + 1, msgLen);
                messageBatch = messageBatch.slice(spaceIdx + msgLen + 1);
                if (messageBatch) {
                    messagesFromNative.unshift(messageBatch);
                }
                return message;
            }

            module.exports = androidExec;

        });

        // file: src/android/platform.js
        define("cordova/platform", function (require, exports, module) {

            module.exports = {
                id: 'android',
                bootstrap: function () {
                    var channel = require('cordova/channel'),
                        cordova = require('cordova'),
                        exec = require('cordova/exec'),
                        modulemapper = require('cordova/modulemapper');

                    // Get the shared secret needed to use the bridge.
                    exec.init();

                    // TODO: Extract this as a proper plugin.
                    modulemapper.clobbers('cordova/plugin/android/app', 'navigator.app');

                    // Inject a listener for the backbutton on the document.
                    var backButtonChannel = cordova.addDocumentEventHandler('backbutton');
                    backButtonChannel.onHasSubscribersChange = function () {
                        // If we just attached the first handler or detached the last handler,
                        // let native know we need to override the back button.
                        exec(null, null, "App", "overrideBackbutton", [this.numHandlers == 1]);
                    };

                    // Add hardware MENU and SEARCH button handlers
                    cordova.addDocumentEventHandler('menubutton');
                    cordova.addDocumentEventHandler('searchbutton');

                    function bindButtonChannel(buttonName) {
                        // generic button bind used for volumeup/volumedown buttons
                        var volumeButtonChannel = cordova.addDocumentEventHandler(buttonName + 'button');
                        volumeButtonChannel.onHasSubscribersChange = function () {
                            exec(null, null, "App", "overrideButton", [buttonName, this.numHandlers == 1]);
                        };
                    }
                    // Inject a listener for the volume buttons on the document.
                    bindButtonChannel('volumeup');
                    bindButtonChannel('volumedown');

                    // Let native code know we are all done on the JS side.
                    // Native code will then un-hide the WebView.
                    channel.onCordovaReady.subscribe(function () {
                        exec(null, null, "App", "show", []);
                    });
                }
            };

        });

        // file: src/android/plugin/android/app.js
        define("cordova/plugin/android/app", function (require, exports, module) {

            var exec = require('cordova/exec');

            module.exports = {
                /**
                 * Clear the resource cache.
                 */
                clearCache: function () {
                    exec(null, null, "App", "clearCache", []);
                },

                /**
                 * Load the url into the webview or into new browser instance.
                 *
                 * @param url           The URL to load
                 * @param props         Properties that can be passed in to the activity:
                 *      wait: int                           => wait msec before loading URL
                 *      loadingDialog: "Title,Message"      => display a native loading dialog
                 *      loadUrlTimeoutValue: int            => time in msec to wait before triggering a timeout error
                 *      clearHistory: boolean              => clear webview history (default=false)
                 *      openExternal: boolean              => open in a new browser (default=false)
                 *
                 * Example:
                 *      navigator.app.loadUrl("http://server/myapp/index.html", {wait:2000, loadingDialog:"Wait,Loading App", loadUrlTimeoutValue: 60000});
                 */
                loadUrl: function (url, props) {
                    exec(null, null, "App", "loadUrl", [url, props]);
                },

                /**
                 * Cancel loadUrl that is waiting to be loaded.
                 */
                cancelLoadUrl: function () {
                    exec(null, null, "App", "cancelLoadUrl", []);
                },

                /**
                 * Clear web history in this web view.
                 * Instead of BACK button loading the previous web page, it will exit the app.
                 */
                clearHistory: function () {
                    exec(null, null, "App", "clearHistory", []);
                },

                /**
                 * Go to previous page displayed.
                 * This is the same as pressing the backbutton on Android device.
                 */
                backHistory: function () {
                    exec(null, null, "App", "backHistory", []);
                },

                /**
                 * Override the default behavior of the Android back button.
                 * If overridden, when the back button is pressed, the "backKeyDown" JavaScript event will be fired.
                 *
                 * Note: The user should not have to call this method.  Instead, when the user
                 *       registers for the "backbutton" event, this is automatically done.
                 *
                 * @param override        T=override, F=cancel override
                 */
                overrideBackbutton: function (override) {
                    exec(null, null, "App", "overrideBackbutton", [override]);
                },

                /**
                 * Override the default behavior of the Android volume button.
                 * If overridden, when the volume button is pressed, the "volume[up|down]button"
                 * JavaScript event will be fired.
                 *
                 * Note: The user should not have to call this method.  Instead, when the user
                 *       registers for the "volume[up|down]button" event, this is automatically done.
                 *
                 * @param button          volumeup, volumedown
                 * @param override        T=override, F=cancel override
                 */
                overrideButton: function (button, override) {
                    exec(null, null, "App", "overrideButton", [button, override]);
                },

                /**
                 * Exit and terminate the application.
                 */
                exitApp: function () {
                    return exec(null, null, "App", "exitApp", []);
                }
            };

        });

        _fnCordovaCommon(CORDOVA_JS_BUILD_LABEL);
    };

    var _fnCordovaWP8 = function () {
        // Platform: windowsphone
        // 3.6.3
        /*
         Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at
    
             http://www.apache.org/licenses/LICENSE-2.0
    
         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
        */

        var CORDOVA_JS_BUILD_LABEL = '3.6.3';

        // file: src/windowsphone/exec.js
        define("cordova/exec", function (require, exports, module) {

            var cordova = require('cordova'),
                base64 = require('cordova/base64');

            /**
             * Execute a cordova command.  It is up to the native side whether this action
             * is synchronous or asynchronous.  The native side can return:
             *      Synchronous: PluginResult object as a JSON string
             *      Asynchronous: Empty string ""
             * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
             * depending upon the result of the action.
             *
             * @param {Function} success    The success callback
             * @param {Function} fail       The fail callback
             * @param {String} service      The name of the service to use
             * @param {String} action       Action to be run in cordova
             * @param {String[]} [args]     Zero or more arguments to pass to the method
      
             */

            module.exports = function (success, fail, service, action, args) {

                var callbackId = service + cordova.callbackId++;
                if (typeof success == "function" || typeof fail == "function") {
                    cordova.callbacks[callbackId] = {
                        success: success,
                        fail: fail
                    };
                }
                args = args || [];
                // generate a new command string, ex. DebugConsole/log/DebugConsole23/["wtf dude?"]
                for (var n = 0; n < args.length; n++) {
                    // special case for ArrayBuffer which could not be stringified out of the box
                    if (typeof ArrayBuffer !== "undefined" && args[n] instanceof ArrayBuffer) {
                        args[n] = base64.fromArrayBuffer(args[n]);
                    }

                    if (typeof args[n] !== "string") {
                        args[n] = JSON.stringify(args[n]);
                    }
                }
                var command = service + "/" + action + "/" + callbackId + "/" + JSON.stringify(args);
                // pass it on to Notify
                try {
                    if (window.external) {
                        window.external.Notify(command);
                    } else {
                        console.log("window.external not available :: command=" + command);
                    }
                } catch (e) {
                    console.log("Exception calling native with command :: " + command + " :: exception=" + e);
                }
            };


        });

        // file: src/windowsphone/platform.js
        define("cordova/platform", function (require, exports, module) {

            module.exports = {
                id: 'windowsphone',
                bootstrap: function () {
                    var cordova = require('cordova'),
                        exec = require('cordova/exec');

                    // Inject a listener for the backbutton, and tell native to override the flag (true/false) when we have 1 or more, or 0, listeners
                    var backButtonChannel = cordova.addDocumentEventHandler('backbutton');
                    backButtonChannel.onHasSubscribersChange = function () {
                        exec(null, null, "CoreEvents", "overridebackbutton", [this.numHandlers == 1]);
                    };
                }
            };

        });

        _fnCordovaCommon(CORDOVA_JS_BUILD_LABEL);
    };

    var _fnCordovaBrowserPlugin = function () {
        //       
    };

    var _fnCordovaBrowser = function () {
        // Platform: browser
        // 3.6.3
        /*
         Licensed to the Apache Software Foundation (ASF) under one
         or more contributor license agreements.  See the NOTICE file
         distributed with this work for additional information
         regarding copyright ownership.  The ASF licenses this file
         to you under the Apache License, Version 2.0 (the
         "License"); you may not use this file except in compliance
         with the License.  You may obtain a copy of the License at
    
             http://www.apache.org/licenses/LICENSE-2.0
    
         Unless required by applicable law or agreed to in writing,
         software distributed under the License is distributed on an
         "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
         KIND, either express or implied.  See the License for the
         specific language governing permissions and limitations
         under the License.
        */

        var CORDOVA_JS_BUILD_LABEL = '3.6.3';

        // file: D:/Github/cordova-browser/cordova-js-src/confighelper.js
        define("cordova/confighelper", function (require, exports, module) {

            var config;

            function Config(xhr) {
                function loadPreferences(xhr) {
                    var parser = new DOMParser();
                    var doc = parser.parseFromString(xhr.responseText, "application/xml");

                    var preferences = doc.getElementsByTagName("preference");
                    return Array.prototype.slice.call(preferences);
                }

                this.xhr = xhr;
                this.preferences = loadPreferences(this.xhr);
            }

            function readConfig(success, error) {
                var xhr;

                if (typeof config != 'undefined') {
                    success(config);
                }

                function fail(msg) {
                    console.error(msg);

                    if (error) {
                        error(msg);
                    }
                }

                var xhrStatusChangeHandler = function () {
                    if (xhr.readyState == 4) {
                        if (xhr.status == 200 || xhr.status == 304 || xhr.status === 0 /* file:// */) {
                            config = new Config(xhr);
                            success(config);
                        } else {
                            fail('[Browser][cordova.js][xhrStatusChangeHandler] Could not XHR config.xml: ' + xhr.statusText);
                        }
                    }
                };

                if ("ActiveXObject" in window) {
                    // Needed for XHR-ing via file:// protocol in IE
                    xhr = new window.ActiveXObject("MSXML2.XMLHTTP");
                    xhr.onreadystatechange = xhrStatusChangeHandler;
                } else {
                    xhr = new XMLHttpRequest();
                    xhr.addEventListener("load", xhrStatusChangeHandler);
                }

                try {
                    xhr.open("get", "config.xml", true);
                    xhr.send();
                } catch (e) {
                    fail('[Browser][cordova.js][readConfig] Could not XHR config.xml: ' + JSON.stringify(e));
                }
            }

            /**
             * Reads a preference value from config.xml.
             * Returns preference value or undefined if it does not exist.
             * @param {String} preferenceName Preference name to read */
            Config.prototype.getPreferenceValue = function getPreferenceValue(preferenceName) {
                var preferenceItem = this.preferences && this.preferences.filter(function (item) {
                    return item.attributes.name && item.attributes.name.value === preferenceName;
                });

                if (preferenceItem && preferenceItem[0] && preferenceItem[0].attributes && preferenceItem[0].attributes.value) {
                    return preferenceItem[0].attributes.value.value;
                }
            };

            exports.readConfig = readConfig;

        });

        // file: src/browser/exec.js
        define("cordova/exec", function (require, exports, module) {

            var cordova = require('cordova');
            var channel = require('cordova/channel');

            var allowedSender = [
                "https://app.dronahq.com",
                "http://dev.app.dronahq.com",
                "http://192.168.2.106"
            ];

            //Our way of doing things is using window.postMessage
            //There are 2 parts in any communication
            //1. Listen
            //2. Send


            //Part 2: Send
            function browserExec(success, fail, service, action, args) {
                //Send to the parent side

                // Register the callbacks and add the callbackId to the positional
                // arguments if given.
                var callbackId = service + cordova.callbackId++;
                if (typeof success == "function" || typeof fail == "function") {
                    cordova.callbacks[callbackId] = {
                        success: success,
                        fail: fail
                    };
                }

                var destinationWindow = window.parent;
                if (destinationWindow) {
                    var objMessage = {
                        service: service,
                        action: action,
                        callbackId: callbackId,
                        args: args
                    };
                    destinationWindow.postMessage(objMessage, '*');
                } else {
                    console.log('DronaHQ Webapp missing?');
                }
            }

            //1. Listen
            var fnReceiveMessage = function (e) {
                //TODO: make sure origin is in our whitelist
                var originAllowed = allowedSender.indexOf(e.origin);
                if (originAllowed > -1) {
                    var msgData = e.data;
                    cordova.callbackFromNative(msgData.callbackId, msgData.success, msgData.status, msgData.payload, msgData.keepCallback);
                }
            };

            browserExec.init = function () {
                window.addEventListener("message", fnReceiveMessage, false);
                channel.onNativeReady.fire();
            };

            module.exports = browserExec;
        });

        // file: src/browser/platform.js
        define("cordova/platform", function (require, exports, module) {

            module.exports = {
                id: 'browser',
                cordovaVersion: '3.4.0',

                bootstrap: function () {

                    var modulemapper = require('cordova/modulemapper');
                    var channel = require('cordova/channel');
                    var exec = require('cordova/exec');

                    exec.init();

                    // FIXME is this the right place to clobber pause/resume? I am guessing not
                    // FIXME pause/resume should be deprecated IN CORDOVA for pagevisiblity api
                    document.addEventListener('webkitvisibilitychange', function () {
                        if (document.webkitHidden) {
                            channel.onPause.fire();
                        } else {
                            channel.onResume.fire();
                        }
                    }, false);

                    // End of bootstrap
                }
            };

        });



        _fnCordovaCommon(CORDOVA_JS_BUILD_LABEL);

        _fnCordovaBrowserPlugin();
    };

    /**
     * Returns if app is running inside iframe
     */
    var _inIFrame = function () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    };

    var _fnInitCordova = function () {
        if (DronaHQ.onIos) {
            DronaHQ.plugins.geo = true;
            DronaHQ.plugins.keyboard = true;
            DronaHQ.plugins.calendar = true;
            //Initialize the cordova-ios
            _fnCordovaiOS();
        } else if (DronaHQ.onAndroid) {
            //Initialize the cordova-android
            DronaHQ.plugins.keyboard = true;
            DronaHQ.plugins.calendar = true;
            _fnCordovAndroid();
        } else if (DronaHQ.onWindowsPhone) {
            //Initialize the cordova-wp8
            _fnCordovaWP8();
        } else {
            //On browser most probably
            //The app should be running inside our iFrame
            if (_inIFrame()) {
                DronaHQ.onWeb = true;

                //Disabled plugins
                DronaHQ.plugins.camera = true;
                DronaHQ.plugins.device = true;
                DronaHQ.plugins.inappbrowser = true;
                DronaHQ.plugins.dronahq = true;
                DronaHQ.plugins.file = false;
                DronaHQ.plugins.filetransfer = false;
                DronaHQ.plugins.geo = false;

                _fnCordovaBrowser();
            }
        }
    };

    _fnInitCordova();

    window.DronaHQ = DronaHQ;
})();