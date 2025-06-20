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
echo "Attempting to compile SASS using sassc..."
echo "Full command: sassc "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" -t compact"

# Run sassc and capture its output and exit code
# Note: Using a temporary file for sassc_output might be more robust for very large outputs
sassc_output_and_error=$(sassc "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" -t compact 2>&1)
sassc_exit_code=$?

echo "sassc command finished. Exit code: ${sassc_exit_code}"

if [ ${sassc_exit_code} -ne 0 ]; then
    echo "ERROR: sassc command failed with exit code ${sassc_exit_code}."
    echo "sassc output and error (if any):"
    echo "${sassc_output_and_error}"
    # Attempt to check if sassc is installed if command not found (common issue)
    if [ ${sassc_exit_code} -eq 127 ]; then
        echo "NOTE: Exit code 127 often means 'command not found'. Is sassc installed and in your PATH?"
        if ! command -v sassc &> /dev/null; then
            echo "Follow-up check: 'command -v sassc' confirms sassc is NOT found."
        else
            echo "Follow-up check: 'command -v sassc' suggests sassc IS found. Problem might be with execution."
        fi
    fi
    exit 1
else
    echo "sassc command appears to have succeeded (exit code 0)."
    echo "Standard output/error from sassc (if any, should be empty on success):"
    echo "${sassc_output_and_error}" # Should be empty if no warnings/errors
    echo "First 10 lines of the generated CSS file (${CSS_OUTPUT_FILE}):"
    head -n 10 "${CSS_OUTPUT_FILE}"
fi

# Verify the output file
echo "--- CSS Output Verification ---"
if [ ! -f "${CSS_OUTPUT_FILE}" ]; then
    echo "ERROR: Output CSS file '${CSS_OUTPUT_FILE}' was not created."
    exit 1
fi

if grep -q -E '(@use|@import)' "${CSS_OUTPUT_FILE}"; then
    echo "ERROR: Compiled CSS file '${CSS_OUTPUT_FILE}' still contains '@use' or '@import' statements!"
    echo "This indicates SCSS compilation failed or was effectively bypassed."
    echo "Contents of ${CSS_OUTPUT_FILE}:"
    cat "${CSS_OUTPUT_FILE}"
    exit 1
else
    echo "SUCCESS: Compiled CSS file '${CSS_OUTPUT_FILE}' does not appear to contain raw '@use' or '@import' statements."
fi

# Copy JavaScript files
echo "--- JavaScript Copying Step ---"
echo "Copying JavaScript files from ${JS_INPUT_DIR} to ${JS_OUTPUT_DIR}"
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"
cp "${JS_INPUT_DIR}/adw-initializer.js" "${JS_OUTPUT_DIR}/adw-initializer.js"
# If there are other JS files to copy, add them here. e.g.:
# cp "${JS_INPUT_DIR}/another-script.js" "${JS_OUTPUT_DIR}/another-script.js"

echo "--- Build complete. Adwaita-Web assets are updated in app-demo. ---"
