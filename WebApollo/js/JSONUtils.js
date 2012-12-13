define([ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/Util',
         'JBrowse/Model/SimpleFeature'
       ],
       function( declare, array, Util, SimpleFeature ) {

function JSONUtils() {
}


/**
*  creates a feature in JBrowse JSON format
*  takes as arguments:
*      afeature: feature in ApolloEditorService JSON format,
*      arep: ArrayRepr for kind of JBrowse feature to output
*      OLD: fields: array specifying order of fields for JBrowse feature
*      OLD: subfields:  array specifying order of fields for subfeatures of JBrowse feature
*   "CDS" type feature in Apollo JSON format is from genomic start of translation to genomic end of translation,
*          (+ stop codon), regardless of intons, so one per transcript (usually)
*   "CDS" type feature in JBrowse JSON format is a CDS _segment_, which are piecewise and broken up by introns
*          therefore commonyly have multiple CDS segments
*
*/
// JSONUtils.createJBrowseFeature = function(afeature, fields, subfields)  {
var JAFeature = declare( SimpleFeature, {
    "-chains-": {
        constructor: "manual"
    },
    constructor: function( afeature, parent ) {
        this.afeature = afeature;
	if (parent)  { this._parent = parent; }
	
        // get the main data
        var loc = afeature.location;
	var pfeat = this;
        this.data = {
            start: loc.fmin,
            end: loc.fmax,
            strand: loc.strand,
            name: afeature.name,
            parent_id: afeature.parent_id,
            type: afeature.type.name, 
	    properties: afeature.properties
        };

	if (this.data.type === "CDS")  { 
	    this.data.type = "wholeCDS"; 
	}

        this._uniqueID = afeature.uniquename;

	// this doesn't work, since can be multiple properties with same CV term (comments, for example)
	//   could create arrray for each flattened cv-name for multiple values, but not sure what the point would be over 
	//   just making sure can access via get('properties') via above assignment into data object
        // parse the props
/*        var props = afeature.properties;
        dojo.forEach( props, function( p ) {
            var pn = p.type.cv.name+':'+p.type.name;
            this.data[pn] = p.value;
        }, this);
*/

	if (afeature.properties) {
    	    for (var i = 0; i < afeature.properties.length; ++i) {
    		var property = afeature.properties[i];
    		if (property.type.name == "comment" && property.value == "Manually set translation start") {
    		    // jfeature.manuallySetTranslationStart = true;
		    this.data.manuallySetTranslationStart = true;   // so can call feat.get('manuallySetTranslationStart')
		    if (this.parent())  { parent.data.manuallySetTranslationStart = true; }
    		}
    	    }
	}

	// moved subfeature assignment to bottom of feature construction, since subfeatures may need to call method on their parent
	//     only thing subfeature constructor won't have access to is parent.data.subfeatures
        // get the subfeatures              
	this.data.subfeatures = array.map( afeature.children, function(s) {
		return new JAFeature( s, pfeat);
	} );

    }
});

JSONUtils.JAFeature = JAFeature;

JSONUtils.createJBrowseFeature = function( afeature )  {
    return new JAFeature( afeature );
};


/**
 *  takes any JBrowse feature, returns a SimpleFeature "copy", 
 *        for which all properties returned by tags() are mutable (has set() method)
 *  needed since JBrowse features no longer necessarily mutable
 *    feature requirements:
 *         functions: id, parent, tags, get
 *         if subfeatures, then returned as array by feature.get('subfeatures')
 *      
 */
JSONUtils.makeSimpleFeature = function(feature, parent)  {
    var result = new SimpleFeature({id: feature.id(), parent: (parent ? parent : feature.parent()) });
    var ftags = feature.tags();
    for (var tindex = 0; tindex < ftags.length; tindex++)  {  
	var tag = ftags[tindex];
	// forcing lower case, since still having case issues with NCList features
	result.set(tag.toLowerCase(), feature.get(tag.toLowerCase()));
    }
    var subfeats = feature.get('subfeatures');
    if (subfeats && (subfeats.length > 0))  {
	var simple_subfeats = [];
	for (var sindex = 0; sindex < subfeats.length; sindex++)  {
	    var simple_subfeat = JSONUtils.makeSimpleFeature(subfeats[sindex], result);
	    simple_subfeats.push(simple_subfeat);
	}
	result.set('subfeatures', simple_subfeats);
    }
    return result;
};

/**
*  creates a sequence alteration in JBrowse JSON format
*  takes as arguments:
*      arep: ArrayRepr for kind of JBrowse feature to output
*      afeature: sequence alteration in ApolloEditorService JSON format,
*/
JSONUtils.createJBrowseSequenceAlteration = function( afeature )  {
    var loc = afeature.location; 
    var uid = afeature.uniquename;

    return new SimpleFeature({
        data: {
            start:    loc.fmin,
            end:      loc.fmax,
            strand:   loc.strand,
            id:       uid,
            type:     afeature.type.name,
            residues: afeature.residues,
            seq:      afeature.residues
        },
        id: uid
    });
};


/** 
*  creates a feature in ApolloEditorService JSON format
*  takes as argument:
*       jfeature: a feature in JBrowse JSON format, 
*       fields: array specifying order of fields in jfeature
*       subfields: array specifying order of fields in subfeatures of jfeature
*       specified_type (optional): type passed in that overrides type info for jfeature
*  ApolloEditorService format:
*    { 
*       "location" : { "fmin": fmin, "fmax": fmax, "strand": strand }, 
*       "type": { "cv": { "name":, cv },   // typical cv name: "SO" (Sequence Ontology)
*                 "name": cvterm },        // typical name: "transcript"
*       "children": { __recursive ApolloEditorService feature__ }
*    }
* 
*   For ApolloEditorService "add_feature" call to work, need to have "gene" as toplevel feature, 
*         then "transcript", then ???
*                 
*    JBrowse JSON fields example: ["start", "end", "strand", "id", "subfeatures"]
*
*    type handling
*    if specified_type arg present, it determines type name
*    else if fields has a "type" field, use that to determine type name
*    else don't include type 
*
*    ignoring JBrowse ID / name fields for now
*    currently, for features with lazy-loaded children, ignores children 
*/
JSONUtils.createApolloFeature = function( jfeature, specified_type )   {

    var afeature = new Object();
    var astrand;
    // Apollo feature strand must be an integer
    //     either 1 (plus strand), -1 (minus strand), or 0? (not stranded or strand is unknown?)
    switch (jfeature.get('strand')) {  // strand
    case 1:
    case '+':
	astrand = 1; break;
    case -1:
    case '-':
	astrand = -1; break;
    default:
	astrand = 0; // either not stranded or strand is uknown
    }
    
    afeature.location = {
	"fmin": jfeature.get('start'),
	"fmax": jfeature.get('end'),
	"strand": astrand
    };

    var typename;
    if (specified_type)  {
	typename = specified_type;
    }
//    else if (fields["type"])  { typename = jfeature[fields["type"]]; }
    else if ( jfeature.get('type') ) {
	typename = jfeature.get('type');
    }

    if (typename)  {
	afeature.type = {
	    "cv": {
		"name": "sequence"
	    }
	};
	afeature.type.name = typename;
    }
    //    if (fields["subfeatures"])  {
    // var subfeats = jfeature[fields["subfeatures"]];
    var subfeats = jfeature.get('subfeatures');
    if( subfeats && subfeats.length )  {
	afeature.children = [];
	var slength = subfeats.length;
	for (var i=0; i<slength; i++)  {
	    var subfeat = subfeats[i];
	    // afeature.children[i] = JSONUtils.createApolloFeature(subfeat, subfields);
	    //  var subtype = subfeat[subfields["type"]];
	    var subtype = subfeat.get('type');
	    // if "wholeCDS", then translate to the equivalent "CDS" for server
	    if (subtype === "wholeCDS" || subtype === "polypeptide") {
		afeature.children.push( JSONUtils.createApolloFeature( subfeat, "CDS") );
	    }
            else if (subtype.indexOf('splice_site') > 0)  {
                // don't include splice site features 
                //    (this includes non-canonical-five-prime-splice-site and non-canonical-three-prime-splice-site, 
                //     the only ones we're currently using for WebApollo annotations)
                // this is a bandaid, can't really do this right without referring to 
                //    full sequence ontology...
            }
	    else  {  // currently client "CDS" (CDS-segment), "UTR", etc. are all converted to "exon"
		afeature.children.push( JSONUtils.createApolloFeature( subfeat, "exon") );
	    }
	}
    }
    return afeature;
};

// experimenting with forcing export of JSONUtils into global namespace...
window.JSONUtils = JSONUtils;

return JSONUtils;
 
});