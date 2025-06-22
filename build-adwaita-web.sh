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
mkdir -p "${CSS_OUTPUT_DIR}"
mkdir -p "${JS_OUTPUT_DIR}"

# Compile SASS to CSS
echo "--- Compiling SASS to CSS ---"
sass_output_and_error=$(sass "${SASS_INPUT_FILE}" "${CSS_OUTPUT_FILE}" 2>&1)
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
    # Only print SASS output if it's not empty (i.e., if there were warnings)
    if [ -n "${sass_output_and_error}" ]; then
        echo "SASS Compilation Warnings (or other output):"
        echo "${sass_output_and_error}"
    fi
    echo "SASS compilation successful."
fi

# Verify the output file
if [ ! -f "${CSS_OUTPUT_FILE}" ]; then
    echo "ERROR: Output CSS file '${CSS_OUTPUT_FILE}' was not created despite SASS success."
    exit 1
fi

if grep -q -E '^[[:space:]]*(@use|[[:space:]]*@import)' "${CSS_OUTPUT_FILE}"; then
    echo "WARNING: Compiled CSS file '${CSS_OUTPUT_FILE}' may still contain raw SCSS '@use' or '@import' statements."
    echo "This could indicate SCSS compilation issues. First 20 lines for review:"
    head -n 20 "${CSS_OUTPUT_FILE}"
else
    echo "CSS file validation passed (no raw @use/@import directives found)."
fi

# Copy JavaScript files
echo "--- Copying JavaScript Files ---"
cp "${JS_INPUT_DIR}/components.js" "${JS_OUTPUT_DIR}/components.js"

# Ensure the target directory for individual component files exists
JS_COMPONENTS_SUBDIR_DEST="${JS_OUTPUT_DIR}/components"
mkdir -p "${JS_COMPONENTS_SUBDIR_DEST}"

# Copy only the modified/relevant JS component files
MODIFIED_JS_FILES=(
    "button.js"
    "dialog.js"
    "misc.js"
    "rows.js"
    # Add other specific files here if they were changed and are needed
)

for js_file in "${MODIFIED_JS_FILES[@]}"; do
    if [ -f "${JS_INPUT_DIR}/components/${js_file}" ]; then
        cp "${JS_INPUT_DIR}/components/${js_file}" "${JS_COMPONENTS_SUBDIR_DEST}/${js_file}"
        echo "Copied ${js_file} to ${JS_COMPONENTS_SUBDIR_DEST}"
    else
        echo "WARNING: Modified JS file ${JS_INPUT_DIR}/components/${js_file} not found. Skipping."
    fi
done

# Note: If other JS files in js/components/ were essential and not copied,
# this could lead to runtime errors. This is a targeted fix for the "too many files" issue.

echo "--- Build complete. ---"
