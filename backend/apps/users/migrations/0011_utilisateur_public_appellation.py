# Generated manually for the public administrator display profile.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0010_utilisateur_approved_public_description_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="utilisateur",
            name="approved_public_appellation",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Dr", "Dr"),
                    ("Dre", "Dre"),
                    ("M.", "M."),
                    ("Mme", "Mme"),
                    ("Pr", "Pr"),
                    ("Pre", "Pre"),
                ],
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="utilisateur",
            name="public_appellation",
            field=models.CharField(
                blank=True,
                choices=[
                    ("Dr", "Dr"),
                    ("Dre", "Dre"),
                    ("M.", "M."),
                    ("Mme", "Mme"),
                    ("Pr", "Pr"),
                    ("Pre", "Pre"),
                ],
                max_length=10,
            ),
        ),
    ]
