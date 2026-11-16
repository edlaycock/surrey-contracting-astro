<?php
/**
 * Helpers shared by the PHP tests and the emit tool.
 */

require_once dirname(__DIR__) . '/src/autoload.php';

use CumulusDigital\CaseStudyCore\CanonicalJson;
use CumulusDigital\CaseStudyCore\Files;
use CumulusDigital\CaseStudyCore\JsonLd;
use CumulusDigital\CaseStudyCore\JsonLdException;
use CumulusDigital\CaseStudyCore\Privacy;
use CumulusDigital\CaseStudyCore\SchemaEngine;
use CumulusDigital\CaseStudyCore\Validator;
use CumulusDigital\CaseStudyCore\Wire;
use CumulusDigital\CaseStudyCore\WireException;

function cs_fixtures_dir()
{
    return dirname(__DIR__, 2) . '/fixtures';
}

function cs_read_text($file)
{
    return file_get_contents(cs_fixtures_dir() . '/' . $file);
}

function cs_read_json($file)
{
    return Files::decode(cs_read_text($file));
}

function cs_fixture_names()
{
    $names = array();
    foreach (scandir(cs_fixtures_dir()) as $file) {
        if (preg_match('/^(valid|invalid)-[a-z0-9-]+[.]json$/', $file) === 1) {
            $names[] = substr($file, 0, -5);
        }
    }
    sort($names, SORT_STRING);
    return $names;
}

function cs_terms($fixture)
{
    return property_exists($fixture, 'forbidden_terms') ? $fixture->forbidden_terms : array();
}

/** Sets (or, with null, removes) a value at a path of keys. */
function cs_set_at($target, array $keys, $value)
{
    $node = $target;
    for ($i = 0; $i < count($keys) - 1; $i += 1) {
        $node = is_array($node) ? $node[$keys[$i]] : $node->{$keys[$i]};
    }
    $last = $keys[count($keys) - 1];
    if ($value === null) {
        unset($node->{$last});
    } else {
        $node->{$last} = $value;
    }
}

/** One probe from fixtures/probes.json, returning its outcome as a string. */
function cs_run_probe($probe)
{
    try {
        if ($probe->mode === 'term') {
            return Privacy::containsTerm($probe->text, $probe->term) ? 'true' : 'false';
        }
        if ($probe->mode === 'sentences') {
            return (string) Validator::countSentences($probe->text);
        }
        if ($probe->mode === 'decode') {
            Files::decode($probe->raw);
            return 'ok';
        }
        if ($probe->mode === 'canon') {
            return CanonicalJson::encode(Files::decode($probe->raw));
        }
        if ($probe->mode === 'schema') {
            $errors = SchemaEngine::validateAgainst(Files::decode($probe->schema), Files::decode($probe->raw));
            $codes = array();
            foreach ($errors as $error) {
                $codes[] = $error['code'];
            }
            return count($codes) === 0 ? 'ok' : implode(',', $codes);
        }
        if ($probe->mode === 'options') {
            Validator::validateRecord(cs_read_json('valid-minimal.json')->record, get_object_vars(Files::decode($probe->options)));
            return 'ok';
        }
        if ($probe->mode === 'identifier') {
            return Privacy::isSafeIdentifier($probe->value) ? 'true' : 'false';
        }
        if ($probe->mode === 'validate' || $probe->mode === 'feed' || $probe->mode === 'tombstone') {
            $record = cs_read_json($probe->fixture . '.json')->record;
            foreach ($probe->set_record as $change) {
                cs_set_at($record, $change[0], $change[1]);
            }
            if ($probe->mode === 'validate') {
                $result = Validator::validateRecord($record);
                $parts = array();
                foreach ($result['errors'] as $error) {
                    $parts[] = $error['code'] . ' ' . $error['path'];
                }
                return $result['valid'] ? 'VALID' : implode(' | ', $parts);
            }
            try {
                if ($probe->mode === 'feed') {
                    Wire::feedProjection($record);
                } else {
                    Wire::feedTombstone($record);
                }
                return 'ok';
            } catch (WireException $error) {
                return $error->errorCode;
            }
        }
        if ($probe->mode === 'jsonld') {
            $record = cs_read_json($probe->fixture . '.json')->record;
            $context = cs_read_json($probe->context);
            foreach ($probe->set_record as $change) {
                cs_set_at($record, $change[0], $change[1]);
            }
            foreach ($probe->set_context as $change) {
                cs_set_at($context, $change[0], $change[1]);
            }
            try {
                $graph = JsonLd::build($record, $context);
                return $graph['@graph'][1]['@type'];
            } catch (JsonLdException $error) {
                return $error->errorCode;
            }
        }
        return 'unknown mode';
    } catch (\Exception $error) {
        return 'throw';
    }
}
