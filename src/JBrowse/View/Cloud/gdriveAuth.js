define(["dojo/_base/declare"], function(declare){
    return declare(null, {


        constructor: function(silent, callback){
            this.CLIENT_ID = '506915665486.apps.googleusercontent.com';
            this.SCOPES = ['https://www.googleapis.com/auth/drive'];
            this.silent = silent;
            this.callback = callback;
        },


        authorize: function(){
            // Called when the client library is loaded to start the auth flow.
            console.debug("trying auto authorize");
            window.setTimeout(dojo.hitch(this, 'checkAuth'), 1);
        },


        // Check if the current user has authorized the application.
        checkAuth: function() {
            window.gapi.auth.authorize(
                {'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': true},
                dojo.hitch( this, 'handleAuthResult' ));
        },


        // Called when authorization server replies.
        handleAuthResult: function(authResult) {
            if (authResult && !authResult.error) {
                console.debug("pre authorized");
                if(this.callback){
                    this.callback();
                }
            } else {
                console.debug("not yet authorized");
                if (this.silent !== 'silent'){
                    var authButton = document.getElementById('authorizeButton');
                    authButton.style.display = 'inline';
                } else {
                    this.manualAuthorize();
                }
            }
        },
        
        // Open google menu for login
        manualAuthorize: function(){
            console.debug("trying manually");
            window.gapi.auth.authorize(
              {'client_id': this.CLIENT_ID, 'scope': this.SCOPES, 'immediate': false},
              dojo.hitch( this, 'authorized' ));
        },

        // fully authorized
        authorized: function(authResult){
            if (this.silent == undefined){
                var authButton = document.getElementById('authorizeButton');
                authButton.style.display = 'none';
            }
            console.debug("authorized");
            if(this.callback){
                 this.callback();
            }
        }
    });
});
