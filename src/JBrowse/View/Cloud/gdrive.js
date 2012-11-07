define(["dojo/_base/declare"], function(declare){
    return declare(null, {


        constructor: function(){
            this.CLIENT_ID = '506915665486.apps.googleusercontent.com';
            this.SCOPES = 'https://www.googleapis.com/auth/drive';

        },


        authorize: function(){
            // Called when the client library is loaded to start the auth flow.
            window.setTimeout(dojo.hitch(this, this.checkAuth), 1);
        },


        // Check if the current user has authorized the application.
        checkAuth: function() {
            var that = this;
            window.gapi.auth.authorize(
                {'client_id': that.CLIENT_ID, 'scope': that.SCOPES, 'immediate': true},
                dojo.hitch(that, that.handleAuthResult));
        },


        // Called when authorization server replies.
        // @param {Object} authResult Authorization result.
        handleAuthResult: function(authResult) {
            var authButton = document.getElementById('authorizeButton');
            authButton.style.display = 'none';
            var that = this;

            if (authResult && !authResult.error) {
                console.log("pre authorized");
            } else {
                // No access token could be retrieved, show the button to start the authorization flow.
                authButton.style.display = 'block';
                authButton.onclick = function() {
                window.gapi.auth.authorize(
                    {'client_id': that.CLIENT_ID, 'scope': that.SCOPES, 'immediate': false},
                    dojo.hitch(that, that.handleAuthResult));
                console.log("auth");
                };
            }
        }
    });
});
