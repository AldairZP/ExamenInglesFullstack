import json
import random

from django.http import JsonResponse
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.middleware.csrf import get_token
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_exempt

from .models import Pregunta, Respuesta, Examen, TipoExamen, ExamenPregunta, Nivel

User = get_user_model()
Pregunta_ids = list(Pregunta.objects.values_list("id", flat=True))


@csrf_exempt
def get_info_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)
    user = request.user
    return JsonResponse(
        {
            "matricula": user.matricula,
            "nombre": user.nombre,
            "paterno": user.paterno,
            "materno": user.materno,
            "email": user.email,
            "username": user.username,
        },
        status=200,
    )


@csrf_exempt
def info_all_exams_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    user = request.user
    examenes = Examen.objects.filter(usuario=user)

    datos_examenes = []

    for examen in examenes:
        # Si no tiene nivel, asignar según calificación
        if examen.nivel is None:
            if examen.calificacion >= 90:
                examen.nivel = Nivel.NIVEL_AVANZADO.value
            elif examen.calificacion >= 70:
                examen.nivel = Nivel.NIVEL_INTERMEDIO.value
            else:
                examen.nivel = Nivel.NIVEL_BASICO.value
            examen.save()

        datos_examenes.append(
            {
                "id": examen.id,
                "tipo_examen": examen.tipo_examen,
                "calificacion": examen.calificacion,
                "nivel": examen.nivel,
                "fecha": examen.fecha,
                "aprobado": examen.calificacion >= 70,
            }
        )

    return JsonResponse({"examenes": datos_examenes}, status=200)


@csrf_exempt
def info_exam_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)
    data = json.loads(request.body)
    examen_id = data.get("examen", None)
    if examen_id is None:
        return JsonResponse({"error": "Examen is required."}, status=400)
    if not Examen.objects.filter(usuario=request.user, id=examen_id).exists():
        return JsonResponse({"error": "Examen does not exist."}, status=400)
    examen = Examen.objects.get(usuario=request.user, id=examen_id)
    aprobado = examen.calificacion >= 70
    if examen.nivel is None:
        if examen.calificacion >= 90:
            examen.nivel = Nivel.NIVEL_AVANZADO.value
        elif examen.calificacion >= 70:
            examen.nivel = Nivel.NIVEL_INTERMEDIO.value
        else:
            examen.nivel = Nivel.NIVEL_BASICO.value
        examen.save()
    return JsonResponse(
        {
            "calificacion": examen.calificacion,
            "nivel": examen.nivel,
            "tipo_examen": examen.tipo_examen,
            "aprobado": aprobado,
        },
        status=200,
    )


@csrf_exempt
def avaible_exams(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)
    exmen_final_count = (
        TipoExamen.NUMERO_INTENTOS_FINAL.value
        - Examen.objects.filter(
            usuario=request.user, tipo_examen=TipoExamen.FINAL.value
        ).count()
    )
    exmen_prueba_count = (
        TipoExamen.NUMERO_INTENTOS_PRUEBA.value
        - Examen.objects.filter(
            usuario=request.user, tipo_examen=TipoExamen.PRUEBA.value
        ).count()
    )
    return JsonResponse(
        {
            "avaible_exams_prueba": exmen_prueba_count,
            "avaible_exams_final": exmen_final_count,
        },
        status=200,
    )


@csrf_exempt
def get_exam_result(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    data = json.loads(request.body)
    user = request.user
    examen_id = data.get("examen", None)
    if examen_id is None:
        return JsonResponse({"error": "Examen is required."}, status=400)
    if not Examen.objects.filter(usuario=user, id=examen_id).exists():
        return JsonResponse({"error": "Examen does not exist."}, status=400)
    examen = Examen.objects.get(usuario=user, id=examen_id)
    aprobado = examen.calificacion >= 70
    return JsonResponse(
        {
            "examen": {
                "tipo_examen": examen.tipo_examen,
                "calificacion": examen.calificacion,
                "nivel": examen.nivel,
                "fecha": examen.fecha,
                "aprobado": aprobado,
            }
        },
        status=200,
    )


@csrf_exempt
def update_exam_answer(request):
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH request required."}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    data = json.loads(request.body)
    examen_id = data.get("examen", None)
    pregunta_id = data.get("pregunta", None)
    respuesta_id = data.get("respuesta", None)
    user = request.user

    if respuesta_id is None or pregunta_id is None or examen_id is None:
        return JsonResponse(
            {"error": "Examen, Pregunta and Respuesta are required."}, status=400
        )

    if not ExamenPregunta.objects.filter(
        examen__usuario=user, examen=examen_id, pregunta=pregunta_id
    ).exists():
        return JsonResponse({"error": "examen or pregunta does not exist."}, status=400)

    examen_pregunta = ExamenPregunta.objects.get(examen=examen_id, pregunta=pregunta_id)

    if examen_pregunta.tiempo_fin is not None:
        return JsonResponse(
            {"error": "The question has already been answered."}, status=400
        )

    examen_pregunta.tiempo_fin = now()
    examen_pregunta.respuesta_id = respuesta_id  # Guardar la respuesta seleccionada
    examen_pregunta.save()

    duracion = examen_pregunta.tiempo_fin - examen_pregunta.tiempo_inicio

    if duracion.total_seconds() > 65:
        return JsonResponse({"error": "Time limit exceeded."}, status=400)

    respuesta = Respuesta.objects.get(id=respuesta_id)
    examen = Examen.objects.get(id=examen_id)

    if respuesta.correcta:
        if examen.tipo_examen == TipoExamen.FINAL.value:
            examen.calificacion += 2.5
        else:
            examen.calificacion += 5.0
        examen.save()

    preguntas_restantes = ExamenPregunta.objects.filter(
        examen=examen_id, tiempo_fin__isnull=True
    ).count()

    if preguntas_restantes == 0:
        if examen.calificacion >= 90:
            examen.nivel = Nivel.NIVEL_AVANZADO.value
        elif examen.calificacion >= 70:
            examen.nivel = Nivel.NIVEL_INTERMEDIO.value
        else:
            examen.nivel = Nivel.NIVEL_BASICO.value
        examen.save()  # Guardar el cambio de nivel

    return JsonResponse({"message": "Answer saved successfully."}, status=200)


@csrf_exempt
def get_questions_answers(request):
    if request.method != "PATCH":
        return JsonResponse({"error": "PATCH request required."}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    data = json.loads(request.body)
    examen_id = data.get("examen", None)
    pregunta_id = data.get("pregunta", None)
    user = request.user

    if examen_id is None or pregunta_id is None:
        return JsonResponse({"error": "Examen and Pregunta are required."}, status=400)

    if not Examen.objects.filter(usuario=user, id=examen_id).exists():
        return JsonResponse({"error": "Examen does not exist."}, status=400)

    if not ExamenPregunta.objects.filter(
        pregunta=pregunta_id, examen=examen_id
    ).exists():
        return JsonResponse({"error": "Pregunta does not exist."}, status=400)

    examen_respuesta = ExamenPregunta.objects.get(
        examen=examen_id, pregunta=pregunta_id
    )

    if examen_respuesta.tiempo_inicio is not None:
        return JsonResponse({"error": "Pregunta already answered."}, status=400)

    pregunta = Pregunta.objects.get(id=pregunta_id)
    respuestas = Respuesta.objects.filter(pregunta=pregunta_id).values(
        "id", "descripcion"
    )
    respuestas = list(respuestas)

    examen_respuesta = ExamenPregunta.objects.get(
        examen=examen_id, pregunta=pregunta_id
    )
    examen_respuesta.tiempo_inicio = now()
    examen_respuesta.save()

    return JsonResponse(
        {
            "pregunta": {
                "id": pregunta_id,
                "descripcion": pregunta.descripcion,
                "imagen": pregunta.imagen,
                "respuestas": respuestas,
            }
        }
    )


@csrf_exempt
def get_exam_questions(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    data = json.loads(request.body)
    tipo_examen = data.get("tipo_examen", None)

    if tipo_examen not in ["prueba", "final"]:
        return JsonResponse({"error": "Invalid exam type."}, status=400)

    usuario = request.user

    if tipo_examen == "final":
        tipo_examen = TipoExamen.FINAL.value
        numero_examenes = Examen.objects.filter(
            usuario=usuario, tipo_examen=TipoExamen.FINAL.value
        ).count()
        if numero_examenes >= TipoExamen.NUMERO_INTENTOS_FINAL.value:
            return JsonResponse(
                {"error": "You have already taken the maximum number of final exams."},
                status=400,
            )
    if tipo_examen == "prueba":
        tipo_examen = TipoExamen.PRUEBA.value
        numero_examenes = Examen.objects.filter(
            usuario=usuario, tipo_examen=TipoExamen.PRUEBA.value
        ).count()
        if numero_examenes >= TipoExamen.NUMERO_INTENTOS_PRUEBA.value:
            return JsonResponse(
                {"error": "You have already taken the maximum number of prueba exams."},
                status=400,
            )

    if tipo_examen == TipoExamen.FINAL.value:
        random_preguntas_id = random.sample(
            Pregunta_ids, TipoExamen.NUMERO_PREGUNTAS_FINAL.value
        )
    else:
        random_preguntas_id = random.sample(
            Pregunta_ids, TipoExamen.NUMERO_PREGUNTAS_PRUEBA.value
        )

    preguntas = Pregunta.objects.filter(id__in=random_preguntas_id)
    examen = Examen.objects.create(usuario=usuario, tipo_examen=tipo_examen)

    for pregunta in preguntas:
        ExamenPregunta.objects.create(examen=examen, pregunta=pregunta)

    preguntas_id = list(preguntas.values_list("id", flat=True))
    examen_id = examen.id
    return JsonResponse({"examen": examen_id, "preguntas": preguntas_id})


@csrf_exempt
def get_csrf_token(request):
    token = get_token(request)
    print(token)
    return JsonResponse({"csrfToken": token})


@csrf_exempt
def register_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    required_fields = [
        "matricula",
        "nombre",
        "paterno",
        "materno",
        "email",
        "contraseña",
        "username",
    ]
    try:
        verify = [
            field
            for field in required_fields
            if field not in data or data[field] is None or data[field] == ""
        ]
    except Exception as e:
        return JsonResponse({"error": "Invalid data."}, status=400)
    if verify:
        return JsonResponse({"error": "All fields are required."}, status=400)

    if User.objects.filter(username=data.get("username")).exists():
        return JsonResponse({"error": "Username already exists."}, status=400)

    if User.objects.filter(matricula=data.get("matricula")).exists():
        return JsonResponse({"error": "Matricula already exists."}, status=400)

    if User.objects.filter(email=data.get("email")).exists():
        return JsonResponse({"error": "Email already exists."}, status=400)

    try:
        user = User.objects.create_user(
            username=data.get("username"),
            email=data.get("email"),
            password=data.get("contraseña"),
            matricula=data.get("matricula"),
            nombre=data.get("nombre"),
            paterno=data.get("paterno"),
            materno=data.get("materno"),
        )
        login(request, user)
        return JsonResponse({"message": "User registered successfully."}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
def login_user(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    data = json.loads(request.body)
    email = data.get("email", None)
    password = data.get("contraseña", None)

    if email is None or password is None:
        return JsonResponse({"error": "Email and password are required."}, status=400)

    try:
        username = User.objects.get(email=email).username
    except User.DoesNotExist:
        return JsonResponse({"error": "Email does not exist."}, status=400)

    # Intenta autenticar con el username obtenido
    user = authenticate(request, username=username, password=password)

    if user is None:
        return JsonResponse({"error": "Invalid email or password."}, status=400)
    else:
        login(request, user)
        return JsonResponse({"message": "Login successful."}, status=200)


@csrf_exempt
def get_exam_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "User not authenticated."}, status=401)

    data = json.loads(request.body)
    examen_id = data.get("examen", None)

    if examen_id is None:
        return JsonResponse({"error": "Examen is required."}, status=400)

    examen = Examen.objects.get(id=examen_id, usuario=request.user)
    examen_preguntas = ExamenPregunta.objects.filter(examen=examen_id).select_related(
        "pregunta", "respuesta"
    )

    historial = []

    for ep in examen_preguntas:
        pregunta = ep.pregunta
        opciones_respuesta = list(
            Respuesta.objects.filter(pregunta=pregunta.id).values(
                "id", "descripcion", "correcta"
            )
        )
        respuesta_correcta = next(
            (r for r in opciones_respuesta if r["correcta"]), None
        )

        respuesta_usuario = None
        if ep.respuesta:
            respuesta_usuario = {
                "id": ep.respuesta.id,
                "descripcion": ep.respuesta.descripcion,
                "correcta": ep.respuesta.correcta,
            }

        es_correcta = (
            respuesta_usuario and respuesta_usuario["correcta"]
            if respuesta_usuario
            else False
        )

        historial.append(
            {
                "pregunta": {"id": pregunta.id, "descripcion": pregunta.descripcion},
                "opciones_respuesta": opciones_respuesta,
                "respuesta_usuario": respuesta_usuario,
                "respuesta_correcta": respuesta_correcta,
                "es_correcta": es_correcta,
                "tiempo_inicio": ep.tiempo_inicio,
                "tiempo_fin": ep.tiempo_fin,
                "tiempo_respuesta": (
                    (ep.tiempo_fin - ep.tiempo_inicio).total_seconds()
                    if ep.tiempo_inicio and ep.tiempo_fin
                    else None
                ),
            }
        )

    examen_info = {
        "id": examen.id,
        "tipo_examen": (
            "final" if examen.tipo_examen == TipoExamen.FINAL.value else "prueba"
        ),
        "calificacion": examen.calificacion,
        "nivel": examen.nivel,
        "fecha": examen.fecha,
        "aprobado": examen.calificacion >= 70,
    }

    return JsonResponse(
        {
            "examen": examen_info,
            "historial": historial,
            "resumen": {
                "total_preguntas": len(historial),
                "respuestas_correctas": sum(1 for h in historial if h["es_correcta"]),
                "respuestas_incorrectas": sum(
                    1
                    for h in historial
                    if h["respuesta_usuario"] and not h["es_correcta"]
                ),
                "sin_responder": sum(
                    1 for h in historial if not h["respuesta_usuario"]
                ),
            },
        },
        status=200,
    )


def logout_user(request):
    logout(request)
    return JsonResponse({"message": "Logout successful."}, status=200)
