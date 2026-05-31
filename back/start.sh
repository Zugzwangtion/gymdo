#!/usr/bin/env bash
set -o errexit

python manage.py migrate
python manage.py ensure_admin
gunicorn gymdo_backend.wsgi:application
