from django.db import migrations


LEVELS = [
    (1, "Je suis au secondaire", True, False),
    (2, "Je suis etudiant(e) au college ou en 1ere / 2e annee de baccalaureat", False, False),
    (3, "Je suis etudiant(e) en 3e / 4e annee de baccalaureat ou a la maitrise", False, False),
    (4, "Je suis etudiant(e) en medecine", False, True),
]


def appliquer_nouveaux_niveaux(apps, schema_editor):
    NiveauAcademique = apps.get_model("users", "NiveauAcademique")
    for ordre_niveau, nom, est_premier_niveau, est_dernier_niveau in LEVELS:
        NiveauAcademique.objects.update_or_create(
            ordre_niveau=ordre_niveau,
            defaults={
                "nom": nom,
                "est_premier_niveau": est_premier_niveau,
                "est_dernier_niveau": est_dernier_niveau,
            },
        )


def restaurer_niveaux_initiaux(apps, schema_editor):
    NiveauAcademique = apps.get_model("users", "NiveauAcademique")
    niveaux = [
        ("12e annee", 1, True, False),
        ("Niveau 1", 2, False, False),
        ("Niveau 2", 3, False, False),
        ("Niveau 3", 4, False, False),
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


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0004_utilisateur_domaine_specialite_and_more"),
    ]

    operations = [
        migrations.RunPython(appliquer_nouveaux_niveaux, restaurer_niveaux_initiaux),
    ]
