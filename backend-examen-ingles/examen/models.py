from django.db import models
from django.contrib.auth.models import AbstractUser
from enum import Enum
import random


class TipoExamen(Enum):
    FINAL = True
    PRUEBA = False
    NUMERO_PREGUNTAS_FINAL = 40
    NUMERO_PREGUNTAS_PRUEBA = 20
    NUMERO_INTENTOS_FINAL = 2
    NUMERO_INTENTOS_PRUEBA = 5


class Nivel(Enum):
    APROBADO = "Aprobado"
    REPROBADO = "Reprobado"
    NIVEL_BASICO = "Basico"
    NIVEL_INTERMEDIO = "Intermedio"
    NIVEL_AVANZADO = "Avanzado"


# Create your models here.
class Usuario(AbstractUser):
    matricula = models.IntegerField(unique=True)
    nombre = models.CharField(max_length=30)
    paterno = models.CharField(max_length=30)
    materno = models.CharField(max_length=30)
    foto_perfil = models.URLField(null=True)


class Examen(models.Model):
    id = models.AutoField(primary_key=True)
    fecha = models.DateTimeField(auto_now_add=True)
    calificacion = models.FloatField(default=0.0)
    nivel = models.CharField(max_length=10, null=True)
    tipo_examen = models.BooleanField()

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True)


class Pregunta(models.Model):
    id = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    imagen = models.URLField(null=True)


class Respuesta(models.Model):
    id = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    correcta = models.BooleanField()

    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)


class ExamenPregunta(models.Model):
    tiempo_inicio = models.DateTimeField(null=True)
    tiempo_fin = models.DateTimeField(null=True)
    respuesta = models.ForeignKey(Respuesta, on_delete=models.CASCADE, null=True)

    examen = models.ForeignKey(Examen, on_delete=models.CASCADE)
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
