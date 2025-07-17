import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options

@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless")
    driver = webdriver.Firefox(options=options)
    yield driver
    driver.quit()

def test_layout(driver):
    import subprocess
    import time
    p = subprocess.Popen(["flask", "run"])
    try:
        time.sleep(15)
        driver.get("http://127.0.0.1:5000")

        # Check that the sidebar and content are stacked vertically
        sidebar = driver.find_element(By.CLASS_NAME, "app-sidebar")
        content = driver.find_element(By.CLASS_NAME, "app-content-area")

        assert sidebar.location['y'] < content.location['y']
        assert sidebar.size['height'] > 0
        assert content.size['height'] > 0

        # Check that the footer is at the bottom of the page
        footer = driver.find_element(By.CLASS_NAME, "app-footer")
        assert footer.location['y'] > content.location['y']
    finally:
        p.kill()

def test_comment_actions(driver):
    import subprocess
    import os
    import signal
    try:
        lsof_output = subprocess.check_output(["lsof", "-i", ":5000"]).decode()
        for line in lsof_output.splitlines():
            if "LISTEN" in line:
                pid = int(line.split()[1])
                os.kill(pid, signal.SIGKILL)
    except (subprocess.CalledProcessError, IndexError):
        pass
    p = subprocess.Popen(["flask", "run"])
    from antisocialnet import create_app, db
    from antisocialnet.models import User
    app = create_app()
    with app.app_context():
        db.create_all()
        user = db.session.query(User).filter(User.username == 'testuser@test.com').first()
        if user:
            db.session.delete(user)
            db.session.commit()
        user = User(username='testuser@test.com', full_name='Test User', is_admin=True, is_approved=True, is_active=True)
        user.set_password('password')
        db.session.add(user)
        db.session.commit()

    try:
        import time
        time.sleep(240)
        # Log in
        driver.get("http://127.0.0.1:5000/auth/login")
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "username"))
        )
        driver.find_element(By.NAME, "username").send_keys("testuser@test.com")
        driver.find_element(By.NAME, "password").send_keys("password")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Create a post
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "h1.adw-title-1"))
        )
        driver.get("http://127.0.0.1:5000/dashboard")
        WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.LINK_TEXT, "New Post"))
        )
        driver.find_element(By.LINK_TEXT, "New Post").click()
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "content"))
        )
        driver.find_element(By.NAME, "title").send_keys("This is a test post.")
        driver.find_element(By.NAME, "content").send_keys("This is the content of the test post.")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Add a comment
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.NAME, "text"))
        )
        driver.find_element(By.NAME, "text").send_keys("This is a test comment.")
        driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

        # Verify that the comment actions are present
        comment_actions = driver.find_element(By.CLASS_NAME, "comment-actions")
        assert comment_actions.find_element(By.CLASS_NAME, "reply-button")
        assert comment_actions.find_element(By.CLASS_NAME, "edit-comment-button")
        assert comment_actions.find_element(By.CSS_SELECTOR, "form[action*='delete']")

        # Verify that the reply form appears when the reply button is clicked
        comment_actions.find_element(By.CLASS_NAME, "reply-button").click()
        assert driver.find_element(By.ID, "reply-form-container-1")

        # Verify that the edit form appears when the edit button is clicked
        comment_actions.find_element(By.CLASS_NAME, "edit-comment-button").click()
        assert driver.find_element(By.CSS_SELECTOR, "form[action*='edit']")

        # Verify that the comment is deleted when the delete button is clicked
        comment_actions.find_element(By.CSS_SELECTOR, "form[action*='delete'] button").click()
        driver.switch_to.alert.accept()
        assert "This is a test comment." not in driver.page_source
    finally:
        with app.app_context():
            user = db.session.query(User).filter(User.username == 'testuser@test.com').first()
            if user:
                db.session.delete(user)
                db.session.commit()
        p.kill()
