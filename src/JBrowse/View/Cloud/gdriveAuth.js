define(["dojo/_base/declare"], function(declare){
    return declare(null, {


        constructor: function(){
            this.CLIENT_ID = '506915665486.apps.googleusercontent.com';
            this.SCOPES = ['https://www.googleapis.com/auth/drive'];
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
            var authButton = document.getElementById('authorizeButton');
            if (authResult && !authResult.error) {
                console.debug("pre authorized");
            } else {
                authButton.style.display = 'inline';
                console.debug("not yet authorized");
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
            var authButton = document.getElementById('authorizeButton');
            console.debug("authorized");
            authButton.style.display = 'none';
        }
    });
});
