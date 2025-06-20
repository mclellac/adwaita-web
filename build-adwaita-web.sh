#!/bin/bash

# This script builds the Adwaita-Web SASS and copies the necessary files to app-demo.

# Exit immediately if a command exits with a non-zero status.
set -e

# Define paths
SASS_SOURCE_DIR="scss"
SASS_INPUT_FILE="${SASS_SOURCE_DIR}/style.scss"
CSS_OUTPUT_DIR="app-demo/static/css"
CSS_OUTPUT_FILE="${CSS_OUTPUT_DIR}/adwaita-web.css"
JS_INPUT_DIR="js"
JS_OUTPUT_DIR="app-demo/static/js"

# Create output directories if they don't exist
mkdir -p "${CSS_OUTPUT_DIR}"
mkdir -p "${JS_OUTPUT_DIR}"

# Compile SASS to CSS
echo "Compiling SASS: ${SASS_INPUT_FILE} to ${CSS_OUTPUT_FILE}"
sassc "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" -m -t compact

# Remove the app-demo/static/scss directory if it exists
if [ -d "app-demo/static/scss" ]; then
  echo "Removing app-demo/static/scss directory to prevent potential conflicts."
  rm -rf "app-demo/static/scss"
fi

# Copy JavaScript files
echo "Copying JavaScript files from ${JS_INPUT_DIR} to ${JS_OUTPUT_DIR}"
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
cp "${JS_INPUT_DIR}/adw-initializer.js" "${JS_OUTPUT_DIR}/adw-initializer.js"
# If there are other JS files to copy, add them here. e.g.:
# cp "${JS_INPUT_DIR}/another-script.js" "${JS_OUTPUT_DIR}/another-script.js"

echo "Build complete. Adwaita-Web assets are updated in app-demo."
