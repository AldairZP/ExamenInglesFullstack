from django.urls import path
from .views import (
    get_csrf_token,
    register_user,
    login_user,
    logout_user,
    get_exam_questions,
    get_questions_answers,
    update_exam_answer,
    get_info_user,
    info_all_exams_user,
    info_exam_user,
    avaible_exams,
    get_exam_result,
    get_exam_history,
)

urlpatterns = [
    path("register/", register_user, name="register_user"),
    path("login/", login_user, name="login_user"),
    path("logout/", logout_user, name="logout_user"),
    path("csrf/", get_csrf_token, name="get_csrf_token"),
    path("get_exam_questions/", get_exam_questions, name="get_exam_questions"),
    path("get_questions_answers/", get_questions_answers, name="get_questions_answers"),
    path("update_exam_answer/", update_exam_answer, name="patch_answer"),
    path("user_info/", get_info_user, name="get_info_user"),
    path("user_exams/", info_all_exams_user, name="info_all_exams_user"),
    path("exam_info/", info_exam_user, name="info_exam_user"),
    path("available_exams/", avaible_exams, name="avaible_exams"),
    path("exam_result/", get_exam_result, name="get_exam_result"),
    path("exam_history/", get_exam_history, name="get_exam_history"),
]
