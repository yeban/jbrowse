use strict;
use warnings;


use JBlibs;

use Test::More;
use Test::Warn;

use JSON 2;

use Bio::JBrowse::Cmd::FlatFileToJson;

use File::Spec::Functions qw( catfile catdir );
use File::Temp ();
use File::Copy::Recursive 'dircopy';

use lib 'tests/perl_tests/lib';
use FileSlurping 'slurp';

sub run_with(@) {
    #system $^X, 'bin/flatfile-to-json.pl', @_;
    #ok( ! $?, 'flatfile-to-json.pl ran ok' );
    my @args = @_;
    #warnings_are {
      Bio::JBrowse::Cmd::FlatFileToJson->new( @args )->run;
    #} [], 'ran without warnings';
}

sub tempdir {
    my $tempdir   = File::Temp->newdir( CLEANUP => $ENV{KEEP_ALL} ? 0 : 1 );
    #diag "using temp dir $tempdir";
    return $tempdir;
}

{  #diag "running on volvox";

    my $tempdir = tempdir();
    my $read_json = sub { slurp( $tempdir, @_ ) };
    dircopy( 'tests/data/volvox_formatted_refseqs', $tempdir );

    run_with (
        '--out' => $tempdir,
        '--bed' => 'sample_data/raw/volvox/volvox-remark.bed',
        '--trackLabel' => 'ExampleFeatures',
        '--key' => 'Example Features',
        '--autocomplete' => 'all',
        '--cssClass' => 'feature2',
        '--clientConfig' =>  '{"featureCss": "height: 8px;", "histScale": 2}',
        '--urltemplate' => 'http://example.com/{name}/{start}/{end}',
        );

    #system "find $tempdir -type f";
    #die 'break';

    run_with (
        '--out' => $tempdir,
        '--gff' => 'sample_data/raw/volvox/volvox.gff3',
        '--trackLabel' => 'CDS',
        '--key' => 'Predicted genes',
        '--type' => 'CDS:predicted,mRNA:exonerate,mRNA:predicted',
        '--autocomplete' => 'all',
        '--cssClass' => 'cds',
        '--compress',
        '--getPhase',
        '--getSubfeatures',
        );

    my $hist_output = $read_json->(qw( tracks ExampleFeatures ctgA hist-10000-0.json ));
    is_deeply( $hist_output, [4,3,4,3,4,1], 'got right histogram output for ExampleFeatures' ) or diag explain( $hist_output );

    my $names_output = [ map JSON::from_json($_), split "\n", $read_json->(qw( tracks ExampleFeatures ctgA names.txt )) ];
    is_deeply( $names_output->[3],
               [
                 [
                   'f05'
                 ],
                 'ExampleFeatures',
                 'f05',
                 'ctgA',
                 4715,
                 5968
               ],
               'got the right names output'
               ) or diag explain $names_output;

    my $cds_trackdata = $read_json->(qw( tracks CDS ctgA trackData.jsonz ));
    is( $cds_trackdata->{featureCount}, 2, 'got right feature count for CDS track' ) or diag explain $cds_trackdata;
    is( scalar( @{$cds_trackdata->{histograms}{meta}}),
        scalar( @{$cds_trackdata->{histograms}{stats}}),
        'have stats for each precalculated hist' );

    is( ref $cds_trackdata->{intervals}{nclist}[1][10], 'ARRAY', 'exonerate mRNA has its subfeatures' )
       or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{nclist}[1][10]}, 5, 'exonerate mRNA has 5 subfeatures' );

    my $tracklist = $read_json->('trackList.json');
    is( $tracklist->{tracks}[1]{storeClass}, 'JBrowse/Store/SeqFeature/NCList' );
    is_deeply( $tracklist->{tracks}[1]{style},
               { featureCss   => 'height: 8px;',
                 histScale    => 2,
                 className    => 'feature2',
                 linkTemplate => 'http://example.com/{name}/{start}/{end}'
               },
               '--clientConfig and --urltemplate options seem to work'
             ) or diag explain $tracklist;

    #system "find $tempdir";
}

{#   diag "running on single_au9_gene.gff3, testing --type filtering";

    my $tempdir = tempdir();
    dircopy( 'tests/data/AU9', $tempdir );

    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
        '--key' => 'AU mRNA',
        '--type' => 'mRNA',
        '--autocomplete' => 'all',
        '--cssClass' => 'transcript',
        '--getPhase',
        '--getSubfeatures',
        );

    #system "find $tempdir";

    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $cds_trackdata = $read_json->(qw( tracks AU_mRNA Group1.33 trackData.json ));
    is( $cds_trackdata->{featureCount}, 1, 'got right feature count' ) or diag explain $cds_trackdata;
    is( ref $cds_trackdata->{intervals}{nclist}[0][10], 'ARRAY', 'mRNA has its subfeatures' )
       or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{nclist}[0][10]}, 7, 'mRNA has 7 subfeatures' );

    my $tracklist = $read_json->( 'trackList.json' );
    is( $tracklist->{tracks}[0]{key}, 'AU mRNA', 'got a tracklist' ) or diag explain $tracklist;
    is_deeply( $tracklist->{tracks}[0]{style}, { className => 'transcript' }, 'got the right style' ) or diag explain $tracklist;

    # run it again with a different CSS class, check that it updated
    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
        '--key' => 'AU mRNA',
        '--type' => 'mRNA',
        '--autocomplete' => 'all',
        '--cssClass' => 'foo_fake_class',
        '--getPhase',
        '--getSubfeatures',
        );

    $tracklist = $read_json->( 'trackList.json' );
    is( $tracklist->{tracks}[0]{key}, 'AU mRNA', 'got a tracklist' );
    is_deeply( $tracklist->{tracks}[0]{style}, { className => 'foo_fake_class'}, 'got the right style' );

    # check that we got the same data as before
    $cds_trackdata = $read_json->(qw( tracks AU_mRNA Group1.33 trackData.json ));
    is( $cds_trackdata->{featureCount}, 1, 'got right feature count' ) or diag explain $cds_trackdata;
    is( ref $cds_trackdata->{intervals}{nclist}[0][10], 'ARRAY', 'mRNA has its subfeatures' )
       or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{nclist}[0][10]}, 7, 'mRNA has 7 subfeatures' );
}

{   #diag "running on single_au9_gene.gff3, testing that we emit 2 levels of subfeatures";

    my $tempdir = tempdir();
    dircopy( 'tests/data/AU9', $tempdir );

    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
        '--key' => 'AU mRNA',
        '--type' => 'gene',
        '--autocomplete' => 'all',
        '--cssClass' => 'transcript',
        '--getPhase',
        '--getSubfeatures',
        );

    #system "find $tempdir";

    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $cds_trackdata = $read_json->(qw( tracks AU_mRNA Group1.33 trackData.json ));
    is( $cds_trackdata->{featureCount}, 1, 'got right feature count' ) or diag explain $cds_trackdata;
    is( ref $cds_trackdata->{intervals}{nclist}[0][10], 'ARRAY', 'gene has its subfeatures' )
       or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{nclist}[0][10]}, 1, 'gene has 1 subfeature' );
    is( ref $cds_trackdata->{intervals}{nclist}[0][10][0][10], 'ARRAY', 'mRNA has its subfeatures' )
       or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{nclist}[0][10][0][10]}, 7, 'mRNA has 7 subfeatures' );
}

{   
    # diag "testing options to set class name in trackList.json";

    my $tempdir = tempdir();
    dircopy( 'tests/data/AU9', $tempdir );

    # test default, should be 'feature'
    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
        );

    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackList = $read_json->(qw( trackList.json ) );
    ok( $trackList->{'tracks'}->[0]->{'style'}->{'className'} eq 'feature', "default cssClassName is feature");

    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
	'--cssClass' => 'flingwibbit'
        );

    $read_json = sub { slurp( $tempdir, @_ ) };
    $trackList = $read_json->(qw( trackList.json ) );
    ok( $trackList->{'tracks'}->[0]->{'style'}->{'className'} eq 'flingwibbit', "cssClassName set correctly");
}

{   
    # diag "testing options to set track type in trackList.json";

    my $tempdir = tempdir();
    dircopy( 'tests/data/AU9', $tempdir );

    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
        );

    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackList = $read_json->(qw( trackList.json ) );
    ok( $trackList->{'tracks'}->[0]->{'type'} eq 'FeatureTrack', "default track type is FeatureTrack");

    run_with (
        '--out' => $tempdir,
        '--gff' => "tests/data/AU9/single_au9_gene.gff3",
        '--trackLabel' => 'AU_mRNA',
	'--trackType' => 'flingwibbit'
        );

    $read_json = sub { slurp( $tempdir, @_ ) };
    $trackList = $read_json->(qw( trackList.json ) );
    ok( $trackList->{'tracks'}->[0]->{'type'} eq 'flingwibbit', "non-default track type set correctly");
}

for my $testfile ( "tests/data/au9_scaffold_subset.gff3", "tests/data/au9_scaffold_subset_sync.gff3" ) {
    # add a test for duplicate lazyclasses bug found by Gregg

    my $tempdir = tempdir();
    dircopy( 'tests/data/AU9', $tempdir );
    run_with (
        '--out' => $tempdir,
        '--gff' => $testfile,
        '--arrowheadClass' => 'transcript-arrowhead',
        '--getSubfeatures',
        '--subfeatureClasses' => '{"CDS": "transcript-CDS", "UTR": "transcript-UTR", "exon":"transcript-exon", "three_prime_UTR":"transcript-three_prime_UTR", "five_prime_UTR":"transcript-five_prime_UTR", "stop_codon":null, "start_codon":null}',
        '--cssClass' => 'transcript',
        '--type' => 'mRNA',
        '--trackLabel' => 'au9_full1',
        );

    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $cds_trackdata = $read_json->(qw( tracks au9_full1 Group1.33 trackData.json ));
    is( $cds_trackdata->{featureCount}, 28, 'got right feature count' ) or diag explain $cds_trackdata;
    is( scalar @{$cds_trackdata->{intervals}{classes}}, 5, 'got the right number of classes' )
        or diag explain $cds_trackdata->{intervals}{classes};

    #system "find $tempdir";
}

{
    # test for warnings
    my $tempdir = tempdir();
    run_with (
        '--out' => $tempdir,
        '--gff' => catfile('tests','data','SL2.40ch10_sample.gff3'),
        '--compress',
        '--key' => 'Assembly',
        '--trackLabel' => 'assembly',
        );
    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackdata = FileSlurping::slurp_tree( catdir( $tempdir, qw( tracks assembly SL2.40ch10 )));
    is( scalar( grep @{$trackdata->{$_}} == 0,
                grep /^lf/,
                keys %$trackdata
               ),
        0,
        'no empty chunks in trackdata'
      ) or diag explain $trackdata;
}


{
    # test BED import
    my $tempdir = tempdir();
    run_with (
        '--out' => $tempdir,
        '--bed' => catfile('tests','data','foo.bed'),
        '--compress',
        '--key' => 'Fooish Bar Data',
        '--trackLabel' => 'foo',
        );
    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackdata = FileSlurping::slurp_tree( catdir( $tempdir, qw( tracks foo chr10 )));
    is( scalar( grep @{$trackdata->{$_}} == 0,
                grep /^lf/,
                keys %$trackdata
               ),
        0,
        'no empty chunks in trackdata'
      ) or diag explain $trackdata;

    is_deeply( $trackdata->{'trackData.jsonz'}{intervals}{classes}[0],
               {
                   'attributes' => [
                       'Start',
                       'End',
                       'Strand',
                       'Seq_id',
                       'Name',
                       'Score'
                       ],
                   'isArrayAttr' => {
                       }
                   }
               ) or diag explain $trackdata->{'trackData.jsonz'};

}

{
    diag "testing GenBank file parsing...";
    my $tempdir = tempdir();
    run_with (
        '--out' => $tempdir,
        '--gbk' => catfile('tests','data','gstmu_full_record.gb'),
        '--key' => 'Fooish Bar Data',
        '--trackLabel' => 'foo',
        );
    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackdata = FileSlurping::slurp_tree( catdir( $tempdir, qw( tracks foo NG_009246 )));

    # test start/stop of parent feature (full record)
    is( $trackdata->{'trackData.json'}{'intervals'}{'nclist'}[0][1], 5001, "got right start coordinate (full record)" );
    is( $trackdata->{'trackData.json'}{'intervals'}{'nclist'}[0][2], 10950, "got right stop coordinate (full record)" );
    is( $trackdata->{'trackData.json'}{'intervals'}{'nclist'}[0][21], 'mRNA', "got right type in parent feature (full record)" ) or diag explain $trackdata->{'trackData.json'}{'intervals'}{'nclist'}[0];

    # test that the right attributes are present
     is_deeply( [sort(@{$trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}})],
		[sort(@{[ 'Db_xref', 'Description', 'Gene', 'Gene_synonym', 'Name', 'Product', 'Transcript_id', 'Start', 'End',  'Strand',  'COMMENT',  'DEFINITION',  'CLASSIFICATION',  'LOCUS', 'KEYWORDS',  'ACCESSION',  'Seq_id',  'NCBI_TAXON_ID', 'MOL_TYPE', 'ORGANISM',  'Type', 'VERSION',  'SOURCE',  'Subfeatures']})],
		'got the right attributes in trackData.json')
	 or diag $trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'};

    # test subfeatures
    # find index of subfeatures (to make test less brittle, in case attributes move around in the array)
    my $subFeatureIndex;
    for my $i ( 0 .. scalar( @{$trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}} ) - 1 ) {
	if ( $trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}->[$i] =~ m/subfeatures/i ){
	    $subFeatureIndex = $i;
	    last;
	}
    }
    my $actualSubFeatureIndex = $subFeatureIndex + 1; # because the first thing in nclist is 0
    ok( defined( $trackdata->{'trackData.json'}->{'intervals'}->{'nclist'}->[0]->[$actualSubFeatureIndex] ), "got something in subfeatures");

    my $subfeatures = $trackdata->{'trackData.json'}->{'intervals'}->{'nclist'}->[0]->[$actualSubFeatureIndex];
    ok ( scalar @{$subfeatures} == 15, "got the right number of subfeatures");
#     ok ( scalar(@{$subfeatures->[0]}) == scalar(@{$trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}}) + 1,
#	 "subfeature array is the right length (length of attribute array + 1)");
    # test first subfeature completely
    is ( $subfeatures->[0][0] && $subfeatures->[0][0], 1, "first item set correctly in subfeature");
    is ( $subfeatures->[0][1] && $subfeatures->[0][1], 5001, "start set correctly in subfeature") or diag explain $subfeatures->[0];
    is ( $subfeatures->[0][2] && $subfeatures->[0][2], 5114, "end set correctly in subfeature") or diag explain $subfeatures->[0];
    is ( $subfeatures->[0][2] && $subfeatures->[0][8], 'exon', "type set correctly in subfeature") or diag explain $subfeatures->[0];

}

{
    my $tempdir = tempdir();
    run_with (
        '--out' => $tempdir,
        '--gbk' => catfile('tests','data','gstmu_region_from_chromosome.gb'),
        '--key' => 'Fooish Bar Data',
        '--trackLabel' => 'foo',
        );
    my $read_json = sub { slurp( $tempdir, @_ ) };
    my $trackdata = FileSlurping::slurp_tree( catdir( $tempdir, qw( tracks foo NG_009246 )));

    # test subfeatures
    # find index of subfeatures (to make test less brittle, in case attributes move around in the array)
    my $subFeatureIndex;
    for my $i ( 0 .. scalar( @{$trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}} ) - 1 ) {
	if ( $trackdata->{'trackData.json'}->{'intervals'}->{'classes'}->[0]->{'attributes'}->[$i] =~ m/subfeatures/i ){
	    $subFeatureIndex = $i;
	    last;
	}
    }
    my $actualSubFeatureIndex = $subFeatureIndex + 1; # because the first thing in nclist is 0
    ok( defined( $trackdata->{'trackData.json'}->{'intervals'}->{'nclist'}->[0]->[$actualSubFeatureIndex] ), "got something in subfeatures when parsing genbank partial region file");

    my $subfeatures = $trackdata->{'trackData.json'}->{'intervals'}->{'nclist'}->[0]->[$actualSubFeatureIndex];
    ok ( exists $subfeatures->[0]->[1] && $subfeatures->[0]->[1] == 5001, "start set correctly in subfeature (partial region of chromosome)") || diag $subfeatures->[0]->[1];
    ok ( exists $subfeatures->[0]->[2] && $subfeatures->[0]->[2] == 5114, "end set correctly in subfeature (partial region of chromosome)") || diag $subfeatures->[0]->[2];

}

{
    diag "end GenBank file parsing ";
}


done_testing;
