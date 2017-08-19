define(['underscore/underscore',
        'dojo/_base/declare',
        'dojo/_base/array',
        'JBrowse/Store/SeqFeature',
        'JBrowse/Model/SimpleFeature',
        'AnnotationEditor/Store/Stack']
, function(_, declare, array, SeqFeature, SimpleFeature, Stack) {

    var Scratchpad = declare(SeqFeature, {

        constructor: function (args) {
            this.inherited(arguments);
            this.refSeq   = args.refSeq;

            // Pull saved state from localStorage.
            //this.syncFromLocalStorage(true);

            // If no features in localStorage, start with server sent feature
            // if any.
            // if (this.features && this.config.features) {
            //     console.log("SP in trueBlock");
            //     this.features = this._makeFeatures(this.config.features);
            //     this.undoStateStack = new Stack();
            //     this.redoStateStack = new Stack();
            // }
            this.features = [];

            this._calculateStats();
        },

        ids: function () {
            return _.map(this.features, function (f) {return f.id();});
        },

        get: function (id) {
            return _.find(this.features, function (f) {
                return f.id() === id;
            });
        },

        getFeatures: function (query, featCallback, endCallback, errorCallback) {
            var start = query.start;
            var end   = query.end;
            var thisB = this;
            array.forEach(thisB.features, function (f) {
                if (!(f.get('end') < start || f.get('start') > end)) {
                    featCallback(f);
                }
            });
            if (endCallback)  { endCallback() }
        },

        insert: function (feature) {
            this.features.push(feature);
            this._calculateStats();
        },

        replace: function (feature) {
            var index = _.indexOf(this.ids(), feature.id());
            this.features[index] = feature;
            this._calculateStats();
        },

        remove: function (feature) {
            var index = _.indexOf(this.ids(), feature.id());
            this.features.splice(index, 1);
            this._calculateStats();
        },

        /**
         * Snapshot current state of the store. These snapshots are later used
         * for undo / redo functionality.
         */
        backupStore: function () {
            var undoState = this.features.slice();
            this.undoStateStack = this.undoStateStack || new Stack() ;
            this.undoStateStack.push(undoState);
        },

        /**
         * Revert store to previous state.
         */
        undo: function () {
            this.redoStateStack = this.redoStateStack || new Stack();
            var redoState = this.features.slice();
            this.redoStateStack.push(redoState);

            var undoState = this.undoStateStack.pop();
            this.features = undoState;
        },

        /**
         * Revert store to the state before most recent undo.
         */
        redo: function () {
            this.undoStateStack = this.undoStateStack || new Stack() ;
            var undoState = this.features.slice();
            this.undoStateStack.push(undoState);

            var redoState = this.redoStateStack.pop();
            this.features = redoState;
        },

        /**
         * Flushes store's data (features, and undo and redo state stack) to
         * localStorage.
         *
         * NOTE:
         *   It will always overwrite existing data.
         */
        syncToLocalStorage: function () {
            // localStorage.setItem('id', this.browser.config.id);
            // localStorage.setItem('features', Scratchpad.featuresToJSON(this.features));
            // localStorage.setItem('undoStateStack', Stack.toJSON(this.undoStateStack));
            // localStorage.setItem('redoStateStack', Stack.toJSON(this.redoStateStack));
        },

        /**
         * Restore store's data (features, and undo and redo state stack) from
         * localStorage.
         *
         * NOTE:
         *   It will read localStorage only if id set in localStorage is same as
         *   id of the task opened.
         */
        syncFromLocalStorage: function () {
            var id = localStorage.getItem('id');
            id = id && parseInt(id);
            if (id !== this.browser.config.id) {
                return;
            }
            this.features = Scratchpad.featuresFromJSON(localStorage.getItem('features'));
            this.undoStateStack = Stack.fromJSON(localStorage.getItem('undoStateStack'));
            this.redoStateStack = Stack.fromJSON(localStorage.getItem('redoStateStack'));
        },

        _makeFeatures: function (fdata) {
            console.log("in _makeFeatures");
            return _.map(fdata, _.bind(function (fd) {
                return this._makeFeature(fd);
            }, this));
        },

        _parseInt: function (data) {
            array.forEach(['start','end','strand'], function (field) {
                if (field in data)
                    data[field] = parseInt(data[field]);
            });
            if ('score' in data)
                data.score = parseFloat(data.score);
            if ('subfeatures' in data)
                for (var i=0; i<data.subfeatures.length; i++)
            this._parseInt(data.subfeatures[i]);
        },

        _makeFeature: function (data, parent) {
            this._parseInt(data);
            return new SimpleFeature({data: data, parent: parent});
        },

        _calculateStats: function () {
            var minStart = Infinity;
            var maxEnd = -Infinity;
            var featureCount = 0;
            array.forEach(this.features, function (f) {
                var s = f.get('start');
                var e = f.get('end');
                if (s < minStart)
                    minStart = s;

                if (e > maxEnd)
                    maxEnd = e;

                featureCount++;
            });

            this.globalStats = {
                featureDensity: featureCount / (this.refSeq.end - this.refSeq.start + 1),
                featureCount:   featureCount,
                minStart:       minStart,            /* 5'-most feature start */
                maxEnd:         maxEnd,              /* 3'-most feature end   */
                span:           (maxEnd-minStart+1)  /* min span containing all features */
            };
        }
    });

    /**
     * Serializes an array of SimpleFeature objects to JSON.
     */
    Scratchpad.featuresToJSON = function (features) {
        var featuresJSON = _.map(features, function (f) {
            // return SimpleFeature.toJSON(f)
            return '';
        });
        return JSON.stringify(featuresJSON);
    };

    /**
     * Constructs an array of SimpleFeature objects from JSON.
     */
    Scratchpad.featuresFromJSON = function (featuresJSON) {
        var features = JSON.parse(featuresJSON);
        return _.map(features, function (f) {
            return SimpleFeature.fromJSON(f)
        });
    };

    return Scratchpad;
});
