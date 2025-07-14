import pytest
import subprocess
import os
import yaml
import tempfile
from antisocialnet.models import User, SiteSetting, db as main_app_db # To inspect DB state after script runs
from antisocialnet.config import TestConfig # To get DB URI details if needed

# Note: These tests will run setup_db.py as a subprocess.
# This means they need to configure the environment for that subprocess,
# especially database connection details.
# The main app's TestConfig uses sqlite:///:memory:.
# For setup_db.py, we might need it to target a specific, temporary file-based SQLite DB
# or a test PostgreSQL DB if we want to test PostgreSQL-specific parts of setup_db.py.
# The AGENTS.md for setup_db.py mentions it uses env vars like POSTGRES_USER etc.
# For simplicity and speed, these tests will target a temporary SQLite file database,
# as setting up a separate PostgreSQL instance just for these subprocess tests is complex in this env.

@pytest.fixture(scope="function")
def temp_sqlite_db_file():
    """Creates a temporary SQLite database file path for setup_db.py to use."""
    # Using NamedTemporaryFile to get a filename that can be used by another process
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmpfile:
        db_path = tmpfile.name
    yield db_path
    os.remove(db_path) # Clean up

@pytest.fixture
def setup_db_env_vars(temp_sqlite_db_file):
    """Environment variables for running setup_db.py subprocess."""
    env = os.environ.copy()
    env['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{temp_sqlite_db_file}'
    # setup_db.py also looks for POSTGRES_ env vars if SQLALCHEMY_DATABASE_URI is not enough
    # or if it constructs its own URI. Let's ensure it uses the SQLite URI.
    # The script uses create_app, which respects FLASK_ENV for config.
    env['FLASK_APP'] = 'antisocialnet' # Important for create_app within setup_db.py
    env['FLASK_ENV'] = 'testing'   # To use TestConfig, which we want to use SQLALCHEMY_DATABASE_URI
                                   # However, TestConfig sets sqlite:///:memory:
                                   # We need setup_db.py to use our temp_sqlite_db_file.
                                   # The --config option in setup_db.py can override DB URI.
                                   # Or, we can rely on setup_db.py's direct use of SQLALCHEMY_DATABASE_URI from env.

    # Override specific DB components if setup_db.py tries to build from them
    # This is a bit of a hack; ideally, setup_db.py would solely rely on SQLALCHEMY_DATABASE_URI
    # if FLASK_ENV=testing and TestConfig is used.
    # The script's create_app call might get TestConfig, which has :memory:
    # The script then uses app.config.get('SQLALCHEMY_DATABASE_URI')
    # So, we must ensure the subprocess's create_app() call results in the temp_sqlite_db_file URI.
    # The easiest way is via a temporary YAML config file passed to --config.
    return env

def run_setup_db_script(args, env_vars, script_path="antisocialnet/setup_db.py"):
    """Helper to run the setup_db.py script as a subprocess."""
    command = ["python", script_path] + args
    # Ensure PYTHONPATH includes the project root so 'antisocialnet' can be imported by the script
    script_env = env_vars.copy()
    project_root = os.getcwd() # Assuming tests are run from project root
    if 'PYTHONPATH' in script_env:
        script_env['PYTHONPATH'] = f"{project_root}:{script_env['PYTHONPATH']}"
    else:
        script_env['PYTHONPATH'] = project_root

    # print(f"Running command: {' '.join(command)}") # For debugging
    # print(f"With env SQLALCHEMY_DATABASE_URI: {script_env.get('SQLALCHEMY_DATABASE_URI')}")
    # print(f"With env FLASK_APP: {script_env.get('FLASK_APP')}")
    # print(f"With env FLASK_ENV: {script_env.get('FLASK_ENV')}")

    result = subprocess.run(command, capture_output=True, text=True, env=script_env, cwd=project_root)
    # if result.returncode != 0:
    #     print("STDOUT:", result.stdout)
    #     print("STDERR:", result.stderr)
    return result

# To inspect the state of the temporary SQLite DB, we need a way to connect to it
# from within the test function after the subprocess has run.
@pytest.fixture
def temp_db_app_instance(temp_sqlite_db_file):
    """Provides a Flask app instance configured to use the temp SQLite DB file."""
    # Create a minimal app config for this specific purpose
    class TempDBTestConfig(TestConfig):
        SQLALCHEMY_DATABASE_URI = f'sqlite:///{temp_sqlite_db_file}'
        TESTING = True
        WTF_CSRF_ENABLED = False # Not relevant for DB inspection

    # Use yaml_config_override to set the specific database URI for this test app instance
    yaml_override = {
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{temp_sqlite_db_file}',
        'TESTING': True,
        'WTF_CSRF_ENABLED': False
    }
    temp_app = pytest.importorskip("antisocialnet").create_app(
        config_name='testing', # Start with the base testing config
        yaml_config_override=yaml_override
    )

    with temp_app.app_context():
        # main_app_db.init_app(temp_app) # db object is already initialized by create_app
        # Tables should be created if this app instance is used for DB operations.
        # If setup_db.py script creates them, this app instance just needs to connect.
        main_app_db.create_all() # Ensure tables exist for inspection by this app instance
        yield temp_app
        main_app_db.drop_all() # Clean up tables used by this inspection app instance


def test_setup_db_deletedb_and_create_admin(setup_db_env_vars, temp_sqlite_db_file, temp_db_app_instance):
    """Test --deletedb and non-interactive admin creation."""
    admin_email = "testadmin@example.com"
    admin_pass = "password123"
    admin_name = "Test Admin FullName"

    script_args = [
        "--deletedb",
        "--admin-user", admin_email,
        "--admin-pass", admin_pass,
        "--admin-fullname", admin_name,
        # Use a temporary config file to force the SQLite DB URI
        # This is more reliable than env vars if create_app in script loads TestConfig by default
    ]

    # Create a temporary YAML config to specify the database URI
    with tempfile.NamedTemporaryFile(mode='w', suffix=".yaml", delete=False) as tmp_yaml:
        yaml_config = {'SQLALCHEMY_DATABASE_URI': f'sqlite:///{temp_sqlite_db_file}'}
        yaml.dump(yaml_config, tmp_yaml)
        temp_yaml_path = tmp_yaml.name

    script_args.extend(["--config", temp_yaml_path])

    result = run_setup_db_script(script_args, setup_db_env_vars)
    os.remove(temp_yaml_path) # Clean up temp YAML

    assert result.returncode == 0, f"setup_db.py failed: {result.stderr}"

    # Now inspect the temp_sqlite_db_file using the temp_db_app_instance
    with temp_db_app_instance.app_context():
        admin_user = User.query.filter_by(username=admin_email).first() # User.username stores the email
        assert admin_user is not None
        assert admin_user.full_name == admin_name
        assert admin_user.is_admin
        assert admin_user.is_approved
        assert admin_user.is_active
        assert admin_user.check_password(admin_pass)

        # Check default site settings (setup_db.py initializes them)
        assert main_app_db.session.get(SiteSetting, 'site_title').get_value() == "Adwaita Web Demo" # Default from script
        assert main_app_db.session.get(SiteSetting, 'posts_per_page').get_value() == 10
        assert main_app_db.session.get(SiteSetting, 'allow_registrations').get_value() == True

def test_setup_db_skipuser(setup_db_env_vars, temp_sqlite_db_file, temp_db_app_instance):
    """Test --skipuser argument."""
    script_args = ["--skipuser"]
    with tempfile.NamedTemporaryFile(mode='w', suffix=".yaml", delete=False) as tmp_yaml:
        yaml_config = {'SQLALCHEMY_DATABASE_URI': f'sqlite:///{temp_sqlite_db_file}'}
        yaml.dump(yaml_config, tmp_yaml)
        temp_yaml_path = tmp_yaml.name
    script_args.extend(["--config", temp_yaml_path])

    result = run_setup_db_script(script_args, setup_db_env_vars)
    os.remove(temp_yaml_path)
    assert result.returncode == 0, f"setup_db.py failed: {result.stderr}"

    with temp_db_app_instance.app_context():
        # No users should have been created by the script in this mode
        # (unless YAML config also had users, which it doesn't here)
        assert User.query.count() == 0

def test_setup_db_yaml_user_creation(setup_db_env_vars, temp_sqlite_db_file, temp_db_app_instance):
    """Test creating users from YAML config."""
    yaml_users_data = {
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{temp_sqlite_db_file}',
        'USERS': [
            {'username': 'yamluser1@example.com', 'password': 'password1', 'full_name': 'YAML User One', 'is_admin': True},
            {'username': 'yamluser2@example.com', 'password': 'password2', 'full_name': 'YAML User Two', 'bio': 'Test bio'}
        ]
    }
    with tempfile.NamedTemporaryFile(mode='w', suffix=".yaml", delete=False) as tmp_yaml:
        yaml.dump(yaml_users_data, tmp_yaml)
        temp_yaml_path = tmp_yaml.name

    script_args = ["--config", temp_yaml_path] # --skipuser is implicit if USERS list is in YAML

    result = run_setup_db_script(script_args, setup_db_env_vars)
    os.remove(temp_yaml_path)
    assert result.returncode == 0, f"setup_db.py failed: {result.stderr}"

    with temp_db_app_instance.app_context():
        user1 = User.query.filter_by(username='yamluser1@example.com').first() # User.username stores the email
        assert user1 is not None
        assert user1.full_name == 'YAML User One'
        assert user1.is_admin
        assert user1.is_approved # Default for YAML users
        assert user1.is_active   # Default for YAML users

        user2 = User.query.filter_by(username='yamluser2@example.com').first() # User.username stores the email
        assert user2 is not None
        assert user2.full_name == 'YAML User Two'
        assert not user2.is_admin # Default is_admin is False
        assert user2.profile_info == 'Test bio' # Corrected attribute name

# Further tests could include:
# - YAML updating existing user
# - Precedence of YAML users over --admin-user args
# - Script behavior if PyYAML is not installed (prints error - needs mocking sys.modules)
# - Testing different database backends if setup_db.py has backend-specific logic (e.g. PostgreSQL drop schema)
#   This is harder as it requires running a live PostgreSQL instance for tests.
#   The current setup_db.py uses generic SQLAlchemy for most things but has PG-specific SQL for --deletedb.
#   Testing that specific part would require a PG test DB.
#   For now, focusing on SQLite compatible features.
