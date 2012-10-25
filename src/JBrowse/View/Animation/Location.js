define(['JBrowse/View/Animation','JBrowse/Util'],
      function(Animation,Util) {

function Location( view, time, destStart, destEnd ) {
    Animation.call( this, view, function() {}, time );

    this.view = view;

    this.start = {
        viewMin: view.minVisible(),
        viewMax: view.maxVisible(),
        pxPerBp: view.pxPerBp
    };

    var desiredPxPerBp = Math.min( view.getWidth() / Math.abs(destEnd - destStart), view.maxPxPerBp );
    this.end = {
        viewMin: destStart,
        viewMax: destEnd,
        pxPerBp: view.zoomLevels[ Util.findNearest( view.zoomLevels, desiredPxPerBp ) ]
    };

}
Location.prototype = new Animation();

Location.prototype.step = function( progress ) {
    if( ! progress )
        return;

    // calculate the current params
    var current = {};
    for( var prop in this.start ) {
        current[prop] =  this.start[prop] + progress * (this.end[prop] - this.start[prop]);
    }

    //console.log('location step', progress, current, this.start, this.end );

    var startbp = current.viewMin;
    var endbp = current.viewMax;
    var view = this.view;

    view.pxPerBp = Math.min( view.getWidth() / (endbp - startbp), view.maxPxPerBp );
    view.curZoom = Util.findNearest( view.zoomLevels, view.pxPerBp );
    view.stripeWidth = view.stripeWidthForZoom(view.curZoom) / view.zoomLevels[view.curZoom] * view.pxPerBp;

    view.instantZoomUpdate();
    view.centerAtBase((startbp + endbp) / 2, true);
};

return Location;
});