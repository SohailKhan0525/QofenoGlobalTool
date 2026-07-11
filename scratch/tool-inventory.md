# Qofeno Tool Inventory

Generated from src\lib\toolCatalog.ts, src\components\Pages\FileToolWorkspace.tsx, src\components\Pages\ToolPage.tsx, and appwrite-functions\tools.

Catalog tools: 92
Function folders: 92
File-tool slugs: 93
File-tool settings entries: 93
Placeholder/stub functions: 11

| slug | name | category | is_free | function_id | accepted_types | output_type | has_function | is_wired | has_settings | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aac-converter | Aac Converter | Audio Tools | true | aac-converter | ["audio/*"] | unknown | yes | yes | yes | working |
| audio-compressor | Audio Compressor | Audio Tools | true | audio-compressor | ["audio/*"] | unknown | yes | yes | yes | working |
| audio-metadata-viewer | Audio Metadata Viewer | Audio Tools | true | audio-metadata-viewer | ["unknown"] | unknown | yes | no | no | broken |
| audio-reverser | Audio Reverser | Audio Tools | true | audio-reverser | ["audio/*"] | unknown | yes | yes | yes | working |
| avi-converter | Avi Converter | Video Tools | true | avi-converter | ["video/*"] | unknown | yes | yes | yes | working |
| background-noise-remover | Background Noise Remover | Video Tools | true | background-noise-remover | ["audio/*"] | unknown | yes | yes | yes | working |
| base64-encoder | Base64 Encoder | Developer Tools | true | base64-encoder | ["text/plain"] | text/plain | yes | yes | no | working |
| bass-booster | Bass Booster | Audio Tools | true | bass-booster | ["audio/*"] | unknown | yes | yes | yes | working |
| batch-compress-pdfs | Batch Compress PDFs | PDF & Documents | true | batch-compress-pdfs | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| batch-convert-pdfs | Batch Convert PDFs | PDF & Documents | true | batch-convert-pdfs | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| batch-merge-pdfs | Batch Merge PDFs | PDF & Documents | true | batch-merge-pdfs | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| blur-image | Blur Image | Image Tools | true | blur-image | ["image/*"] | unknown | yes | yes | yes | working |
| brightness-adjust | Brightness Adjust | Image Tools | true | brightness-adjust | ["image/*"] | unknown | yes | yes | yes | working |
| change-pitch | Change Pitch | Audio Tools | true | change-pitch | ["unknown"] | unknown | yes | no | no | broken |
| change-speed | Change Speed | AI & Automation | true | change-speed | ["unknown"] | unknown | yes | no | no | broken |
| contrast-adjust | Contrast Adjust | Image Tools | true | contrast-adjust | ["image/*"] | unknown | yes | yes | yes | working |
| crop-image | Crop Image | Image Tools | true | crop-image | ["image/*"] | unknown | yes | yes | yes | working |
| excel-to-pdf | Excel To PDF | PDF & Documents | true | excel-to-pdf | [".xlsx", ".xls", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] | unknown | yes | yes | yes | working |
| extract-audio | Extract Audio | Audio Tools | true | extract-audio | ["video/*"] | unknown | yes | yes | yes | working |
| fade-in | Fade In | Audio Tools | true | fade-in | ["unknown"] | unknown | yes | no | no | broken |
| fade-out | Fade Out | Audio Tools | true | fade-out | ["unknown"] | unknown | yes | no | no | broken |
| flac-converter | Flac Converter | Audio Tools | true | flac-converter | ["audio/*"] | unknown | yes | yes | yes | working |
| flip-image | Flip Image | Image Tools | true | flip-image | ["image/*"] | unknown | yes | yes | yes | working |
| gif-maker-video | Gif Maker Video | Video Tools | true | gif-maker-video | ["video/*"] | unknown | yes | yes | yes | working |
| image-bg-remover | Image Background Remover | Video Tools | true | image-bg-remover | ["image/*"] | unknown | yes | yes | yes | working |
| image-compressor | Image Compressor | Image Tools | true | image-compressor | ["image/*"] | unknown | yes | yes | yes | working |
| image-converter | Image Converter | Image Tools | true | image-converter | ["image/*"] | unknown | yes | yes | yes | working |
| image-resizer | Image Resizer | Image Tools | true | image-resizer | ["image/*"] | unknown | yes | yes | yes | working |
| jpg-to-pdf | JPG To PDF | PDF & Documents | true | jpg-to-pdf | ["image/jpeg", "image/jpg"] | unknown | yes | yes | yes | working |
| json-formatter | JSON Formatter | Developer Tools | true | json-formatter | ["text/plain"] | text/plain | yes | yes | no | working |
| merge-audio | Merge Audio | Audio Tools | true | merge-audio | ["audio/*"] | unknown | yes | yes | yes | working |
| merge-videos | Merge Videos | Video Tools | true | merge-videos | ["video/*"] | unknown | yes | yes | yes | working |
| mov-converter | Mov Converter | Video Tools | true | mov-converter | ["video/*"] | unknown | yes | yes | yes | working |
| mp3-converter | Mp3 Converter | Audio Tools | true | mp3-converter | ["audio/*"] | unknown | yes | yes | yes | working |
| mp4-converter | Mp4 Converter | Video Tools | true | mp4-converter | ["video/*"] | unknown | yes | yes | yes | working |
| ogg-converter | Ogg Converter | Audio Tools | true | ogg-converter | ["audio/*"] | unknown | yes | yes | yes | working |
| pdf-booklet-creator | PDF Booklet Creator | PDF & Documents | true | pdf-booklet-creator | ["unknown"] | unknown | yes | no | no | stub |
| pdf-color-converter | PDF Color Converter | PDF & Documents | true | pdf-color-converter | ["unknown"] | unknown | yes | no | no | broken |
| pdf-compare | PDF Compare | PDF & Documents | false | pdf-compare | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-compressor | PDF Compressor | PDF & Documents | true | pdf-compressor | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-crop | PDF Crop | PDF & Documents | true | pdf-crop | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-delete-pages | PDF Delete Pages | PDF & Documents | true | pdf-delete-pages | ["unknown"] | unknown | yes | no | no | broken |
| pdf-extract-pages | PDF Extract Pages | PDF & Documents | true | pdf-extract-pages | ["unknown"] | unknown | yes | no | no | broken |
| pdf-flatten | PDF Flatten | PDF & Documents | true | pdf-flatten | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-form-creator | PDF Form Creator | PDF & Documents | true | pdf-form-creator | ["unknown"] | unknown | yes | no | no | broken |
| pdf-form-filler | PDF Form Filler | PDF & Documents | true | pdf-form-filler | ["unknown"] | unknown | yes | no | no | broken |
| pdf-grayscale | PDF Grayscale | PDF & Documents | true | pdf-grayscale | ["unknown"] | unknown | yes | no | no | broken |
| pdf-header-footer | PDF Header Footer | PDF & Documents | true | pdf-header-footer | ["unknown"] | unknown | yes | no | no | broken |
| pdf-merger | PDF Merger | PDF & Documents | true | pdf-merger | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-metadata-editor | PDF Metadata Editor | PDF & Documents | true | pdf-metadata-editor | ["unknown"] | unknown | yes | no | no | broken |
| pdf-metadata-viewer | PDF Metadata Viewer | PDF & Documents | true | pdf-metadata-viewer | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-ocr | PDF OCR | PDF & Documents | false | pdf-ocr | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-page-extractor-bulk | PDF Page Extractor Bulk | PDF & Documents | true | pdf-page-extractor-bulk | ["unknown"] | unknown | yes | no | no | broken |
| pdf-page-number-customizer | PDF Page Number Customizer | PDF & Documents | true | pdf-page-number-customizer | ["unknown"] | unknown | yes | no | no | broken |
| pdf-page-numbers | PDF Page Numbers | PDF & Documents | true | pdf-page-numbers | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-portfolio-creator | PDF Portfolio Creator | PDF & Documents | true | pdf-portfolio-creator | ["unknown"] | unknown | yes | no | no | stub |
| pdf-protect | PDF Protect | PDF & Documents | false | pdf-protect | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-redact | PDF Redact | PDF & Documents | true | pdf-redact | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-reorder-pages | PDF Reorder Pages | PDF & Documents | true | pdf-reorder-pages | ["unknown"] | unknown | yes | no | no | broken |
| pdf-repair | PDF Repair | PDF & Documents | false | pdf-repair | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-resize | PDF Resize | PDF & Documents | true | pdf-resize | ["unknown"] | unknown | yes | no | no | broken |
| pdf-rotate | PDF Rotate | PDF & Documents | true | pdf-rotate | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-sign | PDF Sign | PDF & Documents | false | pdf-sign | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-splitter | PDF Splitter | PDF & Documents | true | pdf-splitter | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-thumbnail | PDF Thumbnail | PDF & Documents | true | pdf-thumbnail | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-to-excel | PDF To Excel | PDF & Documents | true | pdf-to-excel | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-to-html | PDF To HTML | PDF & Documents | true | pdf-to-html | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-to-jpg | PDF To JPG | PDF & Documents | true | pdf-to-jpg | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-to-powerpoint | PDF To Powerpoint | PDF & Documents | true | pdf-to-powerpoint | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-to-text | PDF To Text | PDF & Documents | true | pdf-to-text | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-to-word | PDF To Word | PDF & Documents | true | pdf-to-word | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| pdf-unlock | PDF Unlock | PDF & Documents | false | pdf-unlock | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-watermark | PDF Watermark | PDF & Documents | false | pdf-watermark | [".pdf", "application/pdf"] | unknown | yes | yes | yes | working |
| pdf-word-count | PDF Word Count | PDF & Documents | true | pdf-word-count | [".pdf", "application/pdf"] | unknown | yes | yes | yes | stub |
| powerpoint-to-pdf | Powerpoint To PDF | PDF & Documents | true | powerpoint-to-pdf | [".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"] | unknown | yes | yes | yes | working |
| remove-audio | Remove Audio | Video Tools | true | remove-audio | ["video/*"] | unknown | yes | yes | yes | working |
| ringtone-maker | Ringtone Maker | Audio Tools | true | ringtone-maker | ["audio/*"] | unknown | yes | yes | yes | working |
| rotate-image | Rotate Image | Image Tools | true | rotate-image | ["image/*"] | unknown | yes | yes | yes | working |
| rotate-video | Rotate Video | Video Tools | true | rotate-video | ["video/*"] | unknown | yes | yes | yes | working |
| sharpen-image | Sharpen Image | Image Tools | true | sharpen-image | ["image/*"] | unknown | yes | yes | yes | working |
| silence-remover | Silence Remover | Video Tools | true | silence-remover | ["audio/*"] | unknown | yes | yes | yes | working |
| speed-changer-video | Speed Changer Video | Video Tools | true | speed-changer-video | ["video/*"] | unknown | yes | yes | yes | working |
| text-case-converter | Text Case Converter | Developer Tools | true | text-case-converter | ["unknown"] | unknown | yes | no | no | broken |
| trim-audio | Trim Audio | Audio Tools | true | trim-audio | ["audio/*"] | unknown | yes | yes | yes | working |
| video-compressor | Video Compressor | Video Tools | true | video-compressor | ["video/*"] | unknown | yes | yes | yes | working |
| video-trimmer | Video Trimmer | Video Tools | true | video-trimmer | ["video/*"] | unknown | yes | yes | yes | working |
| volume-booster | Volume Booster | Audio Tools | true | volume-booster | ["audio/*"] | unknown | yes | yes | yes | working |
| watermark-image | Watermark Image | Image Tools | false | watermark-image | ["image/*"] | unknown | yes | yes | yes | working |
| wav-converter | Wav Converter | Audio Tools | true | wav-converter | ["audio/*"] | unknown | yes | yes | yes | working |
| webm-converter | Webm Converter | Video Tools | true | webm-converter | ["video/*"] | unknown | yes | yes | yes | working |
| word-counter | Word Counter | PDF & Documents | true | word-counter | ["text/plain"] | text/plain | yes | yes | no | working |
| word-to-pdf | Word To PDF | PDF & Documents | true | word-to-pdf | [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] | unknown | yes | yes | yes | working |

Notes:
- `category` preserves the catalog labels from source.
- `accepted_types` and `output_type` are only filled when the source exposes them directly; otherwise they remain `unknown`.
- `is_wired` is based on explicit file-workspace settings or the three ToolPage text-tool branches.
- `status` is a static codebase heuristic: `working`, `broken`, `stub`, or `missing`.