// =============================================================================
// sw.js -- Shattered Veil service worker (Prompt 82, Phase 8.3).
//
// Cache-first for same-origin GET requests, version-keyed cache invalidation
// tied to GAME_VERSION/GAME_BUILD (js/version.js -- pulled in via
// importScripts() so the cache name and the settings-drawer version display
// share one source of truth, only ever updated by hand via
// `node scripts/stamp-version.js`, per the project's "no build system" rule).
//
// Classic (non-module) worker script, matching every other file in this
// codebase (plain global scope, no import/export). Inert until the site is
// actually served over http(s) and a page registers it -- see game-v2.html's
// registration snippet + DEPLOY.md for the one remaining user-gated step
// (turning GitHub Pages on).
// =============================================================================

importScripts('js/version.js');

var CACHE_NAME = 'shattered-veil-' + GAME_VERSION + '-' + GAME_BUILD;

// Precached at install time: the app shell (everything needed to boot even
// offline). Every other same-origin asset (the ~44 js/*.js files, vendor
// pixi) is cached lazily on first fetch by the 'fetch' handler below rather
// than hand-maintained here -- keeps this list from silently drifting out of
// sync with game-v2.html's own script load order (no build step generates
// this from that list, so a hand-maintained full list WOULD drift).
var PRECACHE_URLS = [
    './',
    'index.html',
    'game-v2.html',
    'manifest.json',
    'icons/icon-192.svg',
    'icons/icon-512.svg'
];

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(PRECACHE_URLS);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            // Version-keyed invalidation: any cache from a previous
            // GAME_VERSION/GAME_BUILD stamp is dropped the moment a newer
            // service worker activates.
            return Promise.all(keys.filter(function(k) {
                return k !== CACHE_NAME;
            }).map(function(k) {
                return caches.delete(k);
            }));
        }).then(function() {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    var req = event.request;
    if (req.method !== 'GET') return;

    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // same-origin only

    event.respondWith(
        caches.match(req).then(function(cached) {
            if (cached) return cached; // cache-first

            return fetch(req).then(function(networkResp) {
                if (networkResp && networkResp.ok) {
                    var copy = networkResp.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(req, copy);
                    });
                }
                return networkResp;
            }).catch(function() {
                // Offline and not cached: for a page navigation, fall back
                // to the app shell rather than a hard network-error page.
                if (req.mode === 'navigate') return caches.match('game-v2.html');
                return undefined;
            });
        })
    );
});
