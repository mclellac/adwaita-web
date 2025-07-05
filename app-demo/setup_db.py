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

# Import create_app and necessary models/db instance
# The actual directory/package name is 'app-demo'
# We use importlib to load it because of the hyphen.
app_module = importlib.import_module("app-demo")
create_app = app_module.create_app
db = app_module.db
User = app_module.models.User
SiteSetting = app_module.models.SiteSetting # Import SiteSetting


def create_initial_user(flask_app):
    """
    Handles the creation or password update of an initial (admin) user.
    Requires an active application context.
    """
    print("\nStarting initial user setup...")
    script_args = flask_app.config.get('SETUP_DB_SCRIPT_ARGS') # Get args passed to the script

    is_interactive = not (script_args and script_args.admin_user and script_args.admin_pass)
    username = ""
    password = ""
    profile_info = None

    if not is_interactive:
        username = script_args.admin_user
        password = script_args.admin_pass
        profile_info = script_args.admin_bio
        print(f"Non-interactive mode: Creating/updating admin user '{username}'.")
    else:
        default_username = "admin"
        try:
            username_input = input(
                f"Enter username for the initial user (default: {default_username}): "
            )
            username = username_input if username_input else default_username
        except EOFError:  # Handle non-interactive environment
            print(f"No input provided, using default username: {default_username}")
            username = default_username

    # This function is called with app, and establishes its own context for DB operations
    with flask_app.app_context():
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            print(f"User '{username}' already exists.")
            if not is_interactive: # Non-interactive: always update password if provided
                print(f"Updating password for user '{username}'.")
                existing_user.set_password(password)
                if profile_info is not None: # Update bio if provided
                    existing_user.profile_info = profile_info
                db.session.commit()
                print(f"User '{username}' updated non-interactively.")
            else: # Interactive: ask to update
                try:
                    update_choice = input(
                        "Do you want to update the password for this user? (y/n): "
                    ).lower()
                    if update_choice == "y":
                        print(f"Updating password for user '{username}'.")
                        new_password = getpass.getpass("Enter new password: ")
                        if not new_password:
                            print("Password cannot be empty. Aborting password update.")
                            return
                        new_password_confirm = getpass.getpass("Confirm new password: ")
                        if new_password != new_password_confirm:
                            print("Passwords do not match. Aborting password update.")
                            return
                        existing_user.set_password(new_password)
                        db.session.commit()
                        print(f"Password for user '{username}' updated successfully.")
                    else:
                        print(f"Password for user '{username}' not updated.")
                except EOFError:
                    print("Skipping password update for existing user in non-interactive mode.")
            return

        # Create new user
        print(f"Creating new user: '{username}'")
        if is_interactive:
            try:
                password = getpass.getpass("Enter password: ")
                if not password:
                    print("Password cannot be empty. Aborting user creation.")
                    return
                password_confirm = getpass.getpass("Confirm password: ")
                if password != password_confirm:
                    print("Passwords do not match. Aborting user creation.")
                    return
                profile_info_input = input(
                    f"Enter profile information for '{username}' (optional, press Enter to skip): "
                )
                profile_info = profile_info_input if profile_info_input else None
            except EOFError:
                print("Cannot create user interactively without password. Please run interactively or use args.")
                return

        # For both interactive and non-interactive new user creation
        new_user = User(
            username=username,
            profile_info=profile_info,
            is_admin=True,  # Initial user is admin
            is_approved=True, # Admin user is auto-approved
            is_active=True    # Admin user is auto-active
        )
        new_user.set_password(password)
        db.session.add(new_user)

        # Set default site settings on initial user creation if non-interactive
        if not is_interactive:
            print(f"DEBUG: Setting initial site settings for non-interactive setup.")
            SiteSetting.set('site_title', 'Adwaita Social Demo', 'string')
            SiteSetting.set('posts_per_page', 10, 'int')
            SiteSetting.set('allow_registrations', True, 'bool')
            print(f"DEBUG: allow_registrations set to True.")

        db.session.commit()
        print(f"User '{username}' created successfully and set as admin, approved, and active.")


def delete_database_tables(flask_app, script_args):
    """
    Drops all known tables from the database.
    Handles interactive confirmation or non-interactive deletion based on script_args.
    Requires an active application context.
    Returns True if deletion occurred, False otherwise.
    """
    is_non_interactive_delete = script_args.deletedb and script_args.admin_user and script_args.admin_pass

    if is_non_interactive_delete:
        print("Non-interactive mode: Deleting all database tables as --deletedb is present with admin creation flags.")
        with flask_app.app_context():
            db.drop_all()
        print("All tables deleted non-interactively.")
        return True
    elif script_args.deletedb: # Interactive deletion
        try:
            confirm = input("Are you sure you want to delete all database tables? This cannot be undone. (yes/no): ").lower()
            if confirm == 'yes':
                print("Deleting database tables...")
                with flask_app.app_context():
                    db.drop_all()
                print("All tables deleted.")
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
    parser.add_argument('--admin-bio', help='Set initial admin bio non-interactively (optional).')

    # --skiptables is implicitly handled: if --deletedb is not followed by explicit creation, tables remain deleted.
    # The create_all() call below will ensure tables are present unless deleted and not recreated.

    args = parser.parse_args()

    # Validate non-interactive admin creation args
    if (args.admin_user and not args.admin_pass) or (not args.admin_user and args.admin_pass):
        parser.error("--admin-user and --admin-pass must be used together.")

    print("Starting database setup...")

    # Instantiate the app using the factory
    print("DEBUG: About to call create_app()")
    app = create_app()
    print("DEBUG: create_app() returned")
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

    if not args.skipuser:
        print("DEBUG: --skipuser is false. Calling create_initial_user()")
        create_initial_user(app) # This function handles its own app context and gets args from app.config
        print("DEBUG: create_initial_user() returned")
    else:
        print("Skipping initial user setup as per --skipuser flag.")

    print("\nDatabase setup process complete.")
