require({
    packages: [
        {
            location: '../plugins/AnnotationEditor/jslib/underscore',
            name: 'underscore', main: 'underscore'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/jquery',
            name: 'jquery', main: 'jquery'
        },
        {
            location: '../plugins/AnnotationEditor/jslib/jqueryui',
            name: 'jqueryui',
        },
        {
            location: '../plugins/AnnotationEditor/jslib/genevalidator',
            name: 'genevalidator', main: 'gvapi'
        }
    ]
},
[],
function() {

    define.amd.jQuery = true;

    define([
        'dojo/_base/declare',
        'dojo/_base/array',
        'jquery/jquery',
        'underscore/underscore',
        'AnnotationEditor/FeatureEdgeMatchManager',
        'AnnotationEditor/FeatureSelectionManager',
        'AnnotationEditor/TrackConfigTransformer',
        'JBrowse/Browser',
        'JBrowse/Plugin'
    ],
        function(
            declare,
            array,
            $,
            _,
            FeatureEdgeMatchManager,
            FeatureSelectionManager,
            TrackConfigTransformer,
            Browser,
            JBrowsePlugin
            // EditTrack
        ) {
return declare(JBrowsePlugin,
{
    constructor: function( args ) {

        // Get a handle to the main JBrowse instance.
        var browser = this.browser;

        // Convert HTMLFeature tracks to DraggableHTMLFeatures. Features in
        // DraggableHTMLFeatures tracks are selectable and draggable.
        this.trackTransformer = new TrackConfigTransformer({browser: browser});
        array.forEach(browser.config.tracks, function(e) {
            this.trackTransformer.transform(e);
        }.bind(this));

        // Setup selection management: if selection is made in edit track,
        // any selection in other tracks is deselected, and vice versa.
        browser.featSelectionManager = new FeatureSelectionManager();  // for all other tracks
        browser.annotSelectionManager = new FeatureSelectionManager(); // for edit track
        browser.featSelectionManager.addMutualExclusion(browser.annotSelectionManager);
        browser.annotSelectionManager.addMutualExclusion(browser.featSelectionManager);

        // Setup feature edge matching.
        FeatureEdgeMatchManager.setBrowser(browser);
        FeatureEdgeMatchManager.addSelectionManager(browser.featSelectionManager);
        FeatureEdgeMatchManager.addSelectionManager(browser.annotSelectionManager);

        var tracks = [
              {
                 "height"   : 64,
                 "compress" : 0,
                 "key" : "Edit",
                 "phase" : 0,
                 "autocomplete" : "none",
                 "label" : "Edit",
                 "type" : "AnnotationEditor/View/Track/EditTrack",
                 "store" : "scratchpad",
                 "storeClass": "AnnotationEditor/Store/SeqFeature/ScratchPad",
                 "style" : {
                     "className" : "transcript",
                     "renderClassName" : "transcript-overlay",
                     "subfeatureClasses" : {
                         "three_prime_UTR" : "three_prime_UTR",
                         "five_prime_UTR"  : "five_prime_UTR",
                         "exon" : "exon",
                         "CDS"  : "CDS",
                         "non_canonical_splice_site" : "non-canonical-splice-site",
                         "non_canonical_translation_start_site" : "non-canonical-translation-start-site",
                         "non_canonical_translation_stop_site"  : "non-canonical-translation-stop-site"
                     }
                 },
                 "subfeatures" : 1,
                 "pinned" : true,
                 "containerID":   'GenomeBrowser',
                 "show_nav":       false,
                 "show_overview":  false,
                 "show_tracklist": true
              }
           ]
        var config = {
            containerID:   'GenomeBrowser',
            show_nav:       false,
            show_overview:  false,
            show_tracklist: true
        }
        var track = {
            "label": "Edit",
            "type": "AnnotationEditor/View/Track/EditTrack",
            "defaultForStoreTypes": ["AnnotationEditor/Store/SeqFeature/ScratchPad"]
        }
        browser.registerTrackType(track);
        browser.registerTrackType({
            type:                 'AnnotationEditor/View/Track/DraggableHTMLFeatures',
            defaultForStoreTypes: [ 'JBrowse/Store/SeqFeature/NCList',
                                    'JBrowse/Store/SeqFeature/GFF3',
                                  ],
            label: 'AnnotationEditor Features'
        });
        browser.afterMilestone('loadConfig', function () {
            browser.addTracks(tracks);
        });

        browser.afterMilestone('initView', function() {
            var trackConfs = browser.trackConfigsByName["Edit"];
            var stores_scratchpad = {
                    type: "AnnotationEditor/Store/SeqFeature/ScratchPad",
                    features : []
            };
            browser.addStoreConfig('scratchpad', stores_scratchpad);

            // browser.publish( '/jbrowse/v1/c/tracks/show', trackConfs );
            // gb.showTracks(["DNA","gene","Edit"]);
        })
    }
});
});
});
