import os
import urllib.request

TARGET_DIR = "/private/var/mobile/Containers/Shared/AppGroup/01D55252-016B-4D8D-9B07-20CEFC4DCBE0/Pythonista3/Documents/alpha_v2"

FILES = {
    "gsap.min.js": "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js",
    "ScrollTrigger.min.js": "https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js",
    "lenis.min.js": "https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js",
}

vendor_dir = os.path.join(TARGET_DIR, "js", "vendor")
os.makedirs(vendor_dir, exist_ok=True)

for name, url in FILES.items():
    path = os.path.join(vendor_dir, name)
    print("تحميل:", name)
    urllib.request.urlretrieve(url, path)
    print("تم:", name, "(%d KB)" % (os.path.getsize(path) // 1024))

print("انتهى.")
