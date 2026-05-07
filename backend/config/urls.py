from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

schema_view = get_schema_view(
    openapi.Info(
        title="Mentorat API",
        default_version="v1",
        description="API REST de la plateforme Mentorat.",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.inscriptions.urls")),
    path("api/", include("apps.mentorat.urls")),
    path("api/", include("apps.evenements.urls")),
    path("api/", include("apps.partenaires.urls")),
    path("api/", include("apps.emails.urls")),
    path("api/", include("apps.parametres.urls")),
    path("api/", include("apps.statistiques.urls")),
    path("api/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
