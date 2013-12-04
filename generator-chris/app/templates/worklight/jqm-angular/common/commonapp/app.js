define(["jquery","text!./config.json"],function($,configjson){

    var appConfig = JSON.parse(configjson);

    //After jQuery, load jQuery Mobile
    $(document).bind("mobileinit", function() {
        //Enable phone gap options
        $.mobile.phonegapNavigationEnabled = true;
        $.mobile.allowCrossDomainPages = true;
        $.support.cors = true;

        $.mobile.ajaxEnabled = false;
        $.mobile.linkBindingEnabled = false;
        $.mobile.hashListeningEnabled = false;
        $.mobile.pushStateEnabled = false;
    });

    return {
        doneInit : false,
        ngapp: null,
        currentRoute : null,
        previousRoute : null,

        route : function(routeName,options){
            var route = appConfig.routes[routeName];
            if(!route){console.error("The route",routeName,"does not exist!");return;}

            if(appConfig.routes[routeName].template === this.currentRoute){
                console.debug("Current route",this.currentRoute,"equals previous route, no-op");
                return;
            }//end if
            this.previousRoute = this.currentRoute;
            this.currentRoute = appConfig.routes[routeName].template;

            if(!options){
                options = {};
            }//end if
            options.changeHash = false;
            _this = this;
            this.init().then(function(app){
                console.debug(routeName,$.mobile.activePage.data("url"));
                var currentUrl = $.mobile.activePage.data('url');

                var numJumpsToGetToRoot = 0;
                var prePath = "";
                if(currentUrl.indexOf("index.html") < 0){
                    currentUrl = currentUrl.substring(currentUrl.indexOf('default/') + 8);
                    numJumpsToGetToRoot = currentUrl.match(/\//g).length;
                }//end if

                for(var x = 0; x < numJumpsToGetToRoot; x++){
                    prePath = prePath + "../";
                }//end for

                var ctrl = prePath + route.controller;
                var template = prePath + route.template;
                console.debug("Switching to controller",ctrl,"template",template);
                require([ctrl],function(ctrl){
                    $.mobile.changePage(template,options);
                });
            });
        },

        /**
         * Init method for app
         */
        init : function(){
            var def = $.Deferred();
            var _this = this;
            if(!this.doneInit){
                require(["jqm"],function(jqm){
                    //After we load jQuery Mobile, we bootstrap our app's initial view
                    require(["angular"],function(ng){
                        $(document).on("pageload",function(p,data){
                            ng.bootstrap($("[data-ng-controller=" + data.page[0].dataset.ngController + "]")[0],["app"]);
                        });

                        $(document).on("pageremove",function(event){
                            //stop the view from being removed from the DOM once loaded
                            //TODO: This may be costly, need to think of a better approach
                            event.preventDefault();
                        });
                        _this.ngapp = ng.module("app",[]);
                        //Add the config json to the ngapp
                        _this.ngapp.constant("appConfig",appConfig);
                        _this.doneInit = true;
                        def.resolve(_this.ngapp);
                    });
                });
            }else{
                def.resolve(_this.ngapp);
            }//end if
            return def.promise();
        }
    };

});