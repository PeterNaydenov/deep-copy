import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import deepCopy from '../src/main.js'



/**
 *  Measures the memory a single copy needs. Every operation receives the same
 *  three acyclic inputs used by the speed benchmark.
 */
const shapes = [ 'flat', 'records', 'deep' ];
const samples = 5;
const mib = 1024 * 1024;



function makeData ( shape ) {
    if ( shape === 'flat' ) {
            const data = {};
            for ( let index = 0; index < 1000000; index++ )   data['key'+index] = index
            return data
        }
    if ( shape === 'records' )   return Array.from ( { length:100000 }, ( _, id ) => ({ id, name:'item', metadata:{ active:true, score:id, tags:['a','b'] } }) )
    let data = { leaf:1 };
    for ( let index = 0; index < 4000; index++ )   data = { child:data }
    return data
} // makeData func.



function collect () {
    global.gc()
    global.gc()
    return process.memoryUsage()
} // collect func.



function measure ( shape ) {
    if ( !global.gc )   throw new Error ( 'The worker needs --expose-gc' )
    const runtime = collect();
    let data = makeData ( shape );
    const baseline = collect();

    let result = deepCopy ( data );
    // Heap right after the copy. Garbage from the traversal is still in it.
    const afterCopy = process.memoryUsage();

    const retained = collect();
    // Node reports the lifetime RSS high-water mark in KiB. It includes
    // runtime startup and input construction, not just the copy.
    const processPeakRss = process.resourceUsage().maxRSS * 1024;

    if ( shape === 'flat' ) {
            assert.equal ( result.key0, 0 )
            assert.equal ( result.key999999, 999999 )
            assert.equal ( Object.keys ( result ).length, 1000000 )
        }
    if ( shape === 'records' ) {
            assert.equal ( result.length, 100000 )
            assert.notEqual ( result[99999].metadata.tags, data[99999].metadata.tags )
            assert.deepEqual ( result[99999], data[99999] )
        }
    if ( shape === 'deep' ) {
            let original = data, copy = result;
            for ( let index = 0; index < 4000; index++ ) {
                    assert.notEqual ( copy, original )
                    original = original.child
                    copy = copy.child
                }
            assert.equal ( copy.leaf, 1 )
        }

    result = undefined;
    const released = collect();
    const memory = {
              inputHeapMiB : ( baseline.heapUsed - runtime.heapUsed ) / mib
            , afterCopyExtraHeapMiB : ( afterCopy.heapUsed - baseline.heapUsed ) / mib
            , retainedExtraHeapMiB : ( retained.heapUsed - baseline.heapUsed ) / mib
            , afterReleaseExtraHeapMiB : ( released.heapUsed - baseline.heapUsed ) / mib
            , processPeakRssMiB : processPeakRss / mib
        };
    // Keep the source reachable through every checkpoint above.
    assert.equal ( data, data )
    return { shape, ...memory }
} // measure func.



function median ( values ) {
    return [ ...values ].sort (( a, b ) => a - b)[Math.floor ( values.length / 2 )]
} // median func.



function run () {
    const source = createHash ( 'sha256' );
    for ( const name of readdirSync ( new URL ( '../src/', import.meta.url ) ).sort() ) {
            if ( name.endsWith ( '.js' ) )   source.update ( name ).update ( readFileSync ( new URL ( '../src/' + name, import.meta.url ) ) )
        }
    const environment = {
              node : process.version
            , platform : process.platform
            , arch : process.arch
            , cpu : os.cpus()[0].model
            , memoryGiB : os.totalmem() / 1024 ** 3
            , measuredAt : new Date().toISOString()
            , sourceSha256 : source.digest ( 'hex' )
            , samples
            , unit : 'MiB (1024 * 1024 bytes)'
        };
    const results = [];
    const filename = fileURLToPath ( new URL ( './memory.results.json', import.meta.url ) );
    const metrics = [ 'inputHeapMiB', 'afterCopyExtraHeapMiB', 'retainedExtraHeapMiB', 'afterReleaseExtraHeapMiB', 'processPeakRssMiB' ];

    for ( const shape of shapes ) {
            const samplesOfShape = [];
            for ( let round = 0; round < samples; round++ ) {
                    // Each sample runs in a fresh process, so heap growth from
                    // one sample cannot carry over into the next.
                    const child = spawnSync ( process.execPath, [ '--expose-gc', fileURLToPath ( import.meta.url ), '--worker', shape ], { encoding:'utf8' } )
                    if ( child.error )   throw child.error
                    if ( child.status !== 0 )   throw new Error ( child.stderr || child.stdout || 'Memory worker failed' )
                    samplesOfShape.push ( JSON.parse ( child.stdout ) )
                    console.log ( `${shape} / sample ${round+1}` )
                }
            const row = { shape, samples:samplesOfShape };
            row.median = Object.fromEntries ( metrics.map ( metric => [ metric, +median ( samplesOfShape.map ( sample => sample[metric] ) ).toFixed ( 3 ) ] ) )
            row.range = Object.fromEntries ( metrics.map ( metric => {
                        const values = samplesOfShape.map ( sample => sample[metric] );
                        return [ metric, [ Math.min ( ...values ), Math.max ( ...values ) ].map ( value => +value.toFixed ( 3 ) ) ]
                    }) )
            results.push ( row )
            console.log ( JSON.stringify ({ shape, ...row.median }) )
            writeFileSync ( filename, JSON.stringify ({ environment, results }, null, 2 ) + '\n' )
        }
    console.log ( 'Complete: 15 verified copies. Saved ' + filename )
} // run func.



if ( process.argv[2] === '--worker' ) {
    const shape = process.argv[3];
    if ( !shapes.includes ( shape ) )   throw new Error ( 'Unknown shape' )
    console.log ( JSON.stringify ( measure ( shape ) ) )
    }
else    run()
