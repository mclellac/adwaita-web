#!/usr/bin/env python
# app-demo/setup_db.py
# This script handles the initial setup of the database,
# including table creation and initial user setup.

import os
import sys
import argparse
import getpass  # For hidden password input

# Adjust sys.path to allow imports from the app_demo package
# when running this script directly.
# This adds the parent directory of the script's directory (app-demo) to sys.path,
# which is the project root.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import importlib
import yaml # For loading config from YAML file

# Import create_app and necessary models/db instance
# The actual directory/package name is 'app-demo'
# We use importlib to load it because of the hyphen.
app_module = importlib.import_module("app-demo")
create_app = app_module.create_app
db = app_module.db
User = app_module.models.User
SiteSetting = app_module.models.SiteSetting # Import SiteSetting


def create_or_update_user(flask_app, username, password, full_name, profile_info=None,
                          is_admin=False, is_approved=True, is_active=True,
                          update_if_exists=True, interactive_password_update=False):
    """
    Creates a new user or updates an existing user's password and details.
    Requires an active application context.

    Args:
        flask_app: The Flask application instance.
        username (str): The username.
        password (str): The user's password.
        full_name (str): The user's full name.
        profile_info (str, optional): The user's bio/profile information.
        is_admin (bool): Whether the user should be an admin.
        is_approved (bool): Whether the user account is approved.
        is_active (bool): Whether the user account is active.
        update_if_exists (bool): If True and user exists, update their details.
        interactive_password_update (bool): If True and user exists, prompt interactively to update password.
                                            (Only used if update_if_exists is True)
    Returns:
        True if user was created/updated, False otherwise.
    """
    if not username or not password or not full_name:
        print("Error: Username, password, and full name are required to create or update a user.")
        return False

    with flask_app.app_context():
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            print(f"User '{username}' already exists.")
            if not update_if_exists:
                print(f"Skipping update for user '{username}' as update_if_exists is False.")
                return False

            if interactive_password_update:
                try:
                    update_choice = input(
                        f"Do you want to update the password for user '{username}'? (y/n): "
                    ).lower()
                    if update_choice == "y":
                        print(f"Updating password for user '{username}'.")
                        new_password = getpass.getpass("Enter new password: ")
                        if not new_password:
                            print("Password cannot be empty. Aborting password update.")
                            return False
                        new_password_confirm = getpass.getpass("Confirm new password: ")
                        if new_password != new_password_confirm:
                            print("Passwords do not match. Aborting password update.")
                            return False
                        existing_user.set_password(new_password)
                        # Update other details as well
                        existing_user.full_name = full_name
                        if profile_info is not None:
                            existing_user.profile_info = profile_info
                        existing_user.is_admin = is_admin
                        existing_user.is_approved = is_approved
                        existing_user.is_active = is_active
                        db.session.commit()
                        print(f"User '{username}' password and details updated interactively.")
                        return True
                    else:
                        print(f"Password for user '{username}' not updated interactively.")
                        # Optionally update other details even if password isn't
                        # For now, if password update is declined, we don't update other things.
                        return False
                except EOFError:
                    print("Skipping interactive password update for existing user in non-interactive environment.")
                    return False
            else: # Non-interactive update
                print(f"Updating password and details for user '{username}' non-interactively.")
                existing_user.set_password(password)
                existing_user.full_name = full_name
                if profile_info is not None:
                    existing_user.profile_info = profile_info
                existing_user.is_admin = is_admin
                existing_user.is_approved = is_approved
                existing_user.is_active = is_active
                db.session.commit()
                print(f"User '{username}' updated non-interactively.")
                return True
        else:
            # Create new user
            print(f"Creating new user: '{username}' with full name '{full_name}'.")
            new_user = User(
                username=username,
                full_name=full_name,
                profile_info=profile_info,
                is_admin=is_admin,
                is_approved=is_approved,
                is_active=is_active
            )
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            print(f"User '{username}' created successfully. Admin: {is_admin}, Approved: {is_approved}, Active: {is_active}.")

            # Special handling for the very first admin user created non-interactively by CLI args
            # to set initial site settings. This is a bit of a kludge.
            # We assume if is_admin is True and interactive_password_update is False, it MIGHT be this case.
            # A better way would be a specific flag or ensuring this only happens once.
            script_args = flask_app.config.get('SETUP_DB_SCRIPT_ARGS')
            is_cli_admin_creation = script_args and script_args.admin_user == username and not interactive_password_update

            if is_admin and is_cli_admin_creation:
                 # Check if this is the only admin or first user to set defaults
                if User.query.count() == 1 and User.query.filter_by(is_admin=True).count() == 1:
                    print(f"DEBUG: Setting initial site settings as '{username}' is the first admin user.")
                    SiteSetting.set('site_title', 'Adwaita Social Demo', 'string')
                    SiteSetting.set('posts_per_page', 10, 'int')
                    SiteSetting.set('allow_registrations', True, 'bool')
                    print(f"DEBUG: Initial site settings set.")
            return True

def delete_database_tables(flask_app, script_args):
    """
    Drops all known tables from the database.
    Handles interactive confirmation or non-interactive deletion based on script_args.
    Requires an active application context.
    Returns True if deletion occurred, False otherwise.
    """
    is_non_interactive_delete = script_args.deletedb and script_args.admin_user and script_args.admin_pass

    # Import text for raw SQL
    from sqlalchemy import text

    if is_non_interactive_delete:
        print("Non-interactive mode: Deleting all database tables as --deletedb is present with admin creation flags.")
        with flask_app.app_context():
            print("Dropping and recreating public schema (CASCADE)...")
            db.session.execute(text("DROP SCHEMA public CASCADE;"))
            db.session.execute(text("CREATE SCHEMA public;"))
            # Depending on the DB user's privileges, might need to grant usage on the new schema
            # For simplicity, assuming the user has rights to create tables in the new public schema.
            # db.session.execute(text(f"GRANT ALL ON SCHEMA public TO {flask_app.config.get('DB_USER', 'postgres')};"))
            db.session.commit()
        print("Public schema dropped and recreated. All tables deleted non-interactively.")
        return True
    elif script_args.deletedb: # Interactive deletion
        try:
            confirm = input("Are you sure you want to delete all database tables (by dropping and recreating the public schema)? This cannot be undone. (yes/no): ").lower()
            if confirm == 'yes':
                print("Deleting database tables (dropping and recreating public schema)...")
                with flask_app.app_context():
                    db.session.execute(text("DROP SCHEMA public CASCADE;"))
                    db.session.execute(text("CREATE SCHEMA public;"))
                    # db.session.execute(text(f"GRANT ALL ON SCHEMA public TO {flask_app.config.get('DB_USER', 'postgres')};"))
                    db.session.commit()
                print("Public schema dropped and recreated. All tables deleted.")
                return True
            else:
                print("Table deletion cancelled.")
                return False
        except EOFError:
            print("Non-interactive mode (--deletedb without admin args): Cannot confirm table deletion. Aborting.")
            return False
    return False # No deletion was triggered or completed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage the application database.")
    parser.add_argument(
        '--deletedb',
        action='store_true',
        help='Delete all database tables. Warning: This is destructive and requires confirmation.'
    )
    parser.add_argument(
        '--skipuser',
        action='store_true',
        help='Skip initial user setup/update.'
    )
    parser.add_argument('--admin-user', help='Set initial admin username non-interactively.')
    parser.add_argument('--admin-pass', help='Set initial admin password non-interactively.')
    # --admin-bio is less relevant now full_name is mandatory. Let's use admin-user for full_name if not specified.
    # For more control, a dedicated --admin-fullname could be added.
    # For now, will default full_name to admin_user for non-interactive.
    parser.add_argument('--admin-fullname', help='Set initial admin display name (full_name) non-interactively (optional, defaults to admin-user).')
    parser.add_argument('--admin-bio', help='Set initial admin bio non-interactively (optional).')
    parser.add_argument('--config', help='Path to a YAML configuration file to override default settings.')

    # --skiptables is implicitly handled: if --deletedb is not followed by explicit creation, tables remain deleted.
    # The create_all() call below will ensure tables are present unless deleted and not recreated.

    args = parser.parse_args()

    # Validate non-interactive admin creation args
    if (args.admin_user and not args.admin_pass) or (not args.admin_user and args.admin_pass):
        parser.error("--admin-user and --admin-pass must be used together.")

    print("Starting database setup...")

    # Instantiate the app using the factory
    print("DEBUG: About to call create_app()")
    app = create_app() # This loads default/env configurations
    print("DEBUG: create_app() returned")

    # Override config with YAML file if provided
    if args.config:
        print(f"DEBUG: --config flag provided. Attempting to load config from {args.config}")
        try:
            with open(args.config, 'r') as f:
                yaml_config = yaml.safe_load(f)
            if yaml_config:
                for key, value in yaml_config.items():
                    app.config[key.upper()] = value # Flask config keys are typically uppercase
                    print(f"DEBUG: Overriding config: {key.upper()} = {value}")
                print(f"Successfully loaded and applied configuration from {args.config}")
            else:
                print(f"Warning: Config file {args.config} is empty or not valid YAML.")
        except FileNotFoundError:
            print(f"Error: Config file {args.config} not found. Continuing with default/env config.")
        except yaml.YAMLError as e:
            print(f"Error parsing YAML config file {args.config}: {e}. Continuing with default/env config.")
        except Exception as e:
            print(f"An unexpected error occurred while loading config from {args.config}: {e}. Continuing with default/env config.")

    app.config['SETUP_DB_SCRIPT_ARGS'] = args # Pass script args to app config
    print(f"DEBUG: Script args set in app.config: {args}")

    if args.deletedb:
        print("DEBUG: --deletedb flag is present. Calling delete_database_tables()")
        delete_database_tables(app, args)
        print("DEBUG: delete_database_tables() returned")


    # Always ensure tables exist by this point, creating them if necessary.
    # This will create tables if they don't exist, or do nothing if they do.
    # If --deletedb was used and tables were dropped, this will recreate them.
    print("DEBUG: About to enter app_context for db.create_all()")
    with app.app_context():
        print("DEBUG: Entered app_context. Calling db.create_all()...")
        db.create_all()
        print("DEBUG: db.create_all() returned.")
    print("DEBUG: Exited app_context for db.create_all()")

    # Initialize default site settings if they don't exist
    # This is done here so that if the first admin user is created via YAML,
    # these settings are already in place.
    with app.app_context():
        print("DEBUG: Checking/Initializing default site settings (if not set by first admin creation)...")
        if SiteSetting.query.filter_by(key='site_title').first() is None:
            SiteSetting.set('site_title', 'Adwaita Social Demo', 'string')
            print("DEBUG: Default 'site_title' set.")
        if SiteSetting.query.filter_by(key='posts_per_page').first() is None:
            SiteSetting.set('posts_per_page', 10, 'int')
            print("DEBUG: Default 'posts_per_page' set.")
        if SiteSetting.query.filter_by(key='allow_registrations').first() is None:
            SiteSetting.set('allow_registrations', True, 'bool')
            print("DEBUG: Default 'allow_registrations' set to True as it was missing.")
        # db.session.commit() # SiteSetting.set commits itself

    users_processed_from_yaml = False
    if not args.skipuser:
        yaml_users = app.config.get('USERS')
        if isinstance(yaml_users, list) and yaml_users:
            print(f"\nProcessing {len(yaml_users)} user(s) from configuration (YAML)...")
            for user_data in yaml_users:
                username = user_data.get('username')
                password = user_data.get('password')
                full_name = user_data.get('full_name')
                profile_info = user_data.get('bio') # Match example: bio
                is_admin = user_data.get('is_admin', False)
                # Default is_approved and is_active to True for YAML users, allow override
                is_approved = user_data.get('is_approved', True)
                is_active = user_data.get('is_active', True)

                if not username or not password or not full_name:
                    print(f"Skipping user due to missing username, password, or full_name: {user_data}")
                    continue

                print(f"Processing user from YAML: {username}")
                create_or_update_user(
                    flask_app=app,
                    username=username,
                    password=password,
                    full_name=full_name,
                    profile_info=profile_info,
                    is_admin=is_admin,
                    is_approved=is_approved,
                    is_active=is_active,
                    update_if_exists=True, # Default to update if user exists
                    interactive_password_update=False # Never interactive for YAML users
                )
            users_processed_from_yaml = True
            print("Finished processing users from YAML configuration.")
        else:
            print("DEBUG: No 'USERS' list found in app.config or list is empty.")

        # Fallback to CLI args or interactive mode if not skipped and not processed from YAML
        if not users_processed_from_yaml:
            if args.admin_user and args.admin_pass:
                print(f"\nCreating/updating admin user '{args.admin_user}' from command-line arguments...")
                create_or_update_user(
                    flask_app=app,
                    username=args.admin_user,
                    password=args.admin_pass,
                    full_name=args.admin_fullname if args.admin_fullname else args.admin_user,
                    profile_info=args.admin_bio,
                    is_admin=True, # CLI admin is always admin
                    is_approved=True,
                    is_active=True,
                    update_if_exists=True,
                    interactive_password_update=False # Non-interactive for CLI args
                )
            else:
                # Interactive mode for a single admin user
                print("\nStarting interactive initial user setup...")
                default_username = "admin"
                try:
                    username = input(f"Enter username for the initial user (default: {default_username}): ").strip() or default_username
                    password = getpass.getpass("Enter password: ")
                    if not password:
                        print("Password cannot be empty. Aborting interactive user creation.")
                    else:
                        password_confirm = getpass.getpass("Confirm password: ")
                        if password != password_confirm:
                            print("Passwords do not match. Aborting interactive user creation.")
                        else:
                            full_name = ""
                            while not full_name:
                                full_name = input(f"Enter Display Name for '{username}': ").strip()
                                if not full_name:
                                    print("Display Name cannot be empty.")
                            profile_info = input(f"Enter profile information for '{username}' (optional, press Enter to skip): ").strip() or None

                            create_or_update_user(
                                flask_app=app,
                                username=username,
                                password=password,
                                full_name=full_name,
                                profile_info=profile_info,
                                is_admin=True, # Interactive setup creates an admin
                                is_approved=True,
                                is_active=True,
                                update_if_exists=True, # Allow updating if user exists
                                interactive_password_update=True # Allow interactive password prompt if user exists
                            )
                except EOFError:
                    print("EOFError during interactive setup. Cannot create user without inputs.")
                except KeyboardInterrupt:
                    print("\nInteractive user setup aborted by user.")
    else:
        print("\nSkipping user setup as per --skipuser flag.")

    print("\nDatabase setup process complete.")
