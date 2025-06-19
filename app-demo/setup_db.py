#!/usr/bin/env python
# app-demo/setup_db.py
# This script handles the initial setup of the database,
# including table creation and initial user setup.

import argparse
import getpass  # For hidden password input

# Assuming this script is run from the 'app-demo' directory or that 'app-demo' is in PYTHONPATH
# so that 'app' (app-demo/app.py) can be imported directly.
from app import app, db, init_extensions, User


def create_initial_user(flask_app):
    """
    Handles the creation or password update of an initial (admin) user.
    Requires an active application context.
    """
    print("\nStarting initial user setup...")

    default_username = "admin"
    try:
        username_input = input(
            f"Enter username for the initial user (default: {default_username}): "
        )
        username = username_input if username_input else default_username
    except EOFError:  # Handle non-interactive environment
        print(f"No input provided, using default username: {default_username}")
        username = default_username

    with flask_app.app_context():
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            print(f"User '{username}' already exists.")
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
            except EOFError:  # Handle non-interactive environment
                print("Skipping password update for existing user in non-interactive mode.")
            return

        # Create new user
        print(f"Creating new user: '{username}'")
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

            profile_photo_url_input = input(
                f"Enter profile photo URL for '{username}' (optional, press Enter to skip): "
            )
            profile_photo_url = profile_photo_url_input if profile_photo_url_input else None

        except EOFError:  # Handle non-interactive environment
            print(
                "Cannot create user in non-interactive mode without password. Please run interactively."
            )
            return

        new_user = User(username=username, profile_info=profile_info, profile_photo_url=profile_photo_url)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        print(f"User '{username}' created successfully.")


def delete_tables(flask_app):
    """
    Drops all known tables from the database.
    Requires an active application context and user confirmation.
    """
    with flask_app.app_context():
        confirm = input("Are you sure you want to delete all database tables? This cannot be undone. (yes/no): ").lower()
        if confirm == 'yes':
            print("Deleting database tables...")
            db.drop_all() # Drops all tables defined in SQLAlchemy models
            print("All tables deleted.")
            # Optionally, recreate them immediately
            # print("Re-creating tables...")
            # db.create_all()
            # print("Tables re-created.")
        else:
            print("Table deletion cancelled.")


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
    parser.add_argument(
        '--skiptables', # This flag now means "skip re-creating tables after deleting them"
        action='store_true',
        help='If --deletedb is used, skip re-creating tables afterwards.'
    )
    args = parser.parse_args()

    print("Starting database setup...")

    # Initialize Flask extensions. This will also call db.create_all()
    # ensuring tables exist if they didn't.
    init_extensions(app)

    if args.deletedb:
        delete_tables(app) # Asks for confirmation, then drops tables
        if not args.skiptables:
            print("Re-creating tables after deletion...")
            with app.app_context():
                db.create_all()
            print("Tables re-created.")
        else:
            print("Tables deleted. Not re-creating as per --skiptables.")

    if not args.skipuser:
        # This function needs an app_context to run queries and commit
        # create_initial_user already establishes its own app context.
        create_initial_user(app)
    else:
        print("Skipping initial user setup as per --skipuser flag.")

    print("\nDatabase setup process complete.")
