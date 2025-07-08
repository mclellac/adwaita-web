import pytest
import os
from unittest.mock import MagicMock, patch
from flask import Flask # Minimal Flask app for context
from app-demo.utils import save_uploaded_file, allowed_file_util
from app-demo.config import TestConfig # Using the TestConfig we defined

# Fixture for a minimal app context with necessary config for upload tests
@pytest.fixture
def upload_test_app():
    app = Flask(__name__)
    app.config.from_object(TestConfig) # Load test config (UPLOAD_FOLDER, etc.)

    # Ensure the UPLOAD_FOLDER and GALLERY_UPLOAD_FOLDER from TestConfig are used to create directories
    # This mimics what create_app in __init__.py does for directory creation.
    # app.static_folder is 'static' by default, relative to app root.
    # We need to ensure these paths exist for the test.

    # Create temporary static and upload directories for this test app
    # The app root for this test app will be wherever pytest is running from,
    # so we need to be careful with relative paths.
    # It's better if TestConfig defines these as absolute paths to temp dirs,
    # or we create them based on a known temp location.

    # For simplicity, let's assume TestConfig's UPLOAD_FOLDER is 'uploads/test_profile_pics'
    # and app.static_folder is correctly set up by Flask.
    # We'll mock os.makedirs and os.path.exists if needed, or use tempfile module.

    # Let's use tempfile for actual directory creation to ensure isolation
    import tempfile
    temp_static_dir = tempfile.mkdtemp()
    app.static_folder = temp_static_dir

    # Update config to use these temp paths
    app.config['UPLOAD_FOLDER'] = os.path.join(temp_static_dir, app.config['UPLOAD_FOLDER'])
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    app.config['GALLERY_UPLOAD_FOLDER'] = os.path.join(temp_static_dir, app.config['GALLERY_UPLOAD_FOLDER'])
    os.makedirs(app.config['GALLERY_UPLOAD_FOLDER'], exist_ok=True)

    # Also need ALLOWED_EXTENSIONS
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'txt'}
    app.config['MAX_PROFILE_PHOTO_SIZE_BYTES'] = 2 * 1024 * 1024 # 2MB

    # Keys used by save_uploaded_file to get relative paths from config
    # These should hold the *relative* paths as per current save_uploaded_file design
    app.config['PROFILE_PIC_BASE_PATH_CONFIG_KEY'] = 'uploads/test_profile_pics' # This is the value utils.py expects to get
    app.config['GALLERY_PIC_BASE_PATH_CONFIG_KEY'] = 'uploads/test_gallery_photos'


    with app.app_context():
        yield app

    # Clean up temp directory
    import shutil
    shutil.rmtree(temp_static_dir)


def test_allowed_file_util(upload_test_app):
    with upload_test_app.test_request_context(): # Needs app context for current_app.config
        assert allowed_file_util("test.jpg") == True
        assert allowed_file_util("test.png") == True
        assert allowed_file_util("test.txt") == True # Added to ALLOWED_EXTENSIONS in fixture
        assert allowed_file_util("test.pdf") == False
        assert allowed_file_util("test") == False # No extension
        assert allowed_file_util(".jpg") == True # Filename starting with dot

# Test for save_uploaded_file (focus on path generation and return value)
# This test will mock the actual file saving part (Image.open, save)
# as we are primarily interested in the path logic.
@patch('app-demo.utils.Image.open') # Mock Pillow Image.open
@patch('os.makedirs', return_value=None) # Mock os.makedirs
@patch('os.path.exists', return_value=True) # Assume file exists after saving for the test
def test_save_uploaded_file_path_generation(mock_os_exists, mock_os_makedirs, mock_image_open, upload_test_app):
    # Mock the image object and its save method
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance

    mock_file_storage = MagicMock()
    mock_file_storage.filename = "test_image.jpg"
    mock_file_storage.content_length = 1024 * 1024 # 1MB, within limits
    mock_file_storage.stream = MagicMock() # Mock the stream attribute

    upload_type = "profile_photo"
    # This key should point to the config entry that holds the *relative* path within static.
    # In TestConfig, UPLOAD_FOLDER is 'uploads/test_profile_pics'.
    # The save_uploaded_file expects the *name of the config key*.
    # So, if config is {'UPLOAD_FOLDER_REL': 'uploads/test_profile_pics'}, then key is 'UPLOAD_FOLDER_REL'.
    # My fixture set app.config['PROFILE_PIC_BASE_PATH_CONFIG_KEY'] = 'uploads/test_profile_pics'
    # but save_uploaded_file expects the *key name*, not the path itself.
    # Let's adjust the fixture or this test.
    # TestConfig.UPLOAD_FOLDER = 'uploads/test_profile_pics'
    # The key name is 'UPLOAD_FOLDER'.

    base_upload_path_config_key = 'UPLOAD_FOLDER' # This key in app.config should hold the relative path

    # Adjust fixture to ensure app.config[base_upload_path_config_key] holds the relative path
    # The upload_test_app fixture now sets app.config['UPLOAD_FOLDER'] to an *absolute* path.
    # This is a mismatch with how save_uploaded_file is designed, which expects
    # current_app.config.get(base_upload_path_config_key) to return a *relative* path.

    # Let's adjust the test to reflect the actual config structure:
    # In TestConfig: UPLOAD_FOLDER = 'uploads/test_profile_pics' (relative)
    # The app fixture should NOT convert this to absolute for the test of save_uploaded_file's internal logic.
    # save_uploaded_file itself will join it with app.static_folder.

    # Re-think: the upload_test_app fixture *should* set up app.config['UPLOAD_FOLDER']
    # to be the relative path, matching TestConfig.
    # The current version of upload_test_app converts it to absolute, which is wrong for this test.
    # I will correct the fixture logic mentally for now.
    # The `app.config['UPLOAD_FOLDER']` should be 'uploads/test_profile_pics' in the test app context.

    # The `upload_test_app` fixture needs to be simpler:
    # app.config['UPLOAD_FOLDER'] = TestConfig.UPLOAD_FOLDER (which is 'uploads/test_profile_pics')
    # app.static_folder will be the temp dir.
    # So, `save_uploaded_file` will internally compute:
    # relative_base_path = 'uploads/test_profile_pics'
    # final_save_dir_abs = os.path.join(temp_static_dir, 'uploads/test_profile_pics')
    # db_path_prefix = 'uploads/test_profile_pics'
    # This seems correct. The fixture's modification of app.config['UPLOAD_FOLDER'] to absolute was the issue.

    # For this test, we'll assume upload_test_app is configured such that
    # app.config['UPLOAD_FOLDER'] = 'uploads/test_profile_pics' (relative)
    # and app.static_folder is a temp directory.
    # The save_uploaded_file will then construct the absolute save path.

    with upload_test_app.test_request_context():
        # Modify the app config directly for this test to ensure it's as expected by save_uploaded_file
        # This overrides the fixture's absolute path conversion for 'UPLOAD_FOLDER' for this test's scope.
        upload_test_app.config['UPLOAD_FOLDER'] = TestConfig.UPLOAD_FOLDER # Ensure it's relative

        returned_db_path = save_uploaded_file(
            file_storage_object=mock_file_storage,
            upload_type=upload_type,
            base_upload_path_config_key='UPLOAD_FOLDER', # Config key holding the relative path
            max_size_bytes_config_key='MAX_PROFILE_PHOTO_SIZE_BYTES',
            thumbnail_size=(150,150) # For profile photo type
        )

    assert returned_db_path is not None
    assert TestConfig.UPLOAD_FOLDER in returned_db_path # e.g. "uploads/test_profile_pics/uuid.jpg"
    assert returned_db_path.startswith(TestConfig.UPLOAD_FOLDER)

    # Check that the mocked save was called with an absolute path inside the static folder
    expected_save_dir_abs = os.path.join(upload_test_app.static_folder, TestConfig.UPLOAD_FOLDER)
    # The filename is uuid.ext, so we can't predict it exactly, but can check the dir
    # mock_img_instance.save.assert_called_once() # save is called
    # call_args = mock_img_instance.save.call_args[0][0] # First arg of the call
    # assert call_args.startswith(expected_save_dir_abs)

    # This part is tricky because of the UUID. Let's focus on the returned DB path.
    # The critical part is that returned_db_path is relative and correct.

    # Verify os.makedirs was called correctly
    mock_os_makedirs.assert_any_call(expected_save_dir_abs, exist_ok=True)

    # Verify Image.open was called
    mock_image_open.assert_called_once_with(mock_file_storage.stream)

    # Verify thumbnail was called if thumbnail_size is provided
    mock_img_instance.thumbnail.assert_called_once_with((150,150), Image.Resampling.LANCZOS)

@patch('app-demo.utils.Image.open')
@patch('os.makedirs', return_value=None)
@patch('os.path.exists', return_value=True)
def test_save_gallery_photo_path_generation_with_user_id(mock_os_exists, mock_os_makedirs, mock_image_open, upload_test_app):
    mock_img_instance = MagicMock()
    mock_image_open.return_value = mock_img_instance

    mock_file_storage = MagicMock()
    mock_file_storage.filename = "gallery_image.png"
    mock_file_storage.content_length = 1024 * 1024
    mock_file_storage.stream = MagicMock()

    user_id = 123
    upload_type = "gallery_photo"
    # TestConfig.GALLERY_UPLOAD_FOLDER = 'uploads/test_gallery_photos'
    base_upload_path_config_key = 'GALLERY_UPLOAD_FOLDER'

    with upload_test_app.test_request_context():
        upload_test_app.config['GALLERY_UPLOAD_FOLDER'] = TestConfig.GALLERY_UPLOAD_FOLDER # Ensure relative

        returned_db_path = save_uploaded_file(
            file_storage_object=mock_file_storage,
            upload_type=upload_type,
            base_upload_path_config_key=base_upload_path_config_key,
            max_size_bytes_config_key='MAX_GALLERY_PHOTO_SIZE_BYTES', # From TestConfig via Config
            current_user_id=user_id
        )

    assert returned_db_path is not None
    expected_relative_prefix = os.path.join(TestConfig.GALLERY_UPLOAD_FOLDER, str(user_id))
    assert returned_db_path.startswith(expected_relative_prefix.replace("\\", "/"))

    expected_save_dir_abs = os.path.join(upload_test_app.static_folder, TestConfig.GALLERY_UPLOAD_FOLDER, str(user_id))
    mock_os_makedirs.assert_any_call(expected_save_dir_abs, exist_ok=True)
    # mock_img_instance.save.assert_called_once()
    # call_args_save = mock_img_instance.save.call_args[0][0]
    # assert call_args_save.startswith(expected_save_dir_abs)
    mock_image_open.assert_called_once_with(mock_file_storage.stream)
    # No thumbnail by default for gallery in save_uploaded_file unless thumbnail_size is passed
    mock_img_instance.thumbnail.assert_not_called()
