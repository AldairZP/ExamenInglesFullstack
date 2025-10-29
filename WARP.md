# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Arquitectura y estructura (alto nivel)

- Monorepo con dos partes principales:
  - backend-examen-ingles (Django 5)
    - App examen con modelos: Usuario (custom user), Pregunta, Respuesta, Examen, ExamenPregunta y enums TipoExamen/Nivel.
    - Autenticación por sesión (login/logout) con protección CSRF; CORS habilitado para http://localhost:5500.
    - Base de datos SQLite (archivo db.sqlite3). SECRET_KEY se carga desde backend-examen-ingles/.env.
    - Enrutamiento: project/urls.py incluye examen/urls.py en la raíz con endpoints: csrf/, register/, login/, logout/, get_exam_questions/, get_questions_answers/ (PATCH), update_exam_answer/ (PATCH), user_info/, user_exams/, exam_info/, available_exams/, exam_result/, exam_history/.
    - Flujo de examen: POST get_exam_questions crea un Examen y selecciona preguntas aleatorias; PATCH get_questions_answers inicia tiempo por pregunta y entrega opciones; PATCH update_exam_answer valida tiempo (< 65s), almacena respuesta y acumula calificación (5.0 prueba, 2.5 final); al terminar, asigna nivel según calificación; exam_result y exam_history devuelven resumen e historial detallado.
    - Datos de ejemplo: scripts SQL en backend-examen-ingles/data/{questions.sql,answers.sql} para poblar Pregunta/Respuesta (tablas examen_pregunta y examen_respuesta de SQLite).
  - simulacionProyectoFrontend (HTML/CSS/JS estático)
    - js/base.js define API_BASE_URL=http://localhost:8000 y gestiona sesión (cookies) contra el backend; páginas consumen user_info, get_exam_questions, etc.
    - Se espera servir el frontend en http://localhost:5500 (coincide con CORS/CSRF confiados en settings.py).

## Comandos comunes

- Preparación de entorno backend (Python + dependencias):

```pwsh path=null start=null
# Desde la raíz del repo
cd backend-examen-ingles
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

- Migraciones y superusuario (SQLite por defecto):

```pwsh path=null start=null
cd backend-examen-ingles
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

- Ejecutar el servidor de desarrollo Django (puerto 8000):

```pwsh path=null start=null
cd backend-examen-ingles
python manage.py runserver 0.0.0.0:8000
```

- Ejecutar con Docker (solo backend, puerto 8000 expuesto):

```pwsh path=null start=null
cd backend-examen-ingles
docker compose -f docker-compose.yaml up --build
```

- Servir el frontend estático en 5500 (compatible con CORS/CSRF configurado):

```pwsh path=null start=null
# Desde la raíz del repo o equivalente
python -m http.server 5500 --directory simulacionProyectoFrontend
# Luego abre http://localhost:5500/index.html
```

- Poblar la base con preguntas/respuestas (requiere sqlite3 en PATH):

```pwsh path=null start=null
cd backend-examen-ingles
# Asegúrate de haber corrido migrate (crea db.sqlite3)
sqlite3 .\db.sqlite3 ".read .\data\questions.sql"
sqlite3 .\db.sqlite3 ".read .\data\answers.sql"
```

- Tests (Django):

```pwsh path=null start=null
cd backend-examen-ingles
python manage.py test            # Ejecuta toda la suite
python manage.py test examen     # Ejecuta solo la app examen
# Prueba única (clase/método):
python manage.py test examen.tests:MyTestCase.test_algo
```

## Notas operativas relevantes

- CORS/CSRF en backend permite http://localhost:5500; sirve el frontend en ese puerto para evitar problemas de cookies.
- El archivo backend-examen-ingles/.env debe definir DJANGO_SECRET_KEY (ya existe en el repo); settings.py lo carga con python-dotenv.
- API documentada en backend-examen-ingles/docs/api_usage.md (también hay una copia en simulacionProyectoFrontend/api_usage.md).
