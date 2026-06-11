@echo off
echo Deploying all Appwrite Functions...
echo Please ensure you are logged in via 'appwrite login' before running this script.

appwrite deploy function --functionId=base64-encoder
appwrite deploy function --functionId=excel-to-pdf
appwrite deploy function --functionId=image-bg-remover
appwrite deploy function --functionId=image-compressor
appwrite deploy function --functionId=image-converter
appwrite deploy function --functionId=image-resizer
appwrite deploy function --functionId=jpg-to-pdf
appwrite deploy function --functionId=json-formatter
appwrite deploy function --functionId=pdf-compare
appwrite deploy function --functionId=pdf-compressor
appwrite deploy function --functionId=pdf-crop
appwrite deploy function --functionId=pdf-flatten
appwrite deploy function --functionId=pdf-merger
appwrite deploy function --functionId=pdf-metadata-viewer
appwrite deploy function --functionId=pdf-ocr
appwrite deploy function --functionId=pdf-page-numbers
appwrite deploy function --functionId=pdf-protect
appwrite deploy function --functionId=pdf-redact
appwrite deploy function --functionId=pdf-repair
appwrite deploy function --functionId=pdf-rotate
appwrite deploy function --functionId=pdf-sign
appwrite deploy function --functionId=pdf-splitter
appwrite deploy function --functionId=pdf-thumbnail
appwrite deploy function --functionId=pdf-to-excel
appwrite deploy function --functionId=pdf-to-html
appwrite deploy function --functionId=pdf-to-jpg
appwrite deploy function --functionId=pdf-to-powerpoint
appwrite deploy function --functionId=pdf-to-text
appwrite deploy function --functionId=pdf-to-word
appwrite deploy function --functionId=pdf-unlock
appwrite deploy function --functionId=pdf-watermark
appwrite deploy function --functionId=pdf-word-count
appwrite deploy function --functionId=powerpoint-to-pdf
appwrite deploy function --functionId=text-case-converter
appwrite deploy function --functionId=video-compressor
appwrite deploy function --functionId=video-trimmer
appwrite deploy function --functionId=word-counter
appwrite deploy function --functionId=word-to-pdf
appwrite deploy function --functionId=paypal-webhook

echo Deployment complete!
