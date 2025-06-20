#!/bin/bash

# This script builds the Adwaita-Web SASS and copies the necessary files to app-demo.

# Exit immediately if a command exits with a non-zero status.
set -e

# Define paths
SASS_INPUT="scss/style.scss"
CSS_OUTPUT_DIR="app-demo/static/css"
CSS_OUTPUT_FILE="${CSS_OUTPUT_DIR}/adwaita-web.css"
JS_INPUT_DIR="js"
JS_OUTPUT_DIR="app-demo/static/js"

# Create output directories if they don't exist
mkdir -p "${CSS_OUTPUT_DIR}"
mkdir -p "${JS_OUTPUT_DIR}"

# Compile SASS to CSS
echo "Compiling SASS: ${SASS_INPUT} to ${CSS_OUTPUT_FILE}"
sass "${SASS_INPUT}" "${CSS_OUTPUT_FILE}"

# Copy JavaScript files
echo "Copying JavaScript files from ${JS_INPUT_DIR} to ${JS_OUTPUT_DIR}"
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
# If there are other JS files to copy, add them here. e.g.:
# cp "${JS_INPUT_DIR}/another-script.js" "${JS_OUTPUT_DIR}/another-script.js"

# Copy SCSS files
echo "Copying SCSS files from scss to ${CSS_OUTPUT_DIR}/scss"
cp -r "scss" "${CSS_OUTPUT_DIR}/scss"

echo "Build complete. Adwaita-Web assets are updated in app-demo."
