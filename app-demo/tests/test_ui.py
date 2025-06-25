import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

import threading
import time
from app import create_app, db, User # Assuming app.py is in the parent directory or accessible

# Configuration for the Flask app
TEST_APP_HOST = "127.0.0.1"
TEST_APP_PORT = 5001 # Use a different port than default 5000 to avoid conflicts
BASE_URL = f"http://{TEST_APP_HOST}:{TEST_APP_PORT}"

# Global app instance for the test server thread
flask_app_instance = None

def run_flask_app():
    global flask_app_instance
    test_config = {
        'TESTING': True, # Important for some Flask extensions
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:', # Use in-memory for UI tests too
        'WTF_CSRF_ENABLED': False, # Disable CSRF for easier testing if forms are involved directly
        'LOGIN_DISABLED': False,
        'SERVER_NAME': f'{TEST_APP_HOST}:{TEST_APP_PORT}',
        'APPLICATION_ROOT': '/',
        'PREFERRED_URL_SCHEME': 'http',
    }
    flask_app_instance = create_app(config_overrides=test_config)

    # Setup app context for db operations if needed during app startup
    with flask_app_instance.app_context():
        db.create_all()
        # You might want to create a default user for login tests here
        if User.query.filter_by(username='testuiuser').first() is None:
            user = User(username='testuiuser')
            user.set_password('password123')
            db.session.add(user)
            db.session.commit()

    flask_app_instance.run(host=TEST_APP_HOST, port=TEST_APP_PORT, use_reloader=False)

@pytest.fixture(scope="session", autouse=True)
def live_server(request):
    """Starts the Flask app in a separate thread for the test session."""
    if os.environ.get("CI"): # Skip in CI if no browser available
        pytest.skip("Skipping UI tests in CI environment without browser.")
        return

    server_thread = threading.Thread(target=run_flask_app, daemon=True)
    server_thread.start()

    # Wait a bit for the server to start
    time.sleep(2)

    # Teardown can be added here if needed, but daemon thread should stop with main process
    # For explicit shutdown, you'd need to signal the Flask app to stop.

    yield # Test execution happens here

    # Optional: Add server shutdown logic if necessary
    # (e.g., sending a /shutdown request to a special Flask route)


@pytest.fixture(scope="function")
def driver(live_server): # Depends on live_server to ensure app is running
    options = webdriver.ChromeOptions()
    options.add_argument("--headless") # Run headless
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080") # Standard window size

    # Enable logging to capture console errors
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

    try:
        service = ChromeService(ChromeDriverManager().install())
        web_driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        pytest.skip(f"Skipping UI test: WebDriver setup failed. Error: {e}")
        return None # Should not reach here due to pytest.skip

    web_driver.implicitly_wait(5) # Implicit wait for elements

    yield web_driver

    # Teardown: quit driver
    if web_driver:
        web_driver.quit()

# Helper function to check for JS console errors
def check_js_console_errors(driver_instance):
    errors = []
    for entry in driver_instance.get_log('browser'):
        if entry['level'] == 'SEVERE':
            print(f"JS SEVERE Error: {entry['message']}") # Print for debugging in CI
            errors.append(entry['message'])
    assert not errors, "JavaScript SEVERE errors found in console."


# --- Basic UI Tests ---

def test_homepage_loads_adwaita_elements(driver):
    if driver is None: pytest.skip("WebDriver not available.")
    driver.get(BASE_URL + "/")

    # Check for Adwaita Application Window
    try:
        app_window = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "adw-application-window"))
        )
        assert app_window.is_displayed(), "Adwaita application window is not displayed."
    except TimeoutException:
        pytest.fail("Adwaita application window not found on homepage.")

    # Check for Adwaita Header Bar
    try:
        header_bar = app_window.find_element(By.TAG_NAME, "adw-header-bar")
        assert header_bar.is_displayed(), "Adwaita header bar is not displayed."
    except NoSuchElementException:
        pytest.fail("Adwaita header bar not found within application window.")

    # Check for Adwaita Window Title in Header Bar
    try:
        window_title = header_bar.find_element(By.TAG_NAME, "adw-window-title")
        assert window_title.is_displayed(), "Adwaita window title is not displayed."
        assert window_title.text == "Blog CMS", "Window title text is incorrect."
    except NoSuchElementException:
        pytest.fail("Adwaita window title not found within header bar.")

    check_js_console_errors(driver)


def test_login_page_elements(driver):
    if driver is None: pytest.skip("WebDriver not available.")
    driver.get(BASE_URL + "/login")
    time.sleep(2) # Increased delay
    # Wait for custom elements to be defined
    driver.execute_async_script(
        "const callback = arguments[arguments.length - 1];"
        "Promise.all(["
        "  customElements.whenDefined('adw-entry-row'),"
        "  customElements.whenDefined('adw-entry'),"
        "  customElements.whenDefined('adw-button')"
        "]).then(() => callback());"
    )

    try:
        # Adwaita specific elements for login form
        username_adw_entry_row = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Username']"))
        )
        username_adw_entry = driver.execute_script(
            "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
            username_adw_entry_row
        )
        assert username_adw_entry is not None, "adw-entry in username_adw_entry_row shadow DOM not found"
        username_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", username_adw_entry)
        assert username_input_field is not None, "Username input field within shadow DOM not found"
        assert username_input_field.is_displayed()

        password_adw_entry_row = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title='Password']")
        password_adw_entry = driver.execute_script(
            "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
            password_adw_entry_row
        )
        assert password_adw_entry is not None, "adw-entry in password_adw_entry_row shadow DOM not found"
        password_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", password_adw_entry)
        assert password_input_field is not None, "Password input field within shadow DOM not found"
        assert password_input_field.is_displayed()

        login_button = driver.find_element(By.CSS_SELECTOR, "adw-button[type='submit'][suggested]")
        assert login_button.is_displayed()
        assert "Login" in login_button.text

    except (TimeoutException, NoSuchElementException) as e:
        pytest.fail(f"Login page Adwaita element not found or not as expected. Error: {e}")

    check_js_console_errors(driver)


def test_user_login_and_new_post_button_visible(driver):
    if driver is None: pytest.skip("WebDriver not available.")
    driver.get(BASE_URL + "/login")
    time.sleep(2) # Increased delay
    # Wait for custom elements to be defined
    driver.execute_async_script(
        "const callback = arguments[arguments.length - 1];"
        "Promise.all(["
        "  customElements.whenDefined('adw-entry-row'),"
        "  customElements.whenDefined('adw-entry'),"
        "  customElements.whenDefined('adw-button')"
        "]).then(() => callback());"
    )

    # Log in
    username_adw_entry_row = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Username']"))
    )
    username_adw_entry = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        username_adw_entry_row
    )
    assert username_adw_entry is not None, "adw-entry in username_adw_entry_row shadow DOM not found for login"
    username_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", username_adw_entry)
    assert username_input_field is not None, "Username input field in shadow DOM not found for login"
    username_input_field.send_keys("testuiuser")
    # Directly set the value of the hidden input within AdwEntry
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", username_adw_entry, "testuiuser")


    password_adw_entry_row = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title='Password']")
    password_adw_entry = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        password_adw_entry_row
    )
    assert password_adw_entry is not None, "adw-entry in password_adw_entry_row shadow DOM not found for login"
    password_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", password_adw_entry)
    assert password_input_field is not None, "Password input field in shadow DOM not found for login"
    password_input_field.send_keys("password123")
    # Directly set the value of the hidden input within AdwEntry
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", password_adw_entry, "password123")

    # Debug: Check hidden input names
    username_hidden_input_name = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('input[type=hidden]').name", username_adw_entry
    )
    print(f"DEBUG: Username hidden input name: {username_hidden_input_name}")
    password_hidden_input_name = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('input[type=hidden]').name", password_adw_entry
    )
    print(f"DEBUG: Password hidden input name: {password_hidden_input_name}")

    driver.execute_script("document.getElementById('login-form').submit();") # Direct form submission by ID

    # Explicitly wait for URL to change to homepage after login
    WebDriverWait(driver, 10).until(EC.url_to_be(BASE_URL + "/"))

    # Wait for redirect to homepage and check for "New Post" button
    try:
        new_post_button = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//adw-header-bar//a[contains(@class, 'adw-button') and contains(@class, 'suggested-action') and contains(text(), 'New Post')]"))
        )
        assert new_post_button.is_displayed(), "'New Post' button not displayed after login."
        assert new_post_button.get_attribute("href").endswith("/create"), "'New Post' button link is incorrect."
    except TimeoutException:
        pytest.fail("'New Post' button not found on homepage after login.")

    check_js_console_errors(driver)


def test_create_post_page_elements(driver):
    if driver is None: pytest.skip("WebDriver not available.")
    # First, log in
    driver.get(BASE_URL + "/login")
    time.sleep(2) # Increased delay
    # Wait for custom elements to be defined on login page
    driver.execute_async_script(
        "const callback = arguments[arguments.length - 1];"
        "Promise.all(["
        "  customElements.whenDefined('adw-entry-row'),"
        "  customElements.whenDefined('adw-entry'),"
        "  customElements.whenDefined('adw-button')"
        "]).then(() => callback());"
    )
    username_adw_entry_row = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Username']"))
    )
    username_adw_entry = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        username_adw_entry_row
    )
    assert username_adw_entry is not None, "adw-entry in username_adw_entry_row shadow DOM not found for login"
    username_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", username_adw_entry)
    assert username_input_field is not None, "Username input field in shadow DOM not found for login"
    username_input_field.send_keys("testuiuser")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", username_adw_entry, "testuiuser")

    password_adw_entry_row = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title='Password']")
    password_adw_entry = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        password_adw_entry_row
    )
    assert password_adw_entry is not None, "adw-entry in password_adw_entry_row shadow DOM not found for login"
    password_input_field = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", password_adw_entry)
    assert password_input_field is not None, "Password input field in shadow DOM not found for login"
    password_input_field.send_keys("password123")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", password_adw_entry, "password123")

    driver.execute_script("document.getElementById('login-form').submit();") # Direct form submission by ID

    # Navigate to create post page
    WebDriverWait(driver, 10).until(EC.url_to_be(BASE_URL + "/")) # Wait for login redirect
    driver.get(BASE_URL + "/create")

    try:
        # Check for Adwaita form elements
        title_entry_row = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Title']"))
        )
        assert title_entry_row.is_displayed()
        title_input = title_entry_row.find_element(By.CSS_SELECTOR, "adw-entry input")
        assert title_input.is_displayed()

        # Content text area - assuming it's a standard textarea styled to look Adwaita-like
        # or wrapped in some adw- class. For now, look for name 'content'.
        content_textarea = driver.find_element(By.CSS_SELECTOR, "textarea[name='content']")
        assert content_textarea.is_displayed()

        # Categories might be adw-check-button or similar inside a listbox/box
        # This is a simplified check for the label.
        categories_label = driver.find_element(By.XPATH, "//label[contains(text(), 'Categories')]")
        assert categories_label.is_displayed()
        # Example: Check for at least one adw-check-button if categories exist
        # (Requires categories to be pre-populated or test setup to create them)
        # first_category_checkbox = driver.find_element(By.CSS_SELECTOR, "adw-list-box adw-check-button")
        # assert first_category_checkbox.is_displayed()


        tags_entry_row = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title*='Tags']")
        assert tags_entry_row.is_displayed()
        tags_input = tags_entry_row.find_element(By.CSS_SELECTOR, "adw-entry input")
        assert tags_input.is_displayed()

        submit_button = driver.find_element(By.CSS_SELECTOR, "adw-button[type='submit'][suggested]")
        assert submit_button.is_displayed()
        assert "Submit Post" in submit_button.text # or "Create Post" depending on template

    except (TimeoutException, NoSuchElementException) as e:
        pytest.fail(f"Create post page Adwaita element not found or not as expected. Error: {e}")

    check_js_console_errors(driver)


def test_flash_messages_toast_and_banner(driver):
    if driver is None: pytest.skip("WebDriver not available.")
    # This test requires a way to trigger flash messages.
    # We'll use login failure for a banner (danger) and a successful login for a toast (success).

    # 1. Trigger a danger banner (login failure)
    driver.get(BASE_URL + "/login")
    time.sleep(2) # Increased delay
    # Wait for custom elements to be defined
    driver.execute_async_script(
        "const callback = arguments[arguments.length - 1];"
        "Promise.all(["
        "  customElements.whenDefined('adw-entry-row'),"
        "  customElements.whenDefined('adw-entry'),"
        "  customElements.whenDefined('adw-button')"
        "]).then(() => callback());"
    )
    username_adw_entry_row_fail = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Username']"))
    )
    username_adw_entry_fail = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        username_adw_entry_row_fail
    )
    assert username_adw_entry_fail is not None, "adw-entry in username_adw_entry_row_fail shadow DOM not found"
    username_input_field_fail = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", username_adw_entry_fail)
    assert username_input_field_fail is not None, "Username input field in shadow DOM not found for fail case"
    username_input_field_fail.send_keys("wronguser")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", username_adw_entry_fail, "wronguser")

    password_adw_entry_row_fail = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title='Password']")
    password_adw_entry_fail = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        password_adw_entry_row_fail
    )
    assert password_adw_entry_fail is not None, "adw-entry in password_adw_entry_row_fail shadow DOM not found"
    password_input_field_fail = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", password_adw_entry_fail)
    assert password_input_field_fail is not None, "Password input field in shadow DOM not found for fail case"
    password_input_field_fail.send_keys("wrongpass")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", password_adw_entry_fail, "wrongpass")

    driver.execute_script("document.getElementById('login-form').submit();") # Direct form submission by ID

    try:
        danger_banner = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-banner.error"))
            # Assuming flash 'danger' maps to adw-banner.error
        )
        assert danger_banner.is_displayed()
        assert "Invalid username or password." in danger_banner.text
        # Check for dismiss button if banners are dismissible
        # dismiss_button = danger_banner.find_element(By.CSS_SELECTOR, "adw-button.circular[icon-name*='close']")
        # assert dismiss_button.is_displayed()
        # dismiss_button.click()
        # WebDriverWait(driver, 5).until_not(EC.visibility_of(danger_banner))

    except TimeoutException:
        pytest.fail("Danger (error) banner for login failure not found or not visible.")

    check_js_console_errors(driver) # Check after interaction

    # 2. Trigger a success toast (successful login)
    driver.get(BASE_URL + "/login") # Go back to login
    time.sleep(2) # Increased delay
    # Wait for custom elements to be defined
    driver.execute_async_script(
        "const callback = arguments[arguments.length - 1];"
        "Promise.all(["
        "  customElements.whenDefined('adw-entry-row'),"
        "  customElements.whenDefined('adw-entry'),"
        "  customElements.whenDefined('adw-button')"
        "]).then(() => callback());"
    )
    username_adw_entry_row_success = WebDriverWait(driver, 10).until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-entry-row[title='Username']"))
    )
    username_adw_entry_success = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        username_adw_entry_row_success
    )
    assert username_adw_entry_success is not None, "adw-entry in username_adw_entry_row_success shadow DOM not found"
    username_input_field_success = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", username_adw_entry_success)
    assert username_input_field_success is not None, "Username input field in shadow DOM not found for success case"
    username_input_field_success.send_keys("testuiuser")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", username_adw_entry_success, "testuiuser")

    password_adw_entry_row_success = driver.find_element(By.CSS_SELECTOR, "adw-entry-row[title='Password']")
    password_adw_entry_success = driver.execute_script(
        "return arguments[0].shadowRoot.querySelector('adw-entry.adw-entry-row-entry')",
        password_adw_entry_row_success
    )
    assert password_adw_entry_success is not None, "adw-entry in password_adw_entry_row_success shadow DOM not found"
    password_input_field_success = driver.execute_script("return arguments[0].shadowRoot.querySelector('input.adw-entry')", password_adw_entry_success)
    assert password_input_field_success is not None, "Password input field in shadow DOM not found for success case"
    password_input_field_success.send_keys("password123")
    driver.execute_script("arguments[0].shadowRoot.querySelector('input[type=hidden]').value = arguments[1]", password_adw_entry_success, "password123")

    driver.execute_script("document.getElementById('login-form').submit();") # Direct form submission by ID

    try:
        # Adw.createToast creates an adw-toast element, usually in an adw-toast-overlay
        success_toast_overlay = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "adw-toast-overlay"))
        )
        # Toasts are harder to catch as they disappear. We look for the overlay and then the toast.
        # The success toast should have a 'success' class or type attribute if styled that way by Adw.js
        success_toast = WebDriverWait(success_toast_overlay, 5).until(
             EC.visibility_of_element_located((By.CSS_SELECTOR, "adw-toast.success"))
        )
        assert success_toast.is_displayed()
        assert "Logged in successfully." in success_toast.text
        # Wait for toast to potentially disappear (though this is hard to test reliably without knowing timeout)
        # WebDriverWait(driver, 7).until_not(EC.visibility_of(success_toast)) # Example: wait up to 7s
    except TimeoutException:
        pytest.fail("Success toast for login not found or not visible.")

    check_js_console_errors(driver)


# Placeholder for more tests:
# - Profile page elements (avatar, entries for info)
# - Settings page elements (switches, combo rows for theme/accent)
# - View post page elements (content display, comment form)
# - Adwaita color compliance checks (more advanced, might need get_computed_style)

# An example of how one might check a specific Adwaita color variable if needed:
# def test_accent_color_on_suggested_button(driver):
#     if driver is None: pytest.skip("WebDriver not available.")
#     driver.get(BASE_URL + "/login")
#     login_button = driver.find_element(By.CSS_SELECTOR, "adw-button[type='submit'][suggested]")
#
#     # Get the computed background color
#     # This is highly dependent on how Adw.js applies accent colors (CSS variables)
#     # For example, if it sets --accent-bg-color which is then used by the button.
#     # Note: Selenium's value_of_css_property might not resolve CSS variables directly.
#     # You might need JavaScript execution or a more complex setup.
#
#     # Example: Check if a CSS class related to the accent color is present
#     # (This depends on implementation details of adwaita-web)
#     # initial_accent_class = "accent-blue" # Assuming blue is default
#     # assert initial_accent_class in login_button.get_attribute("class")
#
#     # Change accent color via settings (if UI allows, or via API call then refresh)
#     # ...
#
#     # Re-check button color/class
#     # updated_accent_class = "accent-green"
#     # assert updated_accent_class in login_button.get_attribute("class")
#     check_js_console_errors(driver)

# Add an import for os at the top of the file if not already present
import os
