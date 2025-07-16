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
    driver.get("http://127.0.0.1:5000")

    # Check that the sidebar and content are side-by-side
    sidebar = driver.find_element(By.CLASS_NAME, "app-sidebar")
    content = driver.find_element(By.CLASS_NAME, "app-content-area")

    assert sidebar.location['x'] < content.location['x']
    assert sidebar.size['height'] > 0
    assert content.size['height'] > 0

    # Check that the footer is at the bottom of the page
    footer = driver.find_element(By.CLASS_NAME, "app-footer")
    assert footer.location['y'] > content.location['y']
