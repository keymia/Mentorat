from django.db import migrations


def creer_roles_et_niveaux(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    NiveauAcademique = apps.get_model("users", "NiveauAcademique")

    roles = [
        ("ADMIN_PRINCIPAL", "Acces complet a la plateforme."),
        ("ADMIN_OPERATIONNEL", "Gestion operationnelle sans creation d'administrateur."),
        ("MENTOR", "Utilisateur mentor."),
        ("MENTORE", "Utilisateur mentore."),
    ]
    for nom, description in roles:
        Role.objects.update_or_create(nom=nom, defaults={"description": description})

    niveaux = [
        ("12e annee", 1, True, False),
        ("Niveau 1", 2, False, False),
        ("Niveau 2", 3, False, False),
        ("Niveau 3", 4, False, False),
        ("Niveau 4", 5, False, True),
    ]
    for nom, ordre_niveau, est_premier_niveau, est_dernier_niveau in niveaux:
        NiveauAcademique.objects.update_or_create(
            ordre_niveau=ordre_niveau,
            defaults={
                "nom": nom,
                "est_premier_niveau": est_premier_niveau,
                "est_dernier_niveau": est_dernier_niveau,
            },
        )


def supprimer_roles_et_niveaux(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    NiveauAcademique = apps.get_model("users", "NiveauAcademique")
    Role.objects.filter(
        nom__in=["ADMIN_PRINCIPAL", "ADMIN_OPERATIONNEL", "MENTOR", "MENTORE"]
    ).delete()
    NiveauAcademique.objects.filter(ordre_niveau__in=[1, 2, 3, 4, 5]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(creer_roles_et_niveaux, supprimer_roles_et_niveaux),
    ]
