from django.contrib.auth.hashers import make_password
from django.db import migrations


DEFAULT_PASSWORD = "mentor123"


def set_default_mentorat_password(apps, schema_editor):
    Utilisateur = apps.get_model("users", "Utilisateur")
    Utilisateur.objects.filter(
        profil_mentorat__in=["MENTOR", "MENTORE", "MENTOR_ET_MENTORE"]
    ).update(password=make_password(DEFAULT_PASSWORD))


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_seed_roles_niveaux"),
    ]

    operations = [
        migrations.RunPython(set_default_mentorat_password, migrations.RunPython.noop),
    ]
