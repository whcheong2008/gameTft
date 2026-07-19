// Shattered Veil art pipeline — ComfyUI API driver (zero dependencies).
// Usage: node scripts/comfy-gen.js <job.json>
// Job file: { prefix, positive, negative, seed, batch, width, height, count }
// Queues `count` batches (seed increments per batch), waits for completion,
// prints output image filenames (saved under ComfyUI's output/ directory).
// Settings per COMFYUI-SETUP-GUIDE / GRAPHICS-SESSION-HANDOFF: DreamShaper XL
// Lightning is distilled — steps 8, cfg 2, dpmpp_sde/karras. Do not raise CFG.
var http = require('http');
var fs = require('fs');

var HOST = '127.0.0.1', PORT = 8188;
var CKPT = 'dreamshaperXL_lightningDPMSDE.safetensors';

function api(method, path, body) {
    return new Promise(function (resolve, reject) {
        var data = body ? JSON.stringify(body) : null;
        var req = http.request({ host: HOST, port: PORT, path: path, method: method,
            headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} },
            function (res) {
                var chunks = [];
                res.on('data', function (c) { chunks.push(c); });
                res.on('end', function () {
                    try { resolve(JSON.parse(Buffer.concat(chunks).toString() || 'null')); }
                    catch (e) { resolve(null); }
                });
            });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

function buildGraph(job, seed) {
    return {
        '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
        '2': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: job.positive } },
        '3': { class_type: 'CLIPTextEncode', inputs: { clip: ['1', 1], text: job.negative } },
        '4': { class_type: 'EmptyLatentImage', inputs: { width: job.width || 768, height: job.height || 1152, batch_size: job.batch || 4 } },
        '5': { class_type: 'KSampler', inputs: { model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0],
            seed: seed, steps: 8, cfg: 2, sampler_name: 'dpmpp_sde', scheduler: 'karras', denoise: 1 } },
        '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
        '7': { class_type: 'SaveImage', inputs: { images: ['6', 0], filename_prefix: job.prefix } }
    };
}

async function waitFor(promptId) {
    for (var i = 0; i < 240; i++) {
        var h = await api('GET', '/history/' + promptId);
        if (h && h[promptId] && h[promptId].status && h[promptId].status.completed) return h[promptId];
        if (h && h[promptId] && h[promptId].status && h[promptId].status.status_str === 'error') {
            throw new Error('generation error: ' + JSON.stringify(h[promptId].status.messages).slice(0, 500));
        }
        await new Promise(function (r) { setTimeout(r, 2000); });
    }
    throw new Error('timeout waiting for ' + promptId);
}

(async function main() {
    var job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    var count = job.count || 1;
    var baseSeed = job.seed || 1000;
    for (var b = 0; b < count; b++) {
        var seed = baseSeed + b;
        var res = await api('POST', '/prompt', { prompt: buildGraph(job, seed) });
        if (!res || !res.prompt_id) { console.error('queue failed:', JSON.stringify(res)); process.exit(1); }
        process.stdout.write('batch ' + (b + 1) + '/' + count + ' seed ' + seed + ' queued (' + res.prompt_id + ')... ');
        var hist = await waitFor(res.prompt_id);
        var outputs = hist.outputs || {};
        var files = [];
        Object.keys(outputs).forEach(function (k) {
            (outputs[k].images || []).forEach(function (img) { files.push(img.filename); });
        });
        console.log('done: ' + files.join(', '));
    }
})().catch(function (e) { console.error('FAILED:', e.message); process.exit(1); });
