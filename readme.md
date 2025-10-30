# Inicio rápido (Windows)

Base de datos y migraciones: ya están en el repo, no hagas migraciones. Solo crea el entorno, instala dependencias, levanta el backend y sirve el frontend.

## 1) Backend (Django)

Ejecuta esto desde la raíz del repositorio:

```pwsh
cd backend-examen-ingles
python3 -m venv .venv
. .venv/Scripts/Activate.ps1
python -m pip install -r requirements.txt
python manage.py runserver
```

El backend quedará en http://localhost:8000

## 2) Frontend (estático)

En otra terminal, desde la raíz del repositorio:

```pwsh
cd simulacionProyectoFrontend
python3 -m http.server 5500
```

Abre http://localhost:5500 en el navegador.

Notas breves:

- Los comandos están pensados para PowerShell. Si `python3` no está disponible, usa `python` o `py -3` en su lugar.
- El frontend espera que el backend esté en http://localhost:8000.
