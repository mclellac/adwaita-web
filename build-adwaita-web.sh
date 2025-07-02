#!/bin/bash

set -e

# Define paths

# Source paths
ADWAITA_WEB_DIR="adwaita-web"
SASS_SOURCE_DIR="${ADWAITA_WEB_DIR}/scss"
SASS_INPUT_FILE="${SASS_SOURCE_DIR}/adwaita-skin.scss" # Main SASS file for the skin
JS_INPUT_DIR="${ADWAITA_WEB_DIR}/js"
DATA_INPUT_DIR="${ADWAITA_WEB_DIR}/data"
FONTS_INPUT_DIR="${ADWAITA_WEB_DIR}/fonts"

# Intermediate build output directory (for general assets)
BUILD_DIR="build"
BUILD_CSS_DIR="${BUILD_DIR}/css"
BUILD_JS_DIR="${BUILD_DIR}/js"
BUILD_DATA_DIR="${BUILD_DIR}/data"
BUILD_FONTS_DIR="${BUILD_DIR}/fonts"

# Final CSS output names and locations
# This is where the SASS compiler outputs the CSS initially
ADWAITA_WEB_COMPILED_CSS_DIR="${ADWAITA_WEB_DIR}/css"
COMPILED_CSS_FILENAME="adwaita-skin.css"
COMPILED_CSS_FILE_PATH="${ADWAITA_WEB_COMPILED_CSS_DIR}/${COMPILED_CSS_FILENAME}"

# Target for the root index.html
ROOT_INDEX_CSS_TARGET_PATH="${BUILD_CSS_DIR}/${COMPILED_CSS_FILENAME}"

# Target for app-demo
APP_DEMO_STATIC_DIR="app-demo/static"
APP_DEMO_CSS_DIR="${APP_DEMO_STATIC_DIR}/css"
APP_DEMO_CSS_TARGET_PATH="${APP_DEMO_CSS_DIR}/${COMPILED_CSS_FILENAME}"

echo "--- Starting Build Script ---"

# Create output directories if they don't exist
mkdir -p "${BUILD_CSS_DIR}"
mkdir -p "${BUILD_JS_DIR}"
mkdir -p "${BUILD_DATA_DIR}"
mkdir -p "${BUILD_FONTS_DIR}"
# Create specific subdirectories if needed by the source structure
mkdir -p "${BUILD_JS_DIR}/components"
mkdir -p "${BUILD_DATA_DIR}/icons/symbolic"

# Create intermediate CSS output directory within adwaita-web
mkdir -p "${ADWAITA_WEB_COMPILED_CSS_DIR}"

# Compile SASS to CSS
echo "--- Compiling SASS to CSS (${SASS_INPUT_FILE} -> ${COMPILED_CSS_FILE_PATH}) ---"
# Use SASS from PATH (installed globally via npm)
SASS_EXEC="sass"
sass_output_and_error=$($SASS_EXEC "${SASS_INPUT_FILE}" "${COMPILED_CSS_FILE_PATH}" --style compressed 2>&1)
sass_exit_code=$?

if [ ${sass_exit_code} -ne 0 ]; then
    echo "ERROR: SASS compilation failed (exit code ${sass_exit_code})."
    echo "SASS Compiler Output:"
    echo "${sass_output_and_error}"
    if [ ${sass_exit_code} -eq 127 ]; then # Should not happen now if sass is in PATH
        echo "NOTE: Exit code 127 often means 'command not found'. Is sass installed and in your PATH?"
    fi
    echo "WARNING: SASS compilation step did not succeed. CSS file may not be updated. Continuing script..."
else
    if [ -n "${sass_output_and_error}" ]; then # Print warnings or other output if any
        echo "SASS Compilation Warnings (or other output):"
        echo "${sass_output_and_error}"
    fi
    echo "SASS compilation successful: ${COMPILED_CSS_FILE_PATH}"
fi

# Verify the compiled CSS file
if [ ! -f "${COMPILED_CSS_FILE_PATH}" ]; then
    echo "WARNING: Compiled CSS file '${COMPILED_CSS_FILE_PATH}' was not created. SASS step likely failed."
    # exit 1 # Continue
else
    echo "Compiled CSS file '${COMPILED_CSS_FILE_PATH}' exists."
fi


# Copy JavaScript files to BUILD directory
echo "--- Copying JavaScript Files to ${BUILD_JS_DIR} ---"
if [ -f "${JS_INPUT_DIR}/components.js" ]; then
    cp "${JS_INPUT_DIR}/components.js" "${BUILD_JS_DIR}/components.js"
    echo "Copied ${JS_INPUT_DIR}/components.js to ${BUILD_JS_DIR}/components.js"
else
    echo "WARNING: Main JS file ${JS_INPUT_DIR}/components.js not found."
fi
JS_COMPONENTS_SOURCE_DIR="${JS_INPUT_DIR}/components"
JS_COMPONENTS_DEST_DIR="${BUILD_JS_DIR}/components"
if [ -d "${JS_COMPONENTS_SOURCE_DIR}" ]; then
    cp -r "${JS_COMPONENTS_SOURCE_DIR}/." "${JS_COMPONENTS_DEST_DIR}/"
    echo "Copied JS components from ${JS_COMPONENTS_SOURCE_DIR} to ${JS_COMPONENTS_DEST_DIR}"
else
    echo "WARNING: JS components directory ${JS_COMPONENTS_SOURCE_DIR} not found."
fi

# Copy data files (e.g., icons) to BUILD directory
echo "--- Copying Data Files to ${BUILD_DATA_DIR} ---"
DATA_ICONS_SOURCE_DIR="${DATA_INPUT_DIR}/icons/symbolic"
DATA_ICONS_DEST_DIR="${BUILD_DATA_DIR}/icons/symbolic"
if [ -d "${DATA_ICONS_SOURCE_DIR}" ]; then
    cp -r "${DATA_ICONS_SOURCE_DIR}/." "${DATA_ICONS_DEST_DIR}/"
    echo "Copied data files from ${DATA_ICONS_SOURCE_DIR} to ${DATA_ICONS_DEST_DIR}"
else
    echo "INFO: Data icons directory ${DATA_ICONS_SOURCE_DIR} not found. Skipping."
fi

# Copy font files to BUILD directory
echo "--- Copying Font Files to ${BUILD_FONTS_DIR} ---"
if [ -d "${FONTS_INPUT_DIR}" ] && [ "$(ls -A ${FONTS_INPUT_DIR})" ]; then
    cp -r "${FONTS_INPUT_DIR}/." "${BUILD_FONTS_DIR}/"
    echo "Copied font files from ${FONTS_INPUT_DIR} to ${BUILD_FONTS_DIR}"
else
    echo "INFO: Fonts directory ${FONTS_INPUT_DIR} not found or is empty. Skipping font copy."
fi

# --- Copying Assets to Final Destinations ---

echo "--- Copying CSS to final destinations ---"
# Copy compiled CSS to the main build directory (for root index.html)
if [ -f "${COMPILED_CSS_FILE_PATH}" ]; then
    cp "${COMPILED_CSS_FILE_PATH}" "${ROOT_INDEX_CSS_TARGET_PATH}"
    echo "Copied ${COMPILED_CSS_FILE_PATH} to ${ROOT_INDEX_CSS_TARGET_PATH}"
else
    echo "WARNING: Compiled CSS file ${COMPILED_CSS_FILE_PATH} not found. Skipping copy to ${BUILD_CSS_DIR}."
fi

# Copy compiled CSS to app-demo/static/css
# Ensure app-demo static CSS directory exists
mkdir -p "${APP_DEMO_CSS_DIR}"
if [ -f "${COMPILED_CSS_FILE_PATH}" ]; then
    cp "${COMPILED_CSS_FILE_PATH}" "${APP_DEMO_CSS_TARGET_PATH}"
    echo "Copied ${COMPILED_CSS_FILE_PATH} to ${APP_DEMO_CSS_TARGET_PATH}"
else
    echo "WARNING: Compiled CSS file '${COMPILED_CSS_FILE_PATH}' not found. Skipping copy to app-demo."
fi


echo "--- Copying Other Built Assets to app-demo/static ---"
APP_DEMO_JS_DIR="${APP_DEMO_STATIC_DIR}/js"
APP_DEMO_DATA_DIR="${APP_DEMO_STATIC_DIR}/data"
APP_DEMO_FONTS_DIR="${APP_DEMO_STATIC_DIR}/fonts"

mkdir -p "${APP_DEMO_JS_DIR}/components"
mkdir -p "${APP_DEMO_DATA_DIR}/icons/symbolic"
mkdir -p "${APP_DEMO_FONTS_DIR}/mono" # Assuming these subdirs exist in source
mkdir -p "${APP_DEMO_FONTS_DIR}/sans"

# Copy JS from BUILD to app-demo
if [ -d "${BUILD_JS_DIR}" ] && [ "$(ls -A ${BUILD_JS_DIR})" ]; then
    cp -r "${BUILD_JS_DIR}/." "${APP_DEMO_JS_DIR}/"
    echo "Copied JS files from ${BUILD_JS_DIR} to ${APP_DEMO_JS_DIR}"
else
    echo "WARNING: Built JS directory ${BUILD_JS_DIR} not found or empty. Skipping copy to app-demo."
fi

# Copy Data from BUILD to app-demo
if [ -d "${BUILD_DATA_DIR}" ] && [ "$(ls -A ${BUILD_DATA_DIR})" ]; then
    cp -r "${BUILD_DATA_DIR}/." "${APP_DEMO_DATA_DIR}/"
    echo "Copied data files from ${BUILD_DATA_DIR} to ${APP_DEMO_DATA_DIR}"
else
    echo "INFO: Built data directory ${BUILD_DATA_DIR} not found or empty. Skipping copy to app-demo."
fi

# Copy Fonts from BUILD to app-demo
if [ -d "${BUILD_FONTS_DIR}" ] && [ "$(ls -A ${BUILD_FONTS_DIR})" ]; then
    cp -r "${BUILD_FONTS_DIR}/." "${APP_DEMO_FONTS_DIR}/"
    echo "Copied font files from ${BUILD_FONTS_DIR} to ${APP_DEMO_FONTS_DIR}"
else
    echo "INFO: Built fonts directory ${BUILD_FONTS_DIR} not found or empty. Skipping copy to app-demo."
fi

echo "--- Build Script Finished ---"
