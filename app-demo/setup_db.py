# app-demo/setup_db.py
# This script handles the initial setup of the database,
# including table creation and initial user setup.

import getpass # For hidden password input

# Assuming this script is run from the 'app-demo' directory or that 'app-demo' is in PYTHONPATH
# so that 'app' (app-demo/app.py) can be imported directly.
from app import app, db, init_extensions, User

def create_tables(flask_app):
    """
    Creates database tables if they don't already exist.
    Requires an active application context.
    """
    with flask_app.app_context():
        print("Initializing database and creating tables if they don't exist...")
        # db.create_all() will check for table existence before creating
        db.create_all()
        print("Database tables checked/created.")

def create_initial_user(flask_app):
    """
    Handles the creation or password update of an initial (admin) user.
    Requires an active application context.
    """
    print("\nStarting initial user setup...")

    default_username = "admin"
    try:
        username_input = input(f"Enter username for the initial user (default: {default_username}): ")
        username = username_input if username_input else default_username
    except EOFError: # Handle non-interactive environment
        print(f"No input provided, using default username: {default_username}")
        username = default_username

    with flask_app.app_context():
        existing_user = User.query.filter_by(username=username).first()

        if existing_user:
            print(f"User '{username}' already exists.")
            try:
                update_choice = input("Do you want to update the password for this user? (y/n): ").lower()
                if update_choice == 'y':
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
            except EOFError: # Handle non-interactive environment
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

            profile_info_input = input(f"Enter profile information for '{username}' (optional, press Enter to skip): ")
            profile_info = profile_info_input if profile_info_input else None

        except EOFError: # Handle non-interactive environment
            print("Cannot create user in non-interactive mode without password. Please run interactively.")
            return

        new_user = User(username=username, profile_info=profile_info)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        print(f"User '{username}' created successfully.")


if __name__ == "__main__":
    print("Starting database setup...")

    # Initialize Flask extensions (like SQLAlchemy and Flask-Login) with the app.
    init_extensions(app)

    # Create tables
    create_tables(app)

    # Create or update initial user
    create_initial_user(app)

    print("\nDatabase setup process complete.")
