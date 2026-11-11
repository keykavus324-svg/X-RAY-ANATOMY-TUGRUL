# MediaPipe Pose (vendored)

`vendor/mediapipe/pose/` holds the runtime of the MediaPipe **Pose** solution, taken
unchanged from the npm package `@mediapipe/pose@0.5.1675469404`.

- Upstream: https://google.github.io/mediapipe/solutions/pose
- Package: https://www.npmjs.com/package/@mediapipe/pose
- Licence: **Apache License 2.0** (see the package's `license` field; the full text is at
  https://www.apache.org/licenses/LICENSE-2.0)
- © Google LLC

Only the files needed by this site are kept, to keep the download small:

| file | why |
| --- | --- |
| `pose.js` | the solution itself (loaded as a classic script) |
| `pose_web.binarypb` | the inference graph |
| `pose_solution_packed_assets_loader.js`, `pose_solution_packed_assets.data` | graph assets |
| `pose_solution_simd_wasm_bin.{js,wasm}` | SIMD wasm build (modern browsers) |
| `pose_solution_wasm_bin.{js,wasm}` | plain wasm build (fallback) |
| `pose_landmark_lite.tflite` | the landmark model we run (`modelComplexity: 0`) |

The full and heavy landmark models are **not** shipped: the lite model is the one that
keeps a phone camera at 20 fps.

Nothing here talks to the network beyond this repository — the models are served from
the site itself, exactly like the face models in `vendor/face-api/`.
