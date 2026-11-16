<?php
/**
 * Writes what this implementation produces for every fixture into a directory.
 * core/run-tests.sh runs this and the Node twin, then compares the two
 * directories byte for byte.
 *   php tools/emit.php <output directory>
 */

require_once __DIR__ . '/shared.php';

use CumulusDigital\CaseStudyCore\CanonicalJson;
use CumulusDigital\CaseStudyCore\JsonLd;
use CumulusDigital\CaseStudyCore\Privacy;
use CumulusDigital\CaseStudyCore\Transitions;
use CumulusDigital\CaseStudyCore\Validator;
use CumulusDigital\CaseStudyCore\Wire;

if ($argc < 2) {
    fwrite(STDERR, "usage: php tools/emit.php <output directory>\n");
    exit(2);
}
$outDir = rtrim($argv[1], '/');
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}
$write = function ($file, $text) use ($outDir) {
    file_put_contents($outDir . '/' . $file, $text);
};

$names = cs_fixture_names();
foreach ($names as $name) {
    $fixture = cs_read_json($name . '.json');
    $result = Validator::validateRecord($fixture->record, array('forbiddenTerms' => cs_terms($fixture)));
    $write($name . '.validation.json', CanonicalJson::encode($result) . "\n");
    if (property_exists($fixture, 'jsonld') && property_exists($fixture->jsonld, 'file')) {
        $context = cs_read_json($fixture->jsonld->context);
        $write($name . '.jsonld.json', JsonLd::buildString($fixture->record, $context) . "\n");
        $write($name . '.script.html', JsonLd::buildScriptTag($fixture->record, $context) . "\n");
    }
    if (property_exists($fixture, 'tombstone')) {
        $write($name . '.tombstone.json', CanonicalJson::encode(Wire::feedTombstone($fixture->record)) . "\n");
    }
    if (property_exists($fixture, 'feed')) {
        $write($name . '.feed.json', CanonicalJson::encode(Wire::feedProjection($fixture->record)) . "\n");
    }
}

$transitions = cs_read_json('transitions.json');
$results = array();
foreach ($transitions->cases as $item) {
    $results[$item->name] = Transitions::check($item->previous, $item->next);
}
$write('transitions.results.json', CanonicalJson::encode($results) . "\n");

$samples = cs_read_json('privacy-samples.json');
$scanned = array();
foreach ($samples->samples as $sample) {
    $record = new stdClass();
    $record->title = $sample->text;
    $codes = array();
    foreach (Privacy::scanRecord($record, array()) as $error) {
        $codes[$error['code']] = true;
    }
    $codes = array_keys($codes);
    sort($codes, SORT_STRING);
    $scanned[] = array('text' => $sample->text, 'codes' => $codes);
}
$write('privacy-samples.results.json', CanonicalJson::encode($scanned) . "\n");

$probes = cs_read_json('probes.json');
$outcomes = array();
foreach ($probes->probes as $probe) {
    $outcomes[$probe->name] = cs_run_probe($probe);
}
$write('probes.results.json', CanonicalJson::encode($outcomes) . "\n");

echo 'php: wrote results for ' . count($names) . ' fixtures, ' . count($transitions->cases) . ' transitions, '
    . count($samples->samples) . ' privacy samples, ' . count($probes->probes) . " probes\n";
