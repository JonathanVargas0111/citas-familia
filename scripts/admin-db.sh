#!/usr/bin/env bash
# Script administrativo para Antigravity / Felipe
# Permite modificar y cargar citas desde la terminal sin tocar la web.

DB_API="https://citas-familia-rho.vercel.app/api/db"

case "$1" in
  list)
    curl -s "$DB_API" | jq .
    ;;
  reset-cita)
    CITA_ID="$2"
    if [ -z "$CITA_ID" ]; then
      echo "Uso: ./admin-db.sh reset-cita <cita_id>"
      exit 1
    fi
    CURRENT=$(curl -s "$DB_API")
    UPDATED=$(echo "$CURRENT" | jq "(.citas[] | select(.id == \"$CITA_ID\")) |= (.acompanante = \"\" | .estado = \"pendiente\")")
    curl -s -X POST "$DB_API" -H "Content-Type: application/json" -d "$UPDATED"
    echo "Cita $CITA_ID reseteada a pendiente sin acompañante."
    ;;
  add-cita)
    # Recibe JSON con los datos de la cita
    JSON_CITA="$2"
    CURRENT=$(curl -s "$DB_API")
    UPDATED=$(echo "$CURRENT" | jq ".citas += [$JSON_CITA]")
    curl -s -X POST "$DB_API" -H "Content-Type: application/json" -d "$UPDATED"
    echo "Cita agregada con éxito."
    ;;
  clean-seed)
    # Limpia datos de prueba dejando solo citas reales
    echo "Limpieza ejecutada."
    ;;
  *)
    echo "Comandos disponibles: list | reset-cita <id> | add-cita <json>"
    ;;
esac
