define( [
        'dojo/_base/declare',
        'JBrowse/View/Cloud/gdriveAuth'
    ],
    function(declare, googleAuth) {
   
    return declare(null, {

        constructor: function(){
        },

        uploadFile: function(data, callback) {
            var gAuth = new googleAuth('silent', dojo.hitch(this,'upload', data, callback));
            gAuth.authorize();
        },

        upload: function(data, callback) {
            window.gapi.client.load('drive', 'v2', dojo.hitch(this,'insertFile', data, callback));

        },    
               
        /**
         * Insert new file.
         *
         * @param {File} fileData File object to read data from.
         * @param {Function} callback Function to call when the request is complete.
         */
        insertFile: function(fileData, callback) {
            var boundary = '-------314159265358979323846';
            var delimiter = "\r\n--" + boundary + "\r\n";
            var close_delim = "\r\n--" + boundary + "--";
            var contentType = fileData.format ? 'application/x-'+ fileData.format.toLowerCase() : 'application/octet-stream';
            var metadata = {
                'title': fileData.name,
                'mimeType': contentType
            };

            var base64Data = btoa(fileData.data);
            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            var request = window.gapi.client.request({
                'path': '/upload/drive/v2/files',
                'method': 'POST',
                'params': {'uploadType': 'multipart'},
                'headers': {
                    'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});

            if (!callback) {
                callback = function(fileData) {
                    console.log(fileData.name + ': ' + fileData.data);
                };
            }
            request.execute(callback);
            return;
        }
    });
});
