#!/bin/bash

# Exit immediately if a command exits with a non-zero status, and print commands.
set -ex

# Define paths
SASS_SOURCE_DIR="scss"
SASS_INPUT_FILE="${SASS_SOURCE_DIR}/style.scss"
CSS_OUTPUT_DIR="app-demo/static/css"
CSS_OUTPUT_FILE="${CSS_OUTPUT_DIR}/adwaita-web.css"
JS_INPUT_DIR="js"
JS_OUTPUT_DIR="app-demo/static/js"

echo "--- Starting Adwaita-Web Build Script ---"

# Create output directories if they don't exist
echo "Ensuring CSS output directory exists: ${CSS_OUTPUT_DIR}"
mkdir -p "${CSS_OUTPUT_DIR}"
echo "Ensuring JS output directory exists: ${JS_OUTPUT_DIR}"
mkdir -p "${JS_OUTPUT_DIR}"

# Compile SASS to CSS
echo "--- SASS Compilation Step ---"
echo "Input SCSS file: ${SASS_INPUT_FILE}"
echo "Output CSS file: ${CSS_OUTPUT_FILE}"
echo "Attempting to compile SASS using sass..." # Changed
echo "Full command: sass "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}"" # Changed

# Run sass and capture its output and exit code
sass_output_and_error=$(sass "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" 2>&1) # Changed from sassc
sass_exit_code=$? # Changed from sassc_exit_code

echo "sass command finished. Exit code: ${sass_exit_code}" # Changed

if [ ${sass_exit_code} -ne 0 ]; then
    echo "ERROR: sass command failed with exit code ${sass_exit_code}." # Changed
    echo "sass output and error (if any):" # Changed
    echo "${sass_output_and_error}" # Changed
    if [ ${sass_exit_code} -eq 127 ]; then
        echo "NOTE: Exit code 127 often means 'command not found'. Is sass installed and in your PATH?"
        if ! command -v sass &> /dev/null; then # Changed
            echo "Follow-up check: 'command -v sass' confirms sass is NOT found." # Changed
        else
            echo "Follow-up check: 'command -v sass' suggests sass IS found. Problem might be with execution." # Changed
        fi
    fi
    exit 1
else
    echo "sass command appears to have succeeded (exit code 0)." # Changed
    echo "Standard output/error from sass (if any, should be empty on success unless warnings):" # Changed
    echo "${sass_output_and_error}" # Changed
    echo "First 10 lines of the generated CSS file (${CSS_OUTPUT_FILE}):"
    head -n 10 "${CSS_OUTPUT_FILE}"
fi

# Verify the output file
echo "--- CSS Output Verification ---"
if [ ! -f "${CSS_OUTPUT_FILE}" ]; then
    echo "ERROR: Output CSS file '${CSS_OUTPUT_FILE}' was not created."
    exit 1
fi

# Updated grep to be more specific if sass compiler adds its own comments with @use or @import
# This checks if the lines *start* with @use or @import, common for uncompiled SCSS.
if grep -q -E '^[[:space:]]*(@use|[[:space:]]*@import)' "${CSS_OUTPUT_FILE}"; then
    echo "WARNING: Compiled CSS file '${CSS_OUTPUT_FILE}' may still contain raw '@use' or '@import' statements at the beginning of lines."
    echo "This could indicate SCSS compilation issues. Manual inspection of the CSS file is advised."
    echo "First 20 lines of ${CSS_OUTPUT_FILE} for review:"
    head -n 20 "${CSS_OUTPUT_FILE}"
    # Consider not exiting with 1 here if `sass` might produce valid CSS that includes these for other reasons (e.g. CSS imports)
    # For now, let's make it a warning, as the user is confident in the `sass` command.
else
    echo "SUCCESS: Compiled CSS file '${CSS_OUTPUT_FILE}' does not appear to contain raw SCSS '@use' or '@import' directives at the beginning of lines."
fi

# Copy JavaScript files
# ... (rest of the script remains the same)
echo "--- JavaScript Copying Step ---"
echo "Copying JavaScript files from ${JS_INPUT_DIR} to ${JS_OUTPUT_DIR}"
# Copy main JS files
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
cp "${JS_INPUT_DIR}/adw-initializer.js" "${JS_OUTPUT_DIR}/adw-initializer.js"

# Copy the components subdirectory
JS_COMPONENTS_SUBDIR_SOURCE="${JS_INPUT_DIR}/components"
JS_COMPONENTS_SUBDIR_DEST="${JS_OUTPUT_DIR}/components"
if [ -d "${JS_COMPONENTS_SUBDIR_SOURCE}" ]; then
    echo "Copying JavaScript components subdirectory from ${JS_COMPONENTS_SUBDIR_SOURCE} to ${JS_COMPONENTS_SUBDIR_DEST}"
    mkdir -p "${JS_COMPONENTS_SUBDIR_DEST}"
    cp -r "${JS_COMPONENTS_SUBDIR_SOURCE}/." "${JS_COMPONENTS_SUBDIR_DEST}/"
else
    echo "WARNING: JavaScript components subdirectory ${JS_COMPONENTS_SUBDIR_SOURCE} not found. Skipping copy."
fi

echo "--- Build complete. Adwaita-Web assets are updated in app-demo. ---"
