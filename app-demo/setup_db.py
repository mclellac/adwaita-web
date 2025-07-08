#!/usr/bin/env python
# app-demo/setup_db.py
# This script handles the initial setup of the database,
# including table creation and initial user setup.

import argparse
import getpass
import importlib
import os
import re
import sys

import yaml
from sqlalchemy import create_engine, text
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError, ProgrammingError

# Adjust sys.path to allow imports from the app_demo package
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import create_app and necessary models/db instance
app_module = importlib.import_module("app-demo")
create_app = app_module.create_app
db = app_module.db
User = app_module.models.User
SiteSetting = app_module.models.SiteSetting


def is_valid_email(email):
    """A simple regex check for email format validation."""
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)


def _create_or_update_user(username, password, full_name, bio, is_admin=False):
    """Creates a new user or updates an existing user's password."""
    if not is_valid_email(username):
        print(f"Error: Invalid email format for username '{username}'. Skipping.")
        return

    existing_user = User.query.filter_by(username=username).first()

    if existing_user:
        print(f"User '{username}' already exists. Updating password and info.")
        existing_user.set_password(password)
        existing_user.full_name = full_name
        existing_user.profile_info = bio
    else:
        print(f"Creating new user: '{username}'")
        new_user = User(
            username=username,
            full_name=full_name,
            profile_info=bio,
            is_admin=is_admin,
            is_approved=True,
            is_active=True,
        )
        new_user.set_password(password)
        db.session.add(new_user)
    db.session.commit()
    print(f"User '{username}' processed successfully.")


def _get_interactive_user_input():
    """Handles the interactive prompts for creating a single admin user."""
    default_email = "admin@example.com"
    username = ""
    while not username:
        email_input = input(
            f"Enter email address for the initial admin user (default: {default_email}): "
        ).strip()
        username = email_input or default_email
        if not is_valid_email(username):
            print("Invalid email format. Please try again.")
            username = ""

    password = getpass.getpass("Enter password: ")
    if not password:
        print("Password cannot be empty. Aborting.")
        return None
    password_confirm = getpass.getpass("Confirm password: ")
    if password != password_confirm:
        print("Passwords do not match. Aborting.")
        return None

    full_name = ""
    while not full_name:
        full_name = input(f"Enter Display Name for '{username}': ").strip()
        if not full_name:
            print("Display Name cannot be empty.")

    bio = input(f"Enter profile information for '{username}' (optional): ").strip()

    return {
        "username": username,
        "password": password,
        "full_name": full_name,
        "bio": bio,
        "is_admin": True,
    }


def process_config_users(users_config):
    """Processes a list of users from the configuration file."""
    print("\nProcessing users from configuration file...")
    if not users_config:
        print("No users found in configuration.")
        return

    for user_data in users_config:
        _create_or_update_user(
            username=user_data["username"],
            password=user_data["password"],
            full_name=user_data["full_name"],
            bio=user_data.get("bio", ""),
            is_admin=user_data.get("is_admin", False),
        )


def _execute_sql_on_maintenance_db(db_uri_string, sql_command):
    """Connects to the default 'postgres' database to run a command."""
    try:
        url = make_url(db_uri_string)
        maintenance_db_url = url._replace(database="postgres")
        engine = create_engine(maintenance_db_url)
        with engine.connect() as connection:
            connection = connection.execution_options(isolation_level="AUTOCOMMIT")
            connection.execute(text(sql_command))
        print(f"Successfully executed: {sql_command}")
    except ProgrammingError as e:
        print(f"Info: {e.orig}")
    except OperationalError as e:
        print(f"Error connecting to the maintenance database: {e}")
        print("Please ensure the PostgreSQL server is running and accessible.")
        sys.exit(1)


def delete_database(db_uri):
    """Drops the target database."""
    url = make_url(db_uri)
    db_name = url.database
    print(f"Attempting to drop database '{db_name}'...")
    _execute_sql_on_maintenance_db(db_uri, f'DROP DATABASE IF EXISTS "{db_name}"')


def ensure_database_exists(db_uri):
    """Creates the target database if it does not already exist."""
    url = make_url(db_uri)
    db_name = url.database
    print(f"Ensuring database '{db_name}' exists...")
    _execute_sql_on_maintenance_db(db_uri, f'CREATE DATABASE "{db_name}"')


def main(args):
    """Main script execution logic."""
    config = None
    if args.config:
        try:
            with open(args.config, "r") as f:
                config = yaml.safe_load(f)
            print(f"Loaded configuration from '{args.config}'.")
        except FileNotFoundError:
            print(
                f"Warning: Config file '{args.config}' not found. Proceeding with interactive setup."
            )
        except yaml.YAMLError as e:
            print(f"Error parsing YAML file: {e}")
            sys.exit(1)

    # Use the URI from the config file, or None if no config is provided.
    # This will let create_app use its own default if the URI isn't in the config.
    db_uri_from_config = config.get("database", {}).get("uri") if config else None

    # Create a single app instance that will be used for all operations.
    app = create_app(db_uri_from_config)
    db_uri = app.config["SQLALCHEMY_DATABASE_URI"]

    if args.deletedb:
        delete_database(db_uri)

    ensure_database_exists(db_uri)

    # Use the app's context for all database operations.
    with app.app_context():
        print("Initializing database tables...")
        db.create_all()
        print("Tables created successfully.")

        if config and "site_settings" in config:
            print("Applying site settings from configuration file...")
            for key, value_info in config["site_settings"].items():
                SiteSetting.set(key, value_info["value"], value_info["type"])
        else:
            if SiteSetting.query.first() is None:
                print("Setting default site settings...")
                SiteSetting.set("site_title", "Adwaita Social Demo", "string")
                SiteSetting.set("posts_per_page", 10, "int")
                SiteSetting.set("allow_registrations", True, "bool")

        if not args.skipuser:
            if config and "users" in config:
                process_config_users(config["users"])
            else:
                user_data = _get_interactive_user_input()
                if user_data:
                    _create_or_update_user(**user_data)
        else:
            print("Skipping user setup as per --skipuser flag.")

    print("\nDatabase setup process complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage the application database.")
    parser.add_argument(
        "--config", help="Path to a YAML configuration file for non-interactive setup."
    )
    parser.add_argument(
        "--deletedb",
        action="store_true",
        help="Delete the database file before setup. Warning: This is destructive.",
    )
    parser.add_argument("--skipuser", action="store_true", help="Skip initial user setup/update.")

    cli_args = parser.parse_args()
    main(cli_args)
