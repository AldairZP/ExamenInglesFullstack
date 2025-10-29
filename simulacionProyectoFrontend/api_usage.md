# Documentación de la API de Exámenes

Esta documentación detalla cómo utilizar la API para la plataforma de exámenes, describiendo todos los endpoints disponibles, sus requisitos y respuestas.

## Índice
1. [Autenticación](#autenticación)
2. [Usuario](#usuario)
3. [Exámenes](#exámenes)
4. [Preguntas y Respuestas](#preguntas-y-respuestas)

## Autenticación

### Obtener Token CSRF
- **URL**: `/csrf/`
- **Método**: GET
- **Respuesta**: 
  ```json
  {
    "csrfToken": "token_value"
  }
  ```
- **Descripción**: Use este token en los encabezados de solicitudes que modifiquen datos (POST, PATCH, etc.)

### Registro de Usuario
- **URL**: `/register/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "matricula": "123456789",
    "nombre": "Nombre",
    "paterno": "Apellido Paterno",
    "materno": "Apellido Materno",
    "email": "usuario@ejemplo.com",
    "contraseña": "contraseña_segura",
    "username": "nombre_usuario"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "message": "User registered successfully."
  }
  ```
- **Códigos de error**:
  - 400: Datos inválidos o usuario ya existente

### Iniciar Sesión
- **URL**: `/login/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "email": "usuario@ejemplo.com",
    "contraseña": "contraseña_segura"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "message": "Login successful."
  }
  ```
- **Códigos de error**:
  - 400: Email o contraseña inválidos

### Cerrar Sesión
- **URL**: `/logout/`
- **Método**: GET
- **Respuesta exitosa**:
  ```json
  {
    "message": "Logout successful."
  }
  ```

## Usuario

### Obtener Información del Usuario
- **URL**: `/user_info/`
- **Método**: GET
- **Respuesta exitosa**:
  ```json
  {
    "matricula": "123456789",
    "nombre": "Nombre",
    "paterno": "Apellido Paterno",
    "materno": "Apellido Materno",
    "email": "usuario@ejemplo.com",
    "username": "nombre_usuario"
  }
  ```
- **Códigos de error**:
  - 401: Usuario no autenticado

## Exámenes

### Obtener Todos los Exámenes del Usuario
- **URL**: `/user_exams/`
- **Método**: GET
- **Respuesta exitosa**:
  ```json
  {
    "examenes": [
      {
        "id": 1,
        "tipo_examen": "prueba",
        "calificacion": 85.0,
        "nivel": "intermedio",
        "fecha": "2023-01-01T12:00:00Z",
        "aprobado": "Aprobado"
      },
      // ... otros exámenes
    ]
  }
  ```
- **Códigos de error**:
  - 401: Usuario no autenticado

### Obtener Información de un Examen Específico
- **URL**: `/exam_info/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "examen": 1
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "calificacion": 85.0,
    "nivel": "intermedio",
    "tipo_examen": "prueba",
    "aprobado": true
  }
  ```
- **Códigos de error**:
  - 400: ID de examen inexistente o no proporcionado
  - 401: Usuario no autenticado

### Obtener Exámenes Disponibles
- **URL**: `/available_exams/`
- **Método**: GET
- **Respuesta exitosa**:
  ```json
  {
    "avaible_exams_prueba": 3,
    "avaible_exams_final": 1
  }
  ```
- **Códigos de error**:
  - 401: Usuario no autenticado

### Obtener Resultado de un Examen
- **URL**: `/exam_result/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "examen": 1
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "examen": {
      "tipo_examen": "prueba",
      "calificacion": 85.0,
      "nivel": "intermedio",
      "fecha": "2023-01-01T12:00:00Z",
      "aprobado": true
    }
  }
  ```
- **Códigos de error**:
  - 400: ID de examen inexistente o no proporcionado
  - 401: Usuario no autenticado

### Crear Nuevo Examen
- **URL**: `/get_exam_questions/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "tipo_examen": "prueba" // o "final"
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "examen": 1,
    "preguntas": [101, 102, 103, 104, 105] // IDs de las preguntas
  }
  ```
- **Códigos de error**:
  - 400: Tipo de examen inválido o límite de exámenes alcanzado
  - 401: Usuario no autenticado

### Obtener Historial de un Examen
- **URL**: `/exam_history/`
- **Método**: POST
- **Datos requeridos**:
  ```json
  {
    "examen": 1
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "examen": {
      "id": 1,
      "tipo_examen": "prueba",
      "calificacion": 85.0,
      "nivel": "intermedio",
      "fecha": "2023-01-01T12:00:00Z",
      "aprobado": true
    },
    "historial": [
      {
        "pregunta": {
          "id": 101,
          "descripcion": "¿Cuál es la pregunta?"
        },
        "opciones_respuesta": [
          {"id": 201, "descripcion": "Opción A", "correcta": false},
          {"id": 202, "descripcion": "Opción B", "correcta": true},
          {"id": 203, "descripcion": "Opción C", "correcta": false},
          {"id": 204, "descripcion": "Opción D", "correcta": false}
        ],
        "respuesta_usuario": {
          "id": 202,
          "descripcion": "Opción B",
          "correcta": true
        },
        "respuesta_correcta": {
          "id": 202,
          "descripcion": "Opción B",
          "correcta": true
        },
        "es_correcta": true,
        "tiempo_inicio": "2023-01-01T12:00:00Z",
        "tiempo_fin": "2023-01-01T12:00:30Z",
        "tiempo_respuesta": 30.0
      }
    ],
    "resumen": {
      "total_preguntas": 20,
      "respuestas_correctas": 17,
      "respuestas_incorrectas": 2,
      "sin_responder": 1
    }
  }
  ```
- **Códigos de error**:
  - 400: ID de examen inexistente o no proporcionado
  - 401: Usuario no autenticado
- **Descripción**: Obtiene el historial completo de un examen con todas las preguntas, respuestas del usuario, respuestas correctas y tiempos de respuesta

## Preguntas y Respuestas

### Obtener Pregunta y Sus Respuestas
- **URL**: `/get_questions_answers/`
- **Método**: PATCH
- **Datos requeridos**:
  ```json
  {
    "examen": 1,
    "pregunta": 101
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "pregunta": {
      "id": 101,
      "descripcion": "¿Cuál es la pregunta?",
      "imagen": "http://ejemplo.com/imagen.jpg",
      "respuestas": [
        {"id": 201, "descripcion": "Respuesta A"},
        {"id": 202, "descripcion": "Respuesta B"},
        {"id": 203, "descripcion": "Respuesta C"},
        {"id": 204, "descripcion": "Respuesta D"}
      ]
    }
  }
  ```
- **Códigos de error**:
  - 400: Pregunta o examen inválidos, o pregunta ya respondida
  - 401: Usuario no autenticado

### Actualizar Respuesta a una Pregunta
- **URL**: `/update_exam_answer/`
- **Método**: PATCH
- **Datos requeridos**:
  ```json
  {
    "examen": 1,
    "pregunta": 101,
    "respuesta": 201
  }
  ```
- **Respuesta exitosa**:
  ```json
  {
    "message": "Answer saved successfully."
  }
  ```
- **Códigos de error**:
  - 400: Datos faltantes, pregunta ya respondida, o tiempo límite excedido
  - 401: Usuario no autenticado

## Notas Importantes

1. Todos los endpoints requieren autenticación excepto `/register/`, `/login/` y `/csrf/`.
2. Para exámenes tipo "prueba", se permiten hasta 20 intentos con 20 preguntas cada uno.
3. Para exámenes tipo "final", se permiten hasta 3 intentos con 40 preguntas cada uno.
4. El tiempo límite para responder cada pregunta es de 65 segundos.
5. La calificación mínima para aprobar un examen es 70.
6. **Las imágenes de las preguntas se incluyen automáticamente** en las respuestas de los endpoints `/get_questions_answers/` y `/exam_history/` cuando la pregunta tiene una imagen asociada.
7. El campo `imagen` puede ser `null` si la pregunta no tiene imagen asociada.
