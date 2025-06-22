#!/bin/bash

set -e

# Define paths
SASS_SOURCE_DIR="adwaita-web/scss"
SASS_INPUT_FILE="${SASS_SOURCE_DIR}/style.scss"
JS_INPUT_DIR="adwaita-web/js"
DATA_INPUT_DIR="adwaita-web/data"        # Assuming fonts are in data/fonts
FONTS_INPUT_DIR="adwaita-web/data/fonts" # Placeholder, adjust if fonts are elsewhere

BUILD_DIR="build"
CSS_OUTPUT_DIR="${BUILD_DIR}/css"
JS_OUTPUT_DIR="${BUILD_DIR}/js"
DATA_OUTPUT_DIR="${BUILD_DIR}/data"
FONTS_OUTPUT_DIR="${BUILD_DIR}/fonts"

CSS_OUTPUT_FILE="${CSS_OUTPUT_DIR}/adwaita-web.css"

echo "--- Starting Adwaita-Web Build Script ---"

# Create output directories if they don't exist
mkdir -p "${CSS_OUTPUT_DIR}"
mkdir -p "${JS_OUTPUT_DIR}"
mkdir -p "${DATA_OUTPUT_DIR}"
mkdir -p "${FONTS_OUTPUT_DIR}"
# Create specific subdirectories for JS components and data icons if needed
mkdir -p "${JS_OUTPUT_DIR}/components"
mkdir -p "${DATA_OUTPUT_DIR}/icons/symbolic"

# Compile SASS to CSS
echo "--- Compiling SASS to CSS ---"
sass_output_and_error=$(sass "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" --style compressed 2>&1)
sass_exit_code=$?

if [ ${sass_exit_code} -ne 0 ]; then
    echo "ERROR: SASS compilation failed (exit code ${sass_exit_code})."
    echo "SASS Compiler Output:"
    echo "${sass_output_and_error}"
    if [ ${sass_exit_code} -eq 127 ]; then
        echo "NOTE: Exit code 127 often means 'command not found'. Is sass installed and in your PATH?"
    fi
    exit 1
else
    if [ -n "${sass_output_and_error}" ]; then
        echo "SASS Compilation Warnings (or other output):"
        echo "${sass_output_and_error}"
    fi
    echo "SASS compilation successful: ${CSS_OUTPUT_FILE}"
fi

# Verify the output file
if [ ! -f "${CSS_OUTPUT_FILE}" ]; then
    echo "ERROR: Output CSS file '${CSS_OUTPUT_FILE}' was not created."
    exit 1
fi

# Copy JavaScript files
echo "--- Copying JavaScript Files ---"
# Copy main components.js
if [ -f "${JS_INPUT_DIR}/components.js" ]; then
    cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
    echo "Copied ${JS_INPUT_DIR}/components.js to ${JS_OUTPUT_DIR}/components.js"
else
    echo "WARNING: Main JS file ${JS_INPUT_DIR}/components.js not found."
fi

# Copy all files from js/components directory
JS_COMPONENTS_SOURCE_DIR="${JS_INPUT_DIR}/components"
JS_COMPONENTS_DEST_DIR="${JS_OUTPUT_DIR}/components"
if [ -d "${JS_COMPONENTS_SOURCE_DIR}" ]; then
    cp -r "${JS_COMPONENTS_SOURCE_DIR}/." "${JS_COMPONENTS_DEST_DIR}/"
    echo "Copied all JS components from ${JS_COMPONENTS_SOURCE_DIR} to ${JS_COMPONENTS_DEST_DIR}"
else
    echo "WARNING: JS components directory ${JS_COMPONENTS_SOURCE_DIR} not found."
fi

# Copy data files (e.g., icons)
echo "--- Copying Data Files ---"
# Example: copying symbolic icons. Adjust if your structure is different.
DATA_ICONS_SOURCE_DIR="${DATA_INPUT_DIR}/icons/symbolic"
DATA_ICONS_DEST_DIR="${DATA_OUTPUT_DIR}/icons/symbolic"
if [ -d "${DATA_ICONS_SOURCE_DIR}" ]; then
    cp -r "${DATA_ICONS_SOURCE_DIR}/." "${DATA_ICONS_DEST_DIR}/"
    echo "Copied data files from ${DATA_ICONS_SOURCE_DIR} to ${DATA_ICONS_DEST_DIR}"
else
    echo "INFO: Data icons directory ${DATA_ICONS_SOURCE_DIR} not found. Skipping."
fi

# Copy font files
# This is a placeholder. Adjust the source path if your fonts are located elsewhere.
echo "--- Copying Font Files ---"
if [ -d "${FONTS_INPUT_DIR}" ] && [ "$(ls -A ${FONTS_INPUT_DIR})" ]; then
    cp -r "${FONTS_INPUT_DIR}/." "${FONTS_OUTPUT_DIR}/"
    echo "Copied font files from ${FONTS_INPUT_DIR} to ${FONTS_OUTPUT_DIR}"
else
    echo "INFO: Fonts directory ${FONTS_INPUT_DIR} not found or is empty. Skipping font copy."
    echo "If you have fonts, ensure they are in adwaita-web/data/fonts or update FONTS_INPUT_DIR in the script."
fi

# Reduce verbosity for successful operations, keep errors detailed.
# Removed many "echo" statements for successful steps, focusing on summarizing completion or errors.

echo "--- Adwaita-Web Build Script Finished ---"
