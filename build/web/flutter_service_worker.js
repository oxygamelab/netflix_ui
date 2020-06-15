'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "617eab647830a1ef5e18175417f9d39c",
"/": "617eab647830a1ef5e18175417f9d39c",
"main.dart.js": "4401e7be66067a19bedd67fd480ebf61",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "fa5cf34aafbfa0f45ff6b6bdec411047",
"assets/AssetManifest.json": "19b0e432e4dd4f6b3ad36473edb9705a",
"assets/NOTICES": "40170652e4d6aace74735affcbbaaed1",
"assets/FontManifest.json": "01700ba55b08a6141f33e168c4a6c22f",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"assets/fonts/MaterialIcons-Regular.ttf": "56d3ffdef7a25659eab6a68a3fbfaf16",
"assets/assets/images/nutcracker.jpg": "ad71bbac41028bd589f90d2d918831fc",
"assets/assets/images/shigatsu_wa_kimi_no_uso.jpg": "2b9701b0f04d6f2a358e7821bb1c8a46",
"assets/assets/images/spiderman.jpg": "0a16b197bc9d3f5b7e7763bb0bf91747",
"assets/assets/images/endgame.jpg": "79f9a6f365305025c38d8576599e9539",
"assets/assets/images/daredevil.jpg": "fed0574e73b1f4f5dafba78a0bcbfe5b",
"assets/assets/images/oitnb.jpg": "17b81306988d0fbe39da72121c97996c",
"assets/assets/images/netflix_logo.png": "a1f673e7df715f16dae49f4874009082",
"assets/assets/images/spiderman_0.jpg": "e50098de69458b5dd1ce6040dd41087c",
"assets/assets/images/cobra_kai.jpg": "92f846b4dd84a30b88ff470d97671f15",
"assets/assets/images/plastic_memories.png": "b9190f22aa9d71701ad28393c3a7789e",
"assets/assets/images/spiderman_1.jpg": "8f86368f301318d1dcf59fc0ca0a9e34",
"assets/assets/images/erased.jpg": "2d5aeefdaba7548f85af8aa19de30931",
"assets/assets/images/spiderman_2.jpg": "7f36b97d7931555d7a4270e29f3822fd",
"assets/assets/images/nutcracker_1.jpg": "b4b9bfacaf6fbef0af7078421116fa83",
"assets/assets/images/nutcracker_0.jpg": "9ed413290854fa4b4d918ebb7f4ff776",
"assets/assets/images/toystory_2.jpg": "7df9125175dbcd25fad83dafe7336cae",
"assets/assets/images/toystory_0.jpg": "dcecb48b824b853a01aa294faea805f5",
"assets/assets/images/toystory.jpg": "1e883f4fdbe8fc35a3c152bc2838a50c",
"assets/assets/images/nutcracker_2.jpg": "dd0ca8d95c155ae4b5670902f5edd9df",
"assets/assets/images/toystory_1.jpg": "9fa3f35f7223b5013e03451d8a95f5d3",
"assets/assets/images/stranger_things.jpg": "2e7664a697bd3ad7cfbb0db3463b70d9",
"assets/assets/images/seven_deadly_sins.jpg": "6403b2448ee3661694b5e7b37d6a9a49"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/LICENSE",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a no-cache param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'no-cache'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'no-cache'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.message == 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message = 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.add(resourceKey);
    }
  }
  return Cache.addAll(resources);
}
