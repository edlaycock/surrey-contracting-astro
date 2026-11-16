<?php
/**
 * Runs every golden fixture through the PHP implementation. No test framework:
 *   php tests/run.php
 * Exit code 0 when everything passes, 1 otherwise.
 */

require_once dirname(__DIR__) . '/tools/shared.php';

use CumulusDigital\CaseStudyCore\CanonicalJson;
use CumulusDigital\CaseStudyCore\Files;
use CumulusDigital\CaseStudyCore\JsonLd;
use CumulusDigital\CaseStudyCore\JsonLdException;
use CumulusDigital\CaseStudyCore\Privacy;
use CumulusDigital\CaseStudyCore\Text;
use CumulusDigital\CaseStudyCore\Transitions;
use CumulusDigital\CaseStudyCore\Validator;
use CumulusDigital\CaseStudyCore\Wire;
use CumulusDigital\CaseStudyCore\WireException;

$coreDir = dirname(__DIR__, 2);
$passed = 0;
$failed = 0;

function check($label, $ok, $detail = '')
{
    global $passed, $failed;
    if ($ok) {
        $passed += 1;
        echo "ok      $label\n";
    } else {
        $failed += 1;
        echo "NOT OK  $label\n";
        if ($detail !== '') {
            echo "        $detail\n";
        }
    }
}

function same($label, $actual, $expected)
{
    check($label, $actual === $expected, 'expected ' . json_encode($expected) . ' got ' . json_encode($actual));
}

function brief($errors)
{
    $out = array();
    foreach ($errors as $error) {
        $error = is_object($error) ? get_object_vars($error) : $error;
        $out[] = $error['code'] . ' ' . $error['path'];
    }
    return $out;
}

function jsonld_outcome($record, $context)
{
    try {
        JsonLd::build($record, $context);
    } catch (JsonLdException $error) {
        return $error->errorCode;
    }
    return 'built';
}

$names = cs_fixture_names();
check('there are at least six fixtures', count($names) >= 6);

foreach ($names as $name) {
    $fixture = cs_read_json($name . '.json');
    $options = array('forbiddenTerms' => cs_terms($fixture));

    $result = Validator::validateRecord($fixture->record, $options);
    same("fixture $name: validation errors", brief($result['errors']), brief($fixture->expected->errors));
    same("fixture $name: warnings", brief($result['warnings']), brief($fixture->expected->warnings));
    same("fixture $name: valid flag", $result['valid'], $fixture->expected->valid);
    same("fixture $name: name matches result", strpos($name, 'valid-') === 0, $fixture->expected->valid);

    $jsonld = property_exists($fixture, 'jsonld') ? $fixture->jsonld : null;
    $published = property_exists($fixture->record, 'status') && $fixture->record->status === 'published';
    if ($jsonld !== null && property_exists($jsonld, 'file')) {
        $context = cs_read_json($jsonld->context);
        same("fixture $name: JSON-LD is the golden file byte for byte", JsonLd::buildString($fixture->record, $context) . "\n", cs_read_text($jsonld->file));
        same("fixture $name: script tag is the golden file byte for byte", JsonLd::buildScriptTag($fixture->record, $context) . "\n", cs_read_text($jsonld->script_file));
    } elseif ($fixture->expected->valid && $published) {
        $context = cs_read_json('site-context-no-address.json');
        $context->images = new stdClass();
        foreach ($fixture->record->photos as $photo) {
            $context->images->{$photo->ref} = 'https://www.example-paving.co.uk/media/' . $photo->ref . '.jpg';
        }
        same("fixture $name: JSON-LD builds", jsonld_outcome($fixture->record, $context), 'built');
    } else {
        $expected = $jsonld !== null ? $jsonld->error : ($published ? 'jsonld.record_invalid' : 'jsonld.not_published');
        same("fixture $name: JSON-LD is refused", jsonld_outcome($fixture->record, cs_read_json('site-context.json')), $expected);
    }

    $gate = Validator::assertPublishable($fixture->record, $options);
    same("fixture $name: publish gate", $gate['valid'], $fixture->expected->valid && $published);

    if (property_exists($fixture, 'tombstone')) {
        $tombstone = Wire::feedTombstone($fixture->record);
        same("fixture $name: tombstone is the golden file", CanonicalJson::encode($tombstone) . "\n", cs_read_text($fixture->tombstone));
        same("fixture $name: tombstone carries no text", array_keys($tombstone), array('id', 'removed', 'version', 'removed_at'));
    }
    $feedOutcome = 'sent';
    try {
        Wire::feedProjection($fixture->record);
    } catch (WireException $error) {
        $feedOutcome = $error->errorCode;
    }
    same("fixture $name: the feed sends it only if it is publishable", $feedOutcome, ($fixture->expected->valid && $published) ? 'sent' : 'feed.record_not_publishable');

    if (property_exists($fixture, 'feed')) {
        $projected = Wire::feedProjection($fixture->record);
        same("fixture $name: feed projection is the golden file", CanonicalJson::encode($projected) . "\n", cs_read_text($fixture->feed));
        $again = Validator::validateRecord($projected);
        same("fixture $name: feed projection is still a valid record", $again['valid'], true);
        $text = json_encode($projected);
        same("fixture $name: feed projection carries no staff name and no note", strpos($text, $fixture->record->consent->confirmed_by) === false && strpos($text, '"note"') === false, true);
    }
}

foreach (cs_read_json('transitions.json')->cases as $item) {
    $result = Transitions::check($item->previous, $item->next);
    same("transition {$item->name}: errors", brief($result['errors']), brief($item->expected->errors));
    same("transition {$item->name}: valid flag", $result['valid'], $item->expected->valid);
    if (property_exists($item, 'records_not_valid')) {
        continue;
    }
    if ($item->previous !== null) {
        $previous = Validator::validateRecord($item->previous);
        same("transition {$item->name}: previous is a valid record", brief($previous['errors']), array());
    }
    $next = Validator::validateRecord($item->next);
    same("transition {$item->name}: next is a valid record", brief($next['errors']), array());
}

$sampleFailures = array();
$mustPass = 0;
foreach (cs_read_json('privacy-samples.json')->samples as $sample) {
    $record = new stdClass();
    $record->title = $sample->text;
    $codes = array();
    foreach (Privacy::scanRecord($record) as $error) {
        $codes[str_replace('privacy.', '', $error['code'])] = true;
    }
    $codes = array_keys($codes);
    sort($codes, SORT_STRING);
    $expected = $sample->codes;
    sort($expected, SORT_STRING);
    if ($codes !== $expected) {
        $sampleFailures[] = $sample->text . ' => ' . json_encode($codes);
    }
    if (count($expected) === 0 && !property_exists($sample, 'known_limit')) {
        $mustPass += 1;
    }
}
check('privacy samples: must catch, must pass, and the known limits', count($sampleFailures) === 0, implode('; ', $sampleFailures));
check('privacy samples: at least fifty pieces of trade wording that must pass', $mustPass >= 50);

foreach (cs_read_json('probes.json')->probes as $probe) {
    same("probe {$probe->name}", cs_run_probe($probe), $probe->expected);
}

// PHP only: a string that is not UTF-8 can reach the library in a hand-built object.
$bad = new stdClass();
$bad->title = "Fence at KT12 4RG \xff call 07700 900123";
same('L6 invalid UTF-8 is reported, never read as "nothing found"', brief(Privacy::scanRecord($bad)), array('text.invalid_unicode /title'));
$threw = false;
try {
    @Text::matches('~(~', 'x');
} catch (\RuntimeException $error) {
    $threw = true;
} catch (\Throwable $error) {
    $threw = true;
}
same('L6 a pattern that cannot run throws', $threw, true);

$minimal = cs_read_json('valid-minimal.json');
$minimalText = JsonLd::buildString($minimal->record, cs_read_json($minimal->jsonld->context));
same('JSON-LD: hidden town is left out', strpos($minimalText, 'Guildford') === false && strpos($minimalText, 'contentLocation') === false && strpos($minimalText, 'areaServed') === false, true);

$full = cs_read_json('valid-full.json');
$fullText = JsonLd::buildString($full->record, cs_read_json('site-context.json'));
foreach (array('Sam Carter', 'Agreed by text', 'yes_written', 'sha256', $full->record->id) as $hidden) {
    same("JSON-LD: nothing private in the output ($hidden)", strpos($fullText, $hidden) === false, true);
}

$attack = cs_read_json('valid-full.json');
$attack->record->faqs[0]->answer = 'Typically fifteen years. </script><script>alert(1)</script> & more.';
$tag = JsonLd::buildScriptTag($attack->record, cs_read_json('site-context.json'));
same('JSON-LD: a script tag cannot be closed by record text', substr_count($tag, '</script>'), 1);
$body = substr($tag, strpos($tag, "\n") + 1, strrpos($tag, "\n") - strpos($tag, "\n") - 1);
same('JSON-LD: no raw < inside the script body', strpos($body, '<') === false, true);
same('JSON-LD: escaped text decodes back unchanged', Files::decode($body)->{'@graph'}[2]->mainEntity[0]->acceptedAnswer->text, $attack->record->faqs[0]->answer);

$noImage = cs_read_json('site-context.json');
unset($noImage->images->{$full->record->photos[0]->ref});
same('JSON-LD: a missing image URL is refused', jsonld_outcome($full->record, $noImage), 'jsonld.image_url_missing');

$asArray = json_decode(cs_read_text('valid-full.json'), true);
$fromArray = Validator::validateRecord(Files::toJsonValue($asArray['record']));
same('a record held as a PHP array validates after Files::toJsonValue', $fromArray['valid'], true);

$wording = Files::schema('consent-wording.v1.json');
$schema = Files::schema('case-study.v1.schema.json');
same('consent wording version matches the schema', $schema->{'$defs'}->consent->properties->wording_version->enum, array($wording->wording_version));
same('consent wording is still marked pending legal review', Validator::consentWordingStatus('v1'), 'pending_legal_review');

// The manifest: every listed file matches, nothing is missing, nothing is extra, and the tree hash is right.
$manifest = Files::decode(file_get_contents($coreDir . '/manifest.json'));
$listed = get_object_vars($manifest->files);
$onDisk = array();
$walk = function ($relative) use (&$walk, &$onDisk, $coreDir) {
    foreach (scandir($coreDir . '/' . $relative) as $entry) {
        if ($entry[0] === '.' || in_array($entry, array('node_modules', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'Thumbs.db'), true)) {
            continue;
        }
        $child = $relative . '/' . $entry;
        if (is_dir($coreDir . '/' . $child)) {
            $walk($child);
        } else {
            $onDisk[] = $child;
        }
    }
};
foreach (array('schema', 'fixtures', 'spec', 'js', 'php') as $root) {
    $walk($root);
}
sort($onDisk, SORT_STRING);
$listedNames = array_map('strval', array_keys($listed));
sort($listedNames, SORT_STRING);
same('manifest.json lists exactly the files on disk', $listedNames, $onDisk);
$mismatch = array();
$lines = '';
foreach ($listedNames as $file) {
    if (!is_file($coreDir . '/' . $file) || hash_file('sha256', $coreDir . '/' . $file) !== $listed[$file]) {
        $mismatch[] = $file;
    }
    $lines .= $listed[$file] . '  ' . $file . "\n";
}
check('manifest.json hashes match the files', count($mismatch) === 0, implode(', ', $mismatch));
same('manifest.json tree hash', hash('sha256', $lines), $manifest->tree_sha256);
same('manifest core version', $manifest->core_version, Files::CORE_VERSION);

echo "\nphp: $passed passed, $failed failed\n";
exit($failed === 0 ? 0 : 1);
