import pytest
import os
from unittest.mock import MagicMock, patch
from flask import Flask # Minimal Flask app for context
from antisocialnet.utils import save_uploaded_file, allowed_file_util
from antisocialnet.config import TestConfig

# Fixture for a minimal app context with necessary config for upload tests
@pytest.fixture
def upload_test_app():
    app = Flask(__name__)
    app.config.from_object(TestConfig)

    import tempfile
    temp_static_dir = tempfile.mkdtemp()
    app.static_folder = temp_static_dir

    # Ensure UPLOAD_FOLDER and GALLERY_UPLOAD_FOLDER are relative to static_folder for the test
    # and that they exist. save_uploaded_file constructs absolute paths using these.
    relative_upload_folder = app.config.get('UPLOAD_FOLDER', 'uploads/profile_pics') # Default from config
    app.config['UPLOAD_FOLDER_ABS'] = os.path.join(temp_static_dir, relative_upload_folder)
    os.makedirs(app.config['UPLOAD_FOLDER_ABS'], exist_ok=True)
    # Keep UPLOAD_FOLDER as relative for the utility function to use
    app.config['UPLOAD_FOLDER'] = relative_upload_folder


    relative_gallery_folder = app.config.get('GALLERY_UPLOAD_FOLDER', 'uploads/gallery_pics') # Default from config
    app.config['GALLERY_UPLOAD_FOLDER_ABS'] = os.path.join(temp_static_dir, relative_gallery_folder)
    os.makedirs(app.config['GALLERY_UPLOAD_FOLDER_ABS'], exist_ok=True)
    # Keep GALLERY_UPLOAD_FOLDER as relative
    app.config['GALLERY_UPLOAD_FOLDER'] = relative_gallery_folder


    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'txt'}
    app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] = 2 * 1024 * 1024 # 2MB
    app.config['MAX_GALLERY_PHOTO_SIZE_BYTES'] = 5 * 1024 * 1024 # 5MB


    with app.app_context():
        yield app

    import shutil
    shutil.rmtree(temp_static_dir)


def test_allowed_file_util(upload_test_app):
    with upload_test_app.test_request_context():
        assert allowed_file_util("test.jpg") == True
        assert allowed_file_util("test.png") == True
        assert allowed_file_util("test.txt") == True
        assert allowed_file_util("test.pdf") == False
        assert allowed_file_util("test") == False
        assert allowed_file_util(".jpg") == True

@patch('antisocialnet.utils.Image.open')
@patch('os.makedirs', return_value=None)
@patch('os.path.exists', return_value=True) # Assume file exists after saving
def test_save_uploaded_file_profile_photo(mock_os_exists, mock_os_makedirs, mock_image_open, upload_test_app):
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance
    mock_file_storage = MagicMock()
    mock_file_storage.filename = "test_image.jpg"
    mock_file_storage.content_length = 1024 * 1024 # 1MB
    mock_file_storage.stream = MagicMock()

    with upload_test_app.test_request_context():
        returned_db_path = save_uploaded_file(
            file_storage_object=mock_file_storage,
            upload_type="profile_photo",
            base_upload_path_config_key='UPLOAD_FOLDER',
            max_size_bytes_config_key='MAX_PROFILE_PHOTO_SIZE_BYTES',
            thumbnail_size=(150,150)
        )

    assert returned_db_path is not None
    # UPLOAD_FOLDER is relative path like 'uploads/profile_pics'
    assert returned_db_path.startswith(TestConfig.UPLOAD_FOLDER)
    # Ensure the save directory was created with absolute path
    abs_save_dir = os.path.join(upload_test_app.static_folder, TestConfig.UPLOAD_FOLDER)
    mock_os_makedirs.assert_any_call(abs_save_dir, exist_ok=True)
    from PIL import Image # Import for Resampling
    mock_img_instance.thumbnail.assert_called_once_with((150,150), Image.Resampling.LANCZOS)
    # Check that save was called (filename is uuid based, so can't check full path easily)
    assert mock_img_instance.save.called

@patch('antisocialnet.utils.Image.open')
@patch('os.makedirs', return_value=None)
@patch('os.path.exists', return_value=True)
def test_save_uploaded_file_gallery_photo(mock_os_exists, mock_os_makedirs, mock_image_open, upload_test_app):
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance
    mock_file_storage = MagicMock()
    mock_file_storage.filename = "gallery_image.png"
    mock_file_storage.content_length = 1024 * 1024 # 1MB
    mock_file_storage.stream = MagicMock()
    user_id = 123

    with upload_test_app.test_request_context():
        returned_db_path = save_uploaded_file(
            file_storage_object=mock_file_storage,
            upload_type="gallery_photo",
            base_upload_path_config_key='GALLERY_UPLOAD_FOLDER',
            max_size_bytes_config_key='MAX_GALLERY_PHOTO_SIZE_BYTES',
            current_user_id=user_id
        )

    assert returned_db_path is not None
    # GALLERY_UPLOAD_FOLDER is relative, e.g. 'uploads/gallery_pics'
    # returned path should be 'uploads/gallery_pics/123/uuid.png'
    expected_prefix = os.path.join(TestConfig.GALLERY_UPLOAD_FOLDER, str(user_id))
    assert returned_db_path.startswith(expected_prefix.replace("\\", "/"))
    abs_save_dir = os.path.join(upload_test_app.static_folder, TestConfig.GALLERY_UPLOAD_FOLDER, str(user_id))
    mock_os_makedirs.assert_any_call(abs_save_dir, exist_ok=True)
    assert mock_img_instance.save.called
    mock_img_instance.thumbnail.assert_not_called() # No thumbnail for gallery by default

# --- Tests for other utility functions ---
from antisocialnet.utils import generate_slug_util, extract_mentions, human_readable_date, linkify_mentions, markdown_to_html_and_sanitize_util

def test_generate_slug_util():
    assert generate_slug_util("Hello World") == "hello-world"
    assert generate_slug_util("  Leading and Trailing Spaces  ") == "leading-and-trailing-spaces"
    assert generate_slug_util("Special!@#$%^&*()_+Chars") == "special-chars"
    assert generate_slug_util("Long Text That Exceeds Fifty Characters Limit For Slug Generation", max_length=50) == "long-text-that-exceeds-fifty-characters-limit-fo"
    assert generate_slug_util("Short", max_length=10) == "short"
    assert generate_slug_util("Another Very Long Text String To Test Custom Max Length", max_length=20) == "another-very-long-te"
    assert generate_slug_util("") == ""
    assert generate_slug_util(None) == ""
    assert generate_slug_util("連続したハイフン--は一つに") == "連続したハイフン-は一つに"
    assert generate_slug_util("你好世界 hello") == "你好世界-hello"

def test_extract_mentions():
    assert set(extract_mentions("Hello @world and @test_user!")) == {"world", "test_user"}
    assert set(extract_mentions("No mentions here.")) == set()
    assert set(extract_mentions("Mention @user_1 and @user-2 (invalid).")) == {"user_1"}
    # The regex \w includes letters, numbers, and underscore. '.' is not included.
    # So, @user.name will extract 'user' before the dot.
    assert set(extract_mentions("Mention with dot @user.name should be user")) == {"user"}
    assert set(extract_mentions("Email like test@example.com should not be a mention")) == set()
    assert set(extract_mentions("@_underscore_user_")) == {"_underscore_user_"}
    # Hyphen is not \w, so it stops the username.
    assert set(extract_mentions("@user-with-hyphen")) == {"user"}
    assert set(extract_mentions("Text\n@nextline_user")) == {"nextline_user"}
    assert set(extract_mentions("@123numeric")) == {"123numeric"}
    assert set(extract_mentions("Hello @ world")) == set() # Space terminates username
    assert set(extract_mentions("Hello @!invalid")) == set() # ! terminates username
    assert set(extract_mentions("dot.after@user not a mention")) == set() # @ not at start of word
    assert set(extract_mentions("@user_at_end")) == {"user_at_end"}

def test_human_readable_date_current_implementation():
    from datetime import datetime, timezone
    dt_example = datetime(2023, 1, 5, 15, 45, 0, tzinfo=timezone.utc)
    assert human_readable_date(dt_example, show_time=True) == "Jan 05, 2023, 03:45 PM"
    dt_early_month_am = datetime(2023, 7, 5, 9, 5, 0, tzinfo=timezone.utc)
    assert human_readable_date(dt_early_month_am, show_time=True) == "Jul 05, 2023, 09:05 AM"
    assert human_readable_date(dt_example, show_time=False) == "Jan 05, 2023"
    assert human_readable_date(None) is None
    assert human_readable_date("not a date") == "not a date"
    assert human_readable_date(12345) == 12345
    dt_future = datetime(2099, 12, 25, 10, 0, 0, tzinfo=timezone.utc)
    assert human_readable_date(dt_future, show_time=True) == "Dec 25, 2099, 10:00 AM"
    assert human_readable_date(dt_future, show_time=False) == "Dec 25, 2099"

def test_linkify_mentions():
    text_no_mentions = "Hello world, no mentions here."
    assert linkify_mentions(text_no_mentions) == text_no_mentions
    text_with_mention = "Hello @testuser, how are you?"
    expected_md_link = "[@testuser](/profile/testuser)"
    assert linkify_mentions(text_with_mention) == f"Hello {expected_md_link}, how are you?"
    text_multiple_mentions = "@user1 check this out, also @user2."
    expected_md_link1 = "[@user1](/profile/user1)"
    expected_md_link2 = "[@user2](/profile/user2)"
    assert linkify_mentions(text_multiple_mentions) == f"{expected_md_link1} check this out, also {expected_md_link2}."
    text_with_punctuation = "Is @user.name (aka @user_name) there?"
    expected_md_link_user = "[@user](/profile/user)"
    expected_md_link_user_name = "[@user_name](/profile/user_name)"
    assert linkify_mentions(text_with_punctuation) == f"Is {expected_md_link_user}.name (aka {expected_md_link_user_name}) there?"
    assert linkify_mentions(None) == ""
    assert linkify_mentions("") == ""

def test_markdown_to_html_and_sanitize_util():
    assert markdown_to_html_and_sanitize_util("**bold**") == "<p><strong>bold</strong></p>"
    assert markdown_to_html_and_sanitize_util("*italic*") == "<p><em>italic</em></p>"
    assert markdown_to_html_and_sanitize_util("[link](http://example.com)") == '<p><a href="http://example.com">link</a></p>' # Corrected: rel is not added by current util
    assert markdown_to_html_and_sanitize_util("<script>alert('XSS')</script>") == "<p>&lt;script&gt;alert('XSS')&lt;/script&gt;</p>"
    assert markdown_to_html_and_sanitize_util('<a href="#" onclick="alert(\'XSS\')">Click me</a>') == '<p><a href="#">Click me</a></p>'
    assert markdown_to_html_and_sanitize_util("![alt text](http://example.com/image.png)") == '<p><img alt="alt text" src="http://example.com/image.png"></p>'
    assert markdown_to_html_and_sanitize_util(None) == ""
    assert markdown_to_html_and_sanitize_util("") == ""
    assert markdown_to_html_and_sanitize_util("# Header 1") == "<h1>Header 1</h1>"
    md_list = "* Item 1\n* Item 2"
    html_list = "<ul>\n<li>Item 1</li>\n<li>Item 2</li>\n</ul>"
    assert markdown_to_html_and_sanitize_util(md_list).replace("\n", "") == html_list.replace("\n", "")
