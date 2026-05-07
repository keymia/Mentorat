from django.db import migrations


def creer_parametres(apps, schema_editor):
    ParametreSysteme = apps.get_model("parametres", "ParametreSysteme")
    ParametreSysteme.objects.update_or_create(
        cle="MAX_MENTORES_PAR_MENTOR",
        defaults={
            "valeur": "5",
            "description": "Limite maximale globale de mentores par mentor.",
        },
    )


def supprimer_parametres(apps, schema_editor):
    ParametreSysteme = apps.get_model("parametres", "ParametreSysteme")
    ParametreSysteme.objects.filter(cle="MAX_MENTORES_PAR_MENTOR").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("parametres", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(creer_parametres, supprimer_parametres),
    ]
