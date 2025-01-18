#!/bin/bash

if [ "$DATABASE_ENGINE" = "postgresql" ]
then
    echo "Waiting for PostgreSQL..."

    while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

exec "$@"
