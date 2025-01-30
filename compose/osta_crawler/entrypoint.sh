#!/bin/sh

if [ -d "/home/node/app/node_modules" ]; then
  rm -rf ./node_modules
  echo "Deleted existing /home/node/app/node_modules"
else
  echo "No existing /home/node/app/node_modules to delete"
fi

for item in /home/node/app/package.json /home/node/app/package-lock.json /home/node/app/node_modules; do
  if [ -e "$item" ]; then
    mv -f "$item" /home/node/app/src
    echo "Moved $item to current directory."
  else
    echo "$item does not exist."
  fi
done


if [ "$DATABASE_ENGINE" = "postgresql" ]
then
    echo "Waiting for PostgreSQL..."

    while ! nc -z $DATABASE_HOST $DATABASE_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

exec "$@"
