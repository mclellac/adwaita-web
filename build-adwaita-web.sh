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

# Copy SCSS files first (moved from below)
echo "Copying SCSS files from scss to app-demo/static/scss"
cp -r "scss" "app-demo/static/scss"

# Compile SASS to CSS
echo "Changing directory to app-demo/static for SASS compilation"
ORIGINAL_PWD=$(pwd)
cd "app-demo/static" || exit 1 # Exit if cd fails

echo "Compiling SASS: scss/style.scss to css/adwaita-web.css"
sassc "scss/style.scss" "css/adwaita-web.css" -m -t compact

echo "Changing directory back to ${ORIGINAL_PWD}"
cd "${ORIGINAL_PWD}" || exit 1 # Exit if cd fails

# Copy JavaScript files
echo "Copying JavaScript files from ${JS_INPUT_DIR} to ${JS_OUTPUT_DIR}"
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
cp "${JS_INPUT_DIR}/adw-initializer.js" "${JS_OUTPUT_DIR}/adw-initializer.js"
# If there are other JS files to copy, add them here. e.g.:
# cp "${JS_INPUT_DIR}/another-script.js" "${JS_OUTPUT_DIR}/another-script.js"

echo "Build complete. Adwaita-Web assets are updated in app-demo."
