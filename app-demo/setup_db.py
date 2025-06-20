#!/usr/bin/env python
# app-demo/setup_db.py
# This script handles the initial setup of the database,
# including table creation and initial user setup.

import argparse
import getpass  # For hidden password input

# Import create_app and necessary models/db instance
from app import create_app, db, User # Post model not used in this script currently

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

    # This function is called with app, and establishes its own context for DB operations
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
            except EOFError:
                print("Skipping password update for existing user in non-interactive mode.")
            return

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

            # Removed profile_photo_url input as it's not handled robustly here
            # and can be updated via the profile edit page.
            # For simplicity, it's not part of initial user creation via CLI.

        except EOFError:
            print(
                "Cannot create user in non-interactive mode without password. Please run interactively."
            )
            return

        new_user = User(username=username, profile_info=profile_info) # Removed profile_photo_url
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        print(f"User '{username}' created successfully.")


def delete_tables_interactive(flask_app):
    """
    Drops all known tables from the database after user confirmation.
    Requires an active application context.
    """
    with flask_app.app_context():
        try:
            confirm = input("Are you sure you want to delete all database tables? This cannot be undone. (yes/no): ").lower()
        except EOFError:
            print("Non-interactive mode: Cannot confirm table deletion. Aborting.")
            return False # Indicate deletion was aborted

        if confirm == 'yes':
            print("Deleting database tables...")
            db.drop_all()
            print("All tables deleted.")
            return True # Indicate deletion happened
        else:
            print("Table deletion cancelled.")
            return False # Indicate deletion was cancelled

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
    # --skiptables is implicitly handled: if --deletedb is not followed by explicit creation, tables remain deleted.
    # The create_all() call below will ensure tables are present unless deleted and not recreated.

    args = parser.parse_args()

    print("Starting database setup...")

    # Instantiate the app using the factory
    app = create_app()

    tables_deleted_and_not_recreated = False
    if args.deletedb:
        if delete_tables_interactive(app): # This function now returns True if deletion occurred
            # If tables were deleted, we might not want to immediately recreate them
            # if the user's intention was purely to delete.
            # However, for typical setup, recreation is desired.
            # The example logic implies recreation unless specifically skipped.
            # For simplicity here, we'll let the subsequent create_all handle it.
            print("Tables were targeted for deletion.")
        else:
            # Deletion was cancelled or failed (e.g. non-interactive)
            # We should probably not proceed to user creation if DB state is uncertain.
            print("Table deletion process finished or was aborted. Review messages above.")


    # Always ensure tables exist by this point, creating them if necessary.
    # This will create tables if they don't exist, or do nothing if they do.
    # If --deletedb was used and tables were dropped, this will recreate them.
    with app.app_context():
        print("Ensuring database tables exist (creating if necessary)...")
        db.create_all()
        print("Database tables ensured/created.")

    if not args.skipuser:
        create_initial_user(app) # This function handles its own app context
    else:
        print("Skipping initial user setup as per --skipuser flag.")

    print("\nDatabase setup process complete.")
