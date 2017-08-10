define([
           'dojo/_base/declare',
           'dojo/_base/array',
           'AnnotationEditor/jslib/jquery/jquery',
           'AnnotationEditor/FeatureEdgeMatchManager',
           'AnnotationEditor/FeatureSelectionManager',
           'AnnotationEditor/TrackConfigTransformer',
           'JBrowse/Browser',
           'JBrowse/Plugin'
           // 'AnnotationEditor/View/Track/EditTrack'
       ],
       function(
           declare,
           array,
           $,
           FeatureEdgeMatchManager,
           FeatureSelectionManager,
           TrackConfigTransformer,
           Browser,
           JBrowsePlugin
           // EditTrack
       ) {
return declare( JBrowsePlugin,
{
    constructor: function( args ) {

        // do anything you need to initialize your plugin here
        console.log( "plugin: AnnotationEditor" );
        var browser = this.browser;
        var thisB = this;
        console.dir(thisB);

        // hand the browser object to the feature edge match manager
        FeatureEdgeMatchManager.setBrowser( browser );

        this.featSelectionManager = new FeatureSelectionManager();
        this.annotSelectionManager = new FeatureSelectionManager();
        this.trackTransformer = new TrackConfigTransformer({ browser: browser });

        this.annotSelectionManager.addMutualExclusion(this.featSelectionManager);
        this.featSelectionManager.addMutualExclusion(this.annotSelectionManager);

        FeatureEdgeMatchManager.addSelectionManager(this.featSelectionManager);
        FeatureEdgeMatchManager.addSelectionManager(this.annotSelectionManager);

        array.forEach(browser.config.tracks,function(e) { thisB.trackTransformer.transform(e); })

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
        browser.registerTrackType({
            type:                 'AnnotationEditor/View/Track/DraggableAlignments',
            defaultForStoreTypes: [
                                    'JBrowse/Store/SeqFeature/BAM'
                                  ],
            label: 'AnnotationEditor Alignments'
        });
        browser.afterMilestone('loadConfig', function () {
            console.log("after loadConfig");
            browser.addTracks(tracks);
            var thigg = browser.getTrackTypes();
            console.dir(thigg);
        });

        browser.afterMilestone('initView', function() {
            // var gb = dojo.byId("GenomeBrowser").genomeBrowser;
            var trackConfs = browser.trackConfigsByName["Edit"];
            console.dir(trackConfs);
            browser.addStoreConfig('scratchpad',trackConfs);

            // if (browser && browser.view && browser.view.tracks) {
            //     var tracks = browser.view.tracks;
            //     for (var i = 0; i < tracks.length; i++) {
            //         return tracks[i] instanceof EditTrack;
            //     }
            // }

            // browser.publish( '/jbrowse/v1/c/tracks/show', trackConfs );
            // gb.showTracks(["DNA","gene","Edit"]);
        })
    }
});
});
